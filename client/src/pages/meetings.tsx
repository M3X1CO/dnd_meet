import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedMeetingModal } from "@/components/unified-meeting-modal";
import { NavigationMenu } from "@/components/navigation-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Clock, MapPin, Users, UserPlus, UserMinus } from "lucide-react";
import { format } from "date-fns";
import type { MeetingSuggestion, ChatGroup } from "@shared/schema";

export default function Meetings() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: allMeetings = [], isLoading: isLoadingMeetings } = useQuery<MeetingSuggestion[]>({
    queryKey: ["/api/meetings/all"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: userMeetings = [] } = useQuery<MeetingSuggestion[]>({
    queryKey: ["/api/meetings/user"],
    enabled: isAuthenticated,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const res = await fetch(`/api/meetings/${meetingId}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to join meeting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/user"] });
      toast({ title: "Joined meeting successfully" });
    },
    onError: () => {
      toast({ title: "Failed to join meeting", variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const res = await fetch(`/api/meetings/${meetingId}/leave`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to leave meeting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/user"] });
      toast({ title: "Left meeting successfully" });
    },
    onError: () => {
      toast({ title: "Failed to leave meeting", variant: "destructive" });
    },
  });

  const userMeetingIds = new Set(userMeetings.map(m => m.id));
  const userCreatedMeetings = userMeetings.filter(m => m.suggestedById === user?.id);

  const sortedMeetings = [...allMeetings].sort((a, b) => 
    new Date(a.proposedDateTime).getTime() - new Date(b.proposedDateTime).getTime()
  );

  const upcomingMeetings = sortedMeetings.filter(m => 
    new Date(m.proposedDateTime) >= new Date() && m.status !== "rejected"
  );

  if (isLoading || isLoadingMeetings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading meetings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16">
            <NavigationMenu 
              currentPage="/meetings" 
              actionButton={
                userCreatedMeetings.length < 4 ? (
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1 sm:gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New</span>
                  </Button>
                ) : (
                  <Button size="sm" disabled className="flex items-center gap-1 sm:gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Limit Reached (4/4)</span>
                  </Button>
                )
              }
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {upcomingMeetings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Upcoming Meetings</h3>
              <p className="text-muted-foreground">
                Use the "New" button above to create a meeting.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">All Upcoming Meetings</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingMeetings.map((meeting) => {
                const meetingDate = new Date(meeting.proposedDateTime);
                const isCreator = meeting.suggestedById === user?.id;
                const isMember = userMeetingIds.has(meeting.id);
                const statusColor = 
                  meeting.status === "accepted" ? "bg-green-500/10 text-green-500 border-green-500/50" :
                  meeting.status === "pending" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/50" :
                  "bg-gray-500/10 text-gray-500 border-gray-500/50";

                return (
                  <Card key={meeting.id} className={`hover:shadow-lg transition-all ${isCreator ? 'ring-2 ring-primary/20' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-base truncate pr-2 cursor-pointer hover:underline" onClick={() => window.location.href = `/meetings/${meeting.id}`}>
                          {meeting.title}
                        </CardTitle>
                        <Badge variant="outline" className={`text-xs ${statusColor}`}>
                          {meeting.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                        {meeting.description || "No description"}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{format(meetingDate, "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{meeting.location}</span>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span>{meeting.duration || 60} minutes</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {meeting.participants?.length || 0}
                        </Badge>
                        {isCreator && (
                          <Badge variant="outline" className="text-xs">Creator</Badge>
                        )}
                      </div>
                      {!isCreator && (
                        <div className="pt-2">
                          {isMember ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => leaveMutation.mutate(meeting.id)}
                              disabled={leaveMutation.isPending}
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Leave
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => joinMutation.mutate(meeting.id)}
                              disabled={joinMutation.isPending}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <UnifiedMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
