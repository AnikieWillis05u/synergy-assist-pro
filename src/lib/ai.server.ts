import type { MeetingSummary, Priority } from "./types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AiUnavailableError extends Error {}

export async function callGateway(messages: GatewayMessage[], jsonMode = false): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiUnavailableError("Missing LOVABLE_API_KEY");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("The AI assistant is rate limited. Try again shortly.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted. Add credits in Lovable to continue.");
    if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
    throw new AiUnavailableError(`Gateway error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const inDays = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const sentences = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

/** Deterministic offline fallback so the product is always usable. */
export function mockSummary(title: string, transcript: string): MeetingSummary {
  const s = sentences(transcript);
  const pick = (i: number, fallback: string) => s[i] ?? fallback;
  return {
    overview:
      `Demo summary for "${title || "Untitled meeting"}". ` +
      pick(0, "The team reviewed progress, agreed on the next milestones and assigned owners."),
    keyPoints: [
      pick(1, "Current progress was reviewed against the plan."),
      pick(2, "Risks and blockers were discussed openly."),
      pick(3, "Next milestones were confirmed with the team."),
    ],
    decisions: [
      pick(4, "Proceed with the agreed plan for the coming sprint."),
      "Owners were confirmed for each workstream.",
    ],
    actionItems: [
      {
        id: uid("a"),
        task: "Share the meeting summary with all attendees",
        owner: "You",
        deadline: inDays(1),
        priority: "high" as Priority,
      },
      {
        id: uid("a"),
        task: "Prepare the follow-up document discussed",
        owner: "You",
        deadline: inDays(4),
        priority: "medium" as Priority,
      },
    ],
    followUps: ["Confirm availability for the follow-up session.", "Circulate supporting documents."],
    openQuestions: ["Which stakeholder signs off on the final scope?"],
  };
}

export interface PlanTask {
  title: string;
  description: string;
  priority: Priority;
  estimatedTime: string;
  dueDate: string;
  subtasks: string[];
  dependencies: string[];
}

export function mockPlan(goal: string): { goal: string; tasks: PlanTask[] } {
  return {
    goal,
    tasks: [
      {
        title: "Clarify scope and success criteria",
        description: `Define what "done" looks like for: ${goal}`,
        priority: "high",
        estimatedTime: "45m",
        dueDate: inDays(1),
        subtasks: ["List required outcomes", "Confirm stakeholders"],
        dependencies: [],
      },
      {
        title: "Gather inputs and research",
        description: "Collect the data, assets and references needed to execute.",
        priority: "medium",
        estimatedTime: "2h",
        dueDate: inDays(2),
        subtasks: ["Collect existing material", "Note gaps"],
        dependencies: ["Clarify scope and success criteria"],
      },
      {
        title: "Produce the first draft",
        description: "Build a rough but complete version to react to.",
        priority: "high",
        estimatedTime: "3h",
        dueDate: inDays(4),
        subtasks: ["Outline structure", "Write the draft"],
        dependencies: ["Gather inputs and research"],
      },
      {
        title: "Review, refine and deliver",
        description: "Incorporate feedback and ship the final version.",
        priority: "urgent",
        estimatedTime: "1.5h",
        dueDate: inDays(6),
        subtasks: ["Collect feedback", "Apply edits", "Send final version"],
        dependencies: ["Produce the first draft"],
      },
    ],
  };
}

export function mockChat(prompt: string, context: string): string {
  return [
    "**Demo mode response**",
    "",
    `Here's how I'd approach "${prompt.slice(0, 120)}":`,
    "",
    "1. Clarify the outcome you need and who it's for.",
    "2. Break the work into two or three concrete steps.",
    "3. Start with the highest-impact step today, and schedule the rest.",
    "",
    context ? "_I can see your current tasks and meetings and factored them in._" : "",
    "",
    "_Live AI is not configured right now, so this is a mock response._",
  ]
    .filter(Boolean)
    .join("\n");
}
