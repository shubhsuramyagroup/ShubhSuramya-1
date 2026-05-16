import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getArticles,
  deleteArticle,
} from "../../services/articleService";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const data = await getArticles();

      // newest first
      const sortedData = data.sort(
        (a, b) =>
          b.createdAt?.seconds -
          a.createdAt?.seconds
      );

      setArticles(sortedData);
      setLoading(false);

    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this article?"
    );

    if (!confirmDelete) return;

    try {
      await deleteArticle(id);

      setArticles(
        articles.filter(
          (article) => article.id !== id
        )
      );

    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "25px",
          background: "#F8F7F4",
        }}
      >
        Loading Articles...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F7F4",
        padding: "40px 20px",
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
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "42px",
                color: "#1F2A44",
                marginBottom: "10px",
              }}
            >
              All Articles
            </h1>

            <p
              style={{
                color: "#777",
              }}
            >
              Manage your uploaded articles
            </p>
          </div>

          <Link
            to="/admin/add-article"
            style={{
              textDecoration: "none",
            }}
          >
            <button
              style={{
                background: "#E4572E",
                color: "#fff",
                border: "none",
                padding: "14px 22px",
                borderRadius: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              + Add Article
            </button>
          </Link>
        </div>

        {/* Empty */}

        {articles.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "30px",
              padding: "80px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                color: "#1F2A44",
              }}
            >
              No Articles Found
            </h2>

            <p
              style={{
                color: "#777",
              }}
            >
              Start adding your first article
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(300px,1fr))",
              gap: "25px",
            }}
          >
            {articles.map((article) => (
              <div
                key={article.id}
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow:
                    "0 5px 25px rgba(0,0,0,.06)",
                }}
              >
                {/* Image */}

                <img
                  src={article.image}
                  alt={article.heading}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                  }}
                />

                {/* Content */}

                <div
                  style={{
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "15px",
                    }}
                  >
                    <span
                      style={{
                        background:
                          "rgba(228,87,46,.1)",
                        color: "#E4572E",
                        padding: "6px 12px",
                        borderRadius: "50px",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {article.type}
                    </span>

                    <span
                      style={{
                        color: "#777",
                        fontSize: "13px",
                      }}
                    >
                      {article.date}
                    </span>
                  </div>

                  <h2
                    style={{
                      color: "#1F2A44",
                      fontSize: "20px",
                      marginBottom: "20px",
                      lineHeight: "30px",
                    }}
                  >
                    {article.heading}
                  </h2>

                  {/* Buttons */}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                    }}
                  >
                    <Link
                      to={`/admin/edit-article/${article.id}`}
                      style={{
                        flex: 1,
                      }}
                    >
                      <button
                        style={{
                          width: "100%",
                          background: "#2563EB",
                          color: "#fff",
                          border: "none",
                          padding: "12px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Edit
                      </button>
                    </Link>

                    <button
                      onClick={() =>
                        handleDelete(article.id)
                      }
                      style={{
                        flex: 1,
                        background: "#DC2626",
                        color: "#fff",
                        border: "none",
                        padding: "12px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
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