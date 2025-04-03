
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  supabase: typeof supabase;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback to localStorage for compatibility with existing code
const USERS_STORAGE_KEY = 'cricket_game_users';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const transformUser = (supabaseUser: User | null, name: string = ''): AuthUser | null => {
    if (!supabaseUser) return null;
    
    return {
      id: supabaseUser.id,
      name: name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
    };
  };

  // Check for existing session and user on initial render
  useEffect(() => {
    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            // Type assertion for the from() call
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .maybeSingle();
              
            setUser(transformUser(session.user, profileData?.name || ''));
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUser(transformUser(session.user));
          }
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          try {
            // Type assertion for the from() call
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .maybeSingle();
              
            setUser(transformUser(session.user, profileData?.name || ''));
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUser(transformUser(session.user));
          }
        } else {
          // Fallback to localStorage for compatibility
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Get users from localStorage for backward compatibility
  const getUsers = (): Array<AuthUser & { password: string }> => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  };

  // Save users to localStorage for backward compatibility
  const saveUsers = (users: Array<AuthUser & { password: string }>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        try {
          // Type assertion for the from() call
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.user.id)
            .maybeSingle();
            
          const authUser = transformUser(data.user, profileData?.name || '');
          setUser(authUser);
          return;
        } catch (error) {
          console.error('Error fetching profile:', error);
          const authUser = transformUser(data.user);
          setUser(authUser);
        }
        return;
      }
      
      throw new Error('Invalid email or password');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Profile will be created by the database trigger
        const authUser = transformUser(data.user, name);
        setUser(authUser);
        return;
      }
      
      throw new Error('Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      // Also clear localStorage for compatibility
      localStorage.removeItem('currentUser');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
