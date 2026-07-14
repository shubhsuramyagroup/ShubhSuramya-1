import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import {
  contactPageSchema,
  localBusinessSchema,
  breadcrumbSchema,
  keywords as buildKeywords,
} from "../seo/siteConfig";
import { addContact } from "../services/contactService";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

// ── useInView hook ────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
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

// ── Toast notification ────────────────────────────────────────────
function Toast({ show, onClose }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "20px",
        zIndex: 99999,
        animation: "toastSlideIn 0.4s cubic-bezier(.34,1.56,.64,1) both",
        maxWidth: "calc(100vw - 40px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#fff",
          border: "1.5px solid #d1fae5",
          borderLeft: "4px solid #10b981",
          borderRadius: "14px",
          padding: "14px 18px",
          boxShadow:
            "0 8px 32px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          minWidth: "280px",
        }}
      >
        {/* Icon */}
        <span
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#ecfdf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#10b981">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </span>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "14px",
              color: "#065f46",
            }}
          >
            Message sent!
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
            We'll be in touch within one business day.
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            borderRadius: "6px",
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Office card ───────────────────────────────────────────────────
function OfficeCard({ city, address, phone, mapUrl, delay }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      }}
      className="flex items-start gap-4 group"
    >
      {/* Dot */}
      <div className="mt-1.5 w-3 h-3 rounded-full bg-[#E34A2F] flex-shrink-0 group-hover:scale-125 transition-transform duration-200" />
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-gray-900 font-bold text-base">{city}</h4>
          <span className="text-gray-300 font-light">–</span>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors"
          >
            MAP
          </a>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{address}</p>
        <p className="text-gray-500 text-sm">{phone}</p>
        <p className="text-gray-400 text-xs mt-0.5 italic">
          Visit us for in-person project
        </p>
      </div>
    </div>
  );
}

