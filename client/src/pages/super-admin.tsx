import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, Users, Home, Search, Settings } from "lucide-react";

type DashboardStats = {
  totalUsers: number;
  totalAgents: number;
  totalClients: number;
  totalAgencies: number;
  totalListings: number;
  pendingListings: number;
  flaggedListings: number;
};

type SuperAdminUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  agency: string | null;
  status: "active" | "inactive";
  lastLoginAt: string | null;
  kind: "agent" | "client";
};

type UsersResponse = {
  items: SuperAdminUser[];
  total: number;
};

type Listing = {
  uuid: string;
  title: string;
  moderationStatus: "pending" | "approved" | "rejected";
  operationType: string;
  city: string | null;
  agencyName?: string | null;
  agentName?: string | null;
  fraudCount: number;
  createdAt: string;
};

type ListingsResponse = {
  items: Listing[];
  total: number;
};

type ModerationQueueResponse = {
  pending: Listing[];
  flagged: Listing[];
};

type AppSetting = {
  id: number;
  key: string;
  value: any;
  updatedAt: string;
};

type SearchResponse = {
  users: Array<{ id: number; name: string | null; email: string; role: string; status: string; kind: "agent" | "client" }>;
  listings: Array<{ uuid: string; title: string; moderationStatus: string; city: string | null; agencyName: string | null; agentName: string | null }>;
  agencies: Array<{ id: number; agencyName: string; city: string | null; subscriptionPlan: string | null }>;
};

type AgenciesResponse = {
  items: Array<{
    id: number;
    agencyName: string;
    city: string | null;
    subscriptionPlan: string | null;
    adminEmail: string | null;
    agentCount: number;
    activeProperties: number;
  }>;
  total: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
}

