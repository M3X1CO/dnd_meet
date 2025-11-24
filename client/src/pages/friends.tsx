import { useState } from "react";
import { Users, UserPlus, Search, MessageCircle, Calendar as CalendarIcon, UsersIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavigationMenu } from "@/components/navigation-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType, Friendship, MeetingSuggestion, ChatGroup } from "@shared/schema";

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search" | "users">("friends");

  const { data: friends = [], isLoading: friendsLoading } = useQuery<UserType[]>({
    queryKey: ['/api/friends'],
  });

  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<Friendship[]>({
    queryKey: ['/api/friend-requests'],
  });

  const { data: sentRequests = [], isLoading: sentLoading } = useQuery<Friendship[]>({
    queryKey: ['/api/friend-requests/sent'],
  });

  const { data: searchResults = [], isLoading: searchLoading } = useQuery<UserType[]>({
    queryKey: ['/api/search/users', searchQuery],
    enabled: searchQuery.length > 0,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ['/api/users/all'],
  });

  const { data: allMeetings = [] } = useQuery<MeetingSuggestion[]>({
    queryKey: ['/api/meetings/all'],
  });

  const { data: allGroups = [] } = useQuery<ChatGroup[]>({
    queryKey: ['/api/chat-groups/all'],
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (addresseeId: string) => {
      await apiRequest('POST', '/api/friend-requests', { addresseeId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests/sent'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest('POST', `/api/friend-requests/${requestId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest('POST', `/api/friend-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest('DELETE', `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend removed",
        description: "The friend has been removed from your friends list.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (user: UserType) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = (user: UserType) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Unknown User";
  };

  const isRequestSent = (userId: string) => {
    return sentRequests.some(request => request.addresseeId === userId && request.status === 'pending');
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  const getUserMeetings = (userId: string) => {
    return allMeetings.filter(m => m.suggestedById === userId);
  };

  const getUserGroups = (userId: string) => {
    return allGroups.filter(g => g.createdById === userId);
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16">
            <NavigationMenu currentPage="/friends" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Friends</h2>
            <p className="text-muted-foreground mt-1">
              Connect with friends and manage your social network
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === "friends" ? "default" : "outline"}
            onClick={() => setActiveTab("friends")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "outline"}
            onClick={() => setActiveTab("requests")}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Requests ({friendRequests.length})
          </Button>
          <Button
            variant={activeTab === "search" ? "default" : "outline"}
            onClick={() => setActiveTab("search")}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Find Friends
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            All Users ({allUsers.length})
          </Button>
        </div>

        {activeTab === "users" && (
          <div className="space-y-4">
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading users...</p>
              </div>
            ) : allUsers.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {allUsers.map((userItem) => {
                  const userMeetings = getUserMeetings(userItem.id);
                  const userGroups = getUserGroups(userItem.id);
                  
                  return (
                    <Card key={userItem.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(userItem)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {getUserDisplayName(userItem)}
                            </CardTitle>
                            <p className="text-muted-foreground text-sm">{userItem.email}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {userMeetings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                              <CalendarIcon className="h-4 w-4" />
                              Meetings
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {userMeetings.map((meeting) => (
                                <Button
                                  key={meeting.id}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => window.location.href = `/meetings/${meeting.id}`}
                                >
                                  {meeting.title}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {userGroups.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                              <UsersIcon className="h-4 w-4" />
                              Groups
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {userGroups.map((group) => (
                                <Button
                                  key={group.id}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => window.location.href = `/groups/${group.id}`}
                                >
                                  {group.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {userMeetings.length === 0 && userGroups.length === 0 && (
                          <p className="text-sm text-muted-foreground">No meetings or groups yet</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  There are no other users on the platform yet
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for friends by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-4">
                {searchResults.map((searchUser) => (
                  <Card key={searchUser.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(searchUser)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {getUserDisplayName(searchUser)}
                            </h3>
                            <p className="text-muted-foreground text-sm">{searchUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isFriend(searchUser.id) ? (
                            <Badge variant="secondary">Friends</Badge>
                          ) : isRequestSent(searchUser.id) ? (
                            <Badge variant="outline">Request Sent</Badge>
                          ) : searchUser.id !== user?.id ? (
                            <Button
                              onClick={() => sendRequestMutation.mutate(searchUser.id)}
                              disabled={sendRequestMutation.isPending}
                              size="sm"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add Friend
                            </Button>
                          ) : (
                            <Badge variant="outline">You</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchQuery.length > 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter a name or email to search for friends</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="space-y-4">
            {friendsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading friends...</p>
              </div>
            ) : friends.length > 0 ? (
              <div className="grid gap-4">
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(friend)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {getUserDisplayName(friend)}
                            </h3>
                            <p className="text-muted-foreground text-sm">{friend.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFriendMutation.mutate(friend.id)}
                            disabled={removeFriendMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your network by searching for friends
                </p>
                <Button onClick={() => setActiveTab("search")}>
                  <Search className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading requests...</p>
              </div>
            ) : friendRequests.length > 0 ? (
              <div className="grid gap-4">
                {friendRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {request.requester?.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {request.requester?.firstName && request.requester?.lastName
                                ? `${request.requester.firstName} ${request.requester.lastName}`
                                : request.requester?.email || "Unknown User"}
                            </h3>
                            <p className="text-muted-foreground text-sm">{request.requester?.email}</p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => acceptRequestMutation.mutate(request.id)}
                            disabled={acceptRequestMutation.isPending}
                            size="sm"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => rejectRequestMutation.mutate(request.id)}
                            disabled={rejectRequestMutation.isPending}
                            size="sm"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No friend requests</h3>
                <p className="text-muted-foreground">
                  You don't have any pending friend requests
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
