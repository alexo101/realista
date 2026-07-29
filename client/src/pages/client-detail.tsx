import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { MinusCircle, Plus, Search, ShieldAlert, Star, X, ChevronLeft } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useAutosave } from "@/hooks/use-autosave";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentEventForm } from "@/components/AgentEventForm";
import { ClientHistoryTimeline } from "@/components/ClientHistoryTimeline";
import { CitySearchSelect } from "@/components/CitySearchSelect";
import { SavedIndicator } from "@/components/SavedIndicator";
import { PROPERTY_FEATURES } from "@/utils/property-features";
import {
  searchNeighborhoods,
} from "@/utils/neighborhoods";
import {
  PREFERENCE_AVAILABILITY_OPTIONS,
  PREFERENCE_CONDITION_OPTIONS,
  PREFERENCE_FLOOR_OPTIONS,
  PREFERENCE_HOUSING_TYPE_OPTIONS,
  PREFERENCE_OPERATION_OPTIONS,
  PREFERENCE_PROPERTY_TYPE_OPTIONS,
  type PreferenceOption,
} from "@/utils/client-preference-options";
import type { AgentEvent, Client, ClientPropertyPreferences, ContactHistoryEntry } from "@shared/schema";

const CLIENT_STATUSES = [
  "Nuevo",
  "Seguimiento",
  "En visitas",
  "Cerrando",
  "Ganado",
  "Perdido",
] as const;

const CLIENT_STATUS_TRANSLATION_KEYS: Record<(typeof CLIENT_STATUSES)[number], string> = {
  Nuevo: "manage.client_status.new",
  Seguimiento: "manage.client_status.follow_up",
  "En visitas": "manage.client_status.visiting",
  Cerrando: "manage.client_status.closing",
  Ganado: "manage.client_status.won",
  Perdido: "manage.client_status.lost",
};

const CLIENT_TYPES = ["buyer", "tenant", "seller", "landlord"] as const;
type ClientType = (typeof CLIENT_TYPES)[number];

const CLIENT_TAGS: Record<ClientType, string[]> = {
  buyer: ["first_time_buyer", "investor", "cash_buyer", "financing_required", "foreign_buyer", "relocating", "urgent_purchase", "residential", "commercial", "buy_to_let", "fix_and_flip", "portfolio_expansion", "vip", "repeat_client", "referred", "high_priority", "responsive"],
  tenant: ["student", "professional", "family", "pet_owner", "relocating", "short_term_rental", "long_term_rental", "vip", "repeat_client", "referred", "high_priority", "responsive"],
  seller: ["urgent_sale", "already_purchased_another_property", "exclusive_listing", "open_to_negotiation", "investment_property", "vip", "repeat_client", "referred", "high_priority", "responsive"],
  landlord: ["investor", "first_time_landlord", "long_term_rental", "short_term_rental", "looking_for_property_management", "vip", "repeat_client", "referred", "high_priority", "responsive"],
};

