import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProjects, deleteProject } from "../../services/projectService";
import { Toast, BackButton, PageHeader, DeleteModal } from "../components/Adminshared ";

export default function AllProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Delete modal
  const [modalProject, setModalProject] = useState(null);
  const [inputName, setInputName] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Failed to load projects." });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (project) => {
    setModalProject(project);
    setInputName("");
    setError("");
  };

  const closeModal = () => {
    if (deleting) return;
    setModalProject(null);
    setInputName("");
    setError("");
  };

  const handleDelete = async () => {
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
      setToast({ type: "success", message: "Project deleted successfully." });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Deletion failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 rounded-full border-[3px] border-[#E4572E]/20 border-t-[#E4572E]"
             style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-[#1F2A44] font-semibold text-sm">Loading projects…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Toast show={toast} onClose={() => setToast(null)} />

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100
                      px-4 sm:px-8 h-14 flex items-center gap-4">
        <BackButton onClick={() => navigate("/admin/dashboard")} label="Dashboard" />
        <span className="text-gray-200 text-lg">|</span>
        <span className="text-[#1F2A44] font-semibold text-sm">All Projects</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <PageHeader
          eyebrow="Portfolio"
          title="All Projects"
          subtitle="Manage your real estate projects"
          actions={
            <Link to="/admin/add-project">
              <button className="inline-flex items-center gap-1.5 bg-[#E4572E] text-white
                                 px-5 py-2.5 rounded-full text-[12px] font-semibold tracking-wide
                                 hover:bg-[#c93d1e] hover:scale-[1.03] transition-all duration-200">
                + Add New Project
              </button>
            </Link>
          }
        />

        {/* Empty state */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm
                          flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFF0EC] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="1.5"
                   strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 className="text-[#1F2A44] font-semibold text-xl mb-2">No Projects Found</h2>
            <p className="text-gray-400 text-sm mb-6">Start by adding your first project</p>
            <button
              onClick={() => navigate("/admin/add-project")}
              className="inline-flex items-center gap-1.5 bg-[#E4572E] text-white
                         px-6 py-3 rounded-full text-sm font-semibold
                         hover:bg-[#c93d1e] transition-all duration-200"
            >
              + Add Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden
                           shadow-sm hover:shadow-xl hover:border-[#E4572E]/20 transition-all duration-300"
                style={{ animation: `fadeUp 0.45s ease ${i * 50}ms both` }}
              >
                {/* Image */}
                <div className="relative overflow-hidden h-[220px]">
                  <img
                    src={project.mainImage}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700
                               group-hover:scale-105"
                  />
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                     bg-white/90 backdrop-blur-sm text-[#1F2A44]
                                     text-[10px] font-bold tracking-[1px] uppercase shadow-sm">
                      {project.status || "Ongoing"}
                    </span>
                  </div>
                  {/* Type badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                     bg-[#E4572E]/90 backdrop-blur-sm text-white
                                     text-[10px] font-bold tracking-[1px] uppercase shadow-sm">
                      {project.type}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-[#1F2A44] font-bold text-[15px] leading-snug mb-3
                                 line-clamp-1 group-hover:text-[#E4572E] transition-colors duration-200">
                    {project.title}
                  </h2>

                  {/* Detail grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-4">
                    {[
                      { label: "Location", value: project.location },
                      { label: "Area", value: project.area },
                      { label: "Units", value: project.units },
                      { label: "Price", value: project.startingPrice, accent: true },
                    ].map(({ label, value, accent }) => (
                      <div key={label}>
                        <p className="text-gray-400 text-[10px] font-semibold tracking-wide uppercase">{label}</p>
                        <p className={`text-[12px] font-semibold mt-0.5 leading-tight truncate
                                       ${accent ? "text-[#E4572E]" : "text-[#1F2A44]"}`}>
                          {value || "—"}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Link to={`/admin/edit-project/${project.id}`} className="flex-1">
                      <button className="w-full py-2.5 rounded-full bg-[#1F2A44] text-white
                                         text-[12px] font-semibold hover:bg-[#E4572E]
                                         transition-all duration-200">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => openModal(project)}
                      className="flex-1 py-2.5 rounded-full border-2 border-red-200 text-red-500
                                 text-[12px] font-semibold hover:bg-red-500 hover:text-white
                                 hover:border-red-500 transition-all duration-200"
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

      {modalProject && (
        <DeleteModal
          title="Delete Project"
          itemName={modalProject.title}
          inputName={inputName}
          setInputName={(v) => { setInputName(v); setError(""); }}
          error={error}
          deleting={deleting}
          onClose={closeModal}
          onConfirm={handleDelete}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}