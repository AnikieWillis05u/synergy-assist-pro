import { createFileRoute } from "@tanstack/react-router";
import { ListTodo, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/common";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Filter and sort every task by priority, due date, status and project in one workspace.",
      },
      { property: "og:title", content: "My Tasks" },
      { property: "og:description", content: "All your work, organised and prioritised by AI." },
    ],
  }),
  component: TasksPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function TasksPage() {
  const { tasks, addTask } = useStore();
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("due");
  const [project, setProject] = useState("all");
  const [quick, setQuick] = useState("");

  const projects = useMemo(() => Array.from(new Set(tasks.map((t) => t.project))), [tasks]);

  const filtered = useMemo(() => {
    const t0 = today();
    const rank = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
    let list = tasks.filter((t) => (project === "all" ? true : t.project === project));
    if (tab === "today") list = list.filter((t) => t.dueDate === t0 && t.status !== "completed");
    if (tab === "upcoming") list = list.filter((t) => (t.dueDate ?? "") > t0 && t.status !== "completed");
    if (tab === "overdue") list = list.filter((t) => t.dueDate && t.dueDate < t0 && t.status !== "completed");
    if (tab === "completed") list = list.filter((t) => t.status === "completed");
    return [...list].sort((a, b) => {
      if (sort === "priority") return rank[a.priority] - rank[b.priority];
      if (sort === "status") return a.status.localeCompare(b.status);
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
  }, [tasks, tab, sort, project]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Tasks" description="Everything on your plate, filtered the way you work." />

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-soft sm:flex-row sm:items-center">
        <Input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder="Add a quick task and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" && quick.trim()) {
              addTask({ title: quick.trim(), dueDate: today() });
              setQuick("");
              toast.success("Task added");
            }
          }}
        />
        <Button
          className="rounded-xl"
          onClick={() => {
            if (!quick.trim()) return;
            addTask({ title: quick.trim(), dueDate: today() });
            setQuick("");
            toast.success("Task added");
          }}
        >
          <Plus className="size-4" /> Add task
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            {[
              ["all", "All"],
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["overdue", "Overdue"],
              ["completed", "Completed"],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v as string}>
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due">Sort: Due date</SelectItem>
              <SelectItem value="priority">Sort: Priority</SelectItem>
              <SelectItem value="status">Sort: Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks here"
          description="Nothing matches this view. Create a plan with the AI planner or add a task above."
          actionLabel="Open AI Planner"
          actionTo="/app/planner"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
