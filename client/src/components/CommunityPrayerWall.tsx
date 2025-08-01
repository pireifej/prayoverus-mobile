import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Heart, MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CommunityPrayerWithUser {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  supportCount: number;
  commentCount: number;
}

export default function CommunityPrayerWall() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communityPrayers = [], isLoading } = useQuery<CommunityPrayerWithUser[]>({
    queryKey: ["/api/prayers/public"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const supportMutation = useMutation({
    mutationFn: async ({ prayerId, type }: { prayerId: string; type: string }) => {
      await apiRequest("POST", `/api/prayers/${prayerId}/support`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/public"] });
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
        description: "Failed to add support to prayer.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const getUserDisplayName = (user: { firstName?: string; lastName?: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName.charAt(0)}.`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return `${user.lastName.charAt(0)}.`;
    }
    return "Anonymous";
  };

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleSupport = (prayerId: string, type: "prayer" | "heart") => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to support prayers.",
        variant: "destructive",
      });
      return;
    }
    supportMutation.mutate({ prayerId, type });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="text-primary mr-2 h-5 w-5" />
            Community Prayer Wall
          </h3>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="text-primary mr-2 h-5 w-5" />
          Community Prayer Wall
        </h3>
        
        {communityPrayers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No community prayers yet.</p>
            <p className="text-sm text-gray-400">Be the first to share a prayer with the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {communityPrayers.slice(0, 3).map((prayer) => (
              <div key={prayer.id} className="border-l-4 border-primary pl-4 pb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={prayer.user.profileImageUrl || ""} />
                    <AvatarFallback className="text-xs bg-primary text-white">
                      {getInitials(prayer.user.firstName, prayer.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">
                    {getUserDisplayName(prayer.user)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(prayer.createdAt)}
                  </span>
                </div>
                
                <h4 className="font-medium text-sm text-gray-900 mb-1">{prayer.title}</h4>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{prayer.content}</p>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <button 
                    onClick={() => handleSupport(prayer.id, "prayer")}
                    disabled={supportMutation.isPending || !user}
                    className="hover:text-primary transition-colors disabled:opacity-50 flex items-center"
                  >
                    {supportMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Heart className="h-3 w-3 mr-1" />
                    )}
                    {prayer.supportCount} praying
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <MessageCircle className="h-3 w-3 mr-1 inline" />
                    {prayer.commentCount}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button className="w-full mt-4" variant="outline">
          View All Community Prayers
        </Button>
      </CardContent>
    </Card>
  );
}
