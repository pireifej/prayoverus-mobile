import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import PrayerCard from "@/components/PrayerCard";
import CommunityPrayerWall from "@/components/CommunityPrayerWall";
import PrayerGroups from "@/components/PrayerGroups";
import AddPrayerModal from "@/components/AddPrayerModal";
import { Button } from "@/components/ui/button";
import { Plus, Cross, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Prayer } from "@shared/schema";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddPrayerOpen, setIsAddPrayerOpen] = useState(false);
  const [prayerFilter, setPrayerFilter] = useState<"all" | "ongoing" | "answered">("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        switch (type) {
          case 'new_prayer':
            queryClient.invalidateQueries({ queryKey: ["/api/prayers/public"] });
            break;
          case 'prayer_support':
            queryClient.invalidateQueries({ queryKey: ["/api/prayers/public"] });
            break;
          case 'new_comment':
            queryClient.invalidateQueries({ queryKey: ["/api/prayers", data.prayerId, "comments"] });
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);

  // Fetch user's prayers
  const { data: userPrayers = [], isLoading: prayersLoading } = useQuery({
    queryKey: ["/api/prayers/mine"],
    enabled: !!user,
  });

  // Update prayer status mutation
  const updatePrayerStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/prayers/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/mine"] });
      toast({
        title: "Prayer Updated",
        description: "Prayer status has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update prayer status.",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const filteredPrayers = userPrayers.filter((prayer: Prayer) => {
    if (prayerFilter === "all") return true;
    return prayer.status === prayerFilter;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-warm">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Welcome Hero */}
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-primary to-blue-600 border-0 text-white relative overflow-hidden">
            <CardContent className="p-6 md:p-8 relative z-10">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2">
                {getGreeting()}, {user.firstName || "Friend"} 🙏
              </h2>
              <p className="text-blue-100 mb-4">Take a moment to connect with your prayers today</p>
              <Button 
                onClick={() => setIsAddPrayerOpen(true)}
                className="bg-white text-primary hover:bg-gray-50 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Prayer
              </Button>
            </CardContent>
            <div className="absolute top-4 right-4 text-6xl opacity-20">
              <Cross />
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Prayers Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">My Personal Prayers</h3>
              <div className="flex space-x-2">
                <Button
                  variant={prayerFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPrayerFilter("all")}
                  className={prayerFilter === "all" ? "bg-secondary text-primary" : ""}
                >
                  All
                </Button>
                <Button
                  variant={prayerFilter === "ongoing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPrayerFilter("ongoing")}
                  className={prayerFilter === "ongoing" ? "bg-secondary text-primary" : ""}
                >
                  Ongoing
                </Button>
                <Button
                  variant={prayerFilter === "answered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPrayerFilter("answered")}
                  className={prayerFilter === "answered" ? "bg-secondary text-primary" : ""}
                >
                  Answered
                </Button>
              </div>
            </div>

            {prayersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPrayers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Cross className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No prayers yet</h4>
                  <p className="text-gray-600 mb-4">
                    {prayerFilter === "all" 
                      ? "Start your prayer journey by adding your first prayer."
                      : `No ${prayerFilter} prayers found.`
                    }
                  </p>
                  <Button onClick={() => setIsAddPrayerOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Prayer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPrayers.map((prayer: Prayer) => (
                  <PrayerCard
                    key={prayer.id}
                    prayer={prayer}
                    onStatusUpdate={(status) => 
                      updatePrayerStatusMutation.mutate({ id: prayer.id, status })
                    }
                    isUpdating={updatePrayerStatusMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Community Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <CommunityPrayerWall />
            <PrayerGroups />
            
            {/* Daily Inspiration */}
            <Card className="bg-gradient-to-br from-accent to-yellow-400 border-0 text-white">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Quote className="w-4 h-4 mr-2" />
                  Daily Inspiration
                </h3>
                <blockquote className="text-sm mb-4 italic">
                  "And we know that in all things God works for the good of those who love him..."
                </blockquote>
                <p className="text-xs opacity-90 mb-4">Romans 8:28</p>
                <Button className="bg-white/20 text-white hover:bg-white/30 text-sm">
                  Share This Verse
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsAddPrayerOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-40"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add Prayer Modal */}
      <AddPrayerModal 
        isOpen={isAddPrayerOpen} 
        onClose={() => setIsAddPrayerOpen(false)} 
      />
    </div>
  );
}
