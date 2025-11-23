import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Upload, ArrowLeftRight, Mail, Cloud } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import type { CalendarConnection } from "@shared/schema";

interface CalendarSidebarProps {
  connections: CalendarConnection[];
  onImportClick: () => void;
  onExportClick: () => void;
  onCompareClick: () => void;
}

export function CalendarSidebar({ 
  connections, 
  onImportClick, 
  onExportClick, 
  onCompareClick 
}: CalendarSidebarProps) {
  const [showConflicts, setShowConflicts] = useState(true);
  const [showAllCalendars, setShowAllCalendars] = useState(true);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <SiGoogle className="text-red-500" />;
      case 'outlook':
        return <Mail className="text-blue-600" />;
      case 'icloud':
        return <SiApple className="text-gray-700" />;
      default:
        return null;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-500';
      case 'outlook':
        return 'bg-orange-500';
      case 'icloud':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConnectionBg = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-green-50 border-green-200';
      case 'outlook':
        return 'bg-blue-50 border-blue-200';
      case 'icloud':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (provider: string, isConnected: boolean) => {
    if (!isConnected) return 'text-gray-400';
    switch (provider) {
      case 'google':
        return 'text-green-600';
      case 'outlook':
        return 'text-blue-600';
      case 'icloud':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar Sources</h2>
        
        {/* Calendar Connections */}
        <div className="space-y-3 mb-6">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${getConnectionBg(connection.provider)}`}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  {getProviderIcon(connection.provider)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{connection.email}</p>
                  <p className={`text-xs ${getStatusColor(connection.provider, connection.isConnected)}`}>
                    {connection.isConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${getProviderColor(connection.provider)}`} />
                <Button variant="ghost" size="sm" className="p-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}

          {/* Sample unconnected iCloud */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="mr-3">
                <SiApple className="text-gray-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">iCloud Calendar</p>
                <p className="text-xs text-gray-400">Not connected</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700 text-sm font-medium">
              Connect
            </Button>
          </div>
        </div>

        {/* Import/Export Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onImportClick}
              className="w-full justify-start px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Import Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportClick}
              className="w-full justify-start px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Export Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCompareClick}
              className="w-full justify-start px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Compare Calendars
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="conflicts"
                checked={showConflicts}
                onCheckedChange={setShowConflicts}
                className="border-gray-300"
              />
              <label htmlFor="conflicts" className="text-sm text-gray-700">
                Show Conflicts
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-calendars"
                checked={showAllCalendars}
                onCheckedChange={setShowAllCalendars}
                className="border-gray-300"
              />
              <label htmlFor="all-calendars" className="text-sm text-gray-700">
                All Calendars
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
