import { useState, useRef } from "react";
import { addProject } from "../../services/projectService";

// ─── CLOUDINARY CONFIG ────────────────────────────────────────────────────────
// Replace these with your actual Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = "ddzsk54c2";       // e.g. "myapp123"
const CLOUDINARY_UPLOAD_PRESET = "project_uploads"; // e.g. "ml_default" (unsigned preset)

// ─── Cloudinary Upload Helper ─────────────────────────────────────────────────
async function uploadToCloudinary(file, folder = "projects", onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        reject(new Error("Cloudinary upload failed: " + xhr.responseText));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

// ─── Reusable Image Upload Field ─────────────────────────────────────────────
function ImageUploadField({ label, value, onChange, folder = "projects" }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const url = await uploadToCloudinary(file, folder, (pct) => setProgress(pct));
      onChange(url);
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ marginTop: "12px" }}>
      {label && (
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current.click()}
        style={{
          border: "2px dashed #ddd",
          borderRadius: "12px",
          padding: "18px",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: uploading ? "#fafafa" : "#fff",
          transition: "border-color 0.2s",
          position: "relative",
          minHeight: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = "#E4572E"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ddd"; }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
        />

        {value ? (
          <div style={{ width: "100%" }}>
            <img
              src={value}
              alt="preview"
              style={{ maxHeight: "120px", maxWidth: "100%", borderRadius: "8px", objectFit: "cover", display: "block", margin: "0 auto" }}
            />
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#888" }}>
              {uploading ? `Uploading… ${progress}%` : "Click or drag to replace"}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🖼️</div>
            <div style={{ fontSize: "13px", color: "#888", fontWeight: "500" }}>
              {uploading ? `Uploading… ${progress}%` : "Click or drag & drop an image"}
            </div>
          </div>
        )}

        {uploading && (
          <div style={{
            position: "absolute", bottom: 0, left: 0,
            height: "4px", width: `${progress}%`,
            background: "#E4572E", borderRadius: "0 0 10px 10px",
            transition: "width 0.3s"
          }} />
        )}
      </div>

      {/* URL fallback */}
      <input
        type="text"
        placeholder="Or paste image URL directly"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: "10px",
          border: "1px solid #eee", outline: "none", fontSize: "12px",
          marginTop: "8px", color: "#555", boxSizing: "border-box"
        }}
      />

      {error && <div style={{ fontSize: "12px", color: "#c0392b", marginTop: "4px" }}>{error}</div>}
    </div>
  );
}

// ─── Delete Button ────────────────────────────────────────────────────────────
function DeleteBtn({ onClick, label = "Remove" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        background: "#fff0ee",
        border: "1px solid #f5c6c0",
        color: "#c0392b",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddProject() {
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    year: "",
    location: "",
    type: "",
    status: "",
    area: "",
    units: "",
    possessionTiming: "",
    startingPrice: "",
    projectHeading: "",
    mainImage: "",
    brochurePdf: "",
    floorPlanPdf: "",
    projectTags: [""],
    youtubeVideos: [""],
    stats: [{ title: "", value: "" }],
    amenities: [{ title: "", image: "" }],
    galleryImages: [""],
    nearbyPlaces: [{ name: "", type: "", distance: "" }],
    floors: [{ floorName: "", rooms: [{ name: "", image: "" }] }],
  });

  // ── Styles ────────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    outline: "none",
    fontSize: "14px",
    marginTop: "10px",
    boxSizing: "border-box",
  };

  const sectionStyle = {
    background: "#fff",
    padding: "25px",
    borderRadius: "18px",
    marginBottom: "25px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  };

  const addBtnStyle = {
    padding: "12px 18px",
    background: "#E4572E",
    border: "none",
    color: "#fff",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "15px",
    fontWeight: "600",
    fontSize: "14px",
  };

  const itemHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleChange = (e) =>
    setProjectData({ ...projectData, [e.target.name]: e.target.value });

  // YouTube
  const handleYoutubeChange = (i, val) => {
    const u = [...projectData.youtubeVideos]; u[i] = val;
    setProjectData({ ...projectData, youtubeVideos: u });
  };
  const removeYoutube = (i) => {
    const u = projectData.youtubeVideos.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, youtubeVideos: u.length ? u : [""] });
  };

  const handleTagChange = (
  i,
  val
) => {
  const updated = [
    ...projectData.projectTags,
  ];

  updated[i] = val;

  setProjectData({
    ...projectData,
    projectTags: updated,
  });
};

