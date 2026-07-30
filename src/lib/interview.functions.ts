import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEVELS, MODES, type Category, type Feedback, type Level, type Mode } from "./interview-types";

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        role: z.string().trim().min(2).max(80),
        level: z.enum(LEVELS),
        mode: z.enum(MODES),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { generateQuestions } = await import("./interview.server");
    const questions = await generateQuestions(data.role, data.level as Level, data.mode as Mode);

    const { data: session, error } = await context.supabase
      .from("sessions")
      .insert({
        user_id: context.userId,
        role: data.role,
        level: data.level,
        mode: data.mode,
      })
      .select("id")
      .single();
    if (error || !session) throw new Error(error?.message ?? "Could not start the session.");

    const { error: qError } = await context.supabase
      .from("questions")
      .insert(questions.map((q) => ({ ...q, session_id: session.id })));
    if (qError) throw new Error(qError.message);

    return { sessionId: session.id as string };
  });

export const getSessionDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase
      .from("sessions")
      .select("id, role, level, mode, overall_score, completed_at, created_at")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Session not found.");

    const { data: questions, error: qError } = await context.supabase
      .from("questions")
      .select("id, question_text, category, order_index, answers(id, answer_text, input_mode, score, feedback_json)")
      .eq("session_id", data.sessionId)
      .order("order_index");
    if (qError) throw new Error(qError.message);

    return {
      session,
      questions: (questions ?? []).map((q) => {
        const answer = Array.isArray(q.answers) ? q.answers[0] : q.answers;
        return {
          id: q.id as string,
          question_text: q.question_text as string,
          category: q.category as Category,
          order_index: q.order_index as number,
          answer: answer
            ? {
                answer_text: answer.answer_text as string,
                input_mode: answer.input_mode as string,
                score: answer.score === null ? null : Number(answer.score),
                feedback: (answer.feedback_json ?? null) as Feedback | null,
              }
            : null,
        };
      }),
    };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questionId: z.string().uuid(),
        answerText: z.string().trim().min(10).max(6000),
        inputMode: z.enum(["text", "voice"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: question, error } = await context.supabase
      .from("questions")
      .select("id, question_text, category, sessions(role, level)")
      .eq("id", data.questionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!question) throw new Error("Question not found.");

    const session = (Array.isArray(question.sessions) ? question.sessions[0] : question.sessions) as {
      role: string;
      level: string;
    };

    const { evaluateAnswer } = await import("./interview.server");
    const feedback = await evaluateAnswer({
      role: session.role,
      level: session.level as Level,
      question: question.question_text as string,
      category: question.category as Category,
      answer: data.answerText,
    });

    const { error: upsertError } = await context.supabase.from("answers").upsert(
      {
        question_id: data.questionId,
        answer_text: data.answerText,
        input_mode: data.inputMode,
        score: feedback.score,
        feedback_json: feedback,
      },
      { onConflict: "question_id" },
    );
    if (upsertError) throw new Error(upsertError.message);

    return feedback;
  });

export const finishSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("questions")
      .select("id, answers(score)")
      .eq("session_id", data.sessionId);
    if (error) throw new Error(error.message);

    const scores = (rows ?? [])
      .map((row) => {
        const answer = Array.isArray(row.answers) ? row.answers[0] : row.answers;
        return answer?.score === null || answer?.score === undefined ? null : Number(answer.score);
      })
      .filter((score): score is number => score !== null);

    const overall = scores.length
      ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
      : 0;

    const { error: updateError } = await context.supabase
      .from("sessions")
      .update({ overall_score: overall, completed_at: new Date().toISOString() })
      .eq("id", data.sessionId);
    if (updateError) throw new Error(updateError.message);

    return { overall, answered: scores.length };
  });

export const listSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sessions")
      .select("id, role, level, mode, overall_score, completed_at, created_at, questions(id, category, answers(score))")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    return (data ?? []).map((session) => {
      const questions = session.questions ?? [];
      const answered = questions.filter((q) => {
        const answer = Array.isArray(q.answers) ? q.answers[0] : q.answers;
        return answer?.score !== null && answer?.score !== undefined;
      });
      const weakByCategory: Record<string, { total: number; count: number }> = {};
      for (const q of questions) {
        const answer = Array.isArray(q.answers) ? q.answers[0] : q.answers;
        if (answer?.score === null || answer?.score === undefined) continue;
        const bucket = (weakByCategory[q.category as string] ??= { total: 0, count: 0 });
        bucket.total += Number(answer.score);
        bucket.count += 1;
      }
      return {
        id: session.id as string,
        role: session.role as string,
        level: session.level as string,
        mode: session.mode as string,
        overall_score: session.overall_score === null ? null : Number(session.overall_score),
        completed_at: session.completed_at as string | null,
        created_at: session.created_at as string,
        total_questions: questions.length,
        answered_questions: answered.length,
        category_scores: Object.fromEntries(
          Object.entries(weakByCategory).map(([key, value]) => [
            key,
            Math.round((value.total / value.count) * 10) / 10,
          ]),
        ) as Record<string, number>,
      };
    });
  });

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, target_role, created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fullName: z.string().trim().max(80).optional(),
        targetRole: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, full_name: data.fullName ?? null, target_role: data.targetRole ?? null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });