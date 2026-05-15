import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { signOut } from "firebase/auth";

import { auth } from "../../firebase";

import { useNavigate } from "react-router-dom";

import { getProjects } from "../../services/projectService";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();

      setProjects(data);

      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  // Stats

  const totalProjects = projects.length;

  const residentialProjects = projects.filter((item) =>
    item.type?.toLowerCase().includes("residential"),
  ).length;

  const commercialProjects = projects.filter((item) =>
    item.type?.toLowerCase().includes("commercial"),
  ).length;

  const upcomingProjects = projects.filter((item) =>
    item.status?.toLowerCase().includes("upcoming"),
  ).length;

  const ongoingProjects = projects.filter((item) =>
    item.status?.toLowerCase().includes("ongoing"),
  ).length;

  const completedProjects = projects.filter((item) =>
    item.status?.toLowerCase().includes("completed"),
  ).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);

      localStorage.removeItem("admin");

      navigate("/admin");
    } catch (error) {
      console.log(error);
    }
  };

  const dashboardCards = [
    {
      title: "Total Projects",
      value: totalProjects,
      bg: "#1F2A44",
    },

    {
      title: "Residential",
      value: residentialProjects,
      bg: "#E4572E",
    },

    {
      title: "Commercial",
      value: commercialProjects,
      bg: "#0E9F6E",
    },

    {
      title: "Upcoming",
      value: upcomingProjects,
      bg: "#7C3AED",
    },

    {
      title: "Ongoing",
      value: ongoingProjects,
      bg: "#D97706",
    },

    {
      title: "Completed",
      value: completedProjects,
      bg: "#2563EB",
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#F8F7F4",
          fontSize: "24px",
          color: "#1F2A44",
        }}
      >
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#F8F7F4",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1450px",
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "44px",
                color: "#1F2A44",
                marginBottom: "8px",
              }}
            >
              Dashboard
            </h1>

            <p
              style={{
                color: "#777",
                fontSize: "15px",
              }}
            >
              Manage your real estate projects
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
            }}
          >
            <Link
              to="/admin/add-project"
              style={{
                textDecoration: "none",
              }}
            >
              <button
                style={{
                  padding: "15px 24px",
                  border: "none",
                  borderRadius: "14px",
                  background: "#E4572E",
                  color: "#fff",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "15px",
                  boxShadow: "0 8px 20px rgba(228,87,46,0.25)",
                }}
              >
                + Add New Project
              </button>
            </Link>

            <button
              onClick={handleLogout}
              style={{
                padding: "15px 24px",
                border: "none",
                borderRadius: "14px",
                background: "#1F2A44",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: "24px",
            marginBottom: "45px",
          }}
        >
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              style={{
                background: card.bg,
                padding: "28px",
                borderRadius: "24px",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  opacity: "0.9",
                  marginBottom: "12px",
                }}
              >
                {card.title}
              </p>

              <h2
                style={{
                  fontSize: "42px",
                  fontWeight: "700",
                }}
              >
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Recent Projects */}

        <div
          style={{
            background: "#fff",
            borderRadius: "26px",
            padding: "30px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "28px",
                  color: "#1F2A44",
                }}
              >
                Recent Projects
              </h2>

              <p
                style={{
                  color: "#777",
                  marginTop: "6px",
                }}
              >
                Latest uploaded projects
              </p>
            </div>

            <Link
              to="/admin/projects"
              style={{
                textDecoration: "none",
              }}
            >
              <button
                style={{
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                View All
              </button>
            </Link>
          </div>

          {projects.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "28px",
                  color: "#1F2A44",
                  marginBottom: "10px",
                }}
              >
                No Projects Found
              </h3>

              <p
                style={{
                  color: "#777",
                }}
              >
                Start adding your first project
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#F8F7F4",
                    }}
                  >
                    <th
                      style={{
                        padding: "18px",
                        textAlign: "left",
                      }}
                    >
                      Image
                    </th>

                    <th
                      style={{
                        padding: "18px",
                        textAlign: "left",
                      }}
                    >
                      Title
                    </th>

                    <th
                      style={{
                        padding: "18px",
                        textAlign: "left",
                      }}
                    >
                      Type
                    </th>

                    <th
                      style={{
                        padding: "18px",
                        textAlign: "left",
                      }}
                    >
                      Status
                    </th>

                    <th
                      style={{
                        padding: "18px",
                        textAlign: "left",
                      }}
                    >
                      Location
                    </th>

                    <th
                      style={{
                        padding: "18px",
                        textAlign: "left",
                      }}
                    >
                      Price
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {projects.slice(0, 6).map((project) => (
                    <tr
                      key={project.id}
                      style={{
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <td
                        style={{
                          padding: "18px",
                        }}
                      >
                        <img
                          src={project.mainImage}
                          alt={project.title}
                          style={{
                            width: "90px",
                            height: "70px",
                            objectFit: "cover",
                            borderRadius: "12px",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          padding: "18px",
                          fontWeight: "600",
                          color: "#1F2A44",
                        }}
                      >
                        {project.title}
                      </td>

                      <td
                        style={{
                          padding: "18px",
                          color: "#555",
                        }}
                      >
                        {project.type}
                      </td>

                      <td
                        style={{
                          padding: "18px",
                        }}
                      >
                        <span
                          style={{
                            padding: "8px 14px",
                            borderRadius: "999px",
                            background: project.status
                              ?.toLowerCase()
                              .includes("completed")
                              ? "#DCFCE7"
                              : project.status
                                    ?.toLowerCase()
                                    .includes("ongoing")
                                ? "#FEF3C7"
                                : "#E0E7FF",

                            color: "#111",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          {project.status}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "18px",
                          color: "#555",
                        }}
                      >
                        {project.location}
                      </td>

                      <td
                        style={{
                          padding: "18px",
                          fontWeight: "600",
                          color: "#E4572E",
                        }}
                      >
                        {project.startingPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
