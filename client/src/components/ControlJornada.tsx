import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, LogIn, LogOut, Pause, Play, Coffee, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import type { WorkSession, WorkBreak } from "@shared/schema";

interface TodayResponse {
  session: WorkSession | null;
  today: string;
}

interface TeamRow {
  agent: { id: number; name: string | null; surname: string | null; email: string };
  session: WorkSession | null;
}

interface TeamResponse {
  workDate: string;
  rows: TeamRow[];
}

type SessionState = "idle" | "working" | "on_break" | "finished";

function getSessionState(session: WorkSession | null): SessionState {
  if (!session) return "idle";
  if (session.clockOutAt) return "finished";
  const breaks = (session.breaks ?? []) as WorkBreak[];
  if (breaks.some((b) => b.endAt === null)) return "on_break";
  return "working";
}

function stateLabel(state: SessionState): string {
  switch (state) {
    case "idle":
      return "Sin iniciar";
    case "working":
      return "Trabajando";
    case "on_break":
      return "En pausa";
    case "finished":
      return "Jornada finalizada";
  }
}

function stateBadgeClass(state: SessionState): string {
  switch (state) {
    case "idle":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "working":
      return "bg-green-50 text-green-700 border-green-300";
    case "on_break":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "finished":
      return "bg-blue-50 text-blue-700 border-blue-300";
  }
}

