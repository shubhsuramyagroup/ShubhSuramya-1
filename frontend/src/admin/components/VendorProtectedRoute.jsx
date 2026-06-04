import { Navigate } from "react-router-dom";

export default function VendorProtectedRoute({ children }) {
  const vendor = localStorage.getItem("vendor");

  if (!vendor) {
    return <Navigate to="/vendors" replace />;
  }

  return children;
}