import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProjects, deleteProject } from "../../services/projectService";

export default function AllProjects() {
  const navigate = useNavigate();

  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modalProject,  setModalProject]  = useState(null);  // project to delete
  const [inputName,     setInputName]     = useState("");
  const [error,         setError]         = useState("");
  const [deleting,      setDeleting]      = useState(false);
  const [toast,         setToast]         = useState("");

  // ── Fetch projects on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // ── Open modal ───────────────────────────────────────────────────────────
  const openModal = (project) => {
    setModalProject(project);
    setInputName("");
    setError("");
  };

  // ── Close modal ──────────────────────────────────────────────────────────
  const closeModal = () => {
    if (deleting) return;          // block close while delete is in progress
    setModalProject(null);
    setInputName("");
    setError("");
  };

  // ── Show toast then auto-hide ────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Handle delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    // Exact, case-sensitive, same-type comparison
    if (inputName !== modalProject.title) {
      setError("Project name does not match. Deletion cancelled.");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteProject(modalProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== modalProject.id));
      setModalProject(null);
      showToast("Project deleted successfully");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Deletion failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: "22px", background: "#F8F7F4",
      }}>
        Loading Projects...
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", padding: "40px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "35px",
          flexWrap: "wrap", gap: "20px",
        }}>
          <div style={{
            display: "flex", justifyContent: "start",
            alignItems: "center", marginBottom: "30px", gap: "20px",
          }}>
            <button
              type="button"
              onClick={() => (window.location.href = "/admin/dashboard")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "none", border: "none", cursor: "pointer",
                color: "#1F2A44", fontSize: "15px", fontWeight: "600", padding: "0",
              }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: "42px", color: "#1F2A44", marginBottom: "8px" }}>
              All Projects
            </h1>
            <p style={{ color: "#666", fontSize: "15px" }}>
              Manage your real estate projects
            </p>
          </div>

          <Link to="/admin/add-project" style={{ textDecoration: "none" }}>
            <button style={{
              padding: "14px 24px", border: "none", borderRadius: "12px",
              background: "#E4572E", color: "#fff", fontWeight: "600",
              cursor: "pointer", fontSize: "15px",
            }}>
              + Add New Project
            </button>
          </Link>
        </div>

        {/* Empty State */}
        {projects.length === 0 ? (
          <div style={{
            background: "#fff", padding: "80px 20px", borderRadius: "24px",
            textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}>
            <h2 style={{ fontSize: "30px", color: "#1F2A44", marginBottom: "10px" }}>
              No Projects Found
            </h2>
            <p style={{ color: "#666", marginBottom: "25px" }}>
              Start by adding your first project
            </p>
            <button
              onClick={() => navigate("/admin/add-project")}
              style={{
                padding: "14px 24px", border: "none", borderRadius: "12px",
                background: "#E4572E", color: "#fff", fontWeight: "600", cursor: "pointer",
              }}
            >
              Add Project
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
            gap: "28px",
          }}>
            {projects.map((project) => (
              <div key={project.id} style={{
                background: "#fff", borderRadius: "24px",
                overflow: "hidden", boxShadow: "0 6px 30px rgba(0,0,0,0.06)", transition: "0.3s",
              }}>
                {/* Image */}
                <div style={{ position: "relative" }}>
                  <img
                    src={project.mainImage || "https://via.placeholder.com/600x400"}
                    alt={project.title}
                    style={{ width: "100%", height: "260px", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute", top: "18px", left: "18px",
                    background: "#fff", padding: "8px 14px", borderRadius: "999px",
                    fontSize: "13px", fontWeight: "600", color: "#1F2A44",
                  }}>
                    {project.status || "Ongoing"}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "24px" }}>
                  <h2 style={{ fontSize: "24px", color: "#1F2A44", marginBottom: "10px" }}>
                    {project.title}
                  </h2>
                  <p style={{ color: "#777", fontSize: "14px", lineHeight: "24px", marginBottom: "18px" }}>
                    {project.description?.slice(0, 110)}...
                  </p>

                  {/* Details */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: "14px", marginBottom: "22px",
                  }}>
                    <div>
                      <p style={{ color: "#888", fontSize: "13px" }}>Location</p>
                      <h4 style={{ color: "#1F2A44", marginTop: "4px" }}>{project.location}</h4>
                    </div>
                    <div>
                      <p style={{ color: "#888", fontSize: "13px" }}>Type</p>
                      <h4 style={{ color: "#1F2A44", marginTop: "4px" }}>{project.type}</h4>
                    </div>
                    <div>
                      <p style={{ color: "#888", fontSize: "13px" }}>Area</p>
                      <h4 style={{ color: "#1F2A44", marginTop: "4px" }}>{project.area}</h4>
                    </div>
                    <div>
                      <p style={{ color: "#888", fontSize: "13px" }}>Price</p>
                      <h4 style={{ color: "#E4572E", marginTop: "4px" }}>{project.startingPrice}</h4>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Link to={`/admin/edit-project/${project.id}`} style={{ flex: 1, textDecoration: "none" }}>
                      <button style={{
                        width: "100%", padding: "14px", border: "none",
                        borderRadius: "12px", background: "#1F2A44",
                        color: "#fff", fontWeight: "600", cursor: "pointer",
                      }}>
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => openModal(project)}
                      style={{
                        flex: 1, padding: "14px", border: "none",
                        borderRadius: "12px", background: "#E4572E",
                        color: "#fff", fontWeight: "600", cursor: "pointer",
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

      {/* ── Delete Confirmation Modal ── */}
      {modalProject && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeModal}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(31,42,68,0.5)",
              backdropFilter: "blur(3px)",
              zIndex: 1000,
            }}
          />

          {/* Modal box */}
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1001, width: "min(90vw, 460px)",
            background: "#fff", borderRadius: "24px",
            boxShadow: "0 24px 80px rgba(31,42,68,0.2)",
            padding: "36px 32px 28px",
          }}>
            {/* Warning icon */}
            <div style={{ textAlign: "center", marginBottom: "16px", fontSize: "40px" }}>
              ⚠️
            </div>

            {/* Title */}
            <h2 style={{
              textAlign: "center", fontSize: "22px",
              fontWeight: "700", color: "#1F2A44", marginBottom: "10px",
            }}>
              Delete Project
            </h2>

            {/* Info */}
            <p style={{ textAlign: "center", color: "#666", fontSize: "14px", lineHeight: "1.6", marginBottom: "8px" }}>
              This action is <strong style={{ color: "#E4572E" }}>permanent</strong> and cannot be undone.
            </p>
            <p style={{ textAlign: "center", color: "#444", fontSize: "14px", marginBottom: "16px" }}>
              Type the project name exactly to confirm:
            </p>

            {/* Project name display */}
            <div style={{
              background: "#F8F7F4", border: "1.5px dashed #CBD0D8",
              borderRadius: "10px", padding: "10px 16px",
              textAlign: "center", marginBottom: "16px",
              fontFamily: "monospace", fontSize: "15px",
              fontWeight: "700", color: "#1F2A44",
              userSelect: "all",
            }}>
              {modalProject.title}
            </div>

            {/* Input */}
            <input
              type="text"
              value={inputName}
              onChange={(e) => { setInputName(e.target.value); setError(""); }}
              placeholder="Type project name here..."
              disabled={deleting}
              style={{
                width: "100%", padding: "13px 16px",
                borderRadius: "12px", boxSizing: "border-box",
                border: `2px solid ${error ? "#E4572E" : inputName === modalProject.title && inputName ? "#22C55E" : "#E2E5EB"}`,
                fontSize: "15px", color: "#1F2A44", outline: "none",
                marginBottom: "8px",
                background: deleting ? "#F8F7F4" : "#fff",
              }}
            />

            {/* Live match hint */}
            {inputName.length > 0 && !error && (
              <p style={{
                fontSize: "12px", fontWeight: "600", marginBottom: "8px",
                color: inputName === modalProject.title ? "#22C55E" : "#E4572E",
              }}>
                {inputName === modalProject.title ? "✓ Name matches" : "✗ Name does not match yet"}
              </p>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "#FFF1ED", border: "1px solid #F9C5B3",
                borderRadius: "10px", padding: "10px 14px",
                marginBottom: "12px", fontSize: "13px",
                color: "#C0391B", fontWeight: "500",
              }}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                onClick={closeModal}
                disabled={deleting}
                style={{
                  flex: 1, padding: "14px", borderRadius: "12px",
                  border: "2px solid #E2E5EB", background: "#fff",
                  color: "#1F2A44", fontWeight: "600", fontSize: "15px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting || !inputName}
                style={{
                  flex: 1, padding: "14px", borderRadius: "12px",
                  border: "none",
                  background: deleting || !inputName ? "#F3C4B8" : "#E4572E",
                  color: "#fff", fontWeight: "700", fontSize: "15px",
                  cursor: deleting || !inputName ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px",
                }}
              >
                {deleting ? (
                  <>
                    <span style={{
                      width: "16px", height: "16px", border: "2.5px solid rgba(255,255,255,0.4)",
                      borderTop: "2.5px solid #fff", borderRadius: "50%",
                      display: "inline-block", animation: "spin 0.7s linear infinite",
                    }} />
                    Deleting...
                  </>
                ) : "Delete Project"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Success Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 2000,
          background: "#1F2A44", color: "#fff", padding: "14px 22px",
          borderRadius: "14px", fontWeight: "600", fontSize: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}