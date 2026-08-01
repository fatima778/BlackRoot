import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import { GlitchText } from "../components/GlitchText";
import { NetworkCanvas } from "../components/NetworkCanvas";
import { PasswordStrengthMeter } from "../components/PasswordStrengthMeter";
import { RecoveryCodeReveal } from "../components/RecoveryCodeReveal";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ newRecoveryCode: string }>("/auth/forgot-password", {
        email,
        recoveryCode: recoveryCode.trim().toUpperCase(),
        newPassword,
      });
      setNewCode(res.data.newRecoveryCode);
    } catch (err: any) {
      const details = err?.response?.data?.details;
      setError(details?.[0] ?? err?.response?.data?.error ?? "Reset failed. Check your email and recovery code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
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
            <GlitchText text="NO EMAIL. NO PROBLEM." />
          </h2>
          <p className="text-sm text-muted font-mono leading-relaxed">
            This network doesn't send reset links — there's no outbound email or SMS provider in this deployment.
            Instead, the recovery code you were shown once at registration is what proves it's really you. Enter it
            below along with a new password, and every existing session tied to your account is signed out
            automatically as part of the reset. You'll be issued a brand-new recovery code afterward — the old one
            is burned the moment it's used.
          </p>
        </motion.div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {newCode ? (
            <RecoveryCodeReveal code={newCode} onContinue={() => (window.location.href = "/login")} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel scanline-overlay p-6">
              <h1 className="font-display text-lg text-jade text-glow mb-1">
                <GlitchText text="RESET PASSWORD" />
              </h1>
              <p className="text-xs text-muted font-mono mb-6">
                Requires the recovery code shown to you once at registration.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="fp-email">
                    Email
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    required
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="fp-code">
                    Recovery code
                  </label>
                  <input
                    id="fp-code"
                    required
                    className="input-field font-mono tracking-wider"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="fp-password">
                    New password
                  </label>
                  <input
                    id="fp-password"
                    type="password"
                    required
                    className="input-field"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordStrengthMeter password={newPassword} />
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
                  {busy ? "resetting..." : "reset password"}
                </button>
              </form>

              <p className="mt-5 text-xs text-muted font-mono text-center">
                Remembered it after all?{" "}
                <Link to="/login" className="text-jade hover:text-glow">
                  Back to sign in
                </Link>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
