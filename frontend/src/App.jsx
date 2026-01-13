import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import Calculations from "./pages/Calculations";
import Documents from "./pages/Documents";
import Commercial from "./pages/Commercial";
import Instructions from "./pages/Instructions";
import Videos from "./pages/Videos";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import KPWizard from "./pages/KPWizard";
import KPPreview from "./pages/KPPreview";

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="calculator" element={<Calculator />} />
              <Route path="calculations" element={<Calculations />} />
              <Route path="commercial" element={<Commercial />} />
              <Route path="commercial/kp/new" element={<KPWizard />} />
              <Route path="commercial/kp/edit/:id" element={<KPWizard />} />
              <Route path="commercial/kp/preview/:id" element={<KPPreview />} />
              <Route path="documents" element={<Documents />} />
              <Route path="instructions" element={<Instructions />} />
              <Route path="videos" element={<Videos />} />
              <Route path="services" element={<Services />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#121212',
            border: '1px solid #262626',
            color: '#EDEDED',
          },
        }}
      />
    </div>
  );
}

export default App;
