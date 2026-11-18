import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";

export interface SupportTarget {
  kind: "missing_profile" | "email_missing_or_outdated" | "delivery_failed" | "already_claimed";
  profileType?: "agent" | "agency";
  profileUuid?: string;
  profileLabel?: string;
}

interface Props {
  target: SupportTarget | null;
  onClose: () => void;
  defaultName?: string;
}

export function ClaimSupportDialog({ target, onClose, defaultName = "" }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (target) setMessage(target.profileLabel ? `${target.profileLabel}\n` : "");
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSending(true);
    try {
      const res = await fetch("/api/claims/support", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: target.kind,
          profileType: target.profileType ?? null,
          profileUuid: target.profileUuid ?? null,
          contactName: name,
          contactEmail: email,
          message,
        }),
      });
      if (!res.ok) throw new Error("support request failed");
      toast({ title: t("claim.support_sent") });
      onClose();
    } catch {
      toast({ title: t("claim.support_error"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("claim.support_title")}</DialogTitle>
          <DialogDescription>{t("claim.support_desc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input required placeholder={t("claim.support_name")} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <Input required type="email" placeholder={t("claim.support_email")} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
          <Textarea placeholder={t("claim.support_message")} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={4} />
          <Button type="submit" className="w-full" disabled={sending} data-testid="button-claim-support-send">
            {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t("claim.support_send")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
