import type { ReactElement } from "react";
import { ThemeFonts, WebsiteRenderer } from "@/components/SiteRenderer";
import type { Website } from "@/lib/schema";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Serialize a schema Website into a self-contained HTML document for iframe + publish.
 * Dynamic import avoids Next.js App Router static ban on `react-dom/server`.
 */
export async function renderWebsiteToHtml(site: Website): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");

  const tree = (
    <>
      <ThemeFonts theme={site.theme} />
      <WebsiteRenderer site={site} />
    </>
  ) as ReactElement;

  const body = renderToStaticMarkup(tree);

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
  <title>${escapeHtml(site.brand)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
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
