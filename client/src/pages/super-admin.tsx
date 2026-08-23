import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import { useLanguage } from "@/contexts/language-context";
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

const ROLE_TRANSLATION_KEYS: Record<string, string> = {
  super_admin: "superAdmin.roles.superAdmin",
  network_admin: "superAdmin.roles.networkAdmin",
  agency_admin: "superAdmin.roles.agencyAdmin",
  agency_member: "superAdmin.roles.agencyMember",
  agent: "superAdmin.roles.agent",
  independent: "superAdmin.roles.independent",
  client: "superAdmin.roles.client",
};

const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  active: "superAdmin.status.active",
  inactive: "superAdmin.status.inactive",
};

const MODERATION_STATUS_TRANSLATION_KEYS: Record<string, string> = {
  pending: "superAdmin.moderationStatus.pending",
  approved: "superAdmin.moderationStatus.approved",
  rejected: "superAdmin.moderationStatus.rejected",
};

const OPERATION_TRANSLATION_KEYS: Record<string, string> = {
  venta: "superAdmin.operation.sale",
  sale: "superAdmin.operation.sale",
  alquiler: "superAdmin.operation.rent",
  rent: "superAdmin.operation.rent",
};

const PLAN_TRANSLATION_KEYS: Record<string, string> = {
  basica: "superAdmin.plans.basic",
  básica: "superAdmin.plans.basic",
  basic: "superAdmin.plans.basic",
  pequeña: "superAdmin.plans.small",
  pequena: "superAdmin.plans.small",
  small: "superAdmin.plans.small",
  mediana: "superAdmin.plans.medium",
  medium: "superAdmin.plans.medium",
  lider: "superAdmin.plans.leader",
  líder: "superAdmin.plans.leader",
  leader: "superAdmin.plans.leader",
};

const MODULE_TRANSLATION_KEYS: Record<string, string> = {
  dashboard: "superAdmin.modules.dashboard",
  users: "superAdmin.modules.users",
  listings: "superAdmin.modules.listings",
  moderation: "superAdmin.modules.moderation",
  agencies: "superAdmin.modules.agencies",
  settings: "superAdmin.modules.settings",
  permissions: "superAdmin.modules.permissions",
  roles: "superAdmin.modules.roles",
  search: "superAdmin.modules.search",
  audit: "superAdmin.modules.audit",
  network_overview: "superAdmin.modules.networkOverview",
  billing: "superAdmin.modules.billing",
  team: "superAdmin.modules.team",
  agency_profile: "superAdmin.modules.agencyProfile",
  properties: "superAdmin.modules.properties",
  clients: "superAdmin.modules.clients",
  profile: "superAdmin.modules.profile",
  messages: "superAdmin.modules.messages",
  favorites: "superAdmin.modules.favorites",
  saved_searches: "superAdmin.modules.savedSearches",
};

function translateKnownValue(
  t: (key: string, options?: Record<string, string | number>) => string,
  values: Record<string, string>,
  value: string,
) {
  const key = values[value] || values[value.toLowerCase()];
  return key ? t(key) : value;
}

function QueryState({
  isLoading,
  isError,
  t,
}: {
  isLoading: boolean;
  isError: boolean;
  t: (key: string, options?: Record<string, string | number>) => string;
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("superAdmin.loading")}</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">{t("superAdmin.error")}</p>;
  }
  return null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message);
  }
  return response.json();
}

