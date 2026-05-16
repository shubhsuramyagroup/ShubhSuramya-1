import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getArticles, updateArticle } from "../../services/articleService";

import { uploadImage } from "../../services/uploadCloudinary";

export default function EditArticle() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    heading: "",
    type: "",
    image: "",
    imageUrl: "",
    date: "",
  });

  useEffect(() => {
    fetchArticle();
  }, []);

  const fetchArticle = async () => {
    try {
      const articles = await getArticles();

      const article = articles.find((item) => item.id === id);

      if (article) {
        setForm({
          ...article,
          imageUrl: article.image,
        });
      }
    } catch (err) {
      console.log(err);
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

      alert("Article Updated");

      navigate("/admin/articles");
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow">
        <h1 className="text-4xl font-bold mb-8 text-[#1F2A44]">Edit Article</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="font-medium block mb-2">Preview</label>

            <img
              src={imageFile ? URL.createObjectURL(imageFile) : form.imageUrl}
              alt=""
              className="w-full h-[250px] rounded-xl object-cover"
            />
          </div>

          <div>
            <label className="font-medium block mb-2">Upload Image</label>

            <input
              type="file"
              accept="image/*"
              className="border p-4 rounded-xl w-full"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </div>

          <div className="text-center text-gray-500">OR</div>

          <div>
            <label className="font-medium block mb-2">Image URL</label>

            <input
              value={form.imageUrl}
              placeholder="Paste URL"
              onChange={(e) =>
                setForm({
                  ...form,
                  imageUrl: e.target.value,
                })
              }
              className="border p-4 rounded-xl w-full"
            />
          </div>

          <div>
            <label className="font-medium block mb-2">Heading</label>

            <input
              value={form.heading}
              onChange={(e) =>
                setForm({
                  ...form,
                  heading: e.target.value,
                })
              }
              className="border p-4 rounded-xl w-full"
            />
          </div>

          <div>
            <label className="font-medium block mb-2">Article Type</label>

            <input
              value={form.type}
              placeholder="News, Blog..."
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                })
              }
              className="border p-4 rounded-xl w-full"
            />
          </div>

          <div>
            <label className="font-medium block mb-2">Date</label>

            <input
              value={form.date}
              disabled
              className="border p-4 rounded-xl w-full bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E4572E] text-white py-4 rounded-xl font-semibold"
          >
            {loading ? "Updating..." : "Update Article"}
          </button>
        </form>
      </div>
    </div>
  );
}
