import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MoreHorizontal, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Prayer } from "@shared/schema";

interface PrayerCardProps {
  prayer: Prayer;
  onStatusUpdate?: (status: string) => void;
  isUpdating?: boolean;
  showSupport?: boolean;
  supportCount?: number;
  commentCount?: number;
}

export default function PrayerCard({
  prayer,
  onStatusUpdate,
  isUpdating = false,
  showSupport = false,
  supportCount = 0,
  commentCount = 0,
}: PrayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-green-500";
      case "ongoing":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "answered":
        return "Answered";
      case "ongoing":
        return "Ongoing";
      default:
        return "Unknown";
    }
  };

  const formatDate = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const shouldTruncate = prayer.content.length > 200;
  const displayContent = shouldTruncate && !isExpanded 
    ? prayer.content.substring(0, 200) + "..."
    : prayer.content;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(prayer.status)} text-white`}>
              {getStatusLabel(prayer.status)}
            </Badge>
            <span className="text-gray-500 text-sm">
              {formatDate(prayer.createdAt!)}
            </span>
            {prayer.status === "answered" && prayer.answeredAt && (
              <span className="text-green-600 text-sm">
                • Answered {formatDate(prayer.answeredAt)}
              </span>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {prayer.status === "ongoing" && onStatusUpdate && (
                <DropdownMenuItem 
                  onClick={() => onStatusUpdate("answered")}
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Answered
                </DropdownMenuItem>
              )}
              {prayer.status === "answered" && onStatusUpdate && (
                <DropdownMenuItem 
                  onClick={() => onStatusUpdate("ongoing")}
                  disabled={isUpdating}
                >
                  Mark as Ongoing
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="font-medium text-gray-900 mb-2">{prayer.title}</h4>
        
        <div className="text-gray-600 text-sm mb-4">
          <p>{displayContent}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary hover:text-blue-700 mt-1 text-sm font-medium"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {prayer.status === "answered" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-green-700">
              <Check className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Prayer Answered - Thank you, God!</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          {showSupport ? (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <button className="hover:text-primary transition-colors">
                <Heart className="h-4 w-4 mr-1 inline" />
                {supportCount} prayers
              </button>
              <button className="hover:text-primary transition-colors">
                <MessageCircle className="h-4 w-4 mr-1 inline" />
                {commentCount} messages
              </button>
            </div>
          ) : (
            <div></div>
          )}
          
          {onStatusUpdate && prayer.status === "ongoing" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusUpdate("answered")}
              disabled={isUpdating}
              className="text-primary hover:text-blue-700"
            >
              {isUpdating ? "Updating..." : "Mark as Answered"}
            </Button>
          )}
          
          {prayer.status === "answered" && (
            <Button
              variant="outline"
              size="sm"
              className="text-primary hover:text-blue-700"
            >
              Share Testimony
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
