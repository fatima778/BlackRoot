import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { api, Channel, Entry, isRedacted } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { meetsClearance } from "../utils/roles";
import { RoleBadge } from "../components/RoleBadge";
import { LockedEntryCard } from "../components/LockedEntryCard";
import { GlitchText } from "../components/GlitchText";

export function ChannelPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const chRes = await api.get<{ channel: Channel }>(`/channels/${slug}`);
        if (!active) return;
        setChannel(chRes.data.channel);
        const entRes = await api.get<{ entries: Entry[] }>(`/entries/channel/${chRes.data.channel._id}`);
        if (!active) return;
        setEntries(entRes.data.entries);
      } catch {
        navigate("/404");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug, navigate]);

  async function handlePost() {
    if (!channel) return;
    setPosting(true);
    try {
      const res = await api.post<{ entry: Entry }>("/entries", { channelId: channel._id, title, body });
      setEntries((prev) => [res.data.entry, ...prev]);
      setTitle("");
      setBody("");
      setComposerOpen(false);
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <p className="text-muted font-mono text-sm">decrypting channel...</p>;
  if (!channel) return null;

  const canPost = user && meetsClearance(user.role, channel.requiredClearanceToPost);

  return (
    <div>
      <Link to="/dashboard" className="text-xs text-muted hover:text-jade font-mono mb-4 inline-block transition-colors">
        ← back to channels
      </Link>
      <div className="mb-6">
        <h1 className="font-display text-xl text-jade text-glow mb-1">
          <GlitchText text={`#${channel.name}`} />
        </h1>
        <p className="text-xs text-muted font-mono">{channel.description}</p>
        <div className="mt-2 flex gap-2 text-[10px] font-mono">
          <RoleBadge role={channel.requiredClearance} />
          <span className="text-muted">to read · </span>
          <RoleBadge role={channel.requiredClearanceToPost} />
          <span className="text-muted">to post</span>
        </div>
      </div>

      {canPost && (
        <div className="panel p-4 mb-6">
          {!composerOpen ? (
            <button className="btn-ghost" onClick={() => setComposerOpen(true)}>
              + new transmission
            </button>
          ) : (
            <div className="space-y-3">
              <input
                className="input-field"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Write your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="btn-primary"
                  disabled={posting || !title || !body}
                  onClick={handlePost}
                >
                  {posting ? "transmitting..." : "transmit"}
                </button>
                <button className="btn-ghost" onClick={() => setComposerOpen(false)}>
                  cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {entries.map((entry, i) =>
          isRedacted(entry) ? (
            <motion.div key={entry._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <LockedEntryCard requiredClearance={entry.requiredClearance} />
            </motion.div>
          ) : (
            <motion.div key={entry._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/entries/${entry._id}`} className="panel block p-4 hover:border-jade/50 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-mint group-hover:text-jade transition-colors">
                    {entry.pinned && "📌 "}
                    {entry.title}
                  </span>
                  <RoleBadge role={entry.requiredClearance} />
                </div>
                <p className="text-xs text-muted font-mono">
                  {entry.author?.alias} · {entry.replies?.length ?? 0} replies
                </p>
              </Link>
            </motion.div>
          ),
        )}
        {entries.length === 0 && <p className="text-muted font-mono text-sm">No transmissions yet in this channel.</p>}
      </div>
    </div>
  );
}
