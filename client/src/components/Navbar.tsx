import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Menu, X, Sparkles, Calendar, Users, MessageSquare, UserCircle, Building, Building2, Star, CreditCard, Briefcase } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { LanguageSelector } from "./LanguageSelector";
import { useUser } from "@/contexts/user-context";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";

export function Navbar() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manageSidebarOpen, setManageSidebarOpen] = useState(false);

  const isManagePage = location.startsWith("/gestionar/");
  const currentSection = location.split("/")[3] || "calendario";

  const handleManageNavigate = (section: string) => {
    if (user?.agentUuid) {
      navigate(`/gestionar/${user.agentUuid}/${section}`);
      setManageSidebarOpen(false);
    }
  };

  const isAgent = user && !user.isClient && user.agentUuid && user.agentType !== "super_admin";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              {/* Hamburger menu for agents on mobile - shows on manage pages OR when agent is logged in */}
              {isAgent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 md:hidden"
                  onClick={() => setManageSidebarOpen(!manageSidebarOpen)}
                  data-testid="button-manage-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Link href="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Realista Logo" className="h-6 w-6 object-contain" />
                <span className="text-xl font-bold text-primary">Realista</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSelector />
              {!user && (
                <Link href="/realista-pro">
                  <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-4 py-2 shadow-lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('nav.realista_pro')}
                  </Button>
                </Link>
              )}
              
              {user ? (
                <>
                  {user.agentType === "super_admin" ? (
                    <Link href="/super-admin">
                      <Button variant="outline">
                        SuperAdmin
                      </Button>
                    </Link>
                  ) : user.isClient && user.clientUuid ? (
                    <Link href={`/perfil-cliente/${user.clientUuid}/perfil`}>
                      <Button variant="outline">
                        {t('nav.profile')}
                      </Button>
                    </Link>
                  ) : user.agentUuid ? (
                    <Link href={`/gestionar/${user.agentUuid}/calendario`}>
                      <Button variant="outline">
                        {t('nav.manage')}
                      </Button>
                    </Link>
                  ) : null}
                  <UserMenu />
                </>
              ) : (
                <>
                  <Link href="/iniciar-sesion">
                    <Button variant="outline">
                      {t('nav.login')}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button (right side) */}
            <div className="md:hidden flex items-center space-x-2">
              <LanguageSelector />
              {user ? (
                <UserMenu />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu for non-logged in users */}
        {mobileMenuOpen && !user && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-2">
              <Link href="/realista-pro" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold shadow-lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('nav.realista_pro')}
                </Button>
              </Link>
              <Link href="/iniciar-sesion" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start">
                  {t('nav.login')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Manage sidebar overlay for mobile - available for agents anywhere */}
      {manageSidebarOpen && isAgent && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setManageSidebarOpen(false)}
          />
          <div className="fixed top-16 left-0 bottom-0 w-72 bg-white z-50 md:hidden overflow-y-auto border-r shadow-lg">
            <div className="p-4 space-y-1">
              {/* Quick link to manage page if not already there */}
              {!isManagePage && (
                <>
                  <button
                    onClick={() => handleManageNavigate("calendario")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors bg-primary text-white"
                    data-testid="nav-gestionar-todo"
                  >
                    <Briefcase className="h-5 w-5" />
                    <span>Gestionar todo</span>
                  </button>
                  <div className="border-t my-3" />
                </>
              )}

              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                CRM
              </div>
              
              <button
                onClick={() => handleManageNavigate("calendario")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isManagePage && currentSection === "calendario" 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                }`}
                data-testid="nav-calendario"
              >
                <Calendar className="h-5 w-5" />
                <span>Calendario</span>
              </button>

              <button
                onClick={() => handleManageNavigate("clientes")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isManagePage && currentSection === "clientes" 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                }`}
                data-testid="nav-clientes"
              >
                <Users className="h-5 w-5" />
                <span>Clientes</span>
              </button>

              <button
                onClick={() => handleManageNavigate("mensajes")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isManagePage && currentSection === "mensajes" 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                }`}
                data-testid="nav-mensajes"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Mensajes</span>
              </button>

              <div className="border-t my-3" />

              <button
                onClick={() => handleManageNavigate("perfil-agente")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isManagePage && currentSection === "perfil-agente" 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                }`}
                data-testid="nav-perfil-agente"
              >
                <UserCircle className="h-5 w-5" />
                <span>Mi perfil de agente</span>
              </button>

              {user?.isAdmin && (
                <button
                  onClick={() => handleManageNavigate("perfil-agencia")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isManagePage && currentSection === "perfil-agencia" 
                      ? "bg-primary text-white" 
                      : "hover:bg-gray-100"
                  }`}
                  data-testid="nav-perfil-agencia"
                >
                  <Building className="h-5 w-5" />
                  <span>Gestionar agencia</span>
                </button>
              )}

              <button
                onClick={() => handleManageNavigate("propiedades")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isManagePage && currentSection === "propiedades" 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                }`}
                data-testid="nav-propiedades"
              >
                <Building2 className="h-5 w-5" />
                <span>Gestionar propiedades</span>
              </button>

              <button
                onClick={() => handleManageNavigate("resenas")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isManagePage && currentSection === "resenas" 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                }`}
                data-testid="nav-resenas"
              >
                <Star className="h-5 w-5" />
                <span>Gestionar reseñas</span>
              </button>

              {user?.isAdmin && (
                <button
                  onClick={() => handleManageNavigate("equipo")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isManagePage && currentSection === "equipo" 
                      ? "bg-primary text-white" 
                      : "hover:bg-gray-100"
                  }`}
                  data-testid="nav-equipo"
                >
                  <Users className="h-5 w-5" />
                  <span>Gestionar mi equipo</span>
                </button>
              )}

              <button
                onClick={() => handleManageNavigate("facturacion")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isManagePage && currentSection === "facturacion" 
                    ? "bg-primary text-white" 
                    : "hover:bg-gray-100"
                }`}
                data-testid="nav-facturacion"
              >
                <CreditCard className="h-5 w-5" />
                <span>Suscripción y facturación</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
