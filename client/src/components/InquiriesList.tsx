import { useState, useEffect } from "react";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

// Tipo para las consultas
interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: number;
  agentId: number;
  status: string;
  createdAt: string;
  property?: {
    title?: string;
    address: string;
    reference?: string;
  };
}

export function InquiriesList() {
  const { user } = useUser();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar las consultas del agente
  useEffect(() => {
    if (user?.id) {
      fetchInquiries();
    }
  }, [user?.id]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inquiries/agent/${user!.id}`);
      
      if (!response.ok) {
        throw new Error("Error al cargar las consultas");
      }
      
      const data = await response.json();
      setInquiries(data);
    } catch (error) {
      console.error("Error al cargar consultas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las consultas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Actualizar el estado de una consulta
  const updateInquiryStatus = async (inquiryId: number, newStatus: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar el estado de la consulta");
      }
      
      // Actualizar la lista local
      setInquiries(prevInquiries => 
        prevInquiries.map(inquiry => 
          inquiry.id === inquiryId 
            ? { ...inquiry, status: newStatus } 
            : inquiry
        )
      );
      
      toast({
        title: "Estado actualizado",
        description: `La consulta ha sido marcada como ${getStatusText(newStatus)}`,
      });
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la consulta",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setOpenDialog(null);
    }
  };

  // Obtener el texto del estado en español
  const getStatusText = (status: string) => {
    switch (status) {
      case "pendiente": return "Pendiente";
      case "contactado": return "Contactado";
      case "finalizado": return "Finalizado";
      default: return status;
    }
  };

  // Obtener el color de la badge según el estado
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "pendiente": return "outline";
      case "contactado": return "secondary";
      case "finalizado": return "default";
      default: return "outline";
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas de propiedades</CardTitle>
          <CardDescription>Cargando consultas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (inquiries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas de propiedades</CardTitle>
          <CardDescription>No tienes consultas pendientes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultas de propiedades</CardTitle>
        <CardDescription>
          Gestiona las consultas recibidas sobre tus propiedades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-4">
          {inquiries.map((inquiry) => (
            <AccordionItem 
              key={inquiry.id} 
              value={`inquiry-${inquiry.id}`}
              className="border rounded-lg p-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{inquiry.name}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{formatDate(inquiry.createdAt)}</span>
                    <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                      {getStatusText(inquiry.status)}
                    </Badge>
                  </div>
                </div>
                <AccordionTrigger className="mr-4">
                  <span className="sr-only">Abrir detalles</span>
                </AccordionTrigger>
              </div>

              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Propiedad</h4>
                    <p className="text-sm">
                      {inquiry.property?.title || "Sin título"} ({inquiry.property?.address})
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Información de contacto</h4>
                    <p className="text-sm">Email: {inquiry.email}</p>
                    <p className="text-sm">Teléfono: {inquiry.phone}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Mensaje</h4>
                    <p className="text-sm">{inquiry.message}</p>
                  </div>

                  <Separator />
                  
                  <div className="flex justify-end gap-2">
                    {inquiry.status === "pendiente" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenDialog(inquiry.id)}
                      >
                        <Check className="mr-1 h-4 w-4" /> Marcar como contactado
                      </Button>
                    )}
                    
                    {inquiry.status === "contactado" && (
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => setOpenDialog(inquiry.id)}
                      >
                        <Check className="mr-1 h-4 w-4" /> Marcar como finalizado
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      
      {/* Diálogo de confirmación */}
      <Dialog open={!!openDialog} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado de la consulta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres cambiar el estado de esta consulta?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(null)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            {openDialog && inquiries.find(i => i.id === openDialog)?.status === "pendiente" && (
              <Button 
                onClick={() => updateInquiryStatus(openDialog, "contactado")}
                disabled={actionLoading}
              >
                Marcar como contactado
              </Button>
            )}
            {openDialog && inquiries.find(i => i.id === openDialog)?.status === "contactado" && (
              <Button 
                onClick={() => updateInquiryStatus(openDialog, "finalizado")}
                disabled={actionLoading}
              >
                Marcar como finalizado
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}