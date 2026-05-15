import { useNavigate } from "react-router-dom";

import { logoutAdmin } from "../../services/authService";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();

    localStorage.removeItem("admin");

    navigate("/admin");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F7F4",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            color: "#1F2A44",
          }}
        >
          Admin Dashboard
        </h1>

        <button
          onClick={handleLogout}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "12px",
            background: "#E4572E",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}