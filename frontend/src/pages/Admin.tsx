import { FormEvent, useEffect, useState } from "react";
import { api, Role } from "../api/client";
import { RoleBadge } from "../components/RoleBadge";
import { GlitchText } from "../components/GlitchText";

interface AdminUser {
  _id: string;
  alias: string;
  email: string;
  role: Role;
  joinedAt: string;
  postCount: number;
}

interface AuditEntry {
  _id: string;
  actor: { alias: string; role: Role } | null;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

interface AdminChannel {
  _id: string;
  slug: string;
  name: string;
  description: string;
  requiredClearance: Role;
  requiredClearanceToPost: Role;
  archived: boolean;
  locked: boolean;
}

interface AdminEntry {
  _id: string;
  title: string;
  author: { alias: string } | null;
  channel: { _id: string; slug: string; name: string } | null;
  requiredClearance: Role;
  locked: boolean;
  flagged: boolean;
  pinned: boolean;
  createdAt: string;
}

const ROLES: Role[] = ["guest", "verified", "operative", "sysadmin"];
const TABS = ["users", "channels", "entries", "activation", "audit"] as const;
type Tab = (typeof TABS)[number];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [newChannel, setNewChannel] = useState({
    slug: "",
    name: "",
    description: "",
    requiredClearance: "guest" as Role,
    requiredClearanceToPost: "verified" as Role,
  });
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entryChannelFilter, setEntryChannelFilter] = useState<string>("");

  const [log, setLog] = useState<AuditEntry[]>([]);
  const [activationCode, setActivationCode] = useState<string | null>(null);
  const [activationCodeUpdatedAt, setActivationCodeUpdatedAt] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedActivation, setCopiedActivation] = useState(false);

  useEffect(() => {
    api.get<{ users: AdminUser[] }>("/admin/users").then((res) => setUsers(res.data.users)).finally(() => setUsersLoading(false));
    api.get<{ channels: AdminChannel[] }>("/admin/channels").then((res) => setChannels(res.data.channels)).finally(() => setChannelsLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "audit") {
      api.get<{ log: AuditEntry[] }>("/admin/audit-log").then((res) => setLog(res.data.log));
    }
    if (tab === "entries") {
      setEntriesLoading(true);
      api
        .get<{ entries: AdminEntry[] }>("/admin/entries", {
          params: entryChannelFilter ? { channelId: entryChannelFilter } : {},
        })
        .then((res) => setEntries(res.data.entries))
        .finally(() => setEntriesLoading(false));
    }
    if (tab === "activation") {
      api
        .get<{ code: string; updatedAt: string }>("/admin/activation-code")
        .then((res) => {
          setActivationCode(res.data.code);
          setActivationCodeUpdatedAt(res.data.updatedAt);
        });
    }
  }, [tab, entryChannelFilter]);

  async function handleRoleChange(userId: string, role: Role) {
    const res = await api.patch<{ user: AdminUser }>(`/admin/users/${userId}/role`, { role });
    setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: res.data.user.role } : u)));
  }

  async function handleRevoke(userId: string) {
    await api.post(`/admin/users/${userId}/revoke-sessions`);
  }

  async function handleRegenerateActivationCode() {
    if (
      !window.confirm(
        "Regenerate the activation code? The old code will stop working for NEW signups immediately — already-registered accounts are unaffected.",
      )
    )
      return;
    setRegenerating(true);
    try {
      const res = await api.post<{ code: string; updatedAt: string }>("/admin/activation-code/regenerate");
      setActivationCode(res.data.code);
      setActivationCodeUpdatedAt(res.data.updatedAt);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopyActivationCode() {
    if (!activationCode) return;
    try {
      await navigator.clipboard.writeText(activationCode);
      setCopiedActivation(true);
      setTimeout(() => setCopiedActivation(false), 2000);
    } catch {
      // Clipboard API unavailable — code is still visible and selectable.
    }
  }

  async function handleCreateChannel(e: FormEvent) {
    e.preventDefault();
    setChannelError(null);
    setCreatingChannel(true);
    try {
      const res = await api.post<{ channel: AdminChannel }>("/admin/channels", newChannel);
      setChannels((prev) => [...prev, res.data.channel]);
      setNewChannel({ slug: "", name: "", description: "", requiredClearance: "guest", requiredClearanceToPost: "verified" });
    } catch (err: any) {
      setChannelError(err?.response?.data?.error ?? "Failed to create channel.");
    } finally {
      setCreatingChannel(false);
    }
  }

  async function handleChannelUpdate(channelId: string, patch: Partial<AdminChannel>) {
    const res = await api.patch<{ channel: AdminChannel }>(`/admin/channels/${channelId}`, patch);
    setChannels((prev) => prev.map((c) => (c._id === channelId ? { ...c, ...res.data.channel } : c)));
  }

  async function handleEntryClearance(entryId: string, requiredClearance: Role) {
    await api.patch(`/admin/entries/${entryId}/clearance`, { requiredClearance });
    setEntries((prev) => prev.map((e) => (e._id === entryId ? { ...e, requiredClearance } : e)));
  }

  async function handleEntryLock(entryId: string, locked: boolean) {
    await api.patch(`/admin/entries/${entryId}/lock`, { locked });
    setEntries((prev) => prev.map((e) => (e._id === entryId ? { ...e, locked } : e)));
  }

  async function handlePurgeEntry(entryId: string) {
    if (!window.confirm("Permanently purge this entry? This cannot be undone.")) return;
    await api.delete(`/admin/entries/${entryId}`);
    setEntries((prev) => prev.filter((e) => e._id !== entryId));
  }

  return (
    <div>
      <h1 className="font-display text-xl text-jade text-glow mb-1">
        <GlitchText text="ROOT CONSOLE" />
      </h1>
      <p className="text-xs text-muted font-mono mb-6">Sysadmin-only. Every action here is written to the audit log.</p>

      <div className="flex gap-4 mb-6 border-b border-hairline text-xs font-mono overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 -mb-px border-b-2 whitespace-nowrap ${
              tab === t ? "border-jade text-jade" : "border-transparent text-muted hover:text-mint"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* USERS */}
      {tab === "users" && (
        <div className="panel overflow-x-auto">
          {usersLoading ? (
            <p className="p-4 text-muted font-mono text-sm">loading roster...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted font-mono text-xs border-b border-hairline">
                  <th className="p-3">Handle</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Posts</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-hairline/50">
                    <td className="p-3 font-mono">{u.alias}</td>
                    <td className="p-3 font-mono text-muted text-xs">{u.email}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        <select
                          className="input-field !w-auto !py-1 text-xs"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as Role)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">{u.postCount}</td>
                    <td className="p-3">
                      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => handleRevoke(u._id)}>
                        revoke sessions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CHANNELS */}
      {tab === "channels" && (
        <div className="space-y-6">
          <form onSubmit={handleCreateChannel} className="panel p-4 grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Slug</label>
              <input
                className="input-field"
                required
                value={newChannel.slug}
                onChange={(e) => setNewChannel((s) => ({ ...s, slug: e.target.value }))}
                placeholder="deep-cover"
              />
            </div>
            <div>
              <label className="label">Name</label>
              <input
                className="input-field"
                required
                value={newChannel.name}
                onChange={(e) => setNewChannel((s) => ({ ...s, name: e.target.value }))}
                placeholder="Deep Cover"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input
                className="input-field"
                value={newChannel.description}
                onChange={(e) => setNewChannel((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Required to read</label>
              <select
                className="input-field"
                value={newChannel.requiredClearance}
                onChange={(e) => setNewChannel((s) => ({ ...s, requiredClearance: e.target.value as Role }))}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Required to post</label>
              <select
                className="input-field"
                value={newChannel.requiredClearanceToPost}
                onChange={(e) => setNewChannel((s) => ({ ...s, requiredClearanceToPost: e.target.value as Role }))}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {channelError && <p className="text-signal text-xs font-mono md:col-span-2">{channelError}</p>}
            <div className="md:col-span-2">
              <button type="submit" disabled={creatingChannel} className="btn-primary">
                {creatingChannel ? "creating..." : "create channel"}
              </button>
            </div>
          </form>

          <div className="panel overflow-x-auto">
            {channelsLoading ? (
              <p className="p-4 text-muted font-mono text-sm">loading channels...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted font-mono text-xs border-b border-hairline">
                    <th className="p-3">Name</th>
                    <th className="p-3">Read</th>
                    <th className="p-3">Post</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((c) => (
                    <tr key={c._id} className="border-b border-hairline/50">
                      <td className="p-3 font-mono">
                        #{c.slug}
                        <span className="block text-[10px] text-muted">{c.name}</span>
                      </td>
                      <td className="p-3">
                        <select
                          className="input-field !w-auto !py-1 text-xs"
                          value={c.requiredClearance}
                          onChange={(e) => handleChannelUpdate(c._id, { requiredClearance: e.target.value as Role })}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          className="input-field !w-auto !py-1 text-xs"
                          value={c.requiredClearanceToPost}
                          onChange={(e) => handleChannelUpdate(c._id, { requiredClearanceToPost: e.target.value as Role })}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          className={`btn-ghost !px-2 !py-1 text-xs ${c.locked ? "!text-signal !border-signal/50" : ""}`}
                          onClick={() => handleChannelUpdate(c._id, { locked: !c.locked })}
                        >
                          {c.locked ? "unlock" : "lock"}
                        </button>
                        <button
                          className={`btn-ghost !px-2 !py-1 text-xs ${c.archived ? "!text-signal !border-signal/50" : ""}`}
                          onClick={() => handleChannelUpdate(c._id, { archived: !c.archived })}
                        >
                          {c.archived ? "unarchive" : "archive"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ENTRIES */}
      {tab === "entries" && (
        <div className="space-y-4">
          <select
            className="input-field !w-auto"
            value={entryChannelFilter}
            onChange={(e) => setEntryChannelFilter(e.target.value)}
          >
            <option value="">All channels</option>
            {channels.map((c) => (
              <option key={c._id} value={c._id}>
                #{c.slug}
              </option>
            ))}
          </select>

          <div className="panel overflow-x-auto">
            {entriesLoading ? (
              <p className="p-4 text-muted font-mono text-sm">loading entries...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted font-mono text-xs border-b border-hairline">
                    <th className="p-3">Title</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Clearance</th>
                    <th className="p-3">Flags</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e._id} className="border-b border-hairline/50">
                      <td className="p-3 font-mono">
                        {e.title}
                        <span className="block text-[10px] text-muted">{e.author?.alias ?? "unknown"}</span>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted">#{e.channel?.slug ?? "?"}</td>
                      <td className="p-3">
                        <select
                          className="input-field !w-auto !py-1 text-xs"
                          value={e.requiredClearance}
                          onChange={(ev) => handleEntryClearance(e._id, ev.target.value as Role)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-xs font-mono space-x-1">
                        {e.flagged && <span className="text-signal">⚑</span>}
                        {e.locked && <span className="text-muted">🔒</span>}
                        {e.pinned && <span className="text-jade">📌</span>}
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          className="btn-ghost !px-2 !py-1 text-xs"
                          onClick={() => handleEntryLock(e._id, !e.locked)}
                        >
                          {e.locked ? "unlock" : "lock"}
                        </button>
                        <button
                          className="btn-ghost !px-2 !py-1 text-xs !text-signal !border-signal/40"
                          onClick={() => handlePurgeEntry(e._id)}
                        >
                          purge
                        </button>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted font-mono text-sm">
                        No entries match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ACTIVATION CODE */}
      {tab === "activation" && (
        <div className="panel p-6 max-w-lg">
          <h2 className="font-display text-sm text-jade mb-2">Network Activation Code</h2>
          <p className="text-xs text-muted font-mono leading-relaxed mb-5">
            One shared code, not single-use — any number of new signups can register with it. Distribute it however
            you'd like (a README, a Discord, a physical sign-up sheet). Regenerating it immediately invalidates the
            old code for new signups; accounts that already registered are completely unaffected.
          </p>
          {activationCode ? (
            <>
              <div className="bg-void border border-jade/40 rounded-sm px-4 py-3 mb-3 flex items-center justify-between gap-3">
                <code className="font-display text-jade text-glow text-sm tracking-[0.1em] select-all">
                  {activationCode}
                </code>
                <button
                  onClick={handleCopyActivationCode}
                  className="shrink-0 text-[11px] font-mono text-muted hover:text-jade border border-hairline hover:border-jade/50 rounded-sm px-2.5 py-1.5 transition-colors"
                >
                  {copiedActivation ? "copied ✓" : "copy"}
                </button>
              </div>
              {activationCodeUpdatedAt && (
                <p className="text-[10px] text-muted font-mono mb-4">
                  last changed {new Date(activationCodeUpdatedAt).toLocaleString()}
                </p>
              )}
              <button onClick={handleRegenerateActivationCode} disabled={regenerating} className="btn-ghost">
                {regenerating ? "regenerating..." : "regenerate code"}
              </button>
            </>
          ) : (
            <p className="text-muted font-mono text-sm">loading current code...</p>
          )}
        </div>
      )}

      {/* AUDIT */}
      {tab === "audit" && (
        <div className="panel p-4 space-y-2 max-h-[500px] overflow-y-auto">
          {log.map((entry) => (
            <div key={entry._id} className="text-xs font-mono border-b border-hairline/50 pb-2">
              <span className="text-muted">{new Date(entry.createdAt).toLocaleString()}</span>{" "}
              <span className="text-jade">{entry.actor?.alias ?? "unknown"}</span>{" "}
              <span className="text-mint">{entry.action}</span>{" "}
              <span className="text-muted">
                → {entry.targetType}:{entry.targetId.slice(-6)} {entry.detail}
              </span>
            </div>
          ))}
          {log.length === 0 && <p className="text-muted font-mono text-sm">No audit events yet.</p>}
        </div>
      )}
    </div>
  );
}
