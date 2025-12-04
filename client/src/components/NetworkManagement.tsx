import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Network, Building, Users, Home, Plus, Search, UserMinus, UserPlus, ExternalLink, BarChart3 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Agency {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  logo: string | null;
  city: string | null;
  subscriptionPlan: string | null;
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
  billingMode: string;
  subscriptionPlan: string | null;
  agenciesLimit: number | null;
  agentsLimit: number | null;
  propertiesLimit: number | null;
  agencies: Agency[];
  stats: {
    totalAgencies: number;
    totalAgents: number;
    totalProperties: number;
    totalClients: number;
  };
}

interface Props {
  networkId?: number | null;
}

export function NetworkManagement({ networkId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddAgencyOpen, setIsAddAgencyOpen] = useState(false);
  const [agencySearchQuery, setAgencySearchQuery] = useState("");
  const [isDetachOpen, setIsDetachOpen] = useState(false);
  const [agencyToDetach, setAgencyToDetach] = useState<Agency | null>(null);

  const { data: networkData, isLoading } = useQuery<NetworkData>({
    queryKey: ['/api/networks', networkId, 'management'],
    queryFn: async () => {
      const response = await fetch(`/api/networks/${networkId}/management`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error('Failed to fetch network data');
      }
      return response.json();
    },
    enabled: !!networkId
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
      return await apiRequest('POST', `/api/networks/${networkId}/agencies/${agencyId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/networks', networkId, 'management'] });
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

  const detachAgencyMutation = useMutation({
    mutationFn: async (agencyId: number) => {
      return await apiRequest('DELETE', `/api/networks/${networkId}/agencies/${agencyId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/networks', networkId, 'management'] });
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

  const filteredAgencies = networkData?.agencies?.filter(agency => 
    agency.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontró la red</h3>
            <p className="text-muted-foreground">No tienes acceso a ninguna red de agencias.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Network className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{networkData.name}</h1>
            <p className="text-muted-foreground">Panel de gestión de tu red de agencias</p>
          </div>
        </div>
        <Button onClick={() => setIsAddAgencyOpen(true)} data-testid="button-add-agency">
          <Plus className="h-4 w-4 mr-2" />
          Añadir agencia
        </Button>
      </div>

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
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-clients">{networkData.stats?.totalClients || 0}</p>
                <p className="text-sm text-muted-foreground">Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agencias de la red</CardTitle>
              <CardDescription>Gestiona las agencias que forman parte de {networkData.name}</CardDescription>
            </div>
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
                  : "Añade agencias a tu red para empezar a gestionarlas"
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddAgencyOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir primera agencia
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Agentes</TableHead>
                  <TableHead className="text-center">Propiedades</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => (
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
                      <Badge variant="secondary">
                        {agency.subscriptionPlan || "Sin plan"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{agency.agentCount || 0}</TableCell>
                    <TableCell className="text-center">{agency.propertyCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/agencias/${agency.slug}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-agency-${agency.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddAgencyOpen} onOpenChange={setIsAddAgencyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Añadir agencia a la red</DialogTitle>
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
                      <UserPlus className="h-4 w-4 mr-1" />
                      Añadir
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingAvailable && agencySearchQuery.length >= 2 && (!availableAgencies || availableAgencies.length === 0) && (
              <div className="py-8 text-center">
                <Building className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron agencias disponibles con ese nombre
                </p>
              </div>
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
              La agencia seguirá existiendo pero dejará de estar asociada a {networkData.name}.
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
              {detachAgencyMutation.isPending ? "Eliminando..." : "Eliminar de la red"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