const removeTag = (i) => {
  const updated =
    projectData.projectTags.filter(
      (_, idx) => idx !== i
    );

  setProjectData({
    ...projectData,
    projectTags: updated.length
      ? updated
      : [""],
  });
};

  // Stats
  const handleStatsChange = (i, field, val) => {
    const u = [...projectData.stats]; u[i][field] = val;
    setProjectData({ ...projectData, stats: u });
  };
  const removeStat = (i) => {
    const u = projectData.stats.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, stats: u.length ? u : [{ title: "", value: "" }] });
  };

  // Amenities
  const handleAmenityChange = (i, field, val) => {
    const u = [...projectData.amenities]; u[i][field] = val;
    setProjectData({ ...projectData, amenities: u });
  };
  const removeAmenity = (i) => {
    const u = projectData.amenities.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, amenities: u.length ? u : [{ title: "", image: "" }] });
  };

  // Gallery
  const handleGalleryChange = (i, val) => {
    const u = [...projectData.galleryImages]; u[i] = val;
    setProjectData({ ...projectData, galleryImages: u });
  };
  const removeGallery = (i) => {
    const u = projectData.galleryImages.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, galleryImages: u.length ? u : [""] });
  };

  // Nearby
  const handleNearbyChange = (i, field, val) => {
    const u = [...projectData.nearbyPlaces]; u[i][field] = val;
    setProjectData({ ...projectData, nearbyPlaces: u });
  };
  const removeNearby = (i) => {
    const u = projectData.nearbyPlaces.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, nearbyPlaces: u.length ? u : [{ name: "", type: "", distance: "" }] });
  };

  // Floors
  const handleFloorName = (fi, val) => {
    const u = [...projectData.floors]; u[fi].floorName = val;
    setProjectData({ ...projectData, floors: u });
  };
  const removeFloor = (fi) => {
    const u = projectData.floors.filter((_, idx) => idx !== fi);
    setProjectData({ ...projectData, floors: u.length ? u : [{ floorName: "", rooms: [{ name: "", image: "" }] }] });
  };

  // Rooms
  const handleRoomChange = (fi, ri, field, val) => {
    const u = [...projectData.floors]; u[fi].rooms[ri][field] = val;
    setProjectData({ ...projectData, floors: u });
  };
  const removeRoom = (fi, ri) => {
    const u = [...projectData.floors];
    u[fi].rooms = u[fi].rooms.filter((_, idx) => idx !== ri);
    if (!u[fi].rooms.length) u[fi].rooms = [{ name: "", image: "" }];
    setProjectData({ ...projectData, floors: u });
  };

  // Submit — only URLs are stored in Firebase (images already on Cloudinary)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addProject({ ...projectData, createdAt: new Date() });
      alert("Project Uploaded Successfully");
    } catch (error) {
      console.error(error);
      alert("Error uploading project: " + error.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh", padding: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "30px", gap: "20px" }}>
          <button
            type="button"
            onClick={() => (window.location.href = "/admin/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "#1F2A44", fontSize: "15px", fontWeight: "600", padding: "0" }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: "42px", color: "#1F2A44", margin: 0 }}>Add New Project</h1>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Basic Details ── */}
          <div style={sectionStyle}>
            <h2>Basic Details</h2>
            <input style={inputStyle} type="text" name="title" placeholder="Project Title" onChange={handleChange} />
            <textarea style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }} name="description" placeholder="Project Description" onChange={handleChange} />
            <input style={inputStyle} type="text" name="projectHeading" placeholder="Project Heading" onChange={handleChange} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "15px", marginTop: "10px" }}>
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="year" placeholder="Year (e.g. 2024)" onChange={handleChange} />
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="location" placeholder="Location" onChange={handleChange} />
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="type" placeholder="Project Type (e.g. Residential)" onChange={handleChange} />
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="status" placeholder="Status (e.g. Under Construction)" onChange={handleChange} />
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="area" placeholder="Area (e.g. 2500 sq.ft)" onChange={handleChange} />
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="units" placeholder="Units (e.g. 120 Units)" onChange={handleChange} />
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="possessionTiming" placeholder="Possession Timing (e.g. Dec 2026)" onChange={handleChange} />
              <input style={{ ...inputStyle, marginTop: 0 }} type="text" name="startingPrice" placeholder="Starting Price (e.g. ₹45 Lakh)" onChange={handleChange} />
            </div>
          </div>

          {/* ── Project Tags ── */}

