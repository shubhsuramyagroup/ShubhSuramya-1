import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getArticles, updateArticle } from "../../services/articleService";
import { uploadImage } from "../../services/uploadCloudinary";
import {
  Toast, BackButton, PageHeader, AdminSection,
  AdminLabel, AdminSubmitBtn, inputCls,
} from "../components/Adminshared ";

export default function EditArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    heading: "",
    type: "",
    image: "",
    imageUrl: "",
    date: "",
  });

  useEffect(() => { fetchArticle(); }, []);

  const fetchArticle = async () => {
    try {
      const articles = await getArticles();
      const article = articles.find((item) => item.id === id);
      if (article) {
        setForm({ ...article, imageUrl: article.image });
      }
    } catch (err) {
      console.log(err);
      setToast({ type: "error", message: "Failed to load article." });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let imageUrl = form.image;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      } else if (form.imageUrl && form.imageUrl !== form.image) {
        imageUrl = form.imageUrl;
      }

      await updateArticle(id, {
        heading: form.heading,
        type: form.type,
        image: imageUrl,
        date: form.date,
      });

      setToast({ type: "success", message: "Article updated successfully!" });
      setTimeout(() => navigate("/admin/articles"), 1200);
    } catch (err) {
      console.log(err);
      setToast({ type: "error", message: "Update failed. Please try again." });
    }
    setLoading(false);
  };

  const previewSrc = imageFile
    ? URL.createObjectURL(imageFile)
    : form.imageUrl || null;

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 rounded-full border-[3px] border-[#E4572E]/20 border-t-[#E4572E]"
             style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-[#1F2A44] font-semibold text-sm">Loading article…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Toast show={toast} onClose={() => setToast(null)} />

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100
                      px-4 sm:px-8 h-14 flex items-center gap-4">
        <BackButton onClick={() => navigate("/admin/articles")} label="Articles" />
        <span className="text-gray-200 text-lg">|</span>
        <span className="text-[#1F2A44] font-semibold text-sm">Edit Article</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <PageHeader
          eyebrow="Content"
          title="Edit Article"
          subtitle={`Editing: ${form.heading || "…"}`}
        />

        <form onSubmit={handleSubmit}>

          {/* Current image preview */}
          {previewSrc && (
            <AdminSection title="Current Image">
              <div className="relative rounded-2xl overflow-hidden border border-gray-100">
                <img src={previewSrc} alt="preview" className="w-full h-[220px] object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                   bg-white/90 backdrop-blur-sm text-[#E4572E]
                                   text-[10px] font-bold tracking-[1px] uppercase shadow-sm">
                    Current
                  </span>
                </div>
              </div>
            </AdminSection>
          )}

          {/* Image replacement */}
          <AdminSection title="Replace Image" hint="Upload a new file or paste a different URL to replace the current image.">
            <div className="space-y-4">
              <div>
                <AdminLabel>Upload New Image</AdminLabel>
                <label
                  className="flex flex-col items-center justify-center border-2 border-dashed
                             border-gray-200 rounded-2xl p-6 cursor-pointer text-center
                             hover:border-[#E4572E] hover:bg-[#FFF0EC]/30 transition-all duration-200"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      setImageFile(e.target.files[0]);
                      setForm({ ...form, imageUrl: "" });
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center mb-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="1.8"
                         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-[#1F2A44] font-semibold text-sm">
                    {imageFile ? imageFile.name : "Click to upload replacement"}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">PNG, JPG, WEBP</p>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs font-semibold">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <AdminLabel>Image URL</AdminLabel>
                <input
                  type="text"
                  value={form.imageUrl}
                  placeholder="Paste URL"
                  className={inputCls}
                  onChange={(e) => {
                    setForm({ ...form, imageUrl: e.target.value });
                    setImageFile(null);
                  }}
                />
              </div>
            </div>
          </AdminSection>

          {/* Article details */}
          <AdminSection title="Article Details">
            <div className="space-y-4">
              <div>
                <AdminLabel required>Heading</AdminLabel>
                <input
                  type="text"
                  value={form.heading}
                  className={inputCls}
                  onChange={(e) => setForm({ ...form, heading: e.target.value })}
                  required
                />
              </div>

              <div>
                <AdminLabel required>Article Type</AdminLabel>
                <input
                  type="text"
                  value={form.type}
                  placeholder="e.g. News, Blog…"
                  className={inputCls}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                />
              </div>

              <div>
                <AdminLabel>Published Date</AdminLabel>
                <input
                  value={form.date}
                  disabled
                  className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                />
              </div>
            </div>
          </AdminSection>

          <AdminSubmitBtn loading={loading} label="Update Article" loadingLabel="Updating…" />
        </form>
      </div>
    </div>
  );
}