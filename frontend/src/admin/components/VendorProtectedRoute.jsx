import { Navigate } from "react-router-dom";

export default function VendorProtectedRoute({ children }) {
  const session = localStorage.getItem("shubh_admin_session");

  return session ? children : <Navigate to="/vendors" replace />;
}