import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { api, SearchResult } from "../api/client";
import { RoleBadge } from "../components/RoleBadge";
import { GlitchText } from "../components/GlitchText";

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    let active = true;
    setLoading(true);
    api
      .get<{ results: SearchResult[] }>("/entries/search", { params: { q: query } })
      .then((res) => {
        if (active) setResults(res.data.results);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setSearched(true);
        }
      });
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div>
      <h1 className="font-display text-xl text-jade text-glow mb-1">
        <GlitchText text="SEARCH RESULTS" />
      </h1>
      <p className="text-xs text-muted font-mono mb-6">
        {query ? (
          <>
            Showing results for <span className="text-mint">"{query}"</span> — only entries within your clearance
            are ever returned; the database query itself excludes anything above your tier.
          </>
        ) : (
          "Type a query in the search bar above to begin."
        )}
      </p>

      {loading && <p className="text-muted font-mono text-sm">scanning archives...</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-muted font-mono text-sm">
          No matches within your clearance. Higher-tier accounts may see different results for the same query — that's
          expected, not a bug.
        </p>
      )}

      <div className="grid gap-3">
        {results.map((r, i) => (
          <motion.div
            key={r._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={`/entries/${r._id}`}
              className="panel flex items-center justify-between p-4 hover:border-jade/50 transition-colors group"
            >
              <div>
                <span className="font-display text-mint group-hover:text-jade transition-colors">{r.title}</span>
                <p className="text-xs text-muted font-mono mt-1">
                  #{r.channel?.name ?? "unknown"} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <RoleBadge role={r.requiredClearance} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
