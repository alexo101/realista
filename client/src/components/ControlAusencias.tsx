import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  parseISO,
  eachDayOfInterval,
  addDays,
  startOfWeek,
  isSameDay,
  isWeekend,
} from "date-fns";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import type { AbsenceRequest, AbsenceReason, AbsenceStatus } from "@shared/schema";

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
  {
    label: string;
    caption: string;
    className: string;
    chipClass: string;
    cellClass: string;
    dotClass: string;
    Icon: typeof Plane;
  }
> = {
  vacaciones: {
    label: "Vacaciones",
    caption: "Días de descanso aprobados fuera del calendario laboral.",
    className:
      "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 rounded-md",
    chipClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
    cellClass: "bg-emerald-500",
    dotClass: "bg-emerald-500",
    Icon: Plane,
  },
  remoto: {
    label: "Remoto",
    caption: "Jornada en modalidad de teletrabajo.",
    className:
      "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 rounded-md",
    chipClass: "bg-amber-50 text-amber-700 border-amber-300",
    cellClass: "bg-amber-500",
    dotClass: "bg-amber-500",
    Icon: Home,
  },
  baja_laboral: {
    label: "Baja laboral",
    caption: "Ausencia justificada por motivos médicos o legales.",
    className:
      "bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200 rounded-md",
    chipClass: "bg-rose-50 text-rose-700 border-rose-300",
    cellClass: "bg-rose-500",
    dotClass: "bg-rose-500",
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

// -------------------- Calendario de equipo (Gantt-style) --------------------
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function TeamCalendarTab() {
  // Anchor = Monday of the first visible week. Default = current week.
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Show ~4 weeks (28 days) starting from the anchor.
  const VISIBLE_DAYS = 28;
  const days = useMemo(
    () => eachDayOfInterval({ start: anchor, end: addDays(anchor, VISIBLE_DAYS - 1) }),
    [anchor],
  );

  const range = useMemo(
    () => ({ from: fmtDate(days[0]), to: fmtDate(days[days.length - 1]) }),
    [days],
  );

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

  // Build per-agent map of date -> reason
  const { agents, byAgentDay } = useMemo(() => {
    const agentMap = new Map<number, AgentLite>();
    const cells = new Map<number, Map<string, AbsenceReason>>();
    for (const row of rows) {
      agentMap.set(row.agent.id, row.agent);
      const reason = row.request.reason as AbsenceReason;
      const ds = expandRange(row.request.startDate, row.request.endDate);
      const inner = cells.get(row.agent.id) ?? new Map<string, AbsenceReason>();
      for (const d of ds) {
        inner.set(fmtDate(d), reason);
      }
      cells.set(row.agent.id, inner);
    }
    const list = Array.from(agentMap.values()).sort((a, b) =>
      fullName(a).localeCompare(fullName(b), "es"),
    );
    return { agents: list, byAgentDay: cells };
  }, [rows]);

  const today = useMemo(() => new Date(), []);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // When "Hoy" is in view, scroll to it
  useEffect(() => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current.querySelector<HTMLElement>("[data-today='true']");
    if (el) {
      el.scrollIntoView({ behavior: "auto", inline: "start", block: "nearest" });
    }
  }, [anchor]);

  const goPrev = () => setAnchor((a) => addDays(a, -7));
  const goNext = () => setAnchor((a) => addDays(a, 7));
  const goToday = () => setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <Card data-testid="card-calendario-equipo">
      <CardContent className="p-4 md:p-6">
        {/* Header: nav + Hoy + legend */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              data-testid="button-calendar-prev"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goNext}
              data-testid="button-calendar-next"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={goToday}
              className="font-medium"
              data-testid="button-calendar-today"
            >
              Hoy
            </Button>
          </div>
          <InlineLegend />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div
            ref={scrollerRef}
            className="overflow-x-auto border rounded-md"
            data-testid="team-calendar-grid"
          >
            <table className="border-collapse">
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-10 bg-muted/60 border-b border-r text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 min-w-[180px]"
                  >
                    Equipo
                  </th>
                  {days.map((d) => {
                    const isToday = isSameDay(d, today);
                    const weekend = isWeekend(d);
                    const showMonth = d.getDate() === 1 || d === days[0];
                    return (
                      <th
                        key={fmtDate(d)}
                        data-today={isToday ? "true" : undefined}
                        className={`border-b border-r text-[10px] uppercase tracking-wide font-medium px-1 py-1 text-center align-bottom min-w-[40px] ${
                          isToday
                            ? "bg-primary/10 text-primary"
                            : weekend
                            ? "bg-muted/40 text-muted-foreground"
                            : "bg-background text-muted-foreground"
                        }`}
                      >
                        <div>{format(d, "EEE", { locale: es }).slice(0, 3)}</div>
                        <div className="text-sm font-semibold text-foreground">
                          {d.getDate()}
                        </div>
                        {showMonth && (
                          <div className="text-[9px] text-muted-foreground">
                            {format(d, "MMM", { locale: es })}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={days.length + 1}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      No hay ausencias aprobadas en este rango.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => {
                    const cellsForAgent = byAgentDay.get(agent.id);
                    return (
                      <tr key={agent.id} data-testid={`row-team-agent-${agent.id}`}>
                        <td className="sticky left-0 z-10 bg-background border-b border-r px-3 py-2 text-sm font-medium whitespace-nowrap">
                          {fullName(agent)}
                        </td>
                        {days.map((d) => {
                          const key = fmtDate(d);
                          const reason = cellsForAgent?.get(key);
                          const isToday = isSameDay(d, today);
                          const weekend = isWeekend(d);
                          return (
                            <td
                              key={key}
                              className={`border-b border-r p-1 text-center ${
                                isToday
                                  ? "bg-primary/5"
                                  : weekend
                                  ? "bg-muted/20"
                                  : ""
                              }`}
                              data-testid={`cell-${agent.id}-${key}`}
                            >
                              {reason && (
                                <div
                                  className={`mx-auto h-6 w-6 rounded-md ${REASON_META[reason].cellClass}`}
                                  title={`${fullName(agent)} — ${REASON_META[reason].label}`}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InlineLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(Object.keys(REASON_META) as AbsenceReason[]).map((reason) => {
        const meta = REASON_META[reason];
        return (
          <div key={reason} className="flex items-center gap-2" data-testid={`inline-legend-${reason}`}>
            <span className={`h-3 w-3 rounded ${meta.dotClass}`} />
            <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
          </div>
        );
      })}
    </div>
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
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
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Se eliminará tu solicitud de {REASON_META[reason].label.toLowerCase()} del{" "}
                                    {formatDateLong(r.startDate)} al {formatDateLong(r.endDate)}. Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-testid={`button-cancel-cancel-${r.id}`}>
                                    Volver
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelMutation.mutate(r.id)}
                                    data-testid={`button-confirm-cancel-${r.id}`}
                                  >
                                    Sí, cancelar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

/** Group a sorted list of dates into contiguous ranges. */
function groupConsecutiveDays(dates: Date[]): Array<{ from: Date; to: Date }> {
  if (dates.length === 0) return [];
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const groups: Array<{ from: Date; to: Date }> = [];
  let from = sorted[0];
  let to = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const diffMs = cur.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / 86_400_000);
    if (diffDays === 1) {
      to = cur;
    } else {
      groups.push({ from, to });
      from = cur;
      to = cur;
    }
  }
  groups.push({ from, to });
  return groups;
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
  const [days, setDays] = useState<Date[]>([]);
  const [reason, setReason] = useState<AbsenceReason | "">("");
  const { toast } = useToast();

  const reset = () => {
    setDays([]);
    setReason("");
  };

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (days.length === 0 || !reason) {
        throw new Error("Debes seleccionar al menos una fecha y un motivo");
      }
      const groups = groupConsecutiveDays(days);
      for (const g of groups) {
        await apiRequest("POST", "/api/absence-requests", {
          startDate: fmt(g.from),
          endDate: fmt(g.to),
          reason,
        });
      }
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

  const canSubmit = days.length > 0 && Boolean(reason) && !submitMutation.isPending;
  const dayCount = days.length;
  const groups = groupConsecutiveDays(days);

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
            Haz clic en días sueltos o en varios días consecutivos. La solicitud quedará pendiente de aprobación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={days}
              onSelect={(val) => setDays(val ?? [])}
              numberOfMonths={1}
              locale={es}
              disabled={{ before: new Date() }}
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

          {dayCount > 0 && (
            <div className="text-sm text-muted-foreground space-y-0.5" data-testid="text-range-summary">
              <p>{dayCount} {dayCount === 1 ? "día seleccionado" : "días seleccionados"}</p>
              {groups.map((g, i) => (
                <p key={i} className="tabular-nums">
                  {isSameDay(g.from, g.to)
                    ? format(g.from, "d MMM yyyy", { locale: es })
                    : `${format(g.from, "d MMM", { locale: es })} – ${format(g.to, "d MMM yyyy", { locale: es })}`}
                </p>
              ))}
            </div>
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
