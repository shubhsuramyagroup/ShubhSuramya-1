import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addProject } from "../../services/projectService";
import { Toast, AdminSubmitBtn } from "../components/Adminshared ";

// ─── CLOUDINARY CONFIG ────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "ddzsk54c2";
const CLOUDINARY_UPLOAD_PRESET = "project_uploads";

// ─── Cloudinary Upload Helper ─────────────────────────────────────────────────
async function uploadToCloudinary(file, folder = "projects", onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
      else reject(new Error("Cloudinary upload failed: " + xhr.responseText));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
      <h2 className="text-[#1F2A44] font-bold text-lg mb-5 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ children }) {
  return <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">{children}</p>;
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-[#1F2A44] text-sm
                  placeholder-gray-300 outline-none focus:border-[#E4572E] focus:ring-2
                  focus:ring-[#E4572E]/10 transition-all duration-200 bg-white ${className}`}
      {...props}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-[#1F2A44] text-sm
                  placeholder-gray-300 outline-none focus:border-[#E4572E] focus:ring-2
                  focus:ring-[#E4572E]/10 transition-all duration-200 bg-white resize-vertical
                  min-h-[120px] ${className}`}
      {...props}
    />
  );
}

// ─── Add Button ───────────────────────────────────────────────────────────────
function AddBtn({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-1.5 bg-[#E4572E]/10 text-[#E4572E]
                 px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide
                 hover:bg-[#E4572E] hover:text-white transition-all duration-200 border border-[#E4572E]/20"
    >
      {children}
    </button>
  );
}

// ─── Delete Button ────────────────────────────────────────────────────────────
function DeleteBtn({ onClick, label = "Remove" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50
                 text-red-500 border border-red-100 text-[11px] font-bold
                 hover:bg-red-500 hover:text-white hover:border-red-500
                 transition-all duration-200 whitespace-nowrap flex-shrink-0"
    >
      {label}
    </button>
  );
}

// ─── Image Upload Field ───────────────────────────────────────────────────────
function ImageUploadField({ label, value, onChange, folder = "projects" }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file."); return; }
    setError(""); setUploading(true); setProgress(0);
    try {
      const url = await uploadToCloudinary(file, folder, (pct) => setProgress(pct));
      onChange(url);
    } catch (err) { setError("Upload failed: " + err.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="mt-3">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center flex items-center
                    justify-center min-h-[90px] transition-all duration-200 overflow-hidden
                    ${uploading ? "border-[#E4572E]/40 bg-orange-50/50 cursor-not-allowed"
                               : "border-gray-200 bg-white cursor-pointer hover:border-[#E4572E] hover:bg-orange-50/30"}`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }} />

        {value ? (
          <div className="w-full">
            <img src={value} alt="preview"
              className="max-h-[110px] max-w-full rounded-lg object-cover mx-auto block" />
            <p className="mt-2 text-[11px] text-gray-400">
              {uploading ? `Uploading… ${progress}%` : "Click or drag to replace"}
            </p>
          </div>
        ) : (
          <div>
            <div className="text-3xl mb-1.5">🖼️</div>
            <p className="text-[12px] text-gray-400 font-medium">
              {uploading ? `Uploading… ${progress}%` : "Click or drag & drop an image"}
            </p>
          </div>
        )}

        {uploading && (
          <div className="absolute bottom-0 left-0 h-1 bg-[#E4572E] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        )}
      </div>

      <input type="text" placeholder="Or paste image URL directly" value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-100 text-[12px]
                   text-gray-500 outline-none focus:border-[#E4572E] transition-all" />

      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ label, onDelete, deleteLabel = "Remove", children }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 mb-3 bg-gray-50/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <DeleteBtn onClick={onDelete} label={deleteLabel} />
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddProject() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleChange = (e) => setProjectData({ ...projectData, [e.target.name]: e.target.value });

  const handleYoutubeChange = (i, val) => {
    const u = [...projectData.youtubeVideos]; u[i] = val;
    setProjectData({ ...projectData, youtubeVideos: u });
  };
  const removeYoutube = (i) => {
    const u = projectData.youtubeVideos.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, youtubeVideos: u.length ? u : [""] });
  };

  const handleTagChange = (i, val) => {
    const updated = [...projectData.projectTags]; updated[i] = val;
    setProjectData({ ...projectData, projectTags: updated });
  };
  const removeTag = (i) => {
    const updated = projectData.projectTags.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, projectTags: updated.length ? updated : [""] });
  };

  const handleStatsChange = (i, field, val) => {
    const u = [...projectData.stats]; u[i][field] = val;
    setProjectData({ ...projectData, stats: u });
  };
  const removeStat = (i) => {
    const u = projectData.stats.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, stats: u.length ? u : [{ title: "", value: "" }] });
  };

  const handleAmenityChange = (i, field, val) => {
    const u = [...projectData.amenities]; u[i][field] = val;
    setProjectData({ ...projectData, amenities: u });
  };
  const removeAmenity = (i) => {
    const u = projectData.amenities.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, amenities: u.length ? u : [{ title: "", image: "" }] });
  };

  const handleGalleryChange = (i, val) => {
    const u = [...projectData.galleryImages]; u[i] = val;
    setProjectData({ ...projectData, galleryImages: u });
  };
  const removeGallery = (i) => {
    const u = projectData.galleryImages.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, galleryImages: u.length ? u : [""] });
  };

  const handleNearbyChange = (i, field, val) => {
    const u = [...projectData.nearbyPlaces]; u[i][field] = val;
    setProjectData({ ...projectData, nearbyPlaces: u });
  };
  const removeNearby = (i) => {
    const u = projectData.nearbyPlaces.filter((_, idx) => idx !== i);
    setProjectData({ ...projectData, nearbyPlaces: u.length ? u : [{ name: "", type: "", distance: "" }] });
  };

  const handleFloorName = (fi, val) => {
    const u = [...projectData.floors]; u[fi].floorName = val;
    setProjectData({ ...projectData, floors: u });
  };
  const removeFloor = (fi) => {
    const u = projectData.floors.filter((_, idx) => idx !== fi);
    setProjectData({ ...projectData, floors: u.length ? u : [{ floorName: "", rooms: [{ name: "", image: "" }] }] });
  };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addProject({ ...projectData, createdAt: new Date() });
      setToast({ type: "success", message: "Project uploaded successfully!" });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: error.message || "Failed to upload project." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F7F4]">

      {/* ── Toast (shared) ── */}
      <Toast show={toast} onClose={() => setToast(null)} />

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100
                      px-4 sm:px-8 h-14 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
          className="inline-flex items-center gap-1.5 text-[#1F2A44] text-sm font-semibold
                     hover:text-[#E4572E] transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"
               viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Dashboard
        </button>
        <span className="text-gray-200 text-lg">|</span>
        <span className="text-[#1F2A44] font-semibold text-sm">Add New Project</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[3px] text-[#E4572E] uppercase mb-1">Portfolio</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1F2A44]">Add New Project</h1>
          <p className="text-gray-400 text-sm mt-1">Fill in the details below to publish a new project</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Basic Details ── */}
          <Section title="Basic Details">
            <div className="space-y-4">
              <div>
                <FieldLabel>Project Title</FieldLabel>
                <Input type="text" name="title" placeholder="e.g. Skyline Heights" onChange={handleChange} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <Textarea name="description" placeholder="Project Description" onChange={handleChange} />
              </div>
              <div>
                <FieldLabel>Project Heading</FieldLabel>
                <Input type="text" name="projectHeading" placeholder="Project Heading" onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "year", placeholder: "Year (e.g. 2024)" },
                  { name: "location", placeholder: "Location" },
                  { name: "type", placeholder: "Project Type (e.g. Residential)" },
                  { name: "status", placeholder: "Status (e.g. Under Construction)" },
                  { name: "area", placeholder: "Area (e.g. 2500 sq.ft)" },
                  { name: "units", placeholder: "Units (e.g. 120 Units)" },
                  { name: "possessionTiming", placeholder: "Possession Timing (e.g. Dec 2026)" },
                  { name: "startingPrice", placeholder: "Starting Price (e.g. ₹45 Lakh)" },
                ].map(({ name, placeholder }) => (
                  <div key={name}>
                    <FieldLabel>{placeholder}</FieldLabel>
                    <Input type="text" name={name} placeholder={placeholder} onChange={handleChange} />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Project Tags ── */}
          <Section title="Project Tags">
            <p className="text-[11px] text-gray-400 mb-3">Example: Luxury, Premium, Smart Home, River View, 3BHK, Modern Living</p>
            <div className="space-y-2">
              {projectData.projectTags.map((tag, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input type="text" placeholder="Project Tag" value={tag}
                    onChange={(e) => handleTagChange(i, e.target.value)} />
                  <DeleteBtn onClick={() => removeTag(i)} />
                </div>
              ))}
            </div>
            <AddBtn onClick={() => setProjectData({ ...projectData, projectTags: [...projectData.projectTags, ""] })}>
              + Add Tag
            </AddBtn>
          </Section>

          {/* ── Main Image ── */}
          <Section title="Main Image">
            <p className="text-[11px] text-gray-400 mb-2">Uploaded to Cloudinary — only the URL is saved to Firebase.</p>
            <ImageUploadField label="Project Main Image" value={projectData.mainImage}
              onChange={(url) => setProjectData({ ...projectData, mainImage: url })}
              folder="projects/main" />
          </Section>

          {/* ── YouTube Videos ── */}
          <Section title="YouTube Videos">
            <div className="space-y-2">
              {projectData.youtubeVideos.map((video, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input type="text" placeholder="YouTube Video URL (e.g. https://youtu.be/xxxx)"
                    value={video} onChange={(e) => handleYoutubeChange(i, e.target.value)} />
                  <DeleteBtn onClick={() => removeYoutube(i)} />
                </div>
              ))}
            </div>
            <AddBtn onClick={() => setProjectData({ ...projectData, youtubeVideos: [...projectData.youtubeVideos, ""] })}>
              + Add Video Link
            </AddBtn>
          </Section>

          {/* ── Stats ── */}
          <Section title="Project Stats">
            <p className="text-[11px] text-gray-400 mb-3">e.g. Title: "Total Area" → Value: "5 Acres"</p>
            {projectData.stats.map((stat, i) => (
              <ItemCard key={i} label={`Stat ${i + 1}`} onDelete={() => removeStat(i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Title</FieldLabel>
                    <Input type="text" placeholder="Stat Title (e.g. Total Floors)" value={stat.title}
                      onChange={(e) => handleStatsChange(i, "title", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Value</FieldLabel>
                    <Input type="text" placeholder="Stat Value (e.g. 22)" value={stat.value}
                      onChange={(e) => handleStatsChange(i, "value", e.target.value)} />
                  </div>
                </div>
              </ItemCard>
            ))}
            <AddBtn onClick={() => setProjectData({ ...projectData, stats: [...projectData.stats, { title: "", value: "" }] })}>
              + Add Stat
            </AddBtn>
          </Section>

          {/* ── Amenities ── */}
          <Section title="Amenities">
            {projectData.amenities.map((amenity, i) => (
              <ItemCard key={i} label={`Amenity ${i + 1}`} onDelete={() => removeAmenity(i)}>
                <FieldLabel>Title</FieldLabel>
                <Input type="text" placeholder="Amenity Title (e.g. Swimming Pool)" value={amenity.title}
                  onChange={(e) => handleAmenityChange(i, "title", e.target.value)} />
                <ImageUploadField label="Amenity Icon / Image" value={amenity.image}
                  onChange={(url) => handleAmenityChange(i, "image", url)} folder="projects/amenities" />
              </ItemCard>
            ))}
            <AddBtn onClick={() => setProjectData({ ...projectData, amenities: [...projectData.amenities, { title: "", image: "" }] })}>
              + Add Amenity
            </AddBtn>
          </Section>

          {/* ── PDFs ── */}
          <Section title="Project Documents">
            <p className="text-[11px] text-gray-400 mb-3">Paste your PDF links directly (Google Drive, Cloudinary raw upload, etc.)</p>
            <div className="space-y-3">
              <div>
                <FieldLabel>Brochure PDF URL</FieldLabel>
                <Input type="text" name="brochurePdf" placeholder="Brochure PDF URL" onChange={handleChange} />
              </div>
              <div>
                <FieldLabel>Floor Plan PDF URL</FieldLabel>
                <Input type="text" name="floorPlanPdf" placeholder="Floor Plan PDF URL" onChange={handleChange} />
              </div>
            </div>
          </Section>

          {/* ── Floors ── */}
          <Section title="Floor Details">
            <p className="text-[11px] text-gray-400 mb-3">Add each floor with its rooms (e.g. Kitchen, Master Bedroom) and room images.</p>
            {projectData.floors.map((floor, fi) => (
              <div key={fi} className="border border-gray-200 rounded-xl p-4 sm:p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#1F2A44]">Floor {fi + 1}</span>
                  <DeleteBtn onClick={() => removeFloor(fi)} label="Delete Floor" />
                </div>
                <FieldLabel>Floor Name</FieldLabel>
                <Input type="text" placeholder="Floor Name (e.g. Ground Floor, First Floor)"
                  value={floor.floorName} onChange={(e) => handleFloorName(fi, e.target.value)} />

                <div className="mt-3 pl-2 sm:pl-4 border-l-2 border-[#E4572E]/20 space-y-4">
                  {floor.rooms.map((room, ri) => (
                    <div key={ri}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Room {ri + 1}</span>
                        <DeleteBtn onClick={() => removeRoom(fi, ri)} label="Delete Room" />
                      </div>
                      <FieldLabel>Room Name</FieldLabel>
                      <Input type="text" placeholder="Room Name (e.g. Kitchen, Master Bedroom)"
                        value={room.name} onChange={(e) => handleRoomChange(fi, ri, "name", e.target.value)} />
                      <ImageUploadField label="Room Image" value={room.image}
                        onChange={(url) => handleRoomChange(fi, ri, "image", url)} folder="projects/rooms" />
                    </div>
                  ))}
                </div>

                <AddBtn onClick={() => {
                  const u = [...projectData.floors];
                  u[fi].rooms.push({ name: "", image: "" });
                  setProjectData({ ...projectData, floors: u });
                }}>
                  + Add Room
                </AddBtn>
              </div>
            ))}
            <AddBtn onClick={() => setProjectData({
              ...projectData,
              floors: [...projectData.floors, { floorName: "", rooms: [{ name: "", image: "" }] }],
            })}>
              + Add Floor
            </AddBtn>
          </Section>

          {/* ── Gallery ── */}
          <Section title="Gallery Images">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectData.galleryImages.map((image, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Image {i + 1}</span>
                    <DeleteBtn onClick={() => removeGallery(i)} />
                  </div>
                  <ImageUploadField value={image}
                    onChange={(url) => handleGalleryChange(i, url)} folder="projects/gallery" />
                </div>
              ))}
            </div>
            <AddBtn onClick={() => setProjectData({ ...projectData, galleryImages: [...projectData.galleryImages, ""] })}>
              + Add Gallery Image
            </AddBtn>
          </Section>

          {/* ── Nearby Places ── */}
          <Section title="Nearby Places">
            <p className="text-[11px] text-gray-400 mb-3">e.g. Name: "Ayush Hospital" → Type: "Hospital" → Distance: "2 km"</p>
            {projectData.nearbyPlaces.map((place, i) => (
              <ItemCard key={i} label={`Place ${i + 1}`} onDelete={() => removeNearby(i)}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <Input type="text" placeholder="e.g. Ayush Hospital" value={place.name}
                      onChange={(e) => handleNearbyChange(i, "name", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Type</FieldLabel>
                    <Input type="text" placeholder="e.g. Hospital" value={place.type}
                      onChange={(e) => handleNearbyChange(i, "type", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Distance</FieldLabel>
                    <Input type="text" placeholder="e.g. 2 km" value={place.distance}
                      onChange={(e) => handleNearbyChange(i, "distance", e.target.value)} />
                  </div>
                </div>
              </ItemCard>
            ))}
            <AddBtn onClick={() => setProjectData({ ...projectData, nearbyPlaces: [...projectData.nearbyPlaces, { name: "", type: "", distance: "" }] })}>
              + Add Nearby Place
            </AddBtn>
          </Section>

          {/* ── Submit (shared) ── */}
          <AdminSubmitBtn
            loading={submitting}
            label="Upload Project"
            loadingLabel="Uploading…"
          />

        </form>
      </div>
    </div>
  );
}