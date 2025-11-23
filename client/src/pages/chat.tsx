import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MessageCircle, Users } from "lucide-react";
import { NavigationMenu } from "@/components/navigation-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { User, ChatMessage } from "@shared/schema";

interface DirectMessage extends ChatMessage {
  sender: User;
}

export default function Chat() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");

  // Get user's friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  // Get direct messages with selected friend
  const { data: messages = [], isLoading: messagesLoading } = useQuery<DirectMessage[]>({
    queryKey: ["/api/direct-messages", selectedFriend?.id],
    enabled: !!selectedFriend,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; content: string }) => {
      return await apiRequest("/api/direct-messages", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-messages", selectedFriend?.id] });
      setMessageContent("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedFriend) return;
    
    sendMessageMutation.mutate({
      recipientId: selectedFriend.id,
      content: messageContent.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <NavigationMenu currentPage="chat" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Friends Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-full">
                  {friendsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading friends...
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No friends found. Add some friends to start chatting!
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {friends.map((friend) => (
                        <Button
                          key={friend.id}
                          variant={selectedFriend?.id === friend.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setSelectedFriend(friend)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={friend.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {friend.firstName?.[0] || friend.email?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <div className="font-medium">
                                {friend.firstName && friend.lastName 
                                  ? `${friend.firstName} ${friend.lastName}`
                                  : friend.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {friend.email}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {selectedFriend ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedFriend.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {selectedFriend.firstName?.[0] || selectedFriend.email?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {selectedFriend.firstName && selectedFriend.lastName 
                        ? `${selectedFriend.firstName} ${selectedFriend.lastName}`
                        : selectedFriend.email}
                    </div>
                  ) : (
                    "Select a friend to start chatting"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {selectedFriend ? (
                  <>
                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4">
                      {messagesLoading ? (
                        <div className="text-center text-muted-foreground">
                          Loading messages...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.sender?.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {message.sender?.firstName?.[0] || message.sender?.email?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {message.sender?.firstName && message.sender?.lastName 
                                      ? `${message.sender.firstName} ${message.sender.lastName}`
                                      : message.sender?.email}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.createdAt!).toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-sm">{message.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                        />
                        <Button 
                          type="submit" 
                          disabled={!messageContent.trim() || sendMessageMutation.isPending}
                          className="px-3"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a friend to start chatting
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}