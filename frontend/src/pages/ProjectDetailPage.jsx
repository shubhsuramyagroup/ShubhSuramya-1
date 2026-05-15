// src/pages/ProjectDetailPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Fully dynamic — reads :projectId from the URL, fetches from Firestore,
// falls back gracefully when optional fields are absent.
// UI is 100 % identical to the original static design.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getProjectById } from "../services/projectService"; // add getProjectById there (see README)

// ─── Firestore field → page field mapping ────────────────────────────────────
/**
 * Expected Firestore document shape (all fields optional except title):
 *
 *  title            string
 *  description      string
 *  longDescription  string
 *  location         string
 *  type             string          → "type" prop (Residential / Commercial …)
 *  status           string          → "Under Construction" / "Completed" …
 *  startingPrice    string          → "₹ 2.5 Cr"
 *  mainImage        string          → hero / about image URL
 *  videoSrc         string          → MP4 URL for hero background video
 *  year             string | number → completion / launch year
 *  tags             string[]        → hero tag pills
 *  subtitle         string          → hero subtitle line
 *  brochureUrl      string          → PDF download link
 *  floorPlanUrl     string          → floor-plan download link
 *
 *  stats            { value, suffix, label }[]   → Stats Band (≤ 4 items)
 *
 *  amenities        { label, img }[]             → Amenities grid
 *
 *  floors           {                            → Floor Previews
 *                     key, label, title,
 *                     rooms: { label, img }[]
 *                   }[]
 *
 *  gallery          { id, src, alt }[]           → Image Gallery
 *                   OR  string[]                 → plain image URLs
 *
 *  nearbyPlaces     {                            → Location section
 *                     name, sub, type,
 *                     distance, iconBg?,
 *                     iconType?  "hospital"|"mall"|"school"|"default"
 *                   }[]
 *
 *  mapEmbed         string          → full Google Maps embed URL
 *  mapLocationLabel string          → label shown on map pin (e.g. "Vastral, Ahmedabad")
 *  locationTitle    string          → big heading in Location section
 *  locationDesc     string          → paragraph in Location section
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

function iconBgForType(iconType) {
  if (iconType === "hospital") return "bg-red-50";
  if (iconType === "mall") return "bg-blue-50";
  if (iconType === "school") return "bg-green-50";
  return "bg-gray-50";
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 rounded-full border-4 border-[#E34A2F] border-t-transparent animate-spin" />
      <p className="text-white/50 text-sm tracking-widest uppercase">
        Loading Project…
      </p>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ message, onBack }) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-2">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E34A2F"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900">{message}</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        The project you're looking for doesn't exist or could not be loaded.
      </p>
      <button
        onClick={onBack}
        className="mt-2 px-6 py-3 rounded-full bg-[#E34A2F] text-white text-sm font-semibold hover:bg-[#c73b22] transition-colors"
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
    setLoading(true);
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

  // ── early returns ─────────────────────────────────────────────────────────
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { overflow-x: hidden; width: 100%; }
        #root { overflow-x: hidden; width: 100%; }

        @keyframes scrollLineDrop {
          0%   { transform: translateY(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
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
        @keyframes float3D {
          0%, 100% { transform: perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0); }
          25%      { transform: perspective(600px) rotateX(2deg) rotateY(3deg) translateZ(8px); }
          50%      { transform: perspective(600px) rotateX(-1deg) rotateY(-2deg) translateZ(4px); }
          75%      { transform: perspective(600px) rotateX(1.5deg) rotateY(-3deg) translateZ(6px); }
        }
        @keyframes depthPulse {
          0%, 100% { transform: perspective(800px) translateZ(0px); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          50%      { transform: perspective(800px) translateZ(10px); box-shadow: 0 12px 40px rgba(227,74,47,0.15); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .hero-badge   { animation: badgePop 0.7s cubic-bezier(.34,1.56,.64,1) 0.4s both; }
        .hero-h1      { animation: heroContentIn 0.9s cubic-bezier(.22,1,.36,1) 0.65s both; }
        .hero-line    { animation: heroLineGrow 0.6s cubic-bezier(.22,1,.36,1) 1.1s both; }
        .scroll-line  { animation: scrollLineDrop 1.8s ease-in-out infinite; }
        .scroll-top-btn { animation: scrollTopReveal 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .scroll-top-btn:hover .scroll-top-arrow { animation: scrollTopBounce 0.6s ease infinite; }
        .scroll-progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, #E34A2F, #ffb347); z-index: 9999; transition: width 0.1s linear; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #FDFAF6; }
        ::-webkit-scrollbar-thumb { background: #E34A2F; border-radius: 3px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .room-img-fade { transition: opacity 0.2s ease; }
        .room-img-fade.changing { opacity: 0; }
      `}</style>

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
      <section className="w-full bg-[#1F2A44] py-8 sm:py-10 px-3 sm:px-4 lg:px-8 xl:px-12 overflow-hidden">
  <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="text-center py-5 sm:py-6 px-2 sm:px-3 rounded-2xl cursor-default overflow-hidden backdrop-blur-sm min-h-[120px] sm:min-h-[140px] flex flex-col justify-center">
            <div className="w-full overflow-hidden flex justify-center">
              <p
                className="font-light text-white leading-none whitespace-nowrap"
                style={{
                  fontSize:
                    "clamp(20px,3.8vw,42px)",

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

            <p className="text-[9px] sm:text-[10px] tracking-[0.18em] uppercase text-white/40 mt-3 leading-relaxed px-1 break-words">
              {stat.title}
            </p>
          </div>
        </Reveal>
      );
    })}
  </div>
</section>

      {/* ── ABOUT ── */}
      <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-[#F8F7F4]">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-stretch">
          {/* Image */}
          <Reveal direction="left" delay={100}>
            <div className="flex flex-col h-full">
              <div className="rounded-2xl overflow-hidden flex-1 min-h-[240px] sm:min-h-[320px]">
                <img
                  src={image}
                  alt={projectName}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <div className="flex flex-col justify-between h-full gap-6 md:gap-0">
            <Reveal direction="right" delay={200}>
              <div className="flex flex-col gap-4 sm:gap-5">
                <span className="inline-flex w-fit items-center bg-[#FFE9E2] text-[#E4572E] rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[11px] tracking-widest">
                  About {projectName}
                </span>
                <h2 className="text-[clamp(22px,3.5vw,42px)] text-[#1F2A44] leading-tight">
                  {title}
                </h2>
                <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#5F6B7A]">
                  {description}
                </p>
              </div>
            </Reveal>

            <Reveal direction="up" delay={400}>
              <div className="flex flex-wrap gap-5 sm:gap-7 pt-5 sm:pt-6 border-t border-[#E3E6EA] mt-4 sm:mt-6">
                {[
                  { label: "Location", value: location },
                  { label: "Type", value: type },
                  { label: "Status", value: status },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="group"
                    style={{ transition: `all 0.3s ease ${i * 80}ms` }}
                  >
                    <p className="text-[10px] tracking-[0.28em] uppercase text-[#A0A8B5] mb-1">
                      {item.label}
                    </p>
                    <p className="text-[14px] sm:text-[15px] text-[#1F2A44] group-hover:text-[#E4572E] transition-colors">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal direction="up" delay={520}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 sm:pt-6 border-t border-[#E3E6EA] mt-2">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] tracking-[0.28em] uppercase text-[#A0A8B5]">
                    Starting Price
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[clamp(22px,2.8vw,32px)] font-semibold text-[#1F2A44] leading-tight tracking-tight">
                      {price}
                    </span>
                    <span className="text-[12px] text-[#A0A8B5] font-normal">
                      onwards
                    </span>
                  </div>
                </div>

                {brochureUrl && brochureUrl !== "#" ? (
                  <a
                    href={brochureUrl}
                    download
                    className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-[#E3E6EA] bg-white hover:bg-[#E4572E] hover:border-[#E4572E] transition-all duration-300 cursor-pointer self-start sm:self-auto"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FFE9E2] group-hover:bg-white/20 transition-colors duration-300">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#E4572E] group-hover:text-white transition-all duration-300 group-hover:translate-y-0.5"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </span>
                    <span className="text-[12px] tracking-[0.18em] uppercase font-medium text-[#1F2A44] group-hover:text-white transition-colors duration-300">
                      Download Brochure
                    </span>
                  </a>
                ) : (
                  <button
                    onClick={() =>
                      alert("Brochure coming soon. Please contact us.")
                    }
                    className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-[#E3E6EA] bg-white hover:bg-[#E4572E] hover:border-[#E4572E] transition-all duration-300 cursor-pointer self-start sm:self-auto"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FFE9E2] group-hover:bg-white/20 transition-colors duration-300">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#E4572E] group-hover:text-white transition-all duration-300"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </span>
                    <span className="text-[12px] tracking-[0.18em] uppercase font-medium text-[#1F2A44] group-hover:text-white transition-colors duration-300">
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
        <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-white text-center overflow-hidden">
          <Reveal direction="up">
            <h2 className="text-[clamp(22px,4vw,44px)] font-normal text-[#1a2332] leading-snug mb-8 sm:mb-12">
              Unparalleled Amenities for
              <br />
              Unmatched Living
            </h2>
          </Reveal>

          {/* Desktop */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {amenities.map(({ label, img }, i) => (
              <Reveal key={label} delay={i * 120} direction="up">
                <div className="relative rounded-[20px] overflow-hidden group cursor-pointer w-full h-[320px] lg:h-[380px]">
                  <img
                    src={img}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-300">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="#1a2332"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </div>
                  <span
                    className="absolute bottom-3 left-3 px-4 py-1.5 rounded-full text-[12px] text-white"
                    style={{
                      background: "rgba(255,255,255,0.22)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.35)",
                    }}
                  >
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
                <div className="relative rounded-[16px] overflow-hidden group cursor-pointer h-[200px] sm:h-[260px]">
                  <img
                    src={img}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                  />
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-300">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="#1a2332"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </div>
                  <span
                    className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-[11px] text-white"
                    style={{
                      background: "rgba(255,255,255,0.22)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.35)",
                    }}
                  >
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
        <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-[#F8F7F4]">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
            <Reveal direction="left">
              <h2 className="text-[28px] sm:text-[36px] font-medium text-[#1F2A44]">
                Floor Previews
              </h2>
            </Reveal>
            <Reveal direction="right" delay={200}>
              <a
                href={floorPlanUrl !== "#" ? floorPlanUrl : undefined}
                download={floorPlanUrl !== "#"}
                onClick={
                  floorPlanUrl === "#"
                    ? (e) => {
                        e.preventDefault();
                        alert("Floor plan coming soon.");
                      }
                    : undefined
                }
                className="inline-flex items-center gap-3 border border-[#E3E6EA] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-[12px] tracking-wide text-[#1F2A44] bg-white hover:bg-[#F1F3F6] transition-all hover:shadow-md hover:scale-105 w-fit cursor-pointer"
              >
                Download Floor Plan
                <span className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-[#E4572E] flex items-center justify-center">
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
              </a>
            </Reveal>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-4">
            <div className="relative">
              <button
                onClick={() => setFloorMenuOpen(!floorMenuOpen)}
                className="w-full flex items-center justify-between bg-white border border-[#E9EDF2] rounded-xl px-4 py-3 text-[14px] text-[#1F2A44] font-medium transition-shadow hover:shadow-md"
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
                <div className="absolute top-full left-0 right-0 z-30 bg-white border border-[#E9EDF2] rounded-xl mt-1 overflow-hidden shadow-lg">
                  {floors.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleFloorChange(f.key)}
                      className={`w-full px-4 py-3 text-left text-[13px] transition border-b border-[#F0F2F5] last:border-0 ${activeFloor === f.key ? "bg-[#FFF1EC] text-[#E4572E] font-medium" : "text-[#6B7280] hover:bg-[#F4F6F8]"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[20px] text-[#1F2A44] font-medium">
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
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                <span className="text-[11px] text-white">360° View</span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {floor.rooms.map((room, i) => (
                <div
                  key={i}
                  onClick={() => handleRoomChange(i)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer flex-shrink-0 w-[110px] h-[80px] ${activeRoom === i ? "ring-2 ring-[#E4572E]" : ""}`}
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

          {/* Desktop */}
          <Reveal direction="up" delay={100}>
            <div className="hidden md:block">
              <div className="bg-white rounded-[22px] p-6 md:p-8 grid md:grid-cols-[240px_1fr] gap-6 shadow-sm border border-[#E9EDF2] min-h-[520px]">
                <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-2">
                  {floors.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleFloorChange(f.key)}
                      className={`px-4 py-3 rounded-xl text-left flex justify-between items-center ${activeFloor === f.key ? "bg-[#FFF1EC] text-[#E4572E] font-medium" : "text-[#6B7280] hover:bg-[#F4F6F8]"}`}
                    >
                      {f.label}
                      {activeFloor === f.key && (
                        <span className="w-7 h-7 rounded-full bg-[#E4572E] flex items-center justify-center">
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
                <div className="flex flex-col h-full overflow-hidden">
                  <p className="text-[24px] text-[#1F2A44] mb-4 font-medium">
                    {floor.title}
                  </p>
                  <div className="grid grid-cols-[140px_1fr] gap-4 flex-1 min-h-0">
                    <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pr-2 h-full">
                      {floor.rooms.map((room, i) => (
                        <div
                          key={i}
                          onClick={() => handleRoomChange(i)}
                          className={`relative rounded-xl overflow-hidden cursor-pointer h-[110px] flex-shrink-0 ${activeRoom === i ? "ring-2 ring-[#E4572E]" : ""}`}
                        >
                          <img
                            src={room.img}
                            alt={room.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 text-[11px] text-white">
                            {room.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`relative rounded-2xl overflow-hidden h-full room-img-fade ${roomChanging ? "changing" : ""}`}
                    >
                      <img
                        src={floor.rooms[activeRoom]?.img}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                      />
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                        <span className="text-[11px] text-white">
                          360° View
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── IMAGE GALLERY ── */}
      {gallery.length > 0 && (
        <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-[#f5f4f2] overflow-hidden">
          <Reveal direction="up">
            <h2 className="text-center text-2xl sm:text-3xl font-medium text-gray-900 mb-6 sm:mb-7 tracking-tight">
              Image Gallery
            </h2>
          </Reveal>

          {/* Desktop */}
          <Reveal direction="up" delay={200}>
            <div className="hidden sm:flex gap-2 h-[400px] md:h-[480px] items-stretch overflow-hidden w-full">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  className="relative overflow-hidden rounded-2xl cursor-pointer"
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
                    className="absolute bottom-0 left-0 right-0 p-4"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                      opacity: hoveredId === img.id ? 1 : 0,
                      transition: "opacity 0.4s ease",
                    }}
                  >
                    <span className="text-white text-[12px] font-light">
                      {img.alt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Mobile */}
          <div className="sm:hidden grid grid-cols-2 gap-2">
            {gallery.map((img, i) => (
              <Reveal key={img.id} delay={i * 80} direction="scale">
                <div
                  className={`relative overflow-hidden rounded-xl cursor-pointer ${i === 0 ? "col-span-2 h-[200px]" : "h-[150px]"}`}
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
        </section>
      )}

      {/* ── LOCATION ── */}
      <section className="bg-[#f5f4f1] rounded-2xl py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 mx-2 sm:mx-0 overflow-hidden">
        {/* Top row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7 mb-5 sm:mb-6 items-start">
          <Reveal direction="left">
            <h2 className="text-[26px] sm:text-[34px] font-medium leading-tight text-gray-900">
              {locationTitle.includes("\n")
                ? locationTitle.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i === 0 && <br />}
                    </span>
                  ))
                : locationTitle}
            </h2>
          </Reveal>
          <Reveal direction="right" delay={150}>
            <p className="text-[13px] text-gray-500 leading-[1.75] sm:pt-1">
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
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="grid grid-cols-[1fr_auto_auto] bg-[#f9f8f7] px-[14px] sm:px-[18px] py-[10px]">
                    <span className="text-[10px] uppercase tracking-[.07em] font-medium text-gray-400">
                      Nearby Places
                    </span>
                    <span className="text-[10px] uppercase tracking-[.07em] font-medium text-gray-400 px-3 sm:px-4">
                      Type
                    </span>
                    <span className="text-[10px] uppercase tracking-[.07em] font-medium text-gray-400">
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
                        className="grid grid-cols-[1fr_auto_auto] items-center px-[14px] sm:px-[18px] py-[11px] sm:py-[12px] border-t border-gray-100 hover:bg-[#fafaf9] transition-all cursor-default"
                      >
                        <div className="flex items-center gap-[8px] sm:gap-[10px] min-w-0">
                          <div
                            className={`w-7 sm:w-8 h-7 sm:h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 ${bg} transition-transform hover:scale-110`}
                          >
                            <NearbyIcon iconType={iconType} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] sm:text-[13px] font-medium text-[#1c1c1c] truncate">
                              {p.name}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-gray-400 mt-[1px]">
                              {p.sub}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-gray-400 px-2 sm:px-4 hidden xs:block">
                          {p.type}
                        </span>
                        <span className="bg-[#f0efec] text-gray-600 text-[10px] sm:text-[11px] font-medium rounded-full px-[8px] sm:px-[10px] py-[3px] sm:py-[4px] whitespace-nowrap transition-colors hover:bg-[#E4572E] hover:text-white">
                          {p.distance}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm shadow-sm">
                  Nearby places information coming soon.
                </div>
              )}

              <button
                onClick={() => {
                  if (floorPlanUrl !== "#") window.open(floorPlanUrl, "_blank");
                  else alert("Floor plan coming soon.");
                }}
                className="inline-flex items-center gap-[10px] border-[1.5px] border-gray-800 rounded-full px-[16px] sm:px-[18px] py-[8px] sm:py-[9px] text-[12px] sm:text-[13px] font-medium text-gray-800 bg-transparent hover:bg-[#ece9e4] transition-all hover:scale-105 hover:shadow-md w-fit"
              >
                Download Floor Plan
                <span className="w-6 sm:w-7 h-6 sm:h-7 bg-[#1a1a2e] rounded-full flex items-center justify-center transition-transform hover:rotate-45">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.8"
                  >
                    <path d="M2 10L10 2M10 2H5M10 2v5" />
                  </svg>
                </span>
              </button>
            </div>
          </Reveal>

          {/* Map */}
          <Reveal direction="right" delay={250}>
            <div className="bg-white rounded-2xl overflow-hidden relative min-h-[260px] sm:min-h-[320px]">
              <iframe
                src={mapEmbed}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title={`${projectName} location map`}
                className="w-full h-full min-h-[260px] sm:min-h-[320px] border-0 block"
              />
              <div className="absolute bottom-[10px] left-[10px] bg-[rgba(20,20,30,0.85)] text-white text-[11px] font-medium px-3 py-[5px] rounded-full tracking-[.03em]">
                📍 {mapLocationLabel}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
