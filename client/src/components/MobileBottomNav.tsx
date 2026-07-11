import { useLocation } from "wouter";
import { Search, Heart, MessageCircle, Bookmark, User } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const [location, setLocation] = useLocation();
  const { user } = useUser();
  const { t } = useLanguage();

  const handleNavigation = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      sessionStorage.setItem('redirectAfterLogin', path);
      setLocation('/login');
      return;
    }
    setLocation(path);
  };

  const navItems = [
    {
      id: 'explorar',
      label: t('mobile.explore'),
      icon: Search,
      path: '/',
      requiresAuth: false,
      isActive: location === '/' || location.startsWith('/barrio/') || location.startsWith('/neighborhood/')
    },
    {
      id: 'favoritos',
      label: t('mobile.favorites'),
      icon: Heart,
      path: '/favoritos',
      requiresAuth: true,
      isActive: location === '/favoritos'
    },
    {
      id: 'mensajes',
      label: t('mobile.messages'),
      icon: MessageCircle,
      path: '/mensajes',
      requiresAuth: true,
      isActive: location === '/mensajes'
    },
    {
      id: 'busquedas',
      label: t('mobile.saved_searches'),
      icon: Bookmark,
      path: '/busquedas-guardadas',
      requiresAuth: true,
      isActive: location === '/busquedas-guardadas'
    },
    {
      id: 'perfil',
      label: t('mobile.profile'),
      icon: User,
      path: '/mi-perfil',
      requiresAuth: true,
      isActive: location === '/mi-perfil' || location.startsWith('/perfil')
    }
  ];

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden",
        className
      )}
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path, item.requiresAuth)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                item.isActive 
                  ? "text-[#0284c5]" 
                  : "text-gray-500 hover:text-gray-700"
              )}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
