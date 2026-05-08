import { useEffect, useState, useRef } from "react";
import heroimg from "../../public/hero_img.jpg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

// ── Data ──────────────────────────────────────────────────────────
const projects = [
  {
    id: 1,
    title: "Azure Sky Villas",
    status: "Upcoming",
    category: "Luxury Villas",
    description:
      "Exclusive sea-facing villas designed with modern architecture, private pools, and premium lifestyle amenities.",
    longDescription:
      "Azure Sky Villas is a landmark development nestled along the pristine coastline of Alibaug. Each villa is an architectural masterpiece — crafted with Italian marble, floor-to-ceiling glass, and bespoke interior design. Residents enjoy panoramic sea views, private infinity pools, and a curated lifestyle of unparalleled luxury. The community is gated, smart-enabled, and surrounded by lush tropical landscaping.",
    location: "Alibaug, Mumbai",
    area: "4,500 sq.ft",
    units: "48 Villas",
    timing: "3 weeks",
    price: "₹4.2 Cr onwards",
    features: [
      ["3D Walkthrough", "Explore villas with immersive 3D experience"],
      ["Private Pools", "Luxury villas with private infinity pools"],
      ["Smart Homes", "Fully automated lighting and security systems"],
      ["Premium Interiors", "Italian marble and designer finishes"],
    ],
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  },
  {
    id: 2,
    title: "Urban Heights Residency",
    status: "Ongoing",
    category: "Apartments",
    description:
      "High-rise residential towers offering smart living spaces with skyline views and modern amenities.",
    longDescription:
      "Urban Heights Residency redefines city living in the heart of Gachibowli. Rising 42 floors above the skyline, each apartment is a sanctuary of light and space. Floor-to-ceiling windows frame dramatic views, while smart home systems bring intuitive control. A world-class clubhouse, sky lounge, and rooftop pool complete the experience — this is urban living elevated.",
    location: "Gachibowli, Hyderabad",
    area: "2,200 sq.ft",
    units: "320 Units",
    timing: "5 weeks",
    price: "₹1.8 Cr onwards",
    features: [
      ["Sky Lounge", "Rooftop lounge with panoramic city views"],
      ["Clubhouse", "Modern clubhouse with gym & indoor games"],
      ["Security", "24/7 gated security with CCTV monitoring"],
      ["Green Spaces", "Landscaped gardens and jogging tracks"],
    ],
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
  },
  {
    id: 3,
    title: "Golden Palm Estates",
    status: "Completed",
    category: "Premium Homes",
    description:
      "A serene gated community offering spacious homes surrounded by greenery and world-class infrastructure.",
    longDescription:
      "Golden Palm Estates is a completed masterpiece in the heart of Surat — a gated community where modern design meets natural serenity. Each home is built with premium materials, spacious layouts, and abundant natural light. Wide tree-lined avenues, a resort-style amenity block, and 24/7 security make this one of Gujarat's most sought-after residential addresses.",
    location: "Surat, Gujarat",
    area: "3,000 sq.ft",
    units: "150 Homes",
    timing: "Completed",
    price: "₹2.5 Cr onwards",
    features: [
      ["Gated Community", "Secure and peaceful residential environment"],
      ["Modern Layout", "Spacious floor plans with natural ventilation"],
      ["Amenities", "Swimming pool, gym, and kids play area"],
      ["Parking", "Dedicated covered parking for each unit"],
    ],
    image:
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80",
  },
];

const stats = [
  { value: "15+", label: "Years of Excellence" },
  { value: "120+", label: "Projects Delivered" },
  { value: "8,500+", label: "Happy Families" },
  { value: "12", label: "Cities Across India" },
];

const nearbyListings = [
  {
    id: 1,
    price: "₹1,20,450",
    top: "14%",
    left: "58%",
    image:
      "https://housing.com/news/wp-content/uploads/2023/03/exterior-design-shutterstock_1932966368-1200x700-compressed.jpg",
    hasThumb: true,
    thumbSide: "bottom",
  },
  { id: 2, price: "₹4,27,000", top: "10%", left: "8%", hasThumb: false },
  { id: 3, price: "₹5,90,750", top: "22%", left: "20%", hasThumb: false },
  {
    id: 4,
    price: "₹1,22,941",
    top: "52%",
    left: "5%",
    image:
      "https://www.citybuildersanddevelopers.com/wp-content/uploads/2024/09/01-1.jpg",
    hasThumb: true,
    thumbSide: "right",
  },
  { id: 5, price: "₹3,65,000", top: "40%", left: "83%", hasThumb: false },
  { id: 6, price: "₹3,12,500", top: "72%", left: "28%", hasThumb: false },
  { id: 7, price: "₹4,27,100", top: "82%", left: "14%", hasThumb: false },
  {
    id: 8,
    price: "₹1,75,456",
    top: "66%",
    left: "58%",
    image: heroimg,
    hasThumb: true,
    thumbSide: "top",
  },
  { id: 9, price: "₹51,200", top: "83%", left: "76%", hasThumb: false },
];

