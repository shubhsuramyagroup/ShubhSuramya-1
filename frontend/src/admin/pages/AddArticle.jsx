import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../../services/uploadCloudinary";
import { addArticle } from "../../services/articleService";
import {
  Toast, BackButton, PageHeader, AdminSection,
  AdminLabel, AdminAddBtn, AdminSubmitBtn, inputCls,
} from "../components/Adminshared ";

export default function AddArticle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    heading: "",
    type: "",
    imageFile: null,
    imageUrl: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let finalImage = "";
      if (form.imageFile) {
        finalImage = await uploadImage(form.imageFile);
      } else if (form.imageUrl) {
        finalImage = form.imageUrl;
      }

      if (!finalImage) {
        setToast({ type: "error", message: "Please upload an image or enter an image URL." });
        setLoading(false);
        return;
      }

      await addArticle({
        heading: form.heading,
        type: form.type,
        image: finalImage,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        }),
        createdAt: new Date(),
      });

      setToast({ type: "success", message: "Article added successfully!" });
      setForm({ heading: "", type: "", imageFile: null, imageUrl: "" });
    } catch (err) {
      console.log(err);
      setToast({ type: "error", message: "Something went wrong. Please try again." });
    }
    setLoading(false);
  };

  const previewSrc = form.imageFile
    ? URL.createObjectURL(form.imageFile)
    : form.imageUrl || null;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Toast show={toast} onClose={() => setToast(null)} />

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 h-14 flex items-center gap-4">
        <BackButton onClick={() => navigate("/admin/dashboard")} label="Dashboard" />
        <span className="text-gray-200 text-lg">|</span>
        <span className="text-[#1F2A44] font-semibold text-sm">Add Article</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <PageHeader
          eyebrow="Content"
          title="Add Article"
          subtitle="Publish a new article to your insights section"
        />

        <form onSubmit={handleSubmit} className="space-y-0">

          {/* ── Article Details ── */}
          <AdminSection title="Article Details">
            <div className="space-y-4">
              <div>
                <AdminLabel required>Heading</AdminLabel>
                <input
                  type="text"
                  value={form.heading}
                  placeholder="Enter article heading"
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
                  placeholder="e.g. News, Blog, Real Estate…"
                  className={inputCls}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                />
              </div>
            </div>
          </AdminSection>

          {/* ── Image ── */}
          <AdminSection title="Article Image" hint="Upload a file or paste a URL. Only one is needed.">
            <div className="space-y-4">
              {/* File upload drop zone */}
              <div>
                <AdminLabel>Upload Image File</AdminLabel>
                <label
                  className="flex flex-col items-center justify-center border-2 border-dashed
                             border-gray-200 rounded-2xl p-8 cursor-pointer text-center
                             hover:border-[#E4572E] hover:bg-[#FFF0EC]/30 transition-all duration-200"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setForm({ ...form, imageFile: e.target.files[0], imageUrl: "" })}
                  />
                  <div className="w-12 h-12 rounded-full bg-[#FFF0EC] flex items-center justify-center mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="1.8"
                         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <p className="text-[#1F2A44] font-semibold text-sm">
                    {form.imageFile ? form.imageFile.name : "Click to upload image"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">PNG, JPG, WEBP supported</p>
                </label>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs font-semibold">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* URL */}
              <div>
                <AdminLabel>Image URL</AdminLabel>
                <input
                  type="text"
                  value={form.imageUrl}
                  placeholder="Paste image URL here"
                  className={inputCls}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value, imageFile: null })}
                />
              </div>

              {/* Preview */}
              {previewSrc && (
                <div>
                  <AdminLabel>Preview</AdminLabel>
                  <div className="relative rounded-2xl overflow-hidden border border-gray-100">
                    <img
                      src={previewSrc}
                      alt="preview"
                      className="w-full h-[220px] object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                       bg-white/90 backdrop-blur-sm text-[#E4572E]
                                       text-[10px] font-bold tracking-[1px] uppercase shadow-sm">
                        Preview
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AdminSection>

          {/* ── Submit ── */}
          <AdminSubmitBtn loading={loading} label="Publish Article" loadingLabel="Uploading…" />
        </form>
      </div>
    </div>
  );
}