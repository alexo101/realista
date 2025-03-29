import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  name: string | null;
  isAgent: boolean;
  
  // Campos para perfil de agente
  surname?: string;
  description?: string;
  avatar?: string;
  influenceNeighborhoods?: string[];
  
  // Campos para perfil de agencia
  agencyName?: string;
  agencyAddress?: string;
  agencyDescription?: string;
  agencyPhone?: string;
  agencyWebsite?: string;
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[];
  agencySocialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
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
