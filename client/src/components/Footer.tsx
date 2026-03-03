import { Link } from "wouter";
import { Home, Mail, Phone, MapPin } from "lucide-react";
import { BARCELONA_DISTRICTS } from "@/utils/neighborhoods";
import { useLanguage } from "@/contexts/language-context";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  // Popular neighborhoods for featured links
  const featuredNeighborhoods = [
    "El Gòtic",
    "La Barceloneta", 
    "La Sagrada Família",
    "Vila de Gràcia",
    "El Poblenou",
    "Sarrià",
    "El Raval",
    "Sant Antoni"
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">Realista</span>
            </div>
            <p className="text-gray-300 text-sm">{t("footer.company_description")}</p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{t("footer.location")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contacto@realista.homes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+34 632925738</span>
              </div>
            </div>
          </div>

          {/* Distritos de Barcelona */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.districts")}</h3>
            <ul className="space-y-2 text-sm">
              {BARCELONA_DISTRICTS.slice(0, 6).map((district) => (
                <li key={district}>
                  <Link 
                    href={`/barrio/${encodeURIComponent(district)}`}
                    className="text-gray-300 hover:text-primary transition-colors"
                    data-testid={`link-district-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    {district}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  href="/barrio/Barcelona"
                  className="text-primary hover:text-primary/80 transition-colors"
                  data-testid="link-all-districts"
                >
                  {t("footer.all_districts")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Barrios Populares */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.popular_neighborhoods")}</h3>
            <ul className="space-y-2 text-sm">
              {featuredNeighborhoods.map((neighborhood) => (
                <li key={neighborhood}>
                  <Link 
                    href={`/barrio/${encodeURIComponent(neighborhood)}`}
                    className="text-gray-300 hover:text-primary transition-colors"
                    data-testid={`link-neighborhood-${neighborhood.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    {neighborhood}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Información Legal y Enlaces */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.legal_info")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/politica-privacidad"
                  className="text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-privacy"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/terminos-condiciones"
                  className="text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-terms"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/politica-cookies"
                  className="text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-cookies"
                >
                  {t("footer.cookies")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/aviso-legal"
                  className="text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-legal"
                >
                  {t("footer.legal_notice")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/realista-pro"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                  data-testid="link-realista-pro"
                >
                  Realista Pro
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {currentYear} Realista. {t("footer.copyright")}
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>{t("footer.digital_real_estate")}</span>
              <span>{t("footer.location")}</span>
              <span>CIF: B-12345678</span>
            </div>
          </div>
          
          {/* Legal Disclaimer */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              {t("footer.disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}