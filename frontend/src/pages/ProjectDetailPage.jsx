import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ─── Scroll Animation Hook ─── */
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

/* ─── Parallax Hook ─── */
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

/* ─── 3D Tilt Hook ─── */
function useTilt() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.02,1.02,1.02)`;
    };
    const onLeave = () => {
      el.style.transform =
        "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return ref;
}

/* ─── Animated Counter ─── */
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

/* ─── Reveal Wrapper ─── */
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const [ref, visible] = useScrollReveal();
  const transforms = {
    up: visible ? "translateY(0) opacity(1)" : "translateY(48px) opacity(0)",
    down: visible ? "translateY(0) opacity(1)" : "translateY(-48px) opacity(0)",
    left: visible ? "translateX(0) opacity(1)" : "translateX(-60px) opacity(0)",
    right: visible ? "translateX(0) opacity(1)" : "translateX(60px) opacity(0)",
    scale: visible ? "scale(1) opacity(1)" : "scale(0.88) opacity(0)",
  };
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

export default function ProjectDetailPage({
  projectName = "Serenity Villa",
  projectSubtitle = "A timeless residence where light, stone, and silence become architecture.",
  projectLocation = "Surat, Gujarat",
  projectYear = "2024",
  projectTags = ["Architecture", "Interior", "Landscape"],
  videoSrc = "https://www.pexels.com/download/video/36113775/",
  title = "Crafted for a Life of Elegance and Tranquility",
  description = "Nestled in the heart of Dubai's premier waterfront location, Sunset Bay combines modern architectural design with nature's beauty. Our residences offer spacious interiors, world-class finishes, and breathtaking sea views.",
  image = "https://images.pexels.com/photos/29174529/pexels-photo-29174529.jpeg",
  location = "Sanand, Gujarat",
  type = "Residential",
  status = "Under Construction",
}) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef(null);
  const parallaxBg = useParallax(0.18);
  const scrollProgress = useScrollProgress();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const amenities = [
    {
      label: "Swimming Pool",
      img: "https://images.pexels.com/photos/14548470/pexels-photo-14548470.png",
      tall: true,
    },
    {
      label: "Kids Pool",
      img: "https://images.pexels.com/photos/11114684/pexels-photo-11114684.jpeg",
      tall: false,
    },
    {
      label: "Kids Play Area",
      img: "https://images.pexels.com/photos/29247929/pexels-photo-29247929.jpeg",
      tall: true,
    },
    {
      label: "Pool Side Lounge",
      img: "https://images.pexels.com/photos/14548470/pexels-photo-14548470.png",
      tall: false,
    },
  ];

  const floorData = [
    {
      key: "ground",
      label: "Ground Floor",
      title: "Ground Floor",
      rooms: [
        {
          label: "Lobby",
          img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Entrance",
          img: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Corridor",
          img: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80",
        },
      ],
    },
    {
      key: "podium1",
      label: "1st Podium Floor",
      title: "1st Podium Floor",
      rooms: [
        {
          label: "Pool Deck",
          img: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Swimming Pool",
          img: "https://images.unsplash.com/photo-1576013551627-0c2f1b7c0c4d?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Gym",
          img: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80",
        },
      ],
    },
    {
      key: "podium2",
      label: "2nd Podium Floor",
      title: "2nd Podium Floor",
      rooms: [
        {
          label: "Dining",
          img: "https://images.unsplash.com/photo-1617098900591-3f90928e8c54?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Lounge",
          img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Living",
          img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
        },
      ],
    },
    {
      key: "floor1",
      label: "1st Floor",
      title: "1st Floor",
      rooms: [
        {
          label: "Suite",
          img: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Bedroom",
          img: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Master Bed",
          img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
        },
      ],
    },
    {
      key: "floor2468",
      label: "2nd, 4th, 6th, 8th Floor",
      title: "2nd, 4th, 6th & 8th Floor",
      rooms: [
        {
          label: "Drawing",
          img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Bedroom 1",
          img: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Bedroom 2",
          img: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Bedroom 3",
          img: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
        },
      ],
    },
    {
      key: "floor357",
      label: "3rd, 5th, 7th Floor",
      title: "3rd, 5th & 7th Floor",
      rooms: [
        {
          label: "Living Room",
          img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Bedroom",
          img: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Terrace",
          img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
        },
      ],
    },
    {
      key: "rooftop",
      label: "Rooftop Floor",
      title: "Rooftop Floor",
      rooms: [
        {
          label: "Infinity Pool",
          img: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Sky Lounge",
          img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
        },
        {
          label: "Sky Dining",
          img: "https://images.unsplash.com/photo-1617098900591-3f90928e8c54?auto=format&fit=crop&w=1200&q=80",
        },
      ],
    },
  ];

  const [activeFloor, setActiveFloor] = useState("floor2468");
  const [activeRoom, setActiveRoom] = useState(0);
  const [floorMenuOpen, setFloorMenuOpen] = useState(false);
  const [roomChanging, setRoomChanging] = useState(false);

  const floor = floorData.find((f) => f.key === activeFloor);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) playPromise.catch(() => {});
    const handleLoaded = () => setLoaded(true);
    video.addEventListener("loadeddata", handleLoaded);
    const fallback = setTimeout(() => setLoaded(true), 600);
    return () => {
      video.removeEventListener("loadeddata", handleLoaded);
      clearTimeout(fallback);
    };
  }, []);

  const [hoveredId, setHoveredId] = useState(null);
  const getFlex = (id) => {
    if (!hoveredId) return "1";
    if (hoveredId === id) return "4";
    return "0.4";
  };

  const images = [
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

  const nearbyPlaces = [
    {
      name: "Health1 Super Speciality",
      sub: "Hospital · 4.9 ★",
      type: "Hospital",
      distance: "~1.0 km",
      iconBg: "bg-red-50",
      icon: (
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
      ),
    },
    {
      name: "Avadh Multispeciality Hospital",
      sub: "Hospital · 4.6 ★",
      type: "Hospital",
      distance: "~2.3 km",
      iconBg: "bg-red-50",
      icon: (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e24b4a"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <line x1="12" y1="15" x2="12" y2="19" />
          <line x1="10" y1="17" x2="14" y2="17" />
        </svg>
      ),
    },
    {
      name: "Ved Arcade Mall",
      sub: "Shopping Mall · 4.4 ★",
      type: "Mall",
      distance: "~2.8 km",
      iconBg: "bg-blue-50",
      icon: (
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
      ),
    },
    {
      name: "Podar International School",
      sub: "School · 4.6 ★",
      type: "School",
      distance: "~1.5 km",
      iconBg: "bg-green-50",
      icon: (
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
      ),
    },
  ];

  const MAP_EMBED =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14694.5!2d72.6525!3d22.9984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e87b1b9e4b1f1%3A0x4c0be1e6b8f7b3b5!2sVastral%2C+Ahmedabad%2C+Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";

  /* 3D tilt refs for cards */
  const tiltAboutImg = useTilt();
  const tiltMapCard = useTilt();

  return (
    <>
      {/* ── Navbar ── */}
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes scrollDrop {
          0%   { transform:translateY(-100%); opacity:0; }
          25%  { opacity:1; }
          100% { transform:translateY(260%); opacity:0; }
        }
        @keyframes floatBadge {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-5px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes rotateOrbit {
          from { transform: rotate(0deg) translateX(22px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(22px) rotate(-360deg); }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineDraw {
          from { width: 0; }
          to   { width: 48px; }
        }
        @keyframes fadeInBadge {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%      { transform: translateY(-8px) rotate(0.5deg); }
          66%      { transform: translateY(-4px) rotate(-0.5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(227,74,47,0.2); }
          50%       { box-shadow: 0 0 40px rgba(227,74,47,0.4), 0 0 80px rgba(227,74,47,0.1); }
        }
        @keyframes slideProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes morphBlob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          33%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          66%       { border-radius: 50% 60% 30% 60% / 30% 60% 70% 50%; }
        }
        @keyframes textReveal {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }
        @keyframes spin3D {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
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
        @keyframes borderTrail {
          0%   { clip-path: inset(0 100% 100% 0); }
          25%  { clip-path: inset(0 0 100% 0); }
          50%  { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes statsCountReveal {
          from { opacity:0; transform: perspective(400px) rotateX(40deg) translateY(20px); }
          to   { opacity:1; transform: perspective(400px) rotateX(0deg) translateY(0); }
        }
        @keyframes waveIn {
          0%   { transform: scaleY(0) translateY(100%); opacity: 0; }
          60%  { transform: scaleY(1.08) translateY(-3%); opacity: 1; }
          100% { transform: scaleY(1) translateY(0); opacity: 1; }
        }
        @keyframes processArrowPulse {
          0%,100% { opacity: 0.4; transform: translateX(0); }
          50%     { opacity: 1;   transform: translateX(6px); }
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
        @keyframes rotateSlowly {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Hero entrance ── */
        .hero-badge   { animation: badgePop 0.7s cubic-bezier(.34,1.56,.64,1) 0.4s both; }
        .hero-h1      { animation: heroContentIn 0.9s cubic-bezier(.22,1,.36,1) 0.65s both; }
        .hero-line    { animation: heroLineGrow 0.6s cubic-bezier(.22,1,.36,1) 1.1s both; }
        .hero-p       { animation: heroContentIn 0.8s cubic-bezier(.22,1,.36,1) 1.2s both; }

        /* ── Scroll line ── */
        .scroll-line {
          animation: scrollLineDrop 1.8s ease-in-out infinite;
        }
        .scroll-down-indicator {
          animation: heroFadeIn 0.8s ease 1.8s both;
        }

        /* ── Scroll-to-top ── */
        .scroll-top-btn {
          animation: scrollTopReveal 0.4s cubic-bezier(.34,1.56,.64,1) both;
        }
        .scroll-top-btn:hover .scroll-top-arrow {
          animation: scrollTopBounce 0.6s ease infinite;
        }

        /* ── Blog card ── */
        .blog-card {
          transition: transform 0.35s cubic-bezier(.22,1,.36,1);
        }
        .blog-card:hover {
          transform: translateY(-6px);
        }
        .blog-img {
          transition: transform 0.6s cubic-bezier(.22,1,.36,1);
        }
        .blog-card:hover .blog-img {
          transform: scale(1.07);
        }

        /* ── Process card ── */
        .process-card {
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease;
        }
        .process-card:hover {
          transform: translateY(-8px) perspective(600px) rotateX(3deg);
          box-shadow: 0 24px 48px rgba(0,0,0,0.1);
        }

        /* ── Hero scroll ── */
        .hero-scroll-indicator {
          animation: scrollDrop 2s ease-in-out infinite 2s;
        }

        /* ── Floating ── */
        .floating-badge {
          animation: floatBadge 3s ease-in-out infinite;
        }

        /* ── Blob ── */
        .blob-bg {
          animation: morphBlob 8s ease-in-out infinite;
        }

        /* ── 3D floating card ── */
        .float-3d {
          animation: float3D 6s ease-in-out infinite;
        }

        /* ── Stat card depth ── */
        .stat-depth {
          animation: depthPulse 4s ease-in-out infinite;
        }

        /* ── Process arrow ── */
        .process-arrow {
          animation: processArrowPulse 1.6s ease-in-out infinite;
        }

        /* ── Slowly rotating deco ring ── */
        .ring-rotate {
          animation: rotateSlowly 18s linear infinite;
        }

        /* ── Perspective container ── */
        .perspective-container {
          perspective: 1200px;
          perspective-origin: center center;
        }

        /* ── Feature card interactive 3D ── */
        .feature-card-3d {
          transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s ease, border-color 0.25s ease;
        }

        /* ── Stats 3D section reveal ── */
        .stats-3d-reveal {
          transform-style: preserve-3d;
        }

        /* ── Scroll progress bar ── */
        .scroll-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #E34A2F, #ffb347);
          z-index: 9999;
          transition: width 0.1s linear;
        }

        /* ── Smooth scrolling ── */
        html { scroll-behavior: smooth; }

        /* ── Custom scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #FDFAF6; }
        ::-webkit-scrollbar-thumb { background: #E34A2F; border-radius: 3px; }

        /* ── Project card image ── */
        .project-card img {
          transition: transform 0.6s cubic-bezier(.22,1,.36,1);
        }

        /* ── Responsive video section ── */
        @media (max-width: 640px) {
          .hero-content { padding-bottom: 80px !important; }
        }

        /* ── Mobile tap ── */
        @media (hover: none) {
          .feature-card:hover { transform: none; }
          .stat-card:hover { transform: none; }
          .process-card:hover { transform: none; }
        }
          *, *::before, *::after { box-sizing: border-box; }

          html,
body {
  overflow-x: hidden;
  width: 100%;
}

#root {
  overflow-x: hidden;
  width: 100%;
}
      `}</style>

      {/* ── SCROLL PROGRESS BAR ── */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* ── SCROLL TO TOP BUTTON ── */}
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

      {/* ── Hero Section ── */}
      <section className="relative w-full h-screen min-h-[500px] overflow-hidden bg-black flex flex-col items-center justify-center">
        <div
          ref={parallaxBg}
          className="absolute inset-0 scale-100 overflow-hidden"
        >
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-transform duration-[14000ms] ease-out ${loaded ? "scale-100" : "scale-105"}`}
            style={{ filter: "brightness(0.38) saturate(0.65)" }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />

        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
            style={{
              background: "radial-gradient(circle, #E4572E, transparent)",
              animation: "float-up 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-4"
            style={{
              background: "radial-gradient(circle, #fff, transparent)",
              animation: "float-up 10s ease-in-out infinite reverse",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-[11px] font-light tracking-[0.18em] sm:tracking-[0.22em] uppercase mb-5 sm:mb-6"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(28px)",
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
              opacity: loaded ? 1 : 0,
              transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.5s",
            }}
          >
            Residential · {projectYear}
          </p>

          <h1
            className="font-light tracking-[0.1em] sm:tracking-[0.14em] uppercase text-white leading-none"
            style={{
              fontSize: "clamp(36px, 9vw, 112px)",
              opacity: loaded ? 1 : 0,
              transform: loaded
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
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.9s",
            }}
          >
            {projectSubtitle}
          </p>

          <div className="flex items-center gap-2 sm:gap-4 mt-5 sm:mt-7 flex-wrap justify-center">
            {projectTags.map((tag, i) => (
              <span
                key={tag}
                className="tag-pill text-[8px] sm:text-[9px] tracking-[0.22em] sm:tracking-[0.28em] uppercase text-white/40 border border-white/20 px-2.5 sm:px-3 py-1 hover:border-white/50 hover:text-white/70 transition-all duration-300"
                style={{ animationDelay: `${900 + i * 150}ms` }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            className="h-px bg-white/40 mt-5 sm:mt-6 w-16 sm:w-20"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "scaleX(1)" : "scaleX(0)",
              transition: "all 0.8s ease 1.2s",
              transformOrigin: "center",
            }}
          />
        </div>

        {/* Bottom Left */}
        <div
          className="absolute bottom-8 sm:bottom-12 left-4 sm:left-10 text-white/70"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateX(0)" : "translateX(-20px)",
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
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateX(0)" : "translateX(20px)",
            transition: "all 0.8s ease 1s",
          }}
        >
          <p className="text-[9px] sm:text-[10px] uppercase opacity-50">Year</p>
          <p className="text-[13px] sm:text-[15px]">{projectYear}</p>
        </div>

        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-[11px] sm:text-xs scroll-indicator">
          Scroll ↓
        </div>
      </section>

      {/* ── Stats Band ── */}
      <section className="w-full bg-[#1F2A44] py-10 sm:py-10 px-2 sm:px-4 lg:px-8 xl:px-12 overflow-hidden">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: 48, suffix: "+", label: "Luxury Units" },
            { value: 8, suffix: " Floors", label: "Rise Above All" },
            { value: 12, suffix: "+", label: "Amenities" },
            { value: 99, suffix: "%", label: "Client Satisfaction" },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120} direction="up">
              <div className="stat-card text-center py-4 px-2 rounded-xl cursor-default">
                <p className="text-[clamp(26px,4vw,42px)] font-light text-white leading-none">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-2">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="section-divider mx-4 sm:mx-0" />

      {/* ── About Section ── */}
      <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-[#F8F7F4] ">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-stretch">
          {/* Left: Image with 3D tilt */}
          <Reveal direction="left" delay={100}>
            <div ref={tiltAboutImg} className="tilt-card flex flex-col h-full">
              <div className="rounded-2xl overflow-hidden flex-1 min-h-[240px] sm:min-h-[320px]">
                <img
                  src={image}
                  alt={projectName}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </Reveal>

          {/* Right: Content */}
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
          </div>
        </div>
      </section>

      {/* ── Amenities Section ── */}
      <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-white text-center overflow-hidden">
        <Reveal direction="up">
          <h2 className="text-[clamp(22px,4vw,44px)] font-normal text-[#1a2332] leading-snug mb-8 sm:mb-12">
            Unparalleled Amenities for
            <br />
            Unmatched Living
          </h2>
        </Reveal>

        {/* Desktop */}
        {/* Desktop */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {amenities.map(({ label, img }, i) => (
            <Reveal key={label} delay={i * 120} direction="up">
              <div className="amenity-card relative rounded-[20px] overflow-hidden group cursor-pointer w-full h-[320px] lg:h-[380px]">
                <img
                  src={img}
                  alt={label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Arrow */}
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

                {/* Label */}
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
              <div className="amenity-card relative rounded-[16px] overflow-hidden group cursor-pointer h-[200px] sm:h-[260px]">
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

      {/* ── Floor Previews Section ── */}
      <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-[#F8F7F4] font-['Montserrat',sans-serif]">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
          <Reveal direction="left">
            <h2 className="text-[28px] sm:text-[36px] font-medium text-[#1F2A44]">
              Floor Previews
            </h2>
          </Reveal>
          <Reveal direction="right" delay={200}>
            <button className="inline-flex items-center gap-3 border border-[#E3E6EA] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-[12px] tracking-wide text-[#1F2A44] bg-white hover:bg-[#F1F3F6] transition-all hover:shadow-md hover:scale-105 w-fit">
              Download Floor Plan
              <span className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-[#E4572E] flex items-center justify-center transition-transform group-hover:rotate-45">
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
              <div
                className="absolute top-full left-0 right-0 z-30 bg-white border border-[#E9EDF2] rounded-xl mt-1 overflow-hidden shadow-lg"
                style={{ animation: "slide-in-tag 0.25s ease both" }}
              >
                {floorData.map((f) => (
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
                className={`room-thumb relative rounded-xl overflow-hidden cursor-pointer flex-shrink-0 w-[110px] h-[80px] ${activeRoom === i ? "ring-2 ring-[#E4572E]" : ""}`}
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
                {floorData.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => handleFloorChange(f.key)}
                    className={`floor-btn px-4 py-3 rounded-xl text-left flex justify-between items-center ${activeFloor === f.key ? "bg-[#FFF1EC] text-[#E4572E] font-medium" : "text-[#6B7280] hover:bg-[#F4F6F8]"}`}
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
                <p
                  className="text-[24px] text-[#1F2A44] mb-4 font-medium"
                  style={{ animation: "fade-slide 0.35s ease both" }}
                >
                  {floor.title}
                </p>
                <div className="grid grid-cols-[140px_1fr] gap-4 flex-1 min-h-0">
                  <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pr-2 h-full">
                    {floor.rooms.map((room, i) => (
                      <div
                        key={i}
                        onClick={() => handleRoomChange(i)}
                        className={`room-thumb relative rounded-xl overflow-hidden cursor-pointer h-[110px] flex-shrink-0 ${activeRoom === i ? "ring-2 ring-[#E4572E]" : ""}`}
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
                      <span className="text-[11px] text-white">360° View</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Image Gallery ── */}
      <section className="w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 bg-[#f5f4f2] overflow-hidden">
        <Reveal direction="up">
          <h2 className="text-center text-2xl sm:text-3xl font-medium text-gray-900 mb-6 sm:mb-7 tracking-tight">
            Image Gallery
          </h2>
        </Reveal>

        {/* Desktop */}
        <Reveal direction="up" delay={200}>
          <div className="hidden sm:flex gap-2 h-[400px] md:h-[480px] items-stretch overflow-hidden w-full">
            {images.map((img) => (
              <div
                key={img.id}
                className="gallery-img relative overflow-hidden rounded-2xl cursor-pointer"
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
                {/* Hover caption */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
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
          {images.map((img, i) => (
            <Reveal key={img.id} delay={i * 80} direction="scale">
              <div
                className={`relative overflow-hidden rounded-xl cursor-pointer ${img.id === 1 ? "col-span-2 h-[200px]" : "h-[150px]"}`}
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

      {/* ── Location Section ── */}
      <section className="bg-[#f5f4f1] rounded-2xl py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12 mx-2 sm:mx-0 overflow-hidden">
        {/* TOP ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7 mb-5 sm:mb-6 items-start">
          <Reveal direction="left">
            <h2 className="text-[26px] sm:text-[34px] font-medium leading-tight text-gray-900">
              An Icon of Coastal
              <br />
              Elegance
            </h2>
          </Reveal>
          <Reveal direction="right" delay={150}>
            <p className="text-[13px] text-gray-500 leading-[1.75] sm:pt-1">
              Nestled in the thriving neighbourhood of Vastral, Ahmedabad, this
              exclusive residence places you moments from the city's finest
              hospitals, shopping destinations, and green spaces — where every
              convenience is within easy reach.
            </p>
          </Reveal>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {/* Nearby places */}
          <Reveal direction="left" delay={200}>
            <div className="flex flex-col gap-4 sm:gap-5">
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
                {nearbyPlaces.map((p, i) => (
                  <div
                    key={i}
                    className="nearby-row grid grid-cols-[1fr_auto_auto] items-center px-[14px] sm:px-[18px] py-[11px] sm:py-[12px] border-t border-gray-100 hover:bg-[#fafaf9] transition-all cursor-default"
                  >
                    <div className="flex items-center gap-[8px] sm:gap-[10px] min-w-0">
                      <div
                        className={`w-7 sm:w-8 h-7 sm:h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 ${p.iconBg} transition-transform hover:scale-110`}
                      >
                        {p.icon}
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
                ))}
              </div>
              <button className="inline-flex items-center gap-[10px] border-[1.5px] border-gray-800 rounded-full px-[16px] sm:px-[18px] py-[8px] sm:py-[9px] text-[12px] sm:text-[13px] font-medium text-gray-800 bg-transparent hover:bg-[#ece9e4] transition-all hover:scale-105 hover:shadow-md w-fit">
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

          {/* Map with 3D tilt */}
          <Reveal direction="right" delay={300}>
            <div
              ref={tiltMapCard}
              className="tilt-card bg-white rounded-2xl overflow-hidden relative min-h-[260px] sm:min-h-[320px]"
            >
              <iframe
                src={MAP_EMBED}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Property location in Vastral, Ahmedabad"
                className="w-full h-full min-h-[260px] sm:min-h-[320px] border-0 block"
              />
              <div className="absolute bottom-[10px] left-[10px] bg-[rgba(20,20,30,0.85)] text-white text-[11px] font-medium px-3 py-[5px] rounded-full tracking-[.03em]">
                📍 Vastral, Ahmedabad
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}
