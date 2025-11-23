import { AlertTriangle } from "lucide-react";
import type { Event, CalendarConnection } from "@shared/schema";

  const today = new Date();

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  meetings?: any[];
  connections: CalendarConnection[];
  viewMode: 'month' | 'week' | 'day';
}

export function CalendarGrid({ currentDate, events, meetings = [], connections, viewMode }: CalendarGridProps) {
  const getEventsForDate = (date: Date) => {
    const calendarEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
    
    const meetingEvents = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.proposedDateTime);
      return meetingDate.toDateString() === date.toDateString();
    }).map(meeting => ({
      id: `meeting-${meeting.id}`,
      title: meeting.title,
      startTime: meeting.proposedDateTime,
      endTime: new Date(new Date(meeting.proposedDateTime).getTime() + (meeting.duration || 60) * 60000).toISOString(),
      isAllDay: false,
      location: meeting.location,
      description: meeting.description,
    }));
    
    return [...calendarEvents, ...meetingEvents];
  };

  const getEventColor = (event: Event) => {
    const colors = [
      'bg-blue-500/20 text-blue-300 border-blue-500/50',
      'bg-orange-500/20 text-orange-300 border-orange-500/50',
      'bg-green-500/20 text-green-300 border-green-500/50',
      'bg-purple-500/20 text-purple-300 border-purple-500/50',
      'bg-red-500/20 text-red-300 border-red-500/50',
    ];
    return colors[event.id % colors.length];
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  switch (viewMode) {
    case 'month':
      return <MonthView currentDate={currentDate} events={events} getEventsForDate={getEventsForDate} getEventColor={getEventColor} isToday={isToday} />;
    case 'week':
      return <WeekView currentDate={currentDate} events={events} getEventsForDate={getEventsForDate} getEventColor={getEventColor} isToday={isToday} formatTime={formatTime} />;
    case 'day':
      return <DayView currentDate={currentDate} events={events} getEventsForDate={getEventsForDate} getEventColor={getEventColor} isToday={isToday} formatTime={formatTime} />;
  }
}

// ============================================
// MONTH VIEW
// ============================================
function MonthView({ 
  currentDate, 
  events, 
  getEventsForDate, 
  getEventColor, 
  isToday 
}: {
  currentDate: Date;
  events: Event[];
  getEventsForDate: (date: Date) => Event[];
  getEventColor: (event: Event) => string;
  isToday: (date: Date) => boolean;
}) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const hasConflicts = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length < 2) return false;
    
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const event1 = dayEvents[i];
        const event2 = dayEvents[j];
        if (event1.startTime < event2.endTime && event1.endTime > event2.startTime) {
          return true;
        }
      }
    }
    return false;
  };

  const calendarDays = getCalendarDays();

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const dayHasConflicts = hasConflicts(date);
          const isTodayDate = isToday(date);
          
          return (
	    <div
              key={index}
	      onClick={() => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		window.location.href = `/calendar/day/${year}-${month}-${day}`;
	      }}
              className={`relative aspect-square p-1 sm:p-2 border border-border rounded-sm transition-colors cursor-pointer ${
                isTodayDate 
                  ? 'bg-primary/10 border-primary' 
                  : isCurrentMonthDay 
                    ? 'bg-card hover:bg-secondary/50' 
                    : 'bg-muted/30'
              }`}
            >
              <div className={`text-xs sm:text-sm mb-1 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                isTodayDate
                  ? 'bg-primary text-primary-foreground font-bold'
                  : isCurrentMonthDay 
                    ? 'text-foreground' 
                    : 'text-muted-foreground'
              }`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-0.5 overflow-hidden">
	        {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (event.id.toString().startsWith('meeting-')) {
                        const meetingId = event.id.toString().replace('meeting-', '');
                        window.location.href = `/meetings/${meetingId}`;
                      }
                    }}
                    className={`text-xs px-1 py-0.5 rounded truncate border-l-2 cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                    title={event.title}
                  >
                    <span className="hidden sm:inline">{event.title}</span>
                    <span className="sm:hidden">•</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
              
              {dayHasConflicts && (
                <div className="absolute top-1 right-1">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// WEEK VIEW
// ============================================
function WeekView({ 
  currentDate, 
  events, 
  getEventsForDate, 
  getEventColor, 
  isToday,
  formatTime 
}: {
  currentDate: Date;
  events: Event[];
  getEventsForDate: (date: Date) => Event[];
  getEventColor: (event: Event) => string;
  isToday: (date: Date) => boolean;
  formatTime: (date: Date) => string;
}) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM
  
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForHour = (date: Date, hour: number) => {
    return getEventsForDate(date).filter(event => {
      const eventHour = new Date(event.startTime).getHours();
      return eventHour === hour;
    });
  };

  const weekDays = getWeekDays();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-px mb-1">
          <div className="p-2"></div>
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={`text-center p-2 rounded-t-md ${
                isToday(day) ? 'bg-primary/10' : ''
              }`}
            >
              <div className="text-xs text-muted-foreground">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-semibold ${
                isToday(day) 
                  ? 'bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto' 
                  : 'text-foreground'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="border border-border rounded-md overflow-hidden">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-px border-b border-border last:border-b-0">
              <div className="p-2 text-xs text-muted-foreground text-right pr-3 bg-muted/30">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDays.map((day, dayIndex) => {
                const hourEvents = getEventsForHour(day, hour);
                return (
                  <div 
                    key={dayIndex} 
                    className={`min-h-[50px] p-1 border-l border-border ${
                      isToday(day) ? 'bg-primary/5' : 'bg-card'
                    }`}
                  >
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded border-l-2 mb-1 ${getEventColor(event)}`}
                        title={`${event.title} - ${formatTime(new Date(event.startTime))}`}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-[10px] opacity-75">{formatTime(new Date(event.startTime))}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// DAY VIEW
