import { Link } from "react-router-dom";
import { TbBrandFacebook, TbBrandLinkedin, TbBrandX } from "react-icons/tb";
import logo from "../../public/logo.png";
import logo1 from "../../public/logo1.png";

export default function Footer() {
  return (
    <footer className="w-full px-2 sm:px-4 lg:px-8 py-8 sm:py-12 bg-[#FDFAF6]">
      <div
        className="relative mx-auto w-full max-w-[1400px] rounded-[32px] py-16 px-8 lg:px-14 border shadow-sm"
        style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(0,0,0,0.06)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
          {/* 1. BRAND */}
          <div className="flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-2">
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

            <p
              className="text-sm max-w-xs"
              style={{ color: "#6B7280", lineHeight: 1.8 }}
            >
              Accurate property information, vetted listings, and smart tools —
              built to simplify your search and support every decision you make.
            </p>

            <p className="text-sm" style={{ color: "#4B5563" }}>
              shubhsuramyagroup@gmail.com
            </p>

            <div className="flex items-center gap-3 mt-1">
              {[TbBrandX, TbBrandLinkedin, TbBrandFacebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-300"
                  style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#E34A2F";
                    e.currentTarget.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                    e.currentTarget.style.color = "#374151";
                  }}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div className="flex flex-col gap-4">
            <h4
              className="font-semibold"
              style={{ color: "#111827", fontSize: "22px" }}
            >
              Quick Links
            </h4>

            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm transition-colors duration-300"
                style={{ color: "#4B5563" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E34A2F")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
              >
                Home
              </Link>

              <Link
                to="/projects"
                className="text-sm transition-colors duration-300"
                style={{ color: "#4B5563" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E34A2F")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
              >
                Projects
              </Link>

              <Link
                to="/about"
                className="text-sm transition-colors duration-300"
                style={{ color: "#4B5563" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E34A2F")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
              >
                About
              </Link>

              <Link
                to="/contact"
                className="text-sm transition-colors duration-300"
                style={{ color: "#4B5563" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E34A2F")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
              >
                Contact
              </Link>
            </div>
          </div>

          {/* 3. CONTACT */}
          <div className="flex flex-col gap-4">
            <h4
              className="font-semibold"
              style={{ color: "#111827", fontSize: "22px" }}
            >
              Contact Us
            </h4>

            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: "#4B5563" }}>
                shubhsuramyagroup@gmail.com
              </p>

              <p className="text-sm" style={{ color: "#4B5563" }}>
                (+91) 96872 58222
              </p>
            </div>
          </div>

          {/* 4. ADDRESS + NEWSLETTER */}
          <div className="flex flex-col gap-4">
            <h4
              className="font-semibold"
              style={{ color: "#111827", fontSize: "22px" }}
            >
              Our Address
            </h4>

            <p
              className="text-sm"
              style={{ color: "#4B5563", lineHeight: 1.8 }}
            >
              Shubh Suramya Corporate House opp suramaya dreams
              <br />
              Suramya Road, Near Eklingji Road, Sanand-382110
            </p>
          </div>
        </div>

        {/* DIVIDER */}
        <div
          className="mt-14 mb-6 w-full"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
        />

        {/* BOTTOM */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <a
            href="#"
            className="text-xs transition-colors duration-300"
            style={{ color: "#6B7280" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E34A2F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
          >
            Terms and Conditions
          </a>

          <p className="text-xs order-first sm:order-none" style={{ color: "#6B7280" }}>
            © {new Date().getFullYear()} Shubh Suramya. All Rights Reserved.
          </p>

          <a
            href="#"
            className="text-xs transition-colors duration-300"
            style={{ color: "#6B7280" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E34A2F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}