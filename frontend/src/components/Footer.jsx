import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TbBrandFacebook, TbBrandLinkedin, TbBrandX } from "react-icons/tb";
import logo from "../../public/logo.png";
import logo1 from "../../public/logo1.png";

// ─── Legal content (edit these to your finalized legal text) ───
const legalDocs = {
  terms: {
    title: "Terms & Conditions",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing and using this website, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, please discontinue use of the site.",
      },
      {
        heading: "2. Use of the Website",
        body: "The content on this website is provided for general information about our real estate projects. Project details, plans, specifications, pricing, and availability are indicative and subject to change without prior notice.",
      },
      {
        heading: "3. Intellectual Property",
        body: "All content, images, renders, logos, and materials on this website are the property of Shubh Suramya and may not be copied, reproduced, or distributed without our prior written consent.",
      },
      {
        heading: "4. Enquiries & Bookings",
        body: "Any enquiry submitted through this website does not constitute an offer, allotment, or guarantee of booking. All bookings are subject to the applicable agreements, terms, and statutory approvals.",
      },
      {
        heading: "5. Limitation of Liability",
        body: "While we strive to keep information accurate and up to date, we make no warranties regarding its completeness or accuracy and shall not be liable for any loss arising from reliance on the information provided.",
      },
      {
        heading: "6. Governing Law",
        body: "These terms are governed by and construed in accordance with the applicable laws of India, and any disputes shall be subject to the jurisdiction of the courts of Gujarat.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "We collect information you voluntarily provide through our contact and enquiry forms, such as your name, email address, phone number, and any message or preferences you share.",
      },
      {
        heading: "2. How We Use Your Information",
        body: "Your information is used to respond to your enquiries, share relevant project details, and improve our services and communication. We do not sell or rent your personal information to third parties.",
      },
      {
        heading: "3. Data Security",
        body: "We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, or disclosure.",
      },
      {
        heading: "4. Cookies",
        body: "Our website may use cookies and similar technologies to enhance your browsing experience and understand how visitors use the site. You can control cookies through your browser settings.",
      },
      {
        heading: "5. Third-Party Services",
        body: "We may use trusted third-party services (such as maps and analytics) that maintain their own privacy practices. We are not responsible for the privacy policies of external websites linked from our site.",
      },
      {
        heading: "6. Your Rights",
        body: "You may request access to, correction of, or deletion of your personal data at any time by contacting us at shubhsuramyagroup@gmail.com.",
      },
    ],
  },
};

// ─── Centered legal modal ───
function LegalModal({ title, sections, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 ${
          show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-black/[0.06]">
          <h3 className="text-[#111827] text-lg sm:text-xl font-semibold">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#F3F4F6] text-[#374151] hover:bg-[#E34A2F] hover:text-white transition-colors duration-300 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-5">
          {sections.map((s, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <h4 className="text-[#1F2A44] text-sm sm:text-[15px] font-semibold">
                {s.heading}
              </h4>
              <p className="text-[#6B7280] text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
          <p className="text-[#9CA3AF] text-xs pt-1">
            Last updated {new Date().getFullYear()}. For any questions, contact us
            at shubhsuramyagroup@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <footer className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 py-8 sm:py-12 bg-[#FDFAF6]">
      <div className="relative w-full rounded-[28px] sm:rounded-[32px] py-10 sm:py-14 lg:py-16 px-6 sm:px-8 lg:px-14 border border-black/[0.06] shadow-sm bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 lg:gap-10">
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

            <p className="text-sm max-w-xs text-[#6B7280] leading-[1.8]">
              Accurate property information, vetted listings, and smart tools —
              built to simplify your search and support every decision you make.
            </p>

            <p className="text-sm text-[#4B5563] break-words">
              shubhsuramyagroup@gmail.com
            </p>

            <div className="flex items-center gap-3 mt-1">
              {[TbBrandX, TbBrandLinkedin, TbBrandFacebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-[#F3F4F6] text-[#374151] hover:bg-[#E34A2F] hover:text-white transition-colors duration-300"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-[#111827] text-[20px] sm:text-[22px]">
              Quick Links
            </h4>

            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm text-[#4B5563] hover:text-[#E34A2F] transition-colors duration-300 w-fit"
              >
                Home
              </Link>

              <Link
                to="/projects"
                className="text-sm text-[#4B5563] hover:text-[#E34A2F] transition-colors duration-300 w-fit"
              >
                Projects
              </Link>

              <Link
                to="/about"
                className="text-sm text-[#4B5563] hover:text-[#E34A2F] transition-colors duration-300 w-fit"
              >
                About
              </Link>

              <Link
                to="/contact"
                className="text-sm text-[#4B5563] hover:text-[#E34A2F] transition-colors duration-300 w-fit"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* 3. CONTACT */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-[#111827] text-[20px] sm:text-[22px]">
              Contact Us
            </h4>

            <div className="flex flex-col gap-3">
              <p className="text-sm text-[#4B5563] break-words">
                shubhsuramyagroup@gmail.com
              </p>

              <p className="text-sm text-[#4B5563]">
                (+91) 96872 58222
              </p>
            </div>
          </div>

          {/* 4. ADDRESS + NEWSLETTER */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-[#111827] text-[20px] sm:text-[22px]">
              Our Address
            </h4>

            <p className="text-sm text-[#4B5563] leading-[1.8]">
              Shubh Suramya Corporate House opp suramaya dreams
              <br />
              Suramya Road, Near Eklingji Road, Sanand-382110
            </p>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mt-12 sm:mt-14 mb-6 w-full border-t border-black/[0.08]" />

        {/* BOTTOM */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <button
            type="button"
            onClick={() => setActiveModal("terms")}
            className="text-xs text-[#6B7280] hover:text-[#E34A2F] transition-colors duration-300 cursor-pointer"
          >
            Terms and Conditions
          </button>

          <p className="text-xs text-[#6B7280] order-first sm:order-none">
            © {new Date().getFullYear()} Shubh Suramya. All Rights Reserved.
          </p>

          <button
            type="button"
            onClick={() => setActiveModal("privacy")}
            className="text-xs text-[#6B7280] hover:text-[#E34A2F] transition-colors duration-300 cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Legal modals */}
      {activeModal && (
        <LegalModal
          title={legalDocs[activeModal].title}
          sections={legalDocs[activeModal].sections}
          onClose={() => setActiveModal(null)}
        />
      )}
    </footer>
  );
}
