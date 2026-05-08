import { useEffect, useState, useRef } from "react";
import heroimg from "../../public/hero_img.jpg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ─── Custom useInView hook (used everywhere EXCEPT ExploreMapSection) ─────────
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

// ─── Project Data (Map pins) ──────────────────────────────────────────────────
const BBOX = { lonMin: 72.48, lonMax: 72.72, latMin: 22.95, latMax: 23.14 };

function toPercent(lon, lat) {
  const x = ((lon - BBOX.lonMin) / (BBOX.lonMax - BBOX.lonMin)) * 100;
  const y = ((BBOX.latMax - lat) / (BBOX.latMax - BBOX.latMin)) * 100;
  return { x, y };
}

const MAP_PROJECTS = [
  { id: 1,  name: "Titanium City Center",  type: "Commercial",  area: "SG Highway",    year: "2019", units: "420 offices", lon: 72.507, lat: 23.039 },
  { id: 2,  name: "Shivalik Heights",      type: "Residential", area: "Shilaj",        year: "2020", units: "180 units",   lon: 72.496, lat: 23.018 },
  { id: 3,  name: "Empire Business Hub",   type: "Commercial",  area: "Prahlad Nagar", year: "2021", units: "310 offices", lon: 72.512, lat: 23.029 },
  { id: 4,  name: "The Green Courtyard",   type: "Residential", area: "Bopal",         year: "2018", units: "240 units",   lon: 72.487, lat: 23.005 },
  { id: 5,  name: "Skyline Residency",     type: "Residential", area: "Thaltej",       year: "2022", units: "160 units",   lon: 72.504, lat: 23.052 },
  { id: 6,  name: "Palm Exotica",          type: "Residential", area: "Satellite",     year: "2017", units: "320 units",   lon: 72.528, lat: 23.031 },
  { id: 7,  name: "Orchid Harmony",        type: "Residential", area: "Gota",          year: "2020", units: "200 units",   lon: 72.560, lat: 23.094 },
  { id: 8,  name: "Sapphire Trade Center", type: "Commercial",  area: "Ashram Road",   year: "2016", units: "500 offices", lon: 72.568, lat: 23.022 },
  { id: 9,  name: "Royal Lakeview",        type: "Residential", area: "Chandkheda",    year: "2021", units: "280 units",   lon: 72.600, lat: 23.102 },
  { id: 10, name: "Urban Nest Villas",     type: "Villa",       area: "Naranpura",     year: "2019", units: "64 villas",   lon: 72.574, lat: 23.054 },
  { id: 11, name: "Sterling Square",       type: "Mixed-Use",   area: "CG Road",       year: "2018", units: "380 spaces",  lon: 72.555, lat: 23.030 },
  { id: 12, name: "Harmony Luxuria",       type: "Residential", area: "Maninagar",     year: "2023", units: "220 units",   lon: 72.602, lat: 22.995 },
];

