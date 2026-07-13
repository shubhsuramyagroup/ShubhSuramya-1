// src/pages/ProjectDetailPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Fully dynamic — reads :projectId from the URL, fetches from Firestore,
// falls back gracefully when optional fields are absent.
//
// VISUAL REDESIGN NOTE: This pass reworks the presentation layer only —
// palette, type scale, spacing, glass/gradient treatments, and layout —
// to a premium SaaS / luxury real-estate aesthetic (Apple × Stripe × Airbnb
// Luxury). Every hook, state variable, function, Firestore call, and prop
// mapping below is unchanged from the original implementation.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getProjectById } from "../services/projectService"; // add getProjectById there (see README)

// Import Firebase tools required for Lead Form Interception
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// ─── Firestore field → page field mapping ────────────────────────────────────
/**
 * Expected Firestore document shape (all fields optional except title):
 *
 * title         string
 * description   string
 * longDescription  string
 * location      string
 * type          string          → "type" prop (Residential / Commercial …)
 * status        string          → "Under Construction" / "Completed" …
 * startingPrice    string          → "₹ 2.5 Cr"
 * mainImage        string          → hero / about image URL
 * videoSrc         string          → MP4 URL for hero background video
 * year             string | number → completion / launch year
 * tags             string[]        → hero tag pills
 * subtitle         string          → hero subtitle line
 * brochureUrl      string          → PDF download link
 * floorPlanUrl     string          → floor-plan download link
 *
 * stats            { value, suffix, label }[]   → Stats Band (≤ 4 items)
 *
 * amenities        { label, img }[]             → Amenities grid
 *
 * floors           {                            → Floor Previews
 * key, label, title,
 * rooms: { label, img }[]
 * }[]
 *
 * gallery          { id, src, alt }[]           → Image Gallery
 * OR  string[]                 → plain image URLs
 *
 * nearbyPlaces     {                            → Location section
 * name, sub, type,
 * distance, iconBg?,
 * iconType?  "hospital"|"mall"|"school"|"default"
 * }[]
 *
 * mapEmbed         string          → full Google Maps embed URL
 * mapLocationLabel string          → label shown on map pin (e.g. "Vastral, Ahmedabad")
 * locationTitle    string          → big heading in Location section
 * locationDesc     string          → paragraph in Location section
 */

function mapFirestoreToProps(p) {
  // ── stats ────────────────────────────────────────────────────────────────
  const stats =
    Array.isArray(p.stats) && p.stats.length > 0
      ? p.stats.slice(0, 4)
      : [
          { value: 48, suffix: "+", label: "Luxury Units" },
          { value: 8, suffix: " Floors", label: "Rise Above All" },
          { value: 12, suffix: "+", label: "Amenities" },
          { value: 99, suffix: "%", label: "Client Satisfaction" },
        ];

  // ── amenities ────────────────────────────────────────────────────────────
  const amenities =
    Array.isArray(p.amenities) && p.amenities.length > 0
      ? p.amenities.map((item) => ({
          label: item.title,
          img: item.image,
        }))
      : [
          {
            label: "Swimming Pool",
            img: "https://images.pexels.com/photos/14548470/pexels-photo-14548470.png",
          },
          {
            label: "Kids Pool",
            img: "https://images.pexels.com/photos/11114684/pexels-photo-11114684.jpeg",
          },
          {
            label: "Kids Play Area",
            img: "https://images.pexels.com/photos/29247929/pexels-photo-29247929.jpeg",
          },
          {
            label: "Pool Side Lounge",
            img: "https://images.pexels.com/photos/14548470/pexels-photo-14548470.png",
          },
        ];

  // ── floors ───────────────────────────────────────────────────────────────
  const floors =
    Array.isArray(p.floors) && p.floors.length > 0
      ? p.floors.map((floor, index) => ({
          key: "floor" + index,

          label: floor.floorName,

          title: floor.floorName,

          rooms: floor.rooms.map((room) => ({
            label: room.name,

            img: room.image,
          })),
        }))
      : [
          {
            key: "floor1",
            label: "Floor 1",
            title: "Floor 1",
            rooms: [
              {
                label: "Lobby",
                img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
              },
              {
                label: "Lounge",
                img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
              },
              {
                label: "Kitchen",
                img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80",
              },
            ],
          },
        ];

  // ── gallery ──────────────────────────────────────────────────────────────
  let gallery = [];
  if (Array.isArray(p.galleryImages) && p.galleryImages.length > 0) {
    gallery = p.galleryImages.map((item, i) =>
      typeof item === "string"
        ? { id: i + 1, src: item, alt: `Gallery ${i + 1}` }
        : {
            id: item.id ?? i + 1,
            src: item.src ?? item.url ?? item.img ?? "",
            alt: item.alt ?? item.label ?? `Image ${i + 1}`,
          },
    );
  } else {
    // fallback: use mainImage + any additionalImages array
    const imgs = [p.mainImage, ...(p.additionalImages || [])].filter(Boolean);
    gallery = imgs.map((src, i) => ({
      id: i + 1,
      src,
      alt: `${p.title ?? "Project"} ${i + 1}`,
    }));
    if (gallery.length === 0) {
      gallery = [
        {
          id: 1,
          src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
          alt: "Home 1",
        },
        {
          id: 2,
          src: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80",
          alt: "Home 2",
        },
        {
          id: 3,
          src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
          alt: "Home 3",
        },
        {
          id: 4,
          src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
          alt: "Home 4",
        },
        {
          id: 5,
          src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
          alt: "Home 5",
        },
      ];
    }
  }

  // ── nearby places ────────────────────────────────────────────────────────
  const nearbyPlaces =
    Array.isArray(p.nearbyPlaces) && p.nearbyPlaces.length > 0
      ? p.nearbyPlaces.map((place) => {
          let iconType = "default";

          if (/hospital|clinic|health/i.test(place.type)) {
            iconType = "hospital";
          } else if (/mall|shop|shopping/i.test(place.type)) {
            iconType = "mall";
          } else if (/school|college|education|university/i.test(place.type)) {
            iconType = "school";
          }

          return {
            ...place,
            iconType,
            iconBg:
              iconType === "hospital"
                ? "bg-red-50"
                : iconType === "mall"
                  ? "bg-blue-50"
                  : iconType === "school"
                    ? "bg-green-50"
                    : "bg-gray-50",
          };
        })
      : [];

  // ── normalise price ──────────────────────────────────────────────────────
  const price = p.startingPrice ?? p.price ?? "Contact us";

  return {
    projectName: p.title ?? "Project Details",
    projectSubtitle:
      p.subtitle ??
      "A timeless residence where light, stone, and silence become architecture.",
    projectLocation: p.location ?? "",
    projectYear: String(p.year ?? new Date().getFullYear()),
    projectTags:
      Array.isArray(p.projectTags) && p.projectTags.length > 0
        ? p.projectTags
        : ["Architecture", "Interior", "Landscape"],
    videoSrc:
      Array.isArray(p.youtubeVideos) && p.youtubeVideos.length > 0
        ? p.youtubeVideos[0]
        : "",
    title: p.longDescription
      ? (p.title ?? "Crafted for a Life of Elegance")
      : "Crafted for a Life of Elegance and Tranquility",
    description: p.description ?? "",
    image:
      p.mainImage ??
      "https://images.pexels.com/photos/29174529/pexels-photo-29174529.jpeg",
    location: p.location ?? "",
    type: p.type ?? "Residential",
    status: p.status ?? "—",
    price,
    brochureUrl: p.brochurePdf ?? "#",
    floorPlanUrl: p.floorPlanPdf ?? "#",
    stats,
    amenities,
    floors,
    gallery,
    nearbyPlaces,
    mapEmbed:
      p.mapEmbed ??
      `https://www.google.com/maps?q=${encodeURIComponent((p.location ?? "Ahmedabad") + " India")}&output=embed`,
    mapLocationLabel: p.mapLocationLabel ?? (p.location || "Location"),
    locationTitle: p.locationTitle ?? "An Icon of Coastal Elegance",
    locationDesc:
      p.locationDesc ??
      "Nestled in a thriving neighbourhood, this exclusive residence places you moments from the city's finest hospitals, shopping destinations, and green spaces — where every convenience is within easy reach.",
  };
}

// ─── Scroll Animation Hook ───────────────────────────────────────────────────
function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: options.threshold || 0.12,
        rootMargin: options.rootMargin || "0px",
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return progress;
}

function useParallax(speed = 0.3) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${centerY * speed}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);
  return ref;
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useScrollReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ─── Reveal Wrapper ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const [ref, visible] = useScrollReveal();
  const style = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? direction === "scale"
        ? "scale(1)"
        : direction === "left"
          ? "translateX(0)"
          : direction === "right"
            ? "translateX(0)"
            : "translateY(0)"
      : direction === "scale"
        ? "scale(0.88)"
        : direction === "left"
          ? "translateX(-60px)"
          : direction === "right"
            ? "translateX(60px)"
            : direction === "down"
              ? "translateY(-48px)"
              : "translateY(48px)",
    transition: `all 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  };
  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}

// ─── Icon helper for nearby places ──────────────────────────────────────────
function NearbyIcon({ iconType = "default" }) {
  if (iconType === "hospital")
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#e24b4a"
        strokeWidth="2"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  if (iconType === "mall")
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#378add"
        strokeWidth="2"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  if (iconType === "school")
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#639922"
        strokeWidth="2"
      >
        <path d="M4 19V8l8-5 8 5v11" />
        <path d="M9 19v-5a3 3 0 0 1 6 0v5" />
        <rect x="10" y="10" width="4" height="4" />
      </svg>
    );
  // default / park / restaurant
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#888"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// Custom simple Toast component to avoid introducing context or styling libraries
function FormToast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-[10000] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border transition-all duration-300 animate-[toastIn_0.35s_cubic-bezier(.34,1.56,.64,1)_both] ${
        type === "success"
          ? "bg-[#16A34A]/95 text-white border-white/20"
          : "bg-[#E4572E]/95 text-white border-white/20"
      }`}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 flex-shrink-0">
        {type === "success" ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </span>
      <span className="text-[13px] font-medium tracking-wide">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white ml-2 text-xs">✕</button>
    </div>
  );
}

