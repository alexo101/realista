import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Users, Building, MessageSquare, Sparkles, User, Loader2, CreditCard, ArrowRight, ExternalLink, Network } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { useUser } from "@/contexts/user-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Footer } from "@/components/Footer";

const agencyPlanDefs = [
  {
    id: "basica",
    nameKey: "plan.basic_agency",
    monthlyPrice: 0,
    yearlyPrice: 0,
    descriptionKey: "plan.basic_agency_desc",
    features: [
      "plan.feature.basic_main_agent",
      "plan.feature.crm",
      "plan.feature.2_properties",
      "plan.feature.no_reviews"
    ],
    icon: Building,
    color: "bg-gray-50 border-gray-200"
  },
  {
    id: "pequeña",
    nameKey: "plan.small_agency",
    monthlyPrice: 29,
    yearlyPrice: 290,
    descriptionKey: "plan.small_agency_desc",
    features: [
      "plan.feature.2_public_profiles",
      "plan.feature.crm",
      "plan.feature.10_properties",
      "plan.feature.unlimited_clients",
      "plan.feature.unlimited_reviews",
      "plan.feature.ai_benefits"
    ],
    icon: Users,
    color: "bg-blue-50 border-blue-200"
  },
  {
    id: "mediana",
    nameKey: "plan.medium_agency",
    monthlyPrice: 79,
    yearlyPrice: 790,
    descriptionKey: "plan.medium_agency_desc",
    features: [
      "plan.feature.6_agents",
      "plan.feature.crm",
      "plan.feature.30_properties",
      "plan.feature.unlimited_clients",
      "plan.feature.unlimited_reviews",
      "plan.feature.ai_benefits"
    ],
    icon: Star,
    color: "bg-green-50 border-green-200"
  },
  {
    id: "lider",
    nameKey: "plan.leader_agency",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    descriptionKey: "plan.leader_agency_desc",
    features: [
      "plan.feature.unlimited_agents",
      "plan.feature.crm",
      "plan.feature.unlimited_properties",
      "plan.feature.unlimited_clients",
      "plan.feature.unlimited_reviews",
      "plan.feature.ai_benefits"
    ],
    icon: Sparkles,
    color: "bg-purple-50 border-purple-200"
  }
];

const agentPlanDefs = [
  {
    id: "basico",
    nameKey: "plan.basic_agent",
    monthlyPrice: 0,
    yearlyPrice: 0,
    descriptionKey: "plan.basic_agent_desc",
    features: [
      "plan.feature.agent_basic_profile",
      "plan.feature.crm",
      "plan.feature.2_properties",
      "plan.feature.no_reviews"
    ],
    icon: User,
    color: "bg-gray-50 border-gray-200"
  },
  {
    id: "lider",
    nameKey: "plan.leader_agent",
    monthlyPrice: 20,
    yearlyPrice: 200,
    descriptionKey: "plan.leader_agent_desc",
    features: [
      "plan.feature.agent_pro_profile",
      "plan.feature.crm",
      "plan.feature.10_properties",
      "plan.feature.unlimited_clients",
      "plan.feature.unlimited_reviews",
      "plan.feature.ai_benefits"
    ],
    icon: Sparkles,
    color: "bg-blue-50 border-blue-200"
  }
];

const networkPlanDefs = [
  {
    id: "red_agencias",
    nameKey: "plan.network",
    monthlyPrice: 0,
    yearlyPrice: 0,
    isUsageBased: true,
    descriptionKey: "plan.network_desc",
    pricingModelKey: "realista_pro.network_pricing",
    pricingDetails: [
      { planKey: "plan.small_label", price: 29 },
      { planKey: "plan.medium_label", price: 79 },
      { planKey: "plan.leader_label", price: 249 }
    ],
    features: [
      "plan.feature.network_unlimited_agencies",
      "plan.feature.network_central_panel",
      "plan.feature.network_consolidated_stats",
      "plan.feature.network_branding",
      "plan.feature.network_billing",
      "plan.feature.network_priority_support",
      "plan.feature.network_api"
    ],
    icon: Network,
    color: "bg-orange-50 border-orange-300"
  }
];