// ─── Single Map Pin ───────────────────────────────────────────────────────────
function ProjectPin({ project, index }) {
  const [hovered, setHovered] = useState(false);
  const pos = toPercent(project.lon, project.lat);
  const flipLeft = pos.x > 72;
  const flipUp = pos.y > 62;

  return (
    <motion.div
      className="absolute z-10"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 + index * 0.08, duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse rings */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: "rgba(228,87,46,0.18)", animation: `pinPulse 2.2s ease-in-out infinite ${index * 0.15}s` }}
      />
      <span
        className="absolute rounded-full"
        style={{ inset: "-8px", border: "1px solid rgba(228,87,46,0.22)", borderRadius: "50%", animation: `pinRing 2.2s ease-in-out infinite ${index * 0.15 + 0.3}s` }}
      />

      {/* Dot */}
      <motion.div
        className="relative flex items-center justify-center cursor-pointer"
        style={{ width: 24, height: 24, borderRadius: "50%" }}
        whileHover={{ scale: 1.3 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <div
          style={{
            width: 10, height: 10, borderRadius: "50%", background: "#E4572E",
            boxShadow: "0 0 8px rgba(228,87,46,0.9), 0 0 20px rgba(228,87,46,0.45)",
            animation: `dotGlow 2.2s ease-in-out infinite ${index * 0.15}s`,
          }}
        />
      </motion.div>

      {/* Name label — always visible */}
      <div
        style={{
          position: "absolute", top: "calc(100% + 5px)", left: "50%",
          transform: "translateX(-50%)", background: "rgba(10,9,8,0.82)",
          border: "0.5px solid rgba(228,87,46,0.28)", borderRadius: 4,
          padding: "2px 7px", whiteSpace: "nowrap", fontSize: 9, fontWeight: 600,
          color: "#dedede", letterSpacing: "0.2px", pointerEvents: "none",
          maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis",
        }}
      >
        {project.name}
      </div>

      {/* Hover card */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: flipUp ? 6 : -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: flipUp ? 6 : -6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position: "absolute", width: 180,
              background: "rgba(12,11,10,0.94)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: "0.5px solid rgba(228,87,46,0.22)", borderRadius: 10,
              padding: "12px 14px", zIndex: 50, pointerEvents: "none",
              ...(flipUp ? { bottom: "calc(100% + 14px)", top: "auto" } : { top: "calc(100% + 14px)", bottom: "auto" }),
              ...(flipLeft ? { right: 0, left: "auto" } : { left: "50%", transform: "translateX(-50%)" }),
            }}
          >
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "#f2f2f2", marginBottom: 6, lineHeight: 1.3 }}>
              {project.name}
            </p>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(228,87,46,0.1)", border: "0.5px solid rgba(228,87,46,0.3)",
                borderRadius: 20, padding: "2px 8px", fontSize: 8.5, fontWeight: 700,
                color: "#E4572E", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E4572E", boxShadow: "0 0 6px rgba(228,87,46,0.9)", animation: "dotGlow 2s infinite" }} />
              Completed {project.year}
            </div>
            {[["Type", project.type], ["Location", project.area], ["Scale", project.units]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#555", padding: "2.5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                <span>{label}</span>
                <span style={{ color: "#aaa", fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Project Card Data ─────────────────────────────────────────────
const projects = [
  {
    id: 1,
    title: "Azure Sky Villas",
    status: "Upcoming",
    category: "Luxury Villas",
    description: "Exclusive sea-facing villas designed with modern architecture, private pools, and premium lifestyle amenities.",
    longDescription: "Azure Sky Villas is a landmark development nestled along the pristine coastline of Alibaug. Each villa is an architectural masterpiece crafted with Italian marble, floor-to-ceiling glass, and bespoke interior design.",
    location: "Alibaug, Mumbai",
    area: "4,500 sq.ft",
    units: "48 Villas",
    timing: "3 weeks",
    price: "₹4.2 Cr onwards",
    priceValue: 42000000,
    features: [
      ["3D Walkthrough", "Explore villas with immersive 3D experience"],
      ["Private Pools", "Luxury villas with private infinity pools"],
      ["Smart Homes", "Fully automated lighting and security systems"],
      ["Premium Interiors", "Italian marble and designer finishes"],
    ],
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  },
  {
    id: 2,
    title: "Urban Heights Residency",
    status: "Ongoing",
    category: "Apartments",
    description: "High-rise residential towers offering smart living spaces with skyline views and modern amenities.",
    longDescription: "Urban Heights Residency redefines city living in the heart of Gachibowli with luxury apartments and skyline experiences.",
    location: "Gachibowli, Hyderabad",
    area: "2,200 sq.ft",
    units: "320 Units",
    timing: "5 weeks",
    price: "₹1.8 Cr onwards",
    priceValue: 18000000,
    features: [
      ["Sky Lounge", "Rooftop lounge with panoramic city views"],
      ["Clubhouse", "Modern clubhouse with gym & indoor games"],
      ["Security", "24/7 gated security with CCTV monitoring"],
      ["Green Spaces", "Landscaped gardens and jogging tracks"],
    ],
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
  },
  {
    id: 3,
    title: "Golden Palm Estates",
    status: "Completed",
    category: "Premium Homes",
    description: "A serene gated community offering spacious homes surrounded by greenery and world-class infrastructure.",
    longDescription: "Golden Palm Estates combines modern architecture with natural serenity and premium community living.",
    location: "Surat, Gujarat",
    area: "3,000 sq.ft",
    units: "150 Homes",
    timing: "Completed",
    price: "₹2.5 Cr onwards",
    priceValue: 25000000,
    features: [
      ["Gated Community", "Secure and peaceful residential environment"],
      ["Modern Layout", "Spacious floor plans with natural ventilation"],
      ["Amenities", "Swimming pool, gym, and kids play area"],
      ["Parking", "Dedicated covered parking for each unit"],
    ],
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80",
  },
  {
    id: 4,
    title: "Emerald Bay Towers",
    status: "Upcoming",
    category: "Luxury Apartments",
    description: "Ultra-modern waterfront apartments with premium interiors and panoramic ocean views.",
    longDescription: "Emerald Bay Towers offers a world-class luxury lifestyle with designer residences, rooftop infinity pools, and smart living experiences.",
    location: "Marine Drive, Mumbai",
    area: "2,800 sq.ft",
    units: "210 Apartments",
    timing: "8 weeks",
    price: "₹3.6 Cr onwards",
    priceValue: 36000000,
    features: [
      ["Infinity Pool", "Luxury rooftop infinity swimming pool"],
      ["Ocean View", "Panoramic waterfront apartments"],
      ["Smart Access", "Digital smart-lock access systems"],
      ["Fitness Center", "Fully equipped premium fitness studio"],
    ],
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
  },
  {
    id: 5,
    title: "Silver Oak Residency",
    status: "Ongoing",
    category: "Family Homes",
    description: "Elegant family residences designed for comfort, greenery, and community living.",
    longDescription: "Silver Oak Residency blends peaceful surroundings with luxurious family-friendly infrastructure and contemporary architecture.",
    location: "Ahmedabad, Gujarat",
    area: "2,400 sq.ft",
    units: "180 Homes",
    timing: "4 weeks",
    price: "₹1.2 Cr onwards",
    priceValue: 12000000,
    features: [
      ["Kids Zone", "Dedicated play zones for children"],
      ["Green Parks", "Large landscaped gardens and parks"],
      ["Jogging Track", "Dedicated walking and jogging paths"],
      ["Community Hall", "Multipurpose community spaces"],
    ],
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  },
  {
    id: 6,
    title: "Royal Crest Villas",
    status: "Completed",
    category: "Luxury Villas",
    description: "Premium private villas with elegant architecture and luxurious lifestyle amenities.",
    longDescription: "Royal Crest Villas delivers a private luxury experience with spacious interiors, private gardens, and resort-inspired living.",
    location: "Lonavala, Maharashtra",
    area: "5,200 sq.ft",
    units: "32 Villas",
    timing: "Completed",
    price: "₹5.8 Cr onwards",
    priceValue: 58000000,
    features: [
      ["Private Garden", "Beautiful landscaped private gardens"],
      ["Luxury Interiors", "Imported designer interiors"],
      ["Resort Living", "Resort-inspired community experience"],
      ["Security", "Premium gated security systems"],
    ],
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  },
  {
    id: 7,
    title: "Skyline Business Hub",
    status: "Upcoming",
    category: "Commercial",
    description: "Modern commercial office spaces with futuristic infrastructure and premium facilities.",
    longDescription: "Skyline Business Hub is designed for modern enterprises with smart office spaces, coworking zones, and premium business facilities.",
    location: "BKC, Mumbai",
    area: "1,800 sq.ft",
    units: "400 Offices",
    timing: "6 weeks",
    price: "₹95 L onwards",
    priceValue: 9500000,
    features: [
      ["Coworking", "Premium coworking and meeting zones"],
      ["Business Lounge", "Executive business lounges"],
      ["Parking", "Multi-level dedicated parking"],
      ["High-Speed Elevators", "Fast smart elevator systems"],
    ],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
  },
  {
    id: 8,
    title: "Nature Nest Retreat",
    status: "Ongoing",
    category: "Farm Houses",
    description: "Luxury farmhouse community surrounded by nature, lakes, and peaceful landscapes.",
    longDescription: "Nature Nest Retreat offers luxurious countryside living with private farmhouses and wellness-inspired amenities.",
    location: "Udaipur, Rajasthan",
    area: "6,000 sq.ft",
    units: "24 Farmhouses",
    timing: "7 weeks",
    price: "₹3.1 Cr onwards",
    priceValue: 31000000,
    features: [
      ["Lake View", "Private lake-facing properties"],
      ["Organic Farms", "Eco-friendly organic farming zones"],
      ["Clubhouse", "Luxury countryside clubhouse"],
      ["Wellness Spa", "Nature-inspired wellness spa"],
    ],
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
  },
];

const stats = [
  { value: "15+", label: "Years of Excellence" },
  { value: "120+", label: "Projects Delivered" },
  { value: "8,500+", label: "Happy Families" },
  { value: "12", label: "Cities Across India" },
];

const nearbyListings = [
  { id: 1, price: "₹1,20,450", top: "14%", left: "58%", image: "https://housing.com/news/wp-content/uploads/2023/03/exterior-design-shutterstock_1932966368-1200x700-compressed.jpg", hasThumb: true, thumbSide: "bottom" },
  { id: 2, price: "₹4,27,000", top: "10%", left: "8%", hasThumb: false },
  { id: 3, price: "₹5,90,750", top: "22%", left: "20%", hasThumb: false },
  { id: 4, price: "₹1,22,941", top: "52%", left: "5%", image: "https://www.citybuildersanddevelopers.com/wp-content/uploads/2024/09/01-1.jpg", hasThumb: true, thumbSide: "right" },
  { id: 5, price: "₹3,65,000", top: "40%", left: "83%", hasThumb: false },
  { id: 6, price: "₹3,12,500", top: "72%", left: "28%", hasThumb: false },
  { id: 7, price: "₹4,27,100", top: "82%", left: "14%", hasThumb: false },
  { id: 8, price: "₹1,75,456", top: "66%", left: "58%", image: heroimg, hasThumb: true, thumbSide: "top" },
  { id: 9, price: "₹51,200", top: "83%", left: "76%", hasThumb: false },
];

const filters = ["All", "Ongoing", "Upcoming", "Completed"];
const typeFilters = ["All Types", "Apartments", "Premium Homes", "Luxury Villas"];
const priceFilters = ["All", "Under ₹50L", "₹50L - ₹1Cr", "₹1Cr - ₹2Cr", "Above ₹2Cr"];

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return progress;
}

// ── StatusBadge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Upcoming:  { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    Ongoing:   { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
    Completed: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

// ── CheckIcon ─────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "18px", height: "18px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.75)" }}>
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          height: "560px", width: "100%", maxWidth: "100%", borderRadius: "20px",
          background: "#fff", border: "1px solid #e5e7eb",
          boxShadow: hovered ? "0 24px 64px rgba(0,0,0,0.14)" : "0 4px 24px rgba(0,0,0,0.07)",
          opacity: inView ? 1 : 0,
          transform: hovered ? "translateY(-6px)" : inView ? "translateY(0)" : "translateY(48px)",
          transition: "opacity 0.75s ease, transform 0.35s ease, box-shadow 0.35s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(project)}
      >
        <img
          src={project.image} alt={project.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: hovered ? "scale(1.03)" : "scale(1)", transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%)" }} />
        <div
          className="absolute inset-0"
          style={{
            background: hovered
              ? "linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.85) 42%, rgba(8,8,8,0.25) 72%, transparent 100%)"
              : "linear-gradient(to top, rgba(8,8,8,0.75) 0%, rgba(8,8,8,0.15) 38%, transparent 60%)",
            transition: "background 0.55s ease",
          }}
        />
        <div className="absolute top-5 left-5 z-10"><StatusBadge status={project.status} /></div>
        <div className="absolute top-5 right-5 z-10">
          <span className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: "rgba(255,255,255,0.75)", background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)", border: "0.5px solid rgba(255,255,255,0.2)", padding: "5px 12px", borderRadius: "999px" }}>
            {project.category}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 sm:px-7 pb-6 sm:pb-7 pt-4" style={{ transform: hovered ? "translateY(0)" : "translateY(4px)", transition: "transform 0.45s ease" }}>
          <div style={{ maxHeight: hovered ? "240px" : "0px", opacity: hovered ? 1 : 0, overflow: "hidden", transition: "max-height 0.55s ease, opacity 0.4s ease 0.1s" }}>
            <div className="flex flex-col gap-2.5 mb-5">
              {project.features.map(([title, desc]) => (
                <div key={title} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-white font-medium text-sm flex-shrink-0" style={{ minWidth: "108px" }}>{title}</span>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.48)" }}>{desc}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 mb-5 flex-wrap">
              {[["Area", project.area], ["Units", project.units], ["Timing", project.timing]].map(([label, val], i) => (
                <div key={label} className="flex items-center gap-5">
                  {i > 0 && <div style={{ width: "0.5px", height: "28px", background: "rgba(255,255,255,0.15)" }} />}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</p>
                    <p className="font-semibold text-white" style={{ fontSize: "15px", lineHeight: 1 }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <h3 className="text-white font-bold leading-snug mb-3" style={{ fontSize: "clamp(20px, 2vw, 24px)" }}>{project.title}</h3>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-3 min-w-0">
              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] mb-1 block" style={{ color: "rgba(255,255,255,0.38)" }}>Starting Price</span>
                <h4 className="font-bold text-white" style={{ fontSize: "clamp(18px,2vw,24px)", lineHeight: 1 }}>{project.price}</h4>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#E34A2F" }}>
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" /></svg>
                </span>
                <span className="text-sm truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{project.location}</span>
              </div>
            </div>
            <Link to="/project-details">
              <button
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
                style={{ padding: "10px 18px", borderRadius: "999px", background: hovered ? "#E34A2F" : "rgba(255,255,255,0.14)", color: "white", border: hovered ? "1px solid #E34A2F" : "1px solid rgba(255,255,255,0.28)", transition: "all 0.35s ease", whiteSpace: "nowrap" }}
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
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s` }} className="text-center">
      <div className="text-5xl font-regular text-[#E34A2F] mb-2 tracking-tight">{stat.value}</div>
      <div className="text-sm text-gray-500 font-medium uppercase tracking-widest">{stat.label}</div>
    </div>
  );
}

// ── MapPin (nearby listings) ──────────────────────────────────────
function MapPin({ listing }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="absolute" style={{ top: listing.top, left: listing.left, zIndex: hovered ? 30 : 10 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {listing.hasThumb && (
        <div
          className="absolute bg-white rounded-xl overflow-hidden"
          style={{
            width: "115px", boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            ...(listing.thumbSide === "bottom"
              ? { bottom: "100%", marginBottom: "8px", left: "50%", transform: hovered ? "translateX(-50%) scale(1.05)" : "translateX(-50%) scale(1)" }
              : listing.thumbSide === "right"
              ? { left: "100%", marginLeft: "8px", top: "50%", transform: hovered ? "translateY(-50%) scale(1.05)" : "translateY(-50%) scale(1)" }
              : { top: "100%", marginTop: "8px", left: "50%", transform: hovered ? "translateX(-50%) scale(1.05)" : "translateX(-50%) scale(1)" }),
            opacity: hovered ? 1 : 0.88,
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}
        >
          <img src={listing.image} alt="property" className="w-full h-16 object-cover" />
          <div className="px-2 py-1.5">
            <p className="text-[10px] font-bold text-gray-900 leading-tight">{listing.price}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">View listing →</p>
          </div>
        </div>
      )}
      <div
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap select-none"
        style={{
          background: hovered ? "#E34A2F" : "white", color: hovered ? "white" : "#111",
          transform: hovered ? "scale(1.08)" : "scale(1)", transition: "all 0.2s ease",
          boxShadow: hovered ? "0 4px 20px rgba(227,74,47,0.4)" : "0 2px 12px rgba(0,0,0,0.25)",
        }}
      >
        {listing.hasThumb && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: hovered ? "white" : "#E34A2F" }} />}
        {listing.price}
      </div>
    </div>
  );
}

// ── ExploreMapSection ─────────────────────────────────────────────
function ExploreMapSection() {
  const sectionRef = useRef(null);
  const [mapInView, setMapInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setMapInView(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes pinPulse {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pinRing {
          0%,100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0.1; }
        }
        @keyframes dotGlow {
          0%,100% { box-shadow: 0 0 6px rgba(228,87,46,0.85), 0 0 14px rgba(228,87,46,0.3); }
          50% { box-shadow: 0 0 14px rgba(228,87,46,1), 0 0 30px rgba(228,87,46,0.6); }
        }
      `}</style>

      <section ref={sectionRef} className="relative w-full overflow-hidden bg-[#080807]">
        <div className="relative h-[480px] sm:h-[560px] md:h-[660px] lg:h-[720px]">

          {/* Real Ahmedabad Map */}
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=72.4800%2C22.9500%2C72.7200%2C23.1400&layer=mapnik"
            className="absolute inset-0 w-full h-full border-0 pointer-events-none"
            style={{ filter: "brightness(0.26) saturate(0.35) contrast(1.15) sepia(0.08)" }}
            loading="lazy"
            title="Ahmedabad city map"
          />

          {/* Project Pins — desktop */}
          <div className="absolute inset-0 hidden sm:block" style={{ zIndex: 4 }}>
            {MAP_PROJECTS.map((project, i) => (
              <ProjectPin key={project.id} project={project} index={i} />
            ))}
          </div>

          {/* Project Pins — mobile (dots only) */}
          <div className="absolute inset-0 block sm:hidden" style={{ zIndex: 4 }}>
            {MAP_PROJECTS.map((project, i) => {
              const pos = toPercent(project.lon, project.lat);
              return (
                <motion.div
                  key={project.id}
                  className="absolute"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.07, duration: 0.4 }}
                >
                  <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: "#E4572E", boxShadow: "0 0 8px rgba(228,87,46,0.9)", animation: `dotGlow 2.2s ease-in-out infinite ${i * 0.12}s` }} />
                </motion.div>
              );
            })}
          </div>

          {/* Center Content */}
          <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4"
          
        >
          <h2 className="text-white font-Semibold leading-[1.1] text-[28px] sm:text-[42px] md:text-[56px] lg:text-[68px] max-w-[280px] sm:max-w-2xl md:max-w-4xl">
            Explore Nearby Homes
          </h2>
          <p className="text-white/60 text-[13px] sm:text-base md:text-lg leading-relaxed mt-4 mb-7 max-w-[260px] sm:max-w-lg">
            Browse available homes near you and explore listings in your
            favorite areas.
          </p>
          <Link href="/contact">
            <button
              className="pointer-events-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-white text-gray-900 font-bold text-sm sm:text-base rounded-full transition-all duration-300 hover:bg-gray-100 hover:-translate-y-1 active:scale-95"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}
            >
              Get Started
            </button>
          </Link>
        </div>
        </div>
      </section>
    </>
  );
}

