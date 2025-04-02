
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Create a single supabase client for the app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  supabase: SupabaseClient;
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
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
            
          setUser(transformUser(session.user, profileData?.name));
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

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
            
          setUser(transformUser(session.user, profileData?.name));
        } else {
          setUser(null);
        }
      }
    );

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
      // First try Supabase authentication
      if (supabaseUrl && supabaseAnonKey) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.user.id)
            .single();
            
          const authUser = transformUser(data.user, profileData?.name);
          setUser(authUser);
          return;
        }
      } else {
        // Fallback to localStorage for compatibility
        const users = getUsers();
        const foundUser = users.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          const { password, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          return;
        }
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
      // First try Supabase registration
      if (supabaseUrl && supabaseAnonKey) {
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
          // Create profile entry with name
          await supabase.from('profiles').insert([
            { id: data.user.id, name, email }
          ]);
          
          const authUser = transformUser(data.user, name);
          setUser(authUser);
          return;
        }
      } else {
        // Fallback to localStorage for compatibility
        const users = getUsers();
        
        // Check if email is already in use
        if (users.some(u => u.email === email)) {
          throw new Error('Email already in use');
        }
        
        // Create new user
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password,
        };
        
        // Save updated users list
        saveUsers([...users, newUser]);
        
        // Log user in
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
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
      if (supabaseUrl && supabaseAnonKey) {
        await supabase.auth.signOut();
      }
      
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
