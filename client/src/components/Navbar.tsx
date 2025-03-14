import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Search, Heart } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">Realista</span>
            </a>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/search">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Search</span>
              </Button>
            </Link>
            
            <Link href="/favorites">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Favorites</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
