export type BenchmarkPrompt = {
  slug: string;
  title: string;
  category: string;
  prompt: string;
  theme: "bold_startup" | "warm_editorial" | "minimal_studio";
  uiKit: "shadcn" | "preline" | "daisyui" | "flowbite";
};

/** Standard prompts for side-by-side comparison with other AI builders (e.g. Wegic). */
export const BENCHMARK_PROMPTS: BenchmarkPrompt[] = [
  {
    slug: "rye-and-salt",
    title: "Rye & Salt",
    category: "Bakery",
    prompt:
      "Brooklyn bakery called Rye & Salt — sourdough, pastries, wholesale orders, warm rustic style",
    theme: "warm_editorial",
    uiKit: "preline",
  },
  {
    slug: "austin-family-dental",
    title: "Austin Family Dental",
    category: "Healthcare",
    prompt:
      "Family dental clinic in Austin — cleanings, implants, insurance accepted, book online",
    theme: "minimal_studio",
    uiKit: "shadcn",
  },
  {
    slug: "freelance-product-designer",
    title: "Case Study Studio",
    category: "Portfolio",
    prompt:
      "Portfolio for a freelance product designer — case studies, about, contact",
    theme: "minimal_studio",
    uiKit: "shadcn",
  },
];
