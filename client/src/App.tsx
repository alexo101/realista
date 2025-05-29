import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { UserProvider } from "@/contexts/user-context";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
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
      {/* Mantener las rutas antiguas para compatibilidad */}
      <Route path="/agent/:id" component={AgentProfile} />
      <Route path="/agency/:id" component={AgencyProfile} />
      {/* Nuevas rutas para compatibilidad con autocompletado */}
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
      <UserProvider>
        <Navbar />
        <Router />
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;