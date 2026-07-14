// ─────────────────────────────────────────────────────────────────────────────
// <Seo /> — dynamic per-route metadata using React 19's native document metadata
// support (title / meta / link rendered here are automatically hoisted to <head>).
// No external dependency (react-helmet) required.
//
// Renders: title, description, keywords, canonical, robots, Open Graph,
// Twitter Card, and one or more JSON-LD structured-data blocks.
// ─────────────────────────────────────────────────────────────────────────────

import { SITE, absUrl } from "../seo/siteConfig";

export default function Seo({
  title,
  description,
  keywords,
  canonicalPath = "",
  image,
  ogType = "website",
  noIndex = false,
  jsonLd,
}) {
  const fullTitle = title || SITE.name;
  const desc = description || SITE.description;
  const url = absUrl(canonicalPath || "/");
  const ogImage = image ? absUrl(image) : SITE.defaultImage;
  const robots = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const schemas = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD structured data */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