export default function ClientDetailPage({ embedded = false }: { embedded?: boolean }) {
  const { user, isLoading: isLoadingUser } = useUser();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/gestionar/:agentUuid/clientes/:clientId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const clientId = Number(params?.clientId);
  const agentUuid = params?.agentUuid;
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    status: "Nuevo",
    clientType: null as string | null,
    tags: [] as string[],
    contactHistory: [] as ContactHistoryEntry[],
    propertyPreferences: null as ClientPropertyPreferences | null,
  });
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgentEvent | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [formReady, setFormReady] = useState(false);
  const initializedClientIdRef = useRef<number | null>(null);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) =>
      apiRequest("POST", "/api/agent-events", { agentId: user?.id, ...eventData }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/agents" &&
          query.queryKey[2] === "events",
      });
      setShowEventForm(false);
      toast({
        title: t("manage.client_history.interaction_saved"),
        description: t("manage.client_history.interaction_saved_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("manage.client_history.interaction_error"),
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }: { id: number; eventData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/agent-events/${id}`, {
        ...eventData,
        agentId: user?.id,
        clientId,
        propertyUuid: eventData.propertyUuid || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/agents" &&
          query.queryKey[2] === "events",
      });
      setEditingEvent(null);
      toast({
        title: t("manage.client_history.interaction_updated"),
        description: t("manage.client_history.interaction_updated_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("manage.client_history.interaction_update_error"),
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => apiRequest("DELETE", `/api/agent-events/${eventId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/agents" &&
          query.queryKey[2] === "events",
      });
      toast({
        title: t("manage.client_history.interaction_deleted"),
        description: t("manage.client_history.interaction_deleted_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("manage.client_history.interaction_delete_error"),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isLoadingUser) return;

    if (!user || !user.agentUuid) {
      navigate("/iniciar-sesion");
      return;
    }

    if (agentUuid !== user.agentUuid || !Number.isInteger(clientId)) {
      toast({
        title: "Acceso denegado",
        description: "No puedes acceder a este cliente.",
        variant: "destructive",
      });
      navigate(`/gestionar/${user.agentUuid}/mensajes`);
    }
  }, [agentUuid, clientId, isLoadingUser, navigate, toast, user]);

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    queryFn: () => apiRequest("GET", `/api/clients/${clientId}`),
    enabled: !!user?.agentUuid && agentUuid === user.agentUuid && Number.isInteger(clientId),
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: typeof formData) =>
      apiRequest("PATCH", `/api/clients/${clientId}`, {
        ...data,
        id: clientId,
        agentId: user?.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      await queryClient.invalidateQueries({ queryKey: [`/api/clients?agentId=${user?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios del cliente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!client) return;
    if (initializedClientIdRef.current === client.id) return;
    initializedClientIdRef.current = client.id;
    setFormData({
      name: client.name || "",
      surname: client.surname || "",
      email: client.email || "",
      phone: client.phone || "",
      status: client.status || "Nuevo",
      clientType: client.clientType || null,
      tags: client.tags || [],
      contactHistory: (client.contactHistory as ContactHistoryEntry[]) || [],
      propertyPreferences: client.propertyPreferences || null,
    });
    setFormReady(true);
  }, [client]);

  const { savedFields, markChanged } = useAutosave(
    formData,
    async (data) => {
      await updateClientMutation.mutateAsync(data);
    },
    { enabled: formReady },
  );

  const selectedType = useMemo(
    () => (CLIENT_TYPES.includes(formData.clientType as ClientType) ? (formData.clientType as ClientType) : null),
    [formData.clientType],
  );
  const showPreferencesTab = selectedType === "buyer" || selectedType === "tenant";

  useEffect(() => {
    if (!showPreferencesTab && activeTab === "preferences") {
      setActiveTab("profile");
    }
  }, [activeTab, showPreferencesTab]);

  const handleClientTypeChange = (value: ClientType) => {
    markChanged("clientType");
    markChanged("tags");
    setFormData((prev) => ({
      ...prev,
      clientType: value,
      tags: prev.tags.filter((tag) => CLIENT_TAGS[value].includes(tag)),
    }));
  };

  const toggleTag = (tag: string, checked: boolean) => {
    markChanged("tags");
    setFormData((prev) => ({
      ...prev,
      tags: checked ? Array.from(new Set([...prev.tags, tag])) : prev.tags.filter((value) => value !== tag),
    }));
  };

  const updatePropertyPreference = <K extends keyof ClientPropertyPreferences>(
    key: K,
    value: ClientPropertyPreferences[K],
  ) => {
    markChanged(`propertyPreferences.${String(key)}`);
    markChanged("propertyPreferences");
    setFormData((prev) => ({
      ...prev,
      propertyPreferences: {
        ...(prev.propertyPreferences || {}),
        [key]: value,
      },
    }));
  };

  const updatePropertyPreferences = (updates: Partial<ClientPropertyPreferences>) => {
    Object.keys(updates).forEach((key) => markChanged(`propertyPreferences.${key}`));
    markChanged("propertyPreferences");
    setFormData((prev) => ({
      ...prev,
      propertyPreferences: {
        ...(prev.propertyPreferences || {}),
        ...updates,
      },
    }));
  };

  if (isLoadingUser || !user || !user.agentUuid) {
    return <div className="flex items-center justify-center py-12 text-gray-500">Cargando...</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-500">Cargando información del cliente...</div>;
  }

  if (!client) {
    return <div className="flex items-center justify-center py-12 text-red-500">No se pudo cargar la información del cliente.</div>;
  }

  const content = (
      <div className={embedded ? "space-y-6" : "max-w-4xl mx-auto space-y-6"}>
        <button
          type="button"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          onClick={() => navigate(`/gestionar/${user.agentUuid}/clientes`)}
          data-testid="button-back-client-detail"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("manage.clients.back_to_list")}
        </button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="profile" className="flex-1" data-testid="tab-client-profile">
              {t("manage.client_profile.title")}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1" data-testid="tab-client-history">
              {t("manage.client_history.title")}
            </TabsTrigger>
            {showPreferencesTab && (
              <TabsTrigger value="preferences" className="flex-1" data-testid="tab-client-preferences">
                {t("manage.client_preferences.title")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <Card data-testid="card-client-edit-page">
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-name" className="inline-flex items-center">
                      {t("common.name")}
                      <SavedIndicator visible={savedFields.has("name")} />
                    </Label>
                    <Input
                      id="client-name"
                      value={formData.name}
                      onChange={(e) => {
                        markChanged("name");
                        setFormData((prev) => ({ ...prev, name: e.target.value }));
                      }}
                      data-testid="input-client-detail-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-surname" className="inline-flex items-center">
                      {t("common.surname")}
                      <SavedIndicator visible={savedFields.has("surname")} />
                    </Label>
                    <Input
                      id="client-surname"
                      value={formData.surname}
                      onChange={(e) => {
                        markChanged("surname");
                        setFormData((prev) => ({ ...prev, surname: e.target.value }));
                      }}
                      data-testid="input-client-detail-surname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-email" className="inline-flex items-center">
                      {t("common.email")}
                      <SavedIndicator visible={savedFields.has("email")} />
                    </Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        markChanged("email");
                        setFormData((prev) => ({ ...prev, email: e.target.value }));
                      }}
                      data-testid="input-client-detail-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-phone" className="inline-flex items-center">
                      {t("common.phone")}
                      <SavedIndicator visible={savedFields.has("phone")} />
                    </Label>
                    <Input
                      id="client-phone"
                      value={formData.phone}
                      onChange={(e) => {
                        markChanged("phone");
                        setFormData((prev) => ({ ...prev, phone: e.target.value }));
                      }}
                      data-testid="input-client-detail-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-status" className="inline-flex items-center">
                      {t("common.status")}
                      <SavedIndicator visible={savedFields.has("status")} />
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => {
                        markChanged("status");
                        setFormData((prev) => ({ ...prev, status: value }));
                      }}
                    >
                      <SelectTrigger id="client-status" data-testid="select-client-detail-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(CLIENT_STATUS_TRANSLATION_KEYS[status])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="client-type" className="inline-flex items-center">
                      {t("manage.client_type.label")}
                      <SavedIndicator visible={savedFields.has("clientType")} />
                    </Label>
                    <Select
                      value={formData.clientType || undefined}
                      onValueChange={(value) => handleClientTypeChange(value as ClientType)}
                    >
                      <SelectTrigger id="client-type" data-testid="select-client-detail-type">
                        <SelectValue placeholder={t("manage.client_type.placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">{t("manage.client_type.buyer")}</SelectItem>
                        <SelectItem value="tenant">{t("manage.client_type.tenant")}</SelectItem>
                        <SelectItem value="seller">{t("manage.client_type.seller")}</SelectItem>
                        <SelectItem value="landlord">{t("manage.client_type.landlord")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <Label className="inline-flex items-center">
                      {t("manage.client_tags.label")}
                      <SavedIndicator visible={savedFields.has("tags")} />
                    </Label>
                    <span className="text-xs text-muted-foreground">{t("manage.client_tags.recommendation")}</span>
                  </div>
                  {!selectedType ? (
                    <p className="text-sm text-muted-foreground mt-2">{t("manage.client_tags.select_type")}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {CLIENT_TAGS[selectedType].map((tag) => (
                        <label key={tag} className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={formData.tags.includes(tag)}
                            onCheckedChange={(checked) => toggleTag(tag, checked === true)}
                          />
                          <span>{t(`manage.client_tag.${tag}`)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ClientHistoryTimeline
              clientId={clientId}
              agentId={user.id}
              onEditEvent={(event) => {
                setShowEventForm(false);
                setEditingEvent(event);
              }}
              onDeleteEvent={(event) => deleteEventMutation.mutate(event.id)}
              headerAction={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingEvent(null);
                    setShowEventForm(!showEventForm);
                  }}
                  className="text-primary"
                  data-testid="button-toggle-event-form"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showEventForm ? t("common.cancel") : t("manage.client_history.add_interaction")}
                </Button>
              }
            >
              {(showEventForm || editingEvent) && (
                <div className="mb-4">
                  <AgentEventForm
                    agentId={user.id}
                    event={editingEvent}
                    defaultClientId={clientId}
                    hideClientField
                    onSubmit={(eventData) => {
                      if (editingEvent) {
                        updateEventMutation.mutate({ id: editingEvent.id, eventData });
                      } else {
                        createEventMutation.mutate({
                          ...eventData,
                          clientId,
                          propertyUuid: eventData.propertyUuid,
                        });
                      }
                    }}
                    onCancel={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                    }}
                    isLoading={createEventMutation.isPending || updateEventMutation.isPending}
                  />
                </div>
              )}
            </ClientHistoryTimeline>
          </TabsContent>

          {showPreferencesTab && (
            <TabsContent value="preferences" className="mt-0">
              <Card data-testid="card-client-preferences">
                <CardContent className="space-y-5 pt-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <PreferenceSelect
                      label={t("manage.client_preferences.operation")}
                      value={formData.propertyPreferences?.operationType}
                      options={PREFERENCE_OPERATION_OPTIONS}
                      onChange={(value) => updatePropertyPreference("operationType", value)}
                      showSaved={savedFields.has("propertyPreferences.operationType")}
                      t={t}
                    />
                    <PreferenceSelect
                      label={t("manage.client_preferences.property_type")}
                      value={formData.propertyPreferences?.propertyType}
                      options={PREFERENCE_PROPERTY_TYPE_OPTIONS}
                      onChange={(value) => {
                        updatePropertyPreference("propertyType", value);
                        if (value !== "Vivienda") {
                          updatePropertyPreference("housingType", null);
                        }
                      }}
                      showSaved={savedFields.has("propertyPreferences.propertyType")}
                      t={t}
                    />
                    {formData.propertyPreferences?.propertyType === "Vivienda" && (
                      <PreferenceSelect
                        label={t("manage.client_preferences.housing_type")}
                        value={formData.propertyPreferences?.housingType}
                        options={PREFERENCE_HOUSING_TYPE_OPTIONS}
                        onChange={(value) => updatePropertyPreference("housingType", value)}
                        showSaved={savedFields.has("propertyPreferences.housingType")}
                        t={t}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PreferenceNumber label={t("manage.client_preferences.min_price")} value={formData.propertyPreferences?.minPrice} onChange={(value) => updatePropertyPreference("minPrice", value)} showSaved={savedFields.has("propertyPreferences.minPrice")} />
                    <PreferenceNumber label={t("manage.client_preferences.max_price")} value={formData.propertyPreferences?.maxPrice} onChange={(value) => updatePropertyPreference("maxPrice", value)} showSaved={savedFields.has("propertyPreferences.maxPrice")} />
                    <PreferenceNumber label={t("manage.client_preferences.bedrooms")} value={formData.propertyPreferences?.bedrooms} onChange={(value) => updatePropertyPreference("bedrooms", value)} showSaved={savedFields.has("propertyPreferences.bedrooms")} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="inline-flex items-center">
                        {t("manage.client_preferences.city")}
                        <SavedIndicator visible={savedFields.has("propertyPreferences.city")} />
                      </Label>
                      <CitySearchSelect
                        value={formData.propertyPreferences?.city}
                        placeholder={t("manage.client_preferences.select_placeholder")}
                        onChange={(value) => {
                          updatePropertyPreference("city", value);
                          updatePropertyPreference("neighborhood", null);
                        }}
                        testId="input-client-city-search"
                      />
                    </div>

                    <NeighborhoodPreferenceInput
                      label={t("manage.client_preferences.neighborhood")}
                      value={formData.propertyPreferences?.neighborhood}
                      city={formData.propertyPreferences?.city}
                      onCityChange={(value) => updatePropertyPreference("city", value)}
                      onChange={(value) => updatePropertyPreference("neighborhood", value)}
                      showSaved={savedFields.has("propertyPreferences.neighborhood")}
                      t={t}
                    />
                  </div>

                  <div className="space-y-5 border-t pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PreferenceSelect label={t("manage.client_preferences.floor")} value={formData.propertyPreferences?.floor} options={PREFERENCE_FLOOR_OPTIONS} onChange={(value) => updatePropertyPreference("floor", value)} showSaved={savedFields.has("propertyPreferences.floor")} t={t} />
                      <PreferenceSelect label={t("manage.client_preferences.condition")} value={formData.propertyPreferences?.propertyCondition} options={PREFERENCE_CONDITION_OPTIONS} onChange={(value) => updatePropertyPreference("propertyCondition", value)} showSaved={savedFields.has("propertyPreferences.propertyCondition")} t={t} />
                      <PreferenceSelect label={t("manage.client_preferences.availability")} value={formData.propertyPreferences?.availability} options={PREFERENCE_AVAILABILITY_OPTIONS} onChange={(value) => updatePropertyPreference("availability", value)} showSaved={savedFields.has("propertyPreferences.availability")} t={t} />
                      <PreferenceDate label={t("manage.client_preferences.availability_date")} value={formData.propertyPreferences?.availabilityDate} onChange={(value) => updatePropertyPreference("availabilityDate", value)} showSaved={savedFields.has("propertyPreferences.availabilityDate")} />
                    </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <PreferenceNumber label={t("manage.client_preferences.bathrooms")} value={formData.propertyPreferences?.bathrooms} onChange={(value) => updatePropertyPreference("bathrooms", value)} showSaved={savedFields.has("propertyPreferences.bathrooms")} />
                        <PreferenceNumber label={t("manage.client_preferences.min_area")} value={formData.propertyPreferences?.minArea} onChange={(value) => updatePropertyPreference("minArea", value)} showSaved={savedFields.has("propertyPreferences.minArea")} />
                        <PreferenceNumber label={t("manage.client_preferences.max_area")} value={formData.propertyPreferences?.maxArea} onChange={(value) => updatePropertyPreference("maxArea", value)} showSaved={savedFields.has("propertyPreferences.maxArea")} />
                      </div>

                      <PreferenceFeatureClassifier
                        features={PROPERTY_FEATURES}
                        preferred={formData.propertyPreferences?.preferredFeatures
                          || formData.propertyPreferences?.features
                          || []}
                        essential={formData.propertyPreferences?.essentialFeatures || []}
                        onChange={({ preferredFeatures, essentialFeatures }) => {
                          updatePropertyPreferences({
                            preferredFeatures,
                            essentialFeatures,
                            // Keep legacy features as the union for backward compatibility.
                            features: Array.from(new Set([...preferredFeatures, ...essentialFeatures])),
                          });
                        }}
                        showSaved={
                          savedFields.has("propertyPreferences.preferredFeatures")
                          || savedFields.has("propertyPreferences.essentialFeatures")
                          || savedFields.has("propertyPreferences.features")
                        }
                        t={t}
                      />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-8 px-4">
      {content}
    </main>
  );
}

function PreferenceSelect({
  label,
  value,
  options,
  onChange,
  showSaved = false,
  t,
}: {
  label: string;
  value?: string | null;
  options: PreferenceOption[];
  onChange: (value: string | null) => void;
  showSaved?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div>
      <Label className="inline-flex items-center">
        {label}
        <SavedIndicator visible={showSaved} />
      </Label>
      <Select value={value || undefined} onValueChange={(selected) => onChange(selected || null)}>
        <SelectTrigger>
          <SelectValue placeholder={t("manage.client_preferences.select_placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PreferenceNumber({
  label,
  value,
  onChange,
  showSaved = false,
}: {
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  showSaved?: boolean;
}) {
  return (
    <div>
      <Label className="inline-flex items-center">
        {label}
        <SavedIndicator visible={showSaved} />
      </Label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      />
    </div>
  );
}

type FeatureInterest = "none" | "preferred" | "essential";

function PreferenceFeatureClassifier({
  features,
  preferred,
  essential,
  onChange,
  showSaved = false,
  t,
}: {
  features: readonly { id: string; label: string }[];
  preferred: string[];
  essential: string[];
  onChange: (value: { preferredFeatures: string[]; essentialFeatures: string[] }) => void;
  showSaved?: boolean;
  t: (key: string) => string;
}) {
  const essentialIds = useMemo(
    () => new Set(essential.filter((id) => features.some((feature) => feature.id === id))),
    [essential, features],
  );
  const preferredIds = useMemo(
    () => new Set(
      preferred.filter(
        (id) => features.some((feature) => feature.id === id) && !essentialIds.has(id),
      ),
    ),
    [preferred, features, essentialIds],
  );

  const columns: Record<FeatureInterest, typeof features[number][]> = {
    none: features.filter((feature) => !preferredIds.has(feature.id) && !essentialIds.has(feature.id)),
    preferred: features.filter((feature) => preferredIds.has(feature.id)),
    essential: features.filter((feature) => essentialIds.has(feature.id)),
  };

  const moveFeature = (featureId: string, interest: FeatureInterest) => {
    const nextPreferred = new Set(preferredIds);
    const nextEssential = new Set(essentialIds);
    nextPreferred.delete(featureId);
    nextEssential.delete(featureId);

    if (interest === "preferred") nextPreferred.add(featureId);
    if (interest === "essential") nextEssential.add(featureId);

    onChange({
      preferredFeatures: Array.from(nextPreferred),
      essentialFeatures: Array.from(nextEssential),
    });
  };

  const destinationOrder: FeatureInterest[] = ["none", "preferred", "essential"];
  const destinationIcons: Record<FeatureInterest, React.ReactNode> = {
    none: <MinusCircle className="h-3.5 w-3.5" />,
    preferred: <Star className="h-3.5 w-3.5" />,
    essential: <ShieldAlert className="h-3.5 w-3.5" />,
  };
  const destinationClasses: Record<FeatureInterest, string> = {
    none: "text-muted-foreground hover:bg-muted",
    preferred: "text-blue-600 hover:bg-blue-50 hover:text-blue-700",
    essential: "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
  };

  const columnMeta: Record<
    FeatureInterest,
    { titleKey: string; icon: React.ReactNode; className: string }
  > = {
    none: {
      titleKey: "manage.client_preferences.features_none",
      icon: <MinusCircle className="h-4 w-4" />,
      className: "border-muted bg-muted/30",
    },
    preferred: {
      titleKey: "manage.client_preferences.features_preferred",
      icon: <Star className="h-4 w-4" />,
      className: "border-blue-200 bg-blue-50/60",
    },
    essential: {
      titleKey: "manage.client_preferences.features_essential",
      icon: <ShieldAlert className="h-4 w-4" />,
      className: "border-rose-200 bg-rose-50/60",
    },
  };

  return (
    <div>
      <Label className="inline-flex items-center">
        {t("manage.client_preferences.features")}
        <SavedIndicator visible={showSaved} />
      </Label>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {(["none", "preferred", "essential"] as FeatureInterest[]).map((column) => {
          const meta = columnMeta[column];
          return (
            <div key={column} className={`rounded-lg border p-3 ${meta.className}`}>
              <div className="mb-3 flex items-start gap-2">
                <div className="mt-0.5 text-foreground/80">{meta.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold">{t(meta.titleKey)}</h4>
                </div>
              </div>
              <div className="space-y-2">
                {columns[column].length === 0 ? (
                  <p className="rounded-md border border-dashed bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
                    {t("manage.client_preferences.features_empty")}
                  </p>
                ) : (
                  columns[column].map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-2 text-sm shadow-sm"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {t(`manage.property_feature.${feature.id}`)}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {destinationOrder
                          .filter((destination) => destination !== column)
                          .map((destination) => (
                            <Button
                              key={destination}
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${destinationClasses[destination]}`}
                              title={t(`manage.client_preferences.features_${destination}`)}
                              onClick={() => moveFeature(feature.id, destination)}
                            >
                              {destinationIcons[destination]}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NeighborhoodPreferenceInput({
  label,
  value,
  city,
  onCityChange,
  onChange,
  showSaved = false,
  t,
}: {
  label: string;
  value?: string | string[] | null;
  city?: string | null;
  onCityChange: (value: string | null) => void;
  onChange: (value: string[] | null) => void;
  showSaved?: boolean;
  t: (key: string) => string;
}) {
  const selectedNeighborhoods = Array.isArray(value) ? value : value ? [value] : [];
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    setSearchValue("");
    setShowSuggestions(false);
  }, [city, selectedNeighborhoods.join("|")]);

  const suggestions = searchNeighborhoods(searchValue, city || undefined);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setShowSuggestions(false);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous < suggestions.length - 1 ? previous + 1 : previous,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previous) => (previous > 0 ? previous - 1 : 0));
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      const selectedLocation = suggestions[highlightedIndex];
      setSearchValue("");
      if (!city || selectedLocation.city !== city) onCityChange(selectedLocation.city);
      onChange(Array.from(new Set([...selectedNeighborhoods, selectedLocation.neighborhood])));
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Label className="inline-flex items-center">
        {label}
        <SavedIndicator visible={showSaved} />
      </Label>
      {selectedNeighborhoods.length > 0 && (
        <div className="mt-1 mb-2 flex flex-wrap gap-2">
          {selectedNeighborhoods.map((neighborhood) => (
            <span
              key={neighborhood}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
            >
              {neighborhood}
              {city && <span className="text-muted-foreground">({city})</span>}
              <button
                type="button"
                aria-label={`Remove ${neighborhood} neighborhood preference`}
                className="hover:text-red-500"
                onClick={() =>
                  onChange(selectedNeighborhoods.filter((item) => item !== neighborhood))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={searchValue}
          placeholder={t("manage.client_preferences.neighborhood_placeholder")}
          className="pl-9"
          onChange={(event) => {
            const nextValue = event.target.value;
            setSearchValue(nextValue);
            setHighlightedIndex(-1);
            setShowSuggestions(Boolean(city));
          }}
          onFocus={() => {
            setHighlightedIndex(-1);
            setShowSuggestions(Boolean(city));
          }}
          onKeyDown={handleKeyDown}
          onBlur={() =>
            setTimeout(() => {
              setShowSuggestions(false);
              setSearchValue("");
            }, 150)
          }
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.city}-${suggestion.district}-${suggestion.neighborhood}`}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                highlightedIndex === index ? "bg-gray-100" : ""
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => {
                setSearchValue("");
                if (!city || suggestion.city !== city) onCityChange(suggestion.city);
                onChange(Array.from(new Set([...selectedNeighborhoods, suggestion.neighborhood])));
                setShowSuggestions(false);
              }}
            >
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              {suggestion.neighborhood}
              {!city && <span className="text-gray-500">({suggestion.city})</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PreferenceDate({
  label,
  value,
  onChange,
  showSaved = false,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  showSaved?: boolean;
}) {
  return (
    <div>
      <Label className="inline-flex items-center">
        {label}
        <SavedIndicator visible={showSaved} />
      </Label>
      <Input type="date" value={value || ""} onChange={(event) => onChange(event.target.value || null)} />
    </div>
  );
}
