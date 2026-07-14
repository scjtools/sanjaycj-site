export type ProjectStatus = "live" | "prototype" | "idea";

export interface Project {
  name: string;
  url?: string;
  description: string;
  status: ProjectStatus;
  tags: string[]; // free-form, hand-picked per project; shown as coloured chips
  sprite?: string;
  progress?: number;
}

export function getProgressLabel(percentage: number): string {
  if (percentage >= 100) return "Launched!";
  if (percentage >= 80) return "Polishing...";
  if (percentage >= 30) return "Building...";
  if (percentage > 0) return "Designing...";
  return "Coming soon...";
}

export const projects: Project[] = [
  {
    name: "4minit Daily News",
    url: "https://4minit.xyz",
    description:
      "A free automated newsletter delivering Mauritius news in English to over 200 inboxes every morning.",
    status: "live",
    tags: ["News", "Aggregator", "AI"],
    sprite: "/sprites/4minit-pal-01.png",
  },
  {
    name: "4minit Insights",
    url: "https://4minit.xyz/insights",
    description:
      "Mauritius open data made interactive — explore trends, compare, and export shareable charts, all free.",
    status: "live",
    tags: ["Civic", "Data Analytics", "Research"],
    sprite: "/sprites/4minit-pal-02.png",
  },
  {
    name: "0xguessr",
    url: "https://0xguessr.vercel.app/",
    description: "A slot-machine web game that \"guesses\" Ethereum private keys. The odds are astronomically remote, but non-zero.",
    status: "live",
    tags: ["Gaming", "Crypto", "Entertainment"],
    sprite: "/sprites/0xguessr-pal-01.png",
  },
  {
    name: "LinkedOut",
    description: "A dopamine-driven job search platform inspired by FoodNeverComes, designed to make job hunting engaging and rewarding.",
    status: "prototype",
    tags: ["Dopamine", "Web", "Entertainment"],
    sprite: "/sprites/linkedout-pal-01.png",
    progress: 45,
  },
  {
    name: "Sportdex",
    description: "A virtual stock market simulation game where players trade shares in athletes, earn dividends and much more!",
    status: "prototype",
    tags: ["Gaming", "Sports", "Trading"],
    sprite: "/sprites/sportdex-pal-01.png",
    progress: 15,
  },
  {
    name: "Phishing Practice Simulator",
    status: "idea",
  },
  {
    name: "WiFi Sonar",
    status: "idea",
  },
  {
    name: "Belanjar",
    status: "idea",
  },
  {
    name: "Private Prediction Markets",
    status: "idea",
  },
  {
    name: "Unfitness Tracker",
    status: "idea",
  },
  {
    name: "Handover Cam",
    status: "idea",
  },
  {
    name: "Report.mu",
    status: "idea",
  },
  {
    name: "RupeePlus",
    status: "idea",
  },
  {
    name: "Supermarket Waze",
    status: "idea",
  },
  {
    name: "CarHunt",
    status: "idea",
  },
];

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  prototype: "In progress",
  idea: "Coming soon",
};
