import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { UserProvider } from "@/contexts/user-context";
import { LanguageProvider } from "@/contexts/language-context";
import { RouteTransitionProvider } from "@/contexts/route-transition-context";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";
import { CookieBanner } from "@/components/CookieBanner";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Property from "@/pages/property";
import Manage from "@/pages/manage";
import NeighborhoodResults from "@/pages/neighborhood-results";
import AgentProfile from "@/pages/agent-profile";
import AgencyProfile from "@/pages/agency-profile";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ClientRegisterPage from "@/pages/client-register";
import ClientProfile from "@/pages/client-profile";
import RealistaPro from "@/pages/RealistaPro";
import AgencyPlanRegister from "@/pages/agency-plan-register";
import AgentPlanRegister from "@/pages/agent-plan-register";
import NetworkPlanRegister from "@/pages/network-plan-register";
import NetworkAdmin from "@/pages/network-admin";
import UpgradePlan from "@/pages/upgrade-plan";
import ConfirmReview from "@/pages/confirm-review";
import SuperAdminPage from "@/pages/super-admin";
import AvisoLegal from "@/pages/aviso-legal";
import PoliticaPrivacidad from "@/pages/politica-privacidad";
import PoliticaCookies from "@/pages/politica-cookies";
import TerminosCondiciones from "@/pages/terminos-condiciones";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Spanish routes with slug */}
      <Route path="/realista-pro" component={RealistaPro} />
      <Route path="/iniciar-sesion" component={LoginPage} />
      <Route path="/registrarse" component={RegisterPage} />
      <Route path="/registro-plan-agencia" component={AgencyPlanRegister} />
      <Route path="/registro-plan-agente" component={AgentPlanRegister} />
      <Route path="/registro-plan-red" component={NetworkPlanRegister} />
      <Route path="/admin-red" component={NetworkAdmin} />
      <Route path="/super-admin" component={SuperAdminPage} />
      <Route path="/registro-cliente" component={ClientRegisterPage} />
      <Route path="/perfil-cliente/:clientUuid/:section" component={ClientProfile} />
      <Route path="/perfil-cliente" component={ClientProfile} />
      <Route path="/gestionar/:agentUuid/clientes/:clientId" component={Manage} />
      <Route path="/buscar/comprar" component={Search} />
      <Route path="/buscar/alquilar" component={Search} />
      <Route path="/buscar/agencias" component={Search} />
      <Route path="/buscar/agentes" component={Search} />
      <Route path="/barrio/:barrio" component={NeighborhoodResults} />
      <Route path="/barrio/:barrio/inmuebles" component={NeighborhoodResults} />
      <Route path="/barrio/:barrio/agencias" component={NeighborhoodResults} />
      <Route path="/barrio/:barrio/agentes" component={NeighborhoodResults} />
      <Route path="/barrio/:barrio/resumen" component={NeighborhoodResults} />
      <Route path="/inmueble/:slug" component={Property} />
      <Route path="/agentes/:slug" component={AgentProfile} />
      <Route path="/agencias/:slug" component={AgencyProfile} />
      <Route path="/gestionar/:agentUuid/:section" component={Manage} />
      <Route path="/gestionar" component={Manage} />
      <Route path="/app/mejora-tu-plan" component={UpgradePlan} />
      <Route path="/confirmar-resena/:token" component={ConfirmReview} />
      <Route path="/aviso-legal" component={AvisoLegal} />
      <Route path="/politica-privacidad" component={PoliticaPrivacidad} />
      <Route path="/politica-cookies" component={PoliticaCookies} />
      <Route path="/terminos-condiciones" component={TerminosCondiciones} />
      
      {/* Backwards compatibility routes - redirect to Spanish */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      {/* Path-based registration routes must come BEFORE parameterless routes for wouter matching */}
      <Route path="/agency-plan-register/:plan/:billing" component={AgencyPlanRegister} />
      <Route path="/agent-plan-register/:plan/:billing" component={AgentPlanRegister} />
      <Route path="/network-plan-register/:plan/:billing" component={NetworkPlanRegister} />
      {/* Fallback routes for query param URLs */}
      <Route path="/agency-plan-register" component={AgencyPlanRegister} />
      <Route path="/agent-plan-register" component={AgentPlanRegister} />
      <Route path="/network-plan-register" component={NetworkPlanRegister} />
      <Route path="/client-register" component={ClientRegisterPage} />
      <Route path="/client-profile" component={ClientProfile} />
      <Route path="/search/buy" component={Search} />
      <Route path="/search/rent" component={Search} />
      <Route path="/search/agencies" component={Search} />
      <Route path="/search/agents" component={Search} />
      <Route path="/neighborhood/:neighborhood" component={NeighborhoodResults} />
      <Route path="/neighborhood/:neighborhood/properties" component={NeighborhoodResults} />
      <Route path="/neighborhood/:neighborhood/agencies" component={NeighborhoodResults} />
      <Route path="/neighborhood/:neighborhood/agents" component={NeighborhoodResults} />
      <Route path="/neighborhood/:neighborhood/overview" component={NeighborhoodResults} />
      <Route path="/property/:id" component={Property} />
      <Route path="/agentes/:id" component={AgentProfile} />
      <Route path="/agencias/:id" component={AgencyProfile} />
      <Route path="/agent/:id" component={AgentProfile} />
      <Route path="/agency/:id" component={AgencyProfile} />
      <Route path="/agent-profile/:id" component={AgentProfile} />
      <Route path="/agency-profile/:id" component={AgencyProfile} />
      <Route path="/manage" component={Manage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <UserProvider>
          <RouteTransitionProvider>
            <Navbar />
            <Router />
            <CookieBanner />
            <GlobalLoadingOverlay />
            <Toaster />
          </RouteTransitionProvider>
        </UserProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;