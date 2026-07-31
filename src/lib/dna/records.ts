import type { WebsiteDna } from "./types";

export const WEBSITE_DNA_RECORDS: WebsiteDna[] = [
  {
    id: "coffee",
    industry: "Coffee",
    aliases: ["coffee", "cafe", "café", "espresso", "roaster", "barista", "latte"],
    psychology: {
      desires: ["ritual", "community", "craft quality", "third place"],
      fears: ["bitter disappointment", "inconsistent brew", "tourist trap"],
      decisionTriggers: ["origin story", "menu clarity", "hours + location", "loyalty"],
      tone: ["warm", "artisan", "inviting", "sensory"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Lead with atmosphere + one clear visit/order CTA before menu overload.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Signature drinks / offerings",
        why: "Helps browsers decide what to try; reduces choice paralysis.",
        priority: "must",
      },
      {
        id: "about_text",
        label: "Roaster / cafe story",
        why: "Coffee buyers pay for provenance and care — story builds willingness to visit.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Local proof",
        why: "Neighborhood trust beats generic stock praise.",
        priority: "high",
      },
      {
        id: "cta_band",
        label: "Loyalty / subscribe CTA",
        why: "Repeat visits and subscriptions lift LTV for cafes and online roasters.",
        priority: "high",
      },
      {
        id: "contact_form",
        label: "Visit / catering / wholesale",
        why: "Captures catering and wholesale leads without a phone call.",
        priority: "must",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "Hours, address, and social close the loop on mobile.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#3c2a21",
      accent: "#c4a484",
      surface: "#f6f1ea",
      text: "#1f1712",
      notes: "Espresso browns + warm cream; avoid neon cafe kitsch.",
    },
    ctas: {
      primary: ["Visit us today", "Order online", "Join the club"],
      secondary: ["See the menu", "Wholesale inquiry"],
      strength: "medium",
    },
    trustElements: ["Hours & location", "Origin notes", "Reviews", "Hygiene / craft cues"],
    conversionPatterns: [
      "Menu preview above the fold on mobile",
      "Email capture for loyalty or subscription",
      "Clear cafe vs online vs brand model in hero",
    ],
    discoveryQuestions: [
      {
        id: "coffeeModel",
        prompt: "Is this mainly a cafe, online shop, subscription, or brand site?",
        hint: "cafe / online / subscription / brand",
      },
      {
        id: "coffeeCustomers",
        prompt: "Who walks in or orders most — locals, remote workers, tourists, wholesale?",
      },
    ],
    strategyTips: [
      "Lead with one primary action: visit, order, or subscribe — not all three equally.",
      "Add loyalty / email capture if repeat visits matter.",
      "Show signature drinks early; bury full PDF menus.",
    ],
  },
  {
    id: "restaurant",
    industry: "Restaurant",
    aliases: ["restaurant", "bistro", "dining", "kitchen", "chef", "food", "eatery"],
    psychology: {
      desires: ["memorable meal", "occasion", "reliable favorite"],
      fears: ["bad night out", "long wait", "hidden fees"],
      decisionTriggers: ["menu photos", "reservations", "reviews", "chef story"],
      tone: ["appetite-forward", "hospitable", "confident"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Appetite + reserve/order CTA in first viewport drives bookings.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Signature dishes",
        why: "Highlights convert better than full menus online.",
        priority: "must",
      },
      {
        id: "about_text",
        label: "Chef / concept",
        why: "Occasion diners buy the story as much as the plate.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Guest quotes",
        why: "Social proof reduces risk of a bad night out.",
        priority: "high",
      },
      {
        id: "faq_accordion",
        label: "Dining FAQ",
        why: "Dietary, parking, private events — removes booking friction.",
        priority: "optional",
      },
      {
        id: "contact_form",
        label: "Reserve / private events",
        why: "Captures high-intent party and catering leads.",
        priority: "must",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "Hours, map, phone for last-mile decisions.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#1c1917",
      accent: "#c45c26",
      surface: "#faf7f2",
      text: "#141210",
      notes: "Deep neutrals with a warm food accent; keep surfaces appetizing.",
    },
    ctas: {
      primary: ["Reserve a table", "Order for pickup", "View menu"],
      secondary: ["Private events", "Gift cards"],
      strength: "strong",
    },
    trustElements: ["Reviews", "Hours", "Dietary notes", "Chef credentials"],
    conversionPatterns: [
      "Primary CTA = reserve or order, not ‘learn more’",
      "Signature dishes before full menu dump",
      "Private events form for higher ticket revenue",
    ],
    discoveryQuestions: [
      {
        id: "diningStyle",
        prompt: "Fine dining, casual, fast-casual, or delivery-first?",
      },
      {
        id: "bookingGoal",
        prompt: "Do you need reservations, online ordering, or both?",
      },
    ],
    strategyTips: [
      "Make reserve/order the hero CTA with strong contrast.",
      "Surface allergen / dietary answers in FAQ to cut bounce.",
    ],
  },
  {
    id: "saas",
    industry: "SaaS",
    aliases: ["saas", "software", "startup", "b2b", "platform", "app", "product"],
    psychology: {
      desires: ["save time", "reduce risk", "look smart to boss"],
      fears: ["wasted budget", "painful migration", "security gaps"],
      decisionTriggers: ["clear outcome", "pricing clarity", "social proof", "demo"],
      tone: ["precise", "confident", "benefit-led"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Outcome + primary CTA (demo/trial) in first screen.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Capabilities",
        why: "Maps product value to buyer jobs-to-be-done.",
        priority: "must",
      },
      {
        id: "pricing_3tier",
        label: "Pricing",
        why: "Self-serve buyers need tiers; enterprise needs ‘talk to sales’.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Customer proof",
        why: "B2B risk reduction — logos and outcomes beat feature lists.",
        priority: "must",
      },
      {
        id: "faq_accordion",
        label: "Objections FAQ",
        why: "Security, integration, billing — unblock evaluators.",
        priority: "high",
      },
      {
        id: "cta_band",
        label: "Final CTA",
        why: "Second chance to start trial/demo after proof sections.",
        priority: "must",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "Legal + product nav for evaluators comparing vendors.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#0f172a",
      accent: "#0ea5e9",
      surface: "#f8fafc",
      text: "#0f172a",
      notes: "Product-led clarity; one accent for CTAs only.",
    },
    ctas: {
      primary: ["Start free trial", "Book a demo", "See pricing"],
      secondary: ["Watch product tour", "Talk to sales"],
      strength: "strong",
    },
    trustElements: ["Customer logos", "Security note", "ROI metrics", "Integrations"],
    conversionPatterns: [
      "Single primary CTA above the fold",
      "Pricing or ‘talk to sales’ before FAQ",
      "Objection-handling FAQ near final CTA",
    ],
    discoveryQuestions: [
      {
        id: "saasBuyer",
        prompt: "Who buys — founder, ops, marketing, or IT?",
      },
      {
        id: "saasMotion",
        prompt: "Self-serve trial, sales-led demo, or waitlist?",
      },
    ],
    strategyTips: [
      "Pick one conversion motion: trial OR demo — don’t dilute both.",
      "Put social proof before pricing for higher ACV products.",
    ],
  },
  {
    id: "real-estate",
    industry: "Real estate",
    aliases: ["real estate", "realtor", "property", "homes", "broker", "listing"],
    psychology: {
      desires: ["right home", "trusted guide", "smooth process"],
      fears: ["overpaying", "hidden issues", "pushy agent"],
      decisionTriggers: ["local expertise", "listings", "testimonials", "valuation"],
      tone: ["trustworthy", "local", "calm confidence"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Area + valuation/consultation CTA builds first contact.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Featured listings / services",
        why: "Concrete inventory or service pillars reduce vagueness.",
        priority: "must",
      },
      {
        id: "about_text",
        label: "Agent / team story",
        why: "People hire people — credentials and neighborhood tenure matter.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Client wins",
        why: "Transaction proof lowers anxiety in high-stakes purchases.",
        priority: "must",
      },
      {
        id: "faq_accordion",
        label: "Buying / selling FAQ",
        why: "Process clarity converts tire-kickers into consults.",
        priority: "high",
      },
      {
        id: "contact_form",
        label: "Home valuation / consult",
        why: "Lead magnet that matches intent (buy vs sell).",
        priority: "must",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "License, areas served, contact for compliance + trust.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#1e3a5f",
      accent: "#b08d57",
      surface: "#f4f6f8",
      text: "#0f172a",
      notes: "Navy + warm metal accent signals trust without luxury cliché overload.",
    },
    ctas: {
      primary: ["Get a home valuation", "Browse listings", "Book a consult"],
      secondary: ["Sell with us", "Neighborhood guides"],
      strength: "strong",
    },
    trustElements: ["Reviews", "Transactions closed", "License", "Neighborhoods served"],
    conversionPatterns: [
      "Valuation form as primary lead magnet",
      "Featured listings early for buyers",
      "Seller FAQ for listing appointments",
    ],
    discoveryQuestions: [
      {
        id: "reFocus",
        prompt: "Buying, selling, rentals, or commercial — what’s primary?",
      },
      {
        id: "reArea",
        prompt: "Which neighborhoods or cities do you serve?",
      },
    ],
    strategyTips: [
      "Match CTA to focus: valuation for sellers, listings for buyers.",
      "Lead with local proof over generic ‘dream home’ copy.",
    ],
  },
  {
    id: "fitness",
    industry: "Fitness",
    aliases: ["fitness", "gym", "yoga", "studio", "training", "crossfit", "wellness"],
    psychology: {
      desires: ["results", "belonging", "energy", "accountability"],
      fears: ["intimidation", "wasted membership", "injury"],
      decisionTriggers: ["class schedule feel", "trial offer", "trainer faces", "community"],
      tone: ["motivating", "inclusive", "energetic"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Outcome + free trial / book class CTA converts browsers.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Programs / classes",
        why: "Helps members self-select without touring first.",
        priority: "must",
      },
      {
        id: "pricing_3tier",
        label: "Memberships",
        why: "Pricing transparency reduces ‘I’ll think about it’ exits.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Member stories",
        why: "Transformation proof beats equipment lists.",
        priority: "high",
      },
      {
        id: "cta_band",
        label: "Trial CTA",
        why: "Second conversion chance after proof.",
        priority: "must",
      },
      {
        id: "contact_form",
        label: "Book intro",
        why: "Captures leads when scheduling widgets aren’t ready.",
        priority: "must",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "Hours, address, policies for local searchers.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#111111",
      accent: "#ff6b4a",
      surface: "#f5f5f5",
      text: "#111111",
      notes: "High contrast energy; keep accent on CTAs and highlights.",
    },
    ctas: {
      primary: ["Start a free trial", "Book a class", "Join now"],
      secondary: ["See class types", "Meet the coaches"],
      strength: "strong",
    },
    trustElements: ["Member results", "Coach bios", "Clean facility cues", "Intro offer"],
    conversionPatterns: [
      "Free trial or first class in hero",
      "Membership tiers mid-page",
      "Inclusive tone to reduce gym intimidation",
    ],
    discoveryQuestions: [
      {
        id: "fitnessOffer",
        prompt: "Gym, boutique studio, personal training, or online coaching?",
      },
      {
        id: "fitnessOfferType",
        prompt: "What’s the offer — free trial, intro pack, or membership?",
      },
    ],
    strategyTips: [
      "Put trial/intro offer in hero and again after testimonials.",
      "Show class/program types before dense schedules.",
    ],
  },
  {
    id: "hotel",
    industry: "Hotel",
    aliases: ["hotel", "inn", "boutique hotel", "resort", "lodge", "stay", "hospitality"],
    psychology: {
      desires: ["memorable stay", "ease", "place identity"],
      fears: ["misleading photos", "hidden fees", "noisy disappointment"],
      decisionTriggers: ["rooms", "location", "amenities", "reviews", "book CTA"],
      tone: ["hospitable", "atmospheric", "assured"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Place atmosphere + Book now is the conversion core.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Rooms & amenities",
        why: "Sets expectations and upsells suites/experiences.",
        priority: "must",
      },
      {
        id: "about_text",
        label: "Property story",
        why: "Boutique stays sell character and locality.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Guest reviews",
        why: "OTAs own reviews — own-site proof still lifts direct book.",
        priority: "high",
      },
      {
        id: "faq_accordion",
        label: "Stay FAQ",
        why: "Check-in, parking, pets — removes booking anxiety.",
        priority: "high",
      },
      {
        id: "cta_band",
        label: "Book CTA",
        why: "Repeat book action after amenities and proof.",
        priority: "must",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "Address, phone, policies for travelers comparing options.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#1c1917",
      accent: "#b08d57",
      surface: "#f5f0e8",
      text: "#141210",
      notes: "Warm hospitality materials; restrained luxury, not glitter.",
    },
    ctas: {
      primary: ["Book your stay", "Check availability", "View rooms"],
      secondary: ["Explore experiences", "Contact concierge"],
      strength: "strong",
    },
    trustElements: ["Guest reviews", "Exact location", "Amenity honesty", "Cancellation clarity"],
    conversionPatterns: [
      "Book CTA sticky in narrative (hero + mid + end)",
      "Rooms before long brand manifesto",
      "FAQ for fees and logistics",
    ],
    discoveryQuestions: [
      {
        id: "hotelType",
        prompt: "Boutique hotel, inn, resort, or short-term rental brand?",
      },
      {
        id: "bookingChannel",
        prompt: "Do you want direct booking emphasis or inquiry form?",
      },
    ],
    strategyTips: [
      "Prioritize direct book language if you want to reduce OTA dependency.",
      "Lead with rooms/amenities; keep story second.",
    ],
  },
  {
    id: "portfolio",
    industry: "Portfolio",
    aliases: ["portfolio", "designer", "photographer", "freelancer", "creative", "agency"],
    psychology: {
      desires: ["hire the right creative", "see craft quality"],
      fears: ["style mismatch", "missed deadlines", "unclear process"],
      decisionTriggers: ["selected work", "process", "clear CTA", "niche proof"],
      tone: ["distinctive", "confident", "selective"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Name + craft positioning + hire CTA frames the site.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Selected work",
        why: "Proof of craft is the product.",
        priority: "must",
      },
      {
        id: "about_text",
        label: "About / approach",
        why: "Buyers want fit and process, not just pretty shots.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Client quote",
        why: "Reliability signal for freelancers and small studios.",
        priority: "high",
      },
      {
        id: "cta_band",
        label: "Hire CTA",
        why: "Capture interest after the work gallery.",
        priority: "must",
      },
      {
        id: "contact_form",
        label: "Project inquiry",
        why: "Structured briefs qualify leads.",
        priority: "must",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "Links and contact for agency referrals.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#2c2a26",
      accent: "#8b7355",
      surface: "#f7f4ef",
      text: "#1a1917",
      notes: "Let work lead; palette should not overpower case studies.",
    },
    ctas: {
      primary: ["Start a project", "View work", "Book a call"],
      secondary: ["See process", "Download résumé"],
      strength: "medium",
    },
    trustElements: ["Case results", "Client names", "Process clarity", "Availability"],
    conversionPatterns: [
      "Selected work early; bio after proof",
      "Single hire CTA (call or form)",
      "Process section for higher-ticket work",
    ],
    discoveryQuestions: [
      {
        id: "portfolioCraft",
        prompt: "What craft — design, photo, film, writing, development?",
      },
      {
        id: "portfolioIdeal",
        prompt: "Who is the ideal client or project type?",
      },
    ],
    strategyTips: [
      "Show 3–6 strong pieces, not everything you’ve ever made.",
      "Make inquiry form ask for budget/timeline to qualify.",
    ],
  },
  {
    id: "ecommerce",
    industry: "Ecommerce",
    aliases: [
      "ecommerce",
      "e-commerce",
      "shop",
      "store",
      "retail",
      "products",
      "merchandise",
    ],
    psychology: {
      desires: ["right product", "fair price", "fast delivery"],
      fears: ["scam", "returns hassle", "wrong size/fit"],
      decisionTriggers: ["product clarity", "shipping", "reviews", "urgency"],
      tone: ["clear", "benefit-led", "trustworthy"],
    },
    bestSections: [
      {
        id: "hero_split",
        label: "Hero",
        why: "Offer + shop CTA; avoid vague lifestyle-only heroes.",
        priority: "must",
      },
      {
        id: "features_3col",
        label: "Featured products",
        why: "Product cards convert; category walls come later.",
        priority: "must",
      },
      {
        id: "about_text",
        label: "Brand story",
        why: "DTC brands win on why-us differentiation.",
        priority: "high",
      },
      {
        id: "testimonial_single",
        label: "Reviews",
        why: "UGC-style proof reduces purchase anxiety.",
        priority: "must",
      },
      {
        id: "faq_accordion",
        label: "Shipping / returns FAQ",
        why: "Logistics FAQ is a conversion feature, not filler.",
        priority: "must",
      },
      {
        id: "cta_band",
        label: "Shop CTA",
        why: "Reassert purchase after trust sections.",
        priority: "high",
      },
      {
        id: "footer_simple",
        label: "Footer",
        why: "Policies and contact for checkout confidence.",
        priority: "must",
      },
    ],
    colors: {
      primary: "#111111",
      accent: "#16a34a",
      surface: "#ffffff",
      text: "#111111",
      notes: "Clean commerce palette; accent reserved for buy actions.",
    },
    ctas: {
      primary: ["Shop now", "Add to bag", "See bestsellers"],
      secondary: ["Track order", "Size guide"],
      strength: "strong",
    },
    trustElements: ["Reviews", "Shipping promise", "Returns policy", "Secure checkout cues"],
    conversionPatterns: [
      "Featured products before long brand story",
      "Shipping/returns FAQ before final CTA",
      "Email capture for abandoned interest",
    ],
    discoveryQuestions: [
      {
        id: "ecomCatalog",
        prompt: "What do you sell, and is there a hero SKU?",
      },
      {
        id: "ecomFulfillment",
        prompt: "Ship from stock, made-to-order, or local pickup?",
      },
    ],
    strategyTips: [
      "Put bestsellers and shipping clarity early.",
      "Use email capture if catalog is broad or restocks matter.",
    ],
  },
];

export function getDnaById(id: string): WebsiteDna | undefined {
  return WEBSITE_DNA_RECORDS.find((d) => d.id === id);
}
