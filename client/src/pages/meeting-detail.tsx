import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NavigationMenu } from "@/components/navigation-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, MapPin, Clock, Users, ArrowLeft, Edit, UserPlus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { MeetingSuggestion, User as UserType } from "@shared/schema";

export default function MeetingDetail() {
  const params = useParams();
  const meetingId = parseInt(params.id as string);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editDuration, setEditDuration] = useState("60");
  const [isPrivate, setIsPrivate] = useState(false);
  const [editImage, setEditImage] = useState<string | null>(null);

  const { data: meeting, isLoading } = useQuery<MeetingSuggestion>({
    queryKey: [`/api/meetings/${meetingId}`],
    enabled: !isNaN(meetingId),
  });

  const { data: participants = [] } = useQuery<UserType[]>({
    queryKey: [`/api/meetings/${meetingId}/participants`],
    enabled: !isNaN(meetingId),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/meetings/${meetingId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/participants`] });
      toast({ title: "Success", description: "You've joined the meeting!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to join meeting", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/meetings/${meetingId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      toast({ title: "Success", description: "Meeting updated!" });
      setIsEditMode(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update meeting", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Meeting deleted!" });
      window.location.href = '/meetings';
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete meeting", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    if (meeting) {
      setEditTitle(meeting.title);
      setEditDescription(meeting.description || "");
      setEditLocation(meeting.location || "");
      setEditDateTime(format(new Date(meeting.proposedDateTime), "yyyy-MM-dd'T'HH:mm"));
      setEditDuration(meeting.duration?.toString() || "60");
      setIsPrivate(meeting.isPrivate || false);
      setIsEditMode(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: editTitle.slice(0, 16),
      description: editDescription,
      location: editLocation,
      proposedDateTime: new Date(editDateTime).toISOString(),
      duration: parseInt(editDuration),
      isPrivate,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16">
              <NavigationMenu currentPage="/meetings" />
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Meeting Not Found</h2>
          <Button onClick={() => window.location.href = '/meetings'}>Back to Meetings</Button>
        </div>
      </div>
    );
  }

  const isCreator = meeting.suggestedById === user?.id;
  const isParticipant = participants.some(p => p.id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16">
            <NavigationMenu currentPage="/meetings" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/meetings'}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Button>

        <Card className="relative overflow-hidden">
          {/* Background Image with Overlay */}
          {meeting.backgroundImageUrl && (
            <div className="absolute inset-0 z-0">
              <img 
                src={meeting.backgroundImageUrl} 
                alt="Meeting background" 
                className="w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out"
                onLoad={(e) => {
                  e.currentTarget.classList.remove('opacity-0');
                  e.currentTarget.classList.add('opacity-100');
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
            </div>
          )}

          {/* Content with relative positioning to appear above background */}
          <div className="relative z-10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={
                      meeting.status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                      meeting.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-gray-500/10 text-gray-500'
                    }>
                      {meeting.status}
                    </Badge>
                    {meeting.isPrivate && <Badge variant="secondary">Private</Badge>}
                    {isCreator && <Badge variant="outline">Creator</Badge>}
                  </div>
                  <CardTitle className="text-3xl">{meeting.title}</CardTitle>
                  {meeting.description && (
                    <p className="text-muted-foreground mt-2">{meeting.description}</p>
                  )}
                </div>
                {isCreator && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm("Delete this meeting?")) deleteMutation.mutate();
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center text-muted-foreground p-3 rounded-lg bg-card/80 backdrop-blur-sm border">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {format(new Date(meeting.proposedDateTime), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm">
                      {format(new Date(meeting.proposedDateTime), 'h:mm a')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-muted-foreground p-3 rounded-lg bg-card/80 backdrop-blur-sm border">
                  <Clock className="h-5 w-5 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Duration</div>
                    <div className="text-sm">{meeting.duration || 60} minutes</div>
                  </div>
                </div>

                {meeting.location && (
                  <div className="flex items-center text-muted-foreground p-3 rounded-lg bg-card/80 backdrop-blur-sm border sm:col-span-2">
                    <MapPin className="h-5 w-5 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Location</div>
                      <div className="text-sm">{meeting.location}</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Participants ({participants.length})
                  </h3>
                  {!isParticipant && !isCreator && (
                    <Button size="sm" onClick={() => joinMutation.mutate()}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Meeting
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card/80 backdrop-blur-sm">
                      <Avatar>
                        <AvatarFallback>
                          {(participant.firstName?.[0] || participant.email[0]).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {participant.firstName || participant.email}
                        </div>
                        {participant.firstName && (
                          <div className="text-sm text-muted-foreground truncate">{participant.email}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <p className="text-sm text-muted-foreground">Update your meeting details below.</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title * (Max 16 characters)</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value.slice(0, 16))}
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground">{editTitle.length}/16</p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Update Background Image
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "Image must be less than 5MB",
                        variant: "destructive",
                      });
                      return;
                    }
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
                        const canvas = document.createElement('canvas');
                        const maxWidth = 1200;
                        const maxHeight = 500;
                        
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > maxWidth || height > maxHeight) {
                          const ratio = Math.min(maxWidth / width, maxHeight / height);
                          width = width * ratio;
                          height = height * ratio;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, width, height);
                        
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        setEditImage(compressedBase64);
                      };
                      img.src = reader.result as string;
                    };
                    reader.readAsDataURL(file);
                  }
                }}

                className="cursor-pointer"
              />

              <p className="text-xs text-muted-foreground">
                Upload a new background image (max 5MB). Recommended: 1200×500px or 2.4:1 aspect ratio.
              </p>              
              {(editImage || meeting.backgroundImageUrl) && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <img 
                    src={editImage || meeting.backgroundImageUrl!} 
                    alt="Background preview" 
                    className="w-full h-full object-cover"
                  />
                  {editImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setEditImage(null)}
                    >
                      Remove New
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={editDateTime}
                onChange={(e) => setEditDateTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                min="15"
                max="480"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="isPrivate" className="text-sm font-normal">
                Private meeting (requires approval to join)
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsEditMode(false);
              setEditImage(null);
            }}>Cancel</Button>
            <Button onClick={async () => {
              await updateMutation.mutateAsync({
                title: editTitle.slice(0, 16),
                description: editDescription,
                location: editLocation,
                proposedDateTime: new Date(editDateTime).toISOString(),
                duration: parseInt(editDuration),
                isPrivate,
              });
              if (editImage) {
                try {
                  await apiRequest("POST", `/api/meetings/${meetingId}/background`, { image: editImage });
                  queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
                  toast({ title: "Success", description: "Background image updated!" });
                } catch (error) {
                  toast({ title: "Error", description: "Failed to update image", variant: "destructive" });
                }
              }
              setEditImage(null);
            }} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
