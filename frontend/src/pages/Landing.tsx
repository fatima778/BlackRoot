import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { GlitchText } from "../components/GlitchText";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { FAQAccordion } from "../components/FAQAccordion";
import { NetworkCanvas } from "../components/NetworkCanvas";
import { FloatingReadouts } from "../components/FloatingReadouts";
import { HamburgerButton } from "../components/HamburgerButton";

const NAV_LINKS = [
  { href: "#tiers", label: "Clearance Tiers" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#why", label: "Why BLACKROOT" },
  { href: "#rules", label: "Community Rules" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

const TIERS = [
  {
    role: "GUEST",
    tagline: "Default clearance — anyone who signs up starts here.",
    accent: "border-hairline text-muted",
    description:
      "Every new account lands at Guest clearance. You get read access to the public channel — the Lobby — where announcements, onboarding material, and network-wide notices are posted. You cannot post, reply, or react yet, and channels above Guest clearance won't even appear in your channel list; they're not hidden behind a lock icon, they simply don't exist for you until your clearance changes. This is deliberate: it keeps the surface small for unverified accounts and keeps the deeper layers of the network invisible to automated scraping or casual snooping.",
    permissions: [
      "Read the public Lobby channel",
      "View your own profile and join date",
      "Accept the Community Rules to self-upgrade to Verified",
      "Cannot post, reply, or see gated channels",
    ],
  },
  {
    role: "VERIFIED",
    tagline: "Full member status — earned by accepting the rules, not paid for.",
    accent: "border-jade/40 text-jade",
    description:
      "Verified is the first real membership tier, and it's the only one you can grant yourself. Read the Community Rules in full, accept them, and your account is upgraded instantly — no waiting period, no admin approval needed. Verified members can post new threads, reply anywhere they have read access, and take part in every general-purpose channel on the network, like Gridworks. This tier exists to separate genuine participants from drive-by signups without adding friction like email verification loops or manual review queues.",
    permissions: [
      "Post new threads and replies",
      "Full access to general channels (e.g. Gridworks)",
      "Build a visible post history and reputation",
      "Eligible for Operative promotion by a Sysadmin",
    ],
  },
  {
    role: "OPERATIVE",
    tagline: "Trusted contributor — promoted by a Sysadmin, not self-service.",
    accent: "border-emerald text-mint",
    description:
      "Operative clearance is granted, not requested. A Sysadmin promotes accounts to Operative based on sustained, trustworthy participation — this is intentionally outside the account holder's control, the same way you can't grant yourself administrator rights on a shared system just by asking nicely. Operatives gain access to restricted channels like Blacksite Ops, where higher-signal, higher-stakes discussion happens, and their posts and replies can themselves be set to Operative-only visibility, letting them write for an audience that's already cleared the same bar they were.",
    permissions: [
      "Access to Operative-only channels (e.g. Blacksite Ops)",
      "Ability to post content visible only to Operative+ accounts",
      "Heavier weight given to flags and reports",
      "Still cannot access Sysadmin tooling or the audit log",
    ],
  },
  {
    role: "SYSADMIN",
    tagline: "Root access — invite-only, fully audited, cannot be self-granted.",
    accent: "border-jade bg-jade/10 text-jade",
    description:
      "Sysadmin is root. It's not obtainable through activity, reputation, or any in-product action — every Sysadmin account is granted directly by an existing Sysadmin through the admin console, and every single one of those actions is written to an immutable audit log with the actor, the target, and a timestamp. Sysadmins can change any account's clearance, revoke sessions, archive or lock channels, reassign an entry's clearance requirement, purge content, and regenerate the network's shared activation code. There's no route in the codebase, however cleverly crafted, that lets an account promote itself here — that boundary is enforced entirely server-side.",
    permissions: [
      "Full user & role management, including bulk session revocation",
      "Create, edit, archive, and lock channels",
      "Reassign clearance on any individual entry",
      "Read-only, append-only audit log of every privileged action",
    ],
  },
];

const ESCALATION_STEPS = [
  {
    step: "01",
    title: "Register an account",
    body: "Sign up with a handle, email, and password. Depending on network configuration, you may need the network's activation code — a single shared code a Sysadmin distributes and can regenerate at any time, not something issued to you individually. Your account is created at Guest clearance automatically — there's no form to fill out to request a different starting tier.",
  },
  {
    step: "02",
    title: "Read the Community Rules",
    body: "Every account can read the full rules document from the Verification page at any time, logged in or not. It covers conduct, posting standards, what gets you flagged, and what happens on repeated violations — nothing in it is hidden until after you agree.",
  },
  {
    step: "03",
    title: "Accept the rules to self-verify",
    body: "Check the box confirming you've read and agree to the rules, and submit. This is the one and only role change in the entire system a user can trigger for themselves — it moves you from Guest to Verified immediately, no queue, no manual approval, no waiting on an admin to notice you.",
  },
  {
    step: "04",
    title: "Participate and build standing",
    body: "As a Verified member, post, reply, and take part across every general-access channel. Consistent, trustworthy participation is what a Sysadmin looks at when deciding whether to extend Operative clearance — there's no points system or leaderboard gaming this, just judgment from people already holding elevated access.",
  },
  {
    step: "05",
    title: "Operative promotion — granted, not requested",
    body: "If and when a Sysadmin promotes you to Operative, you'll see new channels appear in your list immediately and gain the ability to post content gated to Operative-and-above audiences. There's no self-service button for this tier by design.",
  },
  {
    step: "06",
    title: "Sysadmin — invite-only, always audited",
    body: "The top tier is reserved for people who already run or maintain the network. It's granted directly by another Sysadmin through the admin console, and that action — like every privileged action — is permanently logged.",
  },
];

const WHY_FEATURES = [
  {
    title: "Server-Enforced, Not UI-Enforced",
    body: "Clearance checks happen in the database query itself and in middleware on every request — never just in a frontend component deciding what to render. Hiding a button is not the same as blocking the data, and this network only ever does the latter.",
  },
  {
    title: "No Silent Escalation Paths",
    body: "There is exactly one self-service role change — Guest to Verified, via rules acceptance — and it's the only one. Every other clearance change requires a Sysadmin and produces a permanent audit trail.",
  },
  {
    title: "Existence-Blind Access Control",
    body: "Try to load a channel or an admin route above your clearance and you get a 404, not a 403. An unprivileged account can't even confirm that the Sysadmin console exists, let alone what's inside it.",
  },
  {
    title: "Real Session Revocation",
    body: "Logging out — or a Sysadmin revoking your sessions — actually invalidates your refresh token server-side. Clearing your cookies isn't the security boundary; the database record backing your session is.",
  },
  {
    title: "Rate-Limited & Lockout-Protected",
    body: "Repeated failed logins lock an account temporarily rather than allowing unlimited guesses, and login/registration/search endpoints are all independently rate-limited against abuse.",
  },
  {
    title: "Redacted, Not Hidden",
    body: "Content above your clearance doesn't just fail to render — the server never sends the title, body, author, or replies in the first place. What you get instead is an explicit, honest placeholder telling you what clearance you'd need.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I registered on a Tuesday, read through the rules in about ten minutes, and was posting in Gridworks the same afternoon. No approval queue, no waiting on a moderator to notice me.",
    handle: "cipher_v",
    role: "VERIFIED",
  },
  {
    quote:
      "What sold me was realizing I couldn't find a way to fake my way into Blacksite even when I tried. The channel just doesn't exist in my list until a Sysadmin decides otherwise.",
    handle: "raven_op",
    role: "OPERATIVE",
  },
  {
    quote:
      "Every role change I make gets written to the audit log automatically — I don't have to remember to document anything. If someone asks who promoted whom and when, the answer's already there.",
    handle: "root_admin",
    role: "SYSADMIN",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is BLACKROOT, exactly?",
    a: "BLACKROOT is a clearance-gated discussion network built around four tiers of access — Guest, Verified, Operative, and Sysadmin. Instead of every member seeing the same channels and content, what you can read, post, and even know exists depends entirely on your current clearance level, enforced on the server for every request.",
  },
  {
    q: "How do I go from Guest to Verified?",
    a: "Read the full Community Rules on the Verification page, check the box confirming you agree, and submit. Your account is upgraded to Verified immediately — this is the only self-service clearance change in the system, deliberately designed so you don't need to wait on anyone.",
  },
  {
    q: "Can I request Operative or Sysadmin clearance myself?",
    a: "No, and this is intentional. Operative clearance is granted by a Sysadmin based on your participation and standing as a Verified member. Sysadmin clearance is granted directly by another Sysadmin, typically to people who help run or maintain the network, and always through the audited admin console — never through any self-service action.",
  },
  {
    q: "If a channel is above my clearance, will I even see it?",
    a: "No. Channels and entries above your clearance are excluded from the server's response entirely — they don't appear grayed-out or locked in a list you can browse. If you follow a direct link to a specific restricted entry, you'll see a redacted placeholder confirming something exists and what clearance it requires, but never its actual content.",
  },
  {
    q: "What happens if I break the Community Rules?",
    a: "Entries and replies can be flagged by any Verified member and reviewed by Operatives and Sysadmins. Depending on severity, a Sysadmin can lock a thread, purge content outright, or in serious or repeated cases, adjust an account's clearance downward. Every one of those actions is written to the permanent audit log.",
  },
  {
    q: "Is registration open to everyone, or does it require a code?",
    a: "That depends on the network's current configuration. Some deployments require a network activation code to register at all — one single code, controlled and distributed by a Sysadmin, not something issued per-person. Other deployments leave registration open entirely. Either way, every new account starts at Guest clearance regardless of how they got in.",
  },
  {
    q: "How does BLACKROOT prevent someone from just editing a request to grant themselves access?",
    a: "Every privileged action reads the account's role from a verified, signed session token — never from anything supplied in a request body, query string, or header. Even if you could technically construct and send a request to a Sysadmin-only route, the middleware checks your actual authenticated role first and returns a 404 before your request body is ever inspected.",
  },
  {
    q: "Can a Sysadmin see everything, including private replies?",
    a: "Sysadmins can access content gated to any clearance level, including Operative-only channels, since root access spans every tier by definition. Access to sensitive-clearance entries by a Sysadmin is itself logged in the audit trail, so there's a permanent record of when and by whom restricted content was viewed.",
  },
  {
    q: "What happens to my session if I lose my device or think my account is compromised?",
    a: "Log out from any device to immediately revoke that session server-side — it's not just a client-side cookie clear. If you've lost access entirely, a Sysadmin can revoke every active session tied to your account from the admin console in a single action.",
  },
  {
    q: "Does clearance ever expire or need renewal?",
    a: "No. Clearance is persistent once granted and only changes through an explicit action — your own rules acceptance for Verified, or a Sysadmin decision for Operative and above. There's no automatic downgrade for inactivity in the current design.",
  },
];

function AnimatedNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open, and auto-close on
  // resize up to desktop so it never gets stuck open behind the layout.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    function onResize() {
      if (window.innerWidth >= 768) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-30 transition-all duration-300 ${
        scrolled || mobileOpen ? "bg-void/90 backdrop-blur border-b border-hairline py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="font-display text-jade tracking-[0.25em] text-sm" onClick={() => setMobileOpen(false)}>
          BLACK<span className="text-mint">ROOT</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-muted">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-jade transition-colors">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          {user ? (
            <Link to="/dashboard" className="btn-primary !px-3 !py-1.5">
              dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-muted hover:text-mint">
                sign in
              </Link>
              <Link to="/register" className="btn-primary !px-3 !py-1.5">
                request access
              </Link>
            </>
          )}
        </div>
        <HamburgerButton open={mobileOpen} onClick={() => setMobileOpen((v) => !v)} className="md:hidden" />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-hairline bg-void/95 backdrop-blur"
          >
            <nav className="flex flex-col px-4 py-4 gap-1 text-sm font-mono">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 border-b border-hairline/60 text-muted hover:text-jade transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                {user ? (
                  <Link to="/dashboard" className="btn-primary w-full" onClick={() => setMobileOpen(false)}>
                    dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn-ghost w-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      sign in
                    </Link>
                    <Link to="/register" className="btn-primary w-full" onClick={() => setMobileOpen(false)}>
                      request access
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


export function LandingPage() {
  return (
    <div className="bg-void">
      <AnimatedNav />

      {/* HERO */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden scanline-overlay px-4"
      >
        <NetworkCanvas className="absolute inset-0 opacity-70" />
        <FloatingReadouts />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 50% 25%, rgba(47,230,166,0.16), transparent 70%), radial-gradient(ellipse 90% 60% at 50% 100%, rgba(5,13,9,0.9), transparent)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void/20 via-transparent to-void pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <span className="inline-block text-[11px] font-mono tracking-[0.2em] text-jade border border-jade/30 rounded-full px-3 py-1 mb-6">
            CLEARANCE-GATED NETWORK · EST. UPLINK ACTIVE
          </span>
          <h1 className="font-display text-3xl md:text-5xl text-mint leading-tight mb-5 text-glow">
            <GlitchText text="ACCESS IS EARNED, NOT ASSUMED." />
          </h1>
          <p className="text-sm md:text-base text-muted font-mono leading-relaxed max-w-xl mx-auto mb-8">
            BLACKROOT is a four-tier clearance network — Guest, Verified, Operative, Sysadmin — where what you can
            see, post, and even know exists is enforced on the server, not hidden behind a button in the UI. Read
            the rules, accept them, and you're Verified in seconds. Everything above that is earned.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-primary">
              request access →
            </Link>
            <a href="#tiers" className="btn-ghost">
              view clearance tiers
            </a>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="border-y border-hairline bg-panel/40 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter to={4} label="Clearance Tiers" />
          <AnimatedCounter to={128} suffix="+" label="Active Threads" />
          <AnimatedCounter to={99} suffix=".9%" label="Uplink Uptime" />
          <AnimatedCounter to={0} label="Silent Escalation Paths" />
        </div>
      </section>

      {/* CLEARANCE TIERS */}
      <section id="tiers" className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono text-jade tracking-[0.2em]">CLEARANCE TIERS</span>
          <h2 className="font-display text-2xl md:text-3xl text-mint mt-3 mb-4">
            <GlitchText text="FOUR LEVELS. ONE LADDER." />
          </h2>
          <p className="text-sm text-muted font-mono leading-relaxed">
            Every account sits at exactly one of four tiers at any given time. Here's what each one actually means —
            not just what it's called, but precisely what it unlocks and how you get there.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={`panel p-6 border-2 ${tier.accent.split(" ")[0]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-display text-lg ${tier.accent.split(" ").slice(1).join(" ")}`}>{tier.role}</h3>
                <span className="text-[10px] font-mono text-muted">TIER {i + 1}/4</span>
              </div>
              <p className="text-xs text-jade/80 font-mono mb-3">{tier.tagline}</p>
              <p className="text-sm text-muted/90 font-mono leading-relaxed mb-4">{tier.description}</p>
              <ul className="space-y-1.5">
                {tier.permissions.map((p) => (
                  <li key={p} className="text-xs text-mint/80 font-mono flex gap-2">
                    <span className="text-jade">▸</span>
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS / ESCALATION PATH */}
      <section id="how-it-works" className="bg-panel/30 border-y border-hairline px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono text-jade tracking-[0.2em]">THE ESCALATION PATH</span>
            <h2 className="font-display text-2xl md:text-3xl text-mint mt-3 mb-4">
              <GlitchText text="HOW CLEARANCE ACTUALLY CHANGES" />
            </h2>
            <p className="text-sm text-muted font-mono leading-relaxed">
              There is exactly one step you control yourself. Everything after it is earned through standing or
              granted by someone already holding root. Here's the full path, honestly laid out.
            </p>
          </div>
          <div className="space-y-6">
            {ESCALATION_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex gap-5 panel p-5"
              >
                <span className="font-display text-2xl text-jade/50 shrink-0">{s.step}</span>
                <div>
                  <h3 className="font-display text-sm text-mint mb-1.5">{s.title}</h3>
                  <p className="text-xs text-muted font-mono leading-relaxed">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/register" className="btn-primary">
              start at guest clearance →
            </Link>
          </div>
        </div>
      </section>

      {/* WHY BLACKROOT */}
      <section id="why" className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono text-jade tracking-[0.2em]">WHY BLACKROOT</span>
          <h2 className="font-display text-2xl md:text-3xl text-mint mt-3 mb-4">
            <GlitchText text="ACCESS CONTROL THAT ACTUALLY HOLDS" />
          </h2>
          <p className="text-sm text-muted font-mono leading-relaxed">
            Plenty of platforms show you a lock icon and call it security. Here's what's actually different about how
            BLACKROOT enforces its clearance system underneath the interface.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {WHY_FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="panel p-6"
            >
              <div className="w-8 h-8 rounded-sm bg-jade/10 border border-jade/30 flex items-center justify-center text-jade font-mono text-xs mb-4">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-display text-sm text-mint mb-2">{f.title}</h3>
              <p className="text-xs text-muted font-mono leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-panel/30 border-y border-hairline px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono text-jade tracking-[0.2em]">FROM THE NETWORK</span>
            <h2 className="font-display text-2xl md:text-3xl text-mint mt-3 mb-4">
              <GlitchText text="VOICES ACROSS ALL THREE TIERS" />
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.handle}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="panel p-6"
              >
                <p className="text-sm text-mint/85 font-mono leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-jade">{t.handle}</span>
                  <span className="text-muted">· {t.role}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RULES PREVIEW */}
      <section id="rules" className="max-w-4xl mx-auto px-4 py-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono text-jade tracking-[0.2em]">COMMUNITY RULES</span>
          <h2 className="font-display text-2xl md:text-3xl text-mint mt-3 mb-4">
            <GlitchText text="READ THEM ONCE. THAT'S THE WHOLE REQUIREMENT." />
          </h2>
          <p className="text-sm text-muted font-mono leading-relaxed">
            The full rules document lives on the Verification page and is readable whether or not you're logged in.
            Here's the short version of what it covers before you get there.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {[
            "No harassment, doxxing, or targeted abuse of other members, at any clearance level.",
            "No sharing of content that violates another platform's terms or the law in your jurisdiction.",
            "Respect channel clearance — don't attempt to relay Operative or Sysadmin content to lower tiers.",
            "Flag content you believe violates these rules rather than escalating in-thread.",
            "Sysadmin decisions on clearance and moderation are final but always logged and reviewable.",
            "Repeated or severe violations can result in a clearance downgrade, not just a warning.",
          ].map((rule) => (
            <div key={rule} className="panel p-4 text-xs text-muted font-mono leading-relaxed flex gap-2">
              <span className="text-jade shrink-0">§</span>
              {rule}
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/verify" className="btn-primary">
            read full rules & verify →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-panel/30 border-y border-hairline px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-jade tracking-[0.2em]">FAQ</span>
            <h2 className="font-display text-2xl md:text-3xl text-mint mt-3 mb-4">
              <GlitchText text="QUESTIONS PEOPLE ACTUALLY ASK" />
            </h2>
          </div>
          <FAQAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="font-display text-2xl md:text-3xl text-jade text-glow mb-4">
          <GlitchText text="REQUEST YOUR UPLINK" />
        </h2>
        <p className="text-sm text-muted font-mono leading-relaxed max-w-xl mx-auto mb-8">
          Registration takes under a minute. Verification takes as long as it takes you to read one page. Everything
          after that is earned, logged, and enforced the same way for every account on the network.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register" className="btn-primary">
            create an account →
          </Link>
          <Link to="/login" className="btn-ghost">
            already have access
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-hairline px-4 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-xs font-mono">
          <div>
            <span className="font-display text-jade tracking-[0.2em]">
              BLACK<span className="text-mint">ROOT</span>
            </span>
            <p className="text-muted mt-3 leading-relaxed">
              A four-tier clearance network built on server-enforced access control, not interface tricks.
            </p>
          </div>
          <div>
            <h4 className="text-mint mb-3 tracking-wide">NETWORK</h4>
            <ul className="space-y-2 text-muted">
              <li><a href="#tiers" className="hover:text-jade">Clearance Tiers</a></li>
              <li><a href="#how-it-works" className="hover:text-jade">Escalation Path</a></li>
              <li><a href="#why" className="hover:text-jade">Why BLACKROOT</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-mint mb-3 tracking-wide">ACCOUNT</h4>
            <ul className="space-y-2 text-muted">
              <li><Link to="/register" className="hover:text-jade">Request Access</Link></li>
              <li><Link to="/login" className="hover:text-jade">Sign In</Link></li>
              <li><Link to="/verify" className="hover:text-jade">Community Rules</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-mint mb-3 tracking-wide">LEGAL-ISH</h4>
            <ul className="space-y-2 text-muted">
              <li><a href="#faq" className="hover:text-jade">FAQ</a></li>
              <li><a href="#rules" className="hover:text-jade">Rules Summary</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-hairline/60 text-[11px] text-muted font-mono">
          BLACKROOT // uplink secure // clearance enforced server-side, always.
        </div>
      </footer>
    </div>
  );
}
