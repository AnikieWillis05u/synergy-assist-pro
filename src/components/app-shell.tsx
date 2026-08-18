import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BotMessageSquare,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/summarizer", label: "Meeting Summarizer", icon: ClipboardList },
  { to: "/app/planner", label: "Task Planner", icon: Sparkles },
  { to: "/app/chat", label: "AI Chat", icon: BotMessageSquare },
  { to: "/app/tasks", label: "My Tasks", icon: ListTodo },
  { to: "/app/meetings", label: "Meeting History", icon: CalendarClock },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/app" className="flex items-center gap-2.5 px-1 py-1">
      <span className="bg-brand grid size-9 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-soft">
        <Sparkles className="size-5" aria-hidden />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold leading-tight">
            AI Workplace
          </span>
          <span className="block truncate text-xs text-muted-foreground">Productivity Assistant</span>
        </span>
      ) : null}
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: "exact" in item ? item.exact : false }}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
        >
          <item.icon className="size-[18px] shrink-0" aria-hidden />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function usePageTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return useMemo(() => {
    const match = [...NAV].sort((a, b) => b.to.length - a.to.length).find((n) => pathname === n.to || pathname.startsWith(n.to + "/"));
    return match?.label ?? "Dashboard";
  }, [pathname]);
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { tasks, meetings, conversations, setActiveConversation } = useStore();
  const navigate = useNavigate();

  const go = (to: string, after?: () => void) => {
    after?.();
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tasks, meetings and conversations..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tasks">
          {tasks.slice(0, 20).map((t) => (
            <CommandItem key={t.id} value={`task ${t.title} ${t.project}`} onSelect={() => go("/app/tasks")}>
              <ListTodo className="size-4" />
              <span className="truncate">{t.title}</span>
              <Badge variant="outline" className="ml-auto capitalize">
                {t.priority}
              </Badge>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Meetings">
          {meetings.map((m) => (
            <CommandItem
              key={m.id}
              value={`meeting ${m.title} ${m.summary.overview}`}
              onSelect={() => go("/app/meetings")}
            >
              <CalendarClock className="size-4" />
              <span className="truncate">{m.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{m.date}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Conversations">
          {conversations.map((c) => (
            <CommandItem
              key={c.id}
              value={`chat ${c.title} ${c.messages.map((m) => m.content).join(" ").slice(0, 300)}`}
              onSelect={() => go("/app/chat", () => setActiveConversation(c.id))}
            >
              <BotMessageSquare className="size-4" />
              <span className="truncate">{c.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function NotificationsPanel() {
  const { notifications, markNotificationsRead } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  const iconFor = {
    deadline: CalendarClock,
    overdue: Bell,
    completed: CheckCircle2,
    summary: ClipboardList,
    ai: Sparkles,
  } as const;

  return (
    <Popover onOpenChange={(o) => o && unread > 0 && markNotificationsRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-display text-sm font-semibold">Notifications</p>
          <span className="text-xs text-muted-foreground">{notifications.length} total</span>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const Icon = iconFor[n.kind];
                return (
                  <li key={n.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                    <span className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell() {
  const { user, theme, toggleTheme, signOut, ready, authed } = useStore();
  const navigate = useNavigate();
  const title = usePageTitle();
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (ready && !authed) void navigate({ to: "/" });
  }, [ready, authed, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mobileNavItems = NAV.slice(0, 5);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        <div className="rounded-2xl bg-surface-gradient p-4">
          <p className="font-display text-sm font-semibold">One AI assistant</p>
          <p className="mt-1 text-xs text-muted-foreground">for your entire workday.</p>
          <Button asChild size="sm" className="mt-3 w-full rounded-xl">
            <Link to="/app/chat">Ask AI</Link>
          </Button>
        </div>
      </aside>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center justify-between">
            <Brand />
            <Button variant="ghost" size="icon" onClick={() => setMobileNav(false)} aria-label="Close">
              <X className="size-5" />
            </Button>
          </div>
          <div className="mt-6">
            <NavLinks onNavigate={() => setMobileNav(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <h2 className="truncate font-display text-base font-semibold sm:text-lg">{title}</h2>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setSearchOpen(true)}
                className="hidden h-9 w-56 justify-start gap-2 rounded-xl text-muted-foreground md:flex"
              >
                <Search className="size-4" />
                <span className="text-sm">Search...</span>
                <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">⌘K</kbd>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="size-5" />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                    {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
              </Tooltip>
              <NotificationsPanel />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 rounded-xl px-1.5 sm:px-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-brand text-xs font-semibold text-primary-foreground">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void navigate({ to: "/app/settings" })}>
                    <Settings className="size-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      signOut();
                      void navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <div key={pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                  <span className="max-w-16 truncate">{item.label.split(" ")[0]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
