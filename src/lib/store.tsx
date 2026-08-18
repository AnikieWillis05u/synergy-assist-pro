import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  demoConversations,
  demoMeetings,
  demoNotifications,
  demoTasks,
  demoUser,
} from "./demo-data";
import type {
  ActionItem,
  AppNotification,
  ChatMessage,
  Conversation,
  Meeting,
  Task,
  UserProfile,
} from "./types";

const STORAGE_KEY = "awpa.state.v1";

export interface AppState {
  authed: boolean;
  user: UserProfile;
  tasks: Task[];
  meetings: Meeting[];
  conversations: Conversation[];
  activeConversationId: string;
  notifications: AppNotification[];
  aiInteractions: number;
}

const initialState: AppState = {
  authed: false,
  user: demoUser,
  tasks: demoTasks,
  meetings: demoMeetings,
  conversations: demoConversations,
  activeConversationId: demoConversations[0]?.id ?? "c_1",
  notifications: demoNotifications,
  aiInteractions: 12,
};

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

interface StoreValue extends AppState {
  ready: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  signIn: (name?: string) => void;
  signOut: () => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  updatePreferences: (patch: Partial<UserProfile["preferences"]>) => void;
  addTask: (task: Partial<Task> & { title: string }) => Task;
  addTasks: (tasks: Array<Partial<Task> & { title: string }>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  saveMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  convertActionItems: (items: ActionItem[], source: string) => number;
  newConversation: () => string;
  setActiveConversation: (id: string) => void;
  appendMessage: (conversationId: string, message: ChatMessage) => void;
  clearConversation: (id: string) => void;
  popLastAssistantMessage: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationsRead: () => void;
  bumpAi: () => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function makeTask(input: Partial<Task> & { title: string }): Task {
  return {
    id: input.id ?? uid("t"),
    title: input.title,
    description: input.description ?? "",
    priority: input.priority ?? "medium",
    status: input.status ?? "todo",
    dueDate: input.dueDate ?? null,
    estimatedTime: input.estimatedTime ?? "1h",
    project: input.project ?? "General",
    notes: input.notes ?? "",
    subtasks: input.subtasks ?? [],
    dependencies: input.dependencies ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
    completedAt: input.completedAt ?? null,
    source: input.source,
  };
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as AppState) });
    } catch {
      /* ignore corrupted state */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state, ready]);

  const theme = state.user.preferences.theme;

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, ready]);

  const patch = useCallback((fn: (s: AppState) => Partial<AppState>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const updatePreferences = (p: Partial<UserProfile["preferences"]>) =>
      patch((s) => ({ user: { ...s.user, preferences: { ...s.user.preferences, ...p } } }));

    const pushNotification: StoreValue["pushNotification"] = (n) =>
      patch((s) => ({
        notifications: [
          { ...n, id: uid("n"), createdAt: new Date().toISOString(), read: false },
          ...s.notifications,
        ].slice(0, 30),
      }));

    return {
      ...state,
      ready,
      theme,
      toggleTheme: () => updatePreferences({ theme: theme === "dark" ? "light" : "dark" }),
      signIn: (name?: string) =>
        patch((s) => ({
          authed: true,
          user: name ? { ...s.user, name, avatar: name.slice(0, 2).toUpperCase() } : s.user,
        })),
      signOut: () => patch(() => ({ authed: false })),
      updateUser: (p) => patch((s) => ({ user: { ...s.user, ...p } })),
      updatePreferences,
      addTask: (input) => {
        const task = makeTask(input);
        patch((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },
      addTasks: (inputs) =>
        patch((s) => ({ tasks: [...inputs.map(makeTask), ...s.tasks] })),
      updateTask: (id, p) =>
        patch((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...p,
                  completedAt:
                    p.status === "completed"
                      ? new Date().toISOString()
                      : p.status
                        ? null
                        : t.completedAt,
                }
              : t,
          ),
        })),
      deleteTask: (id) => patch((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      saveMeeting: (meeting) =>
        patch((s) => ({ meetings: [meeting, ...s.meetings.filter((m) => m.id !== meeting.id)] })),
      updateMeeting: (id, p) =>
        patch((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...p } : m)) })),
      deleteMeeting: (id) => patch((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) })),
      convertActionItems: (items, source) => {
        const created = items.map((item) =>
          makeTask({
            title: item.task,
            description: `From ${source}`,
            priority: item.priority,
            dueDate: item.deadline || null,
            project: source,
            source,
            notes: item.owner ? `Owner: ${item.owner}` : "",
          }),
        );
        patch((s) => ({ tasks: [...created, ...s.tasks] }));
        return created.length;
      },
      newConversation: () => {
        const id = uid("c");
        patch((s) => ({
          activeConversationId: id,
          conversations: [
            {
              id,
              title: "New conversation",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messages: [],
            },
            ...s.conversations,
          ],
        }));
        return id;
      },
      setActiveConversation: (id) => patch(() => ({ activeConversationId: id })),
      appendMessage: (conversationId, message) =>
        patch((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  title:
                    c.messages.length === 0 && message.role === "user"
                      ? message.content.slice(0, 48)
                      : c.title,
                  messages: [...c.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),
      clearConversation: (id) =>
        patch((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, messages: [], title: "New conversation" } : c,
          ),
        })),
      popLastAssistantMessage: (id) =>
        patch((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== id) return c;
            const messages = [...c.messages];
            while (messages.length && messages[messages.length - 1]?.role === "assistant")
              messages.pop();
            return { ...c, messages };
          }),
        })),
      pushNotification,
      markNotificationsRead: () =>
        patch((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      bumpAi: () => patch((s) => ({ aiInteractions: s.aiInteractions + 1 })),
      resetDemoData: () => setState({ ...initialState, authed: true }),
    };
  }, [state, ready, theme, patch]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}

/** Compact snapshot of the user's productivity data, shared with the AI. */
export function buildContext(state: {
  tasks: Task[];
  meetings: Meeting[];
}) {
  const tasks = state.tasks
    .slice(0, 20)
    .map(
      (t) =>
        `- [${t.status}] ${t.title} (priority: ${t.priority}, due: ${t.dueDate ?? "none"}, project: ${t.project}, est: ${t.estimatedTime})`,
    )
    .join("\n");
  const meetings = state.meetings
    .slice(0, 5)
    .map((m) => `- ${m.title} (${m.date}): ${m.summary.overview.slice(0, 180)}`)
    .join("\n");
  return `TASKS:\n${tasks || "none"}\n\nRECENT MEETINGS:\n${meetings || "none"}`;
}
