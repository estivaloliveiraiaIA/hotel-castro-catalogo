import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { BottomNav } from "./components/BottomNav";
import { ConciergeFloat } from "./components/ConciergeFloat";
import { PageSkeleton } from "./components/PageSkeleton";
import { ScrollToTop } from "./components/ScrollToTop";

// Páginas públicas secundárias — lazy loaded para reduzir bundle inicial
const Place = lazy(() => import("./pages/Place"));
const Itineraries = lazy(() => import("./pages/Itineraries"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Recomendados = lazy(() => import("./pages/Recomendados"));

// Admin carregado de forma lazy — código isolado do bundle principal
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPlaces = lazy(() => import("./pages/admin/AdminPlaces"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminItineraries = lazy(() => import("./pages/admin/AdminItineraries"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminKnowledge = lazy(() => import("./pages/admin/AdminKnowledge"));

const BASENAME = import.meta.env.BASE_URL;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={BASENAME}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/place/:id" element={<Suspense fallback={<PageSkeleton />}><Place /></Suspense>} />
          <Route path="/itineraries" element={<Suspense fallback={<PageSkeleton />}><Itineraries /></Suspense>} />
          <Route path="/itinerary/:id" element={<Suspense fallback={<PageSkeleton />}><Itinerary /></Suspense>} />
          <Route path="/events" element={<Suspense fallback={<PageSkeleton />}><Events /></Suspense>} />
          <Route path="/event/:id" element={<Suspense fallback={<PageSkeleton />}><EventDetail /></Suspense>} />
          <Route path="/favorites" element={<Suspense fallback={<PageSkeleton />}><Favorites /></Suspense>} />
          <Route path="/recomendados" element={<Suspense fallback={<PageSkeleton />}><Recomendados /></Suspense>} />
          {/* Admin routes — lazy loaded, isolados do bundle principal */}
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">Carregando...</div>}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route path="login" element={<Suspense fallback={null}><AdminLogin /></Suspense>} />
            <Route index element={<Suspense fallback={null}><AdminDashboard /></Suspense>} />
            <Route path="places" element={<Suspense fallback={null}><AdminPlaces /></Suspense>} />
            <Route path="events" element={<Suspense fallback={null}><AdminEvents /></Suspense>} />
            <Route path="itineraries" element={<Suspense fallback={null}><AdminItineraries /></Suspense>} />
            <Route path="partners" element={<Suspense fallback={null}><AdminPartners /></Suspense>} />
            <Route path="knowledge" element={<Suspense fallback={null}><AdminKnowledge /></Suspense>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <PublicOnly>
          <ConciergeFloat />
          <BottomNav />
        </PublicOnly>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}

export default App;
