import { useEffect } from "react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Map,
  Handshake,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/places", label: "Lugares", icon: MapPin, end: false },
  { to: "/admin/events", label: "Eventos", icon: Calendar, end: false },
  { to: "/admin/itineraries", label: "Roteiros", icon: Map, end: false },
  { to: "/admin/partners", label: "Parceiros", icon: Handshake, end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin/login";

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token && !isLoginPage) navigate("/admin/login", { replace: true });
  }, [navigate, isLoginPage]);

  // Render only the child page (login form) without the admin sidebar
  if (isLoginPage) return <Outlet />;

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200">
          <p className="font-bold text-gray-800 text-sm">Castro's Park</p>
          <p className="text-xs text-amber-600 font-medium">Administrador</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-50 text-amber-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
