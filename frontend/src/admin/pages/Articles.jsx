import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getArticles, deleteArticle } from "../../services/articleService";
import { Toast, BackButton, PageHeader, DeleteModal } from "../components/Adminshared ";

export default function Articles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Delete modal state
  const [modalArticle, setModalArticle] = useState(null);
  const [inputName, setInputName] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const data = await getArticles();
      const sortedData = data.sort(
        (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
      );
      setArticles(sortedData);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Failed to load articles." });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (article) => {
    setModalArticle(article);
    setInputName("");
    setError("");
  };

  const closeModal = () => {
    if (deleting) return;
    setModalArticle(null);
    setInputName("");
    setError("");
  };

  const handleDelete = async () => {
    if (inputName !== modalArticle.heading) {
      setError("Article name does not match. Deletion cancelled.");
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await deleteArticle(modalArticle.id);
      setArticles((prev) => prev.filter((a) => a.id !== modalArticle.id));
      setModalArticle(null);
      setToast({ type: "success", message: "Article deleted successfully." });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Deletion failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 rounded-full border-[3px] border-[#E4572E]/20 border-t-[#E4572E]"
             style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-[#1F2A44] font-semibold text-sm">Loading articles…</p>
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
        <span className="text-[#1F2A44] font-semibold text-sm">All Articles</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <PageHeader
          eyebrow="Content"
          title="All Articles"
          subtitle="Manage your uploaded articles"
          actions={
            <Link to="/admin/add-article">
              <button className="inline-flex items-center gap-1.5 bg-[#E4572E] text-white
                                 px-5 py-2.5 rounded-full text-[12px] font-semibold tracking-wide
                                 hover:bg-[#c93d1e] hover:scale-[1.03] transition-all duration-200">
                + Add Article
              </button>
            </Link>
          }
        />

        {/* Empty state */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm
                          flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFF0EC] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="1.5"
                   strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 className="text-[#1F2A44] font-semibold text-xl mb-2">No Articles Found</h2>
            <p className="text-gray-400 text-sm mb-6">Start by adding your first article</p>
            <Link to="/admin/add-article">
              <button className="inline-flex items-center gap-1.5 bg-[#E4572E] text-white
                                 px-6 py-3 rounded-full text-sm font-semibold
                                 hover:bg-[#c93d1e] transition-all duration-200">
                + Add Article
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {articles.map((article, i) => (
              <div
                key={article.id}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden
                           shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300"
                style={{ animation: `fadeUp 0.45s ease ${i * 50}ms both` }}
              >
                {/* Image */}
                <div className="relative overflow-hidden h-[200px]">
                  <img
                    src={article.image}
                    alt={article.heading}
                    className="w-full h-full object-cover transition-transform duration-700
                               group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                     bg-white/90 backdrop-blur-sm text-purple-600
                                     text-[10px] font-bold tracking-[1px] uppercase shadow-sm">
                      {article.type}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <p className="text-gray-400 text-[11px] mb-2">{article.date}</p>
                  <h2 className="text-[#1F2A44] font-bold text-[14px] leading-snug
                                 line-clamp-2 mb-4 group-hover:text-[#E4572E] transition-colors duration-200">
                    {article.heading}
                  </h2>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/admin/edit-article/${article.id}`} className="flex-1">
                      <button className="w-full py-2.5 rounded-full bg-[#1F2A44] text-white
                                         text-[12px] font-semibold hover:bg-[#E4572E]
                                         transition-all duration-200">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => openModal(article)}
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

      {/* Delete modal */}
      {modalArticle && (
        <DeleteModal
          title="Delete Article"
          itemName={modalArticle.heading}
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