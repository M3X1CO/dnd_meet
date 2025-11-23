import { useState } from "react";
import { Menu, CalendarIcon, Clock, Users, UserPlus, User, Settings, Bell, MessageCircle, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface NavigationMenuProps {
  currentPage?: string;
  actionButton?: React.ReactNode;
}

export function NavigationMenu({ currentPage = "", actionButton }: NavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { 
      label: "Calendar", 
      href: "/", 
      icon: CalendarIcon,
      description: "View your calendar and events"
    },
    { 
      label: "Meetings", 
      href: "/meetings", 
      icon: Clock,
      description: "Manage meeting suggestions"
    },
    { 
      label: "Groups", 
      href: "/groups", 
      icon: Users,
      description: "Chat groups and collaboration"
    },
    { 
      label: "Friends", 
      href: "/friends", 
      icon: UserPlus,
      description: "Connect with friends"
    },
    { 
      label: "Chat", 
      href: "/chat", 
      icon: MessageCircle,
      description: "Group messaging and conversations"
    },
  ];

  const handleNavigate = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const getCurrentPageTitle = () => {
    const item = menuItems.find(item => item.href === currentPage || item.label.toLowerCase() === currentPage.toLowerCase());
    return item?.label || "Meet";
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex items-center justify-between w-full h-full">
      {/* Left side - Logo and current page */}
      <div className="flex items-center">
        <CalendarIcon className="text-primary text-xl sm:text-2xl mr-2 sm:mr-3" />
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">
          {getCurrentPageTitle()}
        </h1>
      </div>

      {/* Right side - Action, Notifications, Profile, Menu */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Action Button */}
        {actionButton}

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="p-2 rounded-full">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "User"}
              </p>
              {user?.firstName && user?.lastName && (
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Navigation Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-5 w-5 text-muted-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
	    <SheetHeader className="pb-6 border-b border-border">
              <SheetTitle className="flex items-center">
                <CalendarIcon className="text-primary text-xl mr-3" />
                <span className="text-xl font-semibold">Meet</span>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navigation menu
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col h-[calc(100%-5rem)]">
              {/* Navigation Items */}
              <nav className="flex-1 py-6 overflow-y-auto">
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.href || 
                                   (item.href === "/" && currentPage === "") ||
                                   (item.label.toLowerCase() === currentPage.toLowerCase());
                    
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigate(item.href)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-secondary text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t border-border pt-4">
                <div className="text-xs text-muted-foreground text-center">
                  Meet - Social Calendar Platform
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
