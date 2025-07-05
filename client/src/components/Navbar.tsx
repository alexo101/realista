import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Menu, X } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useUser } from "@/contexts/user-context";
import { useState } from "react";

export function Navbar() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">Realista</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {user.isClient ? (
                    <Link href="/client-profile">
                      <Button variant="outline">
                        Mi perfil
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/manage">
                      <Button variant="outline">
                        Gestionar todo
                      </Button>
                    </Link>
                  )}
                  <UserMenu />
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button variant="outline">
                      Registra tu agencia
                    </Button>
                  </Link>

                  <Link href="/login">
                    <Button variant="outline">
                      Iniciar sesión
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-2">
              {user ? (
                <>
                  {user.isClient ? (
                    <Link href="/client-profile" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Mi perfil
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/manage" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Gestionar todo
                      </Button>
                    </Link>
                  )}
                  <div className="pt-2">
                    <UserMenu />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/register" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      Registra tu agencia
                    </Button>
                  </Link>

                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      Iniciar sesión
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}