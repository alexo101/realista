import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  name: string | null;
  isAgent?: boolean;
  isAdmin?: boolean;
  isClient?: boolean;
  agentUuid?: string;
  clientUuid?: string;
  
  // Agency relationship (for agents belonging to an agency)
  agencyId?: number | null;
  
  // Campos para perfil de agente
  surname?: string;
  description?: string;
  avatar?: string;
  influenceNeighborhoods?: string[];
  yearsOfExperience?: number;
  languagesSpoken?: string[];
  
  // Campos para perfil de agencia (when user IS an agency)
  agencyName?: string;
  agencyAddress?: string;
  agencyDescription?: string;
  agencyPhone?: string;
  agencyWebsite?: string;
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[];
  yearEstablished?: number;
  agencySupportedLanguages?: string[];
  agencySocialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  
  // Campos adicionales para clientes
  phone?: string;
  
  // Subscription plan (for agents and agencies)
  subscriptionPlan?: 'basica' | 'estandar' | 'premium' | null;
  
  // Review statistics
  reviewCount?: number; // Número total de reseñas recibidas
  reviewAverage?: number; // Puntuación promedio de las reseñas
  
  // Pinned review data
  pinnedReview?: {
    id: number;
    rating: number;
    comment: string | null;
    author: string | null;
    date: Date;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include"
        });
        
        if (response.ok) {
          const sessionUser = await response.json();
          setUser(sessionUser);
        }
      } catch (error) {
        // No active session, user remains null
        console.log("No active session found");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
      // Clear user state even if logout request fails
      setUser(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
