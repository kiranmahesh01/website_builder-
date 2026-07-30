"use client";

import { useEffect, useState } from "react";
import { SHOWCASE_EXAMPLES } from "@/lib/showcase-examples";

export function PreviewShowcase() {
  const [index, setIndex] = useState(0);
  const example = SHOWCASE_EXAMPLES[index % SHOWCASE_EXAMPLES.length];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SHOWCASE_EXAMPLES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full min-h-[60vh] flex-col bg-[radial-gradient(circle_at_top,#1a1d24,transparent_55%),#0e1014] lg:min-h-0">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2 text-[10px] text-mist">
        <span>Example output — {example.title}</span>
        <span>{example.category}</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <iframe
          key={example.slug}
          title={`Example: ${example.title}`}
          src={`/examples/${example.slug}`}
          className="absolute inset-0 h-full w-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <p className="border-t border-[var(--line)] px-4 py-3 text-center text-xs text-mist">
        Fill in your business on the left — your site replaces this preview
      </p>
    </div>
  );
}
