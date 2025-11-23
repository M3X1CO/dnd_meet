import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TagSelector } from "@/components/tag-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Users, MessageSquare, Calendar } from "lucide-react";

export default function TagsTest() {
  const [selectedChatTags, setSelectedChatTags] = useState<any[]>([]);
  const [selectedMeetingTags, setSelectedMeetingTags] = useState<any[]>([]);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["/api/tags"],
  });

  const friendTags = tags.filter((tag: any) => tag.type === "friend");
  const groupTags = tags.filter((tag: any) => tag.type === "group");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Tag System Test</h1>
          <p className="text-gray-400">
            Test the unified tagging system for friends and groups
          </p>
        </div>

        {/* All Tags Overview */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Tag className="h-5 w-5" />
              All Available Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-gray-400">Loading tags...</div>
            ) : (
              <>
                {friendTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Friend Tags ({friendTags.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {friendTags.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          className="bg-blue-600 text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {groupTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Group Tags ({groupTags.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {groupTags.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          className="bg-green-600 text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tags.length === 0 && (
                  <div className="text-gray-400 text-center py-8">
                    No tags available. Create your first tag using the selectors below.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Chat Tag Selector */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Tag Selector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagSelector
              selectedTags={selectedChatTags}
              onTagsChange={setSelectedChatTags}
              context="chat"
            />
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Chat Tags:</h4>
              <div className="text-sm text-gray-400">
                {selectedChatTags.length === 0 
                  ? "No tags selected" 
                  : selectedChatTags.map(tag => tag.name).join(", ")
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Tag Selector */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meeting Tag Selector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagSelector
              selectedTags={selectedMeetingTags}
              onTagsChange={setSelectedMeetingTags}
              context="meeting"
            />
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Meeting Tags:</h4>
              <div className="text-sm text-gray-400">
                {selectedMeetingTags.length === 0 
                  ? "No tags selected" 
                  : selectedMeetingTags.map(tag => tag.name).join(", ")
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => console.log("Chat tags:", selectedChatTags)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Log Chat Tags
              </Button>
              <Button
                onClick={() => console.log("Meeting tags:", selectedMeetingTags)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Log Meeting Tags
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}