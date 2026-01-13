import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

// Storage keys
const TOKEN_KEY = "polibest_session_token";
const USER_KEY = "polibest_user";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState("");

  // Get token from localStorage
  const getToken = () => localStorage.getItem(TOKEN_KEY);

  // Set up axios interceptor for auth header
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    console.log("[Auth] Checking auth, token exists:", !!token);
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("[Auth] Auth successful, user:", response.data.email);
      setUser(response.data);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      setAccessDenied(false);
    } catch (error) {
      console.log("[Auth] Auth failed, clearing token", error.response?.status);
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to restore user from localStorage first for faster UX
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
    checkAuth();
  }, []);

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const processSession = async (sessionId) => {
    console.log("[Auth] Processing session:", sessionId);
    try {
      const response = await axios.post(
        `${API}/auth/session`,
        { session_id: sessionId }
      );
      
      console.log("[Auth] Session response:", response.status, response.data?.email);
      
      if (response.status === 200 && response.data.session_token) {
        // Save token to localStorage
        localStorage.setItem(TOKEN_KEY, response.data.session_token);
        console.log("[Auth] Token saved to localStorage");
        
        // Remove session_token from user data before storing
        const { session_token, ...userData } = response.data;
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
        setAccessDenied(false);
        return true;
      }
    } catch (error) {
      console.log("[Auth] Session error:", error.response?.status, error.response?.data);
      if (error.response?.status === 403 && error.response?.data?.detail === "access_denied") {
        setAccessDenied(true);
        setDeniedEmail(error.response?.data?.email || "");
        return false;
      }
      console.error("Session error:", error);
    }
    return false;
  };

  const logout = async () => {
    const token = getToken();
    try {
      if (token) {
        await axios.post(`${API}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
    // Clear all auth-related local storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("auth_return_url");
    setUser(null);
    setAccessDenied(false);
    setDeniedEmail("");
  };

  const clearAccessDenied = () => {
    setAccessDenied(false);
    setDeniedEmail("");
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      accessDenied,
      deniedEmail,
      login,
      logout,
      processSession,
      checkAuth,
      clearAccessDenied
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
