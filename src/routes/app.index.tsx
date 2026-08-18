import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BotMessageSquare,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader, PriorityBadge, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "See your productivity at a glance: tasks completed, pending work, meetings summarized and AI interactions.",
      },
      { property: "og:title", content: "Productivity Dashboard" },
      { property: "og:description", content: "Your workday overview, powered by AI." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { user, tasks, meetings, conversations, aiInteractions } = useStore();

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed");
    const pending = tasks.filter((t) => t.status !== "completed");
    const weekAgo = Date.now() - 7 * 86400000;
    const completedThisWeek = completed.filter(
      (t) => t.completedAt && new Date(t.completedAt).getTime() > weekAgo,
    ).length;
    const rate = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
    return { completed: completed.length, pending: pending.length, completedThisWeek, rate };
  }, [tasks]);

  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const base = [3, 5, 2, 6, 4, 1, 2];
    return days.map((d, i) => ({
      day: d,
      completed: (base[i] ?? 0) + (i === new Date().getDay() ? stats.completedThisWeek : 0),
    }));
  }, [stats.completedThisWeek]);

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "completed" && t.dueDate)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
        .slice(0, 5),
    [tasks],
  );

  const activity = useMemo(() => {
    const items: Array<{ id: string; label: string; time: string; icon: typeof ListTodo }> = [
      ...tasks.slice(0, 3).map((t) => ({
        id: `t-${t.id}`,
        label: `Task: ${t.title}`,
        time: new Date(t.createdAt).toLocaleDateString(),
        icon: ListTodo,
      })),
      ...meetings.slice(0, 2).map((m) => ({
        id: `m-${m.id}`,
        label: `Summarized: ${m.title}`,
        time: m.date,
        icon: ClipboardList,
      })),
      ...conversations.slice(0, 2).map((c) => ({
        id: `c-${c.id}`,
        label: `Chat: ${c.title}`,
        time: new Date(c.updatedAt).toLocaleDateString(),
        icon: BotMessageSquare,
      })),
    ];
    return items.slice(0, 6);
  }, [tasks, meetings, conversations]);

  return (
    <div className="space-y-6">
      <div className="bg-surface-gradient relative overflow-hidden rounded-3xl border border-border/60 p-6 shadow-soft sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-medium text-primary">{greeting()}, {user.name.split(" ")[0]} 👋</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            You have {stats.pending} open tasks and {meetings.length} summarized meetings.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One AI assistant for your entire workday — summarize, plan and act without switching tools.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="rounded-xl">
              <Link to="/app/summarizer">
                <ClipboardList className="size-4" /> Summarize Meeting
              </Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link to="/app/planner">
                <Sparkles className="size-4" /> Create Task Plan
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/app/chat">
                <BotMessageSquare className="size-4" /> Ask AI
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tasks completed" value={stats.completed} hint={`${stats.completedThisWeek} this week`} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending tasks" value={stats.pending} hint="Across all projects" icon={ListTodo} />
        <StatCard label="Meetings summarized" value={meetings.length} hint="Saved to history" icon={CalendarClock} tone="accent" />
        <StatCard label="AI interactions" value={aiInteractions} hint="This month" icon={Sparkles} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Productivity trend</CardTitle>
            <CardDescription>Tasks completed over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    color: "var(--color-card-foreground)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#fillCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Completion rate</CardTitle>
            <CardDescription>All tracked tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-4xl font-semibold">{stats.rate}%</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <TrendingUp className="size-3.5" /> on track
                </span>
              </div>
              <Progress value={stats.rate} className="mt-3" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed this week</span>
                <span className="font-medium">{stats.completedThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI conversations</span>
                <span className="font-medium">{conversations.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-soft">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-display text-lg">Up next</CardTitle>
              <CardDescription>Closest deadlines</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/app/tasks">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No scheduled tasks.</p>
            ) : (
              upcoming.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.project} · due {t.dueDate}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
            <CardDescription>Everything your assistant touched</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                    <a.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
