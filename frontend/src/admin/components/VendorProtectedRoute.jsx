import { Navigate } from "react-router-dom";

export default function VendorProtectedRoute({ children }) {
  const vendor = localStorage.getItem("vendor");

  console.log("Vendor Session:", vendor);

  if (!vendor) {
    return <Navigate to="/vendors" replace />;
  }

  return children;
}