import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { Heart, LogOut, User } from "lucide-react";
import { Link } from "wouter";

export function UserMenu() {
  const { user, logout } = useUser();

  if (!user) return null;

  const displayName = user.name || user.email.split('@')[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span>{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!user.isAgent && !user.agencyName && (
          <DropdownMenuItem asChild>
            <Link href="/favorites">
              <a className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Favoritos</span>
              </a>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={logout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}