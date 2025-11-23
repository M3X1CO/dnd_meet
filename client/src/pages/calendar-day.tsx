import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavigationMenu } from "@/components/navigation-menu";
import { Calendar, MapPin, Clock, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { Event, MeetingSuggestion } from "@shared/schema";

export default function CalendarDay() {
  const params = useParams();
  const dateStr = params.date as string;
  const selectedDate = new Date(dateStr);

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: meetings = [] } = useQuery<MeetingSuggestion[]>({
    queryKey: ['/api/meetings'],
  });

  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  const dayMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.proposedDateTime);
    return meetingDate.toDateString() === selectedDate.toDateString();
  });

  const allItems = [
    ...dayEvents.map(e => ({ type: 'event' as const, data: e, time: new Date(e.startTime) })),
    ...dayMeetings.map(m => ({ type: 'meeting' as const, data: m, time: new Date(m.proposedDateTime) }))
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16">
            <NavigationMenu currentPage="/" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/'}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calendar
        </Button>

        <div className="bg-primary/10 rounded-lg p-6 mb-6 text-center">
          <div className="text-sm text-muted-foreground mb-1">
            {format(selectedDate, 'EEEE')}
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">
            {format(selectedDate, 'd')}
          </div>
          <div className="text-lg text-muted-foreground">
            {format(selectedDate, 'MMMM yyyy')}
          </div>
        </div>

        {allItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Events or Meetings</h3>
              <p className="text-muted-foreground">This day is free!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allItems.map((item, index) => {
              if (item.type === 'meeting') {
                const meeting = item.data as MeetingSuggestion;
                return (
                  <Card 
                    key={`meeting-${meeting.id}`}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => window.location.href = `/meetings/${meeting.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">Meeting</Badge>
                            <Badge variant="outline" className={
                              meeting.status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                              meeting.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-gray-500/10 text-gray-500'
                            }>
                              {meeting.status}
                            </Badge>
                          </div>
                          <CardTitle>{meeting.title}</CardTitle>
                          {meeting.description && (
                            <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {format(new Date(meeting.proposedDateTime), 'h:mm a')} ({meeting.duration || 60} min)
                      </div>
                      {meeting.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {meeting.location}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {meeting.participants?.length || 0} participants
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                const event = item.data as Event;
                return (
                  <Card key={`event-${event.id}`} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">Calendar Event</Badge>
                          <CardTitle>{event.title}</CardTitle>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {event.isAllDay ? 'All Day' : `${format(new Date(event.startTime), 'h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}`}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}
