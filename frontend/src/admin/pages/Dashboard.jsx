import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import * as XLSX from "xlsx";
import logo from "../../../public/logo.png";
import logo1 from "../../../public/logo1.png";

import { auth } from "../../firebase";

import { getProjects } from "../../services/projectService";
import { getArticles } from "../../services/articleService";
import { getContacts } from "../../services/contactService";
import { getAllVendors } from "../../services/vendorService";

/* ─── useInView hook ─────────────────────────────────────────────── */
function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Animation wrappers ─────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.05);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function FadeInScale({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView(0.05);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "scale(1) translateY(0)"
          : "scale(0.94) translateY(16px)",
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated counter ───────────────────────────────────────────── */
function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    const num = Number(target);
    if (isNaN(num)) return;
    let start = null;
    const duration = 1400;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(num * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);
  return <span ref={ref}>{count}</span>;
}

/* ─── Stat card icons (inline SVG) ─────────────────────────────────── */
function IconBuilding() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconArticle() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
function IconContacts() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconVendor() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [articles, setArticles] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectData, articleData, contactData, vendorData] =
        await Promise.all([
          getProjects(),
          getArticles(),
          getContacts(),
          getAllVendors(),
        ]);
      setProjects(projectData);
      setArticles(articleData);
      setContacts(contactData);
      setVendors(vendorData);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const data = contacts.map((item) => ({
      FullName: item.fullName,
      Email: item.email,
      Phone: item.phone,
      DOB: item.dob,
      Subject: item.subject,
      Message: item.message,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, "contacts.xlsx");
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("admin");
    navigate("/");
  };

  const dashboardCards = [
    {
      title: "Projects",
      value: projects.length,
      bg: "bg-[#1F2A44]",
      icon: <IconBuilding />,
      label: "Total listed",
    },
    {
      title: "Articles",
      value: articles.length,
      bg: "bg-purple-600",
      icon: <IconArticle />,
      label: "Published",
    },
    {
      title: "Contacts",
      value: contacts.length,
      bg: "bg-emerald-600",
      icon: <IconContacts />,
      label: "Inquiries",
    },
    {
      title: "Vendors",
      value: vendors.length,
      bg: "bg-blue-500",
      icon: <IconVendor />,
      label: "Partners",
    },
  ];

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-[3px] border-[#E4572E]/20 border-t-[#E4572E]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-[#1F2A44] font-semibold text-sm tracking-wide">
          Loading dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-10 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center justify-center flex-shrink-0">
              <img
                src={logo}
                alt="logo"
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
              />
            </div>

            <div className="flex items-center justify-center flex-shrink-0">
              <img
                src={logo1}
                alt="logo text"
                className="h-8 w-12 sm:h-10 sm:w-14 md:h-11 md:w-16 lg:h-12 lg:w-20 object-contain"
              />
            </div>
          </div>

          {/* Desktop Nav Actions */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link to="/admin/add-project">
              <button
                className="inline-flex items-center gap-1.5 bg-[#E4572E] text-white
                                 px-4 py-2 rounded-full text-[12px] font-semibold tracking-wide
                                 hover:bg-[#c93d1e] hover:scale-[1.04] transition-all duration-200"
              >
                + Add Project
              </button>
            </Link>
            <Link to="/admin/add-article">
              <button
                className="inline-flex items-center gap-1.5 bg-purple-600 text-white
                                 px-4 py-2 rounded-full text-[12px] font-semibold tracking-wide
                                 hover:bg-purple-700 hover:scale-[1.04] transition-all duration-200"
              >
                + Add Article
              </button>
            </Link>
            <Link to="/admin/contacts">
              <button
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-[#1F2A44]
                                 px-4 py-2 rounded-full text-[12px] font-semibold
                                 hover:border-[#E4572E] hover:text-[#E4572E] transition-all duration-200"
              >
                Contacts
              </button>
            </Link>
            <Link to="/admin/vendors?tab=vendors">
              <button
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-[#1F2A44]
                                 px-4 py-2 rounded-full text-[12px] font-semibold
                                 hover:border-blue-500 hover:text-blue-500 transition-all duration-200"
              >
                Vendors
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-[#1F2A44] text-white
                         px-4 py-2 rounded-full text-[12px] font-semibold
                         hover:bg-[#2e3d5e] transition-all duration-200"
            >
              <IconLogout />
              Logout
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-2">
            <Link
              to="/admin/add-project"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button className="w-full text-left bg-[#E4572E] text-white px-4 py-3 rounded-xl text-sm font-semibold">
                + Add Project
              </button>
            </Link>
            <Link
              to="/admin/add-article"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button className="w-full text-left bg-purple-600 text-white px-4 py-3 rounded-xl text-sm font-semibold">
                + Add Article
              </button>
            </Link>
            <Link to="/admin/contacts" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full text-left border border-gray-200 text-[#1F2A44] px-4 py-3 rounded-xl text-sm font-semibold">
                Contacts
              </button>
            </Link>
            <Link
              to="/admin/vendors?tab=vendors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button className="w-full text-left border border-gray-200 text-[#1F2A44] px-4 py-3 rounded-xl text-sm font-semibold">
                Vendors
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left bg-[#1F2A44] text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <IconLogout /> Logout
            </button>
          </div>
        )}
      </header>

      {/* ── PAGE BODY ────────────────────────────────────────────── */}
      <main className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-12">
        {/* ── PAGE HEADER ── */}
        <FadeUp delay={0} className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{ width: "24px", height: "1px", background: "#E4572E" }}
            />
            <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#E4572E]">
              Admin
            </span>
            <div
              style={{ width: "24px", height: "1px", background: "#E4572E" }}
            />
          </div>
          <h1
            className="font-semibold text-[#1F2A44] leading-tight tracking-tight"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Manage Projects, Articles and Contacts
          </p>
        </FadeUp>

        {/* ── STATS CARDS ── */}
        <div
          className="grid gap-3 sm:gap-4 mb-10 sm:mb-14"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {dashboardCards.map((card, index) => (
            <FadeInScale key={index} delay={index * 70}>
              <div
                className={`${card.bg} rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white
                    hover:scale-[1.03] hover:shadow-xl transition-all duration-300
                    cursor-default relative overflow-hidden h-full`}
              >
                {/* Decorative circle */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="opacity-80">{card.icon}</span>
                </div>

                <p className="text-white/70 text-[10px] sm:text-[11px] font-semibold tracking-[1.5px] uppercase">
                  {card.title}
                </p>

                <h2
                  className="font-bold mt-1 leading-none"
                  style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
                >
                  <AnimatedCounter target={card.value} />
                </h2>

                <p className="text-white/50 text-[10px] mt-1">{card.label}</p>
              </div>
            </FadeInScale>
          ))}
        </div>

        {/* ── RECENT CONTACTS ── */}
        <FadeUp delay={0} className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Section header */}
            <div
              className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-100
                            flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <p className="text-[#E34A2F] text-[10px] font-bold tracking-[2.5px] uppercase mb-1">
                  Inquiries
                </p>
                <h2 className="font-semibold text-[#1F2A44] text-xl sm:text-2xl leading-tight">
                  Recent Contacts
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Latest contact requests
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/contacts">
                  <button
                    className="inline-flex items-center gap-1.5 border border-gray-200 text-[#1F2A44]
                                     px-4 py-2.5 rounded-full text-[12px] font-semibold
                                     hover:border-[#E34A2F] hover:text-[#E34A2F] transition-all duration-200"
                  >
                    View All
                    <IconArrow />
                  </button>
                </Link>
                <button
                  onClick={exportExcel}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white
                             px-4 py-2.5 rounded-full text-[12px] font-semibold
                             hover:bg-emerald-700 hover:scale-[1.03] transition-all duration-200"
                >
                  <IconDownload />
                  Download Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="bg-[#F8F7F4]">
                    <th className="px-5 sm:px-8 py-3.5 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-gray-400">
                      Name
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-gray-400">
                      Email
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-gray-400 hidden sm:table-cell">
                      Phone
                    </th>
                    <th className="px-4 sm:px-8 py-3.5 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-gray-400">
                      Subject
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 5).map((contact, i) => (
                    <tr
                      key={contact.id}
                      className="border-b border-gray-50 hover:bg-[#FDFAF6] transition-colors duration-150"
                      style={{
                        animation: `fadeRow 0.4s ease ${i * 60}ms both`,
                      }}
                    >
                      <td className="px-5 sm:px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#E34A2F] text-[10px] font-bold">
                              {contact.fullName?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="text-[#1F2A44] text-sm font-medium">
                            {contact.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-sm">
                        {contact.email}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-sm hidden sm:table-cell">
                        {contact.phone}
                      </td>
                      <td className="px-4 sm:px-8 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                         bg-[#FFF0EC] text-[#E34A2F] text-[10px] font-bold tracking-[1px] uppercase"
                        >
                          {contact.subject}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>

        {/* ── RECENT PROJECTS ── */}
        <FadeUp delay={80} className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <p className="text-[#E34A2F] text-[10px] font-bold tracking-[2.5px] uppercase mb-1">
                  Portfolio
                </p>
                <h2 className="font-semibold text-[#1F2A44] text-xl sm:text-2xl leading-tight">
                  Recent Projects
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Latest uploaded projects
                </p>
              </div>
              <Link to="/admin/projects">
                <button
                  className="inline-flex items-center gap-1.5 border border-gray-200 text-[#1F2A44]
                                   px-4 py-2.5 rounded-full text-[12px] font-semibold
                                   hover:border-[#E34A2F] hover:text-[#E34A2F] transition-all duration-200"
                >
                  View All
                  <IconArrow />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              {projects.slice(0, 4).map((project, i) => (
                <div
                  key={project.id}
                  className="group border border-gray-100 rounded-2xl overflow-hidden
                             hover:shadow-lg hover:border-[#E34A2F]/20 transition-all duration-300"
                  style={{ animation: `fadeRow 0.45s ease ${i * 80}ms both` }}
                >
                  <div className="relative overflow-hidden h-[160px] sm:h-[180px]">
                    <img
                      src={project.mainImage}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Type badge on image */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                       bg-white/90 backdrop-blur-sm text-[#E4572E]
                                       text-[10px] font-bold tracking-[1px] uppercase shadow-sm"
                      >
                        {project.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#1F2A44] text-[13px] leading-snug line-clamp-2 mb-2">
                      {project.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-[11px]">
                        {project.status}
                      </p>
                      <Link to="/admin/projects">
                        <span
                          className="w-6 h-6 rounded-full bg-[#FFF0EC] flex items-center justify-center
                                       text-[#E34A2F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <IconArrow />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* ── RECENT ARTICLES ── */}
        <FadeUp delay={140}>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <p className="text-[#E34A2F] text-[10px] font-bold tracking-[2.5px] uppercase mb-1">
                  Insights
                </p>
                <h2 className="font-semibold text-[#1F2A44] text-xl sm:text-2xl leading-tight">
                  Recent Articles
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Latest uploaded articles
                </p>
              </div>
              <Link to="/admin/articles">
                <button
                  className="inline-flex items-center gap-1.5 border border-gray-200 text-[#1F2A44]
                                   px-4 py-2.5 rounded-full text-[12px] font-semibold
                                   hover:border-purple-500 hover:text-purple-500 transition-all duration-200"
                >
                  View All
                  <IconArrow />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              {articles.slice(0, 4).map((article, i) => (
                <div
                  key={article.id}
                  className="group border border-gray-100 rounded-2xl overflow-hidden
                             hover:shadow-lg hover:border-purple-200 transition-all duration-300"
                  style={{ animation: `fadeRow 0.45s ease ${i * 80}ms both` }}
                >
                  <div className="relative overflow-hidden h-[160px] sm:h-[180px]">
                    <img
                      src={article.image}
                      alt={article.heading}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                       bg-white/90 backdrop-blur-sm text-purple-600
                                       text-[10px] font-bold tracking-[1px] uppercase shadow-sm"
                      >
                        {article.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#1F2A44] text-[13px] leading-snug line-clamp-2 mb-2">
                      {article.heading}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-[11px]">
                        {article.date}
                      </p>
                      <Link to="/admin/articles">
                      <span
                        className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center
                                       text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <IconArrow />
                      </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeRow {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