<div style={sectionStyle}>
  <h2>Project Tags</h2>

  <p
    style={{
      fontSize: "13px",
      color: "#888",
      margin: "0 0 4px",
    }}
  >
    Example: Luxury, Premium,
    Smart Home, River View,
    3BHK, Modern Living
  </p>

  {projectData.projectTags.map(
    (tag, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "12px",
        }}
      >
        <input
          style={{
            ...inputStyle,
            marginTop: 0,
            flex: 1,
          }}
          type="text"
          placeholder="Project Tag"
          value={tag}
          onChange={(e) =>
            handleTagChange(
              i,
              e.target.value
            )
          }
        />

        <DeleteBtn
          onClick={() =>
            removeTag(i)
          }
        />
      </div>
    )
  )}

  <button
    type="button"
    style={addBtnStyle}
    onClick={() =>
      setProjectData({
        ...projectData,
        projectTags: [
          ...projectData.projectTags,
          "",
        ],
      })
    }
  >
    + Add Project Tag
  </button>
</div>

          {/* ── Main Image ── */}
          <div style={sectionStyle}>
            <h2>Main Image</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 4px" }}>
              This image will be uploaded to Cloudinary. Only the URL is saved to Firebase.
            </p>
            <ImageUploadField
              label="Project Main Image"
              value={projectData.mainImage}
              onChange={(url) => setProjectData({ ...projectData, mainImage: url })}
              folder="projects/main"
            />
          </div>

          {/* ── YouTube Videos ── */}
          <div style={sectionStyle}>
            <h2>YouTube Videos</h2>
            {projectData.youtubeVideos.map((video, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <input
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                  type="text"
                  placeholder="YouTube Video URL (e.g. https://youtu.be/xxxx)"
                  value={video}
                  onChange={(e) => handleYoutubeChange(i, e.target.value)}
                />
                <DeleteBtn onClick={() => removeYoutube(i)} />
              </div>
            ))}
            <button type="button" style={addBtnStyle}
              onClick={() => setProjectData({ ...projectData, youtubeVideos: [...projectData.youtubeVideos, ""] })}>
              + Add Video Link
            </button>
          </div>

          {/* ── Stats ── */}
          <div style={sectionStyle}>
            <h2>Project Stats</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 4px" }}>
              e.g. Title: "Total Area" → Value: "5 Acres"
            </p>
            {projectData.stats.map((stat, i) => (
              <div key={i} style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "12px", padding: "14px", marginTop: "12px" }}>
                <div style={itemHeaderStyle}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#888" }}>Stat {i + 1}</span>
                  <DeleteBtn onClick={() => removeStat(i)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <input style={{ ...inputStyle, marginTop: 0 }} type="text" placeholder="Stat Title (e.g. Total Floors)" value={stat.title}
                    onChange={(e) => handleStatsChange(i, "title", e.target.value)} />
                  <input style={{ ...inputStyle, marginTop: 0 }} type="text" placeholder="Stat Value (e.g. 22)" value={stat.value}
                    onChange={(e) => handleStatsChange(i, "value", e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" style={addBtnStyle}
              onClick={() => setProjectData({ ...projectData, stats: [...projectData.stats, { title: "", value: "" }] })}>
              + Add Stat
            </button>
          </div>

          {/* ── Amenities ── */}
          <div style={sectionStyle}>
            <h2>Amenities</h2>
            {projectData.amenities.map((amenity, i) => (
              <div key={i} style={{ border: "1px solid #f0f0f0", borderRadius: "12px", padding: "16px", marginBottom: "14px" }}>
                <div style={itemHeaderStyle}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#888" }}>Amenity {i + 1}</span>
                  <DeleteBtn onClick={() => removeAmenity(i)} />
                </div>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Amenity Title (e.g. Swimming Pool)"
                  value={amenity.title}
                  onChange={(e) => handleAmenityChange(i, "title", e.target.value)}
                />
                <ImageUploadField
                  label="Amenity Icon / Image"
                  value={amenity.image}
                  onChange={(url) => handleAmenityChange(i, "image", url)}
                  folder="projects/amenities"
                />
              </div>
            ))}
            <button type="button" style={addBtnStyle}
              onClick={() => setProjectData({ ...projectData, amenities: [...projectData.amenities, { title: "", image: "" }] })}>
              + Add Amenity
            </button>
          </div>

          {/* ── PDFs ── */}
          <div style={sectionStyle}>
            <h2>Project Documents</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 4px" }}>
              Paste your PDF links directly (Google Drive, Cloudinary raw upload, etc.)
            </p>
            <input style={inputStyle} type="text" name="brochurePdf" placeholder="Brochure PDF URL" onChange={handleChange} />
            <input style={inputStyle} type="text" name="floorPlanPdf" placeholder="Floor Plan PDF URL" onChange={handleChange} />
          </div>

          {/* ── Floors ── */}
          <div style={sectionStyle}>
            <h2>Floor Details</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 4px" }}>
              Add each floor with its rooms (e.g. Kitchen, Master Bedroom, Drawing Room) and room images.
            </p>
            {projectData.floors.map((floor, fi) => (
              <div key={fi} style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "14px", marginTop: "20px" }}>
                <div style={itemHeaderStyle}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#1F2A44" }}>Floor {fi + 1}</span>
                  <DeleteBtn onClick={() => removeFloor(fi)} label="Delete Floor" />
                </div>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Floor Name (e.g. Ground Floor, First Floor)"
                  value={floor.floorName}
                  onChange={(e) => handleFloorName(fi, e.target.value)}
                />

                {floor.rooms.map((room, ri) => (
                  <div key={ri} style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #eee" }}>
                    <div style={itemHeaderStyle}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#888" }}>Room {ri + 1}</span>
                      <DeleteBtn onClick={() => removeRoom(fi, ri)} label="Delete Room" />
                    </div>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="Room Name (e.g. Kitchen, Master Bedroom, Drawing Room)"
                      value={room.name}
                      onChange={(e) => handleRoomChange(fi, ri, "name", e.target.value)}
                    />
                    <ImageUploadField
                      label="Room Image"
                      value={room.image}
                      onChange={(url) => handleRoomChange(fi, ri, "image", url)}
                      folder="projects/rooms"
                    />
                  </div>
                ))}

                <button type="button" style={addBtnStyle}
                  onClick={() => {
                    const u = [...projectData.floors];
                    u[fi].rooms.push({ name: "", image: "" });
                    setProjectData({ ...projectData, floors: u });
                  }}>
                  + Add Room
                </button>
              </div>
            ))}
            <button type="button" style={addBtnStyle}
              onClick={() => setProjectData({
                ...projectData,
                floors: [...projectData.floors, { floorName: "", rooms: [{ name: "", image: "" }] }],
              })}>
              + Add Floor
            </button>
          </div>

          {/* ── Gallery ── */}
          <div style={sectionStyle}>
            <h2>Gallery Images</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {projectData.galleryImages.map((image, i) => (
                <div key={i} style={{ border: "1px solid #f0f0f0", borderRadius: "12px", padding: "12px" }}>
                  <div style={itemHeaderStyle}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#888" }}>Image {i + 1}</span>
                    <DeleteBtn onClick={() => removeGallery(i)} />
                  </div>
                  <ImageUploadField
                    value={image}
                    onChange={(url) => handleGalleryChange(i, url)}
                    folder="projects/gallery"
                  />
                </div>
              ))}
            </div>
            <button type="button" style={addBtnStyle}
              onClick={() => setProjectData({ ...projectData, galleryImages: [...projectData.galleryImages, ""] })}>
              + Add Gallery Image
            </button>
          </div>

          {/* ── Nearby Places ── */}
          <div style={sectionStyle}>
            <h2>Nearby Places</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 4px" }}>
              e.g. Name: "Ayush Hospital" → Type: "Hospital" → Distance: "2 km"
            </p>
            {projectData.nearbyPlaces.map((place, i) => (
              <div key={i} style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "12px", padding: "14px", marginTop: "12px" }}>
                <div style={itemHeaderStyle}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#888" }}>Place {i + 1}</span>
                  <DeleteBtn onClick={() => removeNearby(i)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                  <input style={{ ...inputStyle, marginTop: 0 }} type="text" placeholder="Name (e.g. Ayush Hospital)" value={place.name}
                    onChange={(e) => handleNearbyChange(i, "name", e.target.value)} />
                  <input style={{ ...inputStyle, marginTop: 0 }} type="text" placeholder="Type (e.g. Hospital)" value={place.type}
                    onChange={(e) => handleNearbyChange(i, "type", e.target.value)} />
                  <input style={{ ...inputStyle, marginTop: 0 }} type="text" placeholder="Distance (e.g. 2 km)" value={place.distance}
                    onChange={(e) => handleNearbyChange(i, "distance", e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" style={addBtnStyle}
              onClick={() => setProjectData({ ...projectData, nearbyPlaces: [...projectData.nearbyPlaces, { name: "", type: "", distance: "" }] })}>
              + Add Nearby Place
            </button>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            style={{ width: "100%", padding: "18px", border: "none", borderRadius: "14px", background: "#1F2A44", color: "#fff", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
          >
            Upload Project
          </button>

        </form>
      </div>
    </div>
  );
}