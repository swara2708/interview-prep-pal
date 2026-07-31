import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

import { ScoreRing } from "@/components/score-ring";
import { useRealtimeSession } from "@/hooks/use-realtime-session";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { finishSession, getSessionDetail, submitAnswer } from "@/lib/interview.functions";
import { categoryLabel, categoryStyles, type Category } from "@/lib/interview-types";

export const Route = createFileRoute("/_authenticated/session/$sessionId")({
  head: () => ({
    meta: [
      { title: "Interview session — InterviewAI" },
      {
        name: "description",
        content: "Answer your AI-generated interview questions and get scored feedback.",
      },
      { property: "og:title", content: "Interview session — InterviewAI" },
      {
        property: "og:description",
        content: "Answer your AI-generated interview questions and get scored feedback.",
      },
    ],
  }),
  component: SessionPage,
});

function CategoryTag({ category }: { category: Category }) {
  const style = categoryStyles[category];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} />
      {categoryLabel[category]}
    </span>
  );
}

function SessionPage() {
  const { sessionId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchDetail = useServerFn(getSessionDetail);
  const evaluate = useServerFn(submitAnswer);
  const finish = useServerFn(finishSession);

  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");

  const { data, isPending } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchDetail({ data: { sessionId } }),
  });

  const voice = useVoiceInput((text) => {
    setInputMode("voice");
    setDraft((prev) => (prev ? `${prev} ${text}` : text));
  });

  const questions = data?.questions ?? [];
  const current = questions[index];
  const answeredCount = questions.filter((q) => q.answer?.feedback).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  useEffect(() => {
    setDraft(current?.answer?.answer_text ?? "");
  }, [current?.id, current?.answer?.answer_text]);

  const answerMutation = useMutation({
    mutationFn: () =>
      evaluate({ data: { questionId: current!.id, answerText: draft.trim(), inputMode } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
    onError: (error: Error) => toast.error(error.message || "Evaluation failed."),
  });

  const finishMutation = useMutation({
    mutationFn: () => finish({ data: { sessionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 strokeWidth={1.5} className="size-5 animate-spin" />
      </div>
    );
  }
  if (!data || !current) return <p className="text-muted-foreground">Session not found.</p>;

  const summaryScore = data.session.overall_score;
  const feedback = current.answer?.feedback ?? null;

  if (summaryScore !== null && summaryScore !== undefined) {
    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] bg-hero-gradient p-9 shadow-glow">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
            Session summary
          </p>
          <h1 className="mt-3 font-display text-4xl text-primary-foreground">
            {data.session.role}
          </h1>
          <p className="mt-1 text-sm capitalize text-primary-foreground/80">
            {data.session.level} · {data.session.mode}
          </p>
        </section>

        <section className="flex flex-wrap items-center gap-10 rounded-[24px] bg-card p-8 shadow-card">
          <ScoreRing value={Number(summaryScore)} />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-4xl font-extrabold tabular-nums">{answeredCount}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                Answered
              </p>
            </div>
            <div>
              <p className="text-4xl font-extrabold tabular-nums">{questions.length}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                Questions
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-[24px] bg-card p-7 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CategoryTag category={q.category} />
                  <p className="mt-3 font-medium">
                    {i + 1}. {q.question_text}
                  </p>
                </div>
                <span className="text-2xl font-extrabold tabular-nums text-cat-overall">
                  {q.answer?.score?.toFixed(1) ?? "—"}
                </span>
              </div>
              {q.answer?.feedback && (
                <div className="mt-5 space-y-4 border-t border-border pt-5 text-sm">
                  <FeedbackBody feedback={q.answer.feedback} />
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/practice"
            className="rounded-full bg-hero-gradient px-6 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Practise again
          </Link>
          <Link
            to="/history"
            className="rounded-full border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            View history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-hero-gradient p-8 shadow-glow">
        <div className="flex items-center justify-between text-primary-foreground">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
              Active session
            </p>
            <h1 className="mt-2 font-display text-3xl">{data.session.role}</h1>
          </div>
          <p className="text-sm font-semibold tabular-nums">
            {answeredCount}/{questions.length}
          </p>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-background/25">
          <div
            className="h-full rounded-full bg-background transition-all duration-500"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setIndex(i)}
            className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              i === index
                ? "bg-primary text-primary-foreground"
                : q.answer?.feedback
                  ? "bg-surface-2 text-cat-overall"
                  : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {q.answer?.feedback ? <CheckCircle2 strokeWidth={1.5} className="size-4" /> : i + 1}
          </button>
        ))}
      </div>

      <section className="rounded-[24px] bg-card p-8 shadow-card">
        <CategoryTag category={current.category} />
        <h2 className="mt-4 text-xl font-semibold leading-snug">{current.question_text}</h2>

        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setInputMode("text");
          }}
          rows={7}
          placeholder="Type your answer, or use the microphone to speak it…"
          className="mt-6 w-full resize-y rounded-2xl border border-border bg-surface-2 p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => answerMutation.mutate()}
            disabled={answerMutation.isPending || draft.trim().length < 10}
            className="inline-flex items-center gap-2 rounded-full bg-hero-gradient px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {answerMutation.isPending && (
              <Loader2 strokeWidth={1.5} className="size-4 animate-spin" />
            )}
            {feedback ? "Re-evaluate answer" : "Get feedback"}
          </button>

          {voice.supported ? (
            <button
              onClick={voice.toggle}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-3.5 text-sm font-medium transition-colors ${
                voice.listening
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {voice.listening ? (
                <MicOff strokeWidth={1.5} className="size-4" />
              ) : (
                <Mic strokeWidth={1.5} className="size-4" />
              )}
              {voice.listening ? "Stop recording" : "Answer by voice"}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Voice input isn't supported in this browser — type your answer instead.
            </span>
          )}

          {index < questions.length - 1 && (
            <button
              onClick={() => setIndex(index + 1)}
              className="ml-auto rounded-full px-5 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Next question →
            </button>
          )}
        </div>

        {feedback && (
          <div className="mt-8 space-y-5 border-t border-border pt-7">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-extrabold tabular-nums text-cat-overall">
                {feedback.score.toFixed(1)}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                out of 10
              </span>
            </div>
            <FeedbackBody feedback={feedback} />
          </div>
        )}
      </section>

      <button
        onClick={() => finishMutation.mutate()}
        disabled={!allAnswered || finishMutation.isPending}
        className="w-full rounded-full border border-border px-6 py-4 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
      >
        {allAnswered ? "Finish session & see summary" : "Answer every question to finish"}
      </button>
    </div>
  );
}

function FeedbackBody({
  feedback,
}: {
  feedback: { strengths: string[]; gaps: string[]; rewrittenExample: string };
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cat-technical">
            Strengths
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {feedback.strengths.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cat-hr">Gaps</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {feedback.gaps.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl bg-surface-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-cat-behavioral">
          Model answer
        </p>
        <p className="mt-2 text-sm leading-relaxed">{feedback.rewrittenExample}</p>
      </div>
    </>
  );
}
