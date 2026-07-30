import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { startSession } from "@/lib/interview.functions";
import { LEVELS, MODES, ROLES, type Level, type Mode } from "@/lib/interview-types";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "New practice session — InterviewAI" },
      {
        name: "description",
        content: "Pick a role, level and question mode to start an AI interview session.",
      },
      { property: "og:title", content: "New practice session — InterviewAI" },
      {
        property: "og:description",
        content: "Pick a role, level and question mode to start an AI interview session.",
      },
    ],
  }),
  component: Practice,
});

const levelLabels: Record<Level, string> = { fresher: "Fresher", experienced: "Experienced" };
const modeLabels: Record<Mode, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  mixed: "Mixed",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-glow"
          : "bg-surface-2 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Practice() {
  const navigate = useNavigate();
  const start = useServerFn(startSession);
  const [role, setRole] = useState<string>(ROLES[0]);
  const [customRole, setCustomRole] = useState("");
  const [level, setLevel] = useState<Level>("fresher");
  const [mode, setMode] = useState<Mode>("mixed");

  const mutation = useMutation({
    mutationFn: () =>
      start({ data: { role: (customRole.trim() || role).slice(0, 80), level, mode } }),
    onSuccess: ({ sessionId }) => navigate({ to: "/session/$sessionId", params: { sessionId } }),
    onError: (error: Error) => toast.error(error.message || "Could not generate questions."),
  });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-hero-gradient p-9 shadow-glow">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
          New session
        </p>
        <h1 className="mt-3 max-w-md font-display text-4xl leading-tight text-primary-foreground">
          What are you interviewing for?
        </h1>
      </section>

      <section className="rounded-[24px] bg-card p-8 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Role
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {ROLES.map((item) => (
            <Chip
              key={item}
              active={!customRole.trim() && role === item}
              onClick={() => {
                setCustomRole("");
                setRole(item);
              }}
            >
              {item}
            </Chip>
          ))}
        </div>
        <input
          value={customRole}
          onChange={(e) => setCustomRole(e.target.value)}
          placeholder="Or type another role…"
          maxLength={80}
          className="mt-4 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Experience level
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEVELS.map((item) => (
            <Chip key={item} active={level === item} onClick={() => setLevel(item)}>
              {levelLabels[item]}
            </Chip>
          ))}
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Question mode
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {MODES.map((item) => (
            <Chip key={item} active={mode === item} onClick={() => setMode(item)}>
              {modeLabels[item]}
            </Chip>
          ))}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-70 sm:w-auto"
        >
          {mutation.isPending ? (
            <>
              <Loader2 strokeWidth={1.5} className="size-4 animate-spin" />
              Generating your question set…
            </>
          ) : (
            <>
              Generate questions
              <ArrowRight strokeWidth={1.5} className="size-4" />
            </>
          )}
        </button>
      </section>
    </div>
  );
}