import { useState } from "react";
import { Redirect } from "wouter";
import { useUser } from "@/contexts/user-context";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Building2, Users, Star } from "lucide-react";
import { PropertyForm } from "@/components/PropertyForm";
import { ClientForm } from "@/components/ClientForm";

export default function ManagePage() {
  const { user } = useUser();
  const [section, setSection] = useState("properties");
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Redirect non-agent users
  if (!user?.isAgent) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex pt-16">
      <Sidebar>
        <SidebarHeader>
          <h2 className="text-lg font-semibold px-4">Panel de gestión</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={section === "properties"}
                onClick={() => setSection("properties")}
              >
                <Building2 className="h-4 w-4" />
                <span>Gestionar propiedades</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={section === "clients"}
                onClick={() => setSection("clients")}
              >
                <Users className="h-4 w-4" />
                <span>CRM clientes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={section === "reviews"}
                onClick={() => setSection("reviews")}
              >
                <Star className="h-4 w-4" />
                <span>Gestionar reseñas</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 p-6">
        {section === "properties" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Gestionar propiedades</h1>
              <Button onClick={() => setIsAddingProperty(true)} size="lg">
                Añadir propiedad
              </Button>
            </div>

            {isAddingProperty ? (
              <PropertyForm onClose={() => setIsAddingProperty(false)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Property grid will go here */}
              </div>
            )}
          </div>
        )}
        {section === "clients" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">CRM clientes</h1>
              <Button onClick={() => setIsAddingClient(true)} size="lg">
                Añadir cliente
              </Button>
            </div>

            {isAddingClient ? (
              <ClientForm onClose={() => setIsAddingClient(false)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Client grid will go here */}
              </div>
            )}
          </div>
        )}
        {section === "reviews" && <h1>Gestionar reseñas</h1>}
      </main>
    </div>
  );
}