import { useState } from "react";
import { Redirect } from "wouter";
import { useUser } from "@/contexts/user-context";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Building2, Users, Star, UserCircle } from "lucide-react";
import { PropertyForm } from "@/components/PropertyForm";
import { ClientForm } from "@/components/ClientForm";
import { ReviewRequestForm } from "@/components/ReviewRequestForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ManagePage() {
  const { user } = useUser();
  const [section, setSection] = useState("properties");
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);

  // Redirect non-agent users
  if (!user?.isAgent) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      <SidebarProvider>
        <Sidebar className="pt-16 w-64 border-r">
          <SidebarContent>
            <div className="p-4 border-b">
              <h2 className="font-semibold mb-4">Mi perfil</h2>
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-100 mb-2 flex items-center justify-center">
                    <UserCircle className="w-12 h-12 text-gray-400" />
                  </div>
                  <Label htmlFor="picture" className="cursor-pointer text-sm text-primary">
                    Cambiar foto
                  </Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // Handle profile picture upload
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Implement profile picture upload
                      }
                    }}
                  />
                </div>
              </div>
            </div>

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

        <main className="flex-1 p-6 pt-20">
          {section === "properties" && (
            <div className="space-y-4">
              <Button onClick={() => setIsAddingProperty(true)} size="lg">
                Añadir propiedad
              </Button>

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
              <Button onClick={() => setIsAddingClient(true)} size="lg">
                Añadir cliente
              </Button>

              {isAddingClient ? (
                <ClientForm onClose={() => setIsAddingClient(false)} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Client grid will go here */}
                </div>
              )}
            </div>
          )}
          {section === "reviews" && (
            <div className="space-y-4">
              <Button onClick={() => setIsRequestingReview(true)} size="lg">
                Solicitar reseña
              </Button>

              {isRequestingReview ? (
                <ReviewRequestForm onClose={() => setIsRequestingReview(false)} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Reviews grid will go here */}
                </div>
              )}
            </div>
          )}
        </main>
      </SidebarProvider>
    </div>
  );
}