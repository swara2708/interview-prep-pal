import { z } from "zod";

import { callJson } from "./ai.server";
import type { Category, Feedback, Level, Mode } from "./interview-types";

const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(8),
        category: z.enum(["technical", "behavioral", "hr"]),
      }),
    )
    .min(5)
    .max(10),
});

const feedbackSchema = z.object({
  score: z.number().min(0).max(10),
  strengths: z.array(z.string()).max(5),
  gaps: z.array(z.string()).max(5),
  rewrittenExample: z.string().min(20),
});

export async function generateQuestions(role: string, level: Level, mode: Mode) {
  const mix =
    mode === "technical"
      ? "All questions must be category \"technical\"."
      : mode === "behavioral"
        ? "Use categories \"behavioral\" and \"hr\" only."
        : "Mix categories: roughly half \"technical\", the rest split between \"behavioral\" and \"hr\".";

  const result = await callJson(
    [
      {
        role: "system",
        content:
          "You are an expert interview coach. Reply with ONLY a JSON object of the shape " +
          '{"questions":[{"question":string,"category":"technical"|"behavioral"|"hr"}]}. No prose.',
      },
      {
        role: "user",
        content: `Write exactly 6 realistic interview questions for a ${level} candidate applying for a ${role} position. ${mix} Questions must be specific to the role, answerable in 2-4 spoken minutes, and free of numbering or prefixes.`,
      },
    ],
    (value) => questionsSchema.parse(value),
  );

  return result.questions.map((q, index) => ({
    question_text: q.question.trim(),
    category: q.category as Category,
    order_index: index,
  }));
}

export async function evaluateAnswer(input: {
  role: string;
  level: Level;
  question: string;
  category: Category;
  answer: string;
}): Promise<Feedback> {
  const rubric =
    input.category === "behavioral"
      ? "Grade with the STAR method: is there a clear Situation, Task, Action and Result? Reward specificity and measurable outcomes."
      : input.category === "hr"
        ? "Grade on self-awareness, honesty, motivation fit and professionalism. Penalise generic or evasive answers."
        : "Grade on technical correctness first, then clarity, structure, depth and use of concrete examples. Flag any factual mistakes explicitly.";

  return callJson(
    [
      {
        role: "system",
        content:
          "You are a strict but constructive interview evaluator. Reply with ONLY a JSON object of the shape " +
          '{"score":number 0-10,"strengths":string[],"gaps":string[],"rewrittenExample":string}. ' +
          "Give 1-3 strengths and 1-3 gaps as short phrases. rewrittenExample is a strong model answer in the candidate's first person, under 180 words. No prose outside the JSON.",
      },
      {
        role: "user",
        content: `Role: ${input.role}\nLevel: ${input.level}\nCategory: ${input.category}\nRubric: ${rubric}\n\nQuestion: ${input.question}\n\nCandidate answer: """${input.answer}"""`,
      },
    ],
    (value) => feedbackSchema.parse(value) as Feedback,
  );
}