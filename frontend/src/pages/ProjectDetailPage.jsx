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
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-[#FDFAF6] animate-pulse">
      {/* Navbar placeholder */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 pt-5">
        <div className="w-full h-[72px] sm:h-[78px] rounded-2xl bg-gray-200" />
      </div>

      {/* Hero */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 pt-14 sm:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Left content */}
          <div className="flex flex-col gap-5">
            <div className="h-3 w-40 rounded-full bg-gray-200" />
            <div className="flex flex-wrap gap-2.5">
              <div className="h-7 w-24 rounded-full bg-gray-200" />
              <div className="h-7 w-28 rounded-full bg-gray-200" />
              <div className="h-7 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="h-12 sm:h-16 w-4/5 rounded-2xl bg-gray-300" />
            <div className="h-12 sm:h-16 w-3/5 rounded-2xl bg-gray-300" />
            <div className="space-y-2.5 mt-2 max-w-lg">
              <div className="h-3.5 w-full rounded-full bg-gray-200" />
              <div className="h-3.5 w-4/5 rounded-full bg-gray-200" />
            </div>
            <div className="flex flex-wrap gap-2.5 mt-2">
              <div className="h-6 w-20 rounded-full bg-gray-200" />
              <div className="h-6 w-20 rounded-full bg-gray-200" />
              <div className="h-6 w-20 rounded-full bg-gray-200" />
            </div>
            <div className="h-14 w-full sm:w-56 rounded-full bg-gray-300 mt-4" />
          </div>
          {/* Right media */}
          <div className="h-[420px] sm:h-[520px] lg:h-[600px] rounded-[32px] bg-gray-300" />
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 py-14 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-[190px] rounded-[26px] bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Content split */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
          <div className="h-[340px] sm:h-[440px] md:h-[540px] rounded-[32px] bg-gray-300" />
          <div className="flex flex-col gap-4">
            <div className="h-3 w-40 rounded-full bg-gray-200" />
            <div className="h-8 w-3/4 rounded-2xl bg-gray-300" />
            <div className="space-y-2.5 mt-2">
              <div className="h-3.5 w-full rounded-full bg-gray-200" />
              <div className="h-3.5 w-11/12 rounded-full bg-gray-200" />
              <div className="h-3.5 w-4/5 rounded-full bg-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="h-24 rounded-2xl bg-gray-200" />
              <div className="h-24 rounded-2xl bg-gray-200" />
              <div className="h-24 rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ message, onBack }) {
  return (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col items-center justify-center gap-6 px-4 text-center">
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
          --pd-bg: #FDFAF6;
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

        /* ── Premium redesign utilities ── */
        .pd-arch-grid {
          background-image:
            linear-gradient(rgba(31,42,68,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(31,42,68,0.045) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .pd-blob { filter: blur(64px); border-radius: 9999px; }
        .pd-eyebrow { display: inline-flex; align-items: center; gap: 10px; font-family: 'Manrope', sans-serif; }
        .pd-divider-line {
          height: 2px; width: 44px; border-radius: 2px;
          background: linear-gradient(90deg, #E4572E, rgba(228,87,46,0.12));
        }
        .pd-btn {
          position: relative; overflow: hidden;
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease, background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        .pd-btn:hover { transform: translateY(-2px) scale(1.02); }
        .pd-btn:active { transform: translateY(0) scale(0.99); }
        @keyframes modalPop {
          0%   { opacity: 0; transform: translateY(26px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pd-modal-card { animation: modalPop 0.5s cubic-bezier(.22,1,.36,1) both; }
        .pd-masonry {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 195px;
          grid-auto-flow: dense;
          gap: 18px;
        }
        .pd-masonry .tile-lg   { grid-column: span 2; grid-row: span 2; }
        .pd-masonry .tile-wide { grid-column: span 2; }
        @media (max-width: 1024px) {
          .pd-masonry { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 168px; }
          .pd-masonry .tile-lg   { grid-column: span 2; grid-row: span 2; }
          .pd-masonry .tile-wide { grid-column: span 2; grid-row: span 1; }
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
      <section className="relative w-full min-h-[92vh] lg:min-h-screen overflow-hidden bg-[#FDFAF6] flex items-center pt-28 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24">
        {/* decorative background */}
        <div className="absolute inset-0 pd-arch-grid opacity-70 pointer-events-none" />
        <div
          ref={parallaxBg}
          className="absolute -top-40 -right-24 w-[540px] h-[540px] pd-blob bg-[#FFE9E2] opacity-80 pointer-events-none"
        />
        <div className="absolute bottom-[-120px] -left-32 w-[460px] h-[460px] pd-blob bg-[#E4572E]/10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#FDFAF6] pointer-events-none" />

        <div className="relative z-10 w-full w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
          {/* ── Left: content ── */}
          <div className="flex flex-col">
            {/* Breadcrumb */}
            <nav
              className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-2.5 text-[10px] sm:text-[11px] font-medium tracking-[0.16em] uppercase mb-6"
              style={{
                opacity: pageLoaded ? 1 : 0,
                transform: pageLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.3s",
              }}
            >
              <a href="/" className="text-[#A0A8B5] hover:text-[#E4572E] transition-colors">
                Home
              </a>
              <span className="text-[#C9CDD4]">›</span>
              <a href="/projects" className="text-[#A0A8B5] hover:text-[#E4572E] transition-colors">
                Projects
              </a>
              <span className="text-[#C9CDD4]">›</span>
              <span className="text-[#1F2A44]">{projectName}</span>
            </nav>

            {/* Badges */}
            <div
              className="flex flex-wrap items-center gap-2.5 mb-6"
              style={{
                opacity: pageLoaded ? 1 : 0,
                transform: pageLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.42s",
              }}
            >
              <span className="inline-flex items-center bg-[#1F2A44] text-white rounded-full px-3.5 py-1.5 text-[10px] sm:text-[11px] tracking-[0.12em] font-semibold uppercase">
                {type}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#FFE9E2] text-[#E4572E] rounded-full px-3.5 py-1.5 text-[10px] sm:text-[11px] tracking-[0.12em] font-semibold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E4572E] animate-pulse" />
                {status}
              </span>
              <span className="inline-flex items-center text-[#6B7280] px-1 py-1.5 text-[10px] sm:text-[11px] tracking-[0.12em] font-semibold uppercase">
                {projectYear}
              </span>
            </div>

            {/* Title */}
            <h1
              className="pd-display font-semibold text-[#1F2A44] tracking-tight break-words"
              style={{
                fontSize:
                  projectName?.length <= 12
                    ? "clamp(44px, 6vw, 88px)"
                    : projectName?.length <= 22
                      ? "clamp(36px, 5vw, 66px)"
                      : "clamp(30px, 4vw, 52px)",
                lineHeight: 1.03,
                opacity: pageLoaded ? 1 : 0,
                transform: pageLoaded ? "translateY(0)" : "translateY(32px)",
                transition: "all 1.1s cubic-bezier(.22,1,.36,1) 0.55s",
              }}
            >
              {projectName}
            </h1>

            {/* Subtitle */}
            <p
              className="text-[15px] sm:text-[16px] leading-relaxed text-[#6B7280] mt-6 max-w-lg"
              style={{
                opacity: pageLoaded ? 1 : 0,
                transform: pageLoaded ? "translateY(0)" : "translateY(24px)",
                transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.75s",
              }}
            >
              {projectSubtitle}
            </p>

            {/* Tags */}
            <div
              className="flex items-center gap-2.5 mt-7 flex-wrap"
              style={{
                opacity: pageLoaded ? 1 : 0,
                transform: pageLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.9s",
              }}
            >
              {projectTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-[0.16em] uppercase text-[#6B7280] bg-white border border-[rgba(31,42,68,0.08)] rounded-full px-3.5 py-1.5 hover:border-[#E4572E]/40 hover:text-[#E4572E] transition-all duration-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div
              className="flex items-center gap-3 mt-9 flex-wrap"
              style={{
                opacity: pageLoaded ? 1 : 0,
                transform: pageLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.9s cubic-bezier(.22,1,.36,1) 1.05s",
              }}
            >
              <button
                onClick={() => handleDownloadRequest("brochure", brochureUrl)}
                className="pd-btn group inline-flex w-full sm:w-auto justify-center items-center gap-2.5 px-7 py-4 rounded-full bg-[#E4572E] text-white text-[12px] font-semibold tracking-[0.12em] uppercase shadow-lg shadow-[#E4572E]/25 cursor-pointer"
              >
                Download Brochure
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* ── Right: media + floating cards ── */}
          <div
            className="relative"
            style={{
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded
                ? "translateY(0) scale(1)"
                : "translateY(36px) scale(0.97)",
              transition: "all 1.2s cubic-bezier(.22,1,.36,1) 0.5s",
            }}
          >
            <div className="relative w-full h-[420px] sm:h-[520px] lg:h-[600px] rounded-[32px] overflow-hidden shadow-2xl shadow-[#1F2A44]/20 bg-black">
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
                    style={{ border: "none", pointerEvents: "none" }}
                  />
                </div>
              ) : (
                <img
                  src={image}
                  alt={projectName}
                  className={`w-full h-full object-cover transition-transform duration-[14000ms] ease-out ${
                    pageLoaded ? "scale-100" : "scale-105"
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10 pointer-events-none" />

              {/* Location pill */}
              <div className="absolute top-5 left-5 pd-glass-dark text-white text-[11px] font-medium px-4 py-2 rounded-2xl tracking-[.02em] flex items-center gap-1.5 max-w-[80%]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2.5" className="flex-shrink-0">
                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="break-words leading-snug">{projectLocation || location || mapLocationLabel}</span>
              </div>

              {/* Price floating card */}
              <div className="pd-glass absolute bottom-5 left-5 right-5 rounded-[22px] px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] tracking-[0.22em] uppercase text-[#6B7280] mb-0.5">
                    Starting Price
                  </p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="pd-display text-[22px] sm:text-[26px] font-bold text-[#1F2A44] leading-tight break-words">
                      {price}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">onwards</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] tracking-[0.18em] uppercase text-[#A0A8B5]">Year</p>
                    <p className="text-[13px] font-semibold text-[#1F2A44]">{projectYear}</p>
                  </div>
                  <div className="w-px h-8 bg-[rgba(31,42,68,0.12)]" />
                  <div className="text-right">
                    <p className="text-[9px] tracking-[0.18em] uppercase text-[#A0A8B5]">Status</p>
                    <p className="text-[13px] font-semibold text-[#E4572E] break-words max-w-[140px]">
                      {status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating type chip */}
            <div className="hidden sm:flex pd-card absolute -top-5 -right-4 lg:-right-6 shadow-xl px-5 py-4 items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE9E2] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#A0A8B5]">Type</p>
                <p className="text-[13px] font-semibold text-[#1F2A44]">{type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#A0A8B5] text-[10px] tracking-[0.2em] uppercase hidden sm:flex flex-col items-center gap-2">
          Scroll
          <span className="w-px h-8 bg-[#C9CDD4] relative overflow-hidden">
            <span className="scroll-line absolute inset-0 bg-[#E4572E]" />
          </span>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="w-full bg-[#1F2A44] relative overflow-hidden py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 left-1/4 w-80 h-80 pd-blob bg-[#E4572E]/20 pointer-events-none" />
        <div className="w-full relative">
          <Reveal direction="up">
            <div className="text-center mb-10 sm:mb-14">
              <span className="pd-eyebrow justify-center text-[11px] tracking-[0.22em] uppercase text-[#E4572E] font-semibold mb-4">
                <span className="w-6 h-px bg-[#E4572E]/60" />
                By The Numbers
                <span className="w-6 h-px bg-[#E4572E]/60" />
              </span>
              <h2 className="pd-display text-[clamp(24px,3.4vw,40px)] font-semibold text-white leading-tight">
                A landmark measured in detail
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => {
              const isNumber =
                !isNaN(parseFloat(stat.value)) && /^\d+/.test(stat.value);

              const numericValue = parseFloat(stat.value);

              const suffix = stat.value.replace(numericValue, "");

              return (
                <Reveal key={stat.title} delay={i * 120} direction="up" className="h-full">
                  <div
                    className="relative text-center py-9 sm:py-11 px-3 sm:px-4 rounded-[26px] cursor-default min-h-[190px] h-full flex flex-col items-center justify-center border border-white/10 hover:border-[#E4572E]/45 transition-all duration-500 hover:-translate-y-2 group"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {/* decorative glow (clipped so it never cuts content) */}
                    <div className="absolute inset-0 rounded-[26px] overflow-hidden pointer-events-none">
                      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#E4572E]/0 group-hover:bg-[#E4572E]/25 blur-2xl transition-all duration-500" />
                    </div>

                    <div className="w-full flex justify-center relative">
                      <p
                        className="pd-display font-bold text-white leading-tight break-words max-w-full"
                        style={{
                          fontSize: "clamp(24px,4vw,46px)",

                          transform:
                            stat.value.length > 20
                              ? "scale(0.55)"
                              : stat.value.length > 16
                                ? "scale(0.68)"
                                : stat.value.length > 12
                                  ? "scale(0.8)"
                                  : "scale(1)",

                          transformOrigin: "center",

                          display: "inline-block",
                        }}
                      >
                        {isNumber ? (
                          <AnimatedCounter target={numericValue} suffix={suffix} />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>

                    <span className="pd-divider-line mt-4 mb-3" />

                    <p className="text-[9px] sm:text-[10px] tracking-[0.16em] uppercase text-white/55 leading-relaxed px-1 break-words max-w-full relative">
                      {stat.title}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="w-full py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 bg-[#FDFAF6] relative overflow-hidden">
        <div
          className="absolute top-1/3 -left-32 w-96 h-96 rounded-full opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle, #FFE9E2 0%, transparent 70%)" }}
        />
        <div className="absolute -bottom-16 right-0 w-80 h-80 pd-blob bg-[#E4572E]/5 pointer-events-none" />
        <div className="w-full grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 sm:gap-14 lg:gap-16 items-center relative">
          {/* Image */}
          <Reveal direction="left" delay={100}>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-28 h-28 rounded-[28px] border border-[#E4572E]/20 pointer-events-none hidden sm:block" />
              <div className="rounded-[32px] overflow-hidden h-[340px] sm:h-[440px] md:h-[540px] shadow-2xl shadow-[#1F2A44]/10 group">
                <img
                  src={image}
                  alt={projectName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-[32px]" />
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
                <span className="pd-eyebrow text-[11px] tracking-[0.22em] uppercase text-[#E4572E] font-semibold">
                  <span className="w-6 h-px bg-[#E4572E]/60" />
                  About {projectName}
                </span>
                <h2 className="pd-display text-[clamp(26px,3.6vw,44px)] text-[#1F2A44] leading-[1.08] font-semibold">
                  {title}
                </h2>
                <p className="text-[14px] sm:text-[15px] leading-[1.85] text-[#6B7280]">
                  {description}
                </p>
              </div>
            </Reveal>

            <Reveal direction="up" delay={350}>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {[
                  {
                    label: "Location",
                    value: location,
                    icon: (
                      <>
                        <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </>
                    ),
                  },
                  {
                    label: "Type",
                    value: type,
                    icon: (
                      <>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </>
                    ),
                  },
                  {
                    label: "Status",
                    value: status,
                    icon: (
                      <>
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="8 12 11 15 16 9" />
                      </>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="pd-card p-3 sm:p-5 min-w-0 flex flex-col gap-2.5"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#FFE9E2] flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon}
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] tracking-[0.2em] uppercase text-[#A0A8B5] mb-1">
                        {item.label}
                      </p>
                      <p className="text-[13px] sm:text-[14px] text-[#1F2A44] font-semibold break-words">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
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
                    className="group inline-flex w-full sm:w-auto justify-center items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#E4572E] hover:bg-white transition-all duration-300 cursor-pointer flex-shrink-0"
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
                    className="group inline-flex w-full sm:w-auto justify-center items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/10 hover:bg-[#E4572E] transition-all duration-300 cursor-pointer flex-shrink-0"
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
        <section className="w-full py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 bg-white text-center overflow-hidden">
          <Reveal direction="up">
            <span className="pd-eyebrow justify-center text-[11px] tracking-[0.22em] uppercase text-[#E4572E] font-semibold mb-4">
              <span className="w-6 h-px bg-[#E4572E]/60" />
              Lifestyle & Comfort
              <span className="w-6 h-px bg-[#E4572E]/60" />
            </span>
            <h2 className="pd-display text-[clamp(24px,4vw,46px)] font-semibold text-[#1F2A44] leading-snug mb-10 sm:mb-14 max-w-2xl mx-auto">
              Unparalleled amenities for unmatched living
            </h2>
          </Reveal>

          {/* Desktop — asymmetric masonry grid */}
          <div className="hidden md:block w-full w-full">
            <div className="pd-masonry">
              {amenities.map(({ label, img }, i) => {
                const span =
                  i % 6 === 0 ? "tile-lg" : i % 6 === 3 ? "tile-wide" : "";
                return (
                  <Reveal
                    key={label}
                    delay={i * 80}
                    direction="scale"
                    className={`${span} h-full`}
                  >
                    <div className="relative rounded-[30px] overflow-hidden group cursor-pointer w-full h-full">
                      <img
                        src={img}
                        alt={label}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
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
                      <span className="absolute bottom-5 left-5 right-5 text-left text-[15px] font-semibold text-white tracking-wide transition-transform duration-500 group-hover:-translate-y-1">
                        {label}
                      </span>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {amenities.map(({ label, img }, i) => (
              <Reveal key={label} delay={i * 100} direction="scale">
                <div className="relative rounded-[24px] overflow-hidden group cursor-pointer h-[200px] sm:h-[260px]">
                  <img
                    src={img}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
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
        <section id="pd-floor-plan" className="w-full py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 bg-[#FDFAF6]">
          <div className="w-full">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <Reveal direction="left">
              <div>
                <span className="pd-eyebrow text-[11px] tracking-[0.22em] uppercase text-[#E4572E] font-semibold mb-3">
                  <span className="w-6 h-px bg-[#E4572E]/60" />
                  Explore The Space
                </span>
                <h2 className="pd-display text-[28px] sm:text-[40px] font-semibold text-[#1F2A44]">
                  Floor Previews
                </h2>
              </div>
            </Reveal>
            <Reveal direction="right" delay={200}>
              <button
                onClick={() => handleDownloadRequest("floorplan", floorPlanUrl)}
                className="pd-btn inline-flex w-full sm:w-fit justify-center items-center gap-3 rounded-full px-5 sm:px-6 py-3.5 text-[11px] sm:text-[12px] tracking-wide font-semibold uppercase text-white bg-[#1F2A44] hover:bg-[#E4572E] shadow-lg shadow-[#1F2A44]/15 cursor-pointer"
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

          {/* Floor plan — single responsive layout (all screen sizes) */}
          <Reveal direction="up" delay={100}>
            <div className="flex flex-col gap-5 sm:gap-6">
              {/* Floor selector dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFloorMenuOpen(!floorMenuOpen)}
                  className="w-full flex items-center justify-between bg-white border border-[#E9EDF2] rounded-2xl sm:rounded-3xl px-5 sm:px-6 py-4 text-[14px] sm:text-[15px] text-[#1F2A44] font-semibold shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="break-words">{floor.label}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 ml-3 transition-transform duration-300 ${floorMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="#1F2A44"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {floorMenuOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-white border border-[#E9EDF2] rounded-2xl mt-2 overflow-hidden shadow-xl max-h-[320px] overflow-y-auto no-scrollbar">
                    {floors.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => handleFloorChange(f.key)}
                        className={`w-full px-5 sm:px-6 py-3.5 text-left text-[13px] sm:text-[14px] transition border-b border-[#F0F2F5] last:border-0 ${activeFloor === f.key ? "bg-[#FFF1EC] text-[#E4572E] font-semibold" : "text-[#6B7280] hover:bg-[#F4F6F8]"}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <p className="pd-display text-[20px] sm:text-[24px] lg:text-[28px] text-[#1F2A44] font-semibold min-w-0 break-words">
                  {floor.title}
                </p>
                <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#A0A8B5] flex-shrink-0">
                  Room {activeRoom + 1} / {floor.rooms.length}
                </span>
              </div>

              {/* Preview image */}
              <div
                className={`relative w-full rounded-3xl overflow-hidden h-[240px] sm:h-[340px] md:h-[420px] lg:h-[480px] xl:h-[540px] 2xl:h-[600px] shadow-xl shadow-[#1F2A44]/10 room-img-fade ${roomChanging ? "changing" : ""}`}
              >
                <img
                  src={floor.rooms[activeRoom]?.img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Room thumbnail gallery */}
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                {floor.rooms.map((room, i) => (
                  <div
                    key={i}
                    onClick={() => handleRoomChange(i)}
                    className={`relative snap-start rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 w-[140px] sm:w-[170px] lg:w-[200px] h-[96px] sm:h-[116px] lg:h-[130px] transition-all duration-300 group ${activeRoom === i ? "ring-2 ring-[#E4572E] ring-offset-2 scale-[1.03] shadow-lg shadow-[#E4572E]/15" : "opacity-70 hover:opacity-100"}`}
                  >
                    <img
                      src={room.img}
                      alt={room.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[11px] font-medium text-white leading-tight line-clamp-2">
                      {room.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          </div>
        </section>
      )}

      {/* ── IMAGE GALLERY ── */}
      {gallery.length > 0 && (
        <section className="w-full py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 bg-white overflow-hidden">
          <div className="w-full">
          <Reveal direction="up">
            <div className="text-center mb-8 sm:mb-12">
              <span className="pd-eyebrow justify-center text-[11px] tracking-[0.22em] uppercase text-[#E4572E] font-semibold mb-4">
                <span className="w-6 h-px bg-[#E4572E]/60" />
                Gallery
                <span className="w-6 h-px bg-[#E4572E]/60" />
              </span>
              <h2 className="pd-display text-[clamp(24px,3.4vw,42px)] font-semibold text-[#1F2A44] tracking-tight">
                A closer look
              </h2>
            </div>
          </Reveal>

          {/* Desktop */}
          <Reveal direction="up" delay={200}>
            <div className="hidden md:flex gap-3 h-[440px] md:h-[520px] items-stretch overflow-hidden w-full">
              {gallery.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative overflow-hidden rounded-[28px] cursor-pointer"
                  style={{
                    flex: getFlex(img.id),
                    transition: "flex 0.5s cubic-bezier(0.4,0,0.2,1)",
                  }}
                  onMouseEnter={() => setHoveredId(img.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <span
                    className="absolute top-4 left-4 z-10 pd-glass-dark text-white text-[10px] font-semibold tracking-[0.12em] px-3 py-1 rounded-full"
                    style={{
                      opacity: hoveredId === img.id ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
                  </span>
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
          <div className="md:hidden grid grid-cols-2 gap-2.5">
            {gallery.map((img, i) => (
              <Reveal key={img.id} delay={i * 80} direction="scale" className="h-full">
                <div className="relative overflow-hidden rounded-2xl cursor-pointer w-full aspect-square">
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
      <section className="bg-[#FDFAF6] py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 overflow-hidden">
        <div className="w-full">
        {/* Top row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 items-end">
          <Reveal direction="left">
            <div>
              <span className="pd-eyebrow text-[11px] tracking-[0.22em] uppercase text-[#E4572E] font-semibold mb-4">
                <span className="w-6 h-px bg-[#E4572E]/60" />
                Neighbourhood
              </span>
              <h2 className="pd-display text-[26px] sm:text-[38px] font-semibold leading-tight text-[#1F2A44]">
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
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5 sm:gap-6 items-stretch">
          {/* Map */}
          <Reveal direction="left" delay={200} className="h-full">
            <div className="pd-card overflow-hidden relative min-h-[320px] sm:min-h-[420px] lg:h-full p-0">
              <iframe
                src={mapEmbed}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title={`${projectName} location map`}
                className="w-full h-full min-h-[320px] sm:min-h-[420px] border-0 block rounded-[28px]"
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

          {/* Nearby places */}
          <Reveal direction="right" delay={250} className="h-full">
            <div className="flex flex-col h-full">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#A0A8B5] mb-3 px-1">
                Nearby Places
              </p>
              {nearbyPlaces.length > 0 ? (
                <div className="flex flex-col gap-2.5 sm:gap-3 lg:max-h-[430px] lg:overflow-y-auto no-scrollbar pr-0.5">
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
                        className="pd-card group flex items-center gap-3.5 px-4 sm:px-5 py-3.5 sm:py-4 cursor-default"
                      >
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg} group-hover:scale-110 transition-transform duration-300`}
                        >
                          <NearbyIcon iconType={iconType} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] sm:text-[14px] font-semibold text-[#1F2A44] break-words leading-snug">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-[#A0A8B5] break-words leading-snug mt-0.5">
                            {p.sub}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-right">
                          <span className="text-[10px] text-[#A0A8B5] uppercase tracking-[.05em] hidden sm:block break-words">
                            {p.type}
                          </span>
                          <span className="bg-[#F0EFEC] text-[#1F2A44] text-[10px] sm:text-[11px] font-semibold rounded-full px-3 py-1 whitespace-nowrap group-hover:bg-[#E4572E] group-hover:text-white transition-colors duration-300">
                            {p.distance}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pd-card p-8 text-center text-[#A0A8B5] text-sm flex-1 flex items-center justify-center">
                  Nearby places information coming soon.
                </div>
              )}
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* ── DOWNLOAD + FOOTER CTA ── */}
      <section id="pd-contact" className="w-full py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 bg-[#FDFAF6]">
        <div className="w-full">
          <Reveal direction="up">
            <div className="text-center mb-10 sm:mb-14">
              <span className="pd-eyebrow justify-center text-[11px] tracking-[0.22em] uppercase text-[#E4572E] font-semibold mb-4">
                <span className="w-6 h-px bg-[#E4572E]/60" />
                Resources
                <span className="w-6 h-px bg-[#E4572E]/60" />
              </span>
              <h2 className="pd-display text-[clamp(24px,3.6vw,42px)] font-semibold text-[#1F2A44] leading-tight">
                Take the details with you
              </h2>
            </div>
          </Reveal>

          {/* Premium download cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Reveal direction="left" delay={100} className="h-full">
              <div className="pd-card group h-full p-6 sm:p-8 flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#FFE9E2] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="13" y2="17" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="pd-display text-[18px] font-semibold text-[#1F2A44] mb-1">
                    Project Brochure
                  </h3>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5">
                    Everything about the residence in one elegant PDF.
                  </p>
                  <button
                    onClick={() => handleDownloadRequest("brochure", brochureUrl)}
                    className="pd-btn inline-flex items-center gap-2 rounded-full bg-[#1F2A44] text-white px-5 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase hover:bg-[#E4572E] cursor-pointer"
                  >
                    Download Brochure
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={200} className="h-full">
              <div className="pd-card group h-full p-6 sm:p-8 flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#FFE9E2] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                    <line x1="15" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="pd-display text-[18px] font-semibold text-[#1F2A44] mb-1">
                    Floor Plans
                  </h3>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5">
                    Detailed layouts and dimensions for every floor.
                  </p>
                  <button
                    onClick={() => handleDownloadRequest("floorplan", floorPlanUrl)}
                    className="pd-btn inline-flex items-center gap-2 rounded-full bg-[#1F2A44] text-white px-5 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase hover:bg-[#E4572E] cursor-pointer"
                  >
                    Get Floor Plan
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* CTA banner */}
          <Reveal direction="up">
            <div className="pd-gradient-cta relative overflow-hidden rounded-[32px] sm:rounded-[40px] px-6 sm:px-14 py-12 sm:py-16 text-center">
              <img
                src={image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
              />
              <div className="absolute inset-0 bg-[#1F2A44]/50 pointer-events-none" />
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "26px 26px",
                }}
              />
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E4572E]/25 blur-3xl pointer-events-none" />
              <div className="relative flex flex-col items-center gap-5 sm:gap-6 max-w-xl mx-auto">
                <span className="pd-glass-dark text-white/80 text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full font-medium">
                  Ready When You Are
                </span>
                <h2 className="pd-display text-[clamp(26px,4vw,44px)] font-semibold text-white leading-tight">
                  Come see {projectName} for yourself
                </h2>
                <p className="text-white/70 text-[13px] sm:text-[14px] leading-relaxed max-w-md">
                  Book a private tour or get the full brochure sent straight to your inbox — no pressure, just details.
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
                  <Link to="/contact">
  <button
    className="pd-btn inline-flex items-center gap-2 rounded-full bg-[#E4572E] px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors duration-300 hover:cursor-pointer hover:bg-white hover:text-[#E4572E] sm:text-[12px]"
  >
    Contact Us
  </button>
</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CUSTOMER LEAD CAPTURE MODAL (PREMIUM TWO-COLUMN DESIGN) ── */}
      {showLeadModal && (
        <div className="fixed inset-0 z-[9500] flex items-center justify-center px-4 py-6 overflow-y-auto backdrop-blur-md bg-[#0d1220]/70">
          <div className="pd-modal-card relative w-full max-w-3xl bg-white rounded-[32px] overflow-hidden shadow-2xl max-h-[92vh] grid grid-cols-1 md:grid-cols-[0.85fr_1fr]">

            {/* Close trigger button */}
            <button
              onClick={handleModalClose}
              disabled={savingLead}
              className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/85 md:bg-[#1F2A44]/5 hover:bg-[#E4572E] text-[#6B7280] hover:text-white transition-all duration-200 backdrop-blur-sm"
            >
              ✕
            </button>

            {/* Left — project visual panel */}
            <div className="relative hidden md:block">
              <img
                src={image}
                alt={projectName}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F2A44] via-[#1F2A44]/55 to-[#1F2A44]/25" />
              <div className="relative h-full flex flex-col justify-end p-7 gap-3">
                <span className="pd-glass-dark w-fit text-white/85 text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full font-medium">
                  One Step Away
                </span>
                <h3 className="pd-display text-2xl font-semibold text-white leading-tight">
                  {projectName}
                </h3>
                <div className="flex items-start gap-1.5 text-white/75 text-[12px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2.4" className="flex-shrink-0 mt-[3px]">
                    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="break-words leading-snug">{location || projectLocation || mapLocationLabel}</span>
                </div>
                <div className="pd-glass rounded-2xl px-4 py-3 mt-1">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B7280]">Starting Price</p>
                  <p className="pd-display text-[20px] font-bold text-[#1F2A44] leading-tight">{price}</p>
                </div>
              </div>
            </div>

            {/* Right — form panel */}
            <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar min-h-0">
              <div className="mb-6 text-left pr-8">
                <span className="inline-flex md:hidden items-center bg-[#FFE9E2] text-[#E4572E] rounded-full px-3.5 py-1 text-[10px] tracking-widest font-semibold uppercase mb-3">
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
                    className="w-full px-4 py-3 bg-[#FDFAF6] border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] placeholder:text-[#A0A8B5] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 focus:bg-white transition-all"
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
                      className="w-full px-4 py-3 bg-[#FDFAF6] border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] placeholder:text-[#A0A8B5] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 focus:bg-white transition-all"
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
                      className="w-full px-4 py-3 bg-[#FDFAF6] border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] placeholder:text-[#A0A8B5] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 focus:bg-white transition-all"
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
                    className="w-full px-4 py-3 bg-[#FDFAF6] border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] placeholder:text-[#A0A8B5] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#A0A8B5] font-semibold mb-1.5">Message *</label>
                  <textarea
                    rows="3"
                    value={leadForm.message}
                    onChange={(e) => setLeadForm({...leadForm, message: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FDFAF6] border border-[#E3E6EA] rounded-2xl text-sm text-[#1F2A44] placeholder:text-[#A0A8B5] focus:outline-none focus:border-[#E4572E] focus:ring-4 focus:ring-[#E4572E]/10 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingLead}
                    className="pd-btn w-full py-4 bg-[#E4572E] hover:bg-[#1F2A44] text-white font-semibold text-sm tracking-widest uppercase rounded-2xl shadow-lg shadow-[#E4572E]/20 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:transform-none cursor-pointer"
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
        </div>
      )}

      </div>

      <Footer />
    </>
  );
}