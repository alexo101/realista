import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Building, 
  Users, 
  Star, 
  Sparkles, 
  Home, 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  FileText,
  Loader2,
  User,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const AGENCY_PLAN_LABELS: Record<string, string> = {
  'basica': 'Básica (0€/mes)',
  'pequeña': 'Pequeña (29€/mes)',
  'mediana': 'Mediana (79€/mes)',
  'lider': 'Líder (249€/mes)',
};

const AGENT_PLAN_LABELS: Record<string, string> = {
  'basico': 'Básico (0€/mes)',
  'lider': 'Líder (20€/mes)',
};

interface BillingInfo {
  currentPlan: string;
  isYearlyBilling: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  seatsLimit: number | null;
  activePropertiesLimit: number | null;
  subscriptionStartDate: string | null;
  subscription: {
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  } | null;
}

interface Invoice {
  id: string;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  hosted_invoice_url: string | null;
}

const AGENCY_PLANS = [
  {
    id: "basica",
    name: "Agencia Básica",
    monthlyPrice: 0,
    yearlyPrice: 0,
    agentsLimit: 1,
    propertiesLimit: 2,
    features: ["Perfil básico con solo el Agente principal", "CRM y gestión de agenda", "2 propiedades activas a la vez"],
    icon: Building,
    color: "bg-gray-50 border-gray-200",
    badgeColor: "bg-gray-100 text-gray-700"
  },
  {
    id: "pequeña",
    name: "Agencia Pequeña",
    monthlyPrice: 29,
    yearlyPrice: 290,
    agentsLimit: 2,
    propertiesLimit: 10,
    features: ["Hasta 2 perfiles públicos de agentes", "CRM y gestión de agenda", "Hasta 10 propiedades activas a la vez", "Ventajas IA"],
    icon: Users,
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700"
  },
  {
    id: "mediana",
    name: "Agencia Mediana",
    monthlyPrice: 79,
    yearlyPrice: 790,
    agentsLimit: 6,
    propertiesLimit: 30,
    features: ["Hasta 6 agentes", "CRM y gestión de agenda", "Hasta 30 propiedades activas a la vez", "Ventajas IA"],
    icon: Star,
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-700"
  },
  {
    id: "lider",
    name: "Agencia Líder",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    agentsLimit: null,
    propertiesLimit: null,
    features: ["Agentes ilimitados", "CRM y gestión de agenda", "Propiedades ilimitadas", "Ventajas IA"],
    icon: Sparkles,
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-700"
  }
];

const AGENT_PLANS = [
  {
    id: "basico",
    name: "Agente Básico",
    monthlyPrice: 0,
    yearlyPrice: 0,
    propertiesLimit: 2,
    features: ["Perfil básico de agente individual", "CRM y gestión de agenda", "2 propiedades activas a la vez"],
    icon: User,
    color: "bg-gray-50 border-gray-200",
    badgeColor: "bg-gray-100 text-gray-700"
  },
  {
    id: "lider",
    name: "Agente Líder",
    monthlyPrice: 20,
    yearlyPrice: 200,
    propertiesLimit: null,
    features: ["Perfil profesional de agente", "CRM y gestión de agenda", "Propiedades ilimitadas", "Ventajas IA"],
    icon: Sparkles,
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-700"
  }
];

interface Props {
  entityType: 'agency' | 'agent';
  entityId: number;
  agentUuid: string;
}

