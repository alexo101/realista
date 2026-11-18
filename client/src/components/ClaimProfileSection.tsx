import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Building2, ExternalLink, Loader2, MailCheck, MapPin, Search, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/language-context";
import { ClaimSupportDialog, type SupportTarget } from "@/components/ClaimSupportDialog";

type ProfileType = "agent" | "agency";

interface AgentResult {
  uuid: string;
  name: string | null;
  surname: string | null;
  avatar: string | null;
  agencyName: string | null;
  agencySlug: string | null;
  claimed: boolean;
}

interface AgencyResult {
  uuid: string;
  agencyName: string;
  city: string | null;
  agencyAddress: string | null;
  agencyLogo: string | null;
  networkName: string | null;
  networkSlug: string | null;
  claimed: boolean;
}

type SupportState = { kind: SupportTarget["kind"]; profileType?: ProfileType; profileUuid?: string; profileLabel?: string } | null;

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function ClaimProfileSection() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<ProfileType>("agent");
  const [query, setQuery] = useState("");
  const [pendingUuid, setPendingUuid] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<{ uuid: string; email: string } | null>(null);
  const [error, setError] = useState<{ code: string; uuid: string; label: string } | null>(null);
  const [support, setSupport] = useState<SupportState>(null);

  const debounced = useDebounced(query.trim());
  const enabled = debounced.length >= 2;

  const { data, isFetching } = useQuery<{ results: (AgentResult | AgencyResult)[] }>({
    queryKey: [`/api/claims/search?type=${tab}&q=${encodeURIComponent(debounced)}`],
    enabled,
  });
  const results = enabled ? data?.results ?? [] : [];

  // Honor the #reclamar-perfil anchor when arriving from the homepage.
  useEffect(() => {
    if (window.location.hash === "#reclamar-perfil") {
      setTimeout(() => document.getElementById("reclamar-perfil")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const changeTab = (value: string) => {
    setTab(value as ProfileType);
    setQuery("");
    setSentTo(null);
    setError(null);
  };

  const labelOf = (r: AgentResult | AgencyResult) =>
    "agencyName" in r && "city" in r
      ? (r as AgencyResult).agencyName
      : [(r as AgentResult).name, (r as AgentResult).surname].filter(Boolean).join(" ");

  const claim = async (result: AgentResult | AgencyResult) => {
    setPendingUuid(result.uuid);
    setError(null);
    setSentTo(null);
    try {
      const res = await fetch("/api/claims/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, profileUuid: result.uuid }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.sent) {
        setSentTo({ uuid: result.uuid, email: body.maskedEmail });
      } else {
        setError({ code: body.code || "generic", uuid: result.uuid, label: labelOf(result) });
      }
    } catch {
      setError({ code: "generic", uuid: result.uuid, label: labelOf(result) });
    } finally {
      setPendingUuid(null);
    }
  };

  const errorText = (code: string) => {
    const key = `claim.err.${code}`;
    const known = ["already_claimed", "email_missing", "delivery_failed", "already_owns_agent_profile", "rate_limited"];
    return t(known.includes(code) ? key : "claim.err.generic");
  };

  const errorSupportKind = (code: string): SupportTarget["kind"] =>
    code === "already_claimed" ? "already_claimed" : code === "email_missing" ? "email_missing_or_outdated" : "delivery_failed";

  return (
    <section id="reclamar-perfil" className="container mx-auto px-4 pt-16 scroll-mt-20" data-testid="section-claim-profile">
      <div className="max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-white p-5 md:p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
            <BadgeCheck className="h-4 w-4" />
            {t("claim.eyebrow")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("claim.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("claim.subtitle")}</p>
        </div>

        <Tabs value={tab} onValueChange={changeTab}>
          <div className="flex justify-center mb-6">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="agent" className="px-5 py-2" data-testid="tab-claim-agents">
                <User className="h-4 w-4 mr-2" />
                {t("claim.tab_agents")}
              </TabsTrigger>
              <TabsTrigger value="agency" className="px-5 py-2" data-testid="tab-claim-agencies">
                <Building2 className="h-4 w-4 mr-2" />
                {t("claim.tab_agencies")}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="relative max-w-xl mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(tab === "agent" ? "claim.search_agents_placeholder" : "claim.search_agencies_placeholder")}
            className="pl-9"
            maxLength={100}
            data-testid="input-claim-search"
          />
        </div>

        {!enabled && (
          <p className="text-center text-sm text-muted-foreground">{t("claim.min_chars")}</p>
        )}

        {enabled && isFetching && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("claim.searching")}
          </div>
        )}

        {enabled && !isFetching && results.length === 0 && (
          <div className="text-center py-6" data-testid="claim-no-results">
            <p className="font-semibold">{t("claim.no_results_title")}</p>
            <p className="text-sm text-muted-foreground mb-4">{t("claim.no_results_desc")}</p>
            <Button variant="outline" onClick={() => setSupport({ kind: "missing_profile", profileType: tab })}>
              {t("claim.request_add")}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {results.map((result) => {
            const isAgent = tab === "agent";
            const agent = result as AgentResult;
            const agency = result as AgencyResult;
            const label = labelOf(result);
            const isPending = pendingUuid === result.uuid;
            const sent = sentTo?.uuid === result.uuid ? sentTo : null;
            const failed = error?.uuid === result.uuid ? error : null;

            return (
              <Card key={result.uuid} data-testid={`card-claim-${result.uuid}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={(isAgent ? agent.avatar : agency.agencyLogo) || undefined} alt={label} />
                        <AvatarFallback>
                          {isAgent ? <User className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{label}</p>
                        {isAgent ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            {agent.agencyName || t("claim.no_agency")}
                          </p>
                        ) : (
                          <>
                            {(agency.city || agency.agencyAddress) && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                {[agency.agencyAddress, agency.city].filter(Boolean).join(", ")}
                              </p>
                            )}
                            {agency.networkName && (
                              <a
                                href={agency.networkSlug ? `/redes/${agency.networkSlug}` : undefined}
                                className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                              >
                                {t("claim.network")}: {agency.networkName}
                                {agency.networkSlug && <ExternalLink className="h-3 w-3" />}
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {result.claimed ? (
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <Badge variant="secondary">{t("claim.claimed_badge")}</Badge>
                        <button
                          type="button"
                          className="text-xs text-primary underline"
                          onClick={() =>
                            setSupport({ kind: "already_claimed", profileType: tab, profileUuid: result.uuid, profileLabel: label })
                          }
                        >
                          {t("claim.contact_support")}
                        </button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => claim(result)}
                        disabled={isPending || Boolean(sent)}
                        data-testid={`button-claim-${result.uuid}`}
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isPending ? t("claim.sending") : t("claim.button")}
                      </Button>
                    )}
                  </div>

                  {sent && (
                    <Alert className="mt-4 border-green-200 bg-green-50">
                      <MailCheck className="h-4 w-4" />
                      <AlertTitle>{t("claim.sent_title")}</AlertTitle>
                      <AlertDescription>{t("claim.sent_desc", { email: sent.email })}</AlertDescription>
                    </Alert>
                  )}

                  {failed && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>{t("claim.error_title")}</AlertTitle>
                      <AlertDescription>
                        <p>{errorText(failed.code)}</p>
                        <button
                          type="button"
                          className="mt-2 underline font-medium"
                          onClick={() =>
                            setSupport({
                              kind: errorSupportKind(failed.code),
                              profileType: tab,
                              profileUuid: failed.uuid,
                              profileLabel: failed.label,
                            })
                          }
                        >
                          {t("claim.contact_support")}
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ClaimSupportDialog target={support} onClose={() => setSupport(null)} defaultName="" />
    </section>
  );
}
