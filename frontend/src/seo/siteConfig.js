// ─────────────────────────────────────────────────────────────────────────────
// Central SEO configuration + JSON-LD (structured data) builders.
//
// ⚠️ UPDATE BEFORE GOING LIVE:
//   • SITE.url           → your real production domain
//   • SITE.geo           → verified latitude / longitude of the office
//   • SITE.sameAs        → real social / Google Business Profile URLs
//   • public/og-image.jpg (1200×630) → a proper social-share image
// ─────────────────────────────────────────────────────────────────────────────

export const SITE = {
  name: "Shubh Suramya",
  legalName: "Shubh Suramya Group",
  // TODO: set your production domain (no trailing slash)
  url: "https://www.shubhsuramya.com",
  description:
    "Shubh Suramya is a premium real estate developer in Ahmedabad, Gujarat — building luxury residential and commercial projects with modern architecture.",
  email: "shubhsuramyagroup@gmail.com",
  phone: "+919687258222",
  phoneDisplay: "+91 96872 58222",
  foundingDate: "2010",
  address: {
    street:
      "Shubh Suramya Corporate House, opp Suramya Dreams, Suramya Road, Near Eklingji Road",
    locality: "Sanand",
    region: "Gujarat",
    postalCode: "382110",
    country: "IN",
  },
  // TODO: verify precise office coordinates
  geo: { lat: 22.9736, lng: 72.381 },
  // TODO: replace with real profile URLs
  sameAs: [],
};

// Absolute logo / default social image (kept absolute for crawlers & OG)
SITE.logo = `${SITE.url}/logo.png`;
// Prefer a real photo for social share cards (better than the tiny logo)
SITE.defaultImage = `${SITE.url}/hero_img.jpg`;

// Base keyword set reused across every page (page-specific terms are prepended)
SITE.keywords = [
  "Shubh Suramya",
  "Shubh Suramya Ahmedabad",
  "Luxury Homes Ahmedabad",
  "Residential Projects Gujarat",
  "Commercial Property Ahmedabad",
  "Premium Villas",
  "Modern Apartments",
  "Real Estate Ahmedabad",
  "Property Developer Gujarat",
  "Construction Company Ahmedabad",
];

// Resolve a path or (already absolute) URL to an absolute URL
export function absUrl(pathOrUrl = "") {
  if (!pathOrUrl) return SITE.url;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE.url + (pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`);
}

// Build a deduped keyword string: page-specific terms first, then the base set
export function keywords(extra = []) {
  return [...new Set([...extra, ...SITE.keywords])].filter(Boolean).join(", ");
}

// Collapse whitespace and clip to a max length (for meta descriptions, 140–160)
export function clip(str, n = 160) {
  if (!str) return "";
  const s = String(str).replace(/\s+/g, " ").trim();
  return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;
}

// ─── Reusable schema fragments ───────────────────────────────────────────────
export function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.locality,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: SITE.logo,
    image: SITE.logo,
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone,
    foundingDate: SITE.foundingDate,
    address: postalAddress(),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      email: SITE.email,
      contactType: "sales",
      areaServed: "IN",
      availableLanguage: ["en", "hi", "gu"],
    },
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE.url}/#localbusiness`,
    name: SITE.name,
    image: SITE.logo,
    logo: SITE.logo,
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    description: SITE.description,
    priceRange: "₹₹₹",
    address: postalAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.geo.lat,
      longitude: SITE.geo.lng,
    },
    areaServed: [
      { "@type": "City", name: "Ahmedabad" },
      { "@type": "State", name: "Gujarat" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: { "@id": `${SITE.url}/#organization` },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/projects?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// items: [{ name, path }]
export function breadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE.url}/contact#contactpage`,
    url: `${SITE.url}/contact`,
    name: `Contact ${SITE.name}`,
    description: `Get in touch with ${SITE.name}, a premium real estate developer in Ahmedabad, Gujarat.`,
    about: { "@id": `${SITE.url}/#organization` },
    mainEntity: {
      "@type": "Organization",
      name: SITE.name,
      email: SITE.email,
      telephone: SITE.phone,
      address: postalAddress(),
    },
  };
}

export function collectionPageSchema({ name, description, path }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: absUrl(path),
    name,
    description,
    isPartOf: { "@id": `${SITE.url}/#website` },
    about: { "@id": `${SITE.url}/#organization` },
  };
}

// Project detail → Residence + Product-like schema built from Firestore data.
export function projectSchema({
  name,
  description,
  image,
  path,
  price,
  type,
  location,
}) {
  const url = absUrl(path);
  const isCommercial = /commercial|office|shop|retail/i.test(type || "");
  return {
    "@context": "https://schema.org",
    "@type": isCommercial ? ["Product", "Place"] : ["Product", "Residence"],
    name,
    description: description || SITE.description,
    image: image ? [absUrl(image)] : [SITE.defaultImage],
    url,
    category: type || "Residential",
    brand: { "@type": "Organization", name: SITE.name },
    seller: { "@id": `${SITE.url}/#organization` },
    ...(location
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: location,
            addressRegion: SITE.address.region,
            addressCountry: SITE.address.country,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      ...(price && /\d/.test(String(price)) ? { price: String(price) } : {}),
      availability: "https://schema.org/InStock",
      url,
      seller: { "@id": `${SITE.url}/#organization` },
    },
  };
}