interface BillingInfo {
  currentPlan: string;
  isYearlyBilling: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  seatsLimit?: number;
  activePropertiesLimit?: number;
  subscription?: any;
}

interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  metadata?: any;
  prices: {
    id: string;
    unit_amount: number;
    currency: string;
    recurring?: { interval: string };
  }[];
}

export default function RealistaPro() {
  const [isYearly, setIsYearly] = useState(false);
  const [profileType, setProfileType] = useState<"agencies" | "agents" | "networks">("agencies");
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useUser();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const isSuccess = searchParams.get('success') === 'true';
  const isCancelled = searchParams.get('cancelled') === 'true';
  
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: t("realista_pro.subscription_activated_title"),
        description: t("realista_pro.subscription_activated_desc"),
      });
      window.history.replaceState({}, '', '/realista-pro');
    }
    if (isCancelled) {
      toast({
        title: t("realista_pro.subscription_cancelled_title"),
        description: t("realista_pro.subscription_cancelled_desc"),
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/realista-pro');
    }
  }, [isSuccess, isCancelled, t, toast]);

  const entityType = user?.isAdmin ? 'agency' : 
                     (user?.isAgent ? 'agent' : null);
  const entityId = user?.id || null;

  const { data: billingData, isLoading: billingLoading, refetch: refetchBilling } = useQuery<BillingInfo>({
    queryKey: ['/api/stripe/billing', entityType, entityId],
    enabled: !!entityType && !!entityId,
  });

  const { data: agencyProducts } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ['/api/stripe/products/agency'],
  });

  const { data: agentProducts } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ['/api/stripe/products/agent'],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, entityType, entityId }: { priceId: string; entityType: string; entityId: number }) => {
      const response = await apiRequest('POST', '/api/stripe/checkout', { priceId, entityType, entityId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: t("realista_pro.error_title"),
        description: error.message || t("realista_pro.error_checkout"),
        variant: "destructive",
      });
    },
  });

  const freeActivationMutation = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: string; entityId: number }) => {
      const response = await apiRequest('POST', '/api/stripe/activate-free-tier', { entityType, entityId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("realista_pro.free_plan_activated_title"),
        description: t("realista_pro.free_plan_activated_desc"),
      });
      refetchBilling();
    },
    onError: (error: any) => {
      toast({
        title: t("realista_pro.error_title"),
        description: error.message || t("realista_pro.error_free_plan"),
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest('POST', '/api/stripe/portal', { customerId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: t("realista_pro.error_title"),
        description: error.message || t("realista_pro.error_billing_portal"),
        variant: "destructive",
      });
    },
  });
  
  const currentPlanDefs = profileType === "agencies" ? agencyPlanDefs :
                          profileType === "agents" ? agentPlanDefs : networkPlanDefs;
  const currentPlans = currentPlanDefs.map((plan) => ({
    ...plan,
    name: t((plan as any).nameKey),
    description: t((plan as any).descriptionKey),
    pricingModel: (plan as any).pricingModelKey ? t((plan as any).pricingModelKey) : undefined,
    pricingDetails: (plan as any).pricingDetails?.map((detail: any) => ({
      ...detail,
      plan: t(detail.planKey),
    })),
    features: plan.features.map((feature) => t(feature)),
  }));
  const products = profileType === "agencies" ? agencyProducts?.products : 
                   profileType === "agents" ? agentProducts?.products : null;
  
  const getDisplayPrice = (plan: any) => {
    if (plan.monthlyPrice === 0) return t("realista_pro.free");
    
    if (isYearly) {
      const monthlyEquivalent = Math.floor(plan.yearlyPrice / 12);
      return `${monthlyEquivalent}€`;
    }
    return `${plan.monthlyPrice}€`;
  };

  const findPriceId = (planId: string): string | null => {
    if (!products) return null;
    
    const product = products.find(p => {
      const metadata = p.metadata as any;
      return metadata?.planId === planId;
    });
    
    if (!product) return null;
    
    const interval = isYearly ? 'year' : 'month';
    const price = product.prices.find(p => p.recurring?.interval === interval);
    
    return price?.id || null;
  };

  const handlePlanSelection = (plan: any) => {
    if (!user) {
      const billing = isYearly ? "yearly" : "monthly";
      
      const registrationPath = profileType === "agencies" 
        ? `/agency-plan-register/${plan.id}/${billing}`
        : profileType === "agents"
        ? `/agent-plan-register/${plan.id}/${billing}`
        : `/network-plan-register/${plan.id}/${billing}`;
      
      navigate(registrationPath);
      return;
    }

    if (!entityType || !entityId) {
      toast({
        title: t("realista_pro.error_title"),
        description: t("realista_pro.error_profile"),
        variant: "destructive",
      });
      return;
    }

    if (plan.monthlyPrice === 0) {
      freeActivationMutation.mutate({ entityType, entityId });
      return;
    }

    const priceId = findPriceId(plan.id);
    if (!priceId) {
      toast({
        title: t("realista_pro.error_title"),
        description: t("realista_pro.error_price"),
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate({ priceId, entityType, entityId });
  };

  const handleManageSubscription = () => {
    if (billingData?.stripeCustomerId) {
      portalMutation.mutate(billingData.stripeCustomerId);
    }
  };

  const billing = billingData;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex-1">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              {t('realista_pro.title')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('realista_pro.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              <span>{t('realista_pro.crm')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span>{t('realista_pro.ai')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>{t('realista_pro.reviews')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Subscription Info */}
      {user && entityType && billing && (
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("realista_pro.current_subscription")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {billing.currentPlan?.charAt(0).toUpperCase() + billing.currentPlan?.slice(1) || t("plan.basic_agent")}
                    </Badge>
                    {billing.isYearlyBilling && (
                      <Badge variant="outline">{t("realista_pro.annual")}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {entityType === 'agency' && billing.seatsLimit && (
                      <span>{t("realista_pro.up_to")} {billing.seatsLimit === 999 ? t("realista_pro.unlimited") : billing.seatsLimit} {t("realista_pro.agents_label")} • </span>
                    )}
                    {t("realista_pro.up_to")} {billing.activePropertiesLimit === 999 ? t("realista_pro.unlimited") : billing.activePropertiesLimit} {t("realista_pro.properties")}
                  </p>
                </div>
                {billing.stripeCustomerId && (
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={portalMutation.isPending}
                    data-testid="button-manage-subscription"
                  >
                    {portalMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    {t("realista_pro.manage_billing")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('realista_pro.choose_plan')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('realista_pro.flexible_plans')}
          </p>
        </div>

        {/* Profile Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-lg border shadow-sm flex flex-wrap justify-center">
            <Button
              variant={profileType === "agencies" ? "default" : "ghost"}
              onClick={() => setProfileType("agencies")}
              className="px-6 py-2"
              data-testid="button-profile-agencies"
            >
              <Building className="h-4 w-4 mr-2" />
              {t('realista_pro.agencies')}
            </Button>
            <Button
              variant={profileType === "agents" ? "default" : "ghost"}
              onClick={() => setProfileType("agents")}
              className="px-6 py-2"
              data-testid="button-profile-agents"
            >
              <User className="h-4 w-4 mr-2" />
              {t('realista_pro.agents')}
            </Button>
            <Button
              variant={profileType === "networks" ? "default" : "ghost"}
              onClick={() => setProfileType("networks")}
              className="px-6 py-2"
              data-testid="button-profile-networks"
            >
              <Network className="h-4 w-4 mr-2" />
              {t("realista_pro.networks")}
            </Button>
          </div>
        </div>

        {/* Billing Toggle - Hidden for Networks (monthly only) */}
        {profileType !== "networks" && (
          <div className="flex justify-center items-center gap-4 mb-12">
            <span className={`text-lg ${!isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              {t('realista_pro.monthly')}
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="scale-125"
              data-testid="switch-billing-period"
            />
            <span className={`text-lg ${isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              {t('realista_pro.yearly')}
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">{t("realista_pro.two_months_free")}</Badge>
            )}
          </div>
        )}

        <div className={`grid gap-8 max-w-7xl mx-auto ${
          profileType === "agents" ? "grid-cols-1 md:grid-cols-2 max-w-4xl" : 
          profileType === "networks" ? "grid-cols-1 max-w-xl" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}>
          {currentPlans.map((plan) => {
            const IconComponent = plan.icon;
            const displayPrice = getDisplayPrice(plan);
            const isCurrentPlan = billing?.currentPlan === plan.id;
            const isPending = checkoutMutation.isPending || freeActivationMutation.isPending;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full ${plan.color} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {t("realista_pro.current_plan")}
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.id === 'basica' || plan.id === 'basico' ? 'bg-gray-200' :
                      plan.id === 'pequeña' ? 'bg-blue-200' :
                      plan.id === 'mediana' ? 'bg-green-200' : 
                      plan.id === 'lider' ? 'bg-purple-200' :
                      plan.id === 'red_agencias' ? 'bg-orange-200' : 'bg-blue-200'
                    }`}>
                      <IconComponent className={`h-8 w-8 ${
                        plan.id === 'basica' || plan.id === 'basico' ? 'text-gray-600' :
                        plan.id === 'pequeña' ? 'text-blue-600' :
                        plan.id === 'mediana' ? 'text-green-600' : 
                        plan.id === 'lider' ? 'text-purple-600' :
                        plan.id === 'red_agencias' ? 'text-orange-600' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">{plan.description}</CardDescription>
                  <div className="text-center mt-4">
                    {'isUsageBased' in plan && plan.isUsageBased ? (
                      <>
                        <span className="text-xl font-bold text-orange-600">{'pricingModel' in plan ? String(plan.pricingModel) : ''}</span>
                        <div className="mt-3 space-y-1 text-sm">
                          {'pricingDetails' in plan && (plan.pricingDetails as { plan: string; price: number }[]).map((detail, idx) => (
                            <div key={idx} className="flex justify-between px-4">
                              <span className="text-muted-foreground">{t("realista_pro.agency_label")} {detail.plan}:</span>
                              <span className="font-semibold">{detail.price}€{t("realista_pro.per_month")}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{t("realista_pro.monthly_only")}</p>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">{displayPrice}</span>
                        <span className="text-muted-foreground">{t('realista_pro.per_month')}</span>
                        {isYearly && plan.monthlyPrice > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {t("realista_pro.billed_annually_prefix")} {plan.yearlyPrice}€
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="mt-auto">
                  {'isUsageBased' in plan && plan.isUsageBased ? (
                    <Button 
                      className="w-full text-lg py-6 bg-orange-600 hover:bg-orange-700"
                      size="lg"
                      onClick={() => navigate('/registro-plan-red')}
                      data-testid={`button-select-plan-${plan.id}`}
                    >
                      {t("realista_pro.network_register")}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                      size="lg"
                      onClick={() => handlePlanSelection(plan)}
                      disabled={isCurrentPlan || isPending}
                      data-testid={`button-select-plan-${plan.id}`}
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isCurrentPlan ? (
                        t("realista_pro.current_plan")
                      ) : plan.monthlyPrice === 0 ? (
                        t('realista_pro.start_free')
                      ) : (
                        <>
                          {t('realista_pro.start_now')}
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12">{t('realista_pro.ai_features')}</h3>
          <div className="grid grid-cols-1 gap-8 max-w-md mx-auto">
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">{t('realista_pro.auto_descriptions')}</h4>
              <p className="text-muted-foreground">
                {t('realista_pro.auto_descriptions_desc')}
              </p>
            </Card>
          </div>
        </div>
      </div>
      </div>
      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
