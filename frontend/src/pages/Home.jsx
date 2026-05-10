import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import bgVideo from "../../public/bg_video.mp4";
import { Link } from "react-router-dom";
import img1 from "../../public/img1.jpg";
import img2 from "../../public/img2.jpg";
import img3 from "../../public/img3.jpg";
import img4 from "../../public/img4.jpg";
import bg_img from "../../public/bg_img.jpg";
import {
  TbArrowRight,
  TbBuildingSkyscraper,
  TbLeaf,
  TbRuler,
  TbHome,
  TbChevronRight,
} from "react-icons/tb";
import { LuMapPin, LuBedDouble, LuBath, LuRuler } from "react-icons/lu";

/* ─── SCROLL PROGRESS HOOK ─── */
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

/* ─── IN-VIEW HOOK ─── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── FADE UP COMPONENT ─── */
function FadeUp({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.80s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.80s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── FADE IN SCALE COMPONENT ─── */
function FadeInScale({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "scale(1) translateY(0)"
          : "scale(0.92) translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── SLIDE IN LEFT ─── */
function SlideInLeft({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-48px)",
        transition: `opacity 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── SLIDE IN RIGHT ─── */
function SlideInRight({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(48px)",
        transition: `opacity 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── FLIP IN FROM BOTTOM (3D) ─── */
function FlipInUp({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "perspective(800px) rotateX(0deg) translateY(0)"
          : "perspective(800px) rotateX(30deg) translateY(40px)",
        transition: `opacity 0.75s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.75s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        transformOrigin: "bottom center",
      }}
    >
      {children}
    </div>
  );
}

/* ─── ZOOM IN 3D ─── */
function ZoomIn3D({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "perspective(1000px) scale(1) rotateY(0deg)"
          : "perspective(1000px) scale(0.8) rotateY(-15deg)",
        transition: `opacity 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── STAGGER FADE (alternating left/right) ─── */
function StaggerSide({ children, index = 0, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.08);
  const fromLeft = index % 2 === 0;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0) translateY(0)"
          : `translateX(${fromLeft ? -60 : 60}px) translateY(20px)`,
        transition: `opacity 0.8s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.8s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── 3D TILT CARD ─── */
function TiltCard({ children, className = "", style = {} }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
  };
  const handleLeave = () => {
    if (ref.current)
      ref.current.style.transform =
        "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transition: "transform 0.18s ease-out",
        willChange: "transform",
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}

/* ─── ANIMATED COUNTER ─── */
function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView(0.3);

  const safeTarget = String(target);

  useEffect(() => {
    if (!visible) return;

    const num = parseFloat(safeTarget.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return;

    let start = 0;
    const duration = 1800;

    const step = (timestamp) => {
      if (!start) start = timestamp;

      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(+(num * eased).toFixed(num < 10 ? 1 : 0));

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [visible, safeTarget]);

  const prefix = safeTarget.replace(/[0-9.]+.*/, "");
  const suf = safeTarget.replace(/^[^0-9]*[0-9.]+/, "");

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suf || suffix}
    </span>
  );
}

/* ─── SCROLL DOWN INDICATOR ─── */
function ScrollIndicator() {
  return (
    <div className="scroll-down-indicator flex flex-col items-center gap-1.5">
      <span className="text-white/50 text-[9px] tracking-[2px] uppercase">
        Scroll
      </span>
      <div className="relative w-[1px] h-10 bg-white/20 overflow-hidden rounded-full">
        <div
          className="scroll-line absolute top-0 left-0 w-full bg-white/70 rounded-full"
          style={{ height: "40%" }}
        />
      </div>
    </div>
  );
}

/* ─── DATA ─── */
const STATS = [
  {
    label: "Verified Property Listings",
    value: "1000+",
    desc: "Trusted, authenticated homes in our database",
  },
  {
    label: "Homes Sold",
    value: "92%",
    desc: "Homes sold within valuation range",
  },
  {
    label: "Highest Recorded Sale",
    value: "$49.9M",
    desc: "Premium estate transaction in the last year",
  },
  {
    label: "Growth",
    value: 95,
    desc: "Yearly growth %",
  },
];

const FEATURES = [
  {
    icon: <TbHome size={22} />,
    title: "Luxury Villas",
    desc: "Bespoke architecture crafted for privacy and absolute grandeur.",
  },
  {
    icon: <TbBuildingSkyscraper size={22} />,
    title: "Urban Residences",
    desc: "Modern city living fused with timeless refined elegance.",
  },
  {
    icon: <TbLeaf size={22} />,
    title: "Eco Interiors",
    desc: "Sustainable materials and breathable, open living spaces.",
  },
  {
    icon: <TbRuler size={22} />,
    title: "Custom Build",
    desc: "Architecture shaped entirely around your vision, not ours.",
  },
];

const BLOGS = [
  {
    category: "Real Estate",
    title: "Top Luxury Villa Trends to Watch in 2025",
    date: "Jan 5, 2025",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  },
  {
    category: "Investment",
    title: "5 Smart Ways to Grow Wealth Through Property",
    date: "Dec 28, 2024",
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  },
  {
    category: "Interior Design",
    title: "Why Eco Interiors Are the Future of Modern Homes",
    date: "Dec 20, 2024",
    img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80",
  },
];

const PROCESS = [
  {
    step: "1",
    title: "Explore properties",
    desc: "Browse a curated selection of premium villas, apartments, and commercial spaces tailored to your needs.",
  },
  {
    step: "2",
    title: "Make smart investments",
    desc: "Analyze property insights, compare pricing, and invest with complete transparency and confidence.",
  },
  {
    step: "3",
    title: "Own & grow",
    desc: "Secure your property and build long-term wealth with high-value real estate opportunities.",
  },
];

/* ─── MAIN COMPONENT ─── */
export default function Home() {
  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const scrollProgress = useScrollProgress();

  /* Parallax scroll for video */
  useEffect(() => {
    const onScroll = () => {
      if (videoRef.current)
        videoRef.current.style.transform = `scale(1.1) translateY(${window.scrollY * 0.3}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Hero text parallax */
  const [heroOffset, setHeroOffset] = useState(0);
  useEffect(() => {
    const onScroll = () => setHeroOffset(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Scroll-to-top button visibility */
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const PROJECTS = [
    {
      name: "Shaazzz Property III",
      type: "Villa",
      location: "Syracuse, Connecticut",
      description:
        "Minimalist house on the beach equipped with luxury facilities in its class",
      beds: 4,
      baths: 2,
      area: "450 sqft",
      img: img1,
    },
    {
      name: "Azure Heights Residence",
      type: "Modern",
      location: "Miami, Florida",
      description:
        "Contemporary living space with panoramic ocean views and smart home integration",
      beds: 5,
      baths: 3,
      area: "680 sqft",
      img: img2,
    },
    {
      name: "Evergreen Manor Estate",
      type: "Luxury",
      location: "Aspen, Colorado",
      description:
        "Sprawling estate nestled in mountains with private spa, pool and breathtaking views",
      beds: 6,
      baths: 4,
      area: "1,200 sqft",
      img: img3,
    },
    {
      name: "Skyline Penthouse 7",
      type: "Penthouse",
      location: "New York, NY",
      description:
        "Sky-high luxury penthouse with rooftop terrace, city skyline views and butler service",
      beds: 3,
      baths: 2,
      area: "890 sqft",
      img: img4,
    },
  ];

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = (n) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(((n % PROJECTS.length) + PROJECTS.length) % PROJECTS.length);
      setAnimating(false);
    }, 100);
  };

  const prev = () => go(current - 1);
  const next = () => go(current + 1);
  const p = PROJECTS[current];

  return (
    <>
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
          className="scroll-top-btn fixed bottom-6 right-4 sm:bottom-8 sm:right-6 lg:right-8 z-[9000] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E34A2F] flex items-center justify-center shadow-lg hover:bg-[#c73b22] transition-colors duration-200 cursor-pointer"
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
      <section
        ref={heroRef}
        className="relative w-full h-screen overflow-hidden"
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-110"
          src={bgVideo}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
        <div className="absolute inset-0 mix-blend-multiply bg-[rgba(30,18,8,0.25)]" />

        {/* Animated grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />

        {/* Rotating deco rings */}
        <div
          className="ring-rotate absolute top-[15%] right-[8%] w-48 h-48 sm:w-72 sm:h-72 rounded-full pointer-events-none"
          style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
        />
        <div
          className="ring-rotate absolute top-[12%] right-[5%] w-64 h-64 sm:w-96 sm:h-96 rounded-full pointer-events-none"
          style={{
            border: "1px solid rgba(255,90,60,0.06)",
            animationDirection: "reverse",
            animationDuration: "28s",
          }}
        />

        <Navbar />

        {/* Hero content with parallax */}
        <div
          className="hero-content relative z-20 h-full flex flex-col items-start justify-end text-left px-4 sm:px-8 lg:px-16 pb-8 sm:pb-10 max-w-xl"
          style={{ transform: `translateY(${heroOffset * 0.15}px)` }}
        >
          <div className="hero-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-white/20 bg-white/10 backdrop-blur-md mb-4">
            <span
              className="relative w-2 h-2 rounded-full bg-[#FF5A3C]"
              style={{ boxShadow: "0 0 0 0 rgba(255,90,60,0.5)" }}
            >
              <span
                className="absolute inset-0 rounded-full bg-[#FF5A3C]"
                style={{ animation: "pulseRing 1.6s ease-out infinite" }}
              />
            </span>
            <span className="text-[10px] tracking-[1.4px] text-white/90 uppercase font-medium">
              Premium Real Estate
            </span>
          </div>

          <h1
            className="hero-h1 font-montserrat font-semibold text-white leading-[1.1] tracking-tight mb-3"
            style={{
              fontSize: "clamp(36px, 5vw, 68px)",
              textShadow: "0 4px 30px rgba(0,0,0,0.45)",
            }}
          >
            Build Your Future
            <br />
            Own Your Space
          </h1>

          <div
            className="hero-line h-[2px] bg-gradient-to-r from-[#FF5A3C] to-[#ffb347] mb-4 rounded-full"
            style={{ width: "48px" }}
          />

          <p
            className="hero-p leading-relaxed mb-6"
            style={{
              fontSize: "clamp(13px, 1.1vw, 15px)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Discover breathtaking villas, timeless interiors, and stunning
            exteriors — all curated for those who desire more than just a home.
          </p>
        </div>

        {/* Scroll Down Indicator — bottom center */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20">
          <ScrollIndicator />
        </div>
      </section>

      {/* ── SIDEBAR ICONS — only on hero ── */}
<div className="absolute right-3 sm:right-5 lg:right-7 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 items-end">

  {/* UPCOMING — House */}
  <Link to="/project-details" className="group flex items-center justify-end gap-2 sm:gap-3">
    <div className="hidden sm:block text-right opacity-0 translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none">
      <span className="block text-[11px] sm:text-[11.5px] tracking-[1.1px] uppercase text-white/90 font-semibold leading-tight">
        Upcoming
      </span>
      <span className="block text-[9px] sm:text-[10px] text-white/40 mt-0.5">
        3 Projects
      </span>
    </div>
    <div className="w-[40px] h-[40px] sm:w-[46px] sm:h-[46px] lg:w-[50px] lg:h-[50px] rounded-xl sm:rounded-[14px] flex items-center justify-center border border-white/10 sm:border-[1.5px] bg-white/[0.06] backdrop-blur-xl transition-all duration-300 group-hover:border-[rgba(100,160,255,0.65)] group-hover:bg-[rgba(100,160,255,0.12)] group-hover:shadow-[0_0_18px_rgba(100,160,255,0.28)] group-hover:scale-110 relative overflow-hidden flex-shrink-0">
      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 32 32" fill="none">
        <polygon points="16,4 3,16 6,16 6,28 26,28 26,16 29,16" fill="#64A0FF" />
        <rect x="12" y="20" width="8" height="8" rx="4" fill="#2a6fcf" />
        <rect x="20" y="7" width="3" height="5" fill="#64A0FF" />
      </svg>
    </div>
  </Link>

  <div className="w-px h-3 sm:h-4 bg-white/[0.07] self-end mr-[19px] sm:mr-[22px] lg:mr-[24px]" />

  {/* ONGOING — Apartment building */}
  <Link to="/project-details" className="group flex items-center justify-end gap-2 sm:gap-3">
    <div className="hidden sm:block text-right opacity-0 translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none">
      <span className="block text-[11px] sm:text-[11.5px] tracking-[1.1px] uppercase text-white/90 font-semibold leading-tight">
        Ongoing
      </span>
      <span className="block text-[9px] sm:text-[10px] text-white/40 mt-0.5">
        5 Projects
      </span>
    </div>
    <div className="w-[40px] h-[40px] sm:w-[46px] sm:h-[46px] lg:w-[50px] lg:h-[50px] rounded-xl sm:rounded-[14px] flex items-center justify-center border border-white/10 sm:border-[1.5px] bg-white/[0.06] backdrop-blur-xl transition-all duration-300 group-hover:border-[rgba(255,160,60,0.65)] group-hover:bg-[rgba(255,160,60,0.12)] group-hover:shadow-[0_0_18px_rgba(255,160,60,0.28)] group-hover:scale-110 relative overflow-hidden flex-shrink-0">
      <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] rounded-full bg-[#FF9A3C] z-20">
        <span className="absolute inset-0 rounded-full bg-[#FF9A3C]" style={{ animation: "pulseRing 1.6s ease-out infinite" }} />
      </span>
      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 32 32" fill="none">
        <rect x="8" y="4" width="16" height="24" rx="1" fill="#FFA03C" />
        <rect x="10" y="7" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="14.5" y="7" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="19" y="7" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="10" y="11.5" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="14.5" y="11.5" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="19" y="11.5" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="10" y="16" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="14.5" y="16" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="19" y="16" width="3" height="2.5" rx="0.4" fill="#ff7a00" />
        <rect x="13" y="22" width="6" height="6" rx="0.5" fill="#ff7a00" />
        <rect x="6" y="2" width="20" height="3" rx="1" fill="#ffb347" />
      </svg>
    </div>
  </Link>

  <div className="w-px h-3 sm:h-4 bg-white/[0.07] self-end mr-[19px] sm:mr-[22px] lg:mr-[24px]" />

  {/* COMPLETED — Office tower */}
  <Link to="/project-details" className="group flex items-center justify-end gap-2 sm:gap-3">
    <div className="hidden sm:block text-right opacity-0 translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none">
      <span className="block text-[11px] sm:text-[11.5px] tracking-[1.1px] uppercase text-white/90 font-semibold leading-tight">
        Completed
      </span>
      <span className="block text-[9px] sm:text-[10px] text-white/40 mt-0.5">
        12 Projects
      </span>
    </div>
    <div className="w-[40px] h-[40px] sm:w-[46px] sm:h-[46px] lg:w-[50px] lg:h-[50px] rounded-xl sm:rounded-[14px] flex items-center justify-center border border-white/10 sm:border-[1.5px] bg-white/[0.06] backdrop-blur-xl transition-all duration-300 group-hover:border-[rgba(52,211,153,0.65)] group-hover:bg-[rgba(52,211,153,0.12)] group-hover:shadow-[0_0_18px_rgba(52,211,153,0.28)] group-hover:scale-110 relative overflow-hidden flex-shrink-0">
      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="12" width="6" height="18" rx="0.5" fill="#34D399" />
        <rect x="4.5" y="14" width="3" height="2" rx="0.3" fill="#1fa874" />
        <rect x="4.5" y="18" width="3" height="2" rx="0.3" fill="#1fa874" />
        <rect x="4.5" y="22" width="3" height="2" rx="0.3" fill="#1fa874" />
        <rect x="23" y="12" width="6" height="18" rx="0.5" fill="#34D399" />
        <rect x="24.5" y="14" width="3" height="2" rx="0.3" fill="#1fa874" />
        <rect x="24.5" y="18" width="3" height="2" rx="0.3" fill="#1fa874" />
        <rect x="24.5" y="22" width="3" height="2" rx="0.3" fill="#1fa874" />
        <rect x="9" y="4" width="14" height="26" rx="0.5" fill="#2ebc88" />
        <rect x="10.5" y="6" width="11" height="2.5" rx="0.4" fill="#1fa874" />
        <rect x="10.5" y="10" width="11" height="2.5" rx="0.4" fill="#1fa874" />
        <rect x="10.5" y="14" width="11" height="2.5" rx="0.4" fill="#1fa874" />
        <rect x="10.5" y="18" width="11" height="2.5" rx="0.4" fill="#1fa874" />
        <rect x="12" y="24" width="4" height="6" rx="0.4" fill="#1a9e70" />
        <rect x="17" y="24" width="4" height="6" rx="0.4" fill="#1a9e70" />
        <rect x="7" y="29" width="18" height="2" rx="0.5" fill="#1fa874" />
        <rect x="14.5" y="1" width="3" height="4" rx="0.5" fill="#2ebc88" />
      </svg>
    </div>
  </Link>

</div>

      {/* ── ABOUT STRIP ── */}
      <section className="relative bg-[#FDFAF6] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden">
        {/* Animated blob background */}
        <div
          className="blob-bg absolute -top-40 -right-40 w-[500px] h-[500px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(227,74,47,0.06) 0%, transparent 68%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="blob-bg absolute -bottom-20 -left-20 w-[300px] h-[300px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(30,42,90,0.04) 0%, transparent 70%)",
            filter: "blur(30px)",
            animationDelay: "3s",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,42,90,1) 1px,transparent 1px),linear-gradient(90deg,rgba(30,42,90,1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <SlideInLeft delay={0}>
            <div>
              <p className="text-[#E34A2F] text-[10.5px] font-bold tracking-[2.5px] uppercase mb-3">
                Who We Are
              </p>
              <h2
                className="font-semibold text-[#1E2A5A] leading-[1.07] tracking-tight mb-5"
                style={{ fontSize: "clamp(26px,3.8vw,50px)" }}
              >
                Crafting Spaces That
                <br />
                <span className="text-[#E34A2F]">Inspire Living</span>
              </h2>
              <div
                className="rounded-full mb-5"
                style={{
                  width: 48,
                  height: 2,
                  background: "linear-gradient(90deg,#E34A2F,#f5a623)",
                }}
              />
              <p
                className="leading-[1.85] mb-7 text-[#4a4a5a]"
                style={{ fontSize: "clamp(13px,1.15vw,15.5px)" }}
              >
                Shubh Suramya has spent over 18 years transforming dreams into
                architectural landmarks. Every project begins with listening —
                understanding how you live, work, and find joy in your space.
              </p>
              <Link
                to="/about"
                className="group inline-flex items-center gap-2.5 font-manrope text-[11px] font-bold tracking-[1.3px] uppercase text-[#1E2A5A] hover:text-[#E34A2F] transition-colors"
              >
                Learn More
                <div
                  className="w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:bg-[#E34A2F] group-hover:border-[#E34A2F] group-hover:rotate-45"
                  style={{ borderColor: "rgba(30,42,90,.22)" }}
                >
                  <TbArrowRight
                    size={13}
                    className="text-[#1E2A5A] group-hover:text-white transition-colors"
                  />
                </div>
              </Link>
            </div>
          </SlideInLeft>

          <SlideInRight delay={100}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {FEATURES.map((card, i) => (
                <TiltCard key={card.title}>
                  <ZoomIn3D delay={i * 90}>
                    <div
                      className="feature-card feature-card-3d rounded-2xl p-4 sm:p-5 border cursor-default bg-white"
                      style={{ borderColor: "rgba(30,42,90,.08)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(227,74,47,.25)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 32px rgba(227,74,47,.08)";
                        e.currentTarget.style.transform =
                          "perspective(600px) translateZ(8px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(30,42,90,.08)";
                        e.currentTarget.style.boxShadow = "";
                        e.currentTarget.style.transform = "";
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl bg-[#FFF0EC] flex items-center justify-center mb-3 text-[#E34A2F] transition-transform duration-300 group-hover:scale-110"
                        style={{
                          transition:
                            "transform 0.3s cubic-bezier(.22,1,.36,1)",
                        }}
                      >
                        {card.icon}
                      </div>
                      <p className="font-manrope font-bold text-[#1E2A5A] text-[13px] sm:text-sm mb-1.5">
                        {card.title}
                      </p>
                      <p
                        style={{
                          fontSize: 11.5,
                          color: "rgba(30,42,90,.48)",
                          lineHeight: 1.65,
                        }}
                      >
                        {card.desc}
                      </p>
                    </div>
                  </ZoomIn3D>
                </TiltCard>
              ))}
            </div>
          </SlideInRight>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="w-full bg-[#FDFAF6] py-10 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS.map((item, i) => (
              <FlipInUp key={i} delay={i * 130}>
                <div
                  className="relative bg-white rounded-[20px] border border-gray-200 p-6 h-[220px] flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 float-3d"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  {/* Decorative corner gradient */}
                  <div
                    className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at top right, rgba(227,74,47,0.06), transparent 70%)",
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-0">
                    <p className="text-[14px] text-gray-600 mb-3">
                      {item.label}
                    </p>

                    <p className="text-[40px] sm:text-[44px] font-semibold text-gray-900 leading-none mb-3">
                      <AnimatedCounter target={item.value} />
                    </p>

                    <p className="text-[13px] text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </FlipInUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROJECTS ── */}
      <section className="bg-[#FDFAF6] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-6">
            <div>
              <FadeUp delay={0}>
                <p className="text-[#E34A2F] text-[10.5px] font-bold tracking-[2.5px] uppercase mb-2">
                  Portfolio
                </p>
              </FadeUp>
              <FadeUp delay={80}>
                <h2
                  className="font-semibold text-[#1E2A5A] leading-tight tracking-tight"
                  style={{ fontSize: "clamp(22px,3.5vw,44px)" }}
                >
                  Featured Projects
                </h2>
              </FadeUp>
            </div>
            <FadeUp delay={160}>
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 font-manrope text-[11px] font-bold tracking-[1.3px] uppercase text-[#1E2A5A] hover:text-[#E34A2F] transition-colors whitespace-nowrap"
              >
                View All{" "}
                <TbChevronRight
                  size={15}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
            </FadeUp>
          </div>

          {/* Card */}
          <FadeInScale delay={0}>
            <div className="relative rounded-[18px] overflow-hidden h-[460px] sm:h-[480px] bg-black perspective-container">
              {/* Slides */}
              {PROJECTS.map((proj, i) => (
                <div
                  key={proj.name}
                  className={`absolute inset-0 transition-all duration-700 ${
                    i === current
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-[1.02] pointer-events-none"
                  }`}
                  style={{
                    transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <img
                    src={proj.img}
                    alt={proj.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)",
                    }}
                  />
                </div>
              ))}

              {/* Progress bar for current slide */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/10 z-10">
                <div
                  key={current}
                  className="h-full bg-[#E34A2F]"
                  style={{
                    animation: "slideProgress 5s linear forwards",
                  }}
                />
              </div>

              {/* Info Box */}
              <div
                className="absolute bottom-6 left-4 sm:left-6 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 max-w-[280px] sm:max-w-[360px]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.68))",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.14)",
                  border: "1px solid rgba(255,255,255,0.65)",
                  transition: "all 0.5s cubic-bezier(.22,1,.36,1)",
                }}
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-[#E34A2F] bg-[#FFF0EC] mb-2">
                  {p.type}
                </div>
                <h3
                  className="text-[#1E2A5A] font-bold leading-tight mb-2"
                  style={{ fontSize: "clamp(16px,2vw,22px)" }}
                >
                  {p.name}
                </h3>
                <p className="flex items-center gap-1.5 text-gray-500 text-[12px] sm:text-[13px] mb-3">
                  <LuMapPin className="text-[#1E2A5A] text-[14px] sm:text-[16px] shrink-0" />
                  {p.location}
                </p>
                <p className="text-[#4a5568] text-[12px] sm:text-[14px] leading-relaxed mb-4 hidden sm:block">
                  {p.description}
                </p>
                <div className="flex items-center gap-3 sm:gap-5 text-[11px] sm:text-[13px] font-medium text-[#1E2A5A]">
                  <span className="flex items-center gap-1">
                    <LuBedDouble className="text-[14px] sm:text-[16px]" />
                    {p.beds} Beds
                  </span>
                  <span className="flex items-center gap-1">
                    <LuBath className="text-[14px] sm:text-[16px]" />
                    {p.baths} Baths
                  </span>
                  <span className="flex items-center gap-1">
                    <LuRuler className="text-[14px] sm:text-[16px]" />
                    {p.area}
                  </span>
                </div>
              </div>

              {/* Nav Buttons */}
              <div className="absolute bottom-6 right-4 sm:right-5 flex gap-2">
                <button
                  onClick={prev}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 flex items-center justify-center text-[#1E2A5A] hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-md cursor-pointer"
                  aria-label="Previous slide"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 flex items-center justify-center text-[#1E2A5A] hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-md cursor-pointer"
                  aria-label="Next slide"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </FadeInScale>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {PROJECTS.map((_, i) => {
              const isActive = i === current;
              const dist = Math.abs(i - current);
              if (isActive) {
                return (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className="flex items-center justify-center w-3 h-3 rounded-full border-2 border-[#1E2A5A] bg-transparent transition-all duration-300 cursor-pointer"
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#1E2A5A] block" />
                  </button>
                );
              }
              if (dist === 1) {
                return (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className="w-[3px] h-3 rounded-full bg-[#c4bdb5] cursor-pointer transition-all duration-300 hover:bg-[#999]"
                    aria-label={`Go to slide ${i + 1}`}
                  />
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className="w-3 h-3 rounded-full bg-[#d0cbc4] cursor-pointer transition-all duration-300 hover:bg-[#aaa]"
                  aria-label={`Go to slide ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section
        className="relative py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden"
        style={{
          background:
            "linear-gradient(120deg, #fdf7f5 0%, #f5f5f5 60%, #f5f5f5 100%)",
        }}
      >
        {/* Soft orange glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 10% 20%, rgba(227,74,47,0.18), transparent 40%)",
          }}
        />
        {/* Decorative circles */}
        <div
          className="absolute right-10 top-10 w-64 h-64 rounded-full pointer-events-none"
          style={{
            border: "1px dashed rgba(227,74,47,0.12)",
            animation: "floatBadge 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-16 top-16 w-48 h-48 rounded-full pointer-events-none"
          style={{
            border: "1px solid rgba(227,74,47,0.08)",
            animation: "floatBadge 6s ease-in-out infinite 1s",
          }}
        />

        <div className="relative w-full">
          {/* Top content */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-14 gap-6">
            <SlideInLeft delay={0}>
              <h2
                className="font-manrope font-bold text-[#1a1a1a] leading-tight"
                style={{ fontSize: "clamp(26px,4vw,44px)" }}
              >
                Invest in real estate <br /> with confidence
              </h2>
            </SlideInLeft>
            <SlideInRight delay={100}>
              <p className="text-gray-500 max-w-sm text-[14px] leading-relaxed">
                Explore premium properties, make smart investments, and grow
                your wealth through a seamless real estate experience.
              </p>
            </SlideInRight>
          </div>

          {/* Process Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROCESS.map((item, i) => (
              <StaggerSide key={i} index={i} delay={i * 130}>
                <TiltCard>
                  <div className="process-card relative bg-white rounded-2xl p-6 shadow-sm">
                    {/* Step Number with ring */}
                    <div className="relative inline-flex mb-4">
                      <span
                        className="text-[#E34A2F] text-4xl font-black leading-none"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        {item.step}
                      </span>
                      <div
                        className="absolute -inset-3 rounded-full pointer-events-none"
                        style={{
                          border: "1px dashed rgba(227,74,47,0.2)",
                          animation: `floatBadge ${3 + i}s ease-in-out infinite ${i * 0.5}s`,
                        }}
                      />
                    </div>
                    <p className="font-semibold text-[#1a1a1a] mb-2 text-[15px]">
                      {item.title}
                    </p>
                    <p className="text-gray-500 text-[13px] leading-relaxed">
                      {item.desc}
                    </p>

                    {/* Arrow connector */}
                    {i < 2 && (
                      <div
                        className="process-arrow hidden lg:block absolute top-1/2 right-[-22px] -translate-y-1/2 text-[#E34A2F] text-xl z-10"
                        style={{
                          filter: "drop-shadow(0 0 4px rgba(227,74,47,0.3))",
                        }}
                      >
                        →
                      </div>
                    )}
                  </div>
                </TiltCard>
              </StaggerSide>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOGS ── */}
      <section className="bg-[#FDFAF6] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <FadeUp delay={0}>
              <div>
                <p className="text-[#E34A2F] text-[10.5px] font-bold tracking-[2.5px] uppercase mb-2">
                  Insights
                </p>
                <h2
                  className="font-semibold text-[#1E2A5A] leading-tight tracking-tight"
                  style={{ fontSize: "clamp(22px, 3.5vw, 40px)" }}
                >
                  Related Articles
                </h2>
              </div>
            </FadeUp>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {BLOGS.map((blog, i) => (
              <ZoomIn3D key={i} delay={i * 110}>
                <div className="blog-card group cursor-pointer">
                  {/* Image */}
                  <div className="rounded-2xl overflow-hidden mb-4 h-[220px] sm:h-[250px]">
                    <img
                      src={blog.img}
                      alt={blog.title}
                      className="blog-img w-full h-full object-cover"
                    />
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0EC] text-[#E34A2F] text-[10px] font-bold tracking-[1.2px] uppercase">
                      {blog.category}
                    </span>
                    <span className="text-gray-300 text-[10px]">•</span>
                    <p className="text-gray-400 text-[11px]">{blog.date}</p>
                  </div>

                  {/* Title */}
                  <p className="font-manrope font-bold text-[#1E2A5A] text-[14px] sm:text-[15px] leading-snug group-hover:text-[#E34A2F] transition-colors duration-300">
                    {blog.title}
                  </p>

                  {/* Read more */}
                  <div className="flex items-center gap-1.5 mt-3 text-[#E34A2F] text-[11px] font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Read More
                    <TbArrowRight
                      size={12}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </ZoomIn3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#FDFAF6] px-4 sm:px-8 lg:px-16 xl:px-24 py-5">
        <FadeInScale delay={0}>
          <div
            className="relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden"
            style={{ minHeight: 420 }}
          >
            {/* Background Image with parallax */}
            <img
              src="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85"
              alt="Interior"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s]"
              style={{ transform: "scale(1.05)" }}
            />

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.75) 100%),
                  radial-gradient(circle at center, rgba(0,0,0,0.15), rgba(0,0,0,0.6))
                `,
              }}
            />

            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              {[1, 2, 3].map((ring) => (
                <div
                  key={ring}
                  className="absolute rounded-full border border-white/5"
                  style={{
                    width: `${ring * 200}px`,
                    height: `${ring * 200}px`,
                    animation: `floatBadge ${4 + ring}s ease-in-out infinite ${ring * 0.8}s`,
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center h-full min-h-[420px] px-4 py-16">
              <FadeUp delay={0}>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-white/20 bg-white/10 backdrop-blur-md mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                  <span className="text-[10px] tracking-[1.4px] text-white/90 uppercase">
                    Start Your Journey
                  </span>
                </div>
              </FadeUp>

              <FadeUp delay={100}>
                <h2
                  className="text-white font-semibold leading-[1.12] tracking-tight mb-4"
                  style={{
                    fontSize: "clamp(28px, 5vw, 64px)",
                    textShadow: "0 2px 24px rgba(0,0,0,0.28)",
                  }}
                >
                  Find a home that fits
                  <br />
                  your life.
                </h2>
              </FadeUp>

              <FadeUp delay={200}>
                <p
                  className="text-white/75 leading-relaxed mb-8 max-w-sm"
                  style={{ fontSize: "clamp(13px, 1.2vw, 15px)" }}
                >
                  Whether you're building from scratch or ready to move in,
                  we're here to help you feel at home.
                </p>
              </FadeUp>

              <FadeUp delay={300}>
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-2.5 bg-white text-[#1a1206] font-semibold rounded-full px-7 py-3.5 text-[13px] tracking-wide transition-all duration-300 hover:bg-white/95 hover:scale-[1.05] hover:shadow-2xl active:scale-[0.98]"
                >
                  Get in Touch
                  <TbArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  />
                </Link>
              </FadeUp>
            </div>
          </div>
        </FadeInScale>
      </section>

      {/* ── FOOTER ── */}
      <Footer />
    </>
  );
}
