import { useEffect, useState, useRef } from "react";
import heroimg from "../../public/about_img.jpg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

// ── Data ──────────────────────────────────────────────────────────

const teamMembers = [
  {
    name: "Rajiv Mehta",
    role: "Founder & Chairman",
    bio: "A visionary leader with over 25 years in real estate development, Rajiv has steered the company from a boutique firm to a nationally recognised brand.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    tag: "Leadership",
  },
  {
    name: "Priya Sharma",
    role: "Chief Design Officer",
    bio: "With a Masters from the Architectural Association, Priya brings a global design sensibility to every project — balancing beauty, function, and sustainability.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    tag: "Design",
  },
  {
    name: "Anil Kapoor",
    role: "Head of Construction",
    bio: "A civil engineer by training, Anil's obsession with precision and quality control has made our construction process one of the most trusted in the industry.",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80",
    tag: "Engineering",
  },
  {
    name: "Sneha Patel",
    role: "Director of Sales & CX",
    bio: "Sneha has helped over 8,000 families find their dream homes, championing a customer-first philosophy that defines our brand promise.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80",
    tag: "Customer Experience",
  },
];

const milestones = [
  {
    year: "2009",
    title: "Founded",
    desc: "Started with a single residential project in Surat with a vision to redefine quality housing.",
  },
  {
    year: "2013",
    title: "100 Families",
    desc: "Crossed the landmark of 100 happy families across Gujarat within 4 years of operations.",
  },
  {
    year: "2017",
    title: "Pan-India Expansion",
    desc: "Expanded operations to Hyderabad, Mumbai, and Pune, establishing a national footprint.",
  },
  {
    year: "2020",
    title: "Smart Homes",
    desc: "Pioneered smart home integration across all new projects, setting a new industry benchmark.",
  },
  {
    year: "2024",
    title: "8,500+ Families",
    desc: "Today we proudly serve over 8,500 families across 12 cities with 120+ delivered projects.",
  },
];

const features = [
  {
    id: 1,
    tag: "01 — Showcase",
    title: "Interactive Property Showcase",
    description:
      "Experience properties through cinematic visuals, immersive layouts, and real-time exploration tools tailored for modern buyers.",
    bullets: [
      "360° property viewing",
      "Real-time walkthroughs",
      "Interactive floor plans",
      "High-quality visual rendering",
    ],
    image:
      "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=900&q=85",
    imageAlt: "Luxury villa aerial view",
    type: "hero",
  },
  {
    id: 2,
    tag: "02 — Explore",
    title: "Virtual Site Tours",
    description:
      "Explore residential spaces remotely with realistic virtual walkthroughs and smart navigation systems.",
    bullets: [
      "HD virtual tours",
      "Smart room navigation",
      "Mobile-friendly viewing",
    ],
    image:
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80",
    imageAlt: "Luxury interior top view",
    type: "mid",
  },
  {
    id: 3,
    tag: "03 — Documents",
    title: "Digital Brochure System",
    description:
      "Provide downloadable brochures, floor plans, pricing details, and property specifications instantly.",
    bullets: [
      "Premium PDF brochures",
      "Downloadable floor plans",
      "Interactive property documents",
      "High-resolution layout previews",
      "Instant client sharing access",
    ],
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=300&q=80",
    imageAlt: "Floor plan document",
    docs: ["Brochure.pdf", "FloorPlan.pdf"],
    type: "wide",
  },
];

const stats = [
  {
    id: 1,
    value: "85%",
    heading: "buyers explore properties online first",
    description:
      "Modern clients prefer immersive digital property experiences before visiting sites physically.",
    source: "Real Estate Trends",
  },
  {
    id: 2,
    value: "60%",
    heading: "higher engagement through virtual walkthroughs",
    description:
      "Interactive property showcases improve client interest and increase conversion opportunities.",
    source: "Property Insights",
  },
  {
    id: 3,
    value: "72%",
    heading: "faster decisions with smart property visualization",
    description:
      "High-quality visuals and floor plans help buyers make quicker investment decisions.",
    source: "Luxury Housing Report",
  },
];

const projects = [
  {
    id: 2,
    tags: ["Villas", "Premium", "Nature"],
    title: "Palm Grove Villas",
    description:
      "Exclusive private villas designed with elegant architecture, expansive landscapes, and a profound sense of tranquil seclusion.",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85",
    imageAlt: "Palm Grove Villas site showcase",
  },
  {
    id: 3,
    tags: ["Commercial", "Mixed Use", "Investment"],
    title: "Urban Heights",
    description:
      "A futuristic mixed-use development seamlessly combining business, retail, and premium residential experiences in the heart of the city.",
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=85",
    imageAlt: "Urban Heights commercial project",
  },
  {
    id: 4,
    tags: ["Family Living", "Community", "Luxury"],
    title: "Sapphire Homes",
    description:
      "Contemporary homes crafted for modern families — featuring green spaces, elegant layouts, and fully integrated smart home technology.",
    image:
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=900&q=85",
    imageAlt: "Sapphire Homes residential community",
  },
];