// ============================================
function DayView({ 
  currentDate, 
  events, 
  getEventsForDate, 
  getEventColor, 
  isToday,
  formatTime 
}: {
  currentDate: Date;
  events: Event[];
  getEventsForDate: (date: Date) => Event[];
  getEventColor: (event: Event) => string;
  isToday: (date: Date) => boolean;
  formatTime: (date: Date) => string;
}) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 10 PM
  const dayEvents = getEventsForDate(currentDate);

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter(event => {
      const eventHour = new Date(event.startTime).getHours();
      return eventHour === hour;
    });
  };

  const getEventDuration = (event: Event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const durationMs = end.getTime() - start.getTime();
    return Math.max(1, Math.round(durationMs / (1000 * 60 * 60))); // Duration in hours, minimum 1
  };

  return (
    <div>
      {/* Day Header */}
      <div className={`text-center p-4 mb-4 rounded-lg ${isToday(currentDate) ? 'bg-primary/10' : 'bg-muted/30'}`}>
        <div className="text-sm text-muted-foreground">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
        <div className={`text-3xl font-bold ${isToday(currentDate) ? 'text-primary' : 'text-foreground'}`}>
          {currentDate.getDate()}
        </div>
        <div className="text-sm text-muted-foreground">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* All Day Events */}
      {dayEvents.filter(e => e.isAllDay).length > 0 && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-medium text-muted-foreground mb-2">ALL DAY</div>
          <div className="space-y-1">
            {dayEvents.filter(e => e.isAllDay).map((event) => (
              <div
                key={event.id}
                className={`p-2 rounded border-l-4 ${getEventColor(event)}`}
              >
                <div className="font-medium">{event.title}</div>
                {event.location && (
                  <div className="text-xs opacity-75">{event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className="flex border-b border-border last:border-b-0">
              <div className="w-20 p-3 text-sm text-muted-foreground text-right bg-muted/30 flex-shrink-0">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="flex-1 min-h-[60px] p-2 bg-card">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-2 rounded border-l-4 mb-1 ${getEventColor(event)}`}
                    style={{ minHeight: `${getEventDuration(event) * 50}px` }}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {formatTime(new Date(event.startTime))} - {formatTime(new Date(event.endTime))}
                    </div>
                    {event.location && (
                      <div className="text-xs opacity-75 mt-1">📍 {event.location}</div>
                    )}
                    {event.description && (
                      <div className="text-xs mt-1 opacity-75">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Events Message */}
      {dayEvents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-lg font-medium mb-1">No events scheduled</div>
          <div className="text-sm">This day is free!</div>
        </div>
      )}
    </div>
  );
}
