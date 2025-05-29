import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useUser } from "@/contexts/user-context";

export function Navbar() {
  const { user } = useUser();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">Realista</span>
            </Link>

            <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </nav>
    </>
  );
}