export function BillingTab({ entityType, entityId, agentUuid }: Props) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [taxInfo, setTaxInfo] = useState({
    taxId: "",
    businessName: "",
    address: ""
  });
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'monthly' | 'yearly' | null>(null);

  const plans = entityType === 'agency' ? AGENCY_PLANS : AGENT_PLANS;
  const planLabels = entityType === 'agency' ? AGENCY_PLAN_LABELS : AGENT_PLAN_LABELS;

  const { data: billingInfo, isLoading } = useQuery<BillingInfo>({
    queryKey: ['/api/stripe/billing', entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/stripe/billing/${entityType}/${entityId}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error('Failed to fetch billing info');
      }
      return response.json();
    },
    enabled: !!entityId
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/stripe/invoices', entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/stripe/invoices/${entityType}/${entityId}`, {
        credentials: "include"
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!entityId && !!billingInfo?.stripeCustomerId
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ planId, isYearly }: { planId: string; isYearly: boolean }) => {
      const newPlan = plans.find(p => p.id === planId);
      if (!newPlan) throw new Error("Plan no encontrado");

      // For free plan downgrades, use activate-free-tier endpoint
      if (newPlan.monthlyPrice === 0) {
        return await apiRequest('POST', '/api/stripe/activate-free-tier', {
          entityType,
          entityId
        });
      }

      // For all paid plans, redirect to Stripe checkout
      return await apiRequest('POST', '/api/stripe/checkout-plan', {
        entityType,
        entityId,
        planId,
        isYearly
      });
    },
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.success) {
        // Free tier activated successfully
        toast({
          title: "Plan actualizado",
          description: "Tu plan ha sido cambiado exitosamente",
        });
        // Refresh the page to show updated plan
        window.location.reload();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el cambio de plan",
        variant: "destructive",
      });
    },
  });

  // Compute current plan first - needed for other calculations
  const currentPlan = plans.find(p => p.id === billingInfo?.currentPlan?.toLowerCase()) || plans[0];
  const currentPlanIndex = plans.findIndex(p => p.id === currentPlan.id);
  const superiorPlans = plans.slice(currentPlanIndex + 1);
  const currentBillingPeriod = billingInfo?.isYearlyBilling ? 'yearly' : 'monthly';

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleBillingPeriodSelect = (period: string) => {
    // Only allow selection if it's valid
    if (period === 'monthly' || period === 'yearly') {
      setSelectedBillingPeriod(period);
    }
  };

  // Check if there are pending changes
  const effectiveSelectedPlan = selectedPlanId || currentPlan.id;
  const effectiveSelectedPeriod = selectedBillingPeriod || currentBillingPeriod;
  const hasPlanChange = effectiveSelectedPlan !== currentPlan.id;
  const hasPeriodChange = effectiveSelectedPeriod !== currentBillingPeriod;
  const hasAnyChange = hasPlanChange || hasPeriodChange;

  const handleConfirmClick = () => {
    setPendingPlan(effectiveSelectedPlan);
    setShowConfirmDialog(true);
  };

  const handleConfirmPlanChange = () => {
    const isYearly = effectiveSelectedPeriod === 'yearly';
    changePlanMutation.mutate({ planId: effectiveSelectedPlan, isYearly });
    setShowConfirmDialog(false);
  };

  const handleCancelPlanChange = () => {
    setPendingPlan(null);
    setSelectedPlanId(currentPlan.id);
    setSelectedBillingPeriod(currentBillingPeriod as 'monthly' | 'yearly');
    setShowConfirmDialog(false);
  };

  const getPendingPlanDetails = () => {
    if (!pendingPlan) return null;
    return plans.find(p => p.id === pendingPlan);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-billing-title">Suscripción y facturación</h1>
        <p className="text-muted-foreground">Gestiona tu plan, facturación e información fiscal</p>
      </div>

      {/* Current Plan Card */}
      <Card className={`${currentPlan.color} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <currentPlan.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={currentPlan.badgeColor} data-testid="badge-current-plan">
                    {currentPlan.name}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {billingInfo?.isYearlyBilling ? 'Facturación anual' : 'Facturación mensual'}
                  {billingInfo?.subscription?.cancel_at_period_end && (
                    <span className="text-orange-600 ml-2">(Cancela al finalizar el período)</span>
                  )}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entityType === 'agency' && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Límite de agentes</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-agents-limit">
                  {billingInfo?.seatsLimit === null || billingInfo?.seatsLimit === 999999 ? 'Sin límite' : billingInfo?.seatsLimit || 1}
                </p>
              </div>
            )}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Home className="h-4 w-4" />
                <span className="text-sm">Límite de propiedades</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-properties-limit">
                {billingInfo?.activePropertiesLimit === null || billingInfo?.activePropertiesLimit === 999999 ? 'Sin límite' : billingInfo?.activePropertiesLimit || 2}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Precio actual</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-current-price">
                {billingInfo?.isYearlyBilling 
                  ? `${currentPlan.yearlyPrice}€/año` 
                  : `${currentPlan.monthlyPrice}€/mes`}
              </p>
            </div>
          </div>

          {/* Change Plan and Billing Period Selectors */}
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plan Selector */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Plan</Label>
                <Select
                  value={effectiveSelectedPlan}
                  onValueChange={handlePlanSelect}
                  disabled={changePlanMutation.isPending}
                >
                  <SelectTrigger className="w-full flex justify-between" data-testid="select-plan">
                    <span className="text-left flex-1">{planLabels[effectiveSelectedPlan]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} data-testid={`select-plan-option-${plan.id}`}>
                        {planLabels[plan.id]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Billing Period Selector */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Período de facturación</Label>
                <Select
                  value={effectiveSelectedPeriod}
                  onValueChange={handleBillingPeriodSelect}
                  disabled={changePlanMutation.isPending}
                >
                  <SelectTrigger 
                    className="w-full flex justify-between" 
                    data-testid="select-billing-period"
                  >
                    <span className="text-left flex-1">
                      {effectiveSelectedPeriod === 'yearly' ? 'Anual' : 'Mensual'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="monthly" 
                      disabled={currentBillingPeriod === 'yearly'}
                      data-testid="select-billing-period-monthly"
                      title={currentBillingPeriod === 'yearly' ? 'Actualmente tienes un plan anual activo. Consulta la sección "Fecha de renovación"' : undefined}
                    >
                      Mensual
                      {currentBillingPeriod === 'yearly' && (
                        <span className="text-xs text-muted-foreground ml-2">(No disponible)</span>
                      )}
                    </SelectItem>
                    <SelectItem value="yearly" data-testid="select-billing-period-yearly">
                      Anual (ahorra 2 meses)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {currentBillingPeriod === 'yearly' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Actualmente tienes un plan anual activo. Consulta la sección "Fecha de renovación"
                  </p>
                )}
              </div>
            </div>

            {/* Confirm Button */}
            {hasAnyChange && (
              <div className="pt-2">
                <Button
                  onClick={handleConfirmClick}
                  disabled={changePlanMutation.isPending}
                  className="w-full md:w-auto"
                  data-testid="button-confirm-subscription-change"
                >
                  {changePlanMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar cambios'
                  )}
                </Button>
              </div>
            )}

            {changePlanMutation.isPending && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando cambio de suscripción...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison - Benefits of Superior Plans */}
      {superiorPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Beneficios de planes superiores
            </CardTitle>
            <CardDescription>
              Compara lo que obtendrías con un plan superior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Característica</TableHead>
                  <TableHead className="text-center">
                    <Badge className={currentPlan.badgeColor}>{currentPlan.name}</Badge>
                    <span className="block text-xs text-muted-foreground mt-1">(Actual)</span>
                  </TableHead>
                  {superiorPlans.map((plan) => (
                    <TableHead key={plan.id} className="text-center">
                      <Badge className={plan.badgeColor}>{plan.name}</Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entityType === 'agency' && (
                  <TableRow>
                    <TableCell className="font-medium">Límite de agentes</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const limit = (currentPlan as any).agentsLimit;
                        return limit === null ? 'Sin límite' : (limit || 'N/A');
                      })()}
                    </TableCell>
                    {superiorPlans.map((plan) => (
                      <TableCell key={plan.id} className="text-center font-semibold text-primary">
                        {(() => {
                          const limit = (plan as any).agentsLimit;
                          return limit === null ? 'Sin límite' : (limit || 'N/A');
                        })()}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium">Límite de propiedades</TableCell>
                  <TableCell className="text-center">
                    {currentPlan.propertiesLimit === null ? 'Sin límite' : currentPlan.propertiesLimit}
                  </TableCell>
                  {superiorPlans.map((plan) => (
                    <TableCell key={plan.id} className="text-center font-semibold text-primary">
                      {plan.propertiesLimit === null ? 'Sin límite' : plan.propertiesLimit}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Precio mensual</TableCell>
                  <TableCell className="text-center">{currentPlan.monthlyPrice}€</TableCell>
                  {superiorPlans.map((plan) => (
                    <TableCell key={plan.id} className="text-center">{plan.monthlyPrice}€</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Precio anual</TableCell>
                  <TableCell className="text-center">{currentPlan.yearlyPrice}€</TableCell>
                  {superiorPlans.map((plan) => (
                    <TableCell key={plan.id} className="text-center">{plan.yearlyPrice}€</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Renewal Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Fecha de renovación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Priority 1: Use Stripe subscription data if available
            if (billingInfo?.subscription?.current_period_end) {
              return (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg" data-testid="text-renewal-date">
                      {formatDate(billingInfo.subscription.current_period_end)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {billingInfo.subscription.cancel_at_period_end 
                        ? 'Tu suscripción finalizará en esta fecha'
                        : 'Tu suscripción se renovará automáticamente'
                      }
                    </p>
                  </div>
                </div>
              );
            }
            
            // Priority 2: Calculate from subscriptionStartDate if available
            if (billingInfo?.subscriptionStartDate && currentPlan.monthlyPrice > 0) {
              const startDate = new Date(billingInfo.subscriptionStartDate);
              const renewalDate = new Date(startDate);
              
              // Add 1 year or 1 month based on billing period
              if (billingInfo.isYearlyBilling) {
                renewalDate.setFullYear(renewalDate.getFullYear() + 1);
              } else {
                renewalDate.setMonth(renewalDate.getMonth() + 1);
              }
              
              // If renewal date is in the past, calculate next one from today
              const now = new Date();
              while (renewalDate < now) {
                if (billingInfo.isYearlyBilling) {
                  renewalDate.setFullYear(renewalDate.getFullYear() + 1);
                } else {
                  renewalDate.setMonth(renewalDate.getMonth() + 1);
                }
              }
              
              return (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg" data-testid="text-renewal-date">
                      {renewalDate.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tu suscripción se renovará automáticamente
                    </p>
                  </div>
                </div>
              );
            }
            
            // Priority 3: Show appropriate message for free plans or missing data
            return (
              <p className="text-muted-foreground" data-testid="text-no-renewal">
                {currentPlan.monthlyPrice === 0 
                  ? 'Estás en el plan gratuito - sin fecha de renovación'
                  : 'No hay fecha de renovación disponible'
                }
              </p>
            );
          })()}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Historial de facturas
          </CardTitle>
          <CardDescription>
            Tus facturas y pagos anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell>{formatDate(invoice.created)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                        className={invoice.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {invoice.status === 'paid' ? 'Pagada' : invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.amount_paid, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                          data-testid={`button-view-invoice-${invoice.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground" data-testid="text-no-invoices">
                No hay facturas disponibles todavía
              </p>
              {currentPlan.monthlyPrice === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Las facturas aparecerán cuando mejores a un plan de pago
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Información fiscal
          </CardTitle>
          <CardDescription>
            Datos para tus facturas (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">NIF/CIF</Label>
                <Input
                  id="taxId"
                  placeholder="Ej: B12345678"
                  value={taxInfo.taxId}
                  onChange={(e) => setTaxInfo({ ...taxInfo, taxId: e.target.value })}
                  data-testid="input-tax-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre o razón social</Label>
                <Input
                  id="businessName"
                  placeholder="Nombre de la empresa"
                  value={taxInfo.businessName}
                  onChange={(e) => setTaxInfo({ ...taxInfo, businessName: e.target.value })}
                  data-testid="input-business-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección fiscal</Label>
              <Input
                id="address"
                placeholder="Calle, número, código postal, ciudad"
                value={taxInfo.address}
                onChange={(e) => setTaxInfo({ ...taxInfo, address: e.target.value })}
                data-testid="input-tax-address"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Esta información se utilizará para generar tus facturas. Puedes actualizarla en cualquier momento.
            </p>
            <Button
              variant="outline"
              disabled
              className="opacity-50"
              data-testid="button-save-tax-info"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Guardar información fiscal
            </Button>
            <p className="text-xs text-muted-foreground italic">
              (Funcionalidad próximamente disponible)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Change Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={(open) => {
        if (!open) handleCancelPlanChange();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de suscripción</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Estás a punto de modificar tu suscripción:</p>
                
                {/* Plan Change */}
                {hasPlanChange && getPendingPlanDetails() && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cambio de plan:</p>
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-center">
                        <Badge className={currentPlan.badgeColor}>{currentPlan.name}</Badge>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center">
                        <Badge className={getPendingPlanDetails()!.badgeColor}>
                          {getPendingPlanDetails()!.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Period Change */}
                {hasPeriodChange && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cambio de período:</p>
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-center">
                        <Badge variant="outline">
                          {currentBillingPeriod === 'yearly' ? 'Anual' : 'Mensual'}
                        </Badge>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center">
                        <Badge variant="outline">
                          {effectiveSelectedPeriod === 'yearly' ? 'Anual' : 'Mensual'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-muted p-3 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Nuevo precio:</p>
                  <p className="text-lg font-bold">
                    {(() => {
                      const plan = getPendingPlanDetails() || currentPlan;
                      const isYearly = effectiveSelectedPeriod === 'yearly';
                      return isYearly 
                        ? `${plan.yearlyPrice}€/año`
                        : `${plan.monthlyPrice}€/mes`;
                    })()}
                  </p>
                </div>

                {/* Redirect message */}
                {(getPendingPlanDetails()?.monthlyPrice || 0) > 0 && (
                  <p className="text-sm text-center text-muted-foreground">
                    Serás redirigido a Stripe para completar el proceso de pago.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPlanChange} data-testid="button-cancel-plan-change">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPlanChange} data-testid="button-confirm-plan-change">
              Confirmar cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
