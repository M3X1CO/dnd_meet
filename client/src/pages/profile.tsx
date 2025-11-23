import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavigationMenu } from "@/components/navigation-menu";
import { User, Edit2, Save, X, MapPin, Tag, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User as UserType } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    tags: [] as string[],
    longitude: null as number | null,
    latitude: null as number | null,
  });

  // Suggested tags in alphabetical order
  const suggestedTags = [
    "D&D",
    "D&D - 1st",
    "D&D - 2nd", 
    "D&D - 3.5",
    "D&D - 4th",
    "D&D - 5th",
    "D20",
    "Gurps",
    "Magic The Gathering (MTG)",
    "Pathfinder",
    "Pokémon",
    "Shadowrun",
    "Starfinder",
    "Vampire the Masquerade",
    "White Wolf"
  ];

  // Redirect if not authenticated
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

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        location: user.location || '',
        tags: user.tags || [],
        longitude: user.longitude || null,
        latitude: user.latitude || null,
      });
    }
  }, [user]);



  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      console.log("Sending profile update request:", data);
      const response = await apiRequest('PUT', '/api/profile', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    console.log("Saving profile data:", formData);
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        location: user.location || '',
        tags: user.tags || [],
        longitude: user.longitude || null,
        latitude: user.latitude || null,
      });
    }
    setIsEditing(false);
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCustomTagAdd = () => {
    if (customTagInput.trim()) {
      addTag(customTagInput.trim());
      setCustomTagInput('');
    }
  };

  const handleCustomTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomTagAdd();
    }
  };

  const handleSuggestedTagSelect = (tag: string) => {
    addTag(tag);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16">
            <NavigationMenu currentPage="/profile" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Info */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile Information</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="flex-shrink-0">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-primary/20 shadow-lg">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary font-semibold">
                        {user.firstName?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 text-center sm:text-left w-full">
                    <div className="mb-4">
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.email || 'User'
                        }
                      </h2>
                      {user.location && (
                        <div className="flex items-center justify-center sm:justify-start text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">{user.location}</span>
                        </div>
                      )}
                      {user.tags && user.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
                          {user.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                </div>

                <Separator />

                {/* Searchable Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Meeting Types</Label>
                    {isEditing && (
                      <Badge variant="outline" className="text-xs">
                        Editing Mode
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Add tags to help others find you based on the types of meetings you're interested in. Great for finding gaming groups, hobby partners, and activity companions.
                  </p>
                  
                  {/* Current Tags Display */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="flex items-center gap-1 text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        {isEditing && (
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {formData.tags.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No tags added yet. {isEditing ? 'Add some tags below to help others find you!' : 'Edit your profile to add tags.'}
                      </p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="space-y-3">
                      {/* Suggested Tags Dropdown */}
                      <div>
                        <Label htmlFor="suggestedTags" className="text-sm font-medium">
                          Popular Tags
                        </Label>
                        <Select onValueChange={handleSuggestedTagSelect}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select from popular tags..." />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestedTags
                              .filter(tag => !formData.tags.includes(tag))
                              .map(tag => (
                                <SelectItem key={tag} value={tag}>
                                  {tag}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Custom Tag Input */}
                      <div>
                        <Label htmlFor="customTag" className="text-sm font-medium">
                          Custom Tag
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="customTag"
                            placeholder="Enter a custom tag..."
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value)}
                            onKeyPress={handleCustomTagKeyPress}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCustomTagAdd}
                            disabled={!customTagInput.trim() || formData.tags.includes(customTagInput.trim())}
                            className="px-3"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Press Enter or click + to add your custom tag
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>


        </div>
      </div>
    </div>
  );
}
