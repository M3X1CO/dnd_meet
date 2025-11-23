import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, MapPin, Users, Check, X, Edit } from "lucide-react";
import type { MeetingSuggestion, MeetingResponse } from "@shared/schema";

interface MeetingResponseCardProps {
  meeting: MeetingSuggestion;
  responses: MeetingResponse[];
  currentUserId: string;
}

export function MeetingResponseCard({ meeting, responses, currentUserId }: MeetingResponseCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<"accepted" | "rejected" | "counter">("accepted");
  const [counterDate, setCounterDate] = useState("");
  const [counterTime, setCounterTime] = useState("");
  const [counterLocation, setCounterLocation] = useState("");
  const [responseNote, setResponseNote] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentUserResponse = responses.find(r => r.userId === currentUserId);
  const acceptedCount = responses.filter(r => r.responseType === "accepted").length;
  const rejectedCount = responses.filter(r => r.responseType === "rejected").length;
  const counterCount = responses.filter(r => r.responseType === "counter").length;

  const formatDateTime = (dateTime: Date) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const respondToMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/meetings/respond", {
        method: "POST",
        body: JSON.stringify({
          meetingId: meeting.id,
          responseType: data.responseType,
          note: data.note,
          counterDateTime: data.counterDateTime,
          counterLocation: data.counterLocation
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your meeting response has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setShowResponseModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setResponseType("accepted");
    setCounterDate("");
    setCounterTime("");
    setCounterLocation("");
    setResponseNote("");
  };

  const handleQuickResponse = (type: "accepted" | "rejected") => {
    setResponseType(type);
    setShowResponseModal(true);
  };

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    
    let counterDateTime = null;
    if (responseType === "counter" && counterDate && counterTime) {
      counterDateTime = new Date(`${counterDate}T${counterTime}`);
    }

    respondToMeetingMutation.mutate({
      responseType,
      note: responseNote,
      counterDateTime,
      counterLocation: counterLocation || null
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {meeting.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(meeting.proposedDateTime)}
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {meeting.location}
                  </div>
                )}
              </div>
            </div>
            <Badge className={getStatusColor(meeting.status)}>
              {meeting.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {meeting.description && (
            <p className="text-sm text-muted-foreground mb-4">{meeting.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Duration: {meeting.duration} minutes</span>
            </div>
            {meeting.requiresAllAccept && (
              <Badge variant="outline">Requires all to accept</Badge>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">{acceptedCount} accepted</span>
            </div>
            <div className="flex items-center gap-1">
              <X className="h-4 w-4 text-red-600" />
              <span className="text-sm">{rejectedCount} rejected</span>
            </div>
            <div className="flex items-center gap-1">
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{counterCount} counter proposals</span>
            </div>
          </div>

          {currentUserResponse ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Your response: {currentUserResponse.responseType}</p>
              {currentUserResponse.note && (
                <p className="text-xs text-muted-foreground mt-1">{currentUserResponse.note}</p>
              )}
              {currentUserResponse.counterDateTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  Counter proposal: {formatDateTime(currentUserResponse.counterDateTime)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleQuickResponse("accepted")}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Accept
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setResponseType("counter");
                  setShowResponseModal(true);
                }}
                className="flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                Counter Proposal
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleQuickResponse("rejected")}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {responseType === "accepted" ? "Accept Meeting" : 
               responseType === "rejected" ? "Reject Meeting" : 
               "Counter Proposal"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitResponse} className="space-y-4">
            {responseType === "counter" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="counter-date">Proposed Date</Label>
                    <Input
                      id="counter-date"
                      type="date"
                      value={counterDate}
                      onChange={(e) => setCounterDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="counter-time">Proposed Time</Label>
                    <Input
                      id="counter-time"
                      type="time"
                      value={counterTime}
                      onChange={(e) => setCounterTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="counter-location">Alternative Location</Label>
                  <Input
                    id="counter-location"
                    value={counterLocation}
                    onChange={(e) => setCounterLocation(e.target.value)}
                    placeholder="Leave blank to keep original location"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="response-note">Note (optional)</Label>
              <Textarea
                id="response-note"
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="Add any additional comments..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowResponseModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={respondToMeetingMutation.isPending}>
                {respondToMeetingMutation.isPending ? "Sending..." : "Send Response"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}