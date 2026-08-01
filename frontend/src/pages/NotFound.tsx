import { Link } from "react-router-dom";
import { GlitchText } from "../components/GlitchText";

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto text-center mt-16 px-4">
      <p className="font-display text-5xl text-signal mb-4 animate-flicker">404</p>
      <h1 className="font-display text-lg text-mint mb-2">
        <GlitchText text="SIGNAL LOST" />
      </h1>
      <p className="text-xs text-muted font-mono mb-6">
        This route doesn't exist, or your clearance doesn't reach it. Either way, nothing more will be said.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link to="/dashboard" className="btn-ghost">
          return to channels
        </Link>
        <Link to="/" className="text-xs text-muted hover:text-jade font-mono transition-colors">
          or go home →
        </Link>
      </div>
    </div>
  );
}
