export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in-progress" | "completed";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  estimatedTime: string;
  project: string;
  notes: string;
  subtasks: Subtask[];
  dependencies: string[];
  createdAt: string;
  completedAt: string | null;
  source?: string | undefined;
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  deadline: string;
  priority: Priority;
  converted?: boolean | undefined;
}

export interface MeetingSummary {
  overview: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  followUps: string[];
  openQuestions: string[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  type: string;
  transcript: string;
  summary: MeetingSummary;
  status: "summarized" | "draft";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: "deadline" | "overdue" | "completed" | "summary" | "ai";
  createdAt: string;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  preferences: {
    theme: "light" | "dark";
    tone: string;
    summaryLength: string;
    emailNotifications: boolean;
    deadlineReminders: boolean;
    weeklyDigest: boolean;
    autoConvertActionItems: boolean;
    aiModel: string;
  };
}
