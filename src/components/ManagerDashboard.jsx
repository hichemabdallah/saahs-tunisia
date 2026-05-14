import { useState, useEffect } from 'react';
import { getInterventions, approveIntervention, rejectIntervention, autoCreateInvoice } from '../services/supabase';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ManagerDashboard({ userRole }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  if (userRole !== 'manager' && userRole !== 'owner') {
    return <div className="p-4 text-gray-400">Zugriff verweigert</div>;
  }

  useEffect(() => {
    loadPendingInterventions();
    const interval = setInterval(loadPendingInterventions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
  try {
    const { data } = await getInterventions();
    // Manager sieht NUR pending Einsätze
    const pending = data?.filter(i => i.approval_status === 'pending') || [];
    setInterventions(pending);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInterventions = async () => {
    try {
      const { data, error } = await getInterventions();
      if (!error && data) {
        const pending = data.filter((i) => i.approval_status === 'pending');
        setInterventions(pending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (error) {
      console.error('Error loading interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (intervention) => {
    try {
      setError('');
      await approveIntervention(intervention.id);
      await autoCreateInvoice(intervention.id, intervention.price);
      await loadPendingInterventions();
    } catch (error) {
      console.error('Error approving intervention:', error);
      setError('Fehler bei der Genehmigung');
    }
  };

  const handleRejectSubmit = async (id) => {
    if (!rejectReason.trim()) {
      setError('Grund erforderlich');
      return;
    }

    try {
      setError('');
      await rejectIntervention(id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await loadPendingInterventions();
    } catch (error) {
      console.error('Error rejecting intervention:', error);
      setError('Fehler beim Ablehnen');
    }
  };

  const calculateDuration = (intervention) => {
    if (!intervention.started_at || !intervention.ended_at) return '-';
    const start = new Date(intervention.started_at);
    const end = new Date(intervention.ended_at);
    const minutes = Math.round((end - start) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <p className="text-gray-400">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Genehmigungen</h1>
        <p className="text-gray-400 mb-6">{interventions.length} Einsätze warten auf Genehmigung</p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {interventions.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
            <p className="text-gray-400">Alle Einsätze genehmigt! ✅</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interventions.map((intervention) => (
              <div key={intervention.id} className="card">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">
                      {intervention.clients?.name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {intervention.type === 'installation' && '📦 Installation'}
                      {intervention.type === 'maintenance' && '🔧 Wartung'}
                      {intervention.type === 'repair' && '⚙️ Reparatur'}
                      {' • '}
                      {intervention.technicians?.name}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded text-xs font-bold text-white bg-yellow-600">
                    <Clock size={12} className="inline mr-1" />
                    Genehmigung
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-700/30 rounded">
                  <div>
                    <p className="text-xs text-gray-400">Betrag</p>
                    <p className="text-xl font-bold text-blue-400">
                      {intervention.price?.toFixed(2) || '-'} DT
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Dauer</p>
                    <p className="text-xl font-bold text-gray-300">
                      {calculateDuration(intervention)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Notiz</p>
                    <p className="text-sm text-gray-300 break-words">
                      {intervention.notes || '-'}
                    </p>
                  </div>
                </div>

                {/* Address & Contact */}
                <div className="mb-6 space-y-1 text-sm text-gray-400">
                  <p>📍 {intervention.clients?.address || 'Keine Adresse'}</p>
                  <p>📞 {intervention.clients?.phone || 'Keine Nummer'}</p>
                </div>

                {/* Action Buttons */}
                {rejectingId === intervention.id ? (
                  <div className="border-t border-gray-700 pt-4 space-y-3">
                    <div>
                      <label className="label">Grund der Ablehnung *</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="input-field h-20 resize-none"
                        placeholder="z.B. Betrag zu hoch - bitte korrigieren auf 180 DT"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectSubmit(intervention.id)}
                        className="flex-1 btn-danger"
                      >
                        Ablehnen & senden
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason('');
                        }}
                        className="flex-1 btn-secondary"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(intervention)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-medium flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle size={18} />
                      Genehmigen
                    </button>
                    <button
                      onClick={() => setRejectingId(intervention.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded font-medium flex items-center justify-center gap-2 transition"
                    >
                      <XCircle size={18} />
                      Ablehnen
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
