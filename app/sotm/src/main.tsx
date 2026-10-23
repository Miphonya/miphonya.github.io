import { OnboardingGate } from "./components/Onboarding";
import { PricingProvider } from "./hooks/usePricing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60000, refetchOnWindowFocus: false },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <PricingProvider>
          <OnboardingGate>
            <App />
          </OnboardingGate>
        </PricingProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {});
  });
