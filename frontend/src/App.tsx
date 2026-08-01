import { Routes, Route } from "react-router-dom";
import { TerminalLayout } from "./components/TerminalLayout";
import { RequireAuth } from "./components/RequireAuth";
import { LandingPage } from "./pages/Landing";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { VerifyPage } from "./pages/Verify";
import { ForumPage } from "./pages/Forum";
import { ChannelPage } from "./pages/Channel";
import { EntryPage } from "./pages/Entry";
import { SearchResultsPage } from "./pages/SearchResults";
import { AdminPage } from "./pages/Admin";
import { NotFoundPage } from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route element={<TerminalLayout />}>
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ForumPage />
            </RequireAuth>
          }
        />
        <Route
          path="/channels/:slug"
          element={
            <RequireAuth>
              <ChannelPage />
            </RequireAuth>
          }
        />
        <Route
          path="/entries/:entryId"
          element={
            <RequireAuth>
              <EntryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/search"
          element={
            <RequireAuth>
              <SearchResultsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth minRole="sysadmin">
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
