import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, MessageSquare, MapPin } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Meet
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 mb-8">
            Connect your calendars, find friends, and coordinate meetings seamlessly
          </p>
          <Button 
            size="lg" 
            className="px-8 py-4 text-lg bg-indigo-600 hover:bg-indigo-700"
            onClick={() => window.location.href = '/login'}
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center bg-gray-800 border-gray-700">
            <CardHeader>
              <Calendar className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
              <CardTitle className="text-white">Calendar Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Connect Google Calendar, Outlook, and iCloud to sync all your events in one place
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-gray-800 border-gray-700">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
              <CardTitle className="text-white">Social Features</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Find friends, send requests, and build your network for better coordination
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-gray-800 border-gray-700">
            <CardHeader>
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
              <CardTitle className="text-white">Group Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Create chat groups, coordinate with friends, and suggest meeting times
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-gray-800 border-gray-700">
            <CardHeader>
              <MapPin className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
              <CardTitle className="text-white">Location-Based</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Discover friends nearby and coordinate meetings based on location
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to sync your social calendar?
          </h2>
          <Button 
            size="lg" 
            variant="outline" 
            className="px-8 py-4 text-lg border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white"
            onClick={() => window.location.href = '/login'}
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
