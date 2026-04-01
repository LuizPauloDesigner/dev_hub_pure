import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppProvider } from "./contexts/AppContext";
import { MusicPlayerProvider } from "./contexts/MusicPlayerContext";
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import OrgAdmin from "./pages/OrgAdmin";
import { SystemBanner } from "./components/SystemBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <MusicPlayerProvider>
              <Toaster />
              <Sonner />
              <HashRouter>
                <SystemBanner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/org-admin" element={<OrgAdmin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </HashRouter>
            </MusicPlayerProvider>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
