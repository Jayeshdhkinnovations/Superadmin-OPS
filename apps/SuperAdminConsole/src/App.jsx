import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ConsoleLayout from "./components/layout/ConsoleLayout";
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import Overview from "./pages/Overview";
import Logs from "./pages/Logs";
import Companies from "./pages/Companies";
import AuditLog from "./pages/AuditLog";
import Approval from "./pages/Approval";
import SubAdmins from "./pages/SubAdmins";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<ConsoleLayout />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/approval" element={<Approval />} />
            <Route path="/sub-admins" element={<SubAdmins />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
