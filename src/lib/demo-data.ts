import type { Conversation, Meeting, AppNotification, Task, UserProfile } from "./types";

const day = 24 * 60 * 60 * 1000;
export const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();
const dateOnly = (offsetDays: number) => iso(offsetDays).slice(0, 10);

export const demoUser: UserProfile = {
  id: "u_1",
  name: "Anikie Willis",
  email: "anikie@northwind.io",
  role: "Product Marketing Lead",
  avatar: "AW",
  preferences: {
    theme: "light",
    tone: "Professional",
    summaryLength: "Balanced",
    emailNotifications: true,
    deadlineReminders: true,
    weeklyDigest: false,
    autoConvertActionItems: true,
    aiModel: "Lovable AI (recommended)",
  },
};

export const demoTasks: Task[] = [
  {
    id: "t_1",
    title: "Draft Q3 client presentation outline",
    description: "Structure the narrative: results, insights, roadmap, and the ask.",
    priority: "high",
    status: "in-progress",
    dueDate: dateOnly(1),
    estimatedTime: "2h",
    project: "Client Meeting",
    notes: "Reuse the Q2 deck skeleton.",
    subtasks: [
      { id: "s_1", title: "Collect Q3 metrics", done: true },
      { id: "s_2", title: "Write executive summary", done: false },
    ],
    dependencies: [],
    createdAt: iso(-3),
    completedAt: null,
  },
  {
    id: "t_2",
    title: "Send follow-up notes to Acme stakeholders",
    description: "Share the meeting summary and confirm next milestone date.",
    priority: "urgent",
    status: "todo",
    dueDate: dateOnly(-1),
    estimatedTime: "30m",
    project: "Acme Renewal",
    notes: "",
    subtasks: [],
    dependencies: [],
    createdAt: iso(-2),
    completedAt: null,
  },
  {
    id: "t_3",
    title: "Review onboarding copy with design",
    description: "Align tone of voice across the new activation flow.",
    priority: "medium",
    status: "todo",
    dueDate: dateOnly(3),
    estimatedTime: "1h",
    project: "Onboarding Revamp",
    notes: "",
    subtasks: [],
    dependencies: [],
    createdAt: iso(-1),
    completedAt: null,
  },
  {
    id: "t_4",
    title: "Publish weekly product update",
    description: "Summarise shipped work for the internal newsletter.",
    priority: "low",
    status: "completed",
    dueDate: dateOnly(-2),
    estimatedTime: "45m",
    project: "Internal Comms",
    notes: "",
    subtasks: [],
    dependencies: [],
    createdAt: iso(-6),
    completedAt: iso(-2),
  },
  {
    id: "t_5",
    title: "Prepare pricing FAQ for sales team",
    description: "Answer the top ten objections raised last quarter.",
    priority: "high",
    status: "completed",
    dueDate: dateOnly(-4),
    estimatedTime: "1.5h",
    project: "Enablement",
    notes: "",
    subtasks: [],
    dependencies: [],
    createdAt: iso(-8),
    completedAt: iso(-4),
  },
  {
    id: "t_6",
    title: "Book venue for team offsite",
    description: "Shortlist three options within budget.",
    priority: "medium",
    status: "in-progress",
    dueDate: dateOnly(6),
    estimatedTime: "1h",
    project: "Team Ops",
    notes: "",
    subtasks: [],
    dependencies: [],
    createdAt: iso(-1),
    completedAt: null,
  },
];

export const demoMeetings: Meeting[] = [
  {
    id: "m_1",
    title: "Acme Q3 Renewal Sync",
    date: dateOnly(-2),
    attendees: ["Anikie Willis", "Daniel Cho", "Priya Naidoo", "Tom Reyes"],
    type: "Client meeting",
    transcript:
      "Discussion covering renewal terms, adoption metrics, and the onboarding gaps raised by the Acme team.",
    status: "summarized",
    createdAt: iso(-2),
    summary: {
      overview:
        "Acme confirmed intent to renew for 12 months pending a clearer onboarding plan and updated pricing tiers. Adoption is up 18% quarter over quarter.",
      keyPoints: [
        "Seat adoption grew 18% but activation for new teams remains slow.",
        "Acme wants a dedicated onboarding track for their APAC region.",
        "Pricing tiers need clarification before procurement sign-off.",
      ],
      decisions: [
        "Proceed with a 12-month renewal proposal.",
        "Deliver a tailored onboarding plan within two weeks.",
      ],
      actionItems: [
        {
          id: "a_1",
          task: "Send follow-up notes and renewal proposal",
          owner: "Anikie Willis",
          deadline: dateOnly(-1),
          priority: "urgent",
        },
        {
          id: "a_2",
          task: "Draft APAC onboarding plan",
          owner: "Priya Naidoo",
          deadline: dateOnly(5),
          priority: "high",
        },
      ],
      followUps: ["Confirm procurement contact at Acme.", "Schedule a technical deep-dive session."],
      openQuestions: ["Will Acme expand to the support team in Q4?"],
    },
  },
  {
    id: "m_2",
    title: "Weekly Product & Marketing Standup",
    date: dateOnly(-5),
    attendees: ["Anikie Willis", "Sam Botha", "Lerato Dube"],
    type: "Internal standup",
    transcript: "Weekly alignment on launches, blockers and campaign timing.",
    status: "summarized",
    createdAt: iso(-5),
    summary: {
      overview:
        "The team aligned on the onboarding revamp launch date and agreed to delay the pricing page refresh by one sprint.",
      keyPoints: [
        "Onboarding revamp is on track for end of month.",
        "Pricing page refresh deprioritised for one sprint.",
      ],
      decisions: ["Launch onboarding revamp on the 30th.", "Pause pricing page work."],
      actionItems: [
        {
          id: "a_3",
          task: "Review onboarding copy with design",
          owner: "Anikie Willis",
          deadline: dateOnly(3),
          priority: "medium",
        },
      ],
      followUps: ["Share launch checklist with support."],
      openQuestions: ["Do we need a webinar for the launch?"],
    },
  },
];

export const demoConversations: Conversation[] = [
  {
    id: "c_1",
    title: "Prioritising this week",
    createdAt: iso(-1),
    updatedAt: iso(-1),
    messages: [
      {
        id: "cm_1",
        role: "assistant",
        content:
          "Hi Anikie 👋 I'm your workplace assistant. I can summarise meetings, plan projects, draft emails and help you decide what to work on next. What are we tackling today?",
        createdAt: iso(-1),
      },
    ],
  },
];

export const demoNotifications: AppNotification[] = [
  {
    id: "n_1",
    title: "Task overdue",
    body: "\"Send follow-up notes to Acme stakeholders\" was due yesterday.",
    kind: "overdue",
    createdAt: iso(-1),
    read: false,
  },
  {
    id: "n_2",
    title: "Deadline tomorrow",
    body: "\"Draft Q3 client presentation outline\" is due tomorrow.",
    kind: "deadline",
    createdAt: iso(-0.5),
    read: false,
  },
  {
    id: "n_3",
    title: "Summary ready",
    body: "Your Acme Q3 Renewal Sync summary is saved to Meeting History.",
    kind: "summary",
    createdAt: iso(-2),
    read: true,
  },
];
