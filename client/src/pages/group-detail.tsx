import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NavigationMenu } from "@/components/navigation-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, ArrowLeft, Edit, Crown, MessageCircle, Calendar, UserPlus, Lock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { ChatGroup, User as UserType } from "@shared/schema";
import { MOBILE_DEFAULT_IMAGES } from "@/lib/constants";

export default function GroupDetail() {
  const params = useParams();
  const groupId = parseInt(params.id as string);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [editImage, setEditImage] = useState<string | null>(null);

  const { data: group, isLoading } = useQuery<ChatGroup>({
    queryKey: [`/api/chat-groups/${groupId}`],
    enabled: !isNaN(groupId),
  });

  const { data: members = [] } = useQuery<UserType[]>({
    queryKey: [`/api/chat-groups/${groupId}/members`],
    enabled: !isNaN(groupId),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/chat-groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat-groups/${groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat-groups/${groupId}/members`] });
      toast({ title: "Success", description: group?.isPrivate ? "Join request sent!" : "You've joined the group!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to join group", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/chat-groups/${groupId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat-groups/${groupId}`] });
      toast({ title: "Success", description: "Group updated!" });
      setIsEditMode(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update group", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/chat-groups/${groupId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Group deleted!" });
      window.location.href = "/groups";
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete group", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    if (group) {
      setEditName(group.name);
      setEditDescription(group.description || "");
      setIsPrivate(group.isPrivate || false);
      setIsEditMode(true);
    }
  };

  const getBackgroundImage = () => {
    if (!group) return null;
    
    if (isMobile && group.mobileImageIndex !== null && group.mobileImageIndex !== undefined) {
      return MOBILE_DEFAULT_IMAGES[group.mobileImageIndex];
    }
    
    return group.backgroundImageUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16">
              <NavigationMenu currentPage="/groups" />
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Group Not Found</h2>
          <Button onClick={() => (window.location.href = "/groups")}>Back to Groups</Button>
        </div>
      </div>
    );
  }

  const isCreator = group.createdById === user?.id;
  const isMember = members.some((m) => m.id === user?.id);
  const backgroundImage = getBackgroundImage();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16">
            <NavigationMenu currentPage="/groups" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => (window.location.href = "/groups")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>

        <Card className="relative overflow-hidden">
          {backgroundImage && (
            <div className="absolute inset-0 z-0">
              <img
                src={backgroundImage}
                alt="Group background"
                className="w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out"
                onLoad={(e) => {
                  e.currentTarget.classList.remove("opacity-0");
                  e.currentTarget.classList.add("opacity-100");
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
            </div>
          )}

          <div className="relative z-10">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                    {group.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {group.isPrivate && (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    {isCreator && (
                      <Badge variant="outline">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-3xl">{group.name}</CardTitle>

                  {group.description && <p className="text-muted-foreground mt-2">{group.description}</p>}

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {members.length} members
                    </div>
                    <div>Created {format(new Date(group.createdAt!), "MMM d, yyyy")}</div>
                  </div>
                </div>

                {isCreator && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Delete this group?")) deleteMutation.mutate();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {!isMember && !isCreator && (
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => joinMutation.mutate()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {group.isPrivate ? "Request to Join" : "Join Group"}
                  </Button>
                </div>
              )}

              {(isMember || isCreator) && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => (window.location.href = "/chat")}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Chat
                  </Button>
                  <Button className="flex-1" onClick={() => (window.location.href = "/meetings")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Suggest Meeting
                  </Button>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Members ({members.length})
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {members.map((member) => {
                    const isOwner = member.id === group.createdById;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-card/80 backdrop-blur-sm"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {(member.firstName?.[0] || member.email?.[0] || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate flex items-center gap-2">
                            {member.firstName || member.email}
                            {isOwner && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </Badge>
                            )}
                          </div>
                          {member.firstName && (
                            <div className="text-sm text-muted-foreground truncate">{member.email}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update your group details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Group Name *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            {!isMobile && (
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
                    if (!file) return;

                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "Image must be less than 5MB",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (!file.type.startsWith("image/")) {
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
                  }}
                  className="cursor-pointer"
                />

                <p className="text-xs text-muted-foreground">Upload a new background image (max 5MB). Recommended: 1200×500px or 2.4:1 aspect ratio.</p>
                  
                {(editImage || group.backgroundImageUrl) && (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                    <img
                      src={editImage || group.backgroundImageUrl!}
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
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="isPrivate" className="text-sm font-normal">
                Private group (requires approval to join)
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditMode(false);
                setEditImage(null);
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                await updateMutation.mutateAsync({
                  name: editName,
                  description: editDescription,
                  isPrivate,
                });

                if (editImage && !isMobile) {
                  try {
                    await apiRequest("POST", `/api/chat-groups/${groupId}/background`, {
                      image: editImage,
                    });
                    queryClient.invalidateQueries({ queryKey: [`/api/chat-groups/${groupId}`] });
                    toast({ title: "Success", description: "Background image updated!" });
                  } catch {
                    toast({ title: "Error", description: "Failed to update image", variant: "destructive" });
                  }
                }

                setEditImage(null);
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
