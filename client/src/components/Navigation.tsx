import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Cross, Bell, Home, Users, UserCheck, Compass, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navigation() {
  const { user } = useAuth();
  const typedUser = user as any;
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("home");

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { id: "home", label: "My Prayers", icon: Home },
    { id: "community", label: "Community", icon: Users },
    { id: "groups", label: "Groups", icon: UserCheck },
    { id: "discover", label: "Discover", icon: Compass },
  ];

  const NavContent = () => (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-8">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`${
              activeTab === item.id
                ? "text-primary font-medium border-b-2 border-primary pb-1"
                : "text-gray-600 hover:text-primary transition-colors"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Mobile Navigation Bottom Bar */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center p-2 ${
                    activeTab === item.id ? "text-primary" : "text-gray-500"
                  } hover:text-primary transition-colors`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Cross className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-gray-900">PrayOverUs</h1>
            </div>

            <NavContent />

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary">
                <Bell className="w-5 h-5" />
              </Button>
              
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col space-y-4 mt-8">
                      <div className="flex items-center space-x-3 p-3 border-b">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={typedUser?.profileImageUrl || ""} />
                          <AvatarFallback className="bg-primary text-white">
                            {getInitials(typedUser?.firstName, typedUser?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {typedUser?.firstName || typedUser?.lastName 
                              ? `${typedUser.firstName || ""} ${typedUser.lastName || ""}`.trim()
                              : typedUser?.email || "User"
                            }
                          </div>
                          <div className="text-sm text-gray-500">{typedUser?.email}</div>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8 cursor-pointer">
                    <AvatarImage src={typedUser?.profileImageUrl || ""} />
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {getInitials(typedUser?.firstName, typedUser?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <NavContent />
    </>
  );
}
