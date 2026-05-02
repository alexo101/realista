import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Plus,
  Loader2,
  Check,
  X,
  Plane,
  Home,
  Stethoscope,
  CalendarOff,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import type { AbsenceRequest, AbsenceReason, AbsenceStatus } from "@shared/schema";
import type { DateRange } from "react-day-picker";

interface AgentLite {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
}

interface TeamRequestRow {
  request: AbsenceRequest;
  agent: AgentLite;
}

const REASON_META: Record<
  AbsenceReason,
  { label: string; caption: string; className: string; chipClass: string; Icon: typeof Plane }
> = {
  vacaciones: {
    label: "Vacaciones",
    caption: "Días de descanso aprobados fuera del calendario laboral.",
    className:
      "bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 rounded-md",
    chipClass: "bg-blue-50 text-blue-700 border-blue-300",
    Icon: Plane,
  },
  remoto: {
    label: "Remoto",
    caption: "Jornada en modalidad de teletrabajo.",
    className:
      "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 rounded-md",
    chipClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
    Icon: Home,
  },
  baja_laboral: {
    label: "Baja laboral",
    caption: "Ausencia justificada por motivos médicos o legales.",
    className:
      "bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200 rounded-md",
    chipClass: "bg-rose-50 text-rose-700 border-rose-300",
    Icon: Stethoscope,
  },
};

const STATUS_META: Record<AbsenceStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-amber-50 text-amber-700 border-amber-300" },
  approved: { label: "Aprobada", className: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  rejected: { label: "Rechazada", className: "bg-rose-50 text-rose-700 border-rose-300" },
};

function formatDateLong(iso: string): string {
  const d = parseISO(iso);
  return format(d, "d MMM yyyy", { locale: es });
}

function fullName(agent: AgentLite): string {
  return [agent.name, agent.surname].filter(Boolean).join(" ") || agent.email;
}

function expandRange(startISO: string, endISO: string): Date[] {
  return eachDayOfInterval({ start: parseISO(startISO), end: parseISO(endISO) });
}

function monthRange(refDate: Date): { from: string; to: string } {
  const start = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const end = new Date(refDate.getFullYear(), refDate.getMonth() + 2, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: fmt(start), to: fmt(end) };
}

function errorText(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message.replace(/^\d+:\s*/, "");
  }
  return fallback;
}

