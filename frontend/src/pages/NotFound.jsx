import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import { SITE, keywords as buildKeywords } from "../seo/siteConfig";

// ─── 404 / Not Found ─────────────────────────────────────────────────────────
// Presentation matches the site's existing palette & type system. Marked
// noindex so search engines don't index the error route, while still offering
// clear internal links back into the crawlable site.
export default function NotFound() {
  return (
    <>
      <Seo
        title={`Page Not Found | ${SITE.name}`}
        description="The page you're looking for doesn't exist. Explore Shubh Suramya's luxury residential and commercial real estate projects in Ahmedabad, Gujarat."
        keywords={buildKeywords(["404", "page not found"])}
        canonicalPath="/404"
        noIndex
      />

      <Navbar />

      <main className="min-h-screen bg-[#FDFAF6] w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 2xl:px-24 flex flex-col items-center justify-center text-center py-28 sm:py-32">
        <p className="text-[#E4572E] text-[80px] sm:text-[120px] font-semibold leading-none tracking-tight">
          404
        </p>

        <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold text-[#1F2A44]">
          This page could not be found
        </h1>

        <p className="mt-4 max-w-md text-[#6B7280] text-sm sm:text-base leading-relaxed">
          The page you're looking for may have been moved or no longer exists.
          Let's get you back to exploring our luxury residences in Ahmedabad.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#E4572E] text-white text-[13px] font-semibold tracking-wide hover:bg-[#c73b22] hover:shadow-lg hover:shadow-[#E4572E]/30 transition-all duration-300"
          >
            Back to Home
          </Link>
          <Link
            to="/projects"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-[#1F2A44]/15 text-[#1F2A44] text-[13px] font-semibold tracking-wide hover:border-[#E4572E] hover:text-[#E4572E] transition-all duration-300"
          >
            View Projects
          </Link>
        </div>

        <nav aria-label="Helpful links" className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link to="/about" className="text-[#6B7280] hover:text-[#E4572E] transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="text-[#6B7280] hover:text-[#E4572E] transition-colors">
            Contact
          </Link>
        </nav>
      </main>

      <Footer />
    </>
  );
}
