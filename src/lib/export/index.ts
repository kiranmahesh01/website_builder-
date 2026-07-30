import type { SiteSpec } from "@/lib/spec/schema";
import type { Website } from "@/lib/schema";
import { getSpecFromData } from "@/lib/site-data";

export type ExportFormat = "html" | "react" | "astro" | "wordpress";

export type ExportBundle = {
  format: ExportFormat;
  filename: string;
  mimeType: string;
  content: string;
  files?: { path: string; content: string }[];
};

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function sectionToJsx(spec: SiteSpec): string {
  return spec.pages[0].sections
    .map((section) => {
      const headline =
        (section.content.headline as string) ||
        (section.content.quote as string) ||
        section.id;
      return `      <section id="${section.id}" className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold">${esc(String(headline))}</h2>
          ${section.content.subhead ? `<p className="mt-4 text-lg opacity-80">${esc(String(section.content.subhead))}</p>` : ""}
          ${section.content.body ? `<p className="mt-4 leading-relaxed">${esc(String(section.content.body))}</p>` : ""}
        </div>
      </section>`;
    })
    .join("\n");
}

export function exportReact(spec: SiteSpec): ExportBundle {
  const brand = spec.brand;
  const title = spec.seo?.title || brand;
  const content = `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${esc(title)}",
  description: "${esc(spec.seo?.description || `Website for ${brand}`)}",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b px-6 py-4">
        <span className="text-xl font-bold">${esc(brand)}</span>
      </header>
${sectionToJsx(spec)}
      <footer className="border-t px-6 py-8 text-center text-sm opacity-60">
        © {new Date().getFullYear()} ${esc(brand)}
      </footer>
    </main>
  );
}
`;

  return {
    format: "react",
    filename: "page.tsx",
    mimeType: "text/plain",
    content,
    files: [
      { path: "app/page.tsx", content },
      {
        path: "README.md",
        content: `# ${brand}\n\nExported from Magic AI.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
      },
    ],
  };
}

export function exportAstro(spec: SiteSpec): ExportBundle {
  const brand = spec.brand;
  const title = spec.seo?.title || brand;
  const sections = spec.pages[0].sections
    .map((section) => {
      const headline =
        (section.content.headline as string) ||
        (section.content.quote as string) ||
        section.id;
      return `    <section id="${section.id}" class="section">
      <div class="wrap">
        <h2>${esc(String(headline))}</h2>
        ${section.content.subhead ? `<p class="sub">${esc(String(section.content.subhead))}</p>` : ""}
      </div>
    </section>`;
    })
    .join("\n");

  const content = `---
const title = "${esc(title)}";
const description = "${esc(spec.seo?.description || `Website for ${brand}`)}";
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <style>
      * { box-sizing: border-box; margin: 0; }
      body { font-family: system-ui, sans-serif; color: #111; }
      .section { padding: 4rem 1.5rem; }
      .wrap { max-width: 56rem; margin: 0 auto; }
      h2 { font-size: 2rem; font-weight: 700; }
      .sub { margin-top: 1rem; opacity: 0.8; font-size: 1.1rem; }
      header, footer { padding: 1rem 1.5rem; border-bottom: 1px solid #eee; }
      footer { border-top: 1px solid #eee; border-bottom: none; text-align: center; opacity: 0.6; font-size: 0.875rem; }
    </style>
  </head>
  <body>
    <header><strong>${esc(brand)}</strong></header>
${sections}
    <footer>© ${new Date().getFullYear()} ${esc(brand)}</footer>
  </body>
</html>
`;

  return {
    format: "astro",
    filename: "index.astro",
    mimeType: "text/plain",
    content,
    files: [
      { path: "src/pages/index.astro", content },
      {
        path: "README.md",
        content: `# ${brand}\n\nExported from Magic AI as Astro.\n\n\`\`\`bash\nnpm create astro@latest . -- --template minimal\nnpm run dev\n\`\`\`\n`,
      },
    ],
  };
}

export function exportWordPress(spec: SiteSpec): ExportBundle {
  const brand = spec.brand;
  const blocks = spec.pages[0].sections
    .map((section) => {
      const headline =
        (section.content.headline as string) ||
        (section.content.quote as string) ||
        section.id;
      const body = section.content.body || section.content.subhead || "";
      return `<!-- wp:heading -->
<h2 class="wp-block-heading">${esc(String(headline))}</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${esc(String(body))}</p>
<!-- /wp:paragraph -->`;
    })
    .join("\n\n");

  const content = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <title>${esc(brand)}</title>
  <description>${esc(spec.seo?.description || brand)}</description>
  <wp:wxr_version>1.2</wp:wxr_version>
  <item>
    <title>${esc(spec.seo?.title || brand)}</title>
    <content:encoded><![CDATA[${blocks}]]></content:encoded>
    <wp:post_type>page</wp:post_type>
    <wp:status>publish</wp:status>
  </item>
</channel>
</rss>`;

  return {
    format: "wordpress",
    filename: `${brand.toLowerCase().replace(/\s+/g, "-")}-wordpress.xml`,
    mimeType: "application/xml",
    content,
    files: [
      { path: "wordpress-import.xml", content },
      {
        path: "README.md",
        content: `# WordPress Import — ${brand}\n\n1. Log in to WordPress admin\n2. Tools → Import → WordPress\n3. Upload \`wordpress-import.xml\`\n4. Assign to a page or set as homepage\n\nExported from Magic AI.\n`,
      },
    ],
  };
}

export function exportFromProject(input: {
  html: string;
  data: unknown;
  format: ExportFormat;
}): ExportBundle {
  const spec = getSpecFromData(input.data);

  if (input.format === "html") {
    return {
      format: "html",
      filename: "index.html",
      mimeType: "text/html",
      content: input.html,
    };
  }

  if (!spec) {
    throw new Error("Code export requires a spec-based site. Regenerate the project first.");
  }

  switch (input.format) {
    case "react":
      return exportReact(spec);
    case "astro":
      return exportAstro(spec);
    case "wordpress":
      return exportWordPress(spec);
    default:
      throw new Error("Unsupported format");
  }
}

export function bundleAsZipManifest(files: { path: string; content: string }[]): string {
  return JSON.stringify({ files }, null, 2);
}
