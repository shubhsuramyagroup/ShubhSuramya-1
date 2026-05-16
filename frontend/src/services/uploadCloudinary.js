const CLOUDINARY_CLOUD_NAME = "ddzsk54c2";       // e.g. "myapp123"
const CLOUDINARY_UPLOAD_PRESET = "project_uploads";

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();

    formData.append("file", file);
    formData.append(
      "upload_preset",
      CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    return data.secure_url;

  } catch (error) {
    console.log(error);
  }
};