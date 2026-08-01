import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, Channel } from "../api/client";
import { RoleBadge } from "../components/RoleBadge";
import { GlitchText } from "../components/GlitchText";

export function ForumPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ channels: Channel[] }>("/channels")
      .then((res) => setChannels(res.data.channels))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-jade text-glow mb-1">
        <GlitchText text="ACTIVE CHANNELS" />
      </h1>
      <p className="text-xs text-muted font-mono mb-6">
        Only channels within your clearance are listed. Higher-clearance channels do not appear until upgraded.
      </p>

      {loading ? (
        <p className="text-muted font-mono text-sm">scanning frequencies...</p>
      ) : (
        <div className="grid gap-3">
          {channels.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Link
                to={`/channels/${c.slug}`}
                className="panel flex items-center justify-between p-4 hover:border-jade/50 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-mint group-hover:text-jade transition-colors">{c.name}</span>
                    {c.locked && <span className="text-signal text-xs font-mono">[locked]</span>}
                  </div>
                  <p className="text-xs text-muted font-mono">{c.description}</p>
                </div>
                <RoleBadge role={c.requiredClearance} />
              </Link>
            </motion.div>
          ))}
          {channels.length === 0 && (
            <p className="text-muted font-mono text-sm">No channels visible at your current clearance.</p>
          )}
        </div>
      )}
    </div>
  );
}
