import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ClipboardList,
  Copy,
  Download,
  FileText,
  ListPlus,
  Loader2,
  MessageSquarePlus,
  Save,
  Share2,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Markdown, PageHeader, PriorityBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting } from "@/lib/ai.functions";
import { uid, useStore } from "@/lib/store";
import type { Meeting, MeetingSummary } from "@/lib/types";

export const Route = createFileRoute("/app/summarizer")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Turn raw meeting notes or transcripts into structured summaries, decisions and action items with AI.",
      },
      { property: "og:title", content: "AI Meeting Notes Summarizer" },
      {
        property: "og:description",
        content: "Structured overviews, decisions and action items from any meeting.",
      },
    ],
  }),
  component: SummarizerPage,
});

function summaryToText(title: string, s: MeetingSummary) {
  return [
    `# ${title || "Meeting summary"}`,
    "",
    "## Meeting Overview",
    s.overview,
    "",
    "## Key Discussion Points",
    ...s.keyPoints.map((p) => `- ${p}`),
    "",
    "## Decisions Made",
    ...s.decisions.map((d) => `- ${d}`),
    "",
    "## Action Items",
    ...s.actionItems.map((a) => `- ${a.task} — ${a.owner} (due ${a.deadline}, ${a.priority})`),
    "",
    "## Important Follow-Ups",
    ...s.followUps.map((f) => `- ${f}`),
    "",
    "## Questions & Open Issues",
    ...s.openQuestions.map((q) => `- ${q}`),
  ].join("\n");
}

