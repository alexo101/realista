import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const CLIENT_STATUSES = [
  { value: "Nuevo", label: "Nuevo", color: "bg-blue-500" },
  { value: "Contactado", label: "Contactado", color: "bg-yellow-500" },
  { value: "En seguimiento", label: "En seguimiento", color: "bg-green-500" },
  { value: "Visitando / Programando visita", label: "Visitando / Programando visita", color: "bg-orange-500" },
  { value: "Oferta realizada", label: "Oferta realizada", color: "bg-purple-500" },
  { value: "En negociación", label: "En negociación", color: "bg-amber-700" },
  { value: "Reservado / En proceso de cierre", label: "Reservado / En proceso de cierre", color: "bg-teal-500" },
  { value: "Ganado", label: "Ganado", color: "bg-green-600" },
  { value: "Perdido / No interesado", label: "Perdido / No interesado", color: "bg-gray-500" },
  { value: "Inactivo", label: "Inactivo", color: "bg-red-500" }
] as const;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; surname: string; email: string; phone: string; status: string }) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: { name: string; surname: string; email: string; phone: string; status?: string };
  isEditing?: boolean;
}

export function AddClientModal({ isOpen, onClose, onSubmit, isSubmitting = false, initialData, isEditing = false }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    surname: initialData?.surname || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    status: initialData?.status || "Nuevo"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        surname: initialData.surname || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        status: initialData.status || "Nuevo"
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.surname.trim()) {
      newErrors.surname = "El apellido es obligatorio";
    } else if (formData.surname.trim().length < 2) {
      newErrors.surname = "El apellido debe tener al menos 2 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de email inválido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es obligatorio";
    } else if (!/^(\+34|0034|34)?[\s\-]?[6789]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}$/.test(formData.phone)) {
      newErrors.phone = "Formato de teléfono inválido (ej: 612345678)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
      setFormData({ name: "", surname: "", email: "", phone: "", status: "Nuevo" });
      setErrors({});
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    setFormData({ name: "", surname: "", email: "", phone: "", status: "Nuevo" });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Editar cliente" : "Añadir nuevo cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nombre completo"
              data-testid="input-client-name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="surname">Apellido</Label>
            <Input
              id="surname"
              value={formData.surname}
              onChange={(e) => handleChange("surname", e.target.value)}
              placeholder="Apellido"
              data-testid="input-client-surname"
              className={errors.surname ? "border-red-500" : ""}
            />
            {errors.surname && <p className="text-sm text-red-500 mt-1">{errors.surname}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@ejemplo.com"
              data-testid="input-client-email"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="666555444"
              data-testid="input-client-phone"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="status">Estado del cliente</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger className="w-full" data-testid="select-client-status">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${CLIENT_STATUSES.find(s => s.value === formData.status)?.color}`} />
                    {CLIENT_STATUSES.find(s => s.value === formData.status)?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CLIENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="button-cancel-client"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-save-client"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar"
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
