import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// localStorage keys for offline cache
const PROFILE_CACHE_KEY = "blumint_profile";
const ROLE_CACHE_KEY    = "blumint_role";

function readCachedProfile(): Profile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || "null"); } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Pre-populate from localStorage so profile/role are available immediately offline
  const [profile, setProfile] = useState<Profile | null>(readCachedProfile);
  const [role, setRole]       = useState<string | null>(localStorage.getItem(ROLE_CACHE_KEY));
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileRes.data));
      }
      if (roleRes.data) {
        setRole(roleRes.data.role);
        localStorage.setItem(ROLE_CACHE_KEY, roleRes.data.role);
      }
    } catch (error) {
      // Offline — cached values already in state, no action needed
      console.error("Error fetching profile/role:", error);
    }
  }, []);

  useEffect(() => {
    // Set up auth listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => fetchProfileAndRole(session.user.id), 0);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfileAndRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    localStorage.removeItem(PROFILE_CACHE_KEY);
    localStorage.removeItem(ROLE_CACHE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
