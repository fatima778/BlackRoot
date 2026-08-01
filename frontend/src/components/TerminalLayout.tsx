import { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "./RoleBadge";
import { HamburgerButton } from "./HamburgerButton";
import { meetsClearance } from "../utils/roles";

export function TerminalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close the mobile drawer on every route change so it never lingers open
  // after tapping a link, and lock body scroll only while it's open.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    setMobileOpen(false);
    await logout();
    navigate("/");
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setMobileOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "text-jade" : "text-muted hover:text-mint transition-colors";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-hairline bg-panel/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
          <NavLink to="/" className="font-display text-jade tracking-[0.2em] text-sm shrink-0">
            BLACK<span className="text-mint">ROOT</span>
          </NavLink>

          {/* Desktop: search + nav — hidden below md */}
          <form onSubmit={handleSearchSubmit} className="hidden md:block flex-1 max-w-xs">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search transmissions..."
              className="w-full bg-panelRaised border border-hairline rounded-sm px-3 py-1.5 text-xs font-mono
                text-mint placeholder:text-muted focus:border-jade focus:outline-none transition-colors"
            />
          </form>

          <nav className="hidden md:flex items-center gap-4 text-xs font-mono shrink-0">
            <NavLink to="/dashboard" className={navLinkClass}>
              channels
            </NavLink>
            {user?.role === "guest" && (
              <NavLink to="/verify" className="text-signal hover:text-mint transition-colors">
                get verified
              </NavLink>
            )}
            {user && meetsClearance(user.role, "sysadmin") && (
              <NavLink to="/admin" className={navLinkClass}>
                console
              </NavLink>
            )}
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-hairline">
                <span className="text-mint">{user.alias}</span>
                <RoleBadge role={user.role} />
                <button onClick={handleLogout} className="text-muted hover:text-signal ml-1">
                  [logout]
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="text-muted hover:text-mint">
                [login]
              </NavLink>
            )}
          </nav>

          {/* Mobile: compact identity chip + hamburger */}
          <div className="flex md:hidden items-center gap-3 ml-auto">
            {user && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="text-mint">{user.alias}</span>
                <RoleBadge role={user.role} />
              </div>
            )}
            <HamburgerButton open={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
          </div>
        </div>

        {/* Mobile slide-down drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-hairline bg-panel/95 backdrop-blur"
            >
              <form onSubmit={handleSearchSubmit} className="px-4 pt-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="search transmissions..."
                  className="w-full bg-panelRaised border border-hairline rounded-sm px-3 py-2 text-sm font-mono
                    text-mint placeholder:text-muted focus:border-jade focus:outline-none transition-colors"
                />
              </form>
              <nav className="flex flex-col px-4 py-3 text-sm font-mono">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `py-3 border-b border-hairline/60 ${isActive ? "text-jade" : "text-muted"}`
                  }
                >
                  channels
                </NavLink>
                {user?.role === "guest" && (
                  <NavLink to="/verify" className="py-3 border-b border-hairline/60 text-signal">
                    get verified
                  </NavLink>
                )}
                {user && meetsClearance(user.role, "sysadmin") && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `py-3 border-b border-hairline/60 ${isActive ? "text-jade" : "text-muted"}`
                    }
                  >
                    console
                  </NavLink>
                )}
                {user ? (
                  <button onClick={handleLogout} className="py-3 text-left text-signal">
                    [logout]
                  </button>
                ) : (
                  <NavLink to="/login" className="py-3 text-muted">
                    [login]
                  </NavLink>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-hairline py-4 text-center text-[11px] text-muted font-mono">
        <Link to="/" className="hover:text-jade transition-colors">
          ← back to blackroot.net
        </Link>
        <span className="mx-2 text-hairline">·</span>
        BLACKROOT // uplink secure // clearance enforced server-side
      </footer>
    </div>
  );
}
