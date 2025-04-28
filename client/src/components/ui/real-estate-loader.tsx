
import { Building, Home, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealEstateLoaderProps {
  type?: 'properties' | 'agencies' | 'agents' | 'overview';
  className?: string;
}

export function RealEstateLoader({ type = 'properties', className }: RealEstateLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12", className)}>
      <div className="relative w-24 h-24">
        {/* Building foundation */}
        <div className="absolute inset-0 border-2 border-primary/20 rounded-lg" />
        
        {/* Animated icon based on tab type */}
        <div className="absolute inset-0 flex items-center justify-center animate-bounce">
          {type === 'properties' && <Home className="h-12 w-12 text-primary" />}
          {type === 'agencies' && <Building className="h-12 w-12 text-primary" />}
          {type === 'agents' && <User className="h-12 w-12 text-primary" />}
          {type === 'overview' && <MapPin className="h-12 w-12 text-primary" />}
        </div>
      </div>
      <p className="mt-4 text-gray-500 animate-pulse">Cargando información...</p>
    </div>
  );
}
