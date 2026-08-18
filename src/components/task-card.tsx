import {
  CalendarDays,
  Check,
  Clock,
  GitBranch,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PriorityBadge } from "@/components/common";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uid, useStore } from "@/lib/store";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const STATUSES: TaskStatus[] = ["todo", "in-progress", "completed"];
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

export function TaskCard({ task, compact = false }: { task: Task; compact?: boolean }) {
  const { updateTask, deleteTask } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState(task);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const overdue =
    task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());

  const toggleComplete = () => {
    const next: TaskStatus = task.status === "completed" ? "todo" : "completed";
    updateTask(task.id, { status: next });
    toast.success(next === "completed" ? "Task completed" : "Task reopened");
  };

  const saveEdit = () => {
    updateTask(task.id, {
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      status: draft.status,
      dueDate: draft.dueDate,
      estimatedTime: draft.estimatedTime,
      project: draft.project,
      notes: draft.notes,
      subtasks: draft.subtasks,
    });
    setEditOpen(false);
    toast.success("Task updated");
  };

  const doneSubtasks = task.subtasks.filter((s) => s.done).length;

  return (
    <>
      <Card
        className={cn(
          "card-hover group border-border/70 shadow-soft",
          task.status === "completed" && "opacity-70",
          overdue && "border-destructive/40",
        )}
      >
        <CardContent className={cn("space-y-3", compact ? "p-3.5" : "p-4")}>
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === "completed"}
              onCheckedChange={toggleComplete}
              className="mt-0.5"
              aria-label="Mark complete"
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium leading-snug",
                  task.status === "completed" && "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </p>
              {task.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
              ) : null}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Task actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => { setDraft(task); setEditOpen(true); }}>
                  <Pencil className="size-4" /> Edit task
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleComplete}>
                  <Check className="size-4" /> {task.status === "completed" ? "Reopen" : "Mark complete"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Priority</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={task.priority}
                  onValueChange={(v) => updateTask(task.id, { priority: v as Priority })}
                >
                  {PRIORITIES.map((p) => (
                    <DropdownMenuRadioItem key={p} value={p} className="capitalize">
                      {p}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={task.status}
                  onValueChange={(v) => updateTask(task.id, { status: v as TaskStatus })}
                >
                  {STATUSES.map((s) => (
                    <DropdownMenuRadioItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirmOpen(true)}>
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.subtasks.length > 0 ? (
            <div className="space-y-1.5 rounded-xl bg-muted/50 p-2.5">
              {task.subtasks.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 text-xs">
                  <Checkbox
                    checked={s.done}
                    onCheckedChange={(v) =>
                      updateTask(task.id, {
                        subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, done: Boolean(v) } : x)),
                      })
                    }
                    className="size-3.5"
                  />
                  <span className={cn(s.done && "line-through text-muted-foreground")}>{s.title}</span>
                </label>
              ))}
              <p className="pt-0.5 text-[11px] text-muted-foreground">
                {doneSubtasks}/{task.subtasks.length} subtasks done
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <PriorityBadge priority={task.priority} />
            {task.dueDate ? (
              <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive font-medium")}>
                <CalendarDays className="size-3.5" /> {task.dueDate}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {task.estimatedTime}
            </span>
            {task.dependencies.length > 0 ? (
              <span className="inline-flex items-center gap-1" title={task.dependencies.join(", ")}>
                <GitBranch className="size-3.5" /> {task.dependencies.length}
              </span>
            ) : null}
            <span className="ml-auto truncate rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {task.project}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update details, priority, deadline, notes and subtasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea
                id="t-desc"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as TaskStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-due">Deadline</Label>
                <Input
                  id="t-due"
                  type="date"
                  value={draft.dueDate ?? ""}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-est">Estimated time</Label>
                <Input
                  id="t-est"
                  value={draft.estimatedTime}
                  onChange={(e) => setDraft({ ...draft, estimatedTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-project">Project</Label>
              <Input
                id="t-project"
                value={draft.project}
                onChange={(e) => setDraft({ ...draft, project: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-notes">Notes</Label>
              <Textarea
                id="t-notes"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subtasks</Label>
              {draft.subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Input
                    value={s.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        subtasks: draft.subtasks.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDraft({ ...draft, subtasks: draft.subtasks.filter((x) => x.id !== s.id) })}
                    aria-label="Remove subtask"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={subtaskTitle}
                  placeholder="Add a subtask"
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!subtaskTitle.trim()) return;
                    setDraft({
                      ...draft,
                      subtasks: [...draft.subtasks, { id: uid("s"), title: subtaskTitle.trim(), done: false }],
                    });
                    setSubtaskTitle("");
                  }}
                >
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              "{task.title}" will be permanently removed from your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTask(task.id);
                toast.success("Task deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
