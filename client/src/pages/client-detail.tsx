import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Save, Search, User, X } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROPERTY_FEATURES } from "@/utils/property-features";
import {
  getCities,
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
import type { Client, ClientPropertyPreferences, ContactHistoryEntry, Property, PropertyContract } from "@shared/schema";

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

export default function ClientDetailPage() {
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

  const { data: contractHistory = [], isLoading: isLoadingContractHistory } = useQuery<
    Array<{ contract: PropertyContract; property: Property }>
  >({
    queryKey: [`/api/clients/${clientId}/contracts`],
    queryFn: () => apiRequest("GET", `/api/clients/${clientId}/contracts`),
    enabled: !!user?.agentUuid && agentUuid === user.agentUuid && Number.isInteger(clientId),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const updateClientMutation = useMutation({
    mutationFn: async () =>
      apiRequest("PATCH", `/api/clients/${clientId}`, {
        ...formData,
        id: clientId,
        agentId: user?.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      toast({
        title: "Cliente actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
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
  }, [client]);

  const selectedType = useMemo(
    () => (CLIENT_TYPES.includes(formData.clientType as ClientType) ? (formData.clientType as ClientType) : null),
    [formData.clientType],
  );

  const handleClientTypeChange = (value: ClientType) => {
    setFormData((prev) => ({
      ...prev,
      clientType: value,
      tags: prev.tags.filter((tag) => CLIENT_TAGS[value].includes(tag)),
    }));
  };

  const toggleTag = (tag: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tags: checked ? Array.from(new Set([...prev.tags, tag])) : prev.tags.filter((value) => value !== tag),
    }));
  };

  const updatePropertyPreference = <K extends keyof ClientPropertyPreferences>(
    key: K,
    value: ClientPropertyPreferences[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      propertyPreferences: {
        ...(prev.propertyPreferences || {}),
        [key]: value,
      },
    }));
  };

  if (isLoadingUser || !user || !user.agentUuid) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando información del cliente...</div>;
  }

  if (!client) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">No se pudo cargar la información del cliente.</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate(`/gestionar/${user.agentUuid}/clientes`)}
          data-testid="button-back-client-detail"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("manage.clients.back_to_list")}
        </Button>

        <Card data-testid="card-client-edit-page">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil del cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-name">{t("common.name")}</Label>
                <Input
                  id="client-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  data-testid="input-client-detail-name"
                />
              </div>
              <div>
                <Label htmlFor="client-surname">{t("common.surname")}</Label>
                <Input
                  id="client-surname"
                  value={formData.surname}
                  onChange={(e) => setFormData((prev) => ({ ...prev, surname: e.target.value }))}
                  data-testid="input-client-detail-surname"
                />
              </div>
              <div>
                <Label htmlFor="client-email">{t("common.email")}</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  data-testid="input-client-detail-email"
                />
              </div>
              <div>
                <Label htmlFor="client-phone">{t("common.phone")}</Label>
                <Input
                  id="client-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-client-detail-phone"
                />
              </div>
              <div>
                <Label htmlFor="client-status">{t("common.status")}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
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
                <Label htmlFor="client-type">{t("manage.client_type.label")}</Label>
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
                <Label>{t("manage.client_tags.label")}</Label>
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

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {t(`manage.client_tag.${tag}`)}
                  </Badge>
                ))}
              </div>
            )}

            {(selectedType === "buyer" || selectedType === "tenant") && (
              <section className="border-t pt-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{t("manage.client_preferences.title")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("manage.client_preferences.description")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PreferenceSelect
                    label={t("manage.client_preferences.operation")}
                    value={formData.propertyPreferences?.operationType}
                    options={PREFERENCE_OPERATION_OPTIONS}
                    onChange={(value) => updatePropertyPreference("operationType", value)}
                    t={t}
                  />
                  <PreferenceSelect
                    label={t("manage.client_preferences.property_type")}
                    value={formData.propertyPreferences?.propertyType}
                    options={PREFERENCE_PROPERTY_TYPE_OPTIONS}
                    onChange={(value) => updatePropertyPreference("propertyType", value)}
                    t={t}
                  />
                  <PreferenceSelect
                    label={t("manage.client_preferences.housing_type")}
                    value={formData.propertyPreferences?.housingType}
                    options={PREFERENCE_HOUSING_TYPE_OPTIONS}
                    onChange={(value) => updatePropertyPreference("housingType", value)}
                    t={t}
                  />
                  <PreferenceSelect
                    label={t("manage.client_preferences.floor")}
                    value={formData.propertyPreferences?.floor}
                    options={PREFERENCE_FLOOR_OPTIONS}
                    onChange={(value) => updatePropertyPreference("floor", value)}
                    t={t}
                  />
                  <PreferenceSelect
                    label={t("manage.client_preferences.condition")}
                    value={formData.propertyPreferences?.propertyCondition}
                    options={PREFERENCE_CONDITION_OPTIONS}
                    onChange={(value) => updatePropertyPreference("propertyCondition", value)}
                    t={t}
                  />
                  <PreferenceSelect
                    label={t("manage.client_preferences.availability")}
                    value={formData.propertyPreferences?.availability}
                    options={PREFERENCE_AVAILABILITY_OPTIONS}
                    onChange={(value) => updatePropertyPreference("availability", value)}
                    t={t}
                  />
                  <PreferenceDate
                    label={t("manage.client_preferences.availability_date")}
                    value={formData.propertyPreferences?.availabilityDate}
                    onChange={(value) => updatePropertyPreference("availabilityDate", value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <PreferenceNumber label={t("manage.client_preferences.min_price")} value={formData.propertyPreferences?.minPrice} onChange={(value) => updatePropertyPreference("minPrice", value)} />
                  <PreferenceNumber label={t("manage.client_preferences.max_price")} value={formData.propertyPreferences?.maxPrice} onChange={(value) => updatePropertyPreference("maxPrice", value)} />
                  <PreferenceNumber label={t("manage.client_preferences.bedrooms")} value={formData.propertyPreferences?.bedrooms} onChange={(value) => updatePropertyPreference("bedrooms", value)} />
                  <PreferenceNumber label={t("manage.client_preferences.bathrooms")} value={formData.propertyPreferences?.bathrooms} onChange={(value) => updatePropertyPreference("bathrooms", value)} />
                  <PreferenceNumber label={t("manage.client_preferences.min_area")} value={formData.propertyPreferences?.minArea} onChange={(value) => updatePropertyPreference("minArea", value)} />
                  <PreferenceNumber label={t("manage.client_preferences.max_area")} value={formData.propertyPreferences?.maxArea} onChange={(value) => updatePropertyPreference("maxArea", value)} />
                </div>

                <div>
                  <Label>{t("manage.client_preferences.city")}</Label>
                  <Select
                    value={formData.propertyPreferences?.city || undefined}
                    onValueChange={(value) => {
                      updatePropertyPreference("city", value || null);
                      updatePropertyPreference("neighborhood", null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("manage.client_preferences.select_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCities().map((city, index) => (
                        <SelectItem key={`${city}-${index}`} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <NeighborhoodPreferenceInput
                  label={t("manage.client_preferences.neighborhood")}
                  value={formData.propertyPreferences?.neighborhood}
                  city={formData.propertyPreferences?.city}
                  onCityChange={(value) => updatePropertyPreference("city", value)}
                  onChange={(value) => updatePropertyPreference("neighborhood", value)}
                  t={t}
                />

                <div>
                  <Label>{t("manage.client_preferences.features")}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {PROPERTY_FEATURES.map((feature) => (
                      <label key={feature.id} className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={formData.propertyPreferences?.features?.includes(feature.id) || false}
                          onCheckedChange={(checked) => {
                            const current = formData.propertyPreferences?.features || [];
                            updatePropertyPreference(
                              "features",
                              checked ? Array.from(new Set([...current, feature.id])) : current.filter((value) => value !== feature.id),
                            );
                          }}
                        />
                        <span>{t(`manage.property_feature.${feature.id}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <div className="pt-2">
              <Button
                className="gap-2"
                onClick={() => updateClientMutation.mutate()}
                disabled={updateClientMutation.isPending}
                data-testid="button-save-client-detail"
              >
                <Save className="h-4 w-4" />
                {updateClientMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-client-contract-history">
          <CardHeader>
            <CardTitle>{t("manage.client_contract_history.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingContractHistory ? (
              <p className="text-sm text-muted-foreground">{t("manage.client_contract_history.loading")}</p>
            ) : contractHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("manage.client_contract_history.empty")}</p>
            ) : (
              <div className="space-y-3">
                {contractHistory.map(({ contract, property }) => (
                  <div
                    key={contract.id}
                    className="rounded-lg border p-4 space-y-3"
                    data-testid={`card-client-contract-${contract.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{property.title || property.reference || property.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.city || property.locality || property.address}
                        </p>
                      </div>
                      <Badge variant={contract.isActive ? "default" : "secondary"}>
                        {contract.isActive
                          ? t("manage.client_contract_history.active")
                          : t("manage.client_contract_history.inactive")}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("propertyManagement.rent.start")}</p>
                        <p>{contract.startDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("propertyManagement.rent.end")}</p>
                        <p>{contract.endDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("propertyManagement.label.rent_price")}</p>
                        <p>€{contract.rentPrice?.toLocaleString()}{t("propertyManagement.rent.per_month")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("propertyManagement.rent.deposit")}</p>
                        <p>€{contract.guarantee?.toLocaleString() || "0"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PreferenceSelect({
  label,
  value,
  options,
  onChange,
  t,
}: {
  label: string;
  value?: string | null;
  options: PreferenceOption[];
  onChange: (value: string | null) => void;
  t: (key: string) => string;
}) {
  return (
    <div>
      <Label>{label}</Label>
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
}: {
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      />
    </div>
  );
}

function PreferenceText({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value || ""} onChange={(event) => onChange(event.target.value || null)} />
    </div>
  );
}

function NeighborhoodPreferenceInput({
  label,
  value,
  city,
  onCityChange,
  onChange,
  t,
}: {
  label: string;
  value?: string | string[] | null;
  city?: string | null;
  onCityChange: (value: string | null) => void;
  onChange: (value: string[] | null) => void;
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
      <Label>{label}</Label>
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
}: {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="date" value={value || ""} onChange={(event) => onChange(event.target.value || null)} />
    </div>
  );
}
