import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X, Plus, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TagSelectorProps {
  selectedTags: any[];
  onTagsChange: (tags: any[]) => void;
  context: "chat" | "meeting";
  contextId?: string | number;
}

export function TagSelector({ selectedTags, onTagsChange, context, contextId }: TagSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagType, setNewTagType] = useState<"friend" | "group">("friend");
  const [newTagEntityId, setNewTagEntityId] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["/api/tags"],
  });

  const createTagMutation = useMutation({
    mutationFn: async (tagData: any) => {
      return await apiRequest("/api/tags", {
        method: "POST",
        body: tagData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setIsCreating(false);
      setNewTagName("");
      setNewTagEntityId("");
      setNewTagColor("#6366f1");
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const endpoint = context === "chat" 
        ? `/api/chats/${contextId}/tags`
        : `/api/meetings/${contextId}/tags`;
      
      return await apiRequest(endpoint, {
        method: "POST",
        body: { tagId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${context}s/${contextId}/tags`] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const endpoint = context === "chat" 
        ? `/api/chats/${contextId}/tags/${tagId}`
        : `/api/meetings/${contextId}/tags/${tagId}`;
      
      return await apiRequest(endpoint, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${context}s/${contextId}/tags`] });
    },
  });

  const handleTagToggle = (tag: any) => {
    const isSelected = selectedTags.some(selected => selected.id === tag.id);
    
    if (isSelected) {
      // Remove tag
      if (contextId) {
        removeTagMutation.mutate(tag.id);
      }
      onTagsChange(selectedTags.filter(selected => selected.id !== tag.id));
    } else {
      // Add tag
      if (contextId) {
        addTagMutation.mutate(tag.id);
      }
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim() || !newTagEntityId.trim()) return;
    
    createTagMutation.mutate({
      name: newTagName.trim(),
      type: newTagType,
      entityId: newTagEntityId.trim(),
      color: newTagColor,
    });
  };

  const friendTags = tags.filter((tag: any) => tag.type === "friend");
  const groupTags = tags.filter((tag: any) => tag.type === "group");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-300">Tags</Label>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
              <Plus className="h-4 w-4 mr-1" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="tag-type">Type</Label>
                <Select value={newTagType} onValueChange={(value: "friend" | "group") => setNewTagType(value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entity-id">
                  {newTagType === "friend" ? "Friend User ID" : "Group ID"}
                </Label>
                <Input
                  id="entity-id"
                  value={newTagEntityId}
                  onChange={(e) => setNewTagEntityId(e.target.value)}
                  placeholder={newTagType === "friend" ? "Enter user ID" : "Enter group ID"}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="tag-color">Color</Label>
                <Input
                  id="tag-color"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="bg-gray-700 border-gray-600 w-full h-10"
                />
              </div>
              <Button 
                onClick={handleCreateTag} 
                disabled={!newTagName.trim() || !newTagEntityId.trim() || createTagMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {createTagMutation.isPending ? "Creating..." : "Create Tag"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="secondary" 
              className="bg-gray-700 text-white hover:bg-gray-600 cursor-pointer"
              style={{ backgroundColor: tag.color }}
              onClick={() => handleTagToggle(tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag.name}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Available Tags */}
      {!isLoading && (
        <div className="space-y-3">
          {friendTags.length > 0 && (
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Friends</Label>
              <div className="flex flex-wrap gap-2">
                {friendTags.map((tag: any) => {
                  const isSelected = selectedTags.some(selected => selected.id === tag.id);
                  return (
                    <Badge 
                      key={tag.id} 
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-indigo-600 text-white" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {groupTags.length > 0 && (
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Groups</Label>
              <div className="flex flex-wrap gap-2">
                {groupTags.map((tag: any) => {
                  const isSelected = selectedTags.some(selected => selected.id === tag.id);
                  return (
                    <Badge 
                      key={tag.id} 
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-indigo-600 text-white" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}