const testimonials = [
  {
    id: 1,
    name: "Arjun Desai",
    role: "Homeowner, Palm Grove Villas",
    location: "Ahmedabad",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    rating: 5,
    text: "Moving into our Palm Grove Villa was the best decision our family ever made. The craftsmanship is exceptional — every corner speaks of thoughtfulness. The team was transparent from day one, and handover was seamless. We finally feel truly home.",
  },
  {
    id: 2,
    name: "Meera Joshi",
    role: "Investor, Urban Heights",
    location: "Mumbai",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80",
    rating: 5,
    text: "I've invested in several properties over the years, but nothing matches the professionalism here. Urban Heights delivered 18 months ahead of my expected timeline, with ROI already exceeding projections. Truly a world-class team.",
  },
  {
    id: 3,
    name: "Rohit & Kavya Nair",
    role: "Residents, Sapphire Homes",
    location: "Pune",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    rating: 5,
    text: "We were first-time buyers, nervous about every step. Sneha and the CX team held our hands through the entire process. The smart home features in our unit are remarkable. Our children absolutely love the community parks.",
  },
  {
    id: 4,
    name: "Suresh Iyer",
    role: "NRI Buyer",
    location: "Dubai → Surat",
    image:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80",
    rating: 5,
    text: "Buying from abroad is always stressful — but the virtual walkthroughs, digital documents, and real-time updates made it feel like I was right there. The team's integrity gave me full confidence. My parents are now settled in their dream home.",
  },
  {
    id: 5,
    name: "Lakshmi Prabhu",
    role: "Business Owner",
    location: "Hyderabad",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    rating: 5,
    text: "The attention to detail in their luxury finishing is unmatched in this price band. I've recommended three friends already, all of whom are now proud homeowners. If you want quality you can feel, this is the only name to trust.",
  },
];

// ── Hooks ─────────────────────────────────────────────────────────

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

function useParallax(speed = 0.3) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setOffset(center * speed);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);
  return [ref, offset];
}

// ── Reveal wrapper ────────────────────────────────────────────────

