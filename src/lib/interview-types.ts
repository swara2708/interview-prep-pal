export const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Product Manager",
  "HR Fresher",
  "QA Engineer",
  "DevOps Engineer",
  "UI/UX Designer",
] as const;

export const LEVELS = ["fresher", "experienced"] as const;
export const MODES = ["technical", "behavioral", "mixed"] as const;
export const CATEGORIES = ["technical", "behavioral", "hr"] as const;

export type Level = (typeof LEVELS)[number];
export type Mode = (typeof MODES)[number];
export type Category = (typeof CATEGORIES)[number];

export type Feedback = {
  score: number;
  strengths: string[];
  gaps: string[];
  rewrittenExample: string;
};

export const categoryLabel: Record<Category, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
};

export const categoryStyles: Record<Category, { text: string; bg: string; dot: string }> = {
  technical: {
    text: "text-cat-technical",
    bg: "bg-cat-technical/12",
    dot: "bg-cat-technical",
  },
  behavioral: {
    text: "text-cat-behavioral",
    bg: "bg-cat-behavioral/12",
    dot: "bg-cat-behavioral",
  },
  hr: { text: "text-cat-hr", bg: "bg-cat-hr/12", dot: "bg-cat-hr" },
};

export function asCategory(value: string): Category {
  return (CATEGORIES as readonly string[]).includes(value) ? (value as Category) : "technical";
}