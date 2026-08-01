import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { User } from "../models/User";
import { Channel } from "../models/Channel";
import { Entry } from "../models/Entry";

const app = createApp();
const PASSWORD = "CorrectHorse#9";

async function makeUser(alias: string, role: "guest" | "verified" | "operative" | "sysadmin") {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return User.create({ alias, email: `${alias}@test.dev`, passwordHash, role });
}

async function login(agent: request.SuperAgentTest, email: string) {
  const res = await agent.post("/api/auth/login").send({ email, password: PASSWORD });
  return res;
}

describe("registration & login", () => {
  it("registers a new user and returns a session cookie", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ alias: "newbie1", email: "newbie1@test.dev", password: "StrongPass1234" });
    expect(res.status).toBe(201);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects login with wrong password without revealing account existence", async () => {
    await makeUser("realuser", "guest");
    const res = await request(app).post("/api/auth/login").send({ email: "realuser@test.dev", password: "wrong" });
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "doesnotexist@test.dev", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res2.status).toBe(401);
    expect(res.body.error).toBe(res2.body.error);
  });

  it("locks the account after repeated failed attempts", async () => {
    await makeUser("lockme", "guest");
    const agent = request.agent(app);
    for (let i = 0; i < 5; i += 1) {
      await agent.post("/api/auth/login").send({ email: "lockme@test.dev", password: "wrong" });
    }
    const res = await agent.post("/api/auth/login").send({ email: "lockme@test.dev", password: PASSWORD });
    expect(res.status).toBe(423);
  });
});

describe("clearance-gated entries never leak", () => {
  it("does not include restricted entry content in a guest's channel listing", async () => {
    const guest = await makeUser("guestleak", "guest");
    const operative = await makeUser("opleak", "operative");
    const channel = await Channel.create({
      slug: "leak-test",
      name: "Leak Test",
      requiredClearance: "guest",
      requiredClearanceToPost: "operative",
    });
    const secretEntry = await Entry.create({
      channel: channel._id,
      author: operative._id,
      title: "TOP SECRET TITLE",
      body: "TOP SECRET BODY",
      requiredClearance: "operative",
    });

    const agent = request.agent(app);
    await login(agent, "guestleak@test.dev");
    const res = await agent.get(`/api/entries/channel/${channel._id.toString()}`);

    expect(res.status).toBe(200);
    const bodies = JSON.stringify(res.body);
    expect(bodies).not.toContain("TOP SECRET TITLE");
    expect(bodies).not.toContain("TOP SECRET BODY");
    expect(bodies).not.toContain(secretEntry._id.toString());
  });

  it("returns only a redacted placeholder when fetching a restricted entry directly by id", async () => {
    await makeUser("directfetch", "guest");
    const operative = await makeUser("opdirect", "operative");
    const channel = await Channel.create({
      slug: "direct-test",
      name: "Direct Test",
      requiredClearance: "guest",
      requiredClearanceToPost: "operative",
    });
    const secretEntry = await Entry.create({
      channel: channel._id,
      author: operative._id,
      title: "DIRECT SECRET",
      body: "DIRECT SECRET BODY",
      requiredClearance: "operative",
    });

    const agent = request.agent(app);
    await login(agent, "directfetch@test.dev");
    const res = await agent.get(`/api/entries/${secretEntry._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.entry.locked).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain("DIRECT SECRET");
  });

  it("blocks a guest from the sysadmin console entirely", async () => {
    await makeUser("guestadmin", "guest");
    const agent = request.agent(app);
    await login(agent, "guestadmin@test.dev");
    const res = await agent.get("/api/admin/users");
    expect(res.status).toBe(404);
  });
});

describe("privilege escalation resistance", () => {
  it("cannot change own role via a crafted request field", async () => {
    const user = await makeUser("selfpromote", "guest");
    const agent = request.agent(app);
    await login(agent, "selfpromote@test.dev");

    // Attempt to smuggle a role change through an unrelated authenticated route.
    await agent.get("/api/auth/me").send({ role: "sysadmin" });
    const check = await User.findById(user._id);
    expect(check?.role).toBe("guest");

    // The only role-change route is sysadmin-gated; a non-admin gets 404.
    const res = await agent.patch(`/api/admin/users/${user._id.toString()}/role`).send({ role: "sysadmin" });
    expect(res.status).toBe(404);
  });
});
