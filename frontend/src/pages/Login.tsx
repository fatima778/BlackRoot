import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { GlitchText } from "../components/GlitchText";
import { NetworkCanvas } from "../components/NetworkCanvas";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a20.3 20.3 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a20.3 20.3 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Uplink rejected. Check your credentials.");
      setShakeKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT: branding / network visual — hidden on mobile */}
      <div className="relative hidden md:flex flex-col justify-center px-12 overflow-hidden bg-panel/40 border-r border-hairline">
        <NetworkCanvas className="absolute inset-0 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-void/60 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-sm"
        >
          <Link to="/" className="font-display text-jade tracking-[0.25em] text-sm mb-8 inline-block">
            BLACK<span className="text-mint">ROOT</span>
          </Link>
          <h2 className="font-display text-2xl text-mint leading-snug mb-4 text-glow">
            <GlitchText text="RE-ESTABLISH YOUR UPLINK." />
          </h2>
          <p className="text-sm text-muted font-mono leading-relaxed">
            Your clearance level, channels, and post history are exactly where you left them. Server-side session
            validation means your access is verified fresh on every request — not just trusted from a stale cookie.
          </p>
          <div className="mt-8 space-y-2">
            {["GUEST", "VERIFIED", "OPERATIVE", "SYSADMIN"].map((tier, i) => (
              <motion.div
                key={tier}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-2 text-[11px] font-mono text-muted"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-jade/60" />
                {tier} clearance recognized
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT: form */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <motion.div
            key={shakeKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, x: shakeKey ? [0, -8, 8, -6, 6, 0] : 0 }}
            transition={{ duration: 0.4 }}
            className="panel scanline-overlay p-6"
          >
            <h1 className="font-display text-lg text-jade text-glow mb-1">
              <GlitchText text="AUTHENTICATE" />
            </h1>
            <p className="text-xs text-muted font-mono mb-6">Enter credentials to establish an uplink.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0" htmlFor="password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[10px] font-mono text-muted hover:text-jade transition-colors">
                    forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-field pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-jade transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-signal text-xs font-mono"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                    connecting...
                  </span>
                ) : (
                  "connect"
                )}
              </button>
            </form>

            <p className="mt-5 text-xs text-muted font-mono text-center">
              No access yet?{" "}
              <Link to="/register" className="text-jade hover:text-glow">
                Request clearance
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}