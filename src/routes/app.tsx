import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your AI workspace for meeting summaries, task planning and a productivity chat assistant.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "One AI assistant for meetings, tasks and everyday work.",
      },
    ],
  }),
  component: AppShell,
});
