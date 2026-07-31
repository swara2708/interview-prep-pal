import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import { Loader2 } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { useRealtimeSessions } from "@/hooks/use-realtime-session";
import { listSessions } from "@/lib/interview.functions";
import { CATEGORIES, asCategory, categoryLabel, categoryStyles } from "@/lib/interview-types";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Score history — InterviewAI" },
      {
        name: "description",
        content: "Track your interview scores over time and spot recurring weak areas.",
      },
      { property: "og:title", content: "Score history — InterviewAI" },
      {
        property: "og:description",
        content: "Track your interview scores over time and spot recurring weak areas.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const queryClient = useQueryClient();
  const fetchSessions = useServerFn(listSessions);
  const { data, isPending } = useQuery({ queryKey: ["sessions"], queryFn: () => fetchSessions() });

  const refetchSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
  }, [queryClient]);

  useRealtimeSessions(refetchSessions);

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 strokeWidth={1.5} className="size-5 animate-spin" />
      </div>
    );
  }

  const sessions = data ?? [];
  const completed = sessions.filter((s) => s.overall_score !== null);
  const average = completed.length
    ? Math.round(
        (completed.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / completed.length) * 10,
      ) / 10
    : 0;

  const categoryTotals: Record<string, { total: number; count: number }> = {};
  for (const session of sessions) {
    for (const [category, score] of Object.entries(session.category_scores)) {
      const bucket = (categoryTotals[category] ??= { total: 0, count: 0 });
      bucket.total += score;
      bucket.count += 1;
    }
  }
  const weakAreas = Object.entries(categoryTotals)
    .map(([category, value]) => ({
      category: asCategory(category),
      score: Math.round((value.total / value.count) * 10) / 10,
    }))
    .sort((a, b) => a.score - b.score);

  const chartData = [...completed].reverse().slice(-12);

  if (!sessions.length) {
    return (
      <div className="rounded-[24px] bg-card p-10 text-center shadow-card">
        <h1 className="font-display text-2xl">No sessions yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete a practice session and your score trend will appear here.
        </p>
        <Link
          to="/practice"
          className="mt-6 inline-block rounded-full bg-hero-gradient px-6 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Start practising
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-tight">Your progress</h1>

      <section className="flex flex-wrap items-center gap-10 rounded-[24px] bg-card p-8 shadow-card">
        <ScoreRing value={average} label="Average" />
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-4xl font-extrabold tabular-nums">{sessions.length}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold tabular-nums">
              {sessions.reduce((sum, s) => sum + s.answered_questions, 0)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Answers scored
            </p>
          </div>
        </div>
      </section>

      {chartData.length > 0 && (
        <section className="rounded-[24px] bg-card p-8 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Score over time
          </h2>
          <div className="mt-8 flex h-48 items-end gap-3">
            {chartData.map((session) => (
              <div key={session.id} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-xl bg-cat-overall/85"
                    style={{ height: `${((session.overall_score ?? 0) / 10) * 100}%` }}
                    title={`${session.overall_score}/10`}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {new Date(session.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-5 border-t border-border pt-5">
            {CATEGORIES.map((category) => (
              <span
                key={category}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className={`size-2 rounded-full ${categoryStyles[category].dot}`} />
                {categoryLabel[category]}
              </span>
            ))}
          </div>
        </section>
      )}

      {weakAreas.length > 0 && (
        <section className="rounded-[24px] bg-card p-8 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recurring weak areas
          </h2>
          <div className="mt-5 space-y-4">
            {weakAreas.map(({ category, score }) => (
              <div key={category}>
                <div className="flex items-center justify-between text-sm">
                  <span className={categoryStyles[category].text}>{categoryLabel[category]}</span>
                  <span className="font-semibold tabular-nums">{score.toFixed(1)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${categoryStyles[category].dot}`}
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to="/session/$sessionId"
            params={{ sessionId: session.id }}
            className="flex items-center gap-5 rounded-[24px] bg-card p-6 shadow-card transition-colors hover:bg-surface-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{session.role}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {session.level} · {session.mode} · {session.answered_questions}/
                {session.total_questions} answered ·{" "}
                {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="text-2xl font-extrabold tabular-nums text-cat-overall">
              {session.overall_score !== null ? session.overall_score.toFixed(1) : "—"}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
