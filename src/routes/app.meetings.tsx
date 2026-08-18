import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, Download, ListPlus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { Meeting } from "@/lib/types";

export const Route = createFileRoute("/app/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting History | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Browse, edit, export and reuse every AI-generated meeting summary in one place.",
      },
      { property: "og:title", content: "Meeting History" },
      { property: "og:description", content: "Every meeting summary, searchable and actionable." },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { meetings, deleteMeeting, updateMeeting, convertActionItems } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState<Meeting | null>(null);
  const [draft, setDraft] = useState("");

  const exportMeeting = (m: Meeting) => {
    const text = `# ${m.title}\n${m.date} · ${m.type}\n\n${m.summary.overview}\n\nAction items:\n${m.summary.actionItems
      .map((a) => `- ${a.task} (${a.owner}, ${a.deadline})`)
      .join("\n")}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${m.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Meeting exported");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting History"
        description="Every summary your assistant has produced, ready to reuse."
      />

      {meetings.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No meetings yet"
          description="Summarize your first meeting and it will be saved here automatically."
          actionLabel="Summarize a meeting"
          actionTo="/app/summarizer"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meetings.map((m) => (
            <Card key={m.id} className="card-hover flex flex-col border-border/70 shadow-soft">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-base leading-snug">{m.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0 border-transparent bg-success/15 capitalize text-success">
                    {m.status}
                  </Badge>
                </div>
                <CardDescription className="flex flex-wrap items-center gap-3">
                  <span>{m.date}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {m.attendees.length}
                  </span>
                  <span>{m.summary.actionItems.length} action items</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">{m.summary.overview}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setOpen(m);
                      setDraft(m.summary.overview);
                    }}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      const n = convertActionItems(m.summary.actionItems, m.title);
                      toast.success(`${n} tasks created`, {
                        action: { label: "View", onClick: () => void navigate({ to: "/app/tasks" }) },
                      });
                    }}
                  >
                    <ListPlus className="size-4" /> To tasks
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => exportMeeting(m)}>
                    <Download className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-destructive"
                    onClick={() => {
                      deleteMeeting(m.id);
                      toast.success("Meeting deleted");
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
            <DialogDescription>
              {open?.date} · {open?.type} · {open?.attendees.join(", ")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-40" />
            <div className="space-y-2">
              <h4 className="font-display text-sm font-semibold">Action items</h4>
              {open?.summary.actionItems.map((a) => (
                <div key={a.id} className="rounded-xl border border-border/60 px-3 py-2 text-sm">
                  {a.task}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {a.owner} · {a.deadline}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (open) {
                  updateMeeting(open.id, { summary: { ...open.summary, overview: draft } });
                  toast.success("Meeting updated");
                  setOpen(null);
                }
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
