import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ContactHistoryEntry } from "@shared/schema";

const CLIENT_STATUSES = [
  { value: "Nuevo", label: "Nuevo", color: "bg-blue-100 text-blue-900" },
  { value: "Seguimiento", label: "Seguimiento", color: "bg-blue-300 text-blue-900" },
  { value: "En visitas", label: "En visitas", color: "bg-blue-500 text-white" },
  { value: "Cerrando", label: "Cerrando", color: "bg-blue-700 text-white" },
  { value: "Ganado", label: "Ganado", color: "bg-blue-900 text-white" },
  { value: "Perdido", label: "Perdido", color: "bg-gray-500 text-white" }
] as const;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    surname: string; 
    email: string; 
    phone: string; 
    status: string;
    contactHistory?: ContactHistoryEntry[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: { 
    name: string; 
    surname: string; 
    email: string; 
    phone: string; 
    status?: string;
    contactHistory?: ContactHistoryEntry[];
  };
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
  const [contactHistory, setContactHistory] = useState<ContactHistoryEntry[]>(initialData?.contactHistory || []);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ status: "Nuevo", note: "" });
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);

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
      setFormData({ name: "", surname: "", email: "", phone: "", status: "Nuevo" });
      setContactHistory([]);
      setErrors({});
    }
  };

  const handleAddNote = () => {
    if (newNote.note.trim()) {
      const entry: ContactHistoryEntry = {
        id: crypto.randomUUID(),
        status: newNote.status,
        timestamp: new Date().toISOString(),
        note: newNote.note.trim()
      };
      setContactHistory(prev => [entry, ...prev]); // Add to beginning for reverse chronological order
      setNewNote({ status: formData.status, note: "" });
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setContactHistory(prev => prev.filter(entry => entry.id !== noteId));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    setFormData({ name: "", surname: "", email: "", phone: "", status: "Nuevo" });
    setContactHistory([]);
    setIsAddingNote(false);
    setNewNote({ status: "Nuevo", note: "" });
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
                    <Label htmlFor="note-status">Estado</Label>
                    <Select
                      value={newNote.status}
                      onValueChange={(value) => setNewNote(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full bg-white" data-testid="select-note-status">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${CLIENT_STATUSES.find(s => s.value === newNote.status)?.color}`} />
                            {CLIENT_STATUSES.find(s => s.value === newNote.status)?.label}
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
                    <Label htmlFor="note-text">Nota</Label>
                    <Textarea
                      id="note-text"
                      value={newNote.note}
                      onChange={(e) => setNewNote(prev => ({ ...prev, note: e.target.value }))}
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
                        setNewNote({ status: formData.status, note: "" });
                      }}
                      data-testid="button-cancel-note"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNote.note.trim()}
                      data-testid="button-save-note"
                    >
                      Guardar nota
                    </Button>
                  </div>
                </div>
              )}

              {/* Timeline Display */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {contactHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay notas en el historial
                  </p>
                ) : (
                  contactHistory.map((entry, index) => {
                    const statusConfig = CLIENT_STATUSES.find(s => s.value === entry.status);
                    const isHovered = hoveredNoteId === entry.id;
                    
                    return (
                      <div
                        key={entry.id}
                        className="relative pl-6 pb-3"
                        onMouseEnter={() => setHoveredNoteId(entry.id)}
                        onMouseLeave={() => setHoveredNoteId(null)}
                        data-testid={`timeline-note-${entry.id}`}
                      >
                        {/* Vertical line */}
                        {index < contactHistory.length - 1 && (
                          <div className="absolute left-2 top-6 bottom-0 w-px bg-gray-200" />
                        )}
                        
                        {/* Circle indicator */}
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-200" />
                        
                        <div className="bg-gray-50 border rounded-lg p-3 relative">
                          {/* Delete button (appears on hover) */}
                          {isHovered && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-red-600"
                              onClick={() => handleDeleteNote(entry.id)}
                              data-testid={`button-delete-note-${entry.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <div className="flex items-center gap-2 mb-2">
                            {statusConfig && (
                              <Badge className={`${statusConfig.color} text-xs`}>
                                {statusConfig.label}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700">{entry.note}</p>
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
  );
}
