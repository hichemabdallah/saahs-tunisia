import { useState, useEffect } from 'react';
import { getInterventions, updateInterventionStatus,autoCreateInvoice } from '../services/supabase';
import { Phone, MessageCircle, MapPin, Clock, CheckCircle, Play, AlertCircle } from 'lucide-react';

export default function TechnicianDashboard({ userRole, user }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    price: '',
    notes: '',
  });
  const [error, setError] = useState('');

  if (userRole !== 'technician' && userRole !== 'owner') {
    return <div className="p-4 text-gray-400">Zugriff verweigert</div>;
  }

  useEffect(() => {
    loadTodayInterventions();
    const interval = setInterval(loadTodayInterventions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayInterventions = async () => {
    try {
      const { data, error } = await getInterventions();
      if (!error && data) {
        const today = new Date().toDateString();
        // Nur Einsätze des aktuellen Technikers
        const filtered = data.filter(
          (i) => new Date(i.date).toDateString() === today && 
                i.technician_id === user.id  // USER ID NICHT TECHNICIAN ID!
        );
        setInterventions(filtered.sort((a, b) => new Date(a.date) - new Date(b.date)));
      }
    } catch (error) {
      console.error('Error loading interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePrice = (price) => {
    const num = parseFloat(price);
    if (num <= 0) return 'Betrag muss > 0 sein';
    if (num > 5000) return 'Betrag ungewöhnlich hoch - bitte überprüfen';
    return '';
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'in_progress' && !interventions.find(i => i.id === id)?.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      await updateInterventionStatus(id, newStatus, updateData);
      await loadTodayInterventions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fehler beim Status ändern');
    }
  };

  const handleSubmit = async (id) => {
    setError('');

    const priceError = validatePrice(formData.price);
    if (priceError) {
      setError(priceError);
      return;
    }

    if (!formData.notes.trim()) {
      setError('Notiz erforderlich');
      return;
    }

    try {
      const isOwner = userRole === 'owner';
      const status = isOwner ? 'completed' : 'in_progress';
      const approvalStatus = isOwner ? 'approved' : 'pending';

      await updateInterventionStatus(id, status, {
        price: parseFloat(formData.price),
        notes: formData.notes,
        ended_at: new Date().toISOString(),
        approval_status: approvalStatus,
      });

      if (isOwner) {
        await autoCreateInvoice(id, parseFloat(formData.price));
      }

      setSelectedId(null);
      setFormData({ price: '', notes: '' });
      await loadTodayInterventions();
    } catch (error) {
      console.error('Error submitting intervention:', error);
      alert('Fehler beim Einreichen');
    }
  };

  const handleReset = async (id) => {
    if (confirm('Status zurücksetzen auf "In Arbeit"?')) {
      try {
        await updateInterventionStatus(id, 'in_progress', {
          approval_status: 'draft',
          rejection_reason: null,
        });
        await loadTodayInterventions();
      } catch (error) {
        console.error('Error resetting intervention:', error);
        alert('Fehler beim Zurücksetzen');
      }
    }
  };

  const calculateDuration = (intervention) => {
    if (!intervention.started_at || !intervention.ended_at) return null;
    const start = new Date(intervention.started_at);
    const end = new Date(intervention.ended_at);
    const minutes = Math.round((end - start) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status, approvalStatus) => {
    if (approvalStatus === 'rejected') return 'bg-red-600';
    if (approvalStatus === 'pending') return 'bg-yellow-600';
    if (approvalStatus === 'approved') return 'bg-green-600';
    
    switch (status) {
      case 'planned':
        return 'bg-gray-600';
      case 'in_progress':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-green-600';
      default:
        return 'bg-gray-700';
    }
  };

  const getStatusLabel = (status, approvalStatus) => {
    if (approvalStatus === 'pending') return 'Zur Genehmigung';
    if (approvalStatus === 'rejected') return 'Abgelehnt';
    if (approvalStatus === 'approved') return 'Genehmigt';
    
    const labels = {
      planned: 'Geplant',
      in_progress: 'In Arbeit',
      completed: 'Beendet',
    };
    return labels[status] || status;
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Heute Einsätze</h1>
        <p className="text-gray-400 mb-6">{interventions.length} Einsätze geplant</p>

        {interventions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">Keine Einsätze für heute</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-bold text-white ${getStatusColor(intervention.status, intervention.approval_status)}`}>
                    {getStatusLabel(intervention.status, intervention.approval_status)}
                  </span>
                </div>

                {/* Rejection Alert */}
                {intervention.approval_status === 'rejected' && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded flex items-start gap-2">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Abgelehnt</p>
                      <p className="text-xs text-red-300">{intervention.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-300">
                  <p>📍 {intervention.clients?.address || 'Keine Adresse'}</p>
                  <p>📞 {intervention.clients?.phone || 'Keine Nummer'}</p>
                  {intervention.started_at && (
                    <p>⏱️ Dauer: {calculateDuration(intervention)}</p>
                  )}
                </div>

                {/* Action Buttons */}
                {intervention.approval_status !== 'approved' && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <a
                      href={`tel:${intervention.clients?.phone}`}
                      className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition text-sm"
                    >
                      <Phone size={16} />
                      Anrufen
                    </a>

                    <a
                      href={`https://wa.me/${intervention.clients?.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[100px] bg-green-500 hover:bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2 transition text-sm"
                    >
                      <MessageCircle size={16} />
                      Chat
                    </a>

                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(intervention.clients?.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2 transition text-sm"
                    >
                      <MapPin size={16} />
                      Karte
                    </a>
                  </div>
                )}

                {/* Status Buttons */}
                {intervention.approval_status !== 'pending' && intervention.approval_status !== 'approved' && (
                  <div className="flex gap-2 mb-4">
                    {intervention.status === 'planned' && (
                      <button
                        onClick={() => handleStatusChange(intervention.id, 'in_progress')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2 transition font-medium text-sm"
                      >
                        <Play size={16} />
                        Unterwegs
                      </button>
                    )}

                    {(intervention.status === 'planned' || intervention.status === 'in_progress') && (
                      <button
                        onClick={() => setSelectedId(intervention.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition font-medium text-sm"
                      >
                        <CheckCircle size={16} />
                        Einreichen
                      </button>
                    )}
                  </div>
                )}

                {/* Completion Form */}
                {selectedId === intervention.id && (
                  <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
                    {error && (
                      <div className="p-3 bg-red-900/30 border border-red-700 rounded">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <div>
                      <label className="label">Betrag (DT) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input-field"
                        placeholder="z.B. 250"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Notiz *</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="input-field h-20 resize-none"
                        placeholder="z.B. Kompressor + Kältemittel Wechsel"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmit(intervention.id)}
                        className="flex-1 btn-primary"
                      >
                        Zur Genehmigung einreichen
                      </button>
                      <button
                        onClick={() => {
                          setSelectedId(null);
                          setError('');
                        }}
                        className="flex-1 btn-secondary"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending Info */}
                {intervention.approval_status === 'pending' && (
                  <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                    <p className="text-sm text-yellow-400 font-medium">⏳ Wartet auf Genehmigung</p>
                    <div className="text-sm">
                      <p className="text-gray-300">
                        <strong>Betrag:</strong> {intervention.price?.toFixed(2) || '-'} DT
                      </p>
                      {intervention.notes && (
                        <p className="text-gray-300">
                          <strong>Notiz:</strong> {intervention.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleReset(intervention.id)}
                      className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm transition"
                    >
                      Status zurücksetzen
                    </button>
                  </div>
                )}

                {/* Approved Info */}
                {intervention.approval_status === 'approved' && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-sm text-green-400 font-medium">✅ Genehmigt - Rechnung erstellt</p>
                    <div className="text-sm mt-2">
                      <p className="text-gray-300">
                        <strong>Betrag:</strong> {intervention.price?.toFixed(2) || '-'} DT
                      </p>
                    </div>
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