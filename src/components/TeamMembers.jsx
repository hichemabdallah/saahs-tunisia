import { useState, useEffect } from 'react';
import { supabase, resetTechnicianPassword } from '../services/supabase';
import { RotateCcw, Copy, Check } from 'lucide-react';

export default function TeamMembers({ user, userRole }) {
  const [technicians, setTechnicians] = useState([]);
  const [managers, setManagers] = useState([]);
  const [copied, setCopied] = useState(null);
  const [showPassword, setShowPassword] = useState(null);

  useEffect(() => {
    if (userRole === 'owner') loadTeamMembers();
  }, [userRole]);

  const loadTeamMembers = async () => {
    try {
      const { data: techs } = await supabase
        .from('technicians')
        .select('*')
        .eq('is_active', true);
      
      const { data: mgrs } = await supabase
        .from('managers')
        .select('*')
        .eq('is_active', true);

      setTechnicians(techs || []);
      setManagers(mgrs || []);
    } catch (error) {
      console.error('Error loading team:', error);
    }
  };

  const handleResetPassword = async (memberID) => {
    try {
      const { tempPassword } = await resetTechnicianPassword(user.id, memberID);
      setShowPassword({ memberID, password: tempPassword });
    } catch (error) {
      alert('Fehler beim Zurücksetzen');
    }
  };

  const copyPassword = (password) => {
    navigator.clipboard.writeText(password);
    setCopied(password);
    setTimeout(() => setCopied(null), 2000);
  };

  if (userRole !== 'owner') {
    return <div className="p-4 text-gray-400">Nur Owner</div>;
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Team-Mitglieder</h1>

      {/* Technicians */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Techniker ({technicians.length})</h2>
        <div className="space-y-3">
          {technicians.length === 0 ? (
            <div className="card text-gray-400 text-center py-8">Keine Techniker</div>
          ) : (
            technicians.map((tech) => (
              <div key={tech.id} className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-white font-bold">{tech.name}</p>
                  <p className="text-sm text-gray-400">{tech.email}</p>
                </div>
                <button
                  onClick={() => handleResetPassword(tech.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition"
                >
                  <RotateCcw size={16} />
                  Password zurücksetzen
                </button>

                {showPassword?.memberID === tech.id && (
                  <div className="col-span-full card bg-blue-900/30 p-3 flex items-center gap-2">
                    <p className="text-white">Temp Password: <code className="font-mono">{showPassword.password}</code></p>
                    <button
                      onClick={() => copyPassword(showPassword.password)}
                      className="ml-auto p-1 hover:bg-blue-800 rounded"
                    >
                      {copied === showPassword.password ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Managers */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Manager ({managers.length})</h2>
        <div className="space-y-3">
          {managers.length === 0 ? (
            <div className="card text-gray-400 text-center py-8">Keine Manager</div>
          ) : (
            managers.map((mgr) => (
              <div key={mgr.id} className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-white font-bold">{mgr.name}</p>
                  <p className="text-sm text-gray-400">{mgr.email}</p>
                </div>
                <button
                  onClick={() => handleResetPassword(mgr.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition"
                >
                  <RotateCcw size={16} />
                  Password zurücksetzen
                </button>

                {showPassword?.memberID === mgr.id && (
                  <div className="col-span-full card bg-blue-900/30 p-3 flex items-center gap-2">
                    <p className="text-white">Temp Password: <code className="font-mono">{showPassword.password}</code></p>
                    <button
                      onClick={() => copyPassword(showPassword.password)}
                      className="ml-auto p-1 hover:bg-blue-800 rounded"
                    >
                      {copied === showPassword.password ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}