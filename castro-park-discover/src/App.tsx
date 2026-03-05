import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Place from "./pages/Place";
import Itineraries from "./pages/Itineraries";
import Itinerary from "./pages/Itinerary";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlaces from "./pages/admin/AdminPlaces";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminItineraries from "./pages/admin/AdminItineraries";
import AdminPartners from "./pages/admin/AdminPartners";

const BASENAME = import.meta.env.BASE_URL;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={BASENAME}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/place/:id" element={<Place />} />
          <Route path="/itineraries" element={<Itineraries />} />
          <Route path="/itinerary/:id" element={<Itinerary />} />
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="places" element={<AdminPlaces />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="itineraries" element={<AdminItineraries />} />
            <Route path="partners" element={<AdminPartners />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