function SummarizerPage() {
  const store = useStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("Client meeting");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setTranscript(text.slice(0, 40000));
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    toast.success("File loaded", { description: file.name });
  };

  const run = async () => {
    if (transcript.trim().length < 20) {
      toast.error("Add some meeting notes first");
      return;
    }
    setLoading(true);
    setSummary(null);
    try {
      const res = await summarizeMeeting({ data: { title, attendees, date, type, transcript } });
      setSummary(res.summary);
      store.bumpAi();
      toast.success(res.demo ? "Summary ready (demo mode)" : "Summary ready");
    } catch (error) {
      toast.error("Could not summarize", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentMeeting = (): Meeting => ({
    id: uid("m"),
    title: title || "Untitled meeting",
    date,
    attendees: attendees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    type,
    transcript,
    summary: summary as MeetingSummary,
    status: "summarized",
    createdAt: new Date().toISOString(),
  });

  const save = () => {
    if (!summary) return;
    const meeting = currentMeeting();
    store.saveMeeting(meeting);
    store.pushNotification({
      title: "Summary ready",
      body: `"${meeting.title}" was saved to Meeting History.`,
      kind: "summary",
    });
    toast.success("Saved to Meeting History");
  };

  const convert = () => {
    if (!summary) return;
    const n = store.convertActionItems(summary.actionItems, title || "Meeting");
    toast.success(`${n} action items added to your tasks`, {
      action: { label: "View tasks", onClick: () => void navigate({ to: "/app/tasks" }) },
    });
  };

  const copy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summaryToText(title, summary));
    toast.success("Summary copied");
  };

  const exportFile = () => {
    if (!summary) return;
    const blob = new Blob([summaryToText(title, summary)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "meeting-summary").replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Summary exported");
  };

  const share = async () => {
    if (!summary) return;
    const text = summaryToText(title, summary);
    if (typeof navigator.share === "function") {
      await navigator.share({ title: title || "Meeting summary", text }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Shareable summary copied to clipboard");
  };

  const sendToChat = () => {
    if (!summary) return;
    const id = store.newConversation();
    store.appendMessage(id, {
      id: uid("cm"),
      role: "user",
      content: `Here is my meeting summary for "${title || "a meeting"}". I'd like to ask follow-up questions about it.\n\n${summaryToText(title, summary)}`,
      createdAt: new Date().toISOString(),
    });
    void navigate({ to: "/app/chat" });
  };

  const startEdit = () => {
    if (!summary) return;
    setDraft(summaryToText(title, summary));
    setEditing(true);
  };

  const saveEdit = () => {
    if (!summary) return;
    setSummary({ ...summary, overview: draft.split("## Key Discussion Points")[0]?.split("## Meeting Overview")[1]?.trim() || summary.overview });
    setEditing(false);
    toast.success("Summary updated");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Paste notes or a transcript, upload a file, and let AI produce a structured, shareable summary."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card className="h-fit border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Meeting details</CardTitle>
            <CardDescription>Context helps the AI write a better summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q3 Client Review" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Meeting type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Client meeting", "Internal standup", "Project review", "1:1", "Workshop", "Interview"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees</Label>
              <Input
                id="attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="Comma separated names"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notes">Notes or transcript</Label>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-4" /> Upload file
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.vtt,.srt,text/*"
                  className="hidden"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                />
              </div>
              <Textarea
                id="notes"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your meeting notes or transcript here..."
                className="min-h-56 resize-y"
              />
              <p className="text-xs text-muted-foreground">{transcript.length} characters</p>
            </div>
            <Button onClick={() => void run()} disabled={loading} className="w-full rounded-xl" size="lg">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Summarizing..." : "Summarize with AI"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <Card className="border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Loader2 className="size-4 animate-spin text-primary" /> AI is reading your meeting...
                </CardTitle>
                <CardDescription>Extracting decisions, action items and follow-ups.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" style={{ width: `${100 - i * 8}%` }} />
                ))}
              </CardContent>
            </Card>
          ) : !summary ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ClipboardList className="size-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">Your summary will appear here</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add your notes on the left and press "Summarize with AI" to get an overview, decisions and action
                items you can turn into tasks.
              </p>
            </div>
          ) : (
            <>
              <Card className="border-border/70 shadow-soft">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="font-display text-xl">{title || "Meeting summary"}</CardTitle>
                      <CardDescription>
                        {date} · {type}
                        {attendees ? ` · ${attendees.split(",").filter(Boolean).length} attendees` : ""}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void copy()}>
                        <Copy className="size-4" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={startEdit}>
                        <FileText className="size-4" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={exportFile}>
                        <Download className="size-4" /> Export
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void share()}>
                        <Share2 className="size-4" /> Share
                      </Button>
                      <Button size="sm" className="rounded-xl" onClick={save}>
                        <Save className="size-4" /> Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {editing ? (
                    <div className="space-y-3">
                      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-96" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={saveEdit}>
                          <Check className="size-4" /> Save changes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Section title="Meeting Overview">
                        <Markdown content={summary.overview} />
                      </Section>
                      <Section title="Key Discussion Points">
                        <BulletList items={summary.keyPoints} />
                      </Section>
                      <Section title="Decisions Made">
                        <BulletList items={summary.decisions} />
                      </Section>
                      <Section title="Action Items">
                        <div className="space-y-2">
                          {summary.actionItems.map((a) => (
                            <div
                              key={a.id}
                              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{a.task}</p>
                                <p className="text-xs text-muted-foreground">
                                  {a.owner} · due {a.deadline || "unscheduled"}
                                </p>
                              </div>
                              <PriorityBadge priority={a.priority} />
                            </div>
                          ))}
                        </div>
                      </Section>
                      <Section title="Important Follow-Ups">
                        <BulletList items={summary.followUps} />
                      </Section>
                      <Section title="Questions & Open Issues">
                        <BulletList items={summary.openQuestions} />
                      </Section>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button className="rounded-xl" onClick={convert}>
                  <ListPlus className="size-4" /> Convert Action Items to Tasks
                </Button>
                <Button variant="secondary" className="rounded-xl" onClick={sendToChat}>
                  <MessageSquarePlus className="size-4" /> Ask AI about this meeting
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing recorded.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

