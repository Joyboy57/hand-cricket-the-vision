
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { HyperText } from "@/components/ui/hyper-text";
import { ChevronRight, Github, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [authError, setAuthError] = useState<string | null>(null);
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Password validation
  const validatePassword = (password: string): boolean => {
    // Password must be at least 6 characters
    return password.length >= 6;
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setAuthError(null);
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setAuthError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    
    try {
      await login(loginData.email, loginData.password);
      toast({
        title: "Logged in successfully",
        description: "Welcome back!",
      });
      // Redirected to home page instead of game page
      navigate('/home');
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      setAuthError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    
    // Validate password
    if (!validatePassword(signupData.password)) {
      setAuthError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    
    try {
      await register(signupData.name, signupData.email, signupData.password);
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
      // Redirected to home page instead of game page
      navigate('/home');
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Signup failed";
      setAuthError(errorMessage);
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    toast({
      title: "Continuing as guest",
      description: "You can create an account later to save your progress.",
    });
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <RetroGrid className="opacity-30" />
      
      <div className="h-[240px] w-full mb-2 relative z-10 flex flex-col items-center justify-center">
        <div className="w-32 h-32 mx-auto mb-6">
          <img 
            src="/lovable-uploads/e09979c0-a977-43d3-86c7-53b2b69c5dab.png" 
            alt="Hand Cricket The Vision Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="mb-6">
          <HyperText
            className="text-4xl font-bold text-indigo-600"
            text="THE VISION"
            duration={1000}
          />
        </div>
        <GooeyText
          texts={["Hand", "Cricket", "Challenge", "Game"]}
          morphTime={1}
          cooldownTime={1.5}
          className="font-bold text-indigo-600"
        />
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-indigo-100 relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            Sign up or log in to track your cricket scores
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="signup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                {authError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email"
                    name="email"
                    type="email" 
                    placeholder="your@email.com" 
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input 
                    id="login-password"
                    name="password"
                    type="password" 
                    placeholder="••••••••" 
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4 pt-4">
                {authError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input 
                    id="signup-name"
                    name="name"
                    placeholder="Your name" 
                    value={signupData.name}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email"
                    name="email"
                    type="email" 
                    placeholder="your@email.com" 
                    value={signupData.email}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password"
                    name="password"
                    type="password" 
                    placeholder="Create a password" 
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="px-6 pb-6">
          <div className="relative flex justify-center text-xs uppercase my-4">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 border-indigo-200"
              onClick={() => {
                toast({
                  title: "GitHub Auth",
                  description: "GitHub authentication is not implemented in this demo.",
                });
              }}
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={handleContinueWithoutLogin}
            >
              Continue without login
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      <p className="mt-8 text-center text-sm text-gray-500 relative z-10">
        By signing up, you agree to our <a href="#" className="font-medium text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="font-medium text-indigo-600 hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
};

export default Auth;
