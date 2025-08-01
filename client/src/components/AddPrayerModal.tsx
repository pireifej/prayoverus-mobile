import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertPrayerSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface AddPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertPrayerSchema.extend({
  title: z.string().min(1, "Prayer title is required").max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Prayer content must be at least 10 characters").max(1000, "Content must be less than 1000 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function AddPrayerModal({ isOpen, onClose }: AddPrayerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      isPublic: false,
    },
  });

  const createPrayerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/prayers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/public"] });
      toast({
        title: "Prayer Added",
        description: "Your prayer has been added successfully.",
      });
      form.reset();
      onClose();
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
        description: "Failed to add prayer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createPrayerMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createPrayerMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            🙏 <span>Add New Prayer</span>
          </DialogTitle>
          <DialogDescription>
            Share your prayer request with God and optionally with the community.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prayer Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What are you praying for?" 
                      {...field}
                      disabled={createPrayerMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prayer Content *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share the details of your prayer request..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      disabled={createPrayerMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Share your heart with God. Be as specific or general as you'd like.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Share with Community</FormLabel>
                    <FormDescription>
                      Allow others to see and pray for this request
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      disabled={createPrayerMutation.isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={createPrayerMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createPrayerMutation.isPending}
              >
                {createPrayerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Prayer...
                  </>
                ) : (
                  "Add Prayer"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
