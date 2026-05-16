import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from '../services/supabase';
import { BarChart3, Users, Calendar, FileText, LogOut, Menu, X } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { switchUserRole } from '../services/supabase';

export default function Navigation({ user, userRole, onRoleSwitch }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    ];

    if (userRole === 'owner') {
      return [
        ...baseItems,
        { path: '/clients', label: 'Kunden', icon: Users },
        { path: '/technicians', label: 'Techniker', icon: Users },
        { path: '/interventions', label: 'Einsätze', icon: Calendar },
        { path: '/invoices', label: 'Rechnungen', icon: FileText },
        { path: '/team', label: 'Team', icon: Users },
        { path: '/team-members', label: 'Team-Mitglieder', icon: Users },
      ];
    } else if (userRole === 'technician') {
      return [
        ...baseItems,
        { path: '/technician', label: 'Meine Einsätze', icon: Calendar },
      ];
    } else if (userRole === 'manager') {
      return [
        ...baseItems,
        { path: '/manager', label: 'Genehmigungen', icon: CheckCircle },
        { path: '/invoices', label: 'Rechnungen', icon: FileText },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await signOut();
  };

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white mb-2">SaaS Tunisia</h1>
        <p className="text-xs text-gray-400">Einsatzplanung</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

        {true && (  // TEMPORÄR für MVP-Testing!
          <div className="px-4 py-3 bg-gray-800 rounded-lg mb-3">
            <p className="text-xs text-gray-500 mb-2">Test-Rolle</p>
            <select
              value={userRole}
              onChange={(e) => {
                switchUserRole(user.id, e.target.value);
                onRoleSwitch(e.target.value);
              }}
              className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600"
            >
              <option value="owner">👤 Owner</option>
              <option value="technician">🔧 Techniker</option>
              <option value="manager">📋 Manager</option>
            </select>
          </div>
        )}

      <div className="p-4 border-t border-gray-700 space-y-4">
        <div className="px-4 py-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500">Angemeldet als</p>
          <p className="text-sm text-white font-medium truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium text-sm"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-20">
        <h1 className="font-bold text-white">SaaS Tunisia</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-gray-800 border-r border-gray-700 flex-col">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-10 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-gray-800 border-r border-gray-700 flex flex-col">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content Offset for Mobile */}
      <style>{`
        @media (max-width: 768px) {
          main {
            margin-top: 60px;
          }
        }
      `}</style>
    </>
  );
}
