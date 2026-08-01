import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, Entry, isRedacted } from "../api/client";
import { RoleBadge } from "../components/RoleBadge";
import { LockedEntryCard } from "../components/LockedEntryCard";
import { SparkleBurst } from "../components/SparkleBurst";
import { useAuth } from "../context/AuthContext";
import { meetsClearance } from "../utils/roles";

export function EntryPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [flagged, setFlagged] = useState(false);
  const [flagging, setFlagging] = useState(false);

  useEffect(() => {
    api
      .get<{ entry: Entry }>(`/entries/${entryId}`)
      .then((res) => {
        setEntry(res.data.entry);
        setEditTitle(res.data.entry.title ?? "");
        setEditBody(res.data.entry.body ?? "");
        setFlagged(Boolean(res.data.entry.flagged));
      })
      .catch(() => navigate("/404"))
      .finally(() => setLoading(false));
  }, [entryId, navigate]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!entry || !reply.trim()) return;
    setSending(true);
    try {
      const res = await api.post<{ entry: Entry }>(`/entries/${entry._id}/replies`, { body: reply });
      setEntry(res.data.entry);
      setReply("");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveEdit() {
    if (!entry) return;
    setSavingEdit(true);
    try {
      const res = await api.patch<{ entry: Entry }>(`/entries/${entry._id}`, {
        title: editTitle,
        body: editBody,
      });
      setEntry((prev) => (prev ? { ...prev, ...res.data.entry } : res.data.entry));
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleFlag() {
    if (!entry || flagged) return;
    setFlagging(true);
    try {
      await api.post(`/entries/${entry._id}/flag`);
      setFlagged(true);
    } finally {
      setFlagging(false);
    }
  }

  if (loading) return <p className="text-muted font-mono text-sm">decrypting transmission...</p>;
  if (!entry) return null;

  if (isRedacted(entry)) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="text-xs text-muted hover:text-jade font-mono mb-4 inline-block transition-colors">
          ← back to channels
        </Link>
        <LockedEntryCard requiredClearance={entry.requiredClearance} />
      </div>
    );
  }

  const canReply = user && meetsClearance(user.role, "verified");
  const isOwner = user && entry.author && user.id === entry.author._id;
  const canEdit = Boolean(isOwner || (user && user.role === "sysadmin"));

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/dashboard" className="text-xs text-muted hover:text-jade font-mono mb-4 inline-block transition-colors">
        ← back to channels
      </Link>
      <div className="panel relative p-6 mb-6 decrypt-reveal overflow-hidden">
        <SparkleBurst />

        {editing ? (
          <div className="space-y-3">
            <input
              className="input-field font-display text-jade"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <textarea
              className="input-field min-h-[120px]"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary">
                {savingEdit ? "saving..." : "save changes"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditTitle(entry.title ?? "");
                  setEditBody(entry.body ?? "");
                }}
                className="btn-ghost"
              >
                cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 gap-3">
              <h1 className="font-display text-lg text-jade text-glow">{entry.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <RoleBadge role={entry.requiredClearance} />
              </div>
            </div>
            <p className="text-xs text-muted font-mono mb-4 flex items-center flex-wrap gap-x-2">
              <span>
                {entry.author?.alias} · {entry.createdAt && new Date(entry.createdAt).toLocaleString()}
                {entry.editedAt && " · edited"}
              </span>
            </p>
            <p className="text-sm text-mint/90 whitespace-pre-wrap leading-relaxed mb-4">{entry.body}</p>

            <div className="flex items-center gap-4 pt-3 border-t border-hairline/60">
              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-mono text-muted hover:text-jade transition-colors"
                >
                  ✎ edit
                </button>
              )}
              {canReply && (
                <button
                  onClick={handleFlag}
                  disabled={flagged || flagging}
                  className={`text-xs font-mono transition-colors ${
                    flagged ? "text-signal" : "text-muted hover:text-signal"
                  }`}
                >
                  {flagged ? "⚑ flagged for review" : flagging ? "flagging..." : "⚑ flag this transmission"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <h2 className="font-display text-sm text-muted tracking-widest mb-3">
        REPLIES ({entry.replies?.length ?? 0})
      </h2>
      <div className="space-y-3 mb-6">
        {entry.replies?.map((r) => (
          <div key={r._id} className="panel p-3">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
              <span className="text-xs text-jade font-mono">{r.author.alias}</span>
              <RoleBadge role={r.author.role} />
              <span className="text-[10px] text-muted font-mono ml-auto">
                {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-mint/85 whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
        {(entry.replies?.length ?? 0) === 0 && <p className="text-muted font-mono text-xs">No replies yet.</p>}
      </div>

      {canReply ? (
        <form onSubmit={handleReply} className="panel p-4">
          <textarea
            className="input-field min-h-[80px] mb-3"
            placeholder="Send a reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button type="submit" disabled={sending || !reply.trim()} className="btn-primary">
            {sending ? "transmitting..." : "reply"}
          </button>
        </form>
      ) : (
        <p className="text-muted font-mono text-xs">Verified clearance required to reply.</p>
      )}
    </div>
  );
}
