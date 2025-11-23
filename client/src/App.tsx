import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Calendar from "@/pages/calendar";
import Landing from "@/pages/landing";
import Meetings from "@/pages/meetings";
import Groups from "@/pages/groups";
import Friends from "@/pages/friends";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Chat from "@/pages/chat";
import TagsTest from "@/pages/tags-test";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CalendarDay from "@/pages/calendar-day";
import MeetingDetail from "@/pages/meeting-detail";
import GroupDetail from "@/pages/group-detail";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/calendar/day/:date" component={CalendarDay} />
      <Route path="/meetings/:id" component={MeetingDetail} />
      <Route path="/groups/:id" component={GroupDetail} />
      <Route path="/meetings" component={Meetings} />
      <Route path="/groups" component={Groups} />
      <Route path="/friends" component={Friends} />
      <Route path="/chat" component={Chat} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/tags-test" component={TagsTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedRoutes /> : <UnauthenticatedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
