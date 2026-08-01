import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { GlitchText } from "../components/GlitchText";
import { NetworkCanvas } from "../components/NetworkCanvas";
import { PasswordStrengthMeter } from "../components/PasswordStrengthMeter";
import { RecoveryCodeReveal } from "../components/RecoveryCodeReveal";

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

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const code = await register(alias, email, password, activationCode || undefined);
      setRecoveryCode(code);
    } catch (err: any) {
      const details = err?.response?.data?.details;
      setError(details?.[0] ?? err?.response?.data?.error ?? "Registration failed.");
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
            <GlitchText text="EVERY ACCOUNT STARTS AT GUEST." />
          </h2>
          <p className="text-sm text-muted font-mono leading-relaxed mb-6">
            No form field grants you a higher tier — Guest clearance is where every new signup begins, no exceptions.
            From there, verifying is one page and one checkbox away.
          </p>
          <div className="space-y-3">
            {[
              { step: "01", text: "Register — lands you at GUEST" },
              { step: "02", text: "Accept the rules — upgrades to VERIFIED" },
              { step: "03", text: "Earn standing — OPERATIVE by invite" },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-xs font-mono text-muted"
              >
                <span className="text-jade/60 font-display">{s.step}</span>
                {s.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT: form (or the one-time recovery code reveal, post-signup) */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {recoveryCode ? (
            <RecoveryCodeReveal code={recoveryCode} onContinue={() => navigate("/dashboard")} />
          ) : (
          <motion.div
            key={shakeKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, x: shakeKey ? [0, -8, 8, -6, 6, 0] : 0 }}
            transition={{ duration: 0.4 }}
            className="panel scanline-overlay p-6"
          >
            <h1 className="font-display text-lg text-jade text-glow mb-1">
              <GlitchText text="REQUEST CLEARANCE" />
            </h1>
            <p className="text-xs text-muted font-mono mb-6">New accounts join at GUEST clearance.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="alias">
                  Handle
                </label>
                <input
                  id="alias"
                  required
                  className="input-field"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="label" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label" htmlFor="reg-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-field pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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
                <PasswordStrengthMeter password={password} />
              </div>
              <div>
                <label className="label" htmlFor="activation">
                  Activation code <span className="text-muted/60 normal-case">(if required)</span>
                </label>
                <input
                  id="activation"
                  className="input-field"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="BLACKROOT-JOIN"
                />
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
                    provisioning...
                  </span>
                ) : (
                  "join network"
                )}
              </button>
            </form>

            <p className="mt-5 text-xs text-muted font-mono text-center">
              Already cleared?{" "}
              <Link to="/login" className="text-jade hover:text-glow">
                Authenticate
              </Link>
            </p>
          </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
