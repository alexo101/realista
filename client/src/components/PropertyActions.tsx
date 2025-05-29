import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: number;
  title: string;
  isActive?: boolean;
}

interface PropertyActionsProps {
  property: Property;
  onUpdate?: () => void;
}

export function PropertyActions({ property, onUpdate }: PropertyActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(property.isActive ?? true);

  const deleteMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await apiRequest("DELETE", `/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error("Error al eliminar la propiedad");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Propiedad eliminada",
        description: "La propiedad ha sido eliminada permanentemente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      onUpdate?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la propiedad.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ propertyId, isActive }: { propertyId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/properties/${propertyId}/toggle-status`, {
        isActive,
      });
      if (!response.ok) {
        throw new Error("Error al cambiar el estado de la propiedad");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setIsActive(data.isActive);
      toast({
        title: data.isActive ? "Propiedad activada" : "Propiedad desactivada",
        description: data.isActive 
          ? "La propiedad ahora es visible para los clientes." 
          : "La propiedad está oculta para los clientes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      onUpdate?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la propiedad.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProperty = () => {
    deleteMutation.mutate(property.id);
  };

  const handleToggleStatus = (checked: boolean) => {
    toggleStatusMutation.mutate({ propertyId: property.id, isActive: checked });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle visibility switch */}
      <div className="flex items-center gap-2">
        {isActive ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-gray-400" />
        )}
        <Switch
          checked={isActive}
          onCheckedChange={handleToggleStatus}
          disabled={toggleStatusMutation.isPending}
        />
        <span className="text-sm text-gray-600">
          {isActive ? "Visible" : "Oculta"}
        </span>
      </div>

      {/* Delete property button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La propiedad "{property.title}" 
              será eliminada permanentemente de la plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}