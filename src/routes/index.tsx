import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Mic, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewAI — Practice interviews with an AI coach" },
      {
        name: "description",
        content:
          "Pick a role and level, answer AI-generated interview questions by text or voice, and get scored feedback with model answers.",
      },
      { property: "og:title", content: "InterviewAI — Practice interviews with an AI coach" },
      {
        property: "og:description",
        content:
          "Pick a role and level, answer AI-generated interview questions by text or voice, and get scored feedback with model answers.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Sparkles,
    title: "Role-aware questions",
    body: "Technical, behavioral and HR questions generated for your exact role and level.",
  },
  {
    icon: Mic,
    title: "Answer by voice or text",
    body: "Speak your answer like a real interview, or type it — whichever you prefer.",
  },
  {
    icon: TrendingUp,
    title: "Scores that track",
    body: "Every answer is scored 0–10 with strengths, gaps and a rewritten model answer.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-5xl items-center px-5">
        <span className="font-display text-xl tracking-tight">
          Interview<span className="text-primary">AI</span>
        </span>
        <Link
          to="/auth"
          className="ml-auto rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24">
        <section className="relative overflow-hidden rounded-[28px] bg-hero-gradient px-8 py-16 shadow-glow sm:px-14 sm:py-24">
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
              AI interview coach
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] text-primary-foreground sm:text-6xl">
              Rehearse the interview before it happens.
            </h1>
            <p className="mt-5 max-w-lg text-base text-primary-foreground/85">
              Choose a role and level, answer a tailored question set, and get an honest score with
              a rewritten model answer for every response.
            </p>
            <Link
              to="/auth"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-transform hover:scale-[1.02]"
            >
              Start practising
              <ArrowRight strokeWidth={1.5} className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[24px] bg-card p-7 shadow-card">
              <Icon strokeWidth={1.5} className="size-5 text-primary" />
              <h2 className="mt-5 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