// Compute worked milliseconds (excluding breaks). If still working/on break,
// uses `now` as the upper bound; if finished, uses clockOutAt.
function computeWorkedMs(session: WorkSession | null, nowMs: number): number {
  if (!session) return 0;
  const start = new Date(session.clockInAt).getTime();
  const end = session.clockOutAt ? new Date(session.clockOutAt).getTime() : nowMs;
  if (end <= start) return 0;
  let breakMs = 0;
  const breaks = (session.breaks ?? []) as WorkBreak[];
  for (const b of breaks) {
    const bStart = new Date(b.startAt).getTime();
    const bEnd = b.endAt ? new Date(b.endAt).getTime() : end;
    if (bEnd > bStart) breakMs += Math.min(bEnd, end) - Math.max(bStart, start);
  }
  return Math.max(0, end - start - breakMs);
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(isoOrNull: string | Date | null | undefined): string {
  if (!isoOrNull) return "—";
  const d = typeof isoOrNull === "string" ? new Date(isoOrNull) : isoOrNull;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "HH:mm");
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ControlJornada() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [now, setNow] = useState<Date>(new Date());

  // Live clock - updates every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading } = useQuery<TodayResponse>({
    queryKey: ["/api/work-sessions/today"],
    enabled: Boolean(user?.id),
  });

  const session = data?.session ?? null;
  const state = getSessionState(session);

  const workedMs = useMemo(() => computeWorkedMs(session, now.getTime()), [session, now]);

  const callAction = async (path: string) => {
    return apiRequest("POST", path, {});
  };

  const handleError = (error: unknown, fallback: string) => {
    toast({
      title: "Error",
      description: (error as Error)?.message?.replace(/^\d+:\s*/, "") || fallback,
      variant: "destructive",
    });
  };

  const clockInMutation = useMutation({
    mutationFn: () => callAction("/api/work-sessions/clock-in"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/work-sessions/today"] });
      const previous = queryClient.getQueryData<TodayResponse>(["/api/work-sessions/today"]);
      const optimistic: WorkSession = {
        id: -1,
        agentId: user!.id,
        workDate: todayLocal(),
        clockInAt: new Date(),
        clockOutAt: null,
        breaks: [],
        createdAt: new Date(),
      };
      queryClient.setQueryData<TodayResponse>(["/api/work-sessions/today"], {
        session: optimistic,
        today: todayLocal(),
      });
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["/api/work-sessions/today"], ctx.previous);
      handleError(err, "No se pudo fichar la entrada");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/team"] });
    },
  });

  const breakStartMutation = useMutation({
    mutationFn: () => callAction("/api/work-sessions/break-start"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/work-sessions/today"] });
      const previous = queryClient.getQueryData<TodayResponse>(["/api/work-sessions/today"]);
      if (previous?.session) {
        const updated: WorkSession = {
          ...previous.session,
          breaks: [
            ...((previous.session.breaks ?? []) as WorkBreak[]),
            { startAt: new Date().toISOString(), endAt: null },
          ],
        };
        queryClient.setQueryData<TodayResponse>(["/api/work-sessions/today"], {
          ...previous,
          session: updated,
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["/api/work-sessions/today"], ctx.previous);
      handleError(err, "No se pudo iniciar la pausa");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/team"] });
    },
  });

  const breakEndMutation = useMutation({
    mutationFn: () => callAction("/api/work-sessions/break-end"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/work-sessions/today"] });
      const previous = queryClient.getQueryData<TodayResponse>(["/api/work-sessions/today"]);
      if (previous?.session) {
        const breaks = (previous.session.breaks ?? []) as WorkBreak[];
        const idx = breaks.findIndex((b) => b.endAt === null);
        if (idx !== -1) {
          const updatedBreaks = breaks.map((b, i) =>
            i === idx ? { startAt: b.startAt, endAt: new Date().toISOString() } : b,
          );
          queryClient.setQueryData<TodayResponse>(["/api/work-sessions/today"], {
            ...previous,
            session: { ...previous.session, breaks: updatedBreaks },
          });
        }
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["/api/work-sessions/today"], ctx.previous);
      handleError(err, "No se pudo finalizar la pausa");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/team"] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => callAction("/api/work-sessions/clock-out"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/work-sessions/today"] });
      const previous = queryClient.getQueryData<TodayResponse>(["/api/work-sessions/today"]);
      if (previous?.session) {
        const nowIso = new Date().toISOString();
        const breaks = ((previous.session.breaks ?? []) as WorkBreak[]).map((b) =>
          b.endAt === null ? { startAt: b.startAt, endAt: nowIso } : b,
        );
        queryClient.setQueryData<TodayResponse>(["/api/work-sessions/today"], {
          ...previous,
          session: { ...previous.session, clockOutAt: new Date(), breaks },
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["/api/work-sessions/today"], ctx.previous);
      handleError(err, "No se pudo fichar la salida");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/team"] });
    },
  });

  const isMutating =
    clockInMutation.isPending ||
    breakStartMutation.isPending ||
    breakEndMutation.isPending ||
    clockOutMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Control de jornada</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Registra tu entrada, pausas y salida del día.
        </p>
      </div>

      {/* Personal card */}
      <Card data-testid="card-control-jornada-personal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mi jornada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Date + live clock */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p
                    className="text-5xl md:text-6xl font-bold tabular-nums tracking-tight"
                    data-testid="text-live-clock"
                  >
                    {format(now, "HH:mm")}
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <Badge
                    variant="outline"
                    className={stateBadgeClass(state)}
                    data-testid="badge-jornada-state"
                  >
                    {stateLabel(state)}
                  </Badge>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Tiempo trabajado</p>
                    <p
                      className="text-2xl font-semibold tabular-nums"
                      data-testid="text-elapsed-time"
                    >
                      {formatDuration(workedMs)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Times summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Entrada</p>
                  <p className="font-medium tabular-nums" data-testid="text-clock-in">
                    {formatTime(session?.clockInAt)}
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Pausas</p>
                  <p className="font-medium" data-testid="text-breaks-count">
                    {((session?.breaks ?? []) as WorkBreak[]).length || 0}
                  </p>
                </div>
                <div className="border rounded-lg p-3 col-span-2 md:col-span-1">
                  <p className="text-muted-foreground text-xs">Salida</p>
                  <p className="font-medium tabular-nums" data-testid="text-clock-out">
                    {formatTime(session?.clockOutAt)}
                  </p>
                </div>
              </div>

              {/* Breaks list */}
              {(session?.breaks ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Pausas del día</p>
                  <div className="space-y-1">
                    {((session?.breaks ?? []) as WorkBreak[]).map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm tabular-nums"
                        data-testid={`row-break-${idx}`}
                      >
                        <Coffee className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>{formatTime(b.startAt)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{b.endAt ? formatTime(b.endAt) : "en curso"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {state === "idle" && (
                  <Button
                    size="lg"
                    onClick={() => clockInMutation.mutate()}
                    disabled={isMutating}
                    data-testid="button-clock-in"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Fichar Entrada
                  </Button>
                )}
                {state === "working" && (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => breakStartMutation.mutate()}
                      disabled={isMutating}
                      data-testid="button-break-start"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Inicio Pausa
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => clockOutMutation.mutate()}
                      disabled={isMutating}
                      data-testid="button-clock-out"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Fichar Salida
                    </Button>
                  </>
                )}
                {state === "on_break" && (
                  <>
                    <Button
                      size="lg"
                      onClick={() => breakEndMutation.mutate()}
                      disabled={isMutating}
                      data-testid="button-break-end"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Fin Pausa
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => clockOutMutation.mutate()}
                      disabled={isMutating}
                      data-testid="button-clock-out"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Fichar Salida
                    </Button>
                  </>
                )}
                {state === "finished" && (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="text-finished-message"
                  >
                    Has finalizado tu jornada de hoy. ¡Hasta mañana!
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team table for admins */}
      {user?.isAdmin && <TeamJornadaCard />}
    </div>
  );
}

interface AgentBasic {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
}

interface HistoryResponse {
  rows: WorkSession[];
  total: number;
  page: number;
  pageSize: number;
}

function agentFullName(agent: AgentBasic): string {
  return [agent.name, agent.surname].filter(Boolean).join(" ") || agent.email;
}

const PAGE_SIZE = 10;

function TeamJornadaCard() {
  const [date, setDate] = useState<string>(todayLocal());
  const [now, setNow] = useState<Date>(new Date());
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  // Live clock for in-progress workers (recompute totals every minute)
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Date-based team view (no employee filter)
  const { data: teamData, isLoading: teamLoading } = useQuery<TeamResponse>({
    queryKey: ["/api/work-sessions/team", date],
    queryFn: () =>
      fetch(`/api/work-sessions/team?date=${encodeURIComponent(date)}`, {
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch team sessions");
        return res.json();
      }),
    enabled: selectedAgentId === null,
  });

  // Paginated history for a specific employee
  const { data: historyData, isLoading: historyLoading } = useQuery<HistoryResponse>({
    queryKey: ["/api/work-sessions/history", selectedAgentId, historyPage],
    queryFn: () =>
      fetch(
        `/api/work-sessions/history?agentId=${selectedAgentId}&page=${historyPage}&pageSize=${PAGE_SIZE}`,
        { credentials: "include" },
      ).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
      }),
    enabled: selectedAgentId !== null,
  });

  const teamRows = teamData?.rows ?? [];
  const historyRows = historyData?.rows ?? [];
  const totalPages = historyData ? Math.ceil(historyData.total / PAGE_SIZE) : 0;

  // Derive agent list from team data (all active members, even those with no session today)
  const allAgents = useMemo(() => {
    const seen = new Set<number>();
    const list: AgentBasic[] = [];
    for (const row of teamRows) {
      if (!seen.has(row.agent.id)) {
        seen.add(row.agent.id);
        list.push(row.agent);
      }
    }
    return list.sort((a, b) =>
      agentFullName(a).localeCompare(agentFullName(b), "es"),
    );
  }, [teamRows]);

  const handleAgentChange = (value: string) => {
    if (value === "__all__") {
      setSelectedAgentId(null);
    } else {
      setSelectedAgentId(parseInt(value, 10));
      setHistoryPage(1);
    }
  };

  const selectedAgent = allAgents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <Card data-testid="card-control-jornada-equipo">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <CardTitle className="flex items-center gap-2 shrink-0">
            <Users className="h-5 w-5" />
            Equipo
          </CardTitle>

          {/* Employee filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Empleado:</label>
            <Select
              value={selectedAgentId !== null ? String(selectedAgentId) : "__all__"}
              onValueChange={handleAgentChange}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-employee-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los empleados</SelectItem>
                {allAgents.map((agent) => (
                  <SelectItem key={agent.id} value={String(agent.id)}>
                    {agentFullName(agent)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date filter — only visible when no employee is selected */}
          {selectedAgentId === null && (
            <div className="flex items-center gap-2">
              <label htmlFor="team-date" className="text-sm text-muted-foreground whitespace-nowrap">
                Fecha:
              </label>
              <Input
                id="team-date"
                type="date"
                value={date}
                max={todayLocal()}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
                data-testid="input-team-date"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* ── Paginated employee history ── */}
        {selectedAgentId !== null ? (
          historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historyRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Este empleado no tiene jornadas registradas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Pausas</TableHead>
                      <TableHead>Salida</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Tiempo trabajado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRows.map((session) => {
                      const state = getSessionState(session);
                      const worked = computeWorkedMs(session, now.getTime());
                      const breaks = (session.breaks ?? []) as WorkBreak[];
                      return (
                        <TableRow key={session.id} data-testid={`row-history-${session.id}`}>
                          <TableCell className="font-medium tabular-nums">
                            {format(new Date(session.workDate + "T00:00:00"), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatTime(session.clockInAt)}
                          </TableCell>
                          <TableCell>
                            {breaks.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-col gap-0.5 text-xs tabular-nums">
                                {breaks.map((b, i) => (
                                  <span key={i}>
                                    {formatTime(b.startAt)} – {b.endAt ? formatTime(b.endAt) : "en curso"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatTime(session.clockOutAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={stateBadgeClass(state)}>
                              {stateLabel(state)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatDuration(worked)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="block md:hidden space-y-3">
                {historyRows.map((session) => {
                  const state = getSessionState(session);
                  const worked = computeWorkedMs(session, now.getTime());
                  const breaks = (session.breaks ?? []) as WorkBreak[];
                  return (
                    <div
                      key={session.id}
                      className="border rounded-lg p-4 space-y-2"
                      data-testid={`card-history-${session.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold tabular-nums">
                          {format(new Date(session.workDate + "T00:00:00"), "dd MMM yyyy", { locale: es })}
                        </p>
                        <Badge variant="outline" className={stateBadgeClass(state)}>
                          {stateLabel(state)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Entrada</p>
                          <p className="tabular-nums">{formatTime(session.clockInAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Salida</p>
                          <p className="tabular-nums">{formatTime(session.clockOutAt)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Tiempo trabajado</p>
                          <p className="tabular-nums font-medium">{formatDuration(worked)}</p>
                        </div>
                      </div>
                      {breaks.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Pausas</p>
                          <div className="text-xs tabular-nums space-y-0.5">
                            {breaks.map((b, i) => (
                              <p key={i}>
                                {formatTime(b.startAt)} – {b.endAt ? formatTime(b.endAt) : "en curso"}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Página {historyPage} de {totalPages} &middot; {historyData!.total} registros
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                      disabled={historyPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* ── Date-based team view ── */
          teamLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teamRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay agentes en tu equipo todavía.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agente</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Pausas</TableHead>
                      <TableHead>Salida</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Tiempo trabajado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamRows.map((row) => {
                      const state = getSessionState(row.session);
                      const worked = computeWorkedMs(row.session, now.getTime());
                      const breaks = (row.session?.breaks ?? []) as WorkBreak[];
                      const fullName = [row.agent.name, row.agent.surname]
                        .filter(Boolean)
                        .join(" ") || row.agent.email;
                      return (
                        <TableRow key={row.agent.id} data-testid={`row-team-${row.agent.id}`}>
                          <TableCell className="font-medium">{fullName}</TableCell>
                          <TableCell className="tabular-nums">
                            {formatTime(row.session?.clockInAt)}
                          </TableCell>
                          <TableCell>
                            {breaks.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-col gap-0.5 text-xs tabular-nums">
                                {breaks.map((b, i) => (
                                  <span key={i}>
                                    {formatTime(b.startAt)} – {b.endAt ? formatTime(b.endAt) : "en curso"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatTime(row.session?.clockOutAt)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={stateBadgeClass(state)}
                              data-testid={`badge-team-state-${row.agent.id}`}
                            >
                              {stateLabel(state)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {row.session ? formatDuration(worked) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="block md:hidden space-y-3">
                {teamRows.map((row) => {
                  const state = getSessionState(row.session);
                  const worked = computeWorkedMs(row.session, now.getTime());
                  const breaks = (row.session?.breaks ?? []) as WorkBreak[];
                  const fullName = [row.agent.name, row.agent.surname]
                    .filter(Boolean)
                    .join(" ") || row.agent.email;
                  return (
                    <div
                      key={row.agent.id}
                      className="border rounded-lg p-4 space-y-2"
                      data-testid={`card-team-${row.agent.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold">{fullName}</p>
                        <Badge variant="outline" className={stateBadgeClass(state)}>
                          {stateLabel(state)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Entrada</p>
                          <p className="tabular-nums">{formatTime(row.session?.clockInAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Salida</p>
                          <p className="tabular-nums">{formatTime(row.session?.clockOutAt)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Tiempo trabajado</p>
                          <p className="tabular-nums font-medium">
                            {row.session ? formatDuration(worked) : "—"}
                          </p>
                        </div>
                      </div>
                      {breaks.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Pausas</p>
                          <div className="text-xs tabular-nums space-y-0.5">
                            {breaks.map((b, i) => (
                              <p key={i}>
                                {formatTime(b.startAt)} – {b.endAt ? formatTime(b.endAt) : "en curso"}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
