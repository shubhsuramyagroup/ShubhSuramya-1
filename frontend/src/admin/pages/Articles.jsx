import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArticles, deleteArticle } from "../../services/articleService";

export default function Articles() {
  const [articles,     setArticles]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalArticle, setModalArticle] = useState(null); // article to delete
  const [inputName,    setInputName]    = useState("");
  const [error,        setError]        = useState("");
  const [deleting,     setDeleting]     = useState(false);
  const [toast,        setToast]        = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await getArticles();
        const sortedData = data.sort(
          (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
        );
        setArticles(sortedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // ── Modal helpers ────────────────────────────────────────────────────────
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    // Exact, case-sensitive match
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
      showToast("Article deleted successfully");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Deletion failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        justifyContent: "center", alignItems: "center",
        fontSize: "25px", background: "#F8F7F4",
      }}>
        Loading Articles...
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap",
          gap: "20px", marginBottom: "40px",
        }}>
          <div>
            <h1 style={{ fontSize: "42px", color: "#1F2A44", marginBottom: "10px" }}>
              All Articles
            </h1>
            <p style={{ color: "#777" }}>Manage your uploaded articles</p>
          </div>

          <Link to="/admin/add-article" style={{ textDecoration: "none" }}>
            <button style={{
              background: "#E4572E", color: "#fff", border: "none",
              padding: "14px 22px", borderRadius: "14px",
              fontWeight: "600", cursor: "pointer",
            }}>
              + Add Article
            </button>
          </Link>
        </div>

        {/* Empty */}
        {articles.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: "30px",
            padding: "80px", textAlign: "center",
          }}>
            <h2 style={{ color: "#1F2A44" }}>No Articles Found</h2>
            <p style={{ color: "#777" }}>Start adding your first article</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: "25px",
          }}>
            {articles.map((article) => (
              <div key={article.id} style={{
                background: "#fff", borderRadius: "24px",
                overflow: "hidden", boxShadow: "0 5px 25px rgba(0,0,0,.06)",
              }}>
                {/* Image */}
                <img
                  src={article.image}
                  alt={article.heading}
                  style={{ width: "100%", height: "220px", objectFit: "cover" }}
                />

                {/* Content */}
                <div style={{ padding: "20px" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", marginBottom: "15px",
                  }}>
                    <span style={{
                      background: "rgba(228,87,46,.1)", color: "#E4572E",
                      padding: "6px 12px", borderRadius: "50px",
                      fontSize: "13px", fontWeight: "600",
                    }}>
                      {article.type}
                    </span>
                    <span style={{ color: "#777", fontSize: "13px" }}>
                      {article.date}
                    </span>
                  </div>

                  <h2 style={{
                    color: "#1F2A44", fontSize: "20px",
                    marginBottom: "20px", lineHeight: "30px",
                  }}>
                    {article.heading}
                  </h2>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Link to={`/admin/edit-article/${article.id}`} style={{ flex: 1 }}>
                      <button style={{
                        width: "100%", background: "#2563EB", color: "#fff",
                        border: "none", padding: "12px", borderRadius: "12px",
                        cursor: "pointer", fontWeight: "600",
                      }}>
                        Edit
                      </button>
                    </Link>

                    <button
                      onClick={() => openModal(article)}
                      style={{
                        flex: 1, background: "#DC2626", color: "#fff",
                        border: "none", padding: "12px", borderRadius: "12px",
                        cursor: "pointer", fontWeight: "600",
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
      {modalArticle && (
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
              Delete Article
            </h2>

            {/* Info */}
            <p style={{
              textAlign: "center", color: "#666",
              fontSize: "14px", lineHeight: "1.6", marginBottom: "8px",
            }}>
              This action is <strong style={{ color: "#DC2626" }}>permanent</strong> and cannot be undone.
            </p>
            <p style={{
              textAlign: "center", color: "#444",
              fontSize: "14px", marginBottom: "16px",
            }}>
              Type the article name exactly to confirm:
            </p>

            {/* Article name display */}
            <div style={{
              background: "#F8F7F4", border: "1.5px dashed #CBD0D8",
              borderRadius: "10px", padding: "10px 16px",
              textAlign: "center", marginBottom: "16px",
              fontFamily: "monospace", fontSize: "14px",
              fontWeight: "700", color: "#1F2A44",
              userSelect: "all", lineHeight: "1.5",
            }}>
              {modalArticle.heading}
            </div>

            {/* Input */}
            <input
              type="text"
              value={inputName}
              onChange={(e) => { setInputName(e.target.value); setError(""); }}
              placeholder="Type article name here..."
              disabled={deleting}
              style={{
                width: "100%", padding: "13px 16px",
                borderRadius: "12px", boxSizing: "border-box",
                border: `2px solid ${
                  error ? "#DC2626"
                  : inputName === modalArticle.heading && inputName ? "#22C55E"
                  : "#E2E5EB"
                }`,
                fontSize: "15px", color: "#1F2A44",
                outline: "none", marginBottom: "8px",
                background: deleting ? "#F8F7F4" : "#fff",
              }}
            />

            {/* Live match hint */}
            {inputName.length > 0 && !error && (
              <p style={{
                fontSize: "12px", fontWeight: "600", marginBottom: "8px",
                color: inputName === modalArticle.heading ? "#22C55E" : "#DC2626",
              }}>
                {inputName === modalArticle.heading
                  ? "✓ Name matches"
                  : "✗ Name does not match yet"}
              </p>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: "10px", padding: "10px 14px",
                marginBottom: "12px", fontSize: "13px",
                color: "#B91C1C", fontWeight: "500",
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
                  background: deleting || !inputName ? "#FCA5A5" : "#DC2626",
                  color: "#fff", fontWeight: "700", fontSize: "15px",
                  cursor: deleting || !inputName ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px",
                }}
              >
                {deleting ? (
                  <>
                    <span style={{
                      width: "16px", height: "16px",
                      border: "2.5px solid rgba(255,255,255,0.4)",
                      borderTop: "2.5px solid #fff",
                      borderRadius: "50%", display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Deleting...
                  </>
                ) : "Delete Article"}
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