import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Users, Check, X, AlertCircle } from "lucide-react";
import { format, addDays, startOfDay, addHours, isBefore, isAfter } from "date-fns";
import type { User as UserType, Event } from "@shared/schema";

interface CalendarComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: UserType[];
  proposedDate: Date;
  proposedTime: string;
  duration: number;
  onSelectTime: (dateTime: Date) => void;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflicts: Event[];
  participantAvailability: { [userId: string]: boolean };
}

export function CalendarComparisonModal({
  isOpen,
  onClose,
  participants,
  proposedDate,
  proposedTime,
  duration,
  onSelectTime,
}: CalendarComparisonModalProps) {
  const [selectedDate, setSelectedDate] = useState(proposedDate);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && participants.length > 0) {
      generateTimeSlots();
    }
  }, [isOpen, participants, selectedDate, duration]);

  const generateTimeSlots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate time slots for the selected date
      const slots: TimeSlot[] = [];
      const startOfDayDate = startOfDay(selectedDate);
      
      // Generate slots from 9 AM to 5 PM (8 hours)
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = addHours(startOfDayDate, hour);
        const slotEnd = addHours(slotStart, duration / 60);
        
        // Don't create slots that go past 6 PM
        if (slotEnd.getHours() > 18) break;
        
        const slot: TimeSlot = {
          start: slotStart,
          end: slotEnd,
          available: true,
          conflicts: [],
          participantAvailability: {},
        };

        // Check availability for each participant
        for (const participant of participants) {
          // For demo purposes, we'll simulate some conflicts
          // In a real app, this would fetch actual calendar data
          const hasConflict = Math.random() < 0.3; // 30% chance of conflict
          slot.participantAvailability[participant.id] = !hasConflict;
          
          if (hasConflict) {
            slot.available = false;
            slot.conflicts.push({
              id: Math.random(),
              title: `${participant.firstName}'s Meeting`,
              startTime: slotStart,
              endTime: slotEnd,
              calendarId: 1,
              location: "Office",
              description: "Conflicting meeting",
              allDay: false,
              attendees: [],
              recurring: false,
              externalId: "",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        slots.push(slot);
      }

      setTimeSlots(slots);
    } catch (err) {
      setError("Failed to load calendar data. Please try again.");
      console.error("Error generating time slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (slot: TimeSlot) => {
    const availableCount = Object.values(slot.participantAvailability).filter(Boolean).length;
    const totalCount = participants.length;
    const percentage = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;
    
    if (percentage === 100) return "bg-green-100 border-green-300 text-green-800";
    if (percentage >= 75) return "bg-yellow-100 border-yellow-300 text-yellow-800";
    if (percentage >= 50) return "bg-orange-100 border-orange-300 text-orange-800";
    return "bg-red-100 border-red-300 text-red-800";
  };

  const getAvailabilityText = (slot: TimeSlot) => {
    const availableCount = Object.values(slot.participantAvailability).filter(Boolean).length;
    const totalCount = participants.length;
    
    if (availableCount === totalCount) return "Everyone available";
    if (availableCount === 0) return "No one available";
    return `${availableCount}/${totalCount} available`;
  };

  const handleSelectTime = (slot: TimeSlot) => {
    onSelectTime(slot.start);
    onClose();
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    return `${format(slot.start, 'h:mm a')} - ${format(slot.end, 'h:mm a')}`;
  };

  const isProposedTime = (slot: TimeSlot) => {
    if (!proposedTime) return false;
    const [hours, minutes] = proposedTime.split(':').map(Number);
    return slot.start.getHours() === hours && slot.start.getMinutes() === minutes;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendar Comparison
          </DialogTitle>
          <DialogDescription>
            Compare participant availability to find the best meeting time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                  const date = addDays(proposedDate, dayOffset);
                  const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <Button
                      key={dayOffset}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => setSelectedDate(date)}
                      className="flex flex-col items-center px-4 py-2 h-auto"
                    >
                      <div className="text-sm font-medium">
                        {format(date, 'EEE')}
                      </div>
                      <div className="text-lg">
                        {format(date, 'd')}
                      </div>
                      {isToday && (
                        <div className="text-xs text-muted-foreground">
                          Today
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <Badge key={participant.id} variant="secondary" className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    {participant.firstName} {participant.lastName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Available Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading availability...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          getAvailabilityColor(slot)
                        } ${isProposedTime(slot) ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleSelectTime(slot)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{formatTimeSlot(slot)}</span>
                            </div>
                            {isProposedTime(slot) && (
                              <Badge variant="default" className="text-xs">
                                Proposed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {getAvailabilityText(slot)}
                            </span>
                            {slot.available ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                        
                        {/* Participant availability details */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {participants.map((participant) => (
                            <div
                              key={participant.id}
                              className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                                slot.participantAvailability[participant.id]
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {slot.participantAvailability[participant.id] ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {participant.firstName}
                            </div>
                          ))}
                        </div>

                        {/* Conflicts */}
                        {slot.conflicts.length > 0 && (
                          <div className="mt-2 text-xs text-red-600">
                            Conflicts: {slot.conflicts.map(c => c.title).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={generateTimeSlots} disabled={loading}>
            Refresh Availability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}