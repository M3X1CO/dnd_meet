import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, User, Plus, X, CalendarDays, ImagePlus } from "lucide-react";
import { format } from "date-fns";
import { CalendarComparisonModal } from "./calendar-comparison-modal";
import type { User as UserType } from "@shared/schema";

interface UnifiedMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedMeetingModal({ isOpen, onClose }: UnifiedMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("60");
  const [requiresAllAccept, setRequiresAllAccept] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<UserType[]>([]);
  const [showCalendarComparison, setShowCalendarComparison] = useState(false);
  const [comparisonDateTime, setComparisonDateTime] = useState<Date | null>(null);
  const [meetingImage, setMeetingImage] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's friends for participant selection
  const { data: friends = [] } = useQuery<UserType[]>({
    queryKey: ['/api/friends'],
    enabled: isOpen,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Compress image to reasonable size
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 500;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to 80% quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setMeetingImage(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const createMeetingMutation = useMutation({
      mutationFn: async (data: any) => {
        const dateTime = comparisonDateTime || new Date(`${proposedDate}T${proposedTime}`);
        const requestData = {
          title,
          description,
          proposedDateTime: dateTime.toISOString(),
          location,
          duration: parseInt(duration),
          requiresAllAccept,
          participants: selectedParticipants.map(p => p.id),
          image: meetingImage,
        };

        const response = await apiRequest('POST', '/api/meetings', requestData);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create meeting');
        }
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Meeting Created",
          description: "Your meeting has been created successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/meetings/user"] });
        onClose();
        resetForm();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create meeting. Please try again.",
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
    setShowCalendarComparison(false);
    setComparisonDateTime(null);
    setMeetingImage(null);
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

    createMeetingMutation.mutate({});
  };

  const addParticipant = (friend: UserType) => {
    if (!selectedParticipants.find(p => p.id === friend.id)) {
      setSelectedParticipants([...selectedParticipants, friend]);
    }
  };

  const removeParticipant = (friendId: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== friendId));
  };

  const openCalendarComparison = () => {
    if (!proposedDate || !proposedTime) {
      toast({
        title: "Missing Date/Time",
        description: "Please select a date and time first.",
        variant: "destructive",
      });
      return;
    }

    const dateTime = new Date(`${proposedDate}T${proposedTime}`);
    setComparisonDateTime(dateTime);
    setShowCalendarComparison(true);
  };

  const handleDateTimeFromComparison = (dateTime: Date) => {
    setComparisonDateTime(dateTime);
    setProposedDate(format(dateTime, 'yyyy-MM-dd'));
    setProposedTime(format(dateTime, 'HH:mm'));
    setShowCalendarComparison(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Suggest Meeting
            </DialogTitle>
            <DialogDescription>
              Create a new meeting and optionally invite friends to join.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">

            <Separator />

	    {/* Basic Meeting Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title * (Max 16 characters)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 16))}
                  placeholder="Short title (16 max)"
                  maxLength={16}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image for the meeting background (max 5MB). Recommended: 1200×500px or 2.4:1 aspect ratio.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this meeting about?"
                  rows={3}
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Meeting Background Image (Optional)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image to use as the meeting background (max 5MB)
                </p>
                {meetingImage && (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                    <img 
                      src={meetingImage} 
                      alt="Meeting background preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setMeetingImage(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
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
                  placeholder="Where will this meeting take place?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
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
            </div>

            <Separator />

            {/* Participants Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Invite Friends (Optional)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={openCalendarComparison}
                  className="flex items-center gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  Compare Calendars
                </Button>
              </div>
              
              {selectedParticipants.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Selected Friends ({selectedParticipants.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedParticipants.map((participant) => (
                      <Badge key={participant.id} variant="secondary" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {participant.firstName || participant.email}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeParticipant(participant.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <ScrollArea className="h-40 border rounded-md p-2">
                <div className="space-y-2">
                  {friends.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No friends found. Add friends to invite them to meetings.
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{friend.firstName || friend.email}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addParticipant(friend)}
                          disabled={selectedParticipants.find(p => p.id === friend.id) !== undefined}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Require All to Accept</Label>
                  <p className="text-sm text-muted-foreground">
                    Meeting will only be confirmed if everyone accepts
                  </p>
                </div>
                <Switch
                  checked={requiresAllAccept}
                  onCheckedChange={setRequiresAllAccept}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                onClose();
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMeetingMutation.isPending}>
                {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showCalendarComparison && comparisonDateTime && (
        <CalendarComparisonModal
          isOpen={showCalendarComparison}
          onClose={() => setShowCalendarComparison(false)}
          onSelectDateTime={handleDateTimeFromComparison}
          participants={selectedParticipants}
          proposedDate={comparisonDateTime}
          proposedTime={format(comparisonDateTime, 'HH:mm')}
          duration={parseInt(duration)}
          onSelectTime={handleDateTimeFromComparison}
        />
      )}
    </>
  );
}
