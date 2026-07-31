import type { ReactElement } from "react";
import { SpecSiteRenderer } from "@/components/SpecSiteRenderer";
import { ThemeFonts, WebsiteRenderer } from "@/components/SiteRenderer";
import type { Website } from "@/lib/schema";
import type { SiteSpec } from "@/lib/spec/schema";
import { deserializeProjectData } from "@/lib/site-data";
import { normalizeUiKit } from "@/lib/ui-kits";
import { uiKitHeadAssets } from "@/lib/ui-kits/head";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function renderSpecToHtml(
  spec: SiteSpec,
  options?: { watermark?: boolean; siteSlug?: string },
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const tree = (
    <SpecSiteRenderer
      spec={spec}
      watermark={options?.watermark}
      siteSlug={options?.siteSlug}
    />
  ) as ReactElement;
  const body = renderToStaticMarkup(tree);
  const title = spec.seo?.title || spec.brand;
  const description =
    spec.seo?.description || `Website for ${spec.brand} — built with Magic AI.`;
  const keywords = (spec.seo?.keywords || []).join(", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: spec.brand,
    description,
  };

  const appOrigin =
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "";

  const contactScript = options?.siteSlug
    ? `<script>
(function(){
  var form = document.getElementById("magic-contact-form");
  if (!form) return;
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    var status = document.getElementById("magic-contact-status");
    var fd = new FormData(form);
    if (fd.get("_hp")) return;
    if (status) status.textContent = "Sending…";
    try {
      var res = await fetch("${appOrigin}/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "${escapeHtml(options.siteSlug)}",
          name: fd.get("name"),
          email: fd.get("email"),
          message: fd.get("message")
        })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      form.reset();
      if (status) status.textContent = "Thanks! We'll be in touch soon.";
    } catch (err) {
      if (status) status.textContent = err.message || "Something went wrong. Try again.";
    }
  });
})();
</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ""}
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { min-height: 100vh; }
    a { color: inherit; }
    @media (max-width: 800px) {
      [style*="grid-template-columns: 1.05fr"],
      [style*="grid-template-columns: 1fr 1fr"] {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
</head>
<body>
${body}
${contactScript}
</body>
</html>`;
}

/**
 * Serialize a schema Website into a self-contained HTML document for iframe + publish.
 */
export async function renderWebsiteToHtml(
  site: Website,
  options?: { watermark?: boolean; spec?: SiteSpec | null },
): Promise<string> {
  if (options?.spec) {
    return renderSpecToHtml(options.spec, { watermark: options.watermark });
  }

  const { renderToStaticMarkup } = await import("react-dom/server");

  const tree = (
    <>
      <ThemeFonts theme={site.theme} />
      <WebsiteRenderer site={site} />
      {options?.watermark ? (
        <div
          style={{
            borderTop: "1px solid #ddd",
            padding: "0.75rem",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#666",
          }}
        >
          Built with Magic AI
        </div>
      ) : null}
    </>
  ) as ReactElement;

  const body = renderToStaticMarkup(tree);
  const title = site.seo?.title || site.brand;
  const kit = normalizeUiKit(site.uiKit);
  const kitAssets = uiKitHeadAssets(kit, site.theme);
  const description =
    site.seo?.description ||
    `Website for ${site.brand} — built with Magic AI.`;
  const og = site.seo?.ogImage || site.logoUrl || "";
  const keywords = (site.seo?.keywords || []).join(", ");

  const pageScript =
    site.pages.length > 1
      ? `<script>
(function(){
  function show(id){
    document.querySelectorAll("[data-page]").forEach(function(el){
      el.style.display = el.getAttribute("data-page") === id ? "block" : "none";
    });
    try { history.replaceState(null, "", "#" + id); } catch(e) {}
  }
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest ? e.target.closest("a[href^='#page-']") : null;
    if (!a) return;
    e.preventDefault();
    show(a.getAttribute("href").slice(6));
  });
  var hash = location.hash.replace(/^#/, "");
  if (hash && document.querySelector('[data-page="'+hash+'"]')) show(hash);
})();
</script>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ""}
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${og ? `<meta property="og:image" content="${escapeHtml(og)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ${kitAssets}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { min-height: 100vh; }
    a { color: inherit; }
    @media (max-width: 800px) {
      [style*="grid-template-columns: 1.05fr"] ,
      [style*="grid-template-columns: 1.1fr"] {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
</head>
<body>
${body}
${pageScript}
</body>
</html>`;
}

export async function renderProjectDataToHtml(
  raw: unknown,
  options?: { watermark?: boolean; siteSlug?: string },
): Promise<string | null> {
  const project = deserializeProjectData(raw);
  if (project) {
    return renderSpecToHtml(project.spec, {
      watermark: options?.watermark,
      siteSlug: options?.siteSlug,
    });
  }
  const { deserializeSiteData } = await import("@/lib/site-data");
  const site = deserializeSiteData(raw);
  if (!site) return null;
  return renderWebsiteToHtml(site, { watermark: options?.watermark });
}
