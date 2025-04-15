
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAdminUser, setIsCreatingAdminUser] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check if admin user exists on component mount
  useEffect(() => {
    const checkAndCreateAdminUser = async () => {
      try {
        // First, check if the user exists by trying to sign in
        // This is a bit of a hack, but it's the easiest way to check
        const { error } = await supabase.auth.signInWithPassword({
          email: "sunmicrotec@gmail.com",
          password: "kishan12",
        });
        
        // If there's an error saying the user doesn't exist, create it
        if (error && error.message.includes("Invalid login credentials")) {
          setIsCreatingAdminUser(true);
          
          // Create the admin user
          const { error: signUpError } = await supabase.auth.signUp({
            email: "sunmicrotec@gmail.com",
            password: "kishan12",
          });
          
          if (signUpError) {
            console.error("Failed to create admin user:", signUpError);
            toast({
              variant: "destructive",
              title: "Admin user creation failed",
              description: signUpError.message,
            });
          } else {
            toast({
              title: "Admin user created",
              description: "Admin user has been created successfully.",
            });
          }
        }
        
        // Sign out after checking/creating
        await supabase.auth.signOut();
        setIsCreatingAdminUser(false);
      } catch (err) {
        console.error("Error checking/creating admin user:", err);
        setIsCreatingAdminUser(false);
      }
    };
    
    checkAndCreateAdminUser();
  }, [toast]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Authenticate with Supabase
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
        return;
      }
      
      if (authData && authData.user) {
        // Store user info in localStorage
        localStorage.setItem(
          "billeasy-user",
          JSON.stringify({ 
            email: authData.user.email, 
            name: "Admin", 
            id: authData.user.id 
          })
        );
        
        // Call the onLogin callback to update auth state
        onLogin();
        
        toast({
          title: "Login successful",
          description: "Welcome to BillEasy Admin!",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An error occurred. Please try again.",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-billeasy-purple mb-2">BillEasy Admin</h1>
            <p className="text-muted-foreground">School ERP Billing Management</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            {isCreatingAdminUser ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">Creating admin user...</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="sunmicrotec@gmail.com" 
                            {...field} 
                            autoComplete="email"
                            disabled={isLoading}
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
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              autoComplete="current-password"
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-8 w-8"
                              onClick={togglePasswordVisibility}
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-billeasy-purple hover:bg-billeasy-dark-purple text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            )}
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Admin login: sunmicrotec@gmail.com / kishan12</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="p-4 text-center text-sm text-muted-foreground">
        Created by <a href="https://github.com/jay" target="_blank" rel="noreferrer" className="text-billeasy-purple hover:text-billeasy-dark-purple">Jay</a> for SunMicroTec IT Solutions
      </footer>
    </div>
  );
};

export default Login;
