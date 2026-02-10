import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";
import {
  type Property,
  type Client,
  type PropertyContract,
  type PropertyPayment,
  type PropertyDocument,
  type PropertyIncident,
  type PropertyCommunication,
  type PropertyHistoryEntry,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Pencil,
  RefreshCw,
  Plus,
  FileText,
  AlertTriangle,
  MessageSquare,
  Clock,
  Calendar,
  Euro,
  Home,
  User,
  Download,
  Trash2,
  Eye,
  ChevronDown,
} from "lucide-react";

interface PropertyManagementProps {
  property: Property;
  onBack: () => void;
  onEdit: () => void;
}

const MANAGEMENT_STATUSES = [
  "Creada",
  "Activa",
  "Reservada",
  "Alquilada",
  "Inactiva",
  "Vendida",
  "En reforma",
] as const;

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Creada": return "bg-gray-100 text-gray-700";
    case "Activa": return "bg-green-100 text-green-700";
    case "Reservada": return "bg-yellow-100 text-yellow-700";
    case "Alquilada": return "bg-blue-100 text-blue-700";
    case "Inactiva": return "bg-gray-200 text-gray-800";
    case "Vendida": return "bg-purple-100 text-purple-700";
    case "En reforma": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getIncidentStatusBadgeClass(status: string) {
  switch (status) {
    case "Nueva": return "bg-green-100 text-green-700";
    case "Asignada": return "bg-blue-100 text-blue-700";
    case "En espera": return "bg-yellow-100 text-yellow-700";
    case "Resuelta": return "bg-gray-100 text-gray-700";
    case "Verificada": return "bg-purple-100 text-purple-700";
    case "Cerrada": return "bg-gray-200 text-gray-800";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case "Alta": return "bg-red-100 text-red-700";
    case "Media": return "bg-yellow-100 text-yellow-700";
    case "Baja": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getHistoryIconColor(eventType: string) {
  switch (eventType) {
    case "creation": return "bg-teal-100 text-teal-700";
    case "status_change": return "bg-blue-100 text-blue-700";
    case "contract": return "bg-blue-100 text-blue-700";
    case "payment": return "bg-orange-100 text-orange-700";
    case "incident": return "bg-red-100 text-red-700";
    case "communication": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getHistoryIcon(eventType: string) {
  switch (eventType) {
    case "creation": return <Home className="h-4 w-4" />;
    case "status_change": return <RefreshCw className="h-4 w-4" />;
    case "contract": return <FileText className="h-4 w-4" />;
    case "payment": return <Euro className="h-4 w-4" />;
    case "incident": return <AlertTriangle className="h-4 w-4" />;
    case "communication": return <MessageSquare className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

const PAYMENT_CONCEPTS = [
  "Renta mensual",
  "Renta prorrateada (primer o último mes parcial)",
  "Actualización anual de renta (IPC u otro índice)",
  "Suministros (agua, luz, gas)",
  "Regularización de suministros",
  "Internet / telecomunicaciones",
  "Gastos de comunidad repercutidos",
  "Derramas repercutidas",
  "IBI repercutido",
  "Tasa de basuras",
  "Seguro obligatorio del inquilino",
  "Plaza de parking",
  "Trastero",
  "Fianza legal",
  "Garantías complementarias (depósito adicional)",
  "Aval bancario",
  "Seguro de impago",
  "Provisión de fondos inicial",
  "Alta de suministros",
  "Cambio de titularidad de contratos",
  "Honorarios de gestión / intermediación",
  "ITP",
  "IVA",
  "Retención IRPF (en alquileres no residenciales)",
  "Penalización por retraso en pago",
  "Intereses de demora",
  "Penalización por desistimiento anticipado",
  "Indemnización por incumplimiento contractual",
  "Reposición de llaves",
  "Cambio de cerradura",
  "Limpieza final",
  "Reparaciones imputables al inquilino",
  "Daños al inmueble",
  "Reposición de mobiliario",
  "Servicios adicionales (mantenimiento, limpieza periódica etc)",
  "Cuotas de servicios comunes",
  "Devolución parcial de fianza",
  "Otros anexos (jardín, terraza, etc.)",
  "Compensaciones económicas",
  "Gastos judiciales repercutidos",
  "Costes de burofax o notificaciones formales",
];

const DOCUMENT_TYPES = [
  "Cédula de habitabilidad",
  "Certificado energético",
  "Contrato de arrendamiento",
  "Documento identificación propietario",
  "Escrituras",
  "Licencia de primera ocupación",
  "Nota simple",
  "Certificado de estar al corriente con la comunidad",
  "Último recibo de IBI",
  "Referencia catastral / Certificado catastral descriptivo y gráfico",
  "Recibos de suministros recientes",
  "Certificado de deuda cero hipotecaria",
  "Escritura de cancelación de hipoteca",
  "Estatutos de la comunidad de propietarios",
  "Actas recientes de la comunidad (últimos 1–2 años)",
  "Informe ITE / IEE (según antigüedad del edificio)",
  "Seguro del hogar (póliza)",
  "Inventario firmado (en alquiler amueblado)",
  "Acta de entrega de llaves",
  "Acta de estado del inmueble (check-in / check-out)",
  "Certificado de instalación eléctrica (boletín)",
  "Certificado de instalación de gas",
  "Licencia turística (si aplica)",
  "Número de registro de alquiler turístico",
  "Contrato de arras (en venta)",
  "Contrato de reserva",
  "Nota de encargo con la agencia",
  "Poder notarial (si firma un representante)",
  "Certificado de eficiencia energética registrado (no solo el informe)",
  "Planos del inmueble",
  "Memoria de calidades",
  "Proyecto técnico y licencia de obras (si hubo reforma relevante)",
  "Certificado final de obra",
  "Seguro decenal (en obra nueva)",
  "Libro del edificio (si aplica)",
  "Certificado de no afección urbanística",
  "Copia del DNI/NIE del inquilino",
  "Aval bancario o póliza de seguro de impago",
  "Justificante de depósito de fianza en organismo autonómico",
];

const COMMUNICATION_TYPES = [
  "Actualización renta",
  "Desalojo",
  "Devolución de fianza",
  "Entrega de llave",
  "Finalización de contrato",
  "Incidencia en la propiedad",
  "Inclusión en fichero de morosos",
  "Inspección de propiedad",
  "Mantenimiento",
  "Obras",
  "Pago suministro",
  "Reparación",
  "Retraso de pago",
];

export function PropertyManagement({ property, onBack, onEdit }: PropertyManagementProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useUser();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(property.managementStatus);

  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [contractForm, setContractForm] = useState({
    tenantName: "",
    tenantId: null as number | null,
    tenantEmail: "",
    tenantPhone: "",
    duration: 12,
    startDate: "",
    endDate: "",
    rentPrice: 0,
    guarantee: 0,
  });

  const clientsQueryParam = user?.isAdmin && user?.agencyId
    ? `agencyId=${user.agencyId}`
    : user?.id
    ? `agentId=${user.id}`
    : null;

  const { data: agencyClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", clientsQueryParam],
    queryFn: async () => {
      if (!clientsQueryParam) return [];
      const res = await fetch(`/api/clients?${clientsQueryParam}`, { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: contractDialogOpen && Boolean(clientsQueryParam),
  });

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return agencyClients;
    const search = clientSearch.toLowerCase();
    return agencyClients.filter(
      (c) =>
        c.name?.toLowerCase().includes(search) ||
        c.surname?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search)
    );
  }, [agencyClients, clientSearch]);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    concept: "",
    amount: 0,
    status: "Pendiente",
    addToHistory: false,
  });

  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    documentType: "",
    fileName: "",
  });

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<PropertyIncident | null>(null);
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    status: "Nueva",
    priority: "Media",
    description: "",
  });
  const [expandedIncidentId, setExpandedIncidentId] = useState<number | null>(null);

  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false);
  const [communicationForm, setCommunicationForm] = useState({
    title: "",
    communicationType: "",
    relevantDate: "",
    addToCalendar: false,
    description: "",
    addToHistory: false,
  });

  const [historyTypeFilter, setHistoryTypeFilter] = useState<string | null>(null);
  const [historyTimeFilter, setHistoryTimeFilter] = useState<string>("Todo");

  const { data: activeContract, isLoading: contractLoading } = useQuery<PropertyContract | null>({
    queryKey: ["/api/properties", property.uuid, "contracts", "active"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/properties/${property.uuid}/contracts/active`, { credentials: "include" });
        if (res.status === 404) return null;
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PropertyPayment[]>({
    queryKey: ["/api/properties", property.uuid, "payments"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/properties/${property.uuid}/payments`, { credentials: "include" });
        if (!res.ok) return [];
        return await res.json();
      } catch { return []; }
    },
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<PropertyDocument[]>({
    queryKey: ["/api/properties", property.uuid, "documents"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/properties/${property.uuid}/documents`, { credentials: "include" });
        if (!res.ok) return [];
        return await res.json();
      } catch { return []; }
    },
  });

  const { data: incidents = [], isLoading: incidentsLoading } = useQuery<PropertyIncident[]>({
    queryKey: ["/api/properties", property.uuid, "incidents"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/properties/${property.uuid}/incidents`, { credentials: "include" });
        if (!res.ok) return [];
        return await res.json();
      } catch { return []; }
    },
  });

  const { data: communications = [], isLoading: communicationsLoading } = useQuery<PropertyCommunication[]>({
    queryKey: ["/api/properties", property.uuid, "communications"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/properties/${property.uuid}/communications`, { credentials: "include" });
        if (!res.ok) return [];
        return await res.json();
      } catch { return []; }
    },
  });

  const { data: historyEntries = [], isLoading: historyLoading } = useQuery<PropertyHistoryEntry[]>({
    queryKey: ["/api/properties", property.uuid, "history"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/properties/${property.uuid}/history`, { credentials: "include" });
        if (!res.ok) return [];
        return await res.json();
      } catch { return []; }
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/properties/${property.uuid}/management-status`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Estado actualizado", description: `El estado se ha cambiado a "${newStatus}"` });
      setStatusDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el estado", variant: "destructive" });
    },
  });

  const contractMutation = useMutation({
    mutationFn: async (data: typeof contractForm) => {
      return apiRequest("POST", `/api/properties/${property.uuid}/contracts`, {
        propertyUuid: property.uuid,
        tenantId: data.tenantId,
        tenantName: data.tenantName,
        tenantEmail: data.tenantEmail,
        tenantPhone: data.tenantPhone,
        duration: data.duration,
        startDate: data.startDate,
        endDate: data.endDate,
        rentPrice: data.rentPrice,
        guarantee: data.guarantee,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "contracts", "active"] });
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "history"] });
      toast({ title: "Contrato creado", description: "El contrato de alquiler ha sido registrado" });
      setContractDialogOpen(false);
      setClientSearch("");
      setContractForm({ tenantName: "", tenantId: null, tenantEmail: "", tenantPhone: "", duration: 12, startDate: "", endDate: "", rentPrice: 0, guarantee: 0 });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el contrato", variant: "destructive" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: typeof paymentForm) => {
      return apiRequest("POST", `/api/properties/${property.uuid}/payments`, {
        propertyUuid: property.uuid,
        concept: data.concept,
        amount: data.amount,
        status: data.status,
        addToHistory: data.addToHistory,
        paymentDate: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "payments"] });
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "history"] });
      toast({ title: "Pago registrado", description: "El pago ha sido añadido correctamente" });
      setPaymentDialogOpen(false);
      setPaymentForm({ concept: "", amount: 0, status: "Pendiente", addToHistory: false });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar el pago", variant: "destructive" });
    },
  });

  const documentMutation = useMutation({
    mutationFn: async (data: typeof documentForm) => {
      return apiRequest("POST", `/api/properties/${property.uuid}/documents`, {
        propertyUuid: property.uuid,
        documentType: data.documentType,
        fileName: data.fileName,
        fileUrl: "#",
        fileSize: "N/A",
        uploadDate: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "documents"] });
      toast({ title: "Documento registrado", description: "El documento ha sido añadido" });
      setDocumentDialogOpen(false);
      setDocumentForm({ documentType: "", fileName: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar el documento", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/properties/${property.uuid}/documents/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "documents"] });
      toast({ title: "Documento eliminado" });
    },
  });

  const incidentMutation = useMutation({
    mutationFn: async (data: { title: string; status: string; priority: string; description: string; id?: number }) => {
      if (data.id) {
        return apiRequest("PATCH", `/api/properties/${property.uuid}/incidents/${data.id}`, {
          title: data.title,
          status: data.status,
          priority: data.priority,
          description: data.description,
        });
      }
      return apiRequest("POST", `/api/properties/${property.uuid}/incidents`, {
        propertyUuid: property.uuid,
        title: data.title,
        status: data.status,
        priority: data.priority,
        description: data.description,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "incidents"] });
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "history"] });
      toast({ title: editingIncident ? "Incidencia actualizada" : "Incidencia registrada" });
      setIncidentDialogOpen(false);
      setEditingIncident(null);
      setIncidentForm({ title: "", status: "Nueva", priority: "Media", description: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la incidencia", variant: "destructive" });
    },
  });

  const communicationMutation = useMutation({
    mutationFn: async (data: typeof communicationForm) => {
      return apiRequest("POST", `/api/properties/${property.uuid}/communications`, {
        propertyUuid: property.uuid,
        title: data.title,
        communicationType: data.communicationType,
        relevantDate: data.relevantDate,
        description: data.description,
        addToCalendar: data.addToCalendar,
        addToHistory: data.addToHistory,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "communications"] });
      qc.invalidateQueries({ queryKey: ["/api/properties", property.uuid, "history"] });
      toast({ title: "Comunicación registrada" });
      setCommunicationDialogOpen(false);
      setCommunicationForm({ title: "", communicationType: "", relevantDate: "", addToCalendar: false, description: "", addToHistory: false });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar la comunicación", variant: "destructive" });
    },
  });

  const openIncidents = incidents.filter((i) => i.status !== "Cerrada" && i.status !== "Resuelta");

  function getNextPaymentDate(startDate: string): string {
    const start = new Date(startDate);
    const now = new Date();
    const dayOfMonth = start.getDate();
    let next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    if (next <= now) {
      next = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
    }
    return next.toLocaleDateString("es-ES");
  }

  const groupedDocuments = documents.reduce<Record<string, PropertyDocument[]>>((acc, doc) => {
    const type = doc.documentType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  const filteredHistory = historyEntries.filter((entry) => {
    if (historyTypeFilter && entry.eventType !== historyTypeFilter) return false;
    if (historyTimeFilter === "Último mes") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(entry.createdAt) >= oneMonthAgo;
    }
    if (historyTimeFilter === "Último año") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return new Date(entry.createdAt) >= oneYearAgo;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Back link */}
      <button
        data-testid="button-back-properties"
        onClick={onBack}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Volver a propiedades
      </button>
      {/* Header Card */}
      <Card className="border" data-testid="card-property-header">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold" data-testid="text-property-reference">
                  {property.reference || property.uuid.slice(0, 8).toUpperCase()}
                </span>
                <Badge className={`${getStatusBadgeClass(property.managementStatus)} border-0`} data-testid="badge-management-status">
                  {property.managementStatus}
                </Badge>
              </div>
              <p className="text-sm text-gray-500" data-testid="text-property-city">
                {property.city || property.address}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl md:text-3xl font-bold text-red-500 mb-3" data-testid="text-property-price">
                €{property.price?.toLocaleString()}
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-change-status"
                  onClick={() => {
                    setNewStatus(property.managementStatus);
                    setStatusDialogOpen(true);
                  }}
                >
                  Cambiar estado
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-edit-property"
                  onClick={onEdit}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar datos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cambiar estado de gestión</DialogTitle>
            <DialogDescription>Selecciona el nuevo estado para esta propiedad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Estado actual:</p>
              <Badge className={`${getStatusBadgeClass(property.managementStatus)} border-0`}>
                {property.managementStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Nuevo estado:</p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANAGEMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-confirm-status"
              onClick={() => statusMutation.mutate(newStatus)}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "Guardando..." : "Confirmar cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Tabs */}
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto" data-testid="tabs-property-management">
          <TabsTrigger value="resumen" data-testid="tab-resumen">Resumen</TabsTrigger>
          <TabsTrigger value="alquiler" data-testid="tab-alquiler">Alquiler</TabsTrigger>
          <TabsTrigger value="documentacion" data-testid="tab-documentacion">Documentación</TabsTrigger>
          <TabsTrigger value="incidencias" data-testid="tab-incidencias">Incidencias</TabsTrigger>
          <TabsTrigger value="comunicaciones" data-testid="tab-comunicaciones">Comunicaciones</TabsTrigger>
          <TabsTrigger value="historial" data-testid="tab-historial">Historial</TabsTrigger>
        </TabsList>

        {/* Tab 1: Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-next-payment">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Próximo Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {property.operationType === "Venta" || !activeContract ? (
                  <p className="text-2xl font-bold">-</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold" data-testid="text-next-payment-date">
                      {getNextPaymentDate(activeContract.startDate)}
                    </p>
                    <p className="text-sm text-gray-500" data-testid="text-tenant-name">
                      {activeContract.tenantName || "Inquilino"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-open-incidents">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Incidencias abiertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {openIncidents.length > 0 && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <p className="text-2xl font-bold" data-testid="text-open-incidents-count">
                    {openIncidents.length}
                  </p>
                </div>
                <p className="text-sm text-gray-500">Abiertas actualmente</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-property-details">
              <CardHeader>
                <CardTitle className="text-base">Detalles de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Dirección Completa</p>
                  <p className="text-sm font-medium" data-testid="text-full-address">{property.address}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-gray-500">Características</p>
                  <p className="text-sm font-medium" data-testid="text-characteristics">
                    {property.bedrooms || 0} hab. · {property.bathrooms || 0} baños · {property.superficie || 0} m²
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-gray-500">Referencia Interna</p>
                  <p className="text-sm font-medium" data-testid="text-internal-reference">{property.reference || "-"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-gray-500">Tipo de Gestión</p>
                  <p className="text-sm font-medium" data-testid="text-operation-type">{property.operationType}</p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-agenda">
              <CardHeader>
                <CardTitle className="text-base">Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Calendar className="h-12 w-12 mb-2" />
                  <p className="text-sm">No hay eventos próximos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Alquiler */}
        <TabsContent value="alquiler" className="space-y-4">
          {contractLoading ? (
            <p className="text-sm text-gray-500">Cargando contrato...</p>
          ) : !activeContract ? (
            <Card data-testid="card-no-contract">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No hay contrato activo</p>
                <Button
                  data-testid="button-setup-rental"
                  onClick={() => setContractDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Configurar alquiler
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-active-contract">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  Contrato Activo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Inquilino</p>
                    <p className="text-sm font-medium" data-testid="text-contract-tenant">{activeContract.tenantName || "-"}</p>
                    <p className="text-xs text-gray-400">{activeContract.tenantEmail}</p>
                    <p className="text-xs text-gray-400">{activeContract.tenantPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duración</p>
                    <p className="text-sm font-medium" data-testid="text-contract-duration">{activeContract.duration} Meses</p>
                    <p className="text-xs text-gray-400">Inicio: {activeContract.startDate}</p>
                    <p className="text-xs text-gray-400">Fin: {activeContract.endDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Condiciones Económicas</p>
                    <p className="text-sm font-medium" data-testid="text-contract-rent">€{activeContract.rentPrice?.toLocaleString()}/mes</p>
                    <p className="text-xs text-gray-400">Fianza: €{activeContract.guarantee?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          <Card data-testid="card-payments">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historial de Pagos Recientes</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="button-add-payment"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir pago
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <p className="text-sm text-gray-500">Cargando pagos...</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay pagos registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CONCEPTO</TableHead>
                        <TableHead>FECHA</TableHead>
                        <TableHead>ESTADO</TableHead>
                        <TableHead className="text-right">IMPORTE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                          <TableCell className="text-sm">{p.concept}</TableCell>
                          <TableCell className="text-sm text-gray-500">{p.paymentDate || "-"}</TableCell>
                          <TableCell>
                            <Badge className={`${p.status === "Pagado" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"} border-0`} data-testid={`badge-payment-status-${p.id}`}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">€{p.amount?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Documentación */}
        <TabsContent value="documentacion" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Documentación</h3>
            <Button
              size="sm"
              variant="outline"
              data-testid="button-upload-document"
              onClick={() => setDocumentDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Subir documento
            </Button>
          </div>

          {documentsLoading ? (
            <p className="text-sm text-gray-500">Cargando documentos...</p>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No hay documentos registrados</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedDocuments).map(([type, docs]) => (
              <Card key={type} className="border" data-testid={`card-document-group-${type}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{type}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{docs.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-document-${doc.id}`}>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-gray-400">{doc.uploadDate} · {doc.fileSize}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" data-testid={`button-download-doc-${doc.id}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-doc-${doc.id}`}
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 4: Incidencias */}
        <TabsContent value="incidencias" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Incidencias y Mantenimiento</h3>
              <p className="text-sm text-gray-500" data-testid="text-incidents-count">
                {openIncidents.length} abiertas de {incidents.length} total
              </p>
            </div>
            <Button
              size="sm"
              data-testid="button-new-incident"
              onClick={() => {
                setEditingIncident(null);
                setIncidentForm({ title: "", status: "Nueva", priority: "Media", description: "" });
                setIncidentDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva incidencia
            </Button>
          </div>

          {incidentsLoading ? (
            <p className="text-sm text-gray-500">Cargando incidencias...</p>
          ) : incidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No hay incidencias registradas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>INCIDENCIA</TableHead>
                    <TableHead>ESTADO</TableHead>
                    <TableHead>PRIORIDAD</TableHead>
                    <TableHead>FECHA</TableHead>
                    <TableHead>ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident) => (
                    <>
                      <TableRow key={incident.id} data-testid={`row-incident-${incident.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {incident.priority === "Alta" && <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />}
                            {incident.priority === "Media" && <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />}
                            <span className="text-sm font-medium">{incident.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getIncidentStatusBadgeClass(incident.status)} border-0`} data-testid={`badge-incident-status-${incident.id}`}>
                            {incident.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPriorityBadgeClass(incident.priority)} border-0`} data-testid={`badge-incident-priority-${incident.id}`}>
                            {incident.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(incident.createdAt).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-incident-${incident.id}`}
                              onClick={() => {
                                setEditingIncident(incident);
                                setIncidentForm({
                                  title: incident.title,
                                  status: incident.status,
                                  priority: incident.priority,
                                  description: incident.description || "",
                                });
                                setIncidentDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-expand-incident-${incident.id}`}
                              onClick={() => setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id)}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedIncidentId === incident.id ? "rotate-180" : ""}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedIncidentId === incident.id && (
                        <TableRow key={`${incident.id}-desc`}>
                          <TableCell colSpan={5} className="bg-gray-50">
                            <p className="text-sm text-gray-600 py-2" data-testid={`text-incident-description-${incident.id}`}>
                              {incident.description || "Sin descripción"}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Comunicaciones */}
        <TabsContent value="comunicaciones" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Comunicaciones</h3>
              <p className="text-sm text-gray-500" data-testid="text-communications-count">
                {communications.length} registradas
              </p>
            </div>
            <Button
              size="sm"
              data-testid="button-new-communication"
              onClick={() => {
                setCommunicationForm({ title: "", communicationType: "", relevantDate: "", addToCalendar: false, description: "", addToHistory: false });
                setCommunicationDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva comunicación
            </Button>
          </div>

          {communicationsLoading ? (
            <p className="text-sm text-gray-500">Cargando comunicaciones...</p>
          ) : communications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No hay comunicaciones registradas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>COMUNICACIÓN</TableHead>
                    <TableHead>TIPO</TableHead>
                    <TableHead>FECHA</TableHead>
                    <TableHead>ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communications.map((comm) => (
                    <TableRow key={comm.id} data-testid={`row-communication-${comm.id}`}>
                      <TableCell className="text-sm font-medium">{comm.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{comm.communicationType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{comm.relevantDate}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-view-communication-${comm.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab 6: Historial */}
        <TabsContent value="historial" className="space-y-4">
          <h3 className="text-lg font-semibold">Historial de Actividad</h3>

          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              variant={historyTypeFilter === null ? "default" : "outline"}
              size="sm"
              data-testid="filter-history-all-types"
              onClick={() => setHistoryTypeFilter(null)}
            >
              Todos
            </Button>
            <Button
              variant={historyTypeFilter === "creation" ? "default" : "outline"}
              size="sm"
              data-testid="filter-history-creation"
              onClick={() => setHistoryTypeFilter(historyTypeFilter === "creation" ? null : "creation")}
            >
              <Home className="h-3 w-3 mr-1" /> Creación
            </Button>
            <Button
              variant={historyTypeFilter === "status_change" ? "default" : "outline"}
              size="sm"
              data-testid="filter-history-status"
              onClick={() => setHistoryTypeFilter(historyTypeFilter === "status_change" ? null : "status_change")}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Estado
            </Button>
            <Button
              variant={historyTypeFilter === "payment" ? "default" : "outline"}
              size="sm"
              data-testid="filter-history-payment"
              onClick={() => setHistoryTypeFilter(historyTypeFilter === "payment" ? null : "payment")}
            >
              <Euro className="h-3 w-3 mr-1" /> Pago
            </Button>
            <Button
              variant={historyTypeFilter === "incident" ? "default" : "outline"}
              size="sm"
              data-testid="filter-history-incident"
              onClick={() => setHistoryTypeFilter(historyTypeFilter === "incident" ? null : "incident")}
            >
              <AlertTriangle className="h-3 w-3 mr-1" /> Incidencia
            </Button>
            <Button
              variant={historyTypeFilter === "communication" ? "default" : "outline"}
              size="sm"
              data-testid="filter-history-communication"
              onClick={() => setHistoryTypeFilter(historyTypeFilter === "communication" ? null : "communication")}
            >
              <MessageSquare className="h-3 w-3 mr-1" /> Comunicación
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            {["Todo", "Último mes", "Último año"].map((tf) => (
              <Button
                key={tf}
                variant={historyTimeFilter === tf ? "default" : "outline"}
                size="sm"
                data-testid={`filter-history-time-${tf}`}
                onClick={() => setHistoryTimeFilter(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>

          {historyLoading ? (
            <p className="text-sm text-gray-500">Cargando historial...</p>
          ) : filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No hay entradas en el historial</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg" data-testid={`row-history-${entry.id}`}>
                  <div className={`rounded-full p-2 shrink-0 ${getHistoryIconColor(entry.eventType)}`}>
                    {getHistoryIcon(entry.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" data-testid={`text-history-title-${entry.id}`}>{entry.title}</p>
                    <p className="text-xs text-gray-500">{entry.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString("en-US")}</p>
                    {entry.performedBy && <p className="text-xs text-gray-400">por {entry.performedBy}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Contract Dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar alquiler</DialogTitle>
            <DialogDescription>Introduce los datos del contrato de alquiler</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <label className="text-sm font-medium">Inquilino</label>
              <Input
                data-testid="input-tenant-name"
                value={contractForm.tenantId ? contractForm.tenantName : clientSearch}
                onChange={(e) => {
                  if (contractForm.tenantId) {
                    setContractForm({ ...contractForm, tenantName: "", tenantId: null });
                  }
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Buscar cliente por nombre o email..."
              />
              {contractForm.tenantId && (
                <button
                  type="button"
                  className="absolute right-2 top-[30px] text-gray-400 hover:text-gray-600 text-sm"
                  onClick={() => {
                    setContractForm({ ...contractForm, tenantName: "", tenantId: null });
                    setClientSearch("");
                  }}
                  data-testid="button-clear-tenant"
                >
                  ✕
                </button>
              )}
              {showClientDropdown && !contractForm.tenantId && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No se encontraron clientes</div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex flex-col"
                        data-testid={`option-client-${client.id}`}
                        onClick={() => {
                          setContractForm({
                            ...contractForm,
                            tenantName: `${client.name}${client.surname ? ` ${client.surname}` : ""}`,
                            tenantId: client.id,
                          });
                          setClientSearch("");
                          setShowClientDropdown(false);
                        }}
                      >
                        <span className="text-sm font-medium">{client.name}{client.surname ? ` ${client.surname}` : ""}</span>
                        <span className="text-xs text-gray-400">{client.email}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha inicio</label>
                <Input data-testid="input-contract-start" type="date" value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha fin</label>
                <Input data-testid="input-contract-end" type="date" value={contractForm.endDate} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Precio  de la renta (€/mes)</label>
              <Input data-testid="input-contract-rent" type="number" value={contractForm.rentPrice} onChange={(e) => setContractForm({ ...contractForm, rentPrice: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Fianza entregada (€)</label>
              <Input data-testid="input-contract-guarantee" type="number" value={contractForm.guarantee} onChange={(e) => setContractForm({ ...contractForm, guarantee: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-confirm-contract"
              onClick={() => contractMutation.mutate(contractForm)}
              disabled={contractMutation.isPending || !contractForm.tenantName || !contractForm.startDate || !contractForm.endDate}
            >
              {contractMutation.isPending ? "Guardando..." : "Configurar alquiler"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Añadir pago</DialogTitle>
            <DialogDescription>Registra un nuevo pago</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Concepto</label>
              <Select value={paymentForm.concept} onValueChange={(v) => setPaymentForm({ ...paymentForm, concept: v })}>
                <SelectTrigger data-testid="select-payment-concept">
                  <SelectValue placeholder="Seleccionar concepto" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {PAYMENT_CONCEPTS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Importe (€)</label>
              <Input data-testid="input-payment-amount" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({ ...paymentForm, status: v })}>
                <SelectTrigger data-testid="select-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="payment-add-history"
                data-testid="checkbox-payment-history"
                checked={paymentForm.addToHistory}
                onChange={(e) => setPaymentForm({ ...paymentForm, addToHistory: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="payment-add-history" className="text-sm">Añadir a historial</label>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-confirm-payment"
              onClick={() => paymentMutation.mutate(paymentForm)}
              disabled={paymentMutation.isPending || !paymentForm.concept}
            >
              {paymentMutation.isPending ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Document Upload Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
            <DialogDescription>Registra un nuevo documento para esta propiedad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Tipo de documento</label>
              <Select value={documentForm.documentType} onValueChange={(v) => setDocumentForm({ ...documentForm, documentType: v })}>
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Nombre del archivo</label>
              <Input data-testid="input-document-filename" value={documentForm.fileName} onChange={(e) => setDocumentForm({ ...documentForm, fileName: e.target.value })} placeholder="documento.pdf" />
            </div>
            <p className="text-xs text-gray-400">La integración de subida de archivos se añadirá próximamente.</p>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-confirm-document"
              onClick={() => documentMutation.mutate(documentForm)}
              disabled={documentMutation.isPending || !documentForm.documentType || !documentForm.fileName}
            >
              {documentMutation.isPending ? "Guardando..." : "Registrar documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Incident Dialog */}
      <Dialog open={incidentDialogOpen} onOpenChange={(open) => { setIncidentDialogOpen(open); if (!open) setEditingIncident(null); }}>
        <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIncident ? "Editar incidencia" : "Nueva incidencia"}</DialogTitle>
            <DialogDescription>
              {editingIncident ? "Modifica los datos de la incidencia" : "Registra una nueva incidencia"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                data-testid="input-incident-title"
                maxLength={50}
                value={incidentForm.title}
                onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                placeholder="Título de la incidencia"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={incidentForm.status} onValueChange={(v) => setIncidentForm({ ...incidentForm, status: v })}>
                <SelectTrigger data-testid="select-incident-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Nueva", "Asignada", "En espera", "Resuelta", "Verificada", "Cerrada"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Prioridad</label>
              <Select value={incidentForm.priority} onValueChange={(v) => setIncidentForm({ ...incidentForm, priority: v })}>
                <SelectTrigger data-testid="select-incident-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Alta", "Media", "Baja"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                data-testid="textarea-incident-description"
                maxLength={500}
                value={incidentForm.description}
                onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                placeholder="Describe la incidencia..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-confirm-incident"
              onClick={() => incidentMutation.mutate({ ...incidentForm, id: editingIncident?.id })}
              disabled={incidentMutation.isPending || !incidentForm.title}
            >
              {incidentMutation.isPending ? "Guardando..." : editingIncident ? "Guardar cambios" : "Registrar incidencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Communication Dialog */}
      <Dialog open={communicationDialogOpen} onOpenChange={setCommunicationDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva comunicación</DialogTitle>
            <DialogDescription>Registra una nueva comunicación</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                data-testid="input-communication-title"
                maxLength={50}
                value={communicationForm.title}
                onChange={(e) => setCommunicationForm({ ...communicationForm, title: e.target.value })}
                placeholder="Título de la comunicación"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de comunicación</label>
              <Select value={communicationForm.communicationType} onValueChange={(v) => setCommunicationForm({ ...communicationForm, communicationType: v })}>
                <SelectTrigger data-testid="select-communication-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fecha relevante</label>
              <Input
                data-testid="input-communication-date"
                type="date"
                value={communicationForm.relevantDate}
                onChange={(e) => setCommunicationForm({ ...communicationForm, relevantDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="comm-add-calendar"
                data-testid="checkbox-communication-calendar"
                checked={communicationForm.addToCalendar}
                onChange={(e) => setCommunicationForm({ ...communicationForm, addToCalendar: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="comm-add-calendar" className="text-sm">Añadir a calendario</label>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                data-testid="textarea-communication-description"
                value={communicationForm.description}
                onChange={(e) => setCommunicationForm({ ...communicationForm, description: e.target.value })}
                placeholder="Descripción (opcional)"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="comm-add-history"
                data-testid="checkbox-communication-history"
                checked={communicationForm.addToHistory}
                onChange={(e) => setCommunicationForm({ ...communicationForm, addToHistory: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="comm-add-history" className="text-sm">Añadir a historial</label>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-confirm-communication"
              onClick={() => communicationMutation.mutate(communicationForm)}
              disabled={communicationMutation.isPending || !communicationForm.title || !communicationForm.communicationType || !communicationForm.relevantDate}
            >
              {communicationMutation.isPending ? "Guardando..." : "Registrar comunicación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