const filters = ["All", "Upcoming", "Ongoing", "Completed"];
const typeFilters = [
  "All Types",
  "Luxury Villas",
  "Apartments",
  "Premium Homes",
];

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

// ── Hook ──────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ── StatusBadge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Upcoming: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    Ongoing: { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
    Completed: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      {status}
    </span>
  );
}

// ── CheckIcon ─────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.75)",
      }}
    >
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <polyline
          points="1,3.5 3.5,6 8,1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── ProjectCard ───────────────────────────────────────────────────
function ProjectCard({ project, index, onSelect }) {
  const [ref, inView] = useInView();
  const [hovered, setHovered] = useState(false);

  return (
    <Link to="/project-details">
    <div
      ref={ref}
      className="relative w-full overflow-hidden cursor-pointer"
      style={{
        height: "560px",
        width: "100%",
        maxWidth: "100%",
        borderRadius: "20px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        boxShadow: hovered
          ? "0 24px 64px rgba(0,0,0,0.14)"
          : "0 4px 24px rgba(0,0,0,0.07)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(48px)",
        transition: `opacity 0.75s ease ${index * 0.12}s, transform 0.75s ease ${index * 0.12}s, box-shadow 0.4s ease`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(project)}
    >
      <img
        src={project.image}
        alt={project.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: hovered ? "scale(1.02)" : "scale(1)",
          transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: hovered
            ? "linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.85) 42%, rgba(8,8,8,0.25) 72%, transparent 100%)"
            : "linear-gradient(to top, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.12) 38%, transparent 60%)",
          transition: "background 0.55s ease",
        }}
      />

      <div className="absolute top-5 left-5 z-10">
        <StatusBadge status={project.status} />
      </div>

      <div className="absolute top-5 right-5 z-10">
        <span
          className="text-[10px] font-semibold tracking-[0.16em] uppercase"
          style={{
            color: "rgba(255,255,255,0.75)",
            background: "rgba(0,0,0,0.32)",
            backdropFilter: "blur(8px)",
            border: "0.5px solid rgba(255,255,255,0.2)",
            padding: "5px 12px",
            borderRadius: "999px",
          }}
        >
          {project.category}
        </span>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-10 px-7 pb-7 pt-4"
        style={{
          transform: hovered ? "translateY(0)" : "translateY(4px)",
          transition: "transform 0.45s ease",
        }}
      >
        <div
          style={{
            maxHeight: hovered ? "230px" : "0px",
            opacity: hovered ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.55s ease, opacity 0.4s ease 0.1s",
          }}
        >
          <div className="flex flex-col gap-2.5 mb-5">
            {project.features.map(([title, desc]) => (
              <div key={title} className="flex items-center gap-3">
                <CheckIcon />
                <span
                  className="text-white font-medium text-sm flex-shrink-0"
                  style={{ minWidth: "108px" }}
                >
                  {title}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.48)" }}
                >
                  {desc}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-5 mb-5">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-0.5"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Area
              </p>
              <p
                className="font-semibold text-white"
                style={{ fontSize: "15px", lineHeight: 1 }}
              >
                {project.area}
              </p>
            </div>
            <div
              style={{
                width: "0.5px",
                height: "28px",
                background: "rgba(255,255,255,0.15)",
              }}
            />
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-0.5"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Units
              </p>
              <p
                className="font-semibold text-white"
                style={{ fontSize: "15px", lineHeight: 1 }}
              >
                {project.units}
              </p>
            </div>
            <div
              style={{
                width: "0.5px",
                height: "28px",
                background: "rgba(255,255,255,0.15)",
              }}
            />
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-0.5"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Timing
              </p>
              <p
                className="font-semibold text-white"
                style={{ fontSize: "15px", lineHeight: 1 }}
              >
                {project.timing}
              </p>
            </div>
          </div>
        </div>

        <h3
          className="text-white font-bold leading-snug mb-2.5"
          style={{ fontSize: "clamp(18px, 2vw, 22px)" }}
        >
          {project.title}
        </h3>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#E34A2F" }}
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
              </svg>
            </span>
            <span
              className="text-sm truncate"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {project.location}
            </span>
          </div>

          <Link to="/project-details">
            <button
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
              style={{
                padding: "8px 18px",
                borderRadius: "999px",
                background: hovered ? "#E34A2F" : "rgba(255,255,255,0.14)",
                color: "white",
                border: hovered
                  ? "1px solid #E34A2F"
                  : "1px solid rgba(255,255,255,0.28)",
                transition: "all 0.35s ease",
                whiteSpace: "nowrap",
              }}
            >
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
    </Link>
  );
}

// ── StatCard ──────────────────────────────────────────────────────
function StatCard({ stat, index }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
      }}
      className="text-center"
    >
      <div className="text-5xl font-regular text-[#E34A2F] mb-2 tracking-tight">
        {stat.value}
      </div>
      <div className="text-sm text-gray-500 font-medium uppercase tracking-widest">
        {stat.label}
      </div>
    </div>
  );
}

