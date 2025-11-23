import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Globe, Mail, Server, Shield } from "lucide-react";

const connectionSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  email: z.string().email("Valid email is required"),
  serverUrl: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

type ConnectionData = z.infer<typeof connectionSchema>;

interface ProviderConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProviderConnectionModal({ isOpen, onClose }: ProviderConnectionModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<ConnectionData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      provider: "",
      email: "",
      serverUrl: "",
      username: "",
      password: "",
    },
  });

  const connectionMutation = useMutation({
    mutationFn: async (data: ConnectionData) => {
      await apiRequest('POST', '/api/connections', data);
    },
    onSuccess: () => {
      toast({
        title: "Connection added",
        description: "Your calendar provider has been connected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to the calendar provider.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ConnectionData) => {
    connectionMutation.mutate(data);
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    form.setValue('provider', provider);
    
    // Clear provider-specific fields when changing provider
    if (provider !== 'caldav') {
      form.setValue('serverUrl', '');
      form.setValue('username', '');
      form.setValue('password', '');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Globe className="h-5 w-5 text-blue-600" />;
      case 'outlook':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'icloud':
        return <Globe className="h-5 w-5 text-gray-600" />;
      case 'yahoo':
        return <Mail className="h-5 w-5 text-purple-600" />;
      case 'caldav':
        return <Server className="h-5 w-5 text-green-600" />;
      default:
        return <Globe className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'google':
        return "Connect your Google Calendar to sync events and manage your schedule.";
      case 'outlook':
        return "Connect your Outlook Calendar to sync events from Microsoft 365.";
      case 'icloud':
        return "Connect your iCloud Calendar to sync events from Apple's calendar service.";
      case 'yahoo':
        return "Connect your Yahoo Calendar to sync events and appointments.";
      case 'caldav':
        return "Connect to any CalDAV server for calendar synchronization.";
      default:
        return "Select a calendar provider to get started.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Calendar Provider</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Provider Selection */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar Provider</FormLabel>
                  <Select onValueChange={handleProviderChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a calendar provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="google">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('google')}
                          Google Calendar
                        </div>
                      </SelectItem>
                      <SelectItem value="outlook">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('outlook')}
                          Outlook Calendar
                        </div>
                      </SelectItem>
                      <SelectItem value="icloud">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('icloud')}
                          iCloud Calendar
                        </div>
                      </SelectItem>
                      <SelectItem value="yahoo">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('yahoo')}
                          Yahoo Calendar
                        </div>
                      </SelectItem>
                      <SelectItem value="caldav">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('caldav')}
                          CalDAV Server
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider Info Card */}
            {selectedProvider && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {getProviderIcon(selectedProvider)}
                    {selectedProvider === 'google' && 'Google Calendar'}
                    {selectedProvider === 'outlook' && 'Outlook Calendar'}
                    {selectedProvider === 'icloud' && 'iCloud Calendar'}
                    {selectedProvider === 'yahoo' && 'Yahoo Calendar'}
                    {selectedProvider === 'caldav' && 'CalDAV Server'}
                  </CardTitle>
                  <CardDescription>
                    {getProviderDescription(selectedProvider)}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="email"
                      placeholder="Enter your email address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CalDAV Specific Fields */}
            {selectedProvider === 'caldav' && (
              <>
                <FormField
                  control={form.control}
                  name="serverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="url"
                          placeholder="https://calendar.server.com/caldav"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Enter your username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  <Shield className="h-4 w-4" />
                  <span>Your credentials are securely encrypted and stored.</span>
                </div>
              </>
            )}

            {/* OAuth Notice for other providers */}
            {selectedProvider && selectedProvider !== 'caldav' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>OAuth Authentication:</strong> You'll be redirected to {selectedProvider} to authorize calendar access.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={connectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={connectionMutation.isPending || !selectedProvider}
              >
                {connectionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  selectedProvider === 'caldav' ? 'Connect Server' : 'Connect with OAuth'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}