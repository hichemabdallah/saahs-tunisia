import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, getCurrentUser, getUserRole } from './services/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Interventions from './components/Interventions';
import Invoices from './components/Invoices';
import Navigation from './components/Navigation';
import Technicians from './components/Technicians';
import TechnicianDashboard from './components/TechnicianDashboard';
import ManagerDashboard from './components/ManagerDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkUser = async () => {
    const user = await getCurrentUser();
    setUser(user);
    
    if (user) {
      const { data } = await getUserRole(user.id);
      setUserRole(data?.role || 'technician');
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-900">
        <Navigation user={user} userRole={userRole} onRoleSwitch={setUserRole} />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard userRole={userRole} />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/technicians" element={<Technicians />} />
            <Route path="/interventions" element={<Interventions />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/technician" element={<TechnicianDashboard userRole={userRole} />} />
            <Route path="/manager" element={<ManagerDashboard userRole={userRole} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
