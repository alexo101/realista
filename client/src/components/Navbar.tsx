import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { LoginModal } from "./LoginModal";

export function Navbar() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAgentRegistration, setIsAgentRegistration] = useState(false);

  const openLogin = (isAgent: boolean = false) => {
    setIsAgentRegistration(isAgent);
    setIsLoginModalOpen(true);
  };

  return (
    <>
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
              <Button
                variant="outline"
                onClick={() => openLogin(true)}
              >
                Registra tu agencia
              </Button>

              <Button
                variant="outline"
                onClick={() => openLogin(false)}
              >
                Iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isAgentRegistration={isAgentRegistration}
      />
    </>
  );
}