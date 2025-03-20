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
import { Building2, Users, Star } from "lucide-react";

export default function ManagePage() {
  const { user } = useUser();
  const [section, setSection] = useState("properties");

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
        {section === "properties" && <h1>Gestionar propiedades</h1>}
        {section === "clients" && <h1>CRM clientes</h1>}
        {section === "reviews" && <h1>Gestionar reseñas</h1>}
      </main>
    </div>
  );
}