function iconBgForType(iconType) {
  if (iconType === "hospital") return "bg-red-50";
  if (iconType === "mall") return "bg-blue-50";
  if (iconType === "school") return "bg-green-50";
  return "bg-gray-50";
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#1F2A44] flex flex-col items-center justify-center gap-6">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-[#E4572E] border-t-transparent animate-spin" />
      </div>
      <p className="text-white/40 text-[11px] tracking-[0.32em] uppercase font-light">
        Loading Project
      </p>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ message, onBack }) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[#FFE9E2] flex items-center justify-center mb-2">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E4572E"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-[#1F2A44]">{message}</h2>
      <p className="text-[#6B7280] text-sm max-w-sm">
        The project you're looking for doesn't exist or could not be loaded.
      </p>
      <button
        onClick={onBack}
        className="mt-2 px-7 py-3.5 rounded-full bg-[#E4572E] text-white text-[13px] font-semibold tracking-wide hover:bg-[#c73b22] hover:shadow-lg hover:shadow-[#E4572E]/30 transition-all duration-300"
      >
        ← Back to Projects
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  // ── routing ────────────────────────────────────────────────────────────────
  const { projectId } = useParams();
  const navigate = useNavigate();

  // ── fetch state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [props, setProps] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    LoadingSkeleton(true);
    setError(null);
    getProjectById(projectId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Project not found.");
        } else {
          setProps(mapFirestoreToProps(data));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load project:", err);
        setError(
          "Failed to load project. Please check your connection and try again.",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ── ui state ──────────────────────────────────────────────────────────────
  const [pageLoaded, setPageLoaded] = useState(false);
  const videoRef = useRef(null);
  const parallaxBg = useParallax(0.18);
  const scrollProgress = useScrollProgress();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ── lead generation states ──────────────────────────────────────────────
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [downloadType, setDownloadType] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [savingLead, setSavingLead] = useState(false);
  
  // Local form inputs configuration
  const [leadForm, setLeadForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    message: ""
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const p = video.play();
    if (p !== undefined) p.catch(() => {});
  }, [props]);

  // ── floor / room state ────────────────────────────────────────────────────
  const [activeFloor, setActiveFloor] = useState(null);
  const [activeRoom, setActiveRoom] = useState(0);
  const [floorMenuOpen, setFloorMenuOpen] = useState(false);
  const [roomChanging, setRoomChanging] = useState(false);

  useEffect(() => {
    if (props?.floors?.length > 0 && !activeFloor) {
      setActiveFloor(props.floors[0].key);
    }
  }, [props]);

  // ── gallery hover ─────────────────────────────────────────────────────────
  const [hoveredId, setHoveredId] = useState(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleFloorChange = (key) => {
    setActiveFloor(key);
    setActiveRoom(0);
    setFloorMenuOpen(false);
  };
  const handleRoomChange = (i) => {
    setRoomChanging(true);
    setTimeout(() => {
      setActiveRoom(i);
      setRoomChanging(false);
    }, 200);
  };

  const getFlex = (id) => {
    if (!hoveredId) return "1";
    if (hoveredId === id) return "4";
    return "0.4";
  };

  // ── Lead capturing intercept functions ───────────────────────────────────
  const handleDownloadRequest = (type, url) => {
    if (!url || url === "#") {
      alert(`${type === "brochure" ? "Brochure" : "Floor plan"} coming soon. Please contact us.`);
      return;
    }
    setDownloadType(type);
    setDownloadUrl(url);
    setShowLeadModal(true);
  };

  const handleModalClose = () => {
    if (savingLead) return;
    setShowLeadModal(false);
    setDownloadType(null);
    setDownloadUrl("");
    setLeadForm({
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      message: ""
    });
  };

  const handleLeadSubmit = async (e) => {
  e.preventDefault();
  if (savingLead) return;

  // 1. Added 'message' to destructuring assignment
  const { fullName, email, phone, dateOfBirth, message } = leadForm;
  
  // 2. Removed trailing logical OR operator (||) syntax error below
  if (
  !fullName.trim() || 
  !email.trim() || 
  !phone.trim() || 
  !dateOfBirth.trim()
) {
  setToast({ message: "All fields are required and cannot contain empty spaces only.", type: "error" });
  return;
}

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    setToast({ message: "Please enter a valid email address.", type: "error" });
    return;
  }

  try {
    setSavingLead(true);
    
    const mappedSource = downloadType === "brochure" ? "Brochure Download" : "Floor Plan Download";
    
    // Store dynamic structure document safely to existing Contacts collection
    await addDoc(collection(db, "contacts"), {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth,
      message: message ? message.trim() : "", // Safe fallback check if message is optional
      projectId: projectId,
      projectName: props?.projectName || "Project Details",
      source: mappedSource,
      createdAt: serverTimestamp()
    });

    setToast({ message: "Details submitted successfully! Starting your download...", type: "success" });
    
    // Perform the original request target resolution workflow natively
    const targetAnchor = document.createElement("a");
    targetAnchor.href = downloadUrl;
    targetAnchor.target = "_blank";
    targetAnchor.download = true;
    document.body.appendChild(targetAnchor);
    targetAnchor.click();
    document.body.removeChild(targetAnchor);

    // Clean resetting hook triggers
    setShowLeadModal(false);
    setDownloadType(null);
    setDownloadUrl("");
    setLeadForm({
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      message: ""
    });
  } catch (err) {
    console.error("Error saving lead payload details: ", err);
    setToast({ message: "Failed to submit request parameters. Please try again.", type: "error" });
  } finally {
    setSavingLead(false);
  }
};

  // ── flex structural calculations mapping hooks bounds parsing ───────────
  if (loading) return <LoadingSkeleton />;
  if (error || !props)
    return (
      <ErrorState
        message={error ?? "Something went wrong."}
        onBack={() => navigate("/projects")}
      />
    );

  // ── destructure props ─────────────────────────────────────────────────────
  const {
    projectName,
    projectSubtitle,
    projectLocation,
    projectYear,
    projectTags,
    videoSrc,
    title,
    description,
    image,
    location,
    type,
    status,
    price,
    brochureUrl,
    floorPlanUrl,
    stats,
    amenities,
    floors,
    gallery,
    nearbyPlaces,
    mapEmbed,
    mapLocationLabel,
    locationTitle,
    locationDesc,
  } = props;

  const floor = floors.find((f) => f.key === activeFloor) ?? floors[0];

  const getYoutubeId = (url) => {
    if (!url) return "";

    // youtu.be
    if (url.includes("youtu.be")) {
      return url.split("/").pop().split("?")[0];
    }

    // youtube.com/watch?v=
    if (url.includes("v=")) {
      return url.split("v=")[1].split("&")[0];
    }

    // shorts
    if (url.includes("/shorts/")) {
      return url.split("/shorts/")[1].split("?")[0];
    }

    return "";
  };

  const youtubeId = getYoutubeId(videoSrc);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />

      {toast && (
        <FormToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');

        :root {
          --pd-primary: #1F2A44;
          --pd-accent: #E4572E;
          --pd-accent-soft: #FFE9E2;
          --pd-bg: #F8F7F4;
          --pd-card: #FFFFFF;
          --pd-border: rgba(31,42,68,0.08);
          --pd-text-secondary: #6B7280;
          --pd-success: #16A34A;
        }

        *, *::before, *::after { box-sizing: border-box; }
        html, body { overflow-x: hidden; width: 100%; }
        #root { overflow-x: hidden; width: 100%; }

        .pd-root { font-family: 'Manrope', sans-serif; }
        .pd-display { font-family: 'Montserrat', sans-serif; }

        @keyframes scrollLineDrop {
          0%   { transform: translateY(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scrollTopReveal {
          from { opacity: 0; transform: translateY(16px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scrollTopBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes heroLineGrow {
          from { width: 0; opacity: 0; }
          to   { width: 48px; opacity: 1; }
        }
        @keyframes heroContentIn {
          0%   { opacity: 0; transform: translateY(50px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes badgePop {
          0%   { opacity: 0; transform: scale(0.7) translateY(10px); }
          70%  { transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .hero-badge   { animation: badgePop 0.7s cubic-bezier(.34,1.56,.64,1) 0.4s both; }
        .hero-h1      { animation: heroContentIn 0.9s cubic-bezier(.22,1,.36,1) 0.65s both; }
        .hero-line    { animation: heroLineGrow 0.6s cubic-bezier(.22,1,.36,1) 1.1s both; }
        .scroll-line  { animation: scrollLineDrop 1.8s ease-in-out infinite; }
        .scroll-top-btn { animation: scrollTopReveal 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .scroll-top-btn:hover .scroll-top-arrow { animation: scrollTopBounce 0.6s ease infinite; }
        .scroll-progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, #E4572E, #ff8a5c); z-index: 9999; transition: width 0.1s linear; box-shadow: 0 0 10px rgba(228,87,46,0.5); }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #FDFAF6; }
        ::-webkit-scrollbar-thumb { background: #E4572E; border-radius: 3px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .room-img-fade { transition: opacity 0.2s ease; }
        .room-img-fade.changing { opacity: 0; }

        .pd-float { animation: floatSlow 6s ease-in-out infinite; }
        .pd-glass {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.5);
        }
        .pd-glass-dark {
          background: rgba(20,26,40,0.55);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.14);
        }
        .pd-card {
          background: var(--pd-card);
          border: 1px solid var(--pd-border);
          border-radius: 28px;
          transition: transform 0.45s cubic-bezier(.22,1,.36,1), box-shadow 0.45s cubic-bezier(.22,1,.36,1), border-color 0.45s ease;
        }
        .pd-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px -20px rgba(31,42,68,0.22);
          border-color: rgba(228,87,46,0.25);
        }
        .pd-gradient-cta {
          background: linear-gradient(120deg, #1F2A44 0%, #2c3a5e 45%, #E4572E 150%);
          background-size: 200% 200%;
          animation: gradientShift 10s ease infinite;
        }
        .pd-section-pad { padding-top: 88px; padding-bottom: 88px; }
        @media (max-width: 1024px) { .pd-section-pad { padding-top: 64px; padding-bottom: 64px; } }
        @media (max-width: 640px)  { .pd-section-pad { padding-top: 44px; padding-bottom: 44px; } }
      `}</style>

      <div className="pd-root">

      {/* ── SCROLL PROGRESS BAR ── */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* ── SCROLL TO TOP ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="scroll-top-btn fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-[9000] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E34A2F] flex items-center justify-center shadow-lg hover:bg-[#c73b22] transition-colors duration-200 cursor-pointer"
          style={{ boxShadow: "0 4px 20px rgba(227,74,47,0.4)" }}
          aria-label="Scroll to top"
        >
          <span className="scroll-top-arrow flex items-center justify-center text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </span>
        </button>
      )}

      {/* ── HERO ── */}
      <section className="relative w-full h-screen min-h-[500px] overflow-hidden bg-black flex flex-col items-center justify-center">
        <div ref={parallaxBg} className="absolute inset-0 overflow-hidden">
          {youtubeId ? (
            <div
              className="absolute top-1/2 left-1/2"
              style={{
                width: "177.77777778vh",
                height: "56.25vw",
                minWidth: "100%",
                minHeight: "100%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1&modestbranding=1&rel=0`}
                title="Background Video"
                allow="autoplay; fullscreen"
                allowFullScreen
                className={`w-full h-full transition-transform duration-[14000ms] ease-out ${
                  pageLoaded ? "scale-100" : "scale-105"
                }`}
                style={{
                  border: "none",
                  filter: "brightness(0.38) saturate(0.65)",
                  pointerEvents: "none",
                }}
              />
            </div>
          ) : (
            <img
              src={image}
              alt={projectName}
              className={`w-full h-full object-cover transition-transform duration-[14000ms] ease-out ${
                pageLoaded ? "scale-100" : "scale-105"
              }`}
              style={{
                filter: "brightness(0.38) saturate(0.65)",
              }}
            />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />

        <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-[11px] font-light tracking-[0.18em] sm:tracking-[0.22em] uppercase mb-5 sm:mb-6"
            style={{
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "translateY(0)" : "translateY(28px)",
              transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.3s",
            }}
          >
            <a
              href="/"
              className="text-white/55 hover:text-white transition-colors"
            >
              Home
            </a>
            <span className="text-white/35">›</span>
            <a
              href="/projects"
              className="text-white/55 hover:text-white transition-colors"
            >
              Projects
            </a>
            <span className="text-white/35">›</span>
            <span className="text-white/90">{projectName}</span>
          </nav>

          <p
            className="text-[10px] font-light tracking-[0.3em] sm:tracking-[0.38em] uppercase text-white/45 mb-3 sm:mb-4"
            style={{
              opacity: pageLoaded ? 1 : 0,
              transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.5s",
            }}
          >
            {type} · {projectYear}
          </p>

          <h1
            className="font-light tracking-[0.1em] sm:tracking-[0.14em] uppercase text-white leading-none"
            style={{
              fontSize:
                projectName?.length <= 10
                  ? "clamp(60px, 12vw, 160px)"
                  : projectName?.length <= 20
                    ? "clamp(48px, 10vw, 120px)"
                    : "clamp(36px, 8vw, 92px)",

              lineHeight: projectName?.length <= 10 ? "1.1" : "0.95",

              opacity: pageLoaded ? 1 : 0,

              transform: pageLoaded
                ? "translateY(0) scale(1)"
                : "translateY(40px) scale(0.96)",

              transition: "all 1.1s cubic-bezier(.22,1,.36,1) 0.6s",
            }}
          >
            {projectName}
          </h1>

          <p
            className="text-white/60 text-[12px] sm:text-[13px] mt-4 sm:mt-5 max-w-xs sm:max-w-md px-2"
            style={{
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.9s",
            }}
          >
            {projectSubtitle}
          </p>

          <div className="flex items-center gap-2 sm:gap-4 mt-5 sm:mt-7 flex-wrap justify-center">
            {projectTags.map((tag, i) => (
              <span
                key={tag}
                className="text-[8px] sm:text-[9px] tracking-[0.22em] sm:tracking-[0.28em] uppercase text-white/40 border border-white/20 px-2.5 sm:px-3 py-1 hover:border-white/50 hover:text-white/70 transition-all duration-300"
                style={{ animationDelay: `${900 + i * 150}ms` }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            className="h-px bg-white/40 mt-5 sm:mt-6 w-16 sm:w-20"
            style={{
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "scaleX(1)" : "scaleX(0)",
              transition: "all 0.8s ease 1.2s",
              transformOrigin: "center",
            }}
          />
        </div>

        {/* Bottom Left */}
        <div
          className="absolute bottom-8 sm:bottom-12 left-4 sm:left-10 text-white/70"
          style={{
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? "translateX(0)" : "translateX(-20px)",
            transition: "all 0.8s ease 1s",
          }}
        >
          <p className="text-[9px] sm:text-[10px] uppercase opacity-50">
            Location
          </p>
          <p className="text-[13px] sm:text-[15px]">{projectLocation}</p>
        </div>

        {/* Bottom Right */}
        <div
          className="absolute bottom-8 sm:bottom-12 right-4 sm:right-10 text-right text-white/70"
          style={{
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? "translateX(0)" : "translateX(20px)",
            transition: "all 0.8s ease 1s",
          }}
        >
          <p className="text-[9px] sm:text-[10px] uppercase opacity-50">Year</p>
          <p className="text-[13px] sm:text-[15px]">{projectYear}</p>
        </div>

        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-[11px] sm:text-xs">
          Scroll ↓
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="w-full bg-[#1F2A44] relative overflow-hidden pd-section-pad px-3 sm:px-4 lg:px-8 xl:px-12">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {stats.map((stat, i) => {
            const isNumber =
              !isNaN(
                parseFloat(stat.value)
              ) &&
              /^\d+/.test(
                stat.value
              );

            const numericValue =
              parseFloat(stat.value);

            const suffix =
              stat.value.replace(
                numericValue,
                ""
              );

            return (
              <Reveal
                key={stat.title}
                delay={i * 120}
                direction="up"
              >
                <div
                  className="relative text-center py-8 sm:py-9 px-2 sm:px-3 rounded-3xl cursor-default overflow-hidden min-h-[140px] sm:min-h-[160px] flex flex-col justify-center border border-white/10 hover:border-[#E4572E]/40 transition-all duration-500 hover:-translate-y-1.5 group"
                  style={{
                    background: "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
                  }}
                >
                  <div
                    className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#E4572E]/0 group-hover:bg-[#E4572E]/20 blur-2xl transition-all duration-500"
                  />
                  <div className="w-full overflow-hidden flex justify-center relative">
                    <p
                      className="pd-display font-light text-white leading-none whitespace-nowrap"
                      style={{
                        fontSize:
                          "clamp(22px,3.8vw,44px)",

                        transform:
                          stat.value.length >
                          20
                            ? "scale(0.55)"
                            : stat.value
                                .length >
                              16
                              ? "scale(0.68)"
                              : stat.value
                                  .length >
                                12
                                ? "scale(0.8)"
                                : "scale(1)",

                        transformOrigin:
                          "center",

                        display:
                          "inline-block",
                      }}
                    >
                      {isNumber ? (
                        <AnimatedCounter
                          target={
                            numericValue
                          }
                          suffix={suffix}
                        />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>

                  <p className="text-[9px] sm:text-[10px] tracking-[0.22em] uppercase text-white/40 mt-3.5 leading-relaxed px-1 break-words relative">
                    {stat.title}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="w-full pd-section-pad px-3 sm:px-4 lg:px-8 xl:px-12 bg-[#F8F7F4] relative overflow-hidden">
        <div
          className="absolute top-1/3 -left-32 w-96 h-96 rounded-full opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle, #FFE9E2 0%, transparent 70%)" }}
        />
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 sm:gap-14 items-center relative">
          {/* Image */}
          <Reveal direction="left" delay={100}>
            <div className="relative">
              <div className="rounded-[32px] overflow-hidden h-[340px] sm:h-[440px] md:h-[520px] shadow-2xl shadow-[#1F2A44]/10">
                <img
                  src={image}
                  alt={projectName}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              {/* Floating info card */}
              <div className="pd-card hidden sm:flex absolute -bottom-8 -right-6 md:-right-10 shadow-xl p-5 md:p-6 items-center gap-4 max-w-[240px]">
                <div className="w-11 h-11 rounded-2xl bg-[#FFE9E2] flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#A0A8B5] mb-0.5">Status</p>
                  <p className="text-[13px] font-semibold text-[#1F2A44]">{status}</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <div className="flex flex-col gap-7 md:pt-6">
            <Reveal direction="right" delay={200}>
              <div className="flex flex-col gap-4 sm:gap-5">
                <span className="inline-flex w-fit items-center bg-[#FFE9E2] text-[#E4572E] rounded-full px-4 py-1.5 text-[10px] sm:text-[11px] tracking-widest font-semibold uppercase">
                  About {projectName}
                </span>
                <h2 className="pd-display text-[clamp(26px,3.6vw,44px)] text-[#1F2A44] leading-[1.08] font-medium">
                  {title}
                </h2>
                <p className="text-[14px] leading-relaxed text-[#6B7280]">
                  {description}
                </p>
              </div>
            </Reveal>

            <Reveal direction="up" delay={350}>
              <div className="pd-card p-5 sm:p-6">
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { label: "Location", value: location },
                    { label: "Type", value: type },
                    { label: "Status", value: status },
                  ].map((item) => (
                    <div key={item.label} className="min-w-0">
                      <p className="text-[9px] tracking-[0.24em] uppercase text-[#A0A8B5] mb-1.5">
                        {item.label}
                      </p>
                      <p className="text-[13px] sm:text-[14px] text-[#1F2A44] font-semibold truncate">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal direction="up" delay={480}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 bg-[#1F2A44] rounded-3xl p-5 sm:p-6">
                <div className="flex flex-col gap-0.5 flex-1">
                  <p className="text-[9px] tracking-[0.24em] uppercase text-white/40">
                    Starting Price
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="pd-display text-[clamp(24px,2.8vw,34px)] font-semibold text-white leading-tight tracking-tight">
                      {price}
                    </span>
                    <span className="text-[12px] text-white/40 font-normal">
                      onwards
                    </span>
                  </div>
                </div>

                {brochureUrl && brochureUrl !== "#" ? (
                  <button
                    onClick={() => handleDownloadRequest("brochure", brochureUrl)}
                    className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#E4572E] hover:bg-white transition-all duration-300 cursor-pointer flex-shrink-0"
                  >
                    <span className="text-[11px] tracking-[0.16em] uppercase font-semibold text-white group-hover:text-[#E4572E] transition-colors duration-300">
                      Download Brochure
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white group-hover:text-[#E4572E] transition-all duration-300 group-hover:translate-y-0.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      alert("Brochure coming soon. Please contact us.")
                    }
                    className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/10 hover:bg-[#E4572E] transition-all duration-300 cursor-pointer flex-shrink-0"
                  >
                    <span className="text-[11px] tracking-[0.16em] uppercase font-semibold text-white transition-colors duration-300">
                      Request Brochure
                    </span>
                  </button>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── AMENITIES ── */}
      {amenities.length > 0 && (
        <section className="w-full pd-section-pad px-3 sm:px-4 lg:px-8 xl:px-12 bg-white text-center overflow-hidden">
          <Reveal direction="up">
            <span className="inline-flex items-center bg-[#F8F7F4] text-[#E4572E] rounded-full px-4 py-1.5 text-[10px] sm:text-[11px] tracking-widest font-semibold uppercase mb-5">
              Lifestyle & Comfort
            </span>
            <h2 className="pd-display text-[clamp(24px,4vw,46px)] font-medium text-[#1F2A44] leading-snug mb-10 sm:mb-14 max-w-2xl mx-auto">
              Unparalleled amenities for unmatched living
            </h2>
          </Reveal>

          {/* Desktop — asymmetric masonry-style grid */}
          <div className="hidden md:grid grid-cols-4 gap-4 sm:gap-5 w-full max-w-[1400px] mx-auto">
            {amenities.map(({ label, img }, i) => (
              <Reveal
                key={label}
                delay={i * 120}
                direction="up"
              >
                <div
                  className="relative rounded-[26px] overflow-hidden group cursor-pointer w-full h-[360px]"
                >
                  <img
                    src={img}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center transform group-hover:rotate-45 group-hover:bg-[#E4572E] transition-all duration-300">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="white"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </div>
                  <span className="absolute bottom-4 left-4 right-4 text-left text-[14px] font-semibold text-white tracking-wide">
                    {label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Mobile */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {amenities.map(({ label, img }, i) => (
              <Reveal key={label} delay={i * 100} direction="scale">
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer h-[200px] sm:h-[260px]">
                  <img
                    src={img}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[12px] font-semibold text-white">
                    {label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── FLOOR PREVIEWS ── */}
      {floors.length > 0 && floor && (
        <section id="pd-floor-plan" className="w-full pd-section-pad px-3 sm:px-4 lg:px-8 xl:px-12 bg-[#F8F7F4]">
          <div className="max-w-[1400px] mx-auto">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <Reveal direction="left">
              <div>
                <span className="inline-flex items-center bg-white text-[#E4572E] rounded-full px-4 py-1.5 text-[10px] tracking-widest font-semibold uppercase mb-3 border border-[#E3E6EA]">
                  Explore The Space
                </span>
                <h2 className="pd-display text-[28px] sm:text-[38px] font-medium text-[#1F2A44]">
                  Floor Previews
                </h2>
              </div>
            </Reveal>
            <Reveal direction="right" delay={200}>
              <button
                className="inline-flex items-center gap-3 rounded-full px-5 sm:px-6 py-3 text-[11px] sm:text-[12px] tracking-wide font-semibold uppercase text-white bg-[#1F2A44] hover:bg-[#E4572E] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 w-fit cursor-pointer"
              >
                Download Floor Plan
                <span className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <svg
                    className="w-3 sm:w-3.5 h-3 sm:h-3.5"
                    fill="none"
                    stroke="white"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
              </button>
            </Reveal>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-4">
            <div className="relative">
              <button
                onClick={() => setFloorMenuOpen(!floorMenuOpen)}
                className="w-full flex items-center justify-between bg-white border border-[#E9EDF2] rounded-2xl px-4 py-3.5 text-[14px] text-[#1F2A44] font-semibold transition-shadow hover:shadow-md"
              >
                <span>{floor.label}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${floorMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="#1F2A44"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {floorMenuOpen && (
                <div className="absolute top-full left-0 right-0 z-30 bg-white border border-[#E9EDF2] rounded-2xl mt-1 overflow-hidden shadow-xl">
                  {floors.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleFloorChange(f.key)}
                      className={`w-full px-4 py-3 text-left text-[13px] transition border-b border-[#F0F2F5] last:border-0 ${activeFloor === f.key ? "bg-[#FFF1EC] text-[#E4572E] font-semibold" : "text-[#6B7280] hover:bg-[#F4F6F8]"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="pd-display text-[20px] text-[#1F2A44] font-semibold">
              {floor.title}
            </p>
            <div
              className={`relative rounded-2xl overflow-hidden h-[220px] sm:h-[280px] room-img-fade ${roomChanging ? "changing" : ""}`}
            >
              <img
                src={floor.rooms[activeRoom]?.img}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {floor.rooms.map((room, i) => (
                <div
                  key={i}
                  onClick={() => handleRoomChange(i)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer flex-shrink-0 w-[110px] h-[80px] transition-all ${activeRoom === i ? "ring-2 ring-[#E4572E] ring-offset-2" : "opacity-70"}`}
                >
                  <img
                    src={room.img}
                    alt={room.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 text-[10px] text-white">
                    {room.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop — dashboard style */}
          <Reveal direction="up" delay={100}>
            <div className="hidden md:block">
              <div className="bg-white rounded-[32px] p-3 grid md:grid-cols-[260px_1fr] gap-3 shadow-xl shadow-[#1F2A44]/[0.06] border border-[#E9EDF2] min-h-[560px]">
                {/* Sidebar */}
                <div className="flex flex-col gap-1.5 bg-[#F8F7F4] rounded-[24px] p-3 overflow-y-auto no-scrollbar">
                  <p className="text-[9px] tracking-[0.22em] uppercase text-[#A0A8B5] px-3 pt-2 pb-1">
                    Select Floor
                  </p>
                  {floors.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleFloorChange(f.key)}
                      className={`px-4 py-3.5 rounded-2xl text-left flex justify-between items-center transition-all duration-300 ${activeFloor === f.key ? "bg-[#1F2A44] text-white shadow-md" : "text-[#6B7280] hover:bg-white"}`}
                    >
                      <span className="text-[13px] font-medium">{f.label}</span>
                      {activeFloor === f.key && (
                        <span className="w-6 h-6 rounded-full bg-[#E4572E] flex items-center justify-center">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="white"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Preview panel */}
                <div className="flex flex-col h-full overflow-hidden p-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="pd-display text-[24px] text-[#1F2A44] font-semibold">
                      {floor.title}
                    </p>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#A0A8B5]">
                      Room {activeRoom + 1} / {floor.rooms.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-4 flex-1 min-h-0">
                    <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pr-1 h-full">
                      {floor.rooms.map((room, i) => (
                        <div
                          key={i}
                          onClick={() => handleRoomChange(i)}
                          className={`relative rounded-2xl overflow-hidden cursor-pointer h-[110px] flex-shrink-0 transition-all duration-300 ${activeRoom === i ? "ring-2 ring-[#E4572E] ring-offset-2 scale-[1.02]" : "opacity-60 hover:opacity-100"}`}
                        >
                          <img
                            src={room.img}
                            alt={room.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 text-[11px] font-medium text-white">
                            {room.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`relative rounded-[24px] overflow-hidden h-full room-img-fade ${roomChanging ? "changing" : ""}`}
                    >
                      <img
                        src={floor.rooms[activeRoom]?.img}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          </div>
        </section>
      )}

      {/* ── IMAGE GALLERY ── */}
      {gallery.length > 0 && (
        <section className="w-full pd-section-pad px-3 sm:px-4 lg:px-8 xl:px-12 bg-white overflow-hidden">
          <div className="max-w-[1400px] mx-auto">
          <Reveal direction="up">
            <div className="text-center mb-8 sm:mb-10">
              <span className="inline-flex items-center bg-[#F8F7F4] text-[#E4572E] rounded-full px-4 py-1.5 text-[10px] tracking-widest font-semibold uppercase mb-4">
                Gallery
              </span>
              <h2 className="pd-display text-2xl sm:text-3xl font-medium text-[#1F2A44] tracking-tight">
                A closer look
              </h2>
            </div>
          </Reveal>

          {/* Desktop */}
          <Reveal direction="up" delay={200}>
            <div className="hidden sm:flex gap-3 h-[400px] md:h-[480px] items-stretch overflow-hidden w-full">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  className="relative overflow-hidden rounded-[24px] cursor-pointer"
                  style={{
                    flex: getFlex(img.id),
                    transition: "flex 0.5s cubic-bezier(0.4,0,0.2,1)",
                  }}
                  onMouseEnter={() => setHoveredId(img.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover block"
                    style={{
                      transform:
                        hoveredId === img.id ? "scale(1.06)" : "scale(1)",
                      transition: "transform 0.6s ease",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.65), transparent 45%)",
                      opacity: hoveredId === img.id ? 1 : 0.15,
                      transition: "opacity 0.4s ease",
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 p-4"
                    style={{
                      opacity: hoveredId === img.id ? 1 : 0,
                      transform: hoveredId === img.id ? "translateY(0)" : "translateY(8px)",
                      transition: "all 0.4s ease",
                    }}
                  >
                    <span className="text-white text-[12px] font-medium">
                      {img.alt}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center opacity-0 group-hover:opacity-100"
                    style={{ opacity: hoveredId === img.id ? 1 : 0, transition: "opacity 0.3s ease" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Mobile */}
          <div className="sm:hidden grid grid-cols-2 gap-2.5">
            {gallery.map((img, i) => (
              <Reveal key={img.id} delay={i * 80} direction="scale">
                <div
                  className={`relative overflow-hidden rounded-2xl cursor-pointer ${i === 0 ? "col-span-2 h-[200px]" : "h-[150px]"}`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover block transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </Reveal>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* ── LOCATION ── */}
      <section className="bg-[#F8F7F4] pd-section-pad px-3 sm:px-4 lg:px-8 xl:px-12 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 items-end">
          <Reveal direction="left">
            <div>
              <span className="inline-flex items-center bg-white text-[#E4572E] rounded-full px-4 py-1.5 text-[10px] tracking-widest font-semibold uppercase mb-4 border border-[#E3E6EA]">
                Neighbourhood
              </span>
              <h2 className="pd-display text-[26px] sm:text-[36px] font-medium leading-tight text-[#1F2A44]">
                {locationTitle.includes("\n")
                  ? locationTitle.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i === 0 && <br />}
                      </span>
                    ))
                  : locationTitle}
              </h2>
            </div>
          </Reveal>
          <Reveal direction="right" delay={150}>
            <p className="text-[13px] text-[#6B7280] leading-[1.75]">
              {locationDesc}
            </p>
          </Reveal>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {/* Nearby places */}
          <Reveal direction="left" delay={200}>
            <div className="flex flex-col gap-4 sm:gap-5">
              {nearbyPlaces.length > 0 ? (
                <div className="pd-card overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] bg-[#F8F7F4] px-[16px] sm:px-[20px] py-[12px]">
                    <span className="text-[10px] uppercase tracking-[.07em] font-semibold text-[#A0A8B5]">
                      Nearby Places
                    </span>
                    <span className="text-[10px] uppercase tracking-[.07em] font-semibold text-[#A0A8B5] px-3 sm:px-4">
                      Type
                    </span>
                    <span className="text-[10px] uppercase tracking-[.07em] font-semibold text-[#A0A8B5]">
                      Distance
                    </span>
                  </div>
                  {nearbyPlaces.map((p, i) => {
                    const iconType =
                      p.iconType ??
                      (/hospital|clinic|health/i.test(p.type)
                        ? "hospital"
                        : /mall|shop/i.test(p.type)
                          ? "mall"
                          : /school|college|university/i.test(p.type)
                            ? "school"
                            : "default");
                    const bg = p.iconBg ?? iconBgForType(iconType);
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_auto_auto] items-center px-[16px] sm:px-[20px] py-[13px] sm:py-[14px] border-t border-[#F0F2F5] hover:bg-[#FAFAF9] transition-all cursor-default"
                      >
                        <div className="flex items-center gap-[10px] min-w-0">
                          <div
                            className={`w-8 sm:w-9 h-8 sm:h-9 rounded-[11px] flex items-center justify-center flex-shrink-0 ${bg} transition-transform hover:scale-110`}
                          >
                            <NearbyIcon iconType={iconType} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] sm:text-[13px] font-semibold text-[#1F2A44] truncate">
                              {p.name}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-[#A0A8B5] mt-[1px]">
                              {p.sub}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-[#A0A8B5] px-2 sm:px-4 hidden xs:block">
                          {p.type}
                        </span>
                        <span className="bg-[#F0EFEC] text-[#1F2A44] text-[10px] sm:text-[11px] font-semibold rounded-full px-[10px] sm:px-[12px] py-[4px] whitespace-nowrap transition-colors hover:bg-[#E4572E] hover:text-white">
                          {p.distance}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pd-card p-8 text-center text-[#A0A8B5] text-sm">
                  Nearby places information coming soon.
                </div>
              )}
            </div>
          </Reveal>

          {/* Map */}
          <Reveal direction="right" delay={250}>
            <div className="pd-card overflow-hidden relative min-h-[280px] sm:min-h-[340px] p-0">
              <iframe
                src={mapEmbed}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title={`${projectName} location map`}
                className="w-full h-full min-h-[280px] sm:min-h-[340px] border-0 block rounded-[28px]"
              />
              <div className="absolute bottom-[14px] left-[14px] pd-glass-dark text-white text-[11px] font-medium px-4 py-[7px] rounded-full tracking-[.03em] flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2.5">
                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {mapLocationLabel}
              </div>
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="w-full py-16 sm:py-20 px-3 sm:px-4 lg:px-8 xl:px-12 bg-[#F8F7F4]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal direction="up">
            <div className="pd-gradient-cta relative overflow-hidden rounded-[32px] sm:rounded-[40px] px-6 sm:px-14 py-12 sm:py-16 text-center">
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "26px 26px",
                }}
              />
              <div
                className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E4572E]/25 blur-3xl pointer-events-none"
              />
              <div className="relative flex flex-col items-center gap-5 sm:gap-6 max-w-xl mx-auto">
                <span className="pd-glass-dark text-white/80 text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full font-medium">
                  Ready When You Are
                </span>
                <h2 className="pd-display text-[clamp(26px,4vw,44px)] font-medium text-white leading-tight">
                  Come see {projectName} for yourself
                </h2>
                <p className="text-white/60 text-[13px] sm:text-[14px] leading-relaxed max-w-md">
                  Book a private tour or get the full brochure sent straight to your inbox — no pressure, just details.
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
                  <button
                    onClick={() => handleDownloadRequest("brochure", brochureUrl)}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#E4572E] text-white text-[11px] sm:text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-white hover:text-[#E4572E] transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Download Brochure
                  </button>
                  <button
                    onClick={() => handleDownloadRequest("floorplan", floorPlanUrl)}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/25 text-white text-[11px] sm:text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-white/10 transition-all duration-300"
                  >
                    Get Floor Plan
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CUSTOMER LEAD CAPTURE MODAL (PREMIUM GLASSMORPHISM DESIGN) ── */}
      {showLeadModal && (
        <div className="fixed inset-0 z-[9500] flex items-center justify-center px-4 py-6 overflow-y-auto backdrop-blur-md bg-[#0d1220]/70 animate-[scrollTopReveal_0.25s_ease_both]">
          <div className="relative w-full max-w-xl pd-glass rounded-[32px] p-6 sm:p-9 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Close trigger button */}
            <button 
              onClick={handleModalClose}
              disabled={savingLead}
              className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-[#1F2A44]/5 hover:bg-[#E4572E] text-[#6B7280] hover:text-white transition-all duration-200"
            >
              ✕
            </button>

            {/* Updated Header Block to match image_7ad7e6.jpg */}
            <div className="mb-7 text-left pr-8">
              <span className="inline-flex items-center bg-[#FFE9E2] text-[#E4572E] rounded-full px-3.5 py-1 text-[10px] tracking-widest font-semibold uppercase mb-3">
                One Step Away
              </span>
              <h3 className="pd-display text-2xl font-semibold text-[#1F2A44] tracking-tight">
                Download Brochure
              </h3>
              <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
                Share your details and we'll start your download for <span className="font-semibold text-[#1F2A44]">{projectName}</span>.
              </p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A0A8B5] font-semibold mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your full name"
                  value={leadForm.fullName}
                  onChange={(e) => setLeadForm({...leadForm, fullName: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#A0A8B5] font-semibold mb-1.5">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#A0A8B5] font-semibold mb-1.5">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="Your contact number"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A0A8B5] font-semibold mb-1.5">Date of Birth *</label>
                <input 
                  type="date" 
                  required
                  value={leadForm.dateOfBirth}
                  onChange={(e) => setLeadForm({...leadForm, dateOfBirth: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A0A8B5] font-semibold mb-1.5">Message *</label>
                <textarea 
                  rows="3"
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({...leadForm, message: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingLead}
                  className="w-full py-4 bg-[#E4572E] hover:bg-[#1F2A44] text-white font-semibold text-sm tracking-widest uppercase rounded-2xl transition-all shadow-lg shadow-[#E4572E]/20 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                >
                  {savingLead ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Saving Customer Profile...
                    </>
                  ) : (
                    "Download Brochure"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      </div>

      <Footer />
    </>
  );
}