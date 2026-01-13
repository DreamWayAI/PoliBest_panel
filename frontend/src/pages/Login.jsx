import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";

export const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, login, accessDenied, deniedEmail, logout, clearAccessDenied } = useAuth();
  const isDenied = searchParams.get("denied") === "true" || accessDenied;

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (!loading && user && !isDenied) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, isDenied]);

  const handleLogin = () => {
    // Clear denied state before new login attempt
    clearAccessDenied();
    setSearchParams({});
    // Save current location for redirect after login
    localStorage.setItem("auth_return_url", "/");
    login();
  };

  const handleLogout = async () => {
    await logout();
    // Clear URL params
    setSearchParams({});
    navigate("/login", { replace: true });
  };

  const handleTryAgain = () => {
    // Clear denied state and try login again
    clearAccessDenied();
    setSearchParams({});
    handleLogin();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#B5331B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Access Denied Screen
  if (isDenied) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#121212] border border-[#262626] p-8 text-center">
            {/* Logo */}
            <div className="mb-8">
              <h1 className="text-3xl font-black uppercase tracking-tight">
                <span className="text-[#B5331B]">Poli</span>
                <span className="text-[#EDEDED]">Best</span>
                <span className="text-[#737373] ml-2">911</span>
              </h1>
            </div>

            {/* Access Denied */}
            <div className="mb-8">
              <div className="w-16 h-16 bg-[#7F1D1D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#B5331B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#EDEDED] uppercase mb-2">
                Доступ заборонено
              </h2>
              <p className="text-[#A3A3A3] text-sm mb-2">
                Ваш обліковий запис не має доступу до цього додатку.
              </p>
              {deniedEmail && (
                <p className="text-[#737373] text-xs font-mono">
                  {deniedEmail}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleTryAgain}
                className="w-full bg-[#B5331B] hover:bg-red-700 text-white py-4 font-bold uppercase tracking-wider"
              >
                Спробувати знову
              </Button>
              <Button
                onClick={handleLogout}
                className="w-full bg-[#262626] hover:bg-[#333] text-[#EDEDED] py-4 font-bold uppercase tracking-wider"
              >
                Вийти
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#121212] border border-[#262626] p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
              <span className="text-[#B5331B]">Poli</span>
              <span className="text-[#EDEDED]">Best</span>
              <span className="text-[#737373] ml-2">911</span>
            </h1>
            <p className="text-[#737373] text-sm uppercase tracking-wider">
              Полімерні покриття
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[#262626] my-6"></div>

          {/* Login Info */}
          <div className="text-center mb-6">
            <p className="text-[#A3A3A3] text-sm">
              Вхід тільки для авторизованих користувачів
            </p>
          </div>

          {/* Google Login Button */}
          <Button
            onClick={handleLogin}
            className="w-full bg-[#B5331B] hover:bg-red-700 text-white py-4 font-bold uppercase tracking-wider flex items-center justify-center gap-3"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Увійти через Google</span>
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-[#3A3A3A] text-xs mt-4">
          © 2024 PoliBest 911. Всі права захищені.
        </p>
      </div>
    </div>
  );
};

export default Login;
