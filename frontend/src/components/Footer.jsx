import { Link } from "react-router-dom";
import { TbBrandFacebook, TbBrandLinkedin, TbBrandX } from "react-icons/tb";
import logo from "../../public/logo.png";

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #FDFAF6 0%, #e3eaf6 35%, #b7c8e6 70%, #7c99d0 100%)",
      }}
    >
      {/* overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 80%, rgba(0,0,0,0.08), transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full py-15 sm:py-20 px-2 sm:px-4 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* 1. BRAND */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1">
              <img src={logo} alt="logo" className="w-9 h-9 object-contain" />

              <h2 className="text-[#1E2A5A] font-bold text-lg">
                <span className="text-[#1E2A5A]">Shubh </span>
                <span className="text-[#E34A2F]">Suramya</span>
              </h2>
            </div>

            <p className="text-[#1E2A5A]/60 text-sm leading-relaxed max-w-xs">
              Accurate property information, vetted listings, and smart tools —
              built to simplify your search and support every decision you make.
            </p>

            <div className="flex items-center gap-3 mt-2">
              {[TbBrandX, TbBrandLinkedin, TbBrandFacebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full border flex items-center justify-center text-[#1E2A5A]/60 hover:text-[#E34A2F] hover:border-[#E34A2F] transition"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1E2A5A] font-semibold mb-2">Quick Links</h4>

            {["About", "Contact", "FAQ's", "Blog", "Pricing Plans"].map(
              (item) => (
                <Link
                  key={item}
                  to="#"
                  className="text-[#1E2A5A]/60 hover:text-[#E34A2F] text-sm transition"
                >
                  {item}
                </Link>
              ),
            )}
          </div>

          {/* 3. CONTACT */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1E2A5A] font-semibold mb-2">Contact Us</h4>

            <p className="text-[#1E2A5A]/60 text-sm">hi@justhome.com</p>

            <p className="text-[#1E2A5A]/60 text-sm">(123) 456-7890</p>
          </div>

          {/* 4. ADDRESS */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1E2A5A] font-semibold mb-2">Our Address</h4>

            <p className="text-[#1E2A5A]/60 text-sm leading-relaxed">
              99 Fifth Avenue, 3rd Floor <br />
              San Francisco, CA 1980
            </p>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#1E2A5A]/10">
          <a
            href="#"
            className="text-[#1E2A5A]/40 hover:text-[#E34A2F] text-xs transition"
          >
            Terms and Conditions
          </a>

          <p className="text-[#1E2A5A]/40 text-xs">
            © {new Date().getFullYear()} Shubh Suramya. All Rights Reserved.
          </p>

          <a
            href="#"
            className="text-[#1E2A5A]/40 hover:text-[#E34A2F] text-xs transition"
          >
            Privacy Policy
          </a>
        </div>
      </div>

      {/* WATERMARK */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none overflow-hidden -pb-4 z-50">
        <span
          className="font-semibold text-[#1E2A5A] opacity-[0.1] whitespace-nowrap"
          style={{
            fontSize: "clamp(20px, 12vw, 210px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Shubh Suramya
        </span>
      </div>
    </footer>
  );
}
