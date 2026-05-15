import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getProjects,
  deleteProject,
} from "../../services/projectService";

export default function AllProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

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

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
      await deleteProject(id);

      setProjects(
        projects.filter(
          (project) => project.id !== id
        )
      );

      alert("Project Deleted");
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          background: "#F8F7F4",
        }}
      >
        Loading Projects...
      </div>
    );
  }

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
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "35px",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            marginBottom: "30px",
            gap: "20px"
          }}>
            <button
            type="button"
            onClick={() => (window.location.href = "/admin/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#1F2A44",
              fontSize: "15px",
              fontWeight: "600",
              padding: "0",
            }}
          >
            ← Back
          </button>
            <h1
              style={{
                fontSize: "42px",
                color: "#1F2A44",
                marginBottom: "8px",
              }}
            >
              All Projects
            </h1>

            <p
              style={{
                color: "#666",
                fontSize: "15px",
              }}
            >
              Manage your real estate projects
            </p>
          </div>

          <Link
            to="/admin/add-project"
            style={{
              textDecoration: "none",
            }}
          >
            <button
              style={{
                padding: "14px 24px",
                border: "none",
                borderRadius: "12px",
                background: "#E4572E",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              + Add New Project
            </button>
          </Link>
        </div>

        {/* Empty State */}

        {projects.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "80px 20px",
              borderRadius: "24px",
              textAlign: "center",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <h2
              style={{
                fontSize: "30px",
                color: "#1F2A44",
                marginBottom: "10px",
              }}
            >
              No Projects Found
            </h2>

            <p
              style={{
                color: "#666",
                marginBottom: "25px",
              }}
            >
              Start by adding your first
              project
            </p>

            <button
              onClick={() =>
                navigate(
                  "/admin/add-project"
                )
              }
              style={{
                padding: "14px 24px",
                border: "none",
                borderRadius: "12px",
                background: "#E4572E",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Add Project
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(340px,1fr))",
              gap: "28px",
            }}
          >
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow:
                    "0 6px 30px rgba(0,0,0,0.06)",
                  transition: "0.3s",
                }}
              >
                {/* Image */}

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <img
                    src={
                      project.mainImage ||
                      "https://via.placeholder.com/600x400"
                    }
                    alt={project.title}
                    style={{
                      width: "100%",
                      height: "260px",
                      objectFit: "cover",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: "18px",
                      left: "18px",
                      background: "#fff",
                      padding: "8px 14px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1F2A44",
                    }}
                  >
                    {project.status ||
                      "Ongoing"}
                  </div>
                </div>

                {/* Content */}

                <div
                  style={{
                    padding: "24px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "24px",
                      color: "#1F2A44",
                      marginBottom: "10px",
                    }}
                  >
                    {project.title}
                  </h2>

                  <p
                    style={{
                      color: "#777",
                      fontSize: "14px",
                      lineHeight: "24px",
                      marginBottom: "18px",
                    }}
                  >
                    {project.description?.slice(
                      0,
                      110
                    )}
                    ...
                  </p>

                  {/* Details */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "14px",
                      marginBottom: "22px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#888",
                          fontSize: "13px",
                        }}
                      >
                        Location
                      </p>

                      <h4
                        style={{
                          color: "#1F2A44",
                          marginTop: "4px",
                        }}
                      >
                        {project.location}
                      </h4>
                    </div>

                    <div>
                      <p
                        style={{
                          color: "#888",
                          fontSize: "13px",
                        }}
                      >
                        Type
                      </p>

                      <h4
                        style={{
                          color: "#1F2A44",
                          marginTop: "4px",
                        }}
                      >
                        {project.type}
                      </h4>
                    </div>

                    <div>
                      <p
                        style={{
                          color: "#888",
                          fontSize: "13px",
                        }}
                      >
                        Area
                      </p>

                      <h4
                        style={{
                          color: "#1F2A44",
                          marginTop: "4px",
                        }}
                      >
                        {project.area}
                      </h4>
                    </div>

                    <div>
                      <p
                        style={{
                          color: "#888",
                          fontSize: "13px",
                        }}
                      >
                        Price
                      </p>

                      <h4
                        style={{
                          color: "#E4572E",
                          marginTop: "4px",
                        }}
                      >
                        {
                          project.startingPrice
                        }
                      </h4>
                    </div>
                  </div>

                  {/* Buttons */}

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                    }}
                  >
                    <Link
                      to={`/admin/edit-project/${project.id}`}
                      style={{
                        flex: 1,
                        textDecoration: "none",
                      }}
                    >
                      <button
                        style={{
                          width: "100%",
                          padding: "14px",
                          border: "none",
                          borderRadius: "12px",
                          background:
                            "#1F2A44",
                          color: "#fff",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </Link>

                    <button
                      onClick={() =>
                        handleDelete(
                          project.id
                        )
                      }
                      style={{
                        flex: 1,
                        padding: "14px",
                        border: "none",
                        borderRadius: "12px",
                        background:
                          "#E4572E",
                        color: "#fff",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}