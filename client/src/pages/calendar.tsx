import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarSidebar } from "@/components/calendar-sidebar";
import { CalendarGrid } from "@/components/calendar-grid";
import { ImportModal } from "@/components/import-modal";
import { ComparisonModal } from "@/components/comparison-modal";
import { LoadingSpinner } from "@/components/loading-spinner";
import { NavigationMenu } from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarConnection, Event } from "@shared/schema";

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const { data: connections = [] } = useQuery<CalendarConnection[]>({
    queryKey: ['/api/connections'],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: meetings = [] } = useQuery<any[]>({
    queryKey: ['/api/meetings'],
  });

  console.log('Calendar meetings data:', meetings);

  const formatHeaderDate = (date: Date) => {
    switch (viewMode) {
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        }
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const offset = direction === 'next' ? 1 : -1;
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + offset);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (7 * offset));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + offset);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setViewMode('month');
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16">
            <NavigationMenu currentPage="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <CalendarSidebar
              connections={connections}
              onImportClick={() => setIsImportModalOpen(true)}
              onCompareClick={() => setIsComparisonModalOpen(true)}
              onExportClick={() => {/* TODO: Implement export */}}
            />
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-card rounded-lg shadow-sm border border-border">
              {/* Calendar Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-border gap-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('prev')}
                    className="p-2 hover:bg-secondary rounded-md"
                  >
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground min-w-[200px] text-center">
                    {formatHeaderDate(currentDate)}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('next')}
                    className="p-2 hover:bg-secondary rounded-md"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <Button 
                      variant={viewMode === 'month' ? 'default' : 'ghost'}
                      size="sm" 
                      className="rounded-none px-3 py-1 text-sm"
                      onClick={() => setViewMode('month')}
                    >
                      Month
                    </Button>
                    <Button 
                      variant={viewMode === 'week' ? 'default' : 'ghost'}
                      size="sm" 
                      className="rounded-none px-3 py-1 text-sm border-x border-border"
                      onClick={() => setViewMode('week')}
                    >
                      Week
                    </Button>
                    <Button 
                      variant={viewMode === 'day' ? 'default' : 'ghost'}
                      size="sm" 
                      className="rounded-none px-3 py-1 text-sm"
                      onClick={() => setViewMode('day')}
                    >
                      Day
                    </Button>
                  </div>
		  <Button 
                    onClick={goToToday} 
                    size="sm" 
                    variant="outline" 
                    className="ml-2"
                  >
                    Today
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-4 sm:p-6">
                <CalendarGrid 
                  currentDate={currentDate} 
                  events={events}
		  meetings={meetings}
                  connections={connections}
                  viewMode={viewMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={setIsLoading}
      />
      
      <ComparisonModal 
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        connections={connections}
        events={events}
      />

      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner />}
    </div>
  );
}
