import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db";
import { User, UserDoc } from "./models/User";
import { Channel } from "./models/Channel";
import { Entry } from "./models/Entry";
import { ActivationCode } from "./models/ActivationCode";
import mongoose, { Types } from "mongoose";

const DEMO_PASSWORD = "NeonBreach#2026";

/** N days ago, with a little random jitter so timestamps don't look robotic. */
function daysAgo(n: number, hourJitter = 6): Date {
  const ms = n * 86_400_000 + (Math.random() - 0.5) * hourJitter * 3_600_000;
  return new Date(Date.now() - ms);
}

interface ReplySeed {
  author: Types.ObjectId;
  body: string;
  createdAt: Date;
}

function reply(author: UserDoc, body: string, createdAt: Date): ReplySeed {
  return { author: author._id, body, createdAt };
}

async function seed(): Promise<void> {
  await connectDB(process.env.MONGO_URI as string);
  console.log("[seed] wiping demo collections...");
  await Promise.all([
    User.deleteMany({}),
    Channel.deleteMany({}),
    Entry.deleteMany({}),
    ActivationCode.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // --- The four login-able demo accounts ---
  const [guest, verified, operative, sysadmin] = await Promise.all([
    User.create({ alias: "ghost_guest", email: "guest@blackroot.dev", passwordHash, role: "guest" }),
    User.create({ alias: "cipher_v", email: "verified@blackroot.dev", passwordHash, role: "verified" }),
    User.create({ alias: "raven_op", email: "operative@blackroot.dev", passwordHash, role: "operative" }),
    User.create({ alias: "root_admin", email: "sysadmin@blackroot.dev", passwordHash, role: "sysadmin" }),
  ]);

  // --- NPC cast — fills out replies so channels feel like real communities,
  // not four people talking to themselves. Not documented as login creds. ---
  const [wren, moth, ashgrid, ember, cinder, kilo, ferro, vex, lyric] = await Promise.all([
    User.create({ alias: "wren_delta", email: "wren@blackroot.dev", passwordHash, role: "verified" }),
    User.create({ alias: "static_moth", email: "moth@blackroot.dev", passwordHash, role: "verified" }),
    User.create({ alias: "ashgrid", email: "ashgrid@blackroot.dev", passwordHash, role: "verified" }),
    User.create({ alias: "ember_iv", email: "ember@blackroot.dev", passwordHash, role: "verified" }),
    User.create({ alias: "cinder_ok", email: "cinder@blackroot.dev", passwordHash, role: "verified" }),
    User.create({ alias: "kilo_vantage", email: "kilo@blackroot.dev", passwordHash, role: "operative" }),
    User.create({ alias: "null_ferro", email: "ferro@blackroot.dev", passwordHash, role: "operative" }),
    User.create({ alias: "vex_holloway", email: "vex@blackroot.dev", passwordHash, role: "operative" }),
    User.create({ alias: "lyric_9", email: "lyric@blackroot.dev", passwordHash, role: "sysadmin" }),
  ]);

  const [lobby, gridworks, blacksite, coreroot] = await Promise.all([
    Channel.create({
      slug: "lobby",
      name: "The Lobby",
      description: "Public signal. Anyone with a terminal can read here.",
      requiredClearance: "guest",
      requiredClearanceToPost: "verified",
    }),
    Channel.create({
      slug: "gridworks",
      name: "Gridworks",
      description: "Verified operators trading tools, techniques, and theories.",
      requiredClearance: "verified",
      requiredClearanceToPost: "verified",
    }),
    Channel.create({
      slug: "blacksite",
      name: "Blacksite Ops",
      description: "Operative-only channel. Do not discuss outside this room.",
      requiredClearance: "operative",
      requiredClearanceToPost: "operative",
    }),
    Channel.create({
      slug: "coreroot",
      name: "Coreroot",
      description: "Sysadmin internal channel.",
      requiredClearance: "sysadmin",
      requiredClearanceToPost: "sysadmin",
    }),
  ]);

  // ======================================================================
  // LOBBY — public. Includes the first, vaguest breadcrumb of an ongoing
  // network-wide story ("the Palisade anomaly") that pays off differently
  // depending on how deep your clearance goes.
  // ======================================================================
  await Entry.create([
    {
      channel: lobby._id,
      author: verified._id,
      title: "Welcome transmission — read this first",
      requiredClearance: "guest",
      pinned: true,
      createdAt: daysAgo(30),
      body:
        "If you're reading this, your uplink to BLACKROOT is live. A few things worth knowing before you do anything else. " +
        "First: clearance here isn't cosmetic. What you can see, post, and even know exists is tied to your tier, and that's " +
        "enforced the same way for every account on the network, including the people who run it. Second: getting past Guest " +
        "takes about ten minutes — read the Community Rules on the Verification page and accept them, and you're Verified " +
        "immediately. No queue, no waiting on a moderator to notice you exist. Third: this Lobby is the only channel every " +
        "account can read regardless of tier, so keep that in mind when you post here — assume anyone, at any clearance, " +
        "is reading. Welcome aboard. Ask questions if you have them; someone's usually around.",
      replies: [
        reply(wren, "Been lurking on Guest for a week, verifying today. See you all on the other side.", daysAgo(29, 10)),
        reply(cinder, "welcome — Gridworks is quieter than you'd think, in a good way", daysAgo(28, 4)),
        reply(guest, "just verified, hi everyone", daysAgo(2)),
      ],
    },
    {
      channel: lobby._id,
      author: sysadmin._id,
      title: "How clearance actually works here (read before asking)",
      requiredClearance: "guest",
      pinned: true,
      createdAt: daysAgo(27),
      body:
        "This gets asked constantly so it's getting pinned. There are four tiers: Guest, Verified, Operative, Sysadmin. " +
        "Guest to Verified is the only self-service change that exists — accept the rules, you're upgraded, done. " +
        "Verified to Operative is a judgment call made by a Sysadmin based on how you've actually participated, not a " +
        "point total or an activity streak. There is no form to fill out for it and asking for it directly in-thread " +
        "tends to have the opposite effect of what people hope. Operative to Sysadmin is rarer still and generally goes " +
        "to people already helping maintain the network in some capacity outside of just posting. Every single one of " +
        "those decisions, at every tier above Verified, gets written to a permanent audit log — timestamp, actor, target, " +
        "no exceptions, including for me. If you think a decision was made unfairly, that log is exactly how it gets checked.",
      replies: [
        reply(moth, "the 'asking tends to have the opposite effect' line is doing a lot of quiet work here lol", daysAgo(26, 3)),
        reply(sysadmin, "@static_moth accurate summary honestly", daysAgo(26, 1)),
      ],
    },
    {
      channel: lobby._id,
      author: cinder._id,
      title: "Advisory: intermittent relay instability, Sector 12",
      requiredClearance: "guest",
      createdAt: daysAgo(19),
      body:
        "Posting this publicly since a few people have asked about the lag spikes over the last few days. Network " +
        "engineering is aware of intermittent instability on one of our relay clusters (internally referred to as " +
        "Sector 12) and is investigating. No user action is needed on your end — this shouldn't affect posting, " +
        "reading, or authentication for Guest or Verified accounts. If you're on a higher clearance tier and have " +
        "relevant context, there's a more detailed thread in your channel. For everyone else: nothing to do here except " +
        "know that if things feel slightly slower for a few days, that's why.",
      replies: [
        reply(guest, "thought it was just my connection lol, good to know", daysAgo(18, 5)),
        reply(wren, "noticed it too, mostly on channel switches. glad it's being looked at", daysAgo(17, 8)),
      ],
    },
    {
      channel: lobby._id,
      author: wren._id,
      title: "Say hello — new member intros",
      requiredClearance: "guest",
      createdAt: daysAgo(24),
      body:
        "Rolling thread for new members to say hi. Handle, how you found BLACKROOT, whatever you want to share. " +
        "Keeps the Lobby from being 100% announcements and rules — we're a community that happens to also have an " +
        "access control system, not the other way around.",
      replies: [
        reply(ashgrid, "ashgrid here, verified about two months ago, mostly hang out in Gridworks talking about tooling", daysAgo(23, 6)),
        reply(ember, "ember_iv — found this place through a friend, been reading more than posting so far", daysAgo(21, 2)),
        reply(moth, "static_moth, been around since it was a much smaller network. good to see new faces", daysAgo(20, 9)),
        reply(guest, "ghost_guest, brand new, still figuring out where everything is", daysAgo(3)),
      ],
    },
    {
      channel: lobby._id,
      author: sysadmin._id,
      title: "Network digest — monthly roundup",
      requiredClearance: "guest",
      createdAt: daysAgo(9),
      body:
        "Quick public roundup of what's been happening network-wide this month, for anyone not deep in every channel. " +
        "Gridworks has had an active back-and-forth about tooling and a few good resource threads worth checking once " +
        "you're Verified. There's been some operational discussion in the higher-clearance channels around the Sector " +
        "12 relay instability mentioned earlier — that's being handled and doesn't require anything from Guest or " +
        "Verified members. Community intros thread is still open if you haven't said hello yet. That's the digest — " +
        "back to regular programming.",
      replies: [reply(kilo, "solid summary, appreciate these", daysAgo(8, 4))],
    },
  ]);

  // ======================================================================
  // GRIDWORKS — verified members. Real technical/community content, plus
  // the story continues: verified members start noticing the "instability"
  // doesn't look like ordinary infrastructure trouble.
  // ======================================================================
  await Entry.create([
    {
      channel: gridworks._id,
      author: operative._id,
      title: "Megathread: proxy rotation strategies that actually hold up",
      requiredClearance: "verified",
      pinned: true,
      createdAt: daysAgo(25),
      body:
        "Starting this because the topic comes up every few weeks and gets buried each time. Drop what's working for " +
        "you and what's fallen apart under load. I'll start: static rotation lists degrade fast once a range gets " +
        "flagged upstream, and most of the 'residential' pools people recommend are already saturated by scrapers. " +
        "What's actually held up for me is smaller, dedicated pools with longer per-session TTLs rather than aggressive " +
        "rotation — counterintuitive, but aggressive rotation is itself a fingerprint if the timing is regular.",
      replies: [
        reply(ashgrid, "the 'aggressive rotation is itself a fingerprint' point doesn't get said enough", daysAgo(24, 5)),
        reply(wren, "seconding smaller dedicated pools. jittered TTLs on top of that helped me even more", daysAgo(23, 2)),
        reply(cinder, "what's everyone using for health-checking a pool before rotating in? tired of dead nodes eating requests", daysAgo(22, 7)),
        reply(operative, "@cinder_ok simple TCP handshake timing check before anything else — cuts most of the dead weight cheaply", daysAgo(21, 3)),
      ],
    },
    {
      channel: gridworks._id,
      author: ashgrid._id,
      title: "RE: Sector 12 relay instability — this doesn't look like normal infra trouble",
      requiredClearance: "verified",
      createdAt: daysAgo(17),
      body:
        "Saw the advisory in the Lobby and wanted to dig a bit since the pattern felt off to me. Normal relay instability " +
        "is noisy and random — packet loss spread evenly, latency spikes correlated with load. What I'm seeing on Sector " +
        "12 is oddly rhythmic: brief, clean drops at fairly regular intervals, almost like something's polling or probing " +
        "rather than the relay just struggling under load. Could easily be nothing — automated health checks from our own " +
        "side could produce that signature. But if anyone else has been watching the same relay and has more data, I'd " +
        "like a second set of eyes before I sound like I'm reaching.",
      replies: [
        reply(wren, "not just you, I flagged something similar to a friend a few days ago and figured I was overthinking it", daysAgo(16, 4)),
        reply(moth, "regular intervals is the part that'd bother me too. any idea on the periodicity?", daysAgo(16, 1)),
        reply(ashgrid, "@static_moth rough eyeball, somewhere in the 40-45 minute range, not exact enough to be confident yet", daysAgo(15, 6)),
        reply(cinder, "if it's a real pattern someone with operative clearance should probably take a look at the relay logs directly", daysAgo(14, 8)),
        reply(operative, "noted — passing this up, appreciate the writeup", daysAgo(14, 2)),
      ],
    },
    {
      channel: gridworks._id,
      author: moth._id,
      title: "Show & tell: home lab / workstation setups",
      requiredClearance: "verified",
      createdAt: daysAgo(12),
      body:
        "Lighter thread to balance out the network-anomaly discourse. Post your setup, however modest or overbuilt. " +
        "I'll go first: repurposed mini-PC running a hypervisor for isolated testing environments, a second machine " +
        "purely for daily driving so the two never mix, and way too many monitors for someone who mostly reads text.",
      replies: [
        reply(ember, "single laptop, docked, boring but it works. someday I'll build the isolated setup everyone recommends", daysAgo(11, 3)),
        reply(wren, "three monitors is the correct number and I will not be taking questions", daysAgo(10, 5)),
        reply(cinder, "the isolated daily-driver split is worth doing sooner rather than later, learned that the hard way once", daysAgo(9, 7)),
      ],
    },
    {
      channel: gridworks._id,
      author: sysadmin._id,
      title: "Verified AMA — ask root_admin anything (within reason)",
      requiredClearance: "verified",
      createdAt: daysAgo(15),
      body:
        "Running an open Q&A for Verified members. Anything about how the network's run, how decisions get made, " +
        "history of BLACKROOT, whatever. I'll answer what I reasonably can — some things are appropriately gated to " +
        "higher clearance and I'll say so rather than dodge the question.",
      replies: [
        reply(ashgrid, "how long has BLACKROOT actually been running?", daysAgo(14, 5)),
        reply(sysadmin, "@ashgrid a good while now — long enough that the clearance system's been rebuilt from scratch at least once", daysAgo(14, 4)),
        reply(ember, "is Sysadmin promotion ever going to be more than 'invite only, vibes-based'?", daysAgo(13, 2)),
        reply(sysadmin, "@ember_iv fair jab. it's less 'vibes' and more 'people who were already doing the unglamorous maintenance work' — but I get why it reads that way from outside", daysAgo(13, 1)),
      ],
    },
    {
      channel: gridworks._id,
      author: cinder._id,
      title: "Reading list for newly Verified members",
      requiredClearance: "verified",
      createdAt: daysAgo(6),
      body:
        "Compiling a short list of older threads worth reading if you just got Verified and want context beyond the " +
        "Community Rules. The proxy rotation megathread pinned above is essential if you're doing any tooling work here. " +
        "The AMA thread with root_admin is a good primer on how the network actually makes decisions versus how it looks " +
        "from Guest. And keep an eye on the Sector 12 relay thread — not resolved yet, and it's turned into one of the " +
        "more interesting things happening on the network right now.",
      replies: [reply(moth, "good list, would add: don't skip the pinned rules-explainer in the Lobby even if you think you already get it", daysAgo(5, 6))],
    },
  ]);

  // ======================================================================
  // BLACKSITE OPS — operatives. The story escalates: this isn't ordinary
  // infra trouble, it looks like a probe from inside the network.
  // ======================================================================
  await Entry.create([
    {
      channel: blacksite._id,
      author: operative._id,
      title: "Blacksite briefing 04 — standing orders",
      requiredClearance: "operative",
      pinned: true,
      createdAt: daysAgo(28),
      body:
        "Standard reminder for anyone newly promoted to Operative: nothing discussed in this channel gets relayed " +
        "downward to Verified or Guest in any form — not screenshots, not paraphrases, not 'a friend told me.' That's " +
        "not a suggestion, it's the one rule that gets clearance pulled fastest if broken. Beyond that: this is where " +
        "operational and higher-signal discussion happens. Use your judgment, flag anything that looks like it needs " +
        "Sysadmin eyes rather than sitting on it.",
      replies: [
        reply(kilo, "acknowledged. good to be here, been waiting on this promotion a while", daysAgo(27, 3)),
        reply(ferro, "seconding — the downward-relay rule is the whole reason this channel is worth anything", daysAgo(26, 5)),
      ],
    },
    {
      channel: blacksite._id,
      author: kilo._id,
      title: "Sector 12 relay — pulled the actual logs, this is not ordinary instability",
      requiredClearance: "operative",
      createdAt: daysAgo(13),
      body:
        "Following up on the thread a Verified member started in Gridworks flagging a regular-interval pattern on the " +
        "Sector 12 relay. Pulled the raw logs instead of eyeballing dashboards. The intervals are real and they're " +
        "tighter than the Gridworks estimate — 41 minutes, consistent to within about ninety seconds, over a two-week " +
        "window. That's not a health check on our side; I checked. Each drop correlates with a short burst of outbound " +
        "traffic to an endpoint that isn't in our normal routing tables. Small payloads, nothing that's triggered a " +
        "bandwidth alert, which is probably the point. This reads like something probing the relay's boundaries on a " +
        "timer, not hardware degrading. Flagging for Sysadmin visibility — this feels above what I can resolve at this tier.",
      replies: [
        reply(vex, "41 minutes on the dot for two weeks straight is not a coincidence pattern, that's scheduled", daysAgo(12, 4)),
        reply(ferro, "small outbound payloads to an untabled endpoint on a strict timer reads like exfil staging to me, not recon", daysAgo(12, 1)),
        reply(kilo, "@null_ferro that was my read too but didn't want to say it before someone else independently landed there", daysAgo(11, 6)),
        reply(operative, "good work. this is getting escalated to Coreroot today", daysAgo(11, 2)),
      ],
    },
    {
      channel: blacksite._id,
      author: vex._id,
      title: "OPSEC reminder: what specifically not to say downward, with examples",
      requiredClearance: "operative",
      createdAt: daysAgo(10),
      body:
        "Given the Sector 12 situation is active, a reminder with actual examples since 'don't relay downward' is " +
        "abstract until someone almost does it by accident. Don't say, even vaguely, that there's an active security " +
        "investigation — 'nothing to worry about, we're looking into some technical stuff' is fine if asked, full stop. " +
        "Don't reference specific timing, endpoints, or anything log-derived, even stripped of details, since patterns " +
        "can be reconstructed from partial info faster than people expect. If a Verified member brings it up because " +
        "they noticed something themselves, you can acknowledge it's being handled — you cannot confirm or deny " +
        "anything about what 'handled' means.",
      replies: [
        reply(kilo, "the 'patterns reconstructed from partial info' point is exactly right and underrated", daysAgo(9, 5)),
        reply(ferro, "good writeup, bookmarking this for future promotions", daysAgo(9, 2)),
      ],
    },
    {
      channel: blacksite._id,
      author: ferro._id,
      title: "How Operative promotions actually get decided — roundtable",
      requiredClearance: "operative",
      createdAt: daysAgo(20),
      body:
        "Semi-regular thread since new Operatives always ask this once they're on the other side of the promotion. " +
        "From what I've seen across a few promotion cycles: it's not a checklist. Sysadmins seem to weight consistency " +
        "over intensity — someone posting solid, measured contributions for months reads better than a burst of high-effort " +
        "posts right before they'd want a promotion, which if anything seems to slow things down rather than speed them up. " +
        "Curious what others have observed, especially anyone who got promoted faster or slower than they expected.",
      replies: [
        reply(vex, "took me nearly five months of steady Gridworks participation before it happened, no complaints about the pace in hindsight", daysAgo(19, 4)),
        reply(kilo, "mine happened faster than I expected and I still don't fully know why — best guess is a specific thread I wrote got noticed", daysAgo(18, 7)),
        reply(operative, "not going to give away the exact formula since there isn't one, but 'consistency over intensity' is a fair read", daysAgo(17, 3)),
      ],
    },
    {
      channel: blacksite._id,
      author: operative._id,
      title: "Historical incident archive — index",
      requiredClearance: "operative",
      createdAt: daysAgo(22),
      body:
        "Index thread linking (informally, by name — search for these titles) past incidents worth knowing about if " +
        "you're new to Operative clearance: the credential-stuffing wave from early in the network's history, the " +
        "brief period where an entire Verified cohort was rate-limited into uselessness by a misconfigured filter, and " +
        "the first time a channel's clearance was raised network-wide after a leak. None of these are directly related " +
        "to the current Sector 12 situation as far as I know, but the response patterns are similar enough to be worth " +
        "reviewing if you weren't around for them.",
      replies: [reply(kilo, "the misconfigured filter one still makes me wince reading about it secondhand", daysAgo(21, 5))],
    },
  ]);

  // ======================================================================
  // COREROOT — sysadmins only. The payoff: root cause, what was actually
  // happening, and what was done about it.
  // ======================================================================
  await Entry.create([
    {
      channel: coreroot._id,
      author: sysadmin._id,
      title: "Root directive — standing priorities",
      requiredClearance: "sysadmin",
      pinned: true,
      createdAt: daysAgo(29),
      body:
        "Standing directive for all Sysadmins, restated periodically so it doesn't get lost: every clearance change, " +
        "every session revocation, every content purge gets logged with full context, not just the bare action. If " +
        "you're ever tempted to skip the detail field on an audit entry because an action feels routine, that's exactly " +
        "the entry someone will need context on eighteen months from now. We hold ourselves to the same transparency " +
        "standard we designed the whole system around, or none of it means anything.",
      replies: [reply(lyric, "agreed, and it's saved us more than once already", daysAgo(28, 4))],
    },
    {
      channel: coreroot._id,
      author: sysadmin._id,
      title: "Sector 12 — full post-mortem and root cause",
      requiredClearance: "sysadmin",
      createdAt: daysAgo(4),
      body:
        "Closing the loop on the Sector 12 relay situation that's been threading through Gridworks and Blacksite for " +
        "the past few weeks. Root cause: a Verified-tier account, active on the network for roughly four months and by " +
        "all visible metrics a normal contributor, had automated a slow, scheduled probe against relay boundaries — the " +
        "41-minute interval Blacksite identified was a deliberate scheduling choice on their end, tuned to sit just " +
        "under our automated alert thresholds. The outbound payloads Blacksite flagged were staging traffic; based on " +
        "payload size and destination pattern, we believe the goal was mapping which Operative-tier channels existed " +
        "and probing whether clearance boundaries could be walked back via request manipulation rather than actually " +
        "exfiltrating content — consistent with what we've documented elsewhere: there is no route, however crafted, " +
        "that lets a lower-clearance account reach higher-clearance data, because the check happens server-side against " +
        "the verified session, never against anything client-supplied. Their probes never succeeded. Account clearance " +
        "has been revoked to nothing, all sessions terminated, and the account is barred from re-registration under the " +
        "same email. Full technical writeup and the flagged account's history available to any Sysadmin who wants to " +
        "review the raw data — ping me directly rather than posting specifics here, even in this channel, until the " +
        "writeup's fully reviewed.",
      replies: [
        reply(lyric, "appreciate the full writeup. the 'tuned to sit under alert thresholds' detail is the part that worries me most going forward", daysAgo(3, 5)),
        reply(sysadmin, "@lyric_9 agreed, already adjusting threshold sensitivity as a follow-up action, separate thread coming", daysAgo(3, 3)),
        reply(lyric, "good. and credit to Blacksite and the Gridworks member who first flagged it — neither of them had the full picture but both read the signal correctly", daysAgo(2, 6)),
      ],
    },
    {
      channel: coreroot._id,
      author: lyric._id,
      title: "Sysadmin runbook: clearance change protocol",
      requiredClearance: "sysadmin",
      createdAt: daysAgo(23),
      body:
        "Documenting the standard protocol for clearance changes so it's not tribal knowledge. Promotions: review the " +
        "account's post history directly, don't rely on post count alone, write a one-line justification into the " +
        "audit detail field beyond just 'promoted.' Demotions or revocations: always pair with a session revocation in " +
        "the same sitting — a demoted account with an unrevoked session keeps its old access token's claims until that " +
        "token naturally expires otherwise, and that gap has bitten us before. When in doubt on a borderline case, ask " +
        "in this channel before acting rather than after.",
      replies: [reply(sysadmin, "the 'pair with session revocation' point is worth pinning on its own honestly", daysAgo(22, 4))],
    },
    {
      channel: coreroot._id,
      author: sysadmin._id,
      title: "Quarterly audit log review — summary",
      requiredClearance: "sysadmin",
      createdAt: daysAgo(2),
      body:
        "Reviewed the full audit log for the quarter as part of standing process. Volume is up, mostly driven by " +
        "routine Guest-to-Verified self-verifications, which is a healthy sign of network growth rather than a concern. " +
        "Operative promotions stayed roughly steady with prior quarters. The one flagged item of note is the Sector 12 " +
        "account revocation, already fully written up separately. No other anomalies in the log worth escalating this " +
        "cycle. Full log remains available to any Sysadmin at any time — that's the entire point of it existing.",
      replies: [reply(lyric, "clean quarter otherwise, good", daysAgo(1, 6))],
    },
    {
      channel: coreroot._id,
      author: lyric._id,
      title: "Standing agenda — Coreroot housekeeping",
      requiredClearance: "sysadmin",
      createdAt: daysAgo(16),
      body:
        "Running list of smaller open items that don't need their own thread but shouldn't get lost either: revisit " +
        "the Operative promotion writeup so it's easier to hand to a new Sysadmin without a verbal walkthrough, decide " +
        "whether the historical incident archive in Blacksite should get a Coreroot-side counterpart with the parts " +
        "operatives don't see, and keep an eye on relay alert threshold tuning now that Sector 12 is closed out. Add to " +
        "this list as things come up rather than opening new threads for everything.",
      replies: [],
    },
  ]);

  await ActivationCode.create({ code: "BLACKROOT-JOIN", updatedBy: sysadmin._id });

  console.log("\n[seed] demo accounts (password for all: %s)", DEMO_PASSWORD);
  console.log(" guest      guest@blackroot.dev");
  console.log(" verified   verified@blackroot.dev");
  console.log(" operative  operative@blackroot.dev");
  console.log(" sysadmin   sysadmin@blackroot.dev");
  console.log("\n[seed] network activation code (shared, reusable, sysadmin-controlled): BLACKROOT-JOIN\n");
  console.log("[seed] 20 threads seeded across 4 channels, with 13 total member accounts.\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