// ── MapPin ────────────────────────────────────────────────────────
function MapPin({ listing }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="absolute"
      style={{
        top: listing.top,
        left: listing.left,
        zIndex: hovered ? 30 : 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {listing.hasThumb && (
        <div
          className="absolute bg-white rounded-xl overflow-hidden"
          style={{
            width: "115px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            ...(listing.thumbSide === "bottom"
              ? {
                  bottom: "100%",
                  marginBottom: "8px",
                  left: "50%",
                  transform: hovered
                    ? "translateX(-50%) scale(1.05)"
                    : "translateX(-50%) scale(1)",
                }
              : listing.thumbSide === "right"
                ? {
                    left: "100%",
                    marginLeft: "8px",
                    top: "50%",
                    transform: hovered
                      ? "translateY(-50%) scale(1.05)"
                      : "translateY(-50%) scale(1)",
                  }
                : {
                    top: "100%",
                    marginTop: "8px",
                    left: "50%",
                    transform: hovered
                      ? "translateX(-50%) scale(1.05)"
                      : "translateX(-50%) scale(1)",
                  }),
            opacity: hovered ? 1 : 0.88,
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}
        >
          <img
            src={listing.image}
            alt="property"
            className="w-full h-16 object-cover"
          />
          <div className="px-2 py-1.5">
            <p className="text-[10px] font-bold text-gray-900 leading-tight">
              {listing.price}
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">View listing →</p>
          </div>
        </div>
      )}
      <div
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap select-none"
        style={{
          background: hovered ? "#E34A2F" : "white",
          color: hovered ? "white" : "#111",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "all 0.2s ease",
          boxShadow: hovered
            ? "0 4px 20px rgba(227,74,47,0.4)"
            : "0 2px 12px rgba(0,0,0,0.25)",
        }}
      >
        {listing.hasThumb && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: hovered ? "white" : "#E34A2F" }}
          />
        )}
        {listing.price}
      </div>
    </div>
  );
}

