import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { processSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      // Extract session_id from URL fragment
      const hash = location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const sessionId = params.get("session_id");

      if (sessionId) {
        const success = await processSession(sessionId);
        if (success) {
          // Get return URL from localStorage or default to dashboard
          const returnUrl = localStorage.getItem("auth_return_url") || "/";
          localStorage.removeItem("auth_return_url");
          navigate(returnUrl, { replace: true });
        } else {
          // Access denied - redirect to login with denied state
          navigate("/login?denied=true", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#B5331B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#A3A3A3]">Авторизація...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
