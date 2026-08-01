import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { GlitchText } from "../components/GlitchText";
import { SparkleBurst } from "../components/SparkleBurst";

const RULES = [
  {
    title: "1. Respect every clearance level, including the ones below yours",
    body: "Operative and Sysadmin accounts hold elevated access, not elevated standing over other members. Talking down to a Guest or Verified member because of your clearance tier is treated the same as any other harassment — it will be flagged and reviewed regardless of who holds the higher access.",
  },
  {
    title: "2. No harassment, doxxing, or targeted abuse",
    body: "This covers sustained unwanted contact, sharing someone's private information without consent, coordinated pile-ons, and threats of any kind — inside threads, in replies, or via any feature of the network. A single report can trigger review; you don't need to prove a pattern before flagging something.",
  },
  {
    title: "3. Don't relay gated content to accounts that can't see it",
    body: "If you hold Operative clearance and read something in Blacksite Ops, don't screenshot, quote, or paraphrase it into a Lobby thread a Guest can see. The clearance system exists to control who sees what; deliberately routing around it defeats the entire point and will result in a clearance review.",
  },
  {
    title: "4. Flag first, escalate second",
    body: "If you believe a post, reply, or another member is violating these rules, use the flag action rather than arguing it out in the thread itself. Flags go to Operatives and Sysadmins for review. Escalating publicly tends to make disputes worse and harder to resolve fairly.",
  },
  {
    title: "5. No content that violates the law in your jurisdiction",
    body: "This includes but isn't limited to sharing material you don't have rights to distribute, coordinating illegal activity, or posting content that's illegal to possess or share where you are. When in doubt, don't post it and ask a Sysadmin first.",
  },
  {
    title: "6. Account sharing and impersonation aren't allowed",
    body: "Your account, your clearance, your responsibility. Don't share login credentials, and don't create accounts designed to impersonate another member, whether as a joke or otherwise. This applies at every clearance tier without exception.",
  },
  {
    title: "7. Sysadmin decisions are final, but never silent",
    body: "If a Sysadmin locks a thread, purges content, or adjusts an account's clearance, that action is written to the permanent audit log with a timestamp and the acting Sysadmin's identity. Decisions aren't up for public re-litigation in threads, but they are never anonymous or unaccountable — the audit log is exactly how accountability is maintained instead.",
  },
  {
    title: "8. Repeated violations affect your clearance, not just get you a warning",
    body: "A single minor issue usually gets a flag reviewed and resolved quietly. A pattern of violations, or one severe violation, can result in your account's clearance being lowered — including back down to Guest — regardless of what tier you'd previously reached. Clearance earned through good standing can be lost the same way standing is lost anywhere else.",
  },
  {
    title: "9. Don't attempt to exploit or probe access controls",
    body: "Trying to craft requests to access content or routes above your clearance, probing for information disclosure, or attempting to trigger unintended role changes is treated as a serious violation, separate from and in addition to any technical safeguards already in place. Report suspected weaknesses to a Sysadmin instead of testing them yourself.",
  },
  {
    title: "10. These rules can be updated",
    body: "As the network grows, these rules may be revised. Material changes will be reflected here, and continued participation after a revision means you accept the updated version. This page is always readable, logged in or not, so you can check back whenever you'd like.",
  },
];

export function VerifyPage() {
  const { user, requestVerification } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleVerify() {
    if (!agreed) return;
    setBusy(true);
    setError(null);
    try {
      await requestVerification();
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 1600);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Verification failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link to="/" className="text-xs text-muted hover:text-jade font-mono mb-6 inline-block transition-colors">
        ← back to blackroot.net
      </Link>
      <div className="text-center mb-10">
        <span className="text-xs font-mono text-jade tracking-[0.2em]">CLEARANCE UPGRADE</span>
        <h1 className="font-display text-2xl md:text-3xl text-mint mt-3 mb-4">
          <GlitchText text="COMMUNITY RULES & VERIFICATION" />
        </h1>
        <p className="text-sm text-muted font-mono leading-relaxed">
          This is the only self-service clearance change on the network. Read the rules below in full, then accept
          them to upgrade from Guest to Verified immediately.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        {RULES.map((rule, i) => (
          <motion.div
            key={rule.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
            className="panel p-5"
          >
            <h3 className="font-display text-sm text-jade mb-2">{rule.title}</h3>
            <p className="text-xs text-muted font-mono leading-relaxed">{rule.body}</p>
          </motion.div>
        ))}
      </div>

      {!user ? (
        <div className="panel p-6 text-center">
          <p className="text-sm text-muted font-mono mb-4">
            You'll need an account before you can accept these rules and verify.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary">
              create an account
            </Link>
            <Link to="/login" className="btn-ghost">
              sign in
            </Link>
          </div>
        </div>
      ) : user.role !== "guest" ? (
        <div className="panel p-6 text-center">
          <p className="text-sm text-jade font-mono">
            Your account already holds {user.role.toUpperCase()} clearance or higher — no action needed here.
          </p>
          <Link to="/dashboard" className="btn-ghost mt-4 inline-block">
            back to dashboard
          </Link>
        </div>
      ) : (
        <div className="panel relative p-6 overflow-hidden">
          {done && <SparkleBurst />}
          {done ? (
            <p className="text-jade font-display text-center text-glow decrypt-reveal">
              CLEARANCE UPGRADED — WELCOME, VERIFIED.
            </p>
          ) : (
            <>
              <label className="flex items-start gap-3 text-sm text-mint font-mono mb-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 accent-jade"
                />
                I have read and agree to all 10 rules above. I understand this is the only self-service clearance
                change available to my account.
              </label>
              {error && <p className="text-signal text-xs font-mono mb-4">{error}</p>}
              <button
                onClick={handleVerify}
                disabled={!agreed || busy}
                className="btn-primary w-full"
              >
                {busy ? "upgrading clearance..." : "accept rules & verify my account"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