// ── Explore Nearby Homes Section ──────────────────────────────────
function ExploreMapSection() {
  const [ref, inView] = useInView(0.1);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden bg-[#111111]"
    >
      <div className="relative h-[420px] sm:h-[520px] md:h-[620px] lg:h-[700px]">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1200 520"
        >
          <rect width="1200" height="520" fill="#111111" />
          <g stroke="#1e1e1e" strokeWidth="8" fill="none">
            <path d="M0 200 Q300 185 600 210 T1200 195" />
            <path d="M0 360 Q400 340 700 370 T1200 355" />
            <path d="M150 0 Q165 260 145 520" />
            <path d="M430 0 Q415 260 440 520" />
            <path d="M720 0 Q735 260 710 520" />
            <path d="M980 0 Q965 260 995 520" />
          </g>
          <g stroke="#181818" strokeWidth="3" fill="none">
            <path d="M0 100 Q300 90 650 108 T1200 95" />
            <path d="M0 290 Q350 275 700 295 T1200 280" />
            <path d="M0 440 Q300 430 650 445 T1200 435" />
            <path d="M285 0 Q270 260 290 520" />
            <path d="M575 0 Q590 260 565 520" />
            <path d="M855 0 Q840 260 870 520" />
            <path d="M1100 0 Q1085 260 1110 520" />
          </g>
          <g fill="#191919">
            {[
              [10,10,115,75],[175,15,85,60],[300,8,100,80],[455,12,125,70],[625,10,75,85],[745,15,105,65],[890,8,75,78],[1010,12,90,70],[1120,10,70,75],
              [10,115,105,55],[175,110,80,60],[300,118,95,50],[455,112,115,58],[625,115,80,55],[745,108,100,60],[890,112,80,55],[1010,115,85,52],[1120,110,70,58],
              [10,220,110,60],[175,215,90,65],[300,222,100,55],[455,218,120,62],[625,220,75,58],[745,215,105,62],[890,222,80,55],[1010,220,90,58],[1120,215,70,62],
              [10,305,105,30],[175,300,80,35],[300,308,100,28],[455,303,115,32],[625,305,80,30],[745,300,100,35],[890,305,80,30],[1010,302,85,33],[1120,300,70,35],
              [10,375,110,65],[175,370,90,70],[300,378,100,60],[455,372,120,68],[625,375,75,65],[745,370,105,68],[890,378,80,62],[1010,374,90,66],[1120,370,70,68],
              [10,460,105,55],[175,455,80,60],[300,462,100,52],[455,458,115,56],[625,460,80,54],[745,455,100,60],[890,460,80,54],[1010,458,85,56],[1120,455,70,60],
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="3" />
            ))}
          </g>
        </svg>

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 52% 58% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.12) 100%)",
          }}
        />

        <div className="hidden sm:block">
          {nearbyListings.map((listing, i) => (
            <MapPin key={listing.id} listing={listing} index={i} />
          ))}
        </div>

        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView
              ? "translateY(0) scale(1)"
              : "translateY(32px) scale(0.96)",
            transition:
              "opacity 1s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          <h2 className="text-white font-Semibold leading-[1.1] text-[28px] sm:text-[42px] md:text-[56px] lg:text-[68px] max-w-[280px] sm:max-w-2xl md:max-w-4xl">
            Explore Nearby Homes
          </h2>
          <p className="text-white/60 text-[13px] sm:text-base md:text-lg leading-relaxed mt-4 mb-7 max-w-[260px] sm:max-w-lg">
            Browse available homes near you and explore listings in your
            favorite areas.
          </p>
          <button
            className="pointer-events-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-white text-gray-900 font-bold text-sm sm:text-base rounded-full transition-all duration-300 hover:bg-gray-100 hover:-translate-y-1 active:scale-95"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}

