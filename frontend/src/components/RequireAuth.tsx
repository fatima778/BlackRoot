import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../api/client";
import { meetsClearance } from "../utils/roles";

export function RequireAuth({ children, minRole }: { children: JSX.Element; minRole?: Role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center text-muted font-mono text-sm py-16">establishing uplink...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (minRole && !meetsClearance(user.role, minRole)) return <Navigate to="/404" replace />;
  return children;
}
