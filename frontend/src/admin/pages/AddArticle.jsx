import { useState } from "react";
import { uploadImage } from "../../services/uploadCloudinary";
import { addArticle } from "../../services/articleService";

export default function AddArticle() {
  const [loading, setLoading] = useState(false);

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

      // Upload image
      if (form.imageFile) {
        finalImage = await uploadImage(
          form.imageFile
        );
      }

      // Image URL
      else if (form.imageUrl) {
        finalImage = form.imageUrl;
      }

      if (!finalImage) {
        alert(
          "Please upload image or enter image URL"
        );

        setLoading(false);
        return;
      }

      await addArticle({
        heading: form.heading,
        type: form.type,
        image: finalImage,
        date: new Date().toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        ),
        createdAt: new Date(),
      });

      alert("Article Added Successfully");

      setForm({
        heading: "",
        type: "",
        imageFile: null,
        imageUrl: "",
      });

    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-6 md:p-10">

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow">

        <h1 className="text-4xl font-bold text-[#1F2A44] mb-8">
          Add Article
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div>
            <label className="font-medium block mb-2">
              Heading
            </label>

            <input
              type="text"
              value={form.heading}
              placeholder="Enter article heading"
              className="border p-4 rounded-xl w-full"
              onChange={(e)=>
                setForm({
                  ...form,
                  heading:e.target.value
                })
              }
              required
            />
          </div>

          <div>
            <label className="font-medium block mb-2">
              Article Type
            </label>

            <input
              type="text"
              value={form.type}
              placeholder="News, Blog, Real Estate..."
              className="border p-4 rounded-xl w-full"
              onChange={(e)=>
                setForm({
                  ...form,
                  type:e.target.value
                })
              }
              required
            />
          </div>

          <div>
            <label className="font-medium block mb-2">
              Upload Image
            </label>

            <input
              type="file"
              accept="image/*"
              className="border p-4 rounded-xl w-full"
              onChange={(e)=>
                setForm({
                  ...form,
                  imageFile:e.target.files[0]
                })
              }
            />
          </div>

          <div className="text-center text-gray-500">
            OR
          </div>

          <div>
            <label className="font-medium block mb-2">
              Image URL
            </label>

            <input
              type="text"
              value={form.imageUrl}
              placeholder="Paste image URL"
              className="border p-4 rounded-xl w-full"
              onChange={(e)=>
                setForm({
                  ...form,
                  imageUrl:e.target.value
                })
              }
            />
          </div>

          {(form.imageFile || form.imageUrl) && (

            <div>

              <label className="font-medium block mb-2">
                Preview
              </label>

              <img
                src={
                  form.imageFile
                  ? URL.createObjectURL(
                      form.imageFile
                    )
                  : form.imageUrl
                }
                alt=""
                className="w-full h-[250px] rounded-xl object-cover"
              />

            </div>

          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E4572E] text-white py-4 rounded-xl font-semibold"
          >
            {
              loading
              ? "Uploading..."
              : "Add Article"
            }
          </button>

        </form>

      </div>

    </div>
  );
}