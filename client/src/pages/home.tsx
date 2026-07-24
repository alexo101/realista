import { SearchBar } from "@/components/SearchBar";
import { MessageCarousel } from "@/components/MessageCarousel";
import { HomeAgencyBenefits } from "@/components/HomeAgencyBenefits";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language-context";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <section className="bg-primary/5 py-8 md:py-16 flex flex-col justify-start md:justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-4">
            {t("home.hero_title")}
          </h1>
          <div className="mb-6 md:mb-8">
            <MessageCarousel />
          </div>
          <SearchBar />
        </div>
      </section>

      <HomeAgencyBenefits />

      {/* Footer - Import and use Footer component */}
      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
