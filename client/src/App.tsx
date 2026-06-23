import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PricingWizard from "./pages/PricingWizard";
import KitchenPricing from "./pages/KitchenPricing";
import CrmPipeline from "./pages/CrmPipeline";
import NegotiationSession from "./pages/NegotiationSession";
import BrandHub from "./pages/BrandHub";
import ProfessorKitchensEngine from "./pages/ProfessorKitchensEngine";
import KitchenQuotationEngine from "./pages/KitchenQuotationEngine";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={BrandHub} />
      {/* Brand-First Architecture */}
      <Route path={"/brands"} component={BrandHub} />
      <Route path={"/brand/professor_kitchens/kitchens"} component={ProfessorKitchensEngine} />
      <Route path={"/brand/professor_kitchens/kitchens/new"} component={KitchenQuotationEngine} />
      {/* Legacy routes (kept for backward compatibility) */}
      <Route path={"/pricing"} component={PricingWizard} />
      <Route path={"/kitchen"} component={KitchenPricing} />
      <Route path={"/crm"} component={CrmPipeline} />
      <Route path={"/negotiation/:leadId"} component={NegotiationSession} />
      <Route path={"/negotiation/:leadId/:sessionId"} component={NegotiationSession} />
      <Route path={"/404"} component={NotFound} />

      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
