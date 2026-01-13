import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, loading, accessDenied } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Save current location for redirect after login
        localStorage.setItem("auth_return_url", location.pathname);
        navigate("/login", { replace: true });
      } else if (accessDenied) {
        navigate("/login?denied=true", { replace: true });
      }
    }
  }, [user, loading, accessDenied, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#B5331B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#A3A3A3]">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!user || accessDenied) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
