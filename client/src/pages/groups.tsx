import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NavigationMenu } from "@/components/navigation-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Users, Crown, Clock, Search, ImagePlus, X, UserPlus, UserMinus } from "lucide-react";
import type { ChatGroup, MeetingSuggestion } from "@shared/schema";

export default function Groups() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupImage, setGroupImage] = useState<string | null>(null);

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

  const { data: allGroups = [], isLoading: isLoadingAllGroups } = useQuery<ChatGroup[]>({
    queryKey: ["/api/chat-groups/all"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: userGroups = [], isLoading: isLoadingUserGroups } = useQuery<ChatGroup[]>({
    queryKey: ["/api/chat-groups"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: meetings = [] } = useQuery<MeetingSuggestion[]>({
    queryKey: ["/api/meetings"],
    enabled: isAuthenticated,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await fetch(`/api/chat-groups/${groupId}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to join group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-groups/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-groups"] });
      toast({ title: "Joined group successfully" });
    },
    onError: () => {
      toast({ title: "Failed to join group", variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await fetch(`/api/chat-groups/${groupId}/leave`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to leave group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-groups/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-groups"] });
      toast({ title: "Left group successfully" });
    },
    onError: () => {
      toast({ title: "Failed to leave group", variant: "destructive" });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setGroupImage(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPrivate: boolean }) => {
      const requestData = {
        ...data,
        image: groupImage,
      };
      const response = await apiRequest("POST", "/api/chat-groups", requestData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create group');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-groups/all"] });
      toast({
        title: "Success",
        description: "Group created successfully!",
      });
      setIsCreateModalOpen(false);
      setGroupName("");
      setGroupDescription("");
      setIsPrivate(false);
      setGroupImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      description: groupDescription.trim() || undefined,
      isPrivate,
    });
  };

  const userGroupIds = new Set(userGroups.map(g => g.id));
  const userCreatedGroups = userGroups.filter(g => g.createdById === user?.id);
  
  const availableGroups = allGroups
    .filter(g => !userGroupIds.has(g.id))
    .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));

  if (isLoading || isLoadingAllGroups || isLoadingUserGroups) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading groups...</p>
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
              currentPage="/groups" 
              actionButton={
                userCreatedGroups.length < 4 ? (
                  <Button 
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1 sm:gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create Group</span>
                    <span className="sm:hidden">New</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8">
        {/* My Groups Section */}
        {userGroups.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">My Groups</h2>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {userGroups.map((group) => {
                const groupMeetings = meetings.filter(m => m.groupId === group.id);
                const pendingCount = groupMeetings.filter(m => m.status === "pending").length;
                const isOwner = group.createdById === user?.id;
                
                return (
                  <Card 
                    key={`my-${group.id}`} 
                    className={`hover:shadow-lg transition-all ${isOwner ? 'ring-2 ring-primary/20' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => window.location.href = `/groups/${group.id}`}>
                          <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                              {group.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate hover:underline">{group.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {group.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {group.memberCount || 1}
                        </Badge>
                        {isOwner && (
                          <Badge variant="outline" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                        {pendingCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {pendingCount}
                          </Badge>
                        )}
                      </div>
                      {!isOwner && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            leaveMutation.mutate(group.id);
                          }}
                          disabled={leaveMutation.isPending}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Leave
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* All Available Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Discover Groups</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {availableGroups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Groups Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "All available groups have been joined."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {availableGroups.map((group) => (
                <Card 
                  key={`public-${group.id}`} 
                  className="hover:shadow-lg transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.href = `/groups/${group.id}`}>
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {group.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate hover:underline">{group.name}</CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {group.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {group.memberCount || 1} members
                    </Badge>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        joinMutation.mutate(group.id);
                      }}
                      disabled={joinMutation.isPending}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Join
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to organize meetings and chat with your friends.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                placeholder="e.g., Weekend Warriors, Study Group"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Textarea
                id="groupDescription"
                placeholder="What's this group about?"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Group Background Image (Optional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Upload an image for the group background (max 5MB). Recommended: 1200×500px or 2.4:1 aspect ratio.
              </p>
              {groupImage && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <img
                    src={groupImage}
                    alt="Group background preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setGroupImage(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPrivate" className="text-sm font-normal">
                Make this group private (hidden from discovery)
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setGroupName("");
                setGroupDescription("");
                setIsPrivate(false);
                setGroupImage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={createGroupMutation.isPending || !groupName.trim()}
            >
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
