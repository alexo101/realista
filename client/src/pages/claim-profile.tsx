import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { useUser } from "@/contexts/user-context";
import { Footer } from "@/components/Footer";

interface TokenInfo {
  valid: true;
  profileType: "agent" | "agency";
  profileName: string;
  agencyName: string | null;
  maskedEmail: string;
  emailHasAccount: boolean;
}

async function postJson(url: string, body: unknown, withCsrf = false) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = localStorage.getItem("csrfToken");
  if (withCsrf && csrf) headers["X-CSRF-Token"] = csrf;
  const res = await fetch(url, { method: "POST", credentials: "include", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function ClaimProfilePage() {
  const { t } = useLanguage();
  const { user, setUser } = useUser();
  const [, params] = useRoute("/reclamar-perfil/:token");
  const token = params?.token ?? "";

  const { data: info, isLoading, isError } = useQuery<TokenInfo>({
    queryKey: [`/api/claims/token/${encodeURIComponent(token)}`],
    enabled: Boolean(token),
    retry: false,
  });

  const [modeOverride, setModeOverride] = useState<"login" | "register" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<{ invitedAgents: number; profileType: string } | null>(null);

  const mode = modeOverride ?? (info?.emailHasAccount ? "login" : "register");

  const syncSession = async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) setUser(await res.json());
  };

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "login") {
        const { ok, data } = await postJson("/api/auth/login", { email, password });
        if (!ok) {
          setMessage(data.message || t("claim.err.generic"));
          return;
        }
        setUser(data);
        if (data.csrfToken) localStorage.setItem("csrfToken", data.csrfToken);
      } else {
        const { ok, data } = await postJson("/api/claims/register", { token, password, confirmPassword });
        if (!ok) {
          if (data.code === "account_exists") setModeOverride("login");
          setMessage(data.message || t("claim.err.generic"));
          return;
        }
        if (data.csrfToken) localStorage.setItem("csrfToken", data.csrfToken);
        await syncSession();
      }
    } catch {
      setMessage(t("claim.err.generic"));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { ok, data } = await postJson("/api/claims/complete", { token }, true);
      if (ok) {
        setDone({ invitedAgents: data.invitedAgents ?? 0, profileType: data.profileType });
      } else if (data.code === "agent_account_required") {
        setMessage(t("claim.page.agency_account_required"));
      } else if (["already_claimed", "already_owns_agent_profile"].includes(data.code)) {
        setMessage(t(`claim.err.${data.code}`));
      } else if (data.code === "invalid_token") {
        setMessage(t("claim.page.invalid_desc"));
      } else {
        setMessage(data.message || t("claim.err.generic"));
      }
    } catch {
      setMessage(t("claim.err.generic"));
    } finally {
      setBusy(false);
    }
  };

  const dashboardHref = user?.isClient ? "/perfil-cliente" : user?.agentUuid ? `/gestionar/${user.agentUuid}/calendario` : "/";

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex-1 container mx-auto px-4 py-12 max-w-lg">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-20">
            <Loader2 className="h-5 w-5 animate-spin" /> {t("claim.page.loading")}
          </div>
        )}

        {(isError || (!isLoading && !info)) && (
          <Card>
            <CardHeader className="text-center">
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <CardTitle>{t("claim.page.invalid_title")}</CardTitle>
              <CardDescription>{t("claim.page.invalid_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/realista-pro#reclamar-perfil">
                <Button>{t("claim.page.request_new")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {info && done && (
          <Card data-testid="claim-success">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
              <CardTitle>{t("claim.page.success_title")}</CardTitle>
              <CardDescription>{t("claim.page.success_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              {done.profileType === "agency" && (
                <>
                  {done.invitedAgents > 0 && (
                    <p className="text-sm">{t("claim.page.success_invited", { count: done.invitedAgents })}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t("claim.page.invite_note")}</p>
                </>
              )}
              <Link href={dashboardHref}>
                <Button>{t("claim.page.go_dashboard")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {info && !done && (
          <Card>
            <CardHeader className="text-center">
              <BadgeCheck className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle>{t("claim.page.title")}</CardTitle>
              <CardDescription>
                {t("claim.page.profile")}: <strong>{info.profileName}</strong>
                {info.agencyName ? ` · ${info.agencyName}` : ""}
                <br />
                {t("claim.page.link_sent_to", { email: info.maskedEmail })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {user ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>{t("claim.page.confirm_title")}</AlertTitle>
                    <AlertDescription>{t("claim.page.confirm_desc")}</AlertDescription>
                  </Alert>
                  <Button className="w-full" onClick={confirm} disabled={busy} data-testid="button-confirm-claim">
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("claim.page.confirm_btn")}
                  </Button>
                </div>
              ) : (
                <form onSubmit={submitAuth} className="space-y-3">
                  <h3 className="font-semibold">
                    {t(mode === "login" ? "claim.page.login_title" : "claim.page.register_title")}
                  </h3>
                  {mode === "login" ? (
                    <Input
                      required
                      type="email"
                      autoComplete="username"
                      placeholder={t("claim.page.email")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{info.maskedEmail}</p>
                  )}
                  <Input
                    required
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder={t("claim.page.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {mode === "register" && (
                    <Input
                      required
                      type="password"
                      autoComplete="new-password"
                      placeholder={t("claim.page.confirm_password")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={busy} data-testid="button-claim-auth">
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t(mode === "login" ? "claim.page.login_btn" : "claim.page.register_btn")}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-primary underline"
                    onClick={() => {
                      setMessage(null);
                      setModeOverride(mode === "login" ? "register" : "login");
                    }}
                  >
                    {t(mode === "login" ? "claim.page.no_account" : "claim.page.have_account")}
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
