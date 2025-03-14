import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Search, Heart } from "lucide-react";

// Logo component added here
const Logo = ({ width, height, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width={width} height={height} className={className}>
    {/* Casa */}
    <rect x="50" y="80" width="100" height="80" fill="#555" stroke="#333" strokeWidth="4"/>
    <polygon points="50,80 100,40 150,80" fill="#777" stroke="#333" strokeWidth="4"/>
    <rect x="85" y="110" width="30" height="50" fill="#333"/>

    {/* Llamas */}
    <path d="M110 50 Q115 30 130 40 Q135 20 150 35 Q160 20 170 50 Q150 55 140 70 Q130 60 110 50"
          fill="orange" stroke="red" strokeWidth="3"/>
  </svg>
);


export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <Logo width={50} height={50} className="mr-2" /> {/* Replaced text logo with SVG logo */}
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