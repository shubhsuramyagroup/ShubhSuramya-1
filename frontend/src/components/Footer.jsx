import { Link } from "react-router-dom";
import { TbBrandFacebook, TbBrandLinkedin, TbBrandX } from "react-icons/tb";
import logo from "../../public/logo.png";
import logo1 from "../../public/logo1.png";

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

  <Link
    to="/"
    className="text-[#1E2A5A]/60 hover:text-[#E34A2F] text-sm transition"
  >
    Home
  </Link>

  <Link
    to="/projects"
    className="text-[#1E2A5A]/60 hover:text-[#E34A2F] text-sm transition"
  >
    Projects
  </Link>

  <Link
    to="/about"
    className="text-[#1E2A5A]/60 hover:text-[#E34A2F] text-sm transition"
  >
    About
  </Link>

  <Link
    to="/contact"
    className="text-[#1E2A5A]/60 hover:text-[#E34A2F] text-sm transition"
  >
    Contact
  </Link>

</div>

          {/* 3. CONTACT */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1E2A5A] font-semibold mb-2">Contact Us</h4>

            <p className="text-[#1E2A5A]/60 text-sm">shubhsuramyagroup@gmail.com</p>

            <p className="text-[#1E2A5A]/60 text-sm">(+91) 96872 58222 </p>
          </div>

          {/* 4. ADDRESS */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1E2A5A] font-semibold mb-2">Our Address</h4>

            <p className="text-[#1E2A5A]/60 text-sm leading-relaxed">
              Shubh Suramya Corporate House opp suramaya dreams
Suramya Road, Near Eklingji Road, Sanand-382110
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


VITE_FIREBASE_API_KEY=AIzaSyCCA6P-fbs1dtehq0PrA09tTrJGblzURpo
VITE_FIREBASE_AUTH_DOMAIN=shubhsuramya-716d4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shubhsuramya-716d4
VITE_FIREBASE_STORAGE_BUCKET=shubhsuramya-716d4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=851228358864
VITE_FIREBASE_APP_ID=1:851228358864:web:4b001f5f46dd92662046d5
VITE_FIREBASE_MEASUREMENT_ID=G-T6VY33WFL0
VITE_CLOUDINARY_CLOUD_NAME = "dhnnlu107";
VITE_CLOUDINARY_UPLOAD_PRESET = "project_uploads";