export default function SuperAdminPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState("overview");
  const [usersQuery, setUsersQuery] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");
  const [usersStatusFilter, setUsersStatusFilter] = useState("all");
  const [listingsQuery, setListingsQuery] = useState("");
  const [listingsStatusFilter, setListingsStatusFilter] = useState("all");
  const [listingsOperationFilter, setListingsOperationFilter] = useState("all");
  const [listingsLocationFilter, setListingsLocationFilter] = useState("");
  const [agenciesQuery, setAgenciesQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchEntity, setGlobalSearchEntity] = useState("all");
  const [settingKey, setSettingKey] = useState("");
  const [settingJsonValue, setSettingJsonValue] = useState("{}");

  useEffect(() => {
    if (!user) {
      navigate("/iniciar-sesion");
      return;
    }
    if (user.agentType !== "super_admin") {
      toast({
        title: "Acceso denegado",
        description: "Esta sección es exclusiva para SuperAdmin.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  const dashboardQuery = useQuery<DashboardStats>({
    queryKey: ["/api/super-admin/dashboard"],
    queryFn: () => fetchJson("/api/super-admin/dashboard"),
    enabled: user?.agentType === "super_admin",
  });

  const usersApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (usersQuery.trim()) params.set("query", usersQuery.trim());
    if (usersRoleFilter !== "all") params.set("role", usersRoleFilter);
    if (usersStatusFilter !== "all") params.set("status", usersStatusFilter);
    params.set("page", "1");
    params.set("pageSize", "50");
    return `/api/super-admin/users?${params.toString()}`;
  }, [usersQuery, usersRoleFilter, usersStatusFilter]);

  const usersQueryResult = useQuery<UsersResponse>({
    queryKey: [usersApiUrl],
    queryFn: () => fetchJson(usersApiUrl),
    enabled: user?.agentType === "super_admin",
  });

  const listingsApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (listingsQuery.trim()) params.set("query", listingsQuery.trim());
    if (listingsStatusFilter !== "all") params.set("moderationStatus", listingsStatusFilter);
    if (listingsOperationFilter !== "all") params.set("operationType", listingsOperationFilter);
    if (listingsLocationFilter.trim()) params.set("location", listingsLocationFilter.trim());
    params.set("page", "1");
    params.set("pageSize", "50");
    return `/api/super-admin/listings?${params.toString()}`;
  }, [listingsQuery, listingsStatusFilter, listingsOperationFilter, listingsLocationFilter]);

  const listingsQueryResult = useQuery<ListingsResponse>({
    queryKey: [listingsApiUrl],
    queryFn: () => fetchJson(listingsApiUrl),
    enabled: user?.agentType === "super_admin",
  });

  const moderationQueueQuery = useQuery<ModerationQueueResponse>({
    queryKey: ["/api/super-admin/moderation/queue"],
    queryFn: () => fetchJson("/api/super-admin/moderation/queue"),
    enabled: user?.agentType === "super_admin",
  });

  const agenciesApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (agenciesQuery.trim()) params.set("query", agenciesQuery.trim());
    params.set("page", "1");
    params.set("pageSize", "30");
    return `/api/super-admin/agencies?${params.toString()}`;
  }, [agenciesQuery]);

  const agenciesQueryResult = useQuery<AgenciesResponse>({
    queryKey: [agenciesApiUrl],
    queryFn: () => fetchJson(agenciesApiUrl),
    enabled: user?.agentType === "super_admin",
  });

  const settingsQuery = useQuery<AppSetting[]>({
    queryKey: ["/api/super-admin/settings"],
    queryFn: () => fetchJson("/api/super-admin/settings"),
    enabled: user?.agentType === "super_admin",
  });

  const permissionsMatrixQuery = useQuery<Record<string, string[]>>({
    queryKey: ["/api/super-admin/permissions/matrix"],
    queryFn: () => fetchJson("/api/super-admin/permissions/matrix"),
    enabled: user?.agentType === "super_admin",
  });

  const globalSearchUrl = useMemo(() => {
    if (!globalSearchQuery.trim()) return null;
    const params = new URLSearchParams({ q: globalSearchQuery.trim() });
    if (globalSearchEntity !== "all") {
      params.set("entity", globalSearchEntity);
    }
    return `/api/super-admin/search?${params.toString()}`;
  }, [globalSearchQuery, globalSearchEntity]);

  const globalSearchResult = useQuery<SearchResponse>({
    queryKey: [globalSearchUrl],
    queryFn: () => fetchJson(globalSearchUrl!),
    enabled: Boolean(globalSearchUrl) && user?.agentType === "super_admin",
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: { kind: "agent" | "client"; id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/super-admin/users/${payload.kind}/${payload.id}/status`, {
        isActive: payload.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [usersApiUrl] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/dashboard"] });
      toast({ title: "Estado actualizado" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (payload: { id: number; role: string }) =>
      apiRequest("PATCH", `/api/super-admin/users/${payload.id}/role`, { role: payload.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [usersApiUrl] });
      toast({ title: "Rol actualizado" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive",
      });
    },
  });

  const moderationMutation = useMutation({
    mutationFn: async (payload: { uuid: string; moderationStatus: "pending" | "approved" | "rejected"; moderationReason?: string }) =>
      apiRequest("PATCH", `/api/super-admin/listings/${payload.uuid}/moderation`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listingsApiUrl] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/moderation/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/dashboard"] });
      toast({ title: "Moderación actualizada" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la moderación",
        variant: "destructive",
      });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (payload: { key: string; value: any }) =>
      apiRequest("PATCH", `/api/super-admin/settings/${encodeURIComponent(payload.key)}`, {
        value: payload.value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/settings"] });
      toast({ title: "Configuración guardada" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    },
  });

  const agencyPlanMutation = useMutation({
    mutationFn: async (payload: { agencyId: number; plan: string }) =>
      apiRequest("PATCH", `/api/super-admin/agencies/${payload.agencyId}/subscription`, {
        plan: payload.plan,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [agenciesApiUrl] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/dashboard"] });
      toast({ title: "Plan actualizado" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el plan",
        variant: "destructive",
      });
    },
  });

  if (!user || user.agentType !== "super_admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SuperAdmin Back Office</h1>
            <p className="text-muted-foreground">Gestión centralizada de usuarios, listados y configuración</p>
          </div>
          <Badge className="bg-emerald-600 text-white px-3 py-1">
            <ShieldCheck className="h-4 w-4 mr-1" />
            SuperAdmin
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Búsqueda global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder="Buscar usuarios, listados o agencias..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
              <Select value={globalSearchEntity} onValueChange={setGlobalSearchEntity}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="users">Usuarios</SelectItem>
                  <SelectItem value="listings">Listados</SelectItem>
                  <SelectItem value="agencies">Agencias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {globalSearchResult.isFetching && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            )}

            {globalSearchResult.data && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Usuarios ({globalSearchResult.data.users.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {globalSearchResult.data.users.slice(0, 5).map((result) => (
                      <div key={`${result.kind}-${result.id}`} className="text-sm">
                        <p className="font-medium">{result.name || "Sin nombre"}</p>
                        <p className="text-muted-foreground">{result.email}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Listados ({globalSearchResult.data.listings.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {globalSearchResult.data.listings.slice(0, 5).map((result) => (
                      <div key={result.uuid} className="text-sm">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-muted-foreground">{result.city || "Sin ciudad"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Agencias ({globalSearchResult.data.agencies.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {globalSearchResult.data.agencies.slice(0, 5).map((result) => (
                      <div key={result.id} className="text-sm">
                        <p className="font-medium">{result.agencyName}</p>
                        <p className="text-muted-foreground">{result.subscriptionPlan || "Sin plan"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="listings">Listados</TabsTrigger>
            <TabsTrigger value="moderation">Moderación</TabsTrigger>
            <TabsTrigger value="settings">Ajustes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { key: "totalUsers", label: "Usuarios", icon: Users },
                { key: "totalAgents", label: "Agentes", icon: Users },
                { key: "totalClients", label: "Clientes", icon: Users },
                { key: "totalAgencies", label: "Agencias", icon: Home },
                { key: "totalListings", label: "Listados", icon: Home },
                { key: "pendingListings", label: "Pendientes", icon: ShieldCheck },
                { key: "flaggedListings", label: "Reportados", icon: ShieldCheck },
              ].map(({ key, label, icon: Icon }) => (
                <Card key={key}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-xl font-bold">{(dashboardQuery.data as any)?.[key] ?? "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agencias y suscripciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Buscar agencia por nombre o ciudad"
                  value={agenciesQuery}
                  onChange={(e) => setAgenciesQuery(e.target.value)}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agencia</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Administrador</TableHead>
                      <TableHead>Agentes</TableHead>
                      <TableHead>Propiedades</TableHead>
                      <TableHead>Plan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(agenciesQueryResult.data?.items || []).map((agency) => (
                      <TableRow key={agency.id}>
                        <TableCell>{agency.agencyName}</TableCell>
                        <TableCell>{agency.city || "-"}</TableCell>
                        <TableCell>{agency.adminEmail || "-"}</TableCell>
                        <TableCell>{agency.agentCount}</TableCell>
                        <TableCell>{agency.activeProperties}</TableCell>
                        <TableCell>
                          <Select
                            value={agency.subscriptionPlan || "basica"}
                            onValueChange={(value) =>
                              agencyPlanMutation.mutate({
                                agencyId: agency.id,
                                plan: value,
                              })
                            }
                            disabled={agencyPlanMutation.isPending}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basica">basica</SelectItem>
                              <SelectItem value="pequeña">pequeña</SelectItem>
                              <SelectItem value="mediana">mediana</SelectItem>
                              <SelectItem value="lider">lider</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Buscar nombre o email"
                    value={usersQuery}
                    onChange={(e) => setUsersQuery(e.target.value)}
                  />
                  <Select value={usersRoleFilter} onValueChange={setUsersRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="network_admin">Network Admin</SelectItem>
                      <SelectItem value="agency_admin">Agency Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={usersStatusFilter} onValueChange={setUsersStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Agencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último login</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(usersQueryResult.data?.items || []).map((item) => (
                      <TableRow key={`${item.kind}-${item.id}`}>
                        <TableCell>{item.name || "Sin nombre"}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>
                          {item.kind !== "agent" ? (
                            <Badge variant="outline">{item.role}</Badge>
                          ) : (
                            <Select
                              value={item.role}
                              onValueChange={(value) => {
                                roleMutation.mutate({
                                  id: item.id,
                                  role: value === "agency_admin" ? "agency_member" : value,
                                });
                              }}
                              disabled={roleMutation.isPending}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="super_admin">super_admin</SelectItem>
                                <SelectItem value="network_admin">network_admin</SelectItem>
                                <SelectItem value="agency_admin">agency_admin</SelectItem>
                                <SelectItem value="agency_member">agency_member</SelectItem>
                                <SelectItem value="agent">agent</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>{item.agency || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "active" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                kind: item.kind,
                                id: item.id,
                                isActive: item.status !== "active",
                              })
                            }
                          >
                            {item.status === "active" ? "Desactivar" : "Reactivar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role & Permission Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionsMatrixQuery.data || {}).map(([role, modules]) => (
                    <Card key={role}>
                      <CardHeader>
                        <CardTitle className="text-base">{role}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {modules.map((module) => (
                          <Badge key={module} variant="outline">
                            {module}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Listings Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Buscar por título/referencia"
                    value={listingsQuery}
                    onChange={(e) => setListingsQuery(e.target.value)}
                  />
                  <Select value={listingsStatusFilter} onValueChange={setListingsStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={listingsOperationFilter} onValueChange={setListingsOperationFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="Venta">Venta</SelectItem>
                      <SelectItem value="Alquiler">Alquiler</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Ubicación"
                    value={listingsLocationFilter}
                    onChange={(e) => setListingsLocationFilter(e.target.value)}
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Operación</TableHead>
                      <TableHead>Agente/Agencia</TableHead>
                      <TableHead>Fraude</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(listingsQueryResult.data?.items || []).map((listing) => (
                      <TableRow key={listing.uuid}>
                        <TableCell>{listing.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{listing.moderationStatus}</Badge>
                        </TableCell>
                        <TableCell>{listing.operationType}</TableCell>
                        <TableCell>{listing.agentName || "-"} / {listing.agencyName || "-"}</TableCell>
                        <TableCell>{listing.fraudCount}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              moderationMutation.mutate({
                                uuid: listing.uuid,
                                moderationStatus: "approved",
                              })
                            }
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              moderationMutation.mutate({
                                uuid: listing.uuid,
                                moderationStatus: "rejected",
                              })
                            }
                          >
                            Rechazar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pendientes ({moderationQueueQuery.data?.pending.length || 0})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(moderationQueueQuery.data?.pending || []).slice(0, 10).map((listing) => (
                    <div key={listing.uuid} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <p className="font-medium text-sm">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">{listing.city || "Sin ciudad"}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          moderationMutation.mutate({
                            uuid: listing.uuid,
                            moderationStatus: "approved",
                          })
                        }
                      >
                        Aprobar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reportados ({moderationQueueQuery.data?.flagged.length || 0})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(moderationQueueQuery.data?.flagged || []).slice(0, 10).map((listing) => (
                    <div key={listing.uuid} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <p className="font-medium text-sm">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">Fraude: {listing.fraudCount}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          moderationMutation.mutate({
                            uuid: listing.uuid,
                            moderationStatus: "rejected",
                          })
                        }
                      >
                        Rechazar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings & Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Clave</Label>
                    <Input
                      value={settingKey}
                      onChange={(e) => setSettingKey(e.target.value)}
                      placeholder="default_listing_duration_days"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (JSON)</Label>
                    <Textarea
                      value={settingJsonValue}
                      onChange={(e) => setSettingJsonValue(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(settingJsonValue);
                      settingsMutation.mutate({ key: settingKey, value: parsed });
                    } catch {
                      toast({
                        title: "JSON inválido",
                        description: "Revisa el formato del valor.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!settingKey.trim() || settingsMutation.isPending}
                >
                  Guardar ajuste
                </Button>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Actualizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(settingsQuery.data || []).map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>{setting.key}</TableCell>
                        <TableCell>
                          <code className="text-xs">{JSON.stringify(setting.value)}</code>
                        </TableCell>
                        <TableCell>{new Date(setting.updatedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
