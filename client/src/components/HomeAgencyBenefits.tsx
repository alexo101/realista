import { Link } from "wouter";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Home,
  MessageSquareText,
  Users,
} from "lucide-react";
import { NeighborhoodRating } from "@/components/NeighborhoodRating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

const benefitCards = [
  { key: "visibility", icon: Home },
  { key: "crm", icon: Users },
  { key: "operations", icon: CalendarDays },
  { key: "reputation", icon: MessageSquareText },
  { key: "ai", icon: Bot },
] as const;

export function HomeAgencyBenefits() {
  const { t } = useLanguage();

  return (
    <section className="bg-slate-50 py-12 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
            {t("home.agency_title")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {t("home.agency_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10 md:mb-14">
          {benefitCards.map(({ key, icon: Icon }) => (
            <Card key={key} className="h-full border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {t(`home.agency_benefit_${key}_title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`home.agency_benefit_${key}_description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-8 lg:gap-10 items-start">
            <div className="lg:pt-4">
              <h3 className="text-xl md:text-2xl font-semibold mb-3">
                {t("home.agency_neighborhood_title")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("home.agency_neighborhood_description")}
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 p-3">
                <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("home.client_neighborhood_note")}
                </p>
              </div>
            </div>
            <NeighborhoodRating compact />
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <Link href="/realista-pro">
            <Button size="lg" className="gap-2">
              {t("home.agency_cta")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
