import { Home, MessageCircle, Heart, Search, User } from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/user-context";
import { cn } from "@/lib/utils";

interface MobileClientNavProps {
  currentSection?: string;
}

export function MobileClientNav({ currentSection }: MobileClientNavProps) {
  const [, navigate] = useLocation();
  const { user } = useUser();

  const navItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: Home,
      path: "/",
      requiresAuth: false,
    },
    {
      id: "chats",
      label: "Chats",
      icon: MessageCircle,
      path: user?.clientUuid ? `/perfil-cliente/${user.clientUuid}/mensajes` : "/iniciar-sesion",
      requiresAuth: true,
    },
    {
      id: "favoritos",
      label: "Favoritos",
      icon: Heart,
      path: user?.clientUuid ? `/perfil-cliente/${user.clientUuid}/favoritos` : "/iniciar-sesion",
      requiresAuth: true,
    },
    {
      id: "busquedas",
      label: "Búsquedas",
      icon: Search,
      path: user?.clientUuid ? `/perfil-cliente/${user.clientUuid}/busquedas` : "/iniciar-sesion",
      requiresAuth: true,
    },
    {
      id: "perfil",
      label: "Perfil",
      icon: User,
      path: user?.clientUuid ? `/perfil-cliente/${user.clientUuid}/perfil` : "/iniciar-sesion",
      requiresAuth: true,
    },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      navigate("/iniciar-sesion");
    } else {
      navigate(item.path);
    }
  };

  const isActive = (itemId: string) => {
    if (itemId === "inicio") {
      return !currentSection;
    }
    if (itemId === "chats") {
      return currentSection === "mensajes";
    }
    if (itemId === "favoritos") {
      return currentSection === "favoritos" || currentSection === "agencias-favoritas" || currentSection === "agentes-favoritos";
    }
    if (itemId === "busquedas") {
      return currentSection === "busquedas";
    }
    if (itemId === "perfil") {
      return currentSection === "perfil";
    }
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.id);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 px-2 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-gray-500 hover:text-gray-700"
              )}
              data-testid={`mobile-nav-${item.id}`}
            >
              <Icon className={cn("h-5 w-5 mb-1", active && "fill-primary/10")} />
              <span className={cn("text-xs font-medium", active && "font-semibold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
