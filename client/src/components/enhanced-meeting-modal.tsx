import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Users, MapPin, User, Plus, X, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { CalendarComparisonModal } from "./calendar-comparison-modal";
import type { User as UserType, ChatGroup } from "@shared/schema";

interface EnhancedMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatGroupId?: number;
  mode: 'group' | 'individual';
}

export function EnhancedMeetingModal({ 
  isOpen, 
  onClose, 
  chatGroupId, 
  mode = 'individual' 
}: EnhancedMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("60");
  const [requiresAllAccept, setRequiresAllAccept] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<UserType[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [showCalendarComparison, setShowCalendarComparison] = useState(false);
  const [comparisonDateTime, setComparisonDateTime] = useState<Date | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's friends for participant selection
  const { data: friends = [] } = useQuery<UserType[]>({
    queryKey: ['/api/friends'],
    enabled: isOpen && mode === 'individual',
  });

  // Fetch user's groups for group selection
  const { data: groups = [] } = useQuery<ChatGroup[]>({
    queryKey: ['/api/chat-groups'],
    enabled: isOpen,
  });

  // Auto-select group if provided
  useEffect(() => {
    if (chatGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === chatGroupId);
      if (group) {
        setSelectedGroup(group);
      }
    }
  }, [chatGroupId, groups]);

  const createMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      const dateTime = comparisonDateTime || new Date(`${proposedDate}T${proposedTime}`);
      const requestData = {
        title,
        description,
        proposedDateTime: dateTime,
        location,
        duration: parseInt(duration),
        requiresAllAccept,
        participants: selectedParticipants.map(p => p.id),
        ...(mode === 'group' && selectedGroup ? { chatGroupId: selectedGroup.id } : {}),
      };

      return await apiRequest('POST', '/api/meetings', requestData);
    },
    onSuccess: () => {
      toast({
        title: "Meeting Created",
        description: "Your meeting has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setProposedDate("");
    setProposedTime("");
    setLocation("");
    setDuration("60");
    setRequiresAllAccept(false);
    setSelectedParticipants([]);
    setSelectedGroup(null);
    setComparisonDateTime(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !proposedDate || !proposedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'individual' && selectedParticipants.length === 0) {
      toast({
        title: "No Participants",
        description: "Please select at least one participant.",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'group' && !selectedGroup) {
      toast({
        title: "No Group Selected",
        description: "Please select a group for the meeting.",
        variant: "destructive",
      });
      return;
    }

    createMeetingMutation.mutate({});
  };

  const handleParticipantToggle = (friend: UserType) => {
    setSelectedParticipants(prev => {
      const exists = prev.find(p => p.id === friend.id);
      if (exists) {
        return prev.filter(p => p.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleCompareCalendars = () => {
    if (!proposedDate || !proposedTime) {
      toast({
        title: "Missing Information",
        description: "Please set a proposed date and time first.",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'individual' && selectedParticipants.length === 0) {
      toast({
        title: "No Participants",
        description: "Please select participants to compare calendars.",
        variant: "destructive",
      });
      return;
    }

    setShowCalendarComparison(true);
  };

  const handleTimeSelection = (dateTime: Date) => {
    setComparisonDateTime(dateTime);
    const timeString = format(dateTime, 'HH:mm');
    setProposedTime(timeString);
  };

  const getParticipantsForComparison = () => {
    if (mode === 'group' && selectedGroup) {
      // For group mode, we'd need to fetch group members
      // For now, return empty array as this would require additional API calls
      return [];
    }
    return selectedParticipants;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Create Meeting {mode === 'group' ? 'for Group' : 'with Friends'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meeting Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Meeting Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Meeting Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter meeting title..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Meeting description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={proposedDate}
                        onChange={(e) => setProposedDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={proposedTime}
                        onChange={(e) => setProposedTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Meeting location..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiresAllAccept"
                      checked={requiresAllAccept}
                      onCheckedChange={setRequiresAllAccept}
                    />
                    <Label htmlFor="requiresAllAccept">
                      Requires all participants to accept
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Participants/Group Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    {mode === 'group' ? 'Select Group' : 'Select Participants'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mode === 'group' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Choose Group</Label>
                        <Select 
                          value={selectedGroup?.id.toString() || ""} 
                          onValueChange={(value) => {
                            const group = groups.find(g => g.id === parseInt(value));
                            setSelectedGroup(group || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a group..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedGroup && (
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">{selectedGroup.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedGroup.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Select Friends ({selectedParticipants.length} selected)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCompareCalendars}
                          disabled={selectedParticipants.length === 0 || !proposedDate || !proposedTime}
                          className="flex items-center gap-2"
                        >
                          <CalendarDays className="h-4 w-4" />
                          Compare Calendars
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {friends.map((friend) => (
                            <div
                              key={friend.id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted"
                            >
                              <Checkbox
                                id={friend.id}
                                checked={selectedParticipants.some(p => p.id === friend.id)}
                                onCheckedChange={() => handleParticipantToggle(friend)}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {friend.firstName} {friend.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {friend.email}
                                  </div>
                                </div>
                              </div>
                              {friend.tags && friend.tags.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {friend.tags.length} interests
                                </Badge>
                              )}
                            </div>
                          ))}
                          {friends.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                              No friends found. Add friends to create meetings with them.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Selected Participants Summary */}
            {mode === 'individual' && selectedParticipants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedParticipants.map((participant) => (
                      <Badge
                        key={participant.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {participant.firstName} {participant.lastName}
                        <button
                          type="button"
                          onClick={() => handleParticipantToggle(participant)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Time Selection from Calendar Comparison */}
            {comparisonDateTime && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Selected Time from Calendar Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800">
                      {format(comparisonDateTime, 'MMMM d, yyyy')} at {format(comparisonDateTime, 'h:mm a')}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Optimal time based on participant availability
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMeetingMutation.isPending}>
                {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Calendar Comparison Modal */}
      <CalendarComparisonModal
        isOpen={showCalendarComparison}
        onClose={() => setShowCalendarComparison(false)}
        participants={getParticipantsForComparison()}
        proposedDate={proposedDate ? new Date(proposedDate) : new Date()}
        proposedTime={proposedTime}
        duration={parseInt(duration)}
        onSelectTime={handleTimeSelection}
      />
    </>
  );
}