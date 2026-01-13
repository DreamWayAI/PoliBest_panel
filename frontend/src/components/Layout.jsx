import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  FileText,
  FolderOpen,
  BookOpen,
  PlayCircle,
  Wrench,
  Settings,
  Menu,
  X,
  LogOut,
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { path: "/", label: "Панель", icon: LayoutDashboard },
  { path: "/calculator", label: "Калькулятор", icon: Calculator },
  { path: "/calculations", label: "Розрахунки", icon: FileText },
  { path: "/commercial", label: "Комерційне", icon: Briefcase },
  { path: "/documents", label: "Документи", icon: FolderOpen },
  { path: "/instructions", label: "Інструкції", icon: BookOpen },
  { path: "/videos", label: "Відео", icon: PlayCircle },
  { path: "/services", label: "Сервіси", icon: Wrench },
  { path: "/settings", label: "Налаштування", icon: Settings },
];

// Mobile bottom nav - only main items
const mobileNavItems = [
  { path: "/", label: "Панель", icon: LayoutDashboard },
  { path: "/calculator", label: "Калькулятор", icon: Calculator },
  { path: "/calculations", label: "Розрахунки", icon: FileText },
  { path: "/commercial", label: "Комерційне", icon: Briefcase },
];

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getCurrentPageTitle = () => {
    const path = location.pathname;
    const item = navItems.find((i) => 
      i.path === path || (i.path !== "/" && path.startsWith(i.path))
    );
    return item ? item.label : "PoliBest 911";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F0F0F] border-b border-[#262626] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[#EDEDED]">
            Poli<span className="text-[#B5331B]">Best</span>
          </span>
        </div>
        <h1 className="text-sm font-bold text-[#A3A3A3] uppercase tracking-wider">
          {getCurrentPageTitle()}
        </h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#A3A3A3] hover:text-[#EDEDED]"
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Full Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#0A0A0A] z-40 pt-14">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-4 rounded-none transition-colors ${
                    isActive
                      ? "bg-[#B5331B]/20 text-[#B5331B] border-l-4 border-[#B5331B]"
                      : "text-[#A3A3A3] hover:bg-white/5"
                  }`
                }
                data-testid={`mobile-menu-${item.path === "/" ? "dashboard" : item.path.slice(1)}`}
              >
                <item.icon size={24} strokeWidth={1.5} />
                <span className="text-lg font-bold uppercase tracking-wide">
                  {item.label}
                </span>
              </NavLink>
            ))}
            
            {/* Logout Button in Mobile Menu */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-none text-[#A3A3A3] hover:bg-white/5 hover:text-[#B5331B] transition-colors"
              data-testid="mobile-logout-btn"
            >
              <LogOut size={24} strokeWidth={1.5} />
              <span className="text-lg font-bold uppercase tracking-wide">
                Вийти
              </span>
            </button>
          </nav>
          
          {/* User Info */}
          {user && (
            <div className="absolute bottom-24 left-0 right-0 p-4 text-center">
              <p className="text-xs text-[#737373] truncate px-4">{user.email}</p>
            </div>
          )}
          <div className="absolute bottom-20 left-0 right-0 p-4 text-center">
            <p className="text-xs text-[#737373]">PoliBest 911 v1.0.0</p>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex flex-col z-50 bg-[#0F0F0F] border-r border-[#262626]">
        <div className="p-6 border-b border-[#262626]">
          <h1 className="text-xl font-bold text-[#EDEDED] uppercase tracking-wider">
            Poli<span className="text-[#B5331B]">Best</span> 911
          </h1>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-wide uppercase transition-colors ${
                  isActive
                    ? "text-[#B5331B] bg-white/5 border-r-2 border-[#B5331B]"
                    : "text-[#A3A3A3] hover:text-[#B5331B] hover:bg-white/5"
                }`
              }
              data-testid={`nav-${item.path === "/" ? "dashboard" : item.path.slice(1)}`}
            >
              <item.icon size={20} strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#262626]">
          {user && (
            <div className="mb-3">
              <p className="text-xs text-[#737373] truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#A3A3A3] hover:text-[#B5331B] hover:bg-white/5 transition-colors"
            data-testid="desktop-logout-btn"
          >
            <LogOut size={18} />
            <span className="font-bold uppercase tracking-wide">Вийти</span>
          </button>
          <p className="text-xs text-[#3A3A3A] mt-2">v1.0.0</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F0F0F] border-t border-[#262626] flex justify-around items-center z-50 safe-area-bottom">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-3 min-w-[60px] transition-colors ${
                isActive ? "text-[#B5331B]" : "text-[#737373]"
              }`
            }
            data-testid={`bottom-nav-${item.path === "/" ? "dashboard" : item.path.slice(1)}`}
          >
            <item.icon size={22} strokeWidth={1.5} />
            <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
