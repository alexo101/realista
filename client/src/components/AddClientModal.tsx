import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ContactHistoryEntry } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";

const CLIENT_STATUSES = [
  { value: "Nuevo", label: "Nuevo", color: "bg-blue-100 text-blue-900" },
  { value: "Seguimiento", label: "Seguimiento", color: "bg-blue-300 text-blue-900" },
  { value: "En visitas", label: "En visitas", color: "bg-blue-500 text-white" },
  { value: "Oferta hecha", label: "Oferta hecha", color: "bg-blue-600 text-white" },
  { value: "Cerrando", label: "Cerrando", color: "bg-blue-700 text-white" },
  { value: "Ganado", label: "Ganado", color: "bg-blue-900 text-white" },
  { value: "Perdido", label: "Perdido", color: "bg-gray-500 text-white" }
] as const;

const CLIENT_TYPES = ["buyer", "tenant", "seller", "landlord"] as const;
type ClientType = (typeof CLIENT_TYPES)[number];

const CLIENT_TAGS: Record<ClientType, string[]> = {
  buyer: ["first_time_buyer", "investor", "cash_buyer", "financing_required", "foreign_buyer", "relocating", "urgent_purchase", "residential", "commercial", "buy_to_let", "fix_and_flip", "portfolio_expansion", "vip", "repeat_client", "referred", "high_priority", "responsive"],
  tenant: ["student", "professional", "family", "pet_owner", "relocating", "short_term_rental", "long_term_rental", "vip", "repeat_client", "referred", "high_priority", "responsive"],
  seller: ["urgent_sale", "already_purchased_another_property", "exclusive_listing", "open_to_negotiation", "investment_property", "vip", "repeat_client", "referred", "high_priority", "responsive"],
  landlord: ["investor", "first_time_landlord", "long_term_rental", "short_term_rental", "looking_for_property_management", "vip", "repeat_client", "referred", "high_priority", "responsive"],
};

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    surname: string; 
    email: string; 
    phone: string; 
    status: string;
    clientType?: string | null;
    tags?: string[] | null;
    contactHistory?: ContactHistoryEntry[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: { 
    name: string; 
    surname: string; 
    email: string; 
    phone: string; 
    status?: string;
    clientType?: string | null;
    tags?: string[] | null;
    contactHistory?: ContactHistoryEntry[];
  };
  isEditing?: boolean;
}

export function AddClientModal({ isOpen, onClose, onSubmit, isSubmitting = false, initialData, isEditing = false }: AddClientModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    surname: initialData?.surname || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    status: initialData?.status || "Nuevo",
    clientType: initialData?.clientType || null,
    tags: initialData?.tags || []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactHistory, setContactHistory] = useState<ContactHistoryEntry[]>(initialData?.contactHistory || []);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        surname: initialData.surname || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        status: initialData.status || "Nuevo",
        clientType: initialData.clientType || null,
        tags: initialData.tags || []
      });
      setContactHistory(initialData.contactHistory || []);
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
      await onSubmit({ ...formData, contactHistory });
      setFormData({ name: "", surname: "", email: "", phone: "", status: "Nuevo", clientType: null, tags: [] });
      setContactHistory([]);
      setErrors({});
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const entry: ContactHistoryEntry = {
        id: crypto.randomUUID(),
        status: formData.status,
        timestamp: new Date().toISOString(),
        note: newNote.trim()
      };
      setContactHistory(prev => [entry, ...prev]); // Add to beginning for reverse chronological order
      setNewNote("");
      setIsAddingNote(false);
    }
  };

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      setContactHistory(prev => prev.filter(entry => entry.id !== noteToDelete));
      setNoteToDelete(null);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleClientTypeChange = (value: ClientType) => {
    setFormData(prev => ({
      ...prev,
      clientType: value,
      tags: (prev.tags || []).filter(tag => CLIENT_TAGS[value].includes(tag)),
    }));
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tags: checked
        ? Array.from(new Set([...(prev.tags || []), tag]))
        : (prev.tags || []).filter(selectedTag => selectedTag !== tag),
    }));
  };

  const handleClose = () => {
    setFormData({ name: "", surname: "", email: "", phone: "", status: "Nuevo", clientType: null, tags: [] });
    setContactHistory([]);
    setIsAddingNote(false);
    setNewNote("");
    setErrors({});
    onClose();
  };

  const selectedClientType = CLIENT_TYPES.includes(formData.clientType as ClientType)
    ? formData.clientType as ClientType
    : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

          <div>
            <Label htmlFor="client-type">{t("manage.client_type.label")}</Label>
            <Select
              value={formData.clientType || undefined}
              onValueChange={(value) => handleClientTypeChange(value as ClientType)}
            >
              <SelectTrigger id="client-type" className="w-full" data-testid="select-client-type">
                <SelectValue placeholder={t("manage.client_type.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`manage.client_type.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <Label>{t("manage.client_tags.label")}</Label>
              <span className="text-xs text-muted-foreground">
                {t("manage.client_tags.recommendation")}
              </span>
            </div>
              {!selectedClientType ? (
              <p className="text-sm text-muted-foreground mt-2">
                {t("manage.client_tags.select_type")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {CLIENT_TAGS[selectedClientType].map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={(formData.tags || []).includes(tag)}
                      onCheckedChange={(checked) => handleTagChange(tag, checked === true)}
                      data-testid={`checkbox-client-tag-${tag}`}
                    />
                    <span>{t(`manage.client_tag.${tag}`)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Contact History Section - Only show in edit mode */}
          {isEditing && (
            <div className="border-t pt-4 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Historial de contacto</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="text-primary"
                  data-testid="button-add-note"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir nota
                </Button>
              </div>

              {/* Add Note Form */}
              {isAddingNote && (
                <div className="bg-gray-50 border rounded-lg p-3 mb-4 space-y-3">
                  <div>
                    <Label htmlFor="note-text">Nota</Label>
                    <Textarea
                      id="note-text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Describe la interacción con el cliente..."
                      rows={3}
                      className="resize-none"
                      data-testid="textarea-note"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote("");
                      }}
                      data-testid="button-cancel-note"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      data-testid="button-save-note"
                    >
                      Guardar nota
                    </Button>
                  </div>
                </div>
              )}

              {/* Timeline Display */}
              <div className="space-y-4">
                {contactHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay notas en el historial
                  </p>
                ) : (
                  contactHistory.map((entry, index) => {
                    const statusConfig = CLIENT_STATUSES.find(s => s.value === entry.status);
                    
                    return (
                      <div
                        key={entry.id}
                        className="relative pl-8 pb-2"
                        data-testid={`timeline-note-${entry.id}`}
                      >
                        {/* Vertical line */}
                        {index < contactHistory.length - 1 && (
                          <div className="absolute left-[7px] top-6 bottom-0 w-px bg-gray-300" />
                        )}
                        
                        {/* Circle indicator */}
                        <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-gray-300 border-2 border-white" />
                        
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {statusConfig && (
                                <Badge className={`${statusConfig.color} text-xs px-2 py-0.5 rounded-full`}>
                                  {statusConfig.label}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{entry.note}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-600 flex-shrink-0"
                            onClick={() => setNoteToDelete(entry.id)}
                            data-testid={`button-delete-note-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

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

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La nota se eliminará permanentemente del historial de contacto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteNote} className="bg-red-600 hover:bg-red-700">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
