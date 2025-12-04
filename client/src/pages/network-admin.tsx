import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, 
  Building, 
  Users, 
  Home, 
  Plus, 
  Search, 
  UserMinus, 
  CreditCard, 
  Euro, 
  Loader2,
  Settings,
  BarChart3,
  LogOut,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Agency {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  logo: string | null;
  city: string | null;
  subscriptionPlan: string | null;
  seatsLimit: number | null;
  activePropertiesLimit: number | null;
  agentCount?: number;
  propertyCount?: number;
}

interface NetworkData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  billingMode: string;
  subscriptionPlan: string | null;
  agenciesLimit: number | null;
  stripeCustomerId: string | null;
  agencies: Agency[];
  stats: {
    totalAgencies: number;
    totalAgents: number;
    totalProperties: number;
    totalClients: number;
  };
}

const AGENCY_PLAN_PRICES: Record<string, { name: string; price: number; seats: number | null; properties: number | null }> = {
  'basica': { name: 'Básica', price: 0, seats: 1, properties: 2 },
  'pequeña': { name: 'Pequeña', price: 29, seats: 2, properties: 10 },
  'mediana': { name: 'Mediana', price: 79, seats: 6, properties: 30 },
  'lider': { name: 'Líder', price: 249, seats: null, properties: null },
};

