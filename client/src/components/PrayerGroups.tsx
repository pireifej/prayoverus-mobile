import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, Plus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PrayerGroupWithCount {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount: number;
}

export default function PrayerGroups() {
  const { user } = useAuth();

  const { data: userGroups = [], isLoading } = useQuery<PrayerGroupWithCount[]>({
    queryKey: ["/api/groups/mine"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="text-primary mr-2 h-5 w-5" />
            My Prayer Groups
          </h3>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (index: number) => {
    const colors = ["bg-green-400", "bg-primary", "bg-gray-300"];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <UserCheck className="text-primary mr-2 h-5 w-5" />
          My Prayer Groups
        </h3>
        
        {userGroups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No prayer groups yet.</p>
            <p className="text-sm text-gray-400 mb-4">Join or create a group to pray with others!</p>
            <Button className="bg-secondary text-primary hover:bg-blue-100">
              <Plus className="w-4 h-4 mr-2" />
              Join Your First Group
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {userGroups.slice(0, 3).map((group, index) => (
                <div 
                  key={group.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={group.imageUrl || ""} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                      <p className="text-xs text-gray-500">{group.memberCount} members</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 ${getStatusColor(index)} rounded-full`}></span>
                </div>
              ))}
            </div>

            <Button className="w-full mt-4 bg-secondary text-primary hover:bg-blue-100">
              <Plus className="w-4 h-4 mr-2" />
              Join New Group
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
