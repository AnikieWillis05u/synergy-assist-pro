import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/lib/types";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "accent";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    accent: "bg-accent text-accent-foreground",
  };
  return (
    <Card className="card-hover border-border/70 shadow-soft">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn("rounded-xl p-2.5", toneMap[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}

const priorityStyles: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground border-transparent",
  medium: "bg-primary/10 text-primary border-transparent",
  high: "bg-warning/20 text-warning-foreground border-transparent dark:text-warning",
  urgent: "bg-destructive/12 text-destructive border-transparent",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("capitalize", priorityStyles[priority])}>
      {priority}
    </Badge>
  );
}

const statusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    todo: "bg-secondary text-secondary-foreground",
    "in-progress": "bg-primary/12 text-primary",
    completed: "bg-success/15 text-success",
  };
  return (
    <Badge variant="outline" className={cn("border-transparent", styles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <span className="rounded-2xl bg-primary/10 p-3 text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionTo ? (
        <Button asChild className="mt-5">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      ) : actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

/** Small, dependency-free markdown renderer for AI output. */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = content.split(/\n{2,}/);
  const inline = (text: string): ReactNode =>
    text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        );
      if (part.startsWith("_") && part.endsWith("_") && part.length > 2)
        return (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      return <span key={i}>{part}</span>;
    });

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines.every((l) => /^\s*[-*]\s+/.test(l)))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l)))
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        const heading = /^(#{1,4})\s+(.*)$/.exec(lines[0] ?? "");
        if (heading)
          return (
            <h4 key={i} className="font-display text-base font-semibold">
              {inline(heading[2] ?? "")}
            </h4>
          );
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}