export default function SuperAdminPage() {
  const { user } = useUser();
  const { language, t } = useLanguage();
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
        title: t("superAdmin.accessDeniedTitle"),
        description: t("superAdmin.accessDeniedDescription"),
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, t, toast]);

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
      toast({ title: t("superAdmin.toasts.statusUpdated") });
    },
    onError: () => {
      toast({
        title: t("superAdmin.toasts.error"),
        description: t("superAdmin.toasts.statusUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (payload: { id: number; role: string }) =>
      apiRequest("PATCH", `/api/super-admin/users/${payload.id}/role`, { role: payload.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [usersApiUrl] });
      toast({ title: t("superAdmin.toasts.roleUpdated") });
    },
    onError: () => {
      toast({
        title: t("superAdmin.toasts.error"),
        description: t("superAdmin.toasts.roleUpdateFailed"),
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
      toast({ title: t("superAdmin.toasts.moderationUpdated") });
    },
    onError: () => {
      toast({
        title: t("superAdmin.toasts.error"),
        description: t("superAdmin.toasts.moderationUpdateFailed"),
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
      toast({ title: t("superAdmin.toasts.settingsSaved") });
    },
    onError: () => {
      toast({
        title: t("superAdmin.toasts.error"),
        description: t("superAdmin.toasts.settingsSaveFailed"),
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
      toast({ title: t("superAdmin.toasts.planUpdated") });
    },
    onError: () => {
      toast({
        title: t("superAdmin.toasts.error"),
        description: t("superAdmin.toasts.planUpdateFailed"),
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
            <h1 className="text-3xl font-bold">{t("superAdmin.title")}</h1>
            <p className="text-muted-foreground">{t("superAdmin.subtitle")}</p>
          </div>
          <Badge className="bg-emerald-600 text-white px-3 py-1">
            <ShieldCheck className="h-4 w-4 mr-1" />
            {t("superAdmin.badge")}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t("superAdmin.search.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder={t("superAdmin.search.placeholder")}
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
              <Select value={globalSearchEntity} onValueChange={setGlobalSearchEntity}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("superAdmin.search.all")}</SelectItem>
                  <SelectItem value="users">{t("superAdmin.search.users")}</SelectItem>
                  <SelectItem value="listings">{t("superAdmin.search.listings")}</SelectItem>
                  <SelectItem value="agencies">{t("superAdmin.search.agencies")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {globalSearchResult.isFetching && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("superAdmin.search.searching")}
              </div>
            )}
            {globalSearchResult.isError && (
              <QueryState
                isLoading={false}
                isError
                t={t}
              />
            )}

            {globalSearchResult.data && (
              globalSearchResult.data.users.length +
                globalSearchResult.data.listings.length +
                globalSearchResult.data.agencies.length ===
                0 ? (
                <p className="text-sm text-muted-foreground">{t("superAdmin.search.noResults")}</p>
              ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("superAdmin.search.users")} ({globalSearchResult.data.users.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {globalSearchResult.data.users.slice(0, 5).map((result) => (
                      <div key={`${result.kind}-${result.id}`} className="text-sm">
                        <p className="font-medium">{result.name || t("superAdmin.search.noName")}</p>
                        <p className="text-muted-foreground">{result.email}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("superAdmin.search.listings")} ({globalSearchResult.data.listings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {globalSearchResult.data.listings.slice(0, 5).map((result) => (
                      <div key={result.uuid} className="text-sm">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-muted-foreground">{result.city || t("superAdmin.search.noCity")}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("superAdmin.search.agencies")} ({globalSearchResult.data.agencies.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {globalSearchResult.data.agencies.slice(0, 5).map((result) => (
                      <div key={result.id} className="text-sm">
                        <p className="font-medium">{result.agencyName}</p>
                        <p className="text-muted-foreground">
                          {result.subscriptionPlan
                            ? translateKnownValue(t, PLAN_TRANSLATION_KEYS, result.subscriptionPlan)
                            : t("superAdmin.search.noPlan")}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              )
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">{t("superAdmin.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="users">{t("superAdmin.tabs.users")}</TabsTrigger>
            <TabsTrigger value="roles">{t("superAdmin.tabs.roles")}</TabsTrigger>
            <TabsTrigger value="listings">{t("superAdmin.tabs.listings")}</TabsTrigger>
            <TabsTrigger value="moderation">{t("superAdmin.tabs.moderation")}</TabsTrigger>
            <TabsTrigger value="settings">{t("superAdmin.tabs.settings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <QueryState
              isLoading={dashboardQuery.isLoading}
              isError={dashboardQuery.isError}
              t={t}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { key: "totalUsers", label: t("superAdmin.stats.users"), icon: Users },
                { key: "totalAgents", label: t("superAdmin.stats.agents"), icon: Users },
                { key: "totalClients", label: t("superAdmin.stats.clients"), icon: Users },
                { key: "totalAgencies", label: t("superAdmin.stats.agencies"), icon: Home },
                { key: "totalListings", label: t("superAdmin.stats.listings"), icon: Home },
                { key: "pendingListings", label: t("superAdmin.stats.pending"), icon: ShieldCheck },
                { key: "flaggedListings", label: t("superAdmin.stats.flagged"), icon: ShieldCheck },
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
                <CardTitle>{t("superAdmin.agencies.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueryState
                  isLoading={agenciesQueryResult.isLoading}
                  isError={agenciesQueryResult.isError}
                  t={t}
                />
                <Input
                  placeholder={t("superAdmin.agencies.searchPlaceholder")}
                  value={agenciesQuery}
                  onChange={(e) => setAgenciesQuery(e.target.value)}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("superAdmin.table.agency")}</TableHead>
                      <TableHead>{t("superAdmin.table.city")}</TableHead>
                      <TableHead>{t("superAdmin.table.admin")}</TableHead>
                      <TableHead>{t("superAdmin.table.agents")}</TableHead>
                      <TableHead>{t("superAdmin.table.properties")}</TableHead>
                      <TableHead>{t("superAdmin.table.plan")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(agenciesQueryResult.data?.items || []).length === 0 &&
                      !agenciesQueryResult.isLoading &&
                      !agenciesQueryResult.isError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {t("superAdmin.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (agenciesQueryResult.data?.items || []).map((agency) => (
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
                              <SelectValue>
                                {translateKnownValue(t, PLAN_TRANSLATION_KEYS, agency.subscriptionPlan || "basica")}
                              </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basica">{t("superAdmin.plans.basic")}</SelectItem>
                                <SelectItem value="pequeña">{t("superAdmin.plans.small")}</SelectItem>
                                <SelectItem value="mediana">{t("superAdmin.plans.medium")}</SelectItem>
                                <SelectItem value="lider">{t("superAdmin.plans.leader")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("superAdmin.users.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueryState
                  isLoading={usersQueryResult.isLoading}
                  isError={usersQueryResult.isError}
                  t={t}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder={t("superAdmin.users.searchPlaceholder")}
                    value={usersQuery}
                    onChange={(e) => setUsersQuery(e.target.value)}
                  />
                  <Select value={usersRoleFilter} onValueChange={setUsersRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("superAdmin.users.roleFilterPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("superAdmin.users.allRoles")}</SelectItem>
                      <SelectItem value="super_admin">{t("superAdmin.roles.superAdmin")}</SelectItem>
                      <SelectItem value="network_admin">{t("superAdmin.roles.networkAdmin")}</SelectItem>
                      <SelectItem value="agency_admin">{t("superAdmin.roles.agencyAdmin")}</SelectItem>
                      <SelectItem value="agent">{t("superAdmin.roles.agent")}</SelectItem>
                      <SelectItem value="client">{t("superAdmin.roles.client")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={usersStatusFilter} onValueChange={setUsersStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("superAdmin.users.statusFilterPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("superAdmin.users.allStatuses")}</SelectItem>
                      <SelectItem value="active">{t("superAdmin.users.active")}</SelectItem>
                      <SelectItem value="inactive">{t("superAdmin.users.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("superAdmin.table.name")}</TableHead>
                      <TableHead>{t("superAdmin.table.email")}</TableHead>
                      <TableHead>{t("superAdmin.table.role")}</TableHead>
                      <TableHead>{t("superAdmin.table.agency")}</TableHead>
                      <TableHead>{t("superAdmin.table.status")}</TableHead>
                      <TableHead>{t("superAdmin.table.lastLogin")}</TableHead>
                      <TableHead className="text-right">{t("superAdmin.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(usersQueryResult.data?.items || []).length === 0 &&
                      !usersQueryResult.isLoading &&
                      !usersQueryResult.isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          {t("superAdmin.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (usersQueryResult.data?.items || []).map((item) => (
                        <TableRow key={`${item.kind}-${item.id}`}>
                          <TableCell>{item.name || t("superAdmin.search.noName")}</TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>
                            {item.kind !== "agent" ? (
                              <Badge variant="outline">
                                {translateKnownValue(t, ROLE_TRANSLATION_KEYS, item.role)}
                              </Badge>
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
                                  <SelectItem value="super_admin">{t("superAdmin.roles.superAdmin")}</SelectItem>
                                  <SelectItem value="network_admin">{t("superAdmin.roles.networkAdmin")}</SelectItem>
                                  <SelectItem value="agency_admin">{t("superAdmin.roles.agencyAdmin")}</SelectItem>
                                  <SelectItem value="agency_member">{t("superAdmin.roles.agencyMember")}</SelectItem>
                                  <SelectItem value="agent">{t("superAdmin.roles.agent")}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>{item.agency || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "active" ? "default" : "secondary"}>
                              {translateKnownValue(t, STATUS_TRANSLATION_KEYS, item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString(language) : "-"}
                          </TableCell>
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
                              {item.status === "active"
                                ? t("superAdmin.users.deactivate")
                                : t("superAdmin.users.reactivate")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("superAdmin.roles.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <QueryState
                  isLoading={permissionsMatrixQuery.isLoading}
                  isError={permissionsMatrixQuery.isError}
                  t={t}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionsMatrixQuery.data || {}).length === 0 &&
                    !permissionsMatrixQuery.isLoading &&
                    !permissionsMatrixQuery.isError ? (
                    <p className="text-sm text-muted-foreground">{t("superAdmin.empty")}</p>
                  ) : (
                    Object.entries(permissionsMatrixQuery.data || {}).map(([role, modules]) => (
                      <Card key={role}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {translateKnownValue(t, ROLE_TRANSLATION_KEYS, role)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                          {modules.map((module) => (
                            <Badge key={module} variant="outline">
                              {translateKnownValue(t, MODULE_TRANSLATION_KEYS, module)}
                            </Badge>
                          ))}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  {t("superAdmin.listings.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueryState
                  isLoading={listingsQueryResult.isLoading}
                  isError={listingsQueryResult.isError}
                  t={t}
                />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder={t("superAdmin.listings.searchPlaceholder")}
                    value={listingsQuery}
                    onChange={(e) => setListingsQuery(e.target.value)}
                  />
                  <Select value={listingsStatusFilter} onValueChange={setListingsStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("superAdmin.listings.statusFilter")}</SelectItem>
                      <SelectItem value="pending">{t("superAdmin.moderationStatus.pending")}</SelectItem>
                      <SelectItem value="approved">{t("superAdmin.moderationStatus.approved")}</SelectItem>
                      <SelectItem value="rejected">{t("superAdmin.moderationStatus.rejected")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={listingsOperationFilter} onValueChange={setListingsOperationFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("superAdmin.listings.operationFilter")}</SelectItem>
                      <SelectItem value="Venta">{t("superAdmin.operation.sale")}</SelectItem>
                      <SelectItem value="Alquiler">{t("superAdmin.operation.rent")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={t("superAdmin.listings.locationPlaceholder")}
                    value={listingsLocationFilter}
                    onChange={(e) => setListingsLocationFilter(e.target.value)}
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("superAdmin.table.title")}</TableHead>
                      <TableHead>{t("superAdmin.table.moderationStatus")}</TableHead>
                      <TableHead>{t("superAdmin.table.operation")}</TableHead>
                      <TableHead>{t("superAdmin.table.agentAgency")}</TableHead>
                      <TableHead>{t("superAdmin.table.fraud")}</TableHead>
                      <TableHead className="text-right">{t("superAdmin.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(listingsQueryResult.data?.items || []).length === 0 &&
                      !listingsQueryResult.isLoading &&
                      !listingsQueryResult.isError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {t("superAdmin.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (listingsQueryResult.data?.items || []).map((listing) => (
                        <TableRow key={listing.uuid}>
                          <TableCell>{listing.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {translateKnownValue(
                                t,
                                MODERATION_STATUS_TRANSLATION_KEYS,
                                listing.moderationStatus,
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {translateKnownValue(t, OPERATION_TRANSLATION_KEYS, listing.operationType)}
                          </TableCell>
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
                              {t("superAdmin.listings.approve")}
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
                              {t("superAdmin.listings.reject")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <QueryState
              isLoading={moderationQueueQuery.isLoading}
              isError={moderationQueueQuery.isError}
              t={t}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("superAdmin.moderation.pending")} ({moderationQueueQuery.data?.pending.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(moderationQueueQuery.data?.pending || []).length === 0 &&
                  !moderationQueueQuery.isLoading &&
                  !moderationQueueQuery.isError ? (
                    <p className="text-sm text-muted-foreground">{t("superAdmin.empty")}</p>
                  ) : (
                    (moderationQueueQuery.data?.pending || []).slice(0, 10).map((listing) => (
                      <div key={listing.uuid} className="flex items-center justify-between border rounded-md p-2">
                        <div>
                          <p className="font-medium text-sm">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {listing.city || t("superAdmin.search.noCity")}
                          </p>
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
                          {t("superAdmin.listings.approve")}
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("superAdmin.moderation.flagged")} ({moderationQueueQuery.data?.flagged.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(moderationQueueQuery.data?.flagged || []).length === 0 &&
                  !moderationQueueQuery.isLoading &&
                  !moderationQueueQuery.isError ? (
                    <p className="text-sm text-muted-foreground">{t("superAdmin.empty")}</p>
                  ) : (
                    (moderationQueueQuery.data?.flagged || []).slice(0, 10).map((listing) => (
                      <div key={listing.uuid} className="flex items-center justify-between border rounded-md p-2">
                        <div>
                          <p className="font-medium text-sm">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("superAdmin.moderation.fraud")}: {listing.fraudCount}
                          </p>
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
                          {t("superAdmin.listings.reject")}
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("superAdmin.settings.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QueryState
                  isLoading={settingsQuery.isLoading}
                  isError={settingsQuery.isError}
                  t={t}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("superAdmin.settings.key")}</Label>
                    <Input
                      value={settingKey}
                      onChange={(e) => setSettingKey(e.target.value)}
                      placeholder="default_listing_duration_days"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("superAdmin.settings.valueJson")}</Label>
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
                        title: t("superAdmin.settings.invalidJson"),
                        description: t("superAdmin.settings.invalidJsonDescription"),
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!settingKey.trim() || settingsMutation.isPending}
                >
                  {t("superAdmin.settings.save")}
                </Button>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("superAdmin.settings.key")}</TableHead>
                      <TableHead>{t("superAdmin.settings.valueJson")}</TableHead>
                      <TableHead>{t("superAdmin.settings.updated")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(settingsQuery.data || []).length === 0 &&
                    !settingsQuery.isLoading &&
                    !settingsQuery.isError ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          {t("superAdmin.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (settingsQuery.data || []).map((setting) => (
                        <TableRow key={setting.id}>
                          <TableCell>{setting.key}</TableCell>
                          <TableCell>
                            <code className="text-xs">{JSON.stringify(setting.value)}</code>
                          </TableCell>
                          <TableCell>{new Date(setting.updatedAt).toLocaleString(language)}</TableCell>
                        </TableRow>
                      ))
                    )}
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
