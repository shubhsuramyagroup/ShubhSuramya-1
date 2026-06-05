import { Navigate } from "react-router-dom";

export default function FlatSaleProtectedRoute({ children }) {
  const session = localStorage.getItem("shubh_admin_session");

  return session ? children : <Navigate to="/sales" replace />;
}