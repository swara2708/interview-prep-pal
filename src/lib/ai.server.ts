const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

type Message = { role: "system" | "user"; content: string };

async function callGateway(messages: Message[]): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured yet.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (response.status === 429) {
    throw new Error("AI rate limit reached. Please wait a moment and try again.");
  }
  if (response.status === 402) {
    throw new Error("AI credits exhausted. Add credits in your workspace to continue.");
  }
  if (!response.ok) {
    const body = await response.text();
    console.error(`[ai] gateway ${response.status}: ${body}`);
    throw new Error(`AI request failed (${response.status}).`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

function extractJson(raw: string): unknown {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(trimmed);
}

/** Calls the model and validates the JSON payload, retrying once when malformed. */
export async function callJson<T>(
  messages: Message[],
  validate: (value: unknown) => T,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGateway(
      attempt === 0
        ? messages
        : [
            ...messages,
            {
              role: "user" as const,
              content:
                "Your previous reply was not valid JSON matching the required shape. Reply again with ONLY the raw JSON object.",
            },
          ],
    );
    try {
      return validate(extractJson(raw));
    } catch (error) {
      lastError = error;
      console.error("[ai] invalid JSON output", error);
    }
  }
  throw new Error(`The AI returned an unexpected response. ${String(lastError)}`);
}
