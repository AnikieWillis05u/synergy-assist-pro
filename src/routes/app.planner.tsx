import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarRange,
  Compass,
  ListChecks,
  Loader2,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Markdown, PageHeader } from "@/components/common";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { generateTaskPlan, prioritizeTasks } from "@/lib/ai.functions";
import { buildContext, useStore } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";

export const Route = createFileRoute("/app/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Describe a goal and get a prioritised, scheduled task plan with subtasks, estimates and dependencies.",
      },
      { property: "og:title", content: "AI Task Planner" },
      { property: "og:description", content: "Turn any goal into an executable plan in seconds." },
    ],
  }),
  component: PlannerPage,
});

const COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: "todo", label: "To Do" },
  { status: "in-progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
];

const AI_ACTIONS = [
  { mode: "prioritize", label: "Prioritize Tasks", icon: ListChecks },
  { mode: "schedule", label: "Create Schedule", icon: CalendarRange },
  { mode: "improve", label: "Improve My Plan", icon: Wand2 },
  { mode: "next", label: "Find Next Best Task", icon: Compass },
] as const;

function PlannerPage() {
  const store = useStore();
  const { tasks } = store;
  const [goal, setGoal] = useState("");
  const [planning, setPlanning] = useState(false);
  const [advising, setAdvising] = useState<string | null>(null);
  const [advice, setAdvice] = useState<{ label: string; text: string } | null>(null);

  const breakDown = async () => {
    if (goal.trim().length < 8) {
      toast.error("Describe your goal in a bit more detail");
      return;
    }
    setPlanning(true);
    try {
      const res = await generateTaskPlan({ data: { goal, context: buildContext(store) } });
      store.addTasks(
        res.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          estimatedTime: t.estimatedTime,
          dueDate: t.dueDate || null,
          project: goal.slice(0, 40),
          dependencies: t.dependencies ?? [],
          subtasks: (t.subtasks ?? []).map((s, i) => ({
            id: `s_${Date.now()}_${i}`,
            title: s,
            done: false,
          })),
          source: "AI Planner",
        })),
      );
      store.bumpAi();
      store.pushNotification({
        title: "Plan generated",
        body: `${res.tasks.length} tasks created for "${goal.slice(0, 40)}".`,
        kind: "ai",
      });
      setGoal("");
      toast.success(
        res.demo ? `${res.tasks.length} tasks created (demo mode)` : `${res.tasks.length} tasks created`,
      );
    } catch (error) {
      toast.error("Could not build the plan", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setPlanning(false);
    }
  };

  const runAdvice = async (mode: (typeof AI_ACTIONS)[number]["mode"], label: string) => {
    setAdvising(mode);
    setAdvice(null);
    try {
      const res = await prioritizeTasks({ data: { mode, context: buildContext(store) } });
      setAdvice({ label, text: res.text });
      store.bumpAi();
    } catch (error) {
      toast.error("AI request failed", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setAdvising(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Task Planner"
        description="Turn goals into structured, prioritised work — then track it on a Kanban board."
      />

      <Card className="border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Target className="size-5 text-primary" /> What are you trying to achieve?
          </CardTitle>
          <CardDescription>
            e.g. "Prepare a marketing presentation for next week's client meeting."
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your goal or project..."
            className="min-h-24"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void breakDown()} disabled={planning} className="rounded-xl">
              {planning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {planning ? "Planning..." : "Break Goal Into Tasks"}
            </Button>
            {AI_ACTIONS.map((a) => (
              <Button
                key={a.mode}
                variant="outline"
                className="rounded-xl"
                disabled={advising !== null}
                onClick={() => void runAdvice(a.mode, a.label)}
              >
                {advising === a.mode ? <Loader2 className="size-4 animate-spin" /> : <a.icon className="size-4" />}
                {a.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {planning ? (
        <Card className="border-border/70 shadow-soft">
          <CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="size-4 animate-spin text-primary" /> Designing your plan...
            </p>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      ) : null}

      {advice ? (
        <Card className="border-primary/30 bg-primary/5 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Sparkles className="size-5 text-primary" /> {advice.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown content={advice.text} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.status);
          return (
            <section key={col.status} className="rounded-2xl border border-border/70 bg-card/60 p-3">
              <header className="flex items-center justify-between px-1 pb-3">
                <h3 className="font-display text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {items.length}
                </span>
              </header>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                    Nothing here yet
                  </p>
                ) : (
                  items.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
