import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../../public/logo.png";
import logo1 from "../../public/logo1.png";
import { FaWhatsapp } from "react-icons/fa";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "PROJECTS", path: "/projects" },
    { name: "ABOUT US", path: "/about" },
    { name: "CONTACT US", path: "/contact" },
  ];

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300 md:hidden ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 lg:px-8 pt-3 sm:pt-5">
        <nav
          className={`max-w-7xl mx-auto transition-all duration-500 rounded-2xl border backdrop-blur-xl ${
            scrolled
              ? "bg-white/92 border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
              : "bg-white/88 border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
          }`}
        >
          <div className="flex items-center justify-between h-[72px] sm:h-[78px] px-4 sm:px-6 lg:px-8">
            {/* LOGO */}
            <Link to="/" className="flex items-center pt-2 gap-2">
              {/* FIRST LOGO */}
              <div className="flex items-center justify-center">
                <img
                  src={logo}
                  alt="logo"
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
                />
              </div>

              {/* SECOND LOGO */}
              <div className="flex items-center justify-center">
                <img
                  src={logo1}
                  alt="logo text"
                  className="h-8 sm:h-10 md:h-11 w-auto object-contain"
                />
              </div>
            </Link>

            {/* DESKTOP NAV */}
            <ul className="hidden lg:flex items-center gap-8 xl:gap-10">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `relative text-[11px] xl:text-[12px] font-semibold tracking-[0.22em] uppercase transition-all duration-300 ${
                        isActive
                          ? "text-[#E34A2F]"
                          : "text-[#1F2937] hover:text-[#E34A2F]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <span className="relative">
                        {item.name}

                        <span
                          className={`absolute left-0 -bottom-2 h-px bg-[#E34A2F] transition-all duration-300 ${
                            isActive ? "w-full" : "w-0"
                          }`}
                        />
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">
              {/* CTA BUTTON */}
              <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#1E2A5A] hover:bg-[#25D366] text-white px-5 lg:px-6 py-2.5 text-[13px] font-semibold transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-[1px]">
                <FaWhatsapp className="text-[18px]" />
                <span className="hidden md:block">Inquire Now</span>
              </button>

              {/* MOBILE MENU BUTTON */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden relative w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center"
                aria-label="Toggle Menu"
              >
                <div className="relative w-5 h-5">
                  <span
                    className={`absolute left-0 w-5 h-[2px] bg-[#1E2A5A] rounded-full transition-all duration-300 ${
                      menuOpen ? "rotate-45 top-[9px]" : "top-[3px]"
                    }`}
                  />

                  <span
                    className={`absolute left-0 w-5 h-[2px] bg-[#1E2A5A] rounded-full transition-all duration-300 ${
                      menuOpen ? "opacity-0" : "top-[9px]"
                    }`}
                  />

                  <span
                    className={`absolute left-0 w-5 h-[2px] bg-[#1E2A5A] rounded-full transition-all duration-300 ${
                      menuOpen ? "-rotate-45 top-[9px]" : "top-[15px]"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* MOBILE MENU */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ${
            menuOpen
              ? "max-h-[500px] opacity-100 mt-3"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="max-w-7xl mx-auto rounded-2xl bg-white border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* MENU LINKS */}
            <div className="flex flex-col py-3">
              {navLinks.map((item, index) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-6 sm:px-7 py-4 text-[13px] font-semibold tracking-[0.18em] uppercase transition-all duration-300 ${
                      isActive
                        ? "text-[#E34A2F] bg-[#FFF4F1]"
                        : "text-[#1F2937] hover:bg-gray-50"
                    }`
                  }
                  style={{
                    borderBottom:
                      index !== navLinks.length - 1
                        ? "1px solid #F3F4F6"
                        : "none",
                  }}
                >
                  {item.name}

                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </NavLink>
              ))}
            </div>

            {/* MOBILE BUTTON */}
            <div className="p-5 sm:p-6 border-t border-gray-100 bg-[#FAFAFA]">
              <button className="w-full flex items-center justify-center gap-2 rounded-full bg-[#1E2A5A] hover:bg-[#25D366] text-white py-3 text-[14px] font-semibold transition-all duration-300">
                <FaWhatsapp className="text-[18px]" />
                Inquire Now
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
