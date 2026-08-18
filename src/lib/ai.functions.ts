import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  AiUnavailableError,
  callGateway,
  mockChat,
  mockPlan,
  mockSummary,
  parseJson,
  type PlanTask,
} from "./ai.server";
import type { MeetingSummary } from "./types";

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().default(""),
        attendees: z.string().default(""),
        date: z.string().default(""),
        type: z.string().default(""),
        transcript: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ summary: MeetingSummary; demo: boolean }> => {
    try {
      const raw = await callGateway(
        [
          {
            role: "system",
            content:
              "You are an expert executive assistant. Summarise meeting notes into strict JSON with keys: overview (string), keyPoints (string[]), decisions (string[]), actionItems (array of {task, owner, deadline (YYYY-MM-DD), priority: low|medium|high|urgent}), followUps (string[]), openQuestions (string[]). Return JSON only.",
          },
          {
            role: "user",
            content: `Title: ${data.title}\nDate: ${data.date}\nType: ${data.type}\nAttendees: ${data.attendees}\n\nNotes/Transcript:\n${data.transcript}`,
          },
        ],
        true,
      );
      const parsed = parseJson<MeetingSummary>(raw);
      return {
        summary: {
          overview: parsed.overview ?? "",
          keyPoints: parsed.keyPoints ?? [],
          decisions: parsed.decisions ?? [],
          actionItems: (parsed.actionItems ?? []).map((a, i) => ({
            id: `a_${Date.now()}_${i}`,
            task: a.task,
            owner: a.owner || "Unassigned",
            deadline: a.deadline || "",
            priority: a.priority || "medium",
          })),
          followUps: parsed.followUps ?? [],
          openQuestions: parsed.openQuestions ?? [],
        },
        demo: false,
      };
    } catch (error) {
      if (error instanceof AiUnavailableError || error instanceof SyntaxError) {
        return { summary: mockSummary(data.title, data.transcript), demo: true };
      }
      throw error;
    }
  });

export const generateTaskPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ goal: z.string().min(1), context: z.string().default("") }).parse(input),
  )
  .handler(async ({ data }): Promise<{ goal: string; tasks: PlanTask[]; demo: boolean }> => {
    try {
      const raw = await callGateway(
        [
          {
            role: "system",
            content:
              "You are a senior project planner. Turn a goal into an actionable plan. Return strict JSON: {\"goal\": string, \"tasks\": [{\"title\": string, \"description\": string, \"priority\": \"low\"|\"medium\"|\"high\"|\"urgent\", \"estimatedTime\": string, \"dueDate\": \"YYYY-MM-DD\", \"subtasks\": string[], \"dependencies\": string[]}]}. Produce 4-7 tasks ordered by execution sequence. JSON only.",
          },
          {
            role: "user",
            content: `Today is ${new Date().toISOString().slice(0, 10)}.\nGoal: ${data.goal}\n${data.context ? `Existing workload:\n${data.context}` : ""}`,
          },
        ],
        true,
      );
      const parsed = parseJson<{ goal?: string; tasks?: PlanTask[] }>(raw);
      return { goal: parsed.goal || data.goal, tasks: parsed.tasks ?? [], demo: false };
    } catch (error) {
      if (error instanceof AiUnavailableError || error instanceof SyntaxError) {
        return { ...mockPlan(data.goal), demo: true };
      }
      throw error;
    }
  });

export const prioritizeTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        mode: z.enum(["prioritize", "schedule", "improve", "next"]),
        context: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ text: string; demo: boolean }> => {
    const instructions: Record<string, string> = {
      prioritize:
        "Re-rank the user's tasks by urgency, importance, deadlines and dependencies. Explain the top 3 briefly.",
      schedule: "Produce a realistic day-by-day schedule for the next 5 working days.",
      improve: "Critique the plan and suggest concrete improvements, missing steps and risks.",
      next: "Recommend the single next best task to work on right now, and why.",
    };
    try {
      const text = await callGateway([
        {
          role: "system",
          content: `You are a productivity coach. ${instructions[data.mode]} Answer in concise markdown.`,
        },
        { role: "user", content: data.context },
      ]);
      return { text, demo: false };
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        return {
          text: `**Demo mode**\n\n${instructions[data.mode]}\n\nBased on your current list, start with the overdue and urgent items first, then the work due within 48 hours, then anything blocking a teammate.`,
          demo: true,
        };
      }
      throw error;
    }
  });

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
        context: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ text: string; demo: boolean }> => {
    const last = data.messages[data.messages.length - 1]?.content ?? "";
    try {
      const text = await callGateway([
        {
          role: "system",
          content:
            "You are the AI Workplace Productivity Assistant: a warm, concise, professional workplace copilot. You help with emails, summaries, task lists, agendas, reports, brainstorming and prioritisation. Use markdown. When the user's productivity data is provided, ground your answer in it.",
        },
        ...(data.context
          ? [{ role: "system" as const, content: `User's current data:\n${data.context}` }]
          : []),
        ...data.messages.slice(-12),
      ]);
      return { text, demo: false };
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        return { text: mockChat(last, data.context), demo: true };
      }
      throw error;
    }
  });

export const generateActionItems = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ text: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<{ items: string[]; demo: boolean }> => {
    try {
      const raw = await callGateway(
        [
          {
            role: "system",
            content:
              'Extract concrete action items from the text. Return strict JSON: {"items": string[]}. JSON only.',
          },
          { role: "user", content: data.text },
        ],
        true,
      );
      const parsed = parseJson<{ items?: string[] }>(raw);
      return { items: parsed.items ?? [], demo: false };
    } catch (error) {
      if (error instanceof AiUnavailableError || error instanceof SyntaxError) {
        return { items: ["Follow up with attendees", "Prepare the agreed document"], demo: true };
      }
      throw error;
    }
  });
