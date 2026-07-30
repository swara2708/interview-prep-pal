# Interview Prep Pal

Build "InterviewAI" — an AI-powered interview practice platform.

## Product

A web app where users pick a job role and experience level, get an AI-generated

set of interview questions (technical, behavioral, HR), answer by text or voice,

and receive structured AI feedback with a score and a rewritten example answer.

Users can track their score history across sessions.

## Core user flow

1. Sign up / log in (Supabase Auth)

2. Select role (e.g. Frontend Developer, Data Analyst, HR Fresher) + level

   (fresher/experienced) + mode (technical/behavioral/mixed)

3. AI generates 5–10 questions for that role/level/mode

4. User answers each question — text input, with voice input (Web Speech API)

   as an option

5. AI evaluates each answer: score (0–10), strengths, gaps, and a rewritten

   model answer

6. Session summary screen: overall score, per-question breakdown

7. Dashboard: session history, score trend over time, recurring weak areas

## Data model (Supabase/Postgres)

- profiles: id, full_name, target_role, created_at

- sessions: id, user_id, role, level, mode, overall_score, created_at

- questions: id, session_id, question_text, category, order_index

- answers: id, question_id, answer_text, input_mode, score, feedback_json, created_at

Enable Row Level Security on sessions/questions/answers — users can only

read/write their own rows (join through session_id → user_id).

## AI integration

- Question generation: given role + level + mode, return a strict JSON array

  of questions tagged by category

- Answer evaluation: given question + answer + category-specific rubric

  (STAR method for behavioral, correctness+clarity for technical), return

  strict JSON: { score, strengths[], gaps[], rewrittenExample }

- Validate AI JSON output before saving; retry once if malformed

## Design system (dark theme)

- Background: near-black (#0B0B0E), cards on slightly lighter dark surface (#151519)

- Primary accent: purple (#8B5CF6), with a violet→lavender gradient (#6D28D9 → #C084FC)

  used on hero/primary-action cards (e.g. the active session card)

- Large soft corner radius on all cards (24–28px), pill-shaped buttons and chips

- Typography: a serif display font (Recoleta-style) for the app name and big

  headline moments only; a clean sans-serif (Aeonik-style) for all UI text,

  numbers, and data

- Category color-coding (like sleep-stage colors, but for interview categories):

  Technical = blue, Behavioral = violet, HR = amber, Overall/score = purple

- Score ring: circular progress indicator (like a "quality %" ring) for overall

  session score, with stat numbers stacked next to it (e.g. score, questions

  answered) in bold Aeonik-style numerals

- Session history: bar/line chart of scores over time, same visual language

  as a sleep-stage bar chart — clean bars, sparse axis labels, small color-coded

  legend row underneath

- Minimal line icons (1.5px stroke) for nav: Practice, History, Profile

## Tech stack

- Next.js (App Router) + React + TypeScript

- Supabase for auth, Postgres database, and RLS

- AI: Groq API for question generation and answer evaluation

- Web Speech API for voice-to-text answer capture (fallback to text input if unsupported)

- Deploy-ready for Vercel, repo on GitHub

## Build priority (MVP first)

Phase 1 (must work for demo): role selection → question generation → text

answer → AI feedback → session summary.

Phase 2: voice input, score history dashboard.

Phase 3 (stretch): resume/JD upload for tailored questions.

Start by scaffolding auth, the role-selection screen, and the question

generation + evaluation flow end-to-end with text input — get that loop

working before adding voice or history.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/00c019a5-1e45-4bd2-a881-fb48c60edd57).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