function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVis(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const translate =
    direction === "up"
      ? vis
        ? "translateY(0)"
        : "translateY(32px)"
      : direction === "down"
        ? vis
          ? "translateY(0)"
          : "translateY(-32px)"
        : direction === "left"
          ? vis
            ? "translateX(0)"
            : "translateX(-32px)"
          : direction === "right"
            ? vis
              ? "translateX(0)"
              : "translateX(32px)"
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

// ── TeamCard ──────────────────────────────────────────────────────

function TeamCard({ member, index }) {
  const [ref, inView] = useInView();
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden cursor-pointer"
      style={{
        /* Responsive height: taller on mobile so portrait photos show well */
        height: "clamp(320px, 55vw, 460px)",
        borderRadius: "20px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        transition: hovered
          ? `box-shadow 0.4s ease, transform 0.12s ease`
          : `opacity 0.75s ease ${index * 0.12}s, transform 0.75s ease ${index * 0.12}s, box-shadow 0.4s ease`,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
    >
      <img
        src={member.image}
        alt={member.name}
        className="absolute inset-0 w-full h-full object-cover object-top"
        style={{
          transform: hovered ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: hovered
            ? "linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.82) 48%, rgba(8,8,8,0.2) 72%, transparent 100%)"
            : "linear-gradient(to top, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.1) 42%, transparent 62%)",
          transition: "background 0.55s ease",
        }}
      />
      <div className="absolute top-4 right-4 z-10">
        <span
          className="text-[10px] font-semibold tracking-[0.16em] uppercase"
          style={{
            color: "rgba(255,255,255,0.75)",
            background: "rgba(0,0,0,0.32)",
            backdropFilter: "blur(8px)",
            border: "0.5px solid rgba(255,255,255,0.2)",
            padding: "5px 10px",
            borderRadius: "999px",
          }}
        >
          {member.tag}
        </span>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-4 sm:px-7 sm:pb-7"
        style={{
          transform: hovered ? "translateY(0)" : "translateY(4px)",
          transition: "transform 0.45s ease",
        }}
      >
        <div
          style={{
            maxHeight: hovered ? "120px" : "0px",
            opacity: hovered ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.55s ease, opacity 0.4s ease 0.1s",
          }}
        >
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "rgba(255,255,255,0.62)" }}
          >
            {member.bio}
          </p>
        </div>
        <h3
          className="text-white font-bold leading-snug mb-1"
          style={{ fontSize: "clamp(16px, 4vw, 21px)" }}
        >
          {member.name}
        </h3>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "#E34A2F" }}
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
              <path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span
            className="text-sm truncate"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {member.role}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function Tag({ text }) {
  return (
    <span className="inline-block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#C04A24] mb-3 font-sans">
      {text}
    </span>
  );
}
function CardTitle({ children, large = false }) {
  return (
    <h3
      className={`text-stone-800 leading-snug tracking-tight mb-2 ${large ? "text-[20px] sm:text-[24px]" : "text-[16px] sm:text-[20px]"}`}
    >
      {children}
    </h3>
  );
}
function CardDesc({ children }) {
  return (
    <p className="text-[13px] text-stone-500 leading-relaxed mb-4">
      {children}
    </p>
  );
}
function BulletList({ items }) {
  return (
    <ul className="space-y-[7px]">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-center gap-2.5 text-[12px] text-stone-500 font-sans"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E4572E] flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
function AccentLine() {
  return <div className="w-7 h-px bg-[#E4572E] opacity-60 mb-4" />;
}

// ── Feature Cards ─────────────────────────────────────────────────

function HeroCard({ feature }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div /* col-span-2 on desktop grid, full-width on mobile */
      className="col-span-1 sm:col-span-2 rounded-[22px] overflow-hidden border border-stone-200 bg-white flex flex-col sm:flex-row"
      style={{
        boxShadow: hovered
          ? "0 20px 56px rgba(228,87,46,0.12), 0 4px 16px rgba(0,0,0,0.06)"
          : "0 4px 24px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.4s ease",
      }}
    >
      <div
        className="relative w-full sm:w-[52%] h-52 sm:h-auto overflow-hidden flex-shrink-0"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={feature.image}
          alt={feature.imageAlt}
          className="w-full h-full object-cover transition-transform duration-700"
          style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900/40 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg">
          <p className="text-[11px] text-stone-400 font-sans uppercase tracking-widest mb-0.5">
            Starting from
          </p>
          <p className="text-[17px] text-stone-800 tracking-tight">₹ 2.4 Cr</p>
        </div>
      </div>
      <div className="flex flex-col justify-between p-6 sm:p-8 flex-1 bg-[#FDFCFB]">
        <div>
          <AccentLine />
          <Tag text={feature.tag} />
          <CardTitle large>{feature.title}</CardTitle>
          <CardDesc>{feature.description}</CardDesc>
        </div>
        <div>
          <BulletList items={feature.bullets} />
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-3">
            <button className="px-5 py-2.5 rounded-full bg-[#E4572E] text-white text-[12px] font-semibold font-sans tracking-wide hover:bg-[#C94924] transition-colors duration-200">
              Explore Now
            </button>
            <button className="text-[12px] font-sans text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2">
              View all properties
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VirtualToursCard({ feature }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-[22px] overflow-hidden border border-stone-200 bg-white flex flex-col"
      style={{
        boxShadow: hovered
          ? "0 20px 56px rgba(228,87,46,0.1), 0 4px 16px rgba(0,0,0,0.05)"
          : "0 4px 20px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.4s ease",
      }}
    >
      <div
        className="p-5 sm:p-6 pb-4"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AccentLine />
        <Tag text={feature.tag} />
        <CardTitle>{feature.title}</CardTitle>
        <CardDesc>{feature.description}</CardDesc>
        <BulletList items={feature.bullets} />
      </div>
      <div
        className="mx-4 mb-4 rounded-[14px] overflow-hidden relative"
        style={{ height: "clamp(120px, 22vw, 160px)" }}
      >
        <img
          src={feature.image}
          alt={feature.imageAlt}
          className="w-full h-full object-cover transition-transform duration-700"
          style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E4572E] animate-pulse" />
          <span className="text-[10px] font-sans text-white/80 tracking-widest uppercase">
            Live preview
          </span>
        </div>
      </div>
    </div>
  );
}

function BrochureCard({ feature }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-[22px] overflow-hidden border border-stone-200 bg-white"
      style={{
        boxShadow: hovered
          ? "0 20px 56px rgba(228,87,46,0.1), 0 4px 16px rgba(0,0,0,0.05)"
          : "0 4px 20px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.4s ease",
      }}
    >
      <div
        className="p-5 sm:p-7"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex-1 min-w-0">
            <AccentLine />
            <Tag text={feature.tag} />
            <CardTitle>{feature.title}</CardTitle>
            <CardDesc>{feature.description}</CardDesc>
            <BulletList items={feature.bullets} />
          </div>
          {/* Hide thumbnail on very small screens, show on sm+ */}
          <div className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-[12px] overflow-hidden border border-stone-100 relative hidden xs:block">
            <img
              src={feature.image}
              alt={feature.imageAlt}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.85)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-800/60 to-transparent" />
            <div className="absolute bottom-2 left-2 text-[8px] font-sans text-white/70 uppercase tracking-widest">
              Floor plan
            </div>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-stone-100 flex gap-3 flex-wrap">
          {feature.docs.map((doc) => (
            <div
              key={doc}
              className="flex items-center gap-2 bg-[#F8F6F3] border border-stone-100 rounded-[10px] px-3 py-2"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-[#E4572E] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span className="text-[11px] font-sans text-stone-500">
                {doc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────

function Timeline() {
  return (
    <div className="relative">
      <div
        className="absolute left-6 top-0 bottom-0 w-px hidden sm:block"
        style={{
          background:
            "linear-gradient(to bottom, transparent, #e5e7eb 10%, #e5e7eb 90%, transparent)",
        }}
      />
      <div className="flex flex-col gap-8 sm:gap-10">
        {milestones.map((m, i) => {
          const [ref, inView] = useInView();
          return (
            <div
              key={i}
              ref={ref}
              className="flex gap-4 sm:gap-8 items-start"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : "translateX(-32px)",
                transition: `opacity 0.65s ease ${i * 0.1}s, transform 0.65s ease ${i * 0.1}s`,
              }}
            >
              {/* Year circle — visible only on sm+ */}
              <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-[#E34A2F] items-center justify-center z-10 shadow-sm">
                <span className="text-xs font-black text-[#E34A2F] leading-none">
                  {m.year.slice(2)}
                </span>
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[#E34A2F] text-xs font-bold tracking-[0.2em] uppercase">
                    {m.year}
                  </span>
                  <div className="flex-1 h-px bg-gray-100 hidden sm:block" />
                </div>
                <h4 className="text-gray-900 font-bold text-sm sm:text-base mb-1">
                  {m.title}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {m.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────

function ProjectCard({ project, index }) {
  const [ref, inView] = useInView(0.08);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    setTilt({ x, y });
  };

  return (
    <div ref={ref}>
      <div
        className="relative flex flex-col lg:flex-row overflow-hidden rounded-[20px] w-full"
        style={{
          minHeight: "auto",
          borderColor: hovered ? "rgba(228,87,46,0.18)" : "#E7E5E4",
          boxShadow: hovered
            ? "0 20px 60px rgba(228,87,46,0.08), 0 6px 24px rgba(31,42,68,0.08)"
            : "0 4px 24px rgba(31,42,68,0.05)",
          transition: hovered
            ? "border-color 0.3s, box-shadow 0.3s, transform 0.12s ease"
            : "all 0.45s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setTilt({ x: 0, y: 0 });
        }}
      >
        {/* Text panel */}
        <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col justify-between p-5 sm:p-7 lg:p-8 relative z-10">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full border text-[9px] font-semibold tracking-[0.18em] uppercase transition-all duration-300"
                style={{
                  borderColor: hovered ? "rgba(228,87,46,0.22)" : "#E7E5E4",
                  color: hovered ? "#E4572E" : "#6B7280",
                  background: hovered ? "rgba(228,87,46,0.05)" : "#F8F7F4",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="py-5 lg:py-8">
            <h3
              className="font-medium leading-[1.05] tracking-tight mb-3 transition-colors duration-300"
              style={{
                fontSize: "clamp(22px, 5vw, 38px)",
                color: hovered ? "#E4572E" : "#1F2A44",
              }}
            >
              {project.title}
            </h3>
            <p
              className="text-[13px] leading-[1.8]"
              style={{ color: "#6B7280" }}
            >
              {project.description}
            </p>
          </div>
          <Link to="/projects">
            <button
              className="group inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] uppercase transition-colors duration-300 w-fit cursor-pointer"
              style={{ color: hovered ? "#E4572E" : "#1F2A44" }}
            >
              Explore Project
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </Link>
        </div>

        {/* Image panel */}
        <div
          className="flex-1 relative overflow-hidden flex items-end justify-end"
          style={{ minHeight: "200px" }}
        >
          <div className="absolute inset-y-0 left-0 w-10 lg:w-16 z-10 hidden lg:block" />
          <div className="relative z-20 px-3 sm:px-4 py-4 sm:py-5 w-full">
            <img
              src={project.image}
              alt={project.imageAlt}
              className="w-full object-cover rounded-[12px] sm:rounded-[16px]"
              style={{
                maxHeight: "360px",
                transform: hovered ? "scale(1.02)" : "scale(1)",
                transition: "all 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Testimonial Section ───────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: rating }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="w-4 h-4" fill="#E34A2F">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial, index }) {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  return (
    <div
      ref={ref}
      className="h-full"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${index * 0.1}s, transform 0.7s ease ${index * 0.1}s`,
      }}
    >
      <div
        className="relative bg-white rounded-[20px] p-5 sm:p-7 border border-stone-100 h-full"
        style={{
          boxShadow: hovered
            ? "0 24px 60px rgba(228,87,46,0.1), 0 4px 20px rgba(0,0,0,0.06)"
            : "0 4px 20px rgba(0,0,0,0.05)",
          transition: hovered
            ? "box-shadow 0.3s, transform 0.12s"
            : "box-shadow 0.4s, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setTilt({ x: 0, y: 0 });
        }}
      >
        {/* Quote icon */}
        <div className="absolute top-5 right-6 opacity-[0.06]">
          <svg viewBox="0 0 60 45" className="w-14 h-10" fill="#E34A2F">
            <path d="M0 45V27.273C0 10.606 10.303 2.576 30.909 0L33.636 4.545C24.242 6.667 19.394 11.97 18.182 20.455H27.273V45H0ZM32.727 45V27.273C32.727 10.606 43.03 2.576 63.636 0L66.364 4.545C56.97 6.667 52.121 11.97 50.909 20.455H60V45H32.727Z" />
          </svg>
        </div>

        <StarRating rating={testimonial.rating} />

        <p className="text-stone-600 text-[13px] sm:text-[14px] leading-relaxed mb-6 relative z-10">
          "{testimonial.text}"
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
          <div className="min-w-0 flex-1">
            <p className="text-stone-800 font-semibold text-[13px] leading-tight">
              {testimonial.name}
            </p>
            <p className="text-stone-400 text-[11px] truncate">
              {testimonial.role}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <svg
                viewBox="0 0 24 24"
                className="w-3 h-3 text-[#E34A2F]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="text-[10px] text-stone-400">
                {testimonial.location}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(227,74,47,0.08)" }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-[#E34A2F]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const [headRef, headInView] = useInView(0.2);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(
      () => setActiveIndex((i) => (i + 1) % testimonials.length),
      5000,
    );
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <section className="bg-[#F8F7F4] py-14 sm:py-24 px-4 sm:px-6 overflow-x-hidden overflow-y-visible relative">
      <div className="w-full">
        {/* Heading */}
        <div
          ref={headRef}
          className="text-center mb-10 sm:mb-16"
          style={{
            opacity: headInView ? 1 : 0,
            transform: headInView ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.9s ease, transform 0.9s ease",
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 sm:w-12 bg-[#E4572E]" />
            <span className="text-[10px] tracking-[0.28em] uppercase font-semibold text-[#C04A24]">
              Testimonials
            </span>
            <div className="h-px w-8 sm:w-12 bg-[#E4572E]" />
          </div>
          <h2
            className="text-stone-800 tracking-tight leading-[1.12] mb-4 sm:mb-5"
            style={{ fontSize: "clamp(26px, 5vw, 52px)" }}
          >
            Stories from our
            <br />
            <span className="text-[#E4572E]">happy families</span>
          </h2>
          <p className="text-[14px] sm:text-[15px] text-stone-500 leading-relaxed max-w-[480px] mx-auto px-4">
            Over 8,500 families trust us with their most important investment.
            Here's what some of them have to say.
          </p>
        </div>

        {/* Desktop Grid - 3 cols */}
        <div className="hidden lg:grid grid-cols-3 gap-5">
          {testimonials.slice(0, 3).map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>

        {/* Tablet Grid - 2 cols */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 gap-5">
          {testimonials.slice(0, 4).map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="sm:hidden overflow-hidden w-full max-w-full">
          <div className="overflow-hidden">
            <div
              className="flex w-full max-w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="w-full min-w-full max-w-full flex-shrink-0 px-1 overflow-hidden"
                >
                  <TestimonialCard testimonial={t} index={0} />
                </div>
              ))}
            </div>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveIndex(i);
                  setAutoPlay(false);
                }}
                className="transition-all duration-300"
                style={{
                  width: i === activeIndex ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "999px",
                  background: i === activeIndex ? "#E34A2F" : "#D1CEC8",
                }}
              />
            ))}
          </div>
        </div>

        {/* Extra testimonials row for desktop */}
        <div className="hidden lg:grid grid-cols-2 gap-5 mt-5">
          {testimonials.slice(3, 5).map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i + 3} />
          ))}
        </div>

        {/* Trust badge */}
        <Reveal direction="up" delay={0.2}>
          <div className="mt-10 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {[
              { val: "8,500+", label: "Happy Families" },
              { val: "4.9/5", label: "Average Rating" },
              { val: "98%", label: "Would Recommend" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-semibold text-[#E34A2F]">
                  {item.val}
                </p>
                <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Main About Page ───────────────────────────────────────────────

export default function About() {
  const [loaded, setLoaded] = useState(false);
  const [sectionRef, inView] = useInView(0.1);
  const [headingRef, headingInView] = useInView(0.15);
  const [btnRef, btnInView] = useInView(0.2);
  const [btnHovered, setBtnHovered] = useState(false);
  const [heroParallaxRef, heroOffset] = useParallax(0.25);
  const [hero, card2, card3] = features;
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

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

html,
body,
#root {
  overflow-x: hidden;
  width: 100%;
}

body {
  position: relative;
}

/* Removed global resets that were affecting Navbar logo size */

section,
div {
  min-width: 0;
  max-width: 100%;
}
  

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

      {/* ── HERO ── */}
      <section
        className="relative w-full overflow-hidden bg-black flex flex-col items-center justify-center"
        style={{ minHeight: "100svh" }}
      >
        <Navbar />
        <div
          ref={heroParallaxRef}
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundImage: `url(${heroimg})`,
            filter: "brightness(0.40) saturate(0.7)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />

        <nav
          className="relative z-10 flex items-center gap-2.5 text-xs font-light tracking-[0.22em] uppercase mb-5 sm:mb-6"
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
          <span className="text-white/35 text-[10px]">›</span>
          <span className="text-white/90">About Us</span>
        </nav>

        <h1
          className="relative z-10 text-center font-light tracking-[0.14em] uppercase text-white leading-none px-4"
          style={{
            fontSize: "clamp(28px, 8vw, 65px)",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(28px)",
            transition: "all 1s cubic-bezier(.22,1,.36,1) 0.15s",
          }}
        >
          Real estate platform
        </h1>

        <p
          className="relative z-10 text-white/60 text-sm sm:text-base font-light mt-4 sm:mt-5 max-w-sm sm:max-w-md text-center px-6"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.5s",
          }}
        >
          Building trust, crafting homes, and creating communities since 2009.
        </p>

        <div
          className="relative z-10 h-px bg-white/40 mt-5 sm:mt-6"
          style={{
            width: loaded ? "80px" : "0px",
            transition: "width 1s cubic-bezier(.22,1,.36,1) 0.7s",
          }}
        />

        <div
          className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 1s ease 1.5s",
          }}
        >
          <span className="text-white/40 text-[10px] tracking-[0.3em] uppercase">
            Scroll
          </span>
          <div className="w-px h-6 sm:h-8 bg-white/30 animate-pulse" />
        </div>
      </section>

      {/* ── WHO WE ARE ── */}
      <section className="bg-[#F8F7F4] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
            <Reveal direction="left" className="flex-1 w-full">
              <div>
                <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
                  Our Story
                </span>
                <h2
                  className="text-gray-900 font-semibold leading-[1.1] tracking-tight mb-5 sm:mb-6"
                  style={{ fontSize: "clamp(28px, 5vw, 48px)" }}
                >
                  Who we
                  <br />
                  <span className="text-[#E34A2F]">truly</span> are
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
                  Founded in 2009 in Surat, Gujarat, we began with a single
                  belief — that every family deserves a home built with honesty,
                  craft, and care. What started as a small team of passionate
                  builders has grown into one of India's most trusted real
                  estate brands.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Today, across 12 cities and 120+ delivered projects, our
                  purpose remains unchanged: to create homes that families are
                  proud to live in for generations. Every wall we raise, every
                  finish we choose, every deadline we meet — it's all in service
                  of the families who trust us with their most important
                  investment.
                </p>
              </div>
            </Reveal>

            <Reveal direction="right" delay={0.1} className="flex-1 w-full">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                  alt="Our team at work"
                  className="w-full rounded-2xl object-cover"
                  style={{ height: "clamp(240px, 45vw, 380px)" }}
                />
                {/* Desktop floating badges */}
                <div
                  className="absolute -bottom-4 sm:-bottom-6 -left-3 sm:-left-6 bg-white rounded-2xl px-4 sm:px-6 py-3 sm:py-4 hidden sm:block"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                >
                  <p className="text-2xl sm:text-3xl font-black text-[#E34A2F]">
                    15+
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                    Years of Trust
                  </p>
                </div>
                <div
                  className="absolute -top-4 sm:-top-6 -right-3 sm:-right-6 bg-[#E34A2F] rounded-2xl px-4 sm:px-6 py-3 sm:py-4 hidden sm:block"
                  style={{ boxShadow: "0 8px 32px rgba(227,74,47,0.35)" }}
                >
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    12
                  </p>
                  <p className="text-xs text-white/80 uppercase tracking-widest font-medium">
                    Cities
                  </p>
                </div>
                {/* Mobile stats strip */}
                <div className="flex sm:hidden gap-4 mt-4">
                  <div
                    className="flex-1 bg-white rounded-xl px-4 py-3 text-center"
                    style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                  >
                    <p className="text-2xl font-black text-[#E34A2F]">15+</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Years
                    </p>
                  </div>
                  <div
                    className="flex-1 bg-[#E34A2F] rounded-xl px-4 py-3 text-center"
                    style={{ boxShadow: "0 4px 16px rgba(227,74,47,0.25)" }}
                  >
                    <p className="text-2xl font-black text-white">12</p>
                    <p className="text-[10px] text-white/80 uppercase tracking-widest">
                      Cities
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ── */}
      <section className="bg-[#F5F3EF] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="w-full text-center mb-8 sm:mb-14">
          <span className="inline-block text-[10px] tracking-[0.28em] uppercase font-semibold text-[#C04A24] mb-4">
            Platform Features
          </span>
          <h2
            className="text-stone-800 tracking-tight leading-[1.12] mb-4 sm:mb-5"
            style={{ fontSize: "clamp(26px, 5vw, 52px)" }}
          >
            Elevated Living
            <br />
            <span className="text-[#E4572E]">Experience</span>
          </h2>
          <p className="text-[14px] sm:text-[15px] text-stone-500 leading-relaxed max-w-[520px] mx-auto px-4">
            Discover immersive real estate technology designed to transform
            property exploration into a seamless digital journey.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5 sm:mt-6">
            <div className="h-px w-12 bg-stone-200" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#E4572E] opacity-60" />
            <div className="h-px w-12 bg-stone-200" />
          </div>
        </div>
        {/*
          Grid layout:
          - Mobile (< sm): single column, all cards stack
          - sm+: 2-column grid, HeroCard spans both columns
        */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <HeroCard feature={hero} />
          <VirtualToursCard feature={card2} />
          <BrochureCard feature={card3} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        ref={sectionRef}
        className="relative overflow-hidden bg-[#F8F7F4]"
      >
        <div
          className="absolute -top-10 right-0 w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(228,87,46,0.08) 0%, transparent 72%)",
          }}
        />
        <div className="relative w-full px-4 sm:px-8 lg:px-20 py-14 sm:py-24 lg:py-32">
          <div className="border-l border-[#E5E7EB] pl-4 sm:pl-8 lg:pl-16">
            <div
              className="w-full mb-5 sm:mb-8 transition-all duration-1000"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0px)" : "translateY(40px)",
              }}
            >
              <h2
                className="font-semibold tracking-tight leading-[1.08] text-[#1F2A44]"
                style={{ fontSize: "clamp(24px, 4.5vw, 64px)" }}
              >
                Transforming Modern
                <br />
                Real Estate
                <br />
                <span className="text-[#E4572E]">Experiences</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-[13px] sm:text-[14px] leading-relaxed text-[#6B7280] max-w-xl">
                Delivering immersive property discovery, elegant digital
                experiences, and smart real estate solutions for modern buyers
                and investors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#E5E7EB]">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="relative flex flex-col justify-between py-7 sm:py-8 sm:px-8 group"
                >
                  {/* Vertical divider on desktop */}
                  {i !== 0 && (
                    <div className="hidden sm:block absolute left-0 top-10 bottom-10 w-px bg-[#E5E7EB]" />
                  )}
                  {/* Horizontal divider on mobile */}
                  {i !== 0 && (
                    <div className="sm:hidden absolute top-0 left-0 right-0 h-px bg-[#E5E7EB]" />
                  )}
                  <div>
                    <div
                      className="font-light tracking-tight leading-none mb-4 transition-colors duration-300 group-hover:text-[#E4572E]"
                      style={{
                        fontSize: "clamp(36px, 6vw, 72px)",
                        color: "#1F2A44",
                      }}
                    >
                      {stat.value}
                    </div>
                    <h3 className="text-[#1F2A44] text-[14px] sm:text-[15px] font-medium leading-snug max-w-[240px] mb-3 transition-colors duration-300 group-hover:text-[#E4572E]">
                      {stat.heading}
                    </h3>
                    <p className="text-[#6B7280] text-[13px] leading-relaxed max-w-[260px]">
                      {stat.description}
                    </p>
                  </div>
                  <div className="pt-6 sm:pt-10">
                    <span className="italic text-[12px] sm:text-[13px] text-[#9CA3AF]">
                      {stat.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="bg-[#F8F7F4] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            <Reveal direction="left" className="lg:w-72 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
                  Our Journey
                </span>
                <h2
                  className="text-gray-900 font-semibold leading-[1.1] tracking-tight mb-4"
                  style={{ fontSize: "clamp(26px, 4vw, 48px)" }}
                >
                  15 years of
                  <br />
                  <span className="text-[#E34A2F]">milestones</span>
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  From a single project to a pan-India brand, every year has
                  been defined by growth, learning, and the families we've
                  served.
                </p>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.1} className="flex-1">
              <Timeline />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="bg-white py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-14 gap-5">
            <Reveal direction="left">
              <div>
                <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
                  The People
                </span>
                <h2
                  className="text-gray-900 font-semibold leading-[1.1] tracking-tight"
                  style={{ fontSize: "clamp(26px, 5vw, 48px)" }}
                >
                  Meet the
                  <br />
                  <span className="text-[#E34A2F]">team</span> behind it
                </h2>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <p className="text-gray-500 text-sm leading-relaxed sm:max-w-xs">
                A diverse group of architects, engineers, designers, and
                relationship builders — united by a single mission.
              </p>
            </Reveal>
          </div>
          {/* 1 col on mobile, 2 cols on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {teamMembers.map((member, i) => (
              <TeamCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── PROCESS ── */}
      <section className="bg-[#F8F7F4] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-hidden">
        <div className="w-full">
          <Reveal direction="up">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
                How We Work
              </span>
              <h2
                className="text-gray-900 font-semibold leading-tight"
                style={{ fontSize: "clamp(24px, 5vw, 48px)" }}
              >
                Our development process
              </h2>
            </div>
          </Reveal>
          {/* 2-col grid on mobile, 4-col on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6 relative">
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
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white border-2 border-gray-200 hover:border-[#E34A2F] flex items-center justify-center mb-3 sm:mb-5 shadow-sm transition-colors duration-300">
                    <span className="text-lg sm:text-2xl font-semibold text-[#E34A2F]">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-bold text-xs sm:text-base mb-1 sm:mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-[11px] sm:text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section className="relative overflow-hidden bg-[#F8F7F4] py-15 sm:py-20 px-4 sm:px-8 lg:px-16 xl:px-24">
        <div
          className="absolute -top-10 right-0 w-[400px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(228,87,46,0.05) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-5 left-0 w-[300px] h-[300px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(31,42,68,0.04) 0%, transparent 65%)",
          }}
        />
        <div className="relative w-full">
          <div
            ref={headingRef}
            className="text-center mb-8 sm:mb-14"
            style={{
              opacity: headingInView ? 1 : 0,
              transform: headingInView ? "translateY(0)" : "translateY(28px)",
              transition: "opacity 0.9s ease, transform 0.9s ease",
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-5">
              <div
                style={{ width: "24px", height: "1px", background: "#E4572E" }}
              />
              <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#C04A24]">
                Portfolio
              </span>
              <div
                style={{ width: "24px", height: "1px", background: "#E4572E" }}
              />
            </div>
            <h2
              className="text-[#1F2A44] leading-[1.1] tracking-tight mb-4"
              style={{ fontSize: "clamp(24px, 5vw, 52px)", fontWeight: 400 }}
            >
              Recent Projects
            </h2>
            <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-[460px] mx-auto px-4">
              Explore our latest luxury real estate developments crafted with
              modern architecture, immersive experiences, and premium living
              environments.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:gap-5">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
          <div
            ref={btnRef}
            className="mt-8 sm:mt-14 flex justify-center"
            style={{
              opacity: btnInView ? 1 : 0,
              transform: btnInView ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s",
            }}
          >
            <Link to="/projects" style={{ textDecoration: "none" }}>
              <button
                type="button"
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  fontWeight: 600,
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  padding: "13px 26px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  background: btnHovered ? "#E4572E" : "#1F2A44",
                  color: "white",
                  boxShadow: btnHovered
                    ? "0 12px 40px rgba(228,87,46,0.3)"
                    : "0 8px 28px rgba(31,42,68,0.18)",
                  transform: btnHovered ? "translateY(-2px)" : "translateY(0)",
                  transition: "all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
                }}
              >
                Explore More Projects
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: btnHovered ? "translateX(3px)" : "translateX(0)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    style={{ width: "13px", height: "13px" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes float-0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float-1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-18px); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }

        /* xs breakpoint helper — 480px */
        @media (min-width: 480px) {
          .xs\\:block { display: block; }
        }
      `}</style>
    </>
  );
}