// ── Contact form ──────────────────────────────────────────────────
function ContactForm({ onSuccess }) {
  const [formRef, inView] = useInView(0.1);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !form.fullName ||
    !form.email ||
    !form.phone ||
    !form.dob ||
    !form.subject ||
    !form.message
  ) {
    alert("Please fill all required fields");
    return;
  }

  try {
    let formattedPhone = form.phone.trim();

    // Remove all extra +
    formattedPhone = formattedPhone.replace(/\+/g, "");

    // Add exactly one +
    formattedPhone = "+" + formattedPhone;

    await addContact({
      fullName: form.fullName,
      email: form.email,
      phone: formattedPhone,
      dob: new Date(form.dob),
      subject: form.subject,
      message: form.message,
      createdAt: new Date(),
    });

    onSuccess();

    setForm({
      fullName: "",
      email: "",
      phone: "",
      dob: "",
      subject: "",
      message: "",
    });

  } catch (err) {
    console.log(err);
  }
};

  return (
    <div
      ref={formRef}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(36px)",
        transition:
          "opacity 0.75s ease 0.1s, transform 0.75s ease 0.1s",
      }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 lg:p-10"
    >
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
        Send us a message
      </h3>

      <p className="text-gray-400 text-sm mb-8">
        We'll get back to you within one business day.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
              Full Name
            </label>

            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              placeholder="Arjun Mehta"
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="arjun@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Phone */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
              Phone Number
            </label>

            <PhoneInput
              country={"in"}
              enableSearch={true}
              value={form.phone}
              onChange={(phone) =>
                setForm({
                  ...form,
                  phone: "+" + phone,
                })
              }
              inputProps={{
                required: true,
                name: "phone",
              }}
            />
          </div>

          {/* DOB */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
              Date of Birth
            </label>

            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
          </div>

        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
            Subject
          </label>

          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            placeholder="Enter subject"
            className="w-full px-4 py-3 rounded-xl border border-gray-200"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
            Message
          </label>

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Tell us about your project..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-[#E34A2F] text-white font-bold rounded-xl"
        >
          Send Message →
        </button>

      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function Contact() {
  const [loaded, setLoaded] = useState(false);
  const [heroRef, heroInView] = useInView(0.1);
  const [officeRef, officeInView] = useInView(0.1);
  const scrollProgress = useScrollProgress();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
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

  const offices = [
    {
      city: "Sanand Gujarat",
      address: "Shubh Suramya Corporate House opp suramaya dreams Suramya Road, Near Eklingji Road, Sanand-382110",
      phone: "+91 96872 58222",
      mapUrl: "https://www.google.com/maps/place/Suramya+Dreams/@22.9920203,72.388455,17z/data=!3m1!4b1!4m6!3m5!1s0x395e99392581641f:0x6fa830106b7b4fa6!8m2!3d22.9920154!4d72.3910299!16s%2Fg%2F11vl4tjcqb?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D",
    },
  ];

  return (
    <>
      <Seo
        title="Contact Shubh Suramya | Real Estate in Ahmedabad, Gujarat"
        description="Contact Shubh Suramya for luxury residential & commercial properties in Ahmedabad, Gujarat. Call +91 96872 58222 or visit our Sanand corporate office."
        keywords={buildKeywords(["Contact Shubh Suramya", "Real Estate Office Ahmedabad"])}
        canonicalPath="/contact"
        jsonLd={[
          contactPageSchema(),
          localBusinessSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />

      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
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

        .hero-badge   { animation: badgePop 0.7s cubic-bezier(.34,1.56,.64,1) 0.4s both; }
        .hero-h1      { animation: heroContentIn 0.9s cubic-bezier(.22,1,.36,1) 0.65s both; }
        .hero-line    { animation: heroLineGrow 0.6s cubic-bezier(.22,1,.36,1) 1.1s both; }
        .hero-p       { animation: heroContentIn 0.8s cubic-bezier(.22,1,.36,1) 1.2s both; }

        .scroll-line { animation: scrollLineDrop 1.8s ease-in-out infinite; }
        .scroll-down-indicator { animation: heroFadeIn 0.8s ease 1.8s both; }

        .scroll-top-btn { animation: scrollTopReveal 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .scroll-top-btn:hover .scroll-top-arrow { animation: scrollTopBounce 0.6s ease infinite; }

        .blog-card { transition: transform 0.35s cubic-bezier(.22,1,.36,1); }
        .blog-card:hover { transform: translateY(-6px); }
        .blog-img { transition: transform 0.6s cubic-bezier(.22,1,.36,1); }
        .blog-card:hover .blog-img { transform: scale(1.07); }

        .process-card { transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease; }
        .process-card:hover { transform: translateY(-8px) perspective(600px) rotateX(3deg); box-shadow: 0 24px 48px rgba(0,0,0,0.1); }

        .hero-scroll-indicator { animation: scrollDrop 2s ease-in-out infinite 2s; }
        .floating-badge { animation: floatBadge 3s ease-in-out infinite; }
        .blob-bg { animation: morphBlob 8s ease-in-out infinite; }
        .float-3d { animation: float3D 6s ease-in-out infinite; }
        .stat-depth { animation: depthPulse 4s ease-in-out infinite; }
        .process-arrow { animation: processArrowPulse 1.6s ease-in-out infinite; }
        .ring-rotate { animation: rotateSlowly 18s linear infinite; }

        .perspective-container { perspective: 1200px; perspective-origin: center center; }
        .feature-card-3d { transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s ease, border-color 0.25s ease; }
        .stats-3d-reveal { transform-style: preserve-3d; }

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

        .project-card img { transition: transform 0.6s cubic-bezier(.22,1,.36,1); }

        @media (max-width: 640px) {
          .hero-content { padding-bottom: 80px !important; }
        }

        @media (hover: none) {
          .feature-card:hover { transform: none; }
          .stat-card:hover { transform: none; }
          .process-card:hover { transform: none; }
        }
      `}</style>

      {/* ── TOAST NOTIFICATION ── */}
      <Toast show={showToast} onClose={() => setShowToast(false)} />

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

      {/* ── HERO / CONNECT SECTION ── */}
      <section className="relative px-4 overflow-hidden w-full h-screen flex flex-col items-center justify-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')",
          }}
        />

        {/* Black Gradient Overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div
          ref={heroRef}
          className="relative z-10 max-w-2xl mx-auto text-center px-4"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
          }}
        >
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-xs font-light tracking-[0.22em] uppercase text-gray-300 mb-8">
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <span className="text-gray-400 text-[10px]">›</span>
            <span className="text-white">Contact</span>
          </nav>

          <h1 className="text-white font-Regular text-3xl sm:text-5xl md:text-6xl leading-tight mb-5">
            Let's <span className="text-[#E34A2F]">Connect</span> With Us
          </h1>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-10">
            Let's talk about your project or dream home. Send us a message and
            we will be in touch within one business day.
          </p>

          {/* Quick contact pills */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="tel:+918045678900"
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full px-5 sm:px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <span className="w-8 h-8 rounded-full bg-[#E34A2F] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.6.58 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.5 11.5 0 00.58 3.6 1 1 0 01-.25 1.02l-2.2 2.17z" />
                </svg>
              </span>
              <span className="text-gray-700 font-semibold text-sm">
                +91 96872 58222
              </span>
            </a>

            <a
              href="mailto:hello@realestate.com"
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full px-5 sm:px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <span className="w-8 h-8 rounded-full bg-[#E34A2F] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </span>
              <span className="text-gray-700 font-semibold text-sm">
                shubhsuramyagroup@gmail.com
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FORM + OFFICE SECTION ── */}
      <section className="bg-[#F8F7F4] py-12 sm:py-20 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
          {/* Left — Contact form */}
          <div className="h-full">
            <ContactForm onSuccess={() => setShowToast(true)} />
          </div>

          {/* Right — Office info */}
          <div className="h-full flex flex-col">
            {/* Header */}
            <div
              ref={officeRef}
              style={{
                opacity: officeInView ? 1 : 0,
                transform: officeInView ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.7s ease, transform 0.7s ease",
              }}
            >
              <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
                Our Offices
              </span>

              <h2 className="text-gray-900 font-semibold text-2xl sm:text-3xl lg:text-4xl mb-8 leading-tight">
                Some of our
                <br />
                office locations
              </h2>
            </div>

            {/* Office list */}
            <div className="space-y-7 mb-8">
              {offices.map((office, i) => (
                <OfficeCard key={i} {...office} delay={i * 0.12} />
              ))}
            </div>

            {/* Auto height image */}
            <div
              style={{
                opacity: officeInView ? 1 : 0,
                transform: officeInView ? "translateY(0)" : "translateY(24px)",
                transition:
                  "opacity 0.75s ease 0.35s, transform 0.75s ease 0.35s",
              }}
              className="relative rounded-2xl overflow-hidden shadow-lg flex-1 min-h-[180px]"
            >
              <img
                src="https://lh3.googleusercontent.com/gps-cs-s/APNQkAFIgP5aW6XIoyMa5JzGl96Tr-QoTc6Afzq8suAiRzUwt9NFs64kNc-EjsPcHtfbPVYRq94Mr3XYP0sEPRamdlEet5qLvHNa3A9feJsGM3SL3fxmnQFVFKyGRZQ-2SnUAQLOQ9dgFPXK84Ez=w408-h363-k-no"
                alt="Our office building"
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              <div className="absolute bottom-4 left-5 text-white">
                <p className="text-sm font-semibold">Sanand, Gujarat</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP SECTION ── */}
      <section className="bg-white py-12 sm:py-20 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24">
        <div className="w-full">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-[#E34A2F] text-xs font-bold tracking-[0.3em] uppercase mb-3 block">
              Find Us
            </span>
            <h2 className="text-gray-900 font-semibold text-2xl sm:text-3xl lg:text-4xl">
              Visit our offices on the map
            </h2>
            <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">
              Click any location marker to get directions and plan your visit.
            </p>
          </div>

          {/* Map tabs + embed */}
          <MapSection offices={offices} />
        </div>
      </section>

      <Footer />
    </>
  );
}

// ── Map Section with office switcher ─────────────────────────────
function MapSection({ offices }) {
  const [active, setActive] = useState(0);
  const [mapRef, inView] = useInView(0.1);

  const mapQueries = ["Eklingji+Road+Narmada+Vasahat+Sanand+Gujarat"];

  return (
    <div
      ref={mapRef}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      {/* Office switcher tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {offices.map((o, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              active === i
                ? "bg-[#E34A2F] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${active === i ? "bg-white" : "bg-[#E34A2F]"}`}
            />
            {o.city}
          </button>
        ))}
      </div>

      {/* Selected office info bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E34A2F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E34A2F]">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-900 font-bold text-sm">
              {offices[active].city}
            </p>
            <p className="text-gray-500 text-xs">{offices[active].address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-gray-500 text-xs">{offices[active].phone}</span>
          <a
            href={offices[active].mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#E34A2F] hover:bg-[#C13A20] px-4 py-2 rounded-full transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
            Get Directions
          </a>
        </div>
      </div>

      {/* Google Maps embed */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ height: "320px" }}
      >
        <iframe
          key={active}
          title={`Map of ${offices[active].city}`}
          src={`https://maps.google.com/maps?q=${mapQueries[active]}&z=15&output=embed`}
          width="100%"
          height="100%"
          style={{ border: 0, filter: "saturate(0.9) contrast(1.05)" }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