export default function NetworkAdminPage() {
  const { user, logout, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddAgencyOpen, setIsAddAgencyOpen] = useState(false);
  const [isCreateAgencyOpen, setIsCreateAgencyOpen] = useState(false);
  const [agencySearchQuery, setAgencySearchQuery] = useState("");
  const [isDetachOpen, setIsDetachOpen] = useState(false);
  const [agencyToDetach, setAgencyToDetach] = useState<Agency | null>(null);
  
  const [newAgencyData, setNewAgencyData] = useState({
    name: "",
    city: "",
    plan: "basica"
  });

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        navigate("/iniciar-sesion");
        return;
      }
      if (user.agentType !== 'network_admin') {
        toast({
          title: "Acceso denegado",
          description: "Esta sección es solo para administradores de red.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
    }
  }, [user, isUserLoading, navigate, toast]);

  const { data: networkData, isLoading } = useQuery<NetworkData>({
    queryKey: ['/api/networks', user?.networkId, 'management'],
    queryFn: async () => {
      const response = await fetch(`/api/networks/${user?.networkId}/management`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error('Failed to fetch network data');
      }
      return response.json();
    },
    enabled: !!user?.networkId
  });

  const { data: availableAgencies, isLoading: isLoadingAvailable } = useQuery<Agency[]>({
    queryKey: ['/api/networks/available-agencies', agencySearchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/networks/available-agencies/${encodeURIComponent(agencySearchQuery)}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error('Failed to fetch available agencies');
      }
      return response.json();
    },
    enabled: isAddAgencyOpen && agencySearchQuery.length >= 2
  });

  const attachAgencyMutation = useMutation({
    mutationFn: async (agencyId: number) => {
      return await apiRequest('POST', `/api/networks/${user?.networkId}/agencies/${agencyId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/networks', user?.networkId, 'management'] });
      qc.invalidateQueries({ queryKey: ['/api/networks/available-agencies'] });
      toast({
        title: "Agencia añadida",
        description: "La agencia se ha añadido a tu red correctamente."
      });
      setIsAddAgencyOpen(false);
      setAgencySearchQuery("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir la agencia",
        variant: "destructive"
      });
    }
  });

  const createAgencyMutation = useMutation({
    mutationFn: async (data: { name: string; city: string; plan: string }) => {
      return await apiRequest('POST', `/api/network-admin/agencies`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/networks', user?.networkId, 'management'] });
      toast({
        title: "Agencia creada",
        description: "La nueva agencia se ha creado y añadido a tu red."
      });
      setIsCreateAgencyOpen(false);
      setNewAgencyData({ name: "", city: "", plan: "basica" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la agencia",
        variant: "destructive"
      });
    }
  });

  const detachAgencyMutation = useMutation({
    mutationFn: async (agencyId: number) => {
      return await apiRequest('DELETE', `/api/networks/${user?.networkId}/agencies/${agencyId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/networks', user?.networkId, 'management'] });
      qc.invalidateQueries({ queryKey: ['/api/networks/available-agencies'] });
      toast({
        title: "Agencia eliminada",
        description: "La agencia ya no pertenece a tu red."
      });
      setIsDetachOpen(false);
      setAgencyToDetach(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la agencia",
        variant: "destructive"
      });
    }
  });

  const stripePortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/portal', {
        customerId: networkData?.stripeCustomerId
      });
      return response.json();
    },
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir el portal de facturación",
        variant: "destructive"
      });
    }
  });

  const updateAgencyPlanMutation = useMutation({
    mutationFn: async ({ agencyId, plan }: { agencyId: number; plan: string }) => {
      return await apiRequest('PATCH', `/api/networks/${user?.networkId}/agencies/${agencyId}/plan`, { plan });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/networks', user?.networkId, 'management'] });
      toast({
        title: "Plan actualizado",
        description: "El plan de la agencia se ha actualizado correctamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el plan de la agencia",
        variant: "destructive"
      });
    }
  });

  const calculateBilling = () => {
    if (!networkData?.agencies) return { breakdown: [], total: 0 };
    
    const planCounts: Record<string, number> = {};
    networkData.agencies.forEach(agency => {
      const plan = agency.subscriptionPlan?.toLowerCase() || 'basica';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    const breakdown = Object.entries(planCounts).map(([plan, count]) => {
      const planInfo = AGENCY_PLAN_PRICES[plan] || AGENCY_PLAN_PRICES['basica'];
      return {
        plan: planInfo.name,
        count,
        unitPrice: planInfo.price,
        subtotal: count * planInfo.price
      };
    }).filter(item => item.count > 0);

    const total = breakdown.reduce((sum, item) => sum + item.subtotal, 0);
    return { breakdown, total };
  };

  const billingInfo = calculateBilling();

  const filteredAgencies = networkData?.agencies?.filter(agency => 
    agency.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive"
      });
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user || user.agentType !== 'network_admin') {
    return null;
  }

  if (!networkData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontró la red</h3>
              <p className="text-muted-foreground">No tienes acceso a ninguna red de agencias.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {networkData.logo ? (
              <img src={networkData.logo} alt={networkData.name} className="h-16 w-16 rounded-lg object-contain bg-white shadow" />
            ) : (
              <div className="p-4 bg-orange-100 rounded-lg">
                <Network className="h-8 w-8 text-orange-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{networkData.name}</h1>
              <p className="text-muted-foreground">Panel de administración de red</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="agencies" data-testid="tab-agencies">
              <Building className="h-4 w-4 mr-2" />
              Agencias
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Facturación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-agencies">{networkData.stats?.totalAgencies || 0}</p>
                      <p className="text-sm text-muted-foreground">Agencias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-agents">{networkData.stats?.totalAgents || 0}</p>
                      <p className="text-sm text-muted-foreground">Agentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Home className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-properties">{networkData.stats?.totalProperties || 0}</p>
                      <p className="text-sm text-muted-foreground">Propiedades</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Euro className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-monthly-cost">
                        {billingInfo.total === 0 ? 'Gratis' : `${billingInfo.total}€`}
                      </p>
                      <p className="text-sm text-muted-foreground">Coste mensual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acciones rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setIsCreateAgencyOpen(true)}
                    data-testid="button-quick-create-agency"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear nueva agencia
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setIsAddAgencyOpen(true)}
                    data-testid="button-quick-add-existing"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Añadir agencia existente
                  </Button>
                  {networkData.stripeCustomerId && (
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => stripePortalMutation.mutate()}
                      disabled={stripePortalMutation.isPending}
                      data-testid="button-quick-billing"
                    >
                      {stripePortalMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Gestionar facturación
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agencias recientes</CardTitle>
                  <CardDescription>Últimas agencias añadidas a la red</CardDescription>
                </CardHeader>
                <CardContent>
                  {networkData.agencies.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay agencias aún</p>
                  ) : (
                    <div className="space-y-3">
                      {networkData.agencies.slice(0, 5).map((agency) => (
                        <div key={agency.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {agency.logo ? (
                              <img src={agency.logo} alt={agency.name} className="h-8 w-8 rounded object-contain bg-white" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                                <Building className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{agency.name}</p>
                              <p className="text-xs text-muted-foreground">{agency.city || "Sin ciudad"}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {AGENCY_PLAN_PRICES[agency.subscriptionPlan?.toLowerCase() || 'basica']?.name || 'Básica'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agencies" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Agencias de la red</CardTitle>
                    <CardDescription>Gestiona las agencias que forman parte de {networkData.name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar agencia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                        data-testid="input-search-agencies"
                      />
                    </div>
                    <Button onClick={() => setIsCreateAgencyOpen(true)} data-testid="button-create-agency">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear agencia
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddAgencyOpen(true)} data-testid="button-add-agency">
                      <Building className="h-4 w-4 mr-2" />
                      Añadir existente
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAgencies.length === 0 ? (
                  <div className="py-12 text-center">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? "No se encontraron agencias" : "Sin agencias aún"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? "Intenta con otro término de búsqueda" 
                        : "Crea o añade agencias a tu red para empezar a gestionarlas"
                      }
                    </p>
                    {!searchQuery && (
                      <div className="flex items-center justify-center gap-3">
                        <Button onClick={() => setIsCreateAgencyOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear primera agencia
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agencia</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-center">Límite agentes</TableHead>
                        <TableHead className="text-center">Límite propiedades</TableHead>
                        <TableHead className="text-center">Agentes</TableHead>
                        <TableHead className="text-center">Propiedades</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgencies.map((agency) => {
                        const planKey = agency.subscriptionPlan?.toLowerCase() || 'basica';
                        const planInfo = AGENCY_PLAN_PRICES[planKey] || AGENCY_PLAN_PRICES['basica'];
                        return (
                          <TableRow key={agency.id} data-testid={`row-agency-${agency.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {agency.logo ? (
                                  <img 
                                    src={agency.logo} 
                                    alt={agency.name} 
                                    className="h-10 w-10 rounded object-contain bg-gray-100"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                    <Building className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <span className="font-medium">{agency.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{agency.city || "Sin especificar"}</TableCell>
                            <TableCell>
                              <Select
                                value={planKey}
                                onValueChange={(value) => updateAgencyPlanMutation.mutate({ agencyId: agency.id, plan: value })}
                                disabled={updateAgencyPlanMutation.isPending}
                              >
                                <SelectTrigger className="w-32" data-testid={`select-plan-${agency.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basica">Básica (0€)</SelectItem>
                                  <SelectItem value="pequeña">Pequeña (29€)</SelectItem>
                                  <SelectItem value="mediana">Mediana (79€)</SelectItem>
                                  <SelectItem value="lider">Líder (249€)</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              {agency.seatsLimit === null ? '∞' : agency.seatsLimit}
                            </TableCell>
                            <TableCell className="text-center">
                              {agency.activePropertiesLimit === null ? '∞' : agency.activePropertiesLimit}
                            </TableCell>
                            <TableCell className="text-center">{agency.agentCount || 0}</TableCell>
                            <TableCell className="text-center">{agency.propertyCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setAgencyToDetach(agency);
                                  setIsDetachOpen(true);
                                }}
                                data-testid={`button-detach-agency-${agency.id}`}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Facturación centralizada</CardTitle>
                      <CardDescription>Tu red paga por todas las agencias según el plan asignado a cada una</CardDescription>
                    </div>
                  </div>
                  {networkData.stripeCustomerId && (
                    <Button
                      onClick={() => stripePortalMutation.mutate()}
                      disabled={stripePortalMutation.isPending}
                      data-testid="button-stripe-portal"
                    >
                      {stripePortalMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Gestionar facturación en Stripe
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {billingInfo.breakdown.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay agencias en tu red todavía
                  </p>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan de agencia</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Precio/agencia</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingInfo.breakdown.map((item, index) => (
                          <TableRow key={index} data-testid={`billing-row-${item.plan.toLowerCase()}`}>
                            <TableCell>
                              <Badge variant="secondary">{item.plan}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{item.count}</TableCell>
                            <TableCell className="text-right">
                              {item.unitPrice === 0 ? 'Gratis' : `${item.unitPrice}€`}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.subtotal === 0 ? 'Gratis' : `${item.subtotal}€`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Euro className="h-5 w-5 text-orange-600" />
                        <span className="text-lg font-semibold">Total mensual estimado:</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-600" data-testid="billing-total">
                        {billingInfo.total === 0 ? 'Gratis' : `${billingInfo.total}€/mes`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      * El importe final se calculará en función de las agencias activas en cada ciclo de facturación.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planes disponibles para agencias</CardTitle>
                <CardDescription>Asigna diferentes planes a cada agencia según sus necesidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(AGENCY_PLAN_PRICES).map(([key, plan]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{plan.name}</h4>
                        <Badge variant={key === 'lider' ? 'default' : 'secondary'}>
                          {plan.price === 0 ? 'Gratis' : `${plan.price}€/mes`}
                        </Badge>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• {plan.seats === null ? 'Agentes ilimitados' : `${plan.seats} agente${plan.seats > 1 ? 's' : ''}`}</li>
                        <li>• {plan.properties === null ? 'Propiedades ilimitadas' : `${plan.properties} propiedades`}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isCreateAgencyOpen} onOpenChange={setIsCreateAgencyOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear nueva agencia</DialogTitle>
              <DialogDescription>
                Crea una nueva agencia que formará parte de {networkData.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="agency-name">Nombre de la agencia</Label>
                <Input
                  id="agency-name"
                  placeholder="Ej: Inmobiliaria Barcelona Centro"
                  value={newAgencyData.name}
                  onChange={(e) => setNewAgencyData({ ...newAgencyData, name: e.target.value })}
                  data-testid="input-new-agency-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency-city">Ciudad</Label>
                <Input
                  id="agency-city"
                  placeholder="Ej: Barcelona"
                  value={newAgencyData.city}
                  onChange={(e) => setNewAgencyData({ ...newAgencyData, city: e.target.value })}
                  data-testid="input-new-agency-city"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan inicial</Label>
                <Select
                  value={newAgencyData.plan}
                  onValueChange={(value) => setNewAgencyData({ ...newAgencyData, plan: value })}
                >
                  <SelectTrigger data-testid="select-new-agency-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basica">Básica (Gratis)</SelectItem>
                    <SelectItem value="pequeña">Pequeña (29€/mes)</SelectItem>
                    <SelectItem value="mediana">Mediana (79€/mes)</SelectItem>
                    <SelectItem value="lider">Líder (249€/mes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateAgencyOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createAgencyMutation.mutate(newAgencyData)}
                disabled={!newAgencyData.name || createAgencyMutation.isPending}
                data-testid="button-confirm-create-agency"
              >
                {createAgencyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Crear agencia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddAgencyOpen} onOpenChange={setIsAddAgencyOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Añadir agencia existente</DialogTitle>
              <DialogDescription>
                Busca agencias existentes para añadirlas a tu red de {networkData.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Buscar agencia</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nombre de la agencia..."
                    value={agencySearchQuery}
                    onChange={(e) => setAgencySearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-available-agencies"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Escribe al menos 2 caracteres para buscar</p>
              </div>

              {isLoadingAvailable && agencySearchQuery.length >= 2 && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              )}

              {!isLoadingAvailable && availableAgencies && availableAgencies.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableAgencies.map((agency) => (
                    <div 
                      key={agency.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      data-testid={`available-agency-${agency.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {agency.logo ? (
                          <img 
                            src={agency.logo} 
                            alt={agency.name} 
                            className="h-10 w-10 rounded object-contain bg-gray-100"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                            <Building className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-sm text-muted-foreground">{agency.city || "Sin ciudad"}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => attachAgencyMutation.mutate(agency.id)}
                        disabled={attachAgencyMutation.isPending}
                        data-testid={`button-attach-agency-${agency.id}`}
                      >
                        {attachAgencyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingAvailable && agencySearchQuery.length >= 2 && (!availableAgencies || availableAgencies.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No se encontraron agencias disponibles
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDetachOpen} onOpenChange={setIsDetachOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar agencia de la red</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar a <strong>{agencyToDetach?.name}</strong> de tu red?
                La agencia dejará de aparecer en tu panel de gestión.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetachOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => agencyToDetach && detachAgencyMutation.mutate(agencyToDetach.id)}
                disabled={detachAgencyMutation.isPending}
                data-testid="button-confirm-detach"
              >
                {detachAgencyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserMinus className="h-4 w-4 mr-2" />
                )}
                Eliminar de la red
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