export function ControlAusencias() {
  const { user } = useUser();
  const isAdmin = Boolean(user?.isAdmin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Control de ausencias</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Consulta el calendario del equipo, solicita ausencias{isAdmin ? " y aprueba o rechaza las solicitudes pendientes" : ""}.
        </p>
      </div>

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="calendario" data-testid="tab-calendario-equipo">
            Calendario de equipo
          </TabsTrigger>
          <TabsTrigger value="nueva" data-testid="tab-nueva-solicitud">
            Nueva solicitud
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="aprobaciones" data-testid="tab-aprobaciones">
              Aprobaciones
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="calendario" className="mt-6">
          <TeamCalendarTab />
        </TabsContent>

        <TabsContent value="nueva" className="mt-6">
          <NewRequestTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="aprobaciones" className="mt-6">
            <ApprovalsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// -------------------- Calendario de equipo --------------------
function TeamCalendarTab() {
  const [month, setMonth] = useState<Date>(new Date());
  const range = useMemo(() => monthRange(month), [month]);

  const { data, isLoading } = useQuery<{ rows: TeamRequestRow[] }>({
    queryKey: ["/api/absence-requests/team/calendar", range.from, range.to],
    queryFn: () =>
      fetch(
        `/api/absence-requests/team/calendar?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
        { credentials: "include" },
      ).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch team calendar");
        return res.json();
      }),
  });

  const rows = data?.rows ?? [];

  // Build modifiers per reason and a per-day index for tooltips
  const { modifiers, dayInfo } = useMemo(() => {
    const buckets: Record<AbsenceReason, Date[]> = {
      vacaciones: [],
      remoto: [],
      baja_laboral: [],
    };
    const info = new Map<string, Array<{ name: string; reason: AbsenceReason }>>();
    for (const row of rows) {
      const reason = row.request.reason as AbsenceReason;
      const days = expandRange(row.request.startDate, row.request.endDate);
      for (const d of days) {
        buckets[reason].push(d);
        const key = format(d, "yyyy-MM-dd");
        const list = info.get(key) ?? [];
        list.push({ name: fullName(row.agent), reason });
        info.set(key, list);
      }
    }
    return { modifiers: buckets, dayInfo: info };
  }, [rows]);

  const modifiersClassNames: Record<string, string> = {
    vacaciones: REASON_META.vacaciones.className,
    remoto: REASON_META.remoto.className,
    baja_laboral: REASON_META.baja_laboral.className,
  };

  return (
    <Card data-testid="card-calendario-equipo">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Calendario del equipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                month={month}
                onMonthChange={setMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                components={{
                  DayContent: ({ date }) => {
                    const key = format(date, "yyyy-MM-dd");
                    const items = dayInfo.get(key);
                    const title = items
                      ? items.map((i) => `${i.name} — ${REASON_META[i.reason].label}`).join("\n")
                      : undefined;
                    return (
                      <span title={title} data-testid={`calendar-day-${key}`}>
                        {date.getDate()}
                      </span>
                    );
                  },
                }}
              />
            </div>
            <Legend />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Legend() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {(Object.keys(REASON_META) as AbsenceReason[]).map((reason) => {
        const meta = REASON_META[reason];
        const Icon = meta.Icon;
        return (
          <div
            key={reason}
            className="flex items-start gap-3 p-3 rounded-lg border"
            data-testid={`legend-${reason}`}
          >
            <div className={`h-8 w-8 rounded-md flex items-center justify-center ${meta.className}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">{meta.label}</p>
              <p className="text-xs text-muted-foreground">{meta.caption}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------- Nueva solicitud --------------------
function NewRequestTab() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ rows: AbsenceRequest[] }>({
    queryKey: ["/api/absence-requests/mine"],
  });

  const requests = data?.rows ?? [];

  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/absence-requests/${id}`),
    onSuccess: () => {
      toast({ title: "Solicitud cancelada" });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/team/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/team/pending"] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: errorText(err, "No se pudo cancelar la solicitud"),
        variant: "destructive",
      });
    },
  });

  // Build modifiers per reason for own requests
  const { modifiers, dayInfo } = useMemo(() => {
    const buckets: Record<AbsenceReason, Date[]> = {
      vacaciones: [],
      remoto: [],
      baja_laboral: [],
    };
    const info = new Map<string, Array<{ reason: AbsenceReason; status: AbsenceStatus }>>();
    for (const r of requests) {
      const reason = r.reason as AbsenceReason;
      const status = r.status as AbsenceStatus;
      const days = expandRange(r.startDate, r.endDate);
      for (const d of days) {
        buckets[reason].push(d);
        const key = format(d, "yyyy-MM-dd");
        const list = info.get(key) ?? [];
        list.push({ reason, status });
        info.set(key, list);
      }
    }
    return { modifiers: buckets, dayInfo: info };
  }, [requests]);

  const modifiersClassNames: Record<string, string> = {
    vacaciones: REASON_META.vacaciones.className,
    remoto: REASON_META.remoto.className,
    baja_laboral: REASON_META.baja_laboral.className,
  };

  return (
    <Card data-testid="card-nueva-solicitud">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Mi calendario
        </CardTitle>
        <Button onClick={() => setOpen(true)} data-testid="button-open-new-request">
          <Plus className="h-4 w-4 mr-2" />
          Nueva solicitud
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                month={month}
                onMonthChange={setMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                components={{
                  DayContent: ({ date }) => {
                    const key = format(date, "yyyy-MM-dd");
                    const items = dayInfo.get(key);
                    const title = items
                      ? items
                          .map((i) => `${REASON_META[i.reason].label} (${STATUS_META[i.status].label})`)
                          .join("\n")
                      : undefined;
                    return (
                      <span title={title} data-testid={`mine-calendar-day-${key}`}>
                        {date.getDate()}
                      </span>
                    );
                  },
                }}
              />
            </div>

            <Legend />

            {/* List of own requests */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Mis solicitudes</h3>
              {requests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Aún no has creado ninguna solicitud.
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map((r) => {
                    const reason = r.reason as AbsenceReason;
                    const status = r.status as AbsenceStatus;
                    const meta = REASON_META[reason];
                    const Icon = meta.Icon;
                    const isCancelling =
                      cancelMutation.isPending && cancelMutation.variables === r.id;
                    return (
                      <div
                        key={r.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg"
                        data-testid={`row-mine-request-${r.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-md flex items-center justify-center ${meta.className}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{meta.label}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {formatDateLong(r.startDate)} – {formatDateLong(r.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={STATUS_META[status].className}>
                            {STATUS_META[status].label}
                          </Badge>
                          {status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelMutation.mutate(r.id)}
                              disabled={isCancelling}
                              data-testid={`button-cancel-mine-request-${r.id}`}
                            >
                              {isCancelling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Cancelar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <NewRequestDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          toast({ title: "Solicitud creada", description: "Tu solicitud queda pendiente de aprobación." });
          queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/mine"] });
          queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/team/calendar"] });
          queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/team/pending"] });
        }}
      />
    </Card>
  );
}

function NewRequestDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState<AbsenceReason | "">("");
  const { toast } = useToast();

  const reset = () => {
    setRange(undefined);
    setReason("");
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!range?.from || !range?.to || !reason) {
        throw new Error("Debes seleccionar fechas y un motivo");
      }
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return apiRequest("POST", "/api/absence-requests", {
        startDate: fmt(range.from),
        endDate: fmt(range.to),
        reason,
      });
    },
    onSuccess: () => {
      reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: errorText(err, "No se pudo crear la solicitud"),
        variant: "destructive",
      });
    },
  });

  const canSubmit = Boolean(range?.from && range?.to && reason) && !submitMutation.isPending;
  const dayCount =
    range?.from && range?.to
      ? eachDayOfInterval({ start: range.from, end: range.to }).length
      : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva solicitud de ausencia</DialogTitle>
          <DialogDescription>
            Selecciona el rango de fechas y el motivo. La solicitud quedará pendiente de aprobación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={1}
              data-testid="calendar-range-picker"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo</label>
            <Select value={reason} onValueChange={(v) => setReason(v as AbsenceReason)}>
              <SelectTrigger data-testid="select-reason">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REASON_META) as AbsenceReason[]).map((r) => (
                  <SelectItem key={r} value={r} data-testid={`select-reason-${r}`}>
                    {REASON_META[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {range?.from && range?.to && (
            <p className="text-sm text-muted-foreground" data-testid="text-range-summary">
              {dayCount} {dayCount === 1 ? "día" : "días"} —{" "}
              {format(range.from, "d MMM", { locale: es })} a {format(range.to, "d MMM yyyy", { locale: es })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-request">
            Cancelar
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit}
            data-testid="button-confirm-request"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirmar solicitud"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------- Aprobaciones (admin) --------------------
function ApprovalsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ rows: TeamRequestRow[] }>({
    queryKey: ["/api/absence-requests/team/pending"],
  });

  const rows = data?.rows ?? [];

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AbsenceStatus }) =>
      apiRequest("PATCH", `/api/absence-requests/${id}`, { status }),
    onSuccess: (_data, vars) => {
      toast({
        title: vars.status === "approved" ? "Solicitud aprobada" : "Solicitud rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/team/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/team/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-requests/mine"] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: errorText(err, "No se pudo procesar la solicitud"),
        variant: "destructive",
      });
    },
  });

  return (
    <Card data-testid="card-aprobaciones">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          Solicitudes pendientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CalendarOff className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const reason = row.request.reason as AbsenceReason;
              const meta = REASON_META[reason];
              const Icon = meta.Icon;
              const isPending = reviewMutation.isPending && reviewMutation.variables?.id === row.request.id;
              return (
                <div
                  key={row.request.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border rounded-lg"
                  data-testid={`row-pending-${row.request.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`h-10 w-10 rounded-md flex items-center justify-center ${meta.className}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{fullName(row.agent)}</p>
                      <p className="text-sm text-muted-foreground">
                        {meta.label} ·{" "}
                        <span className="tabular-nums">
                          {formatDateLong(row.request.startDate)} – {formatDateLong(row.request.endDate)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reviewMutation.mutate({ id: row.request.id, status: "rejected" })}
                      disabled={isPending}
                      data-testid={`button-reject-${row.request.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => reviewMutation.mutate({ id: row.request.id, status: "approved" })}
                      disabled={isPending}
                      data-testid={`button-approve-${row.request.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
