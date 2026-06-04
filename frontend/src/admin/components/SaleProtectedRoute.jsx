import { Navigate } from "react-router-dom";

export default function SaleProtectedRoute({ children }) {
  const saleUser = localStorage.getItem("sale");

  if (!saleUser) {
    return <Navigate to="/sales" replace />;
  }

  return children;
}