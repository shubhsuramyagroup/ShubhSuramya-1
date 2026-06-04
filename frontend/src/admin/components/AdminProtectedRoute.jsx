import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({
  children,
}) {
  const user = localStorage.getItem("admin");

  if (!user) {
    return <Navigate to="/admin" />;
  }

  return children;
}