// ── ScrollReveal wrapper ──────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const translate = direction === "up" ? (vis ? "translateY(0)" : "translateY(40px)")
    : direction === "down" ? (vis ? "translateY(0)" : "translateY(-40px)")
    : direction === "left" ? (vis ? "translateX(0)" : "translateX(-40px)")
    : direction === "right" ? (vis ? "translateX(0)" : "translateX(40px)")
    : "none";

  return (
    <div ref={ref} className={className} style={{ opacity: vis ? 1 : 0, transform: translate, transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s` }}>
      {children}
    </div>
  );
}

// ── ProcessStep — extracted to fix hooks-in-loops error ───────────
function ProcessStep({ item, index }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(30px)", transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s` }}
      className="relative z-10 flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 hover:border-[#E34A2F] flex items-center justify-center mb-5 shadow-sm transition-colors duration-300">
        <span className="text-2xl font-semibold text-[#E34A2F]">{item.step}</span>
      </div>
      <h3 className="text-gray-900 font-bold text-base mb-2">{item.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
    </div>
  );
}

const processSteps = [
  { step: "01", title: "Site Acquisition",  desc: "Identifying prime locations with strong growth potential and community value." },
  { step: "02", title: "Design & Planning", desc: "Collaborating with architects to create timeless, functional living spaces." },
  { step: "03", title: "Construction",      desc: "Using premium materials and rigorous quality checks at every stage." },
  { step: "04", title: "Handover",          desc: "Delivering your dream home on time, with full transparency and care." },
];

// ── Main Project List Page ────────────────────────────────────────
export default function Project() {
  const [loaded, setLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeType, setActiveType] = useState("All Types");
  const [activePrice, setActivePrice] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);
  const [statsRef] = useInView(0.2);
  const scrollProgress = useScrollProgress();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: "smooth" }); };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = projects.filter((p) => {
    const statusMatch = activeFilter === "All" || p.status === activeFilter;
    const typeMatch = activeType === "All Types" || p.category === activeType;
    let priceMatch = true;
    if (activePrice === "Under ₹50L") priceMatch = p.priceValue < 5000000;
    else if (activePrice === "₹50L - ₹1Cr") priceMatch = p.priceValue >= 5000000 && p.priceValue <= 10000000;
    else if (activePrice === "₹1Cr - ₹2Cr") priceMatch = p.priceValue > 10000000 && p.priceValue <= 20000000;
    else if (activePrice === "Above ₹2Cr") priceMatch = p.priceValue > 20000000;
    return statusMatch && typeMatch && priceMatch;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { overflow-x: hidden; width: 100%; }
        section, div { min-width: 0; }
        img, video { max-width: 100%; }
        @keyframes scrollTopReveal {
          from { opacity: 0; transform: translateY(16px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scrollTopBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        .scroll-top-btn { animation: scrollTopReveal 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .scroll-top-btn:hover .scroll-top-arrow { animation: scrollTopBounce 0.6s ease infinite; }
        .scroll-progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, #E34A2F, #ffb347); z-index: 9999; transition: width 0.1s linear; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #FDFAF6; }
        ::-webkit-scrollbar-thumb { background: #E34A2F; border-radius: 3px; }
      `}</style>

      <div className="scroll-progress-bar" style={{ width: `${scrollProgress * 100}%` }} />

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="scroll-top-btn fixed bottom-6 right-4 z-[9000] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E34A2F] flex items-center justify-center shadow-lg hover:bg-[#c73b22] transition-colors duration-200 cursor-pointer"
          style={{ boxShadow: "0 4px 20px rgba(227,74,47,0.4)" }}
          aria-label="Scroll to top"
        >
          <span className="scroll-top-arrow flex items-center justify-center text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
          </span>
        </button>
      )}

      {/* Hero */}
      <section className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
        <Navbar />
        <div
          className={`absolute inset-0 bg-cover bg-top transition-transform duration-[14000ms] ease-out ${loaded ? "scale-100" : "scale-110"}`}
          style={{ backgroundImage: `url(${heroimg})`, filter: "brightness(0.40) saturate(0.7)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />
        <nav className="relative z-10 flex items-center gap-2.5 text-xs font-light tracking-[0.22em] uppercase mb-6" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(28px)", transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.3s" }}>
          <a href="/" className="text-white/55 hover:text-white transition-colors">Home</a>
          <span className="text-white/35 text-[10px]">›</span>
          <span className="text-white/90">Projects</span>
        </nav>
        <h1 className="relative z-10 text-center font-light tracking-[0.14em] uppercase text-white leading-none" style={{ fontSize: "clamp(42px, 6vw, 92px)", opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(28px)", transition: "all 1s cubic-bezier(.22,1,.36,1) 0.15s" }}>
          Our Projects
        </h1>
        <p className="relative z-10 text-white/60 text-base font-light mt-5 max-w-md text-center px-4" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)", transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.5s" }}>
          Crafting homes that inspire. Spaces that endure.
        </p>
        <div className="relative z-10 h-px bg-white/40 mt-6" style={{ width: loaded ? "80px" : "0px", transition: "width 1s cubic-bezier(.22,1,.36,1) 0.7s" }} />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: loaded ? 1 : 0, transition: "opacity 1s ease 1.5s" }}>
          <span className="text-white/40 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/30 animate-pulse" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-950 py-10 sm:py-10 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div ref={statsRef} className="w-full grid grid-cols-2 sm:grid-cols-4 gap-10">
          {stats.map((s, i) => <StatCard key={i} stat={s} index={i} />)}
        </div>
      </section>

      {/* Projects Section */}
      <section className="bg-[#F8F7F4] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-6">
            <Reveal direction="left">
              <div>
                <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">Portfolio</span>
                <h2 className="text-gray-900 font-semibold text-4xl sm:text-5xl leading-[1.1] tracking-tight">
                  Discover our<br /><span className="text-[#E34A2F]">signature</span> projects
                </h2>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                From concept to completion, every project reflects our commitment to quality, design, and livability.
              </p>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.05}>
            <div className="flex flex-col gap-4 mb-12">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => (
                    <button key={f} onClick={() => setActiveFilter(f)} className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${activeFilter === f ? "bg-[#E34A2F] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"}`}>{f}</button>
                  ))}
                </div>
                <div className="hidden lg:block w-px h-10 bg-gray-200" />
                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((f) => (
                    <button key={f} onClick={() => setActiveType(f)} className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${activeType === f ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-500">Price Range:</span>
                {priceFilters.map((price) => (
                  <button key={price} onClick={() => setActivePrice(price)} className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${activePrice === price ? "bg-[#1a2332] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"}`}>{price}</button>
                ))}
              </div>
            </div>
          </Reveal>

          <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">Showing {filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>

          <div className="flex flex-col gap-6">
            {filtered.length > 0
              ? filtered.map((project, i) => <ProjectCard key={project.id} project={project} index={i} onSelect={setSelectedProject} />)
              : <div className="text-center py-24 text-gray-400"><p className="text-lg">No projects match the selected filters.</p></div>
            }
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-white py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="w-full">
          <Reveal direction="up">
            <div className="text-center mb-16">
              <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">How We Work</span>
              <h2 className="text-gray-900 font-semibold text-4xl sm:text-5xl leading-tight">Our development process</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
            <div className="hidden sm:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gray-200 z-0" />
            {processSteps.map((item, i) => <ProcessStep key={i} item={item} index={i} />)}
          </div>
        </div>
      </section>

      {/* Explore Map Section */}
      <ExploreMapSection />

      <Footer />
    </>
  );
}