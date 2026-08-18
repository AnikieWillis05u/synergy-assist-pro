import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BotMessageSquare, ClipboardList, ListTodo, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant | Work Smarter" },
      {
        name: "description",
        content:
          "Summarize meetings, plan projects and chat with an AI assistant that knows your work — one intelligent workplace platform.",
      },
      { property: "og:title", content: "Work Smarter. Get More Done with AI." },
      {
        property: "og:description",
        content: "Your intelligent workplace assistant for meetings, tasks, projects and everyday productivity.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { signIn } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const enter = () => {
    signIn(name.trim() || undefined);
    void navigate({ to: "/app" });
  };

  return (
    <main className="min-h-screen bg-surface-gradient">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> One AI assistant for your entire workday
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Work Smarter. <span className="text-brand">Get More Done with AI.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Your intelligent workplace assistant for meetings, tasks, projects, and everyday productivity.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl" onClick={enter}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl" onClick={enter}>
              Sign In
            </Button>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { icon: ClipboardList, label: "Meeting summaries", hint: "Decisions & action items" },
              { icon: ListTodo, label: "AI task planning", hint: "Prioritised, scheduled" },
              { icon: BotMessageSquare, label: "Workplace chat", hint: "Knows your data" },
            ].map((f) => (
              <li key={f.label} className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-soft">
                <f.icon className="size-5 text-primary" aria-hidden />
                <p className="mt-2 text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.hint}</p>
              </li>
            ))}
          </ul>
        </section>

        <Card className="border-border/60 shadow-lift">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <div>
              <h2 className="font-display text-xl font-semibold">Sign in to your workspace</h2>
              <p className="text-sm text-muted-foreground">
                No setup required — your demo workspace is ready.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-name">Name</Label>
              <Input id="l-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anikie Willis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-email">Work email</Label>
              <Input
                id="l-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <Button className="w-full rounded-xl" size="lg" onClick={enter}>
              Continue to dashboard
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to our terms and privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