// ── ScrollReveal wrapper ──────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVis(true);
      },
      { threshold: 0.12 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const translate =
    direction === "up"
      ? vis ? "translateY(0)" : "translateY(40px)"
      : direction === "down"
        ? vis ? "translateY(0)" : "translateY(-40px)"
        : direction === "left"
          ? vis ? "translateX(0)" : "translateX(-40px)"
          : direction === "right"
            ? vis ? "translateX(0)" : "translateX(40px)"
            : "none";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: translate,
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Main Project List Page ────────────────────────────────────────
export default function Project() {
  const [loaded, setLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeType, setActiveType] = useState("All Types");
  const [selectedProject, setSelectedProject] = useState(null);
  const [statsRef] = useInView(0.2);
  const scrollProgress = useScrollProgress();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = projects.filter((p) => {
    const statusMatch = activeFilter === "All" || p.status === activeFilter;
    const typeMatch = activeType === "All Types" || p.category === activeType;
    return statusMatch && typeMatch;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { overflow-x: hidden; width: 100%; }
        section, div { min-width: 0; }
        img, video { max-width: 100%; }

        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes scrollTopReveal {
          from { opacity: 0; transform: translateY(16px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scrollTopBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }

        .scroll-top-btn {
          animation: scrollTopReveal 0.4s cubic-bezier(.34,1.56,.64,1) both;
        }
        .scroll-top-btn:hover .scroll-top-arrow {
          animation: scrollTopBounce 0.6s ease infinite;
        }

        .scroll-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #E34A2F, #ffb347);
          z-index: 9999;
          transition: width 0.1s linear;
        }

        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #FDFAF6; }
        ::-webkit-scrollbar-thumb { background: #E34A2F; border-radius: 3px; }
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
          className="scroll-top-btn fixed bottom-6 right-4 z-[9000] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E34A2F] flex items-center justify-center shadow-lg hover:bg-[#c73b22] transition-colors duration-200 cursor-pointer"
          style={{ boxShadow: "0 4px 20px rgba(227,74,47,0.4)" }}
          aria-label="Scroll to top"
        >
          <span className="scroll-top-arrow flex items-center justify-center text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </span>
        </button>
      )}

      {/* ── HERO ── */}
      <section className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
        <Navbar />
        <div
          className={`absolute inset-0 bg-cover bg-top transition-transform duration-[14000ms] ease-out ${loaded ? "scale-100" : "scale-110"}`}
          style={{
            backgroundImage: `url(${heroimg})`,
            filter: "brightness(0.40) saturate(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />

        <nav
          className="relative z-10 flex items-center gap-2.5 text-xs font-light tracking-[0.22em] uppercase mb-6"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(28px)",
            transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.3s",
          }}
        >
          <a href="/" className="text-white/55 hover:text-white transition-colors">Home</a>
          <span className="text-white/35 text-[10px]">›</span>
          <span className="text-white/90">Projects</span>
        </nav>

        <h1
          className="relative z-10 text-center font-light tracking-[0.14em] uppercase text-white leading-none"
          style={{
            fontSize: "clamp(42px, 6vw, 92px)",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(28px)",
            transition: "all 1s cubic-bezier(.22,1,.36,1) 0.15s",
          }}
        >
          Our Projects
        </h1>

        <p
          className="relative z-10 text-white/60 text-base font-light mt-5 max-w-md text-center px-4"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.5s",
          }}
        >
          Crafting homes that inspire. Spaces that endure.
        </p>

        <div
          className="relative z-10 h-px bg-white/40 mt-6"
          style={{
            width: loaded ? "80px" : "0px",
            transition: "width 1s cubic-bezier(.22,1,.36,1) 0.7s",
          }}
        />

        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 1s ease 1.5s",
          }}
        >
          <span className="text-white/40 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/30 animate-pulse" />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-gray-950 py-10 sm:py-10 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div
          ref={statsRef}
          className="w-full grid grid-cols-2 sm:grid-cols-4 gap-10"
        >
          {stats.map((s, i) => (
            <StatCard key={i} stat={s} index={i} />
          ))}
        </div>
      </section>

      {/* ── PROJECTS SECTION ── */}
      <section className="bg-[#F8F7F4] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-6">
            <Reveal direction="left">
              <div>
                <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
                  Portfolio
                </span>
                <h2 className="text-gray-900 font-semibold text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                  Discover our
                  <br />
                  <span className="text-[#E34A2F]">signature</span> projects
                </h2>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                From concept to completion, every project reflects our
                commitment to quality, design, and livability.
              </p>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.05}>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                      activeFilter === f
                        ? "bg-[#E34A2F] text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
              <div className="flex flex-wrap gap-2">
                {typeFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveType(f)}
                    className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                      activeType === f
                        ? "bg-gray-900 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">
            Showing {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </p>

          <div className="flex flex-col gap-6">
            {filtered.length > 0 ? (
              filtered.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onSelect={setSelectedProject}
                />
              ))
            ) : (
              <div className="text-center py-24 text-gray-400">
                <p className="text-lg">No projects match the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PROCESS SECTION ── */}
      <section className="bg-white py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="w-full">
          <Reveal direction="up">
            <div className="text-center mb-16">
              <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
                How We Work
              </span>
              <h2 className="text-gray-900 font-semibold text-4xl sm:text-5xl leading-tight">
                Our development process
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
            <div className="hidden sm:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gray-200 z-0" />
            {[
              {
                step: "01",
                title: "Site Acquisition",
                desc: "Identifying prime locations with strong growth potential and community value.",
              },
              {
                step: "02",
                title: "Design & Planning",
                desc: "Collaborating with architects to create timeless, functional living spaces.",
              },
              {
                step: "03",
                title: "Construction",
                desc: "Using premium materials and rigorous quality checks at every stage.",
              },
              {
                step: "04",
                title: "Handover",
                desc: "Delivering your dream home on time, with full transparency and care.",
              },
            ].map((item, i) => {
              const [ref, inView] = useInView();
              return (
                <div
                  key={i}
                  ref={ref}
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(30px)",
                    transition: `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`,
                  }}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 hover:border-[#E34A2F] flex items-center justify-center mb-5 shadow-sm transition-colors duration-300">
                    <span className="text-2xl font-semibold text-[#E34A2F]">{item.step}</span>
                  </div>
                  <h3 className="text-gray-900 font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EXPLORE NEARBY HOMES ── */}
      <ExploreMapSection />

      <Footer />
    </>
  );
}