import { useState, useEffect } from 'react';
import { getInterventions, createIntervention, updateIntervention, getClients, getTechnicians } from '../services/supabase';
import { Plus, Trash2, Edit2, Calendar, MapPin } from 'lucide-react';

export default function Interventions() {
  const [interventions, setInterventions] = useState([]);
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    client_id: '',
    technician_id: '',
    type: 'maintenance',
    date: '',
    status: 'planned',
    description: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [intRes, clientRes, techRes] = await Promise.all([
        getInterventions(),
        getClients(),
        getTechnicians(),
      ]);

      setInterventions(intRes.data || []);
      setClients(clientRes.data || []);
      setTechnicians(techRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.technician_id || !formData.date) {
      alert('Kunde, Techniker und Datum sind erforderlich');
      return;
    }

    try {
      if (editingId) {
        await updateIntervention(editingId, formData);
      } else {
        await createIntervention({
          ...formData,
          created_at: new Date().toISOString(),
        });
      }
      
      setFormData({
        client_id: '',
        technician_id: '',
        type: 'maintenance',
        date: '',
        status: 'planned',
        description: '',
        notes: '',
      });
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving intervention:', error);
      alert('Fehler beim Speichern');
    }
  };

  const handleEdit = (intervention) => {
    setFormData({
      ...intervention,
      date: intervention.date.split('T')[0],
    });
    setEditingId(intervention.id);
    setShowForm(true);
  };

  const filteredInterventions = interventions.filter(
    (intervention) => filterStatus === 'all' || intervention.status === filterStatus
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-600 text-gray-200';
      case 'in_progress':
        return 'bg-blue-900/50 text-blue-400';
      case 'completed':
        return 'bg-green-900/50 text-green-400';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      installation: 'Installation',
      maintenance: 'Wartung',
      repair: 'Reparatur',
    };
    return types[type] || type;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Einsätze</h1>
          <p className="text-gray-400">Plane und verwalte Einsätze</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              client_id: '',
              technician_id: '',
              type: 'maintenance',
              date: '',
              status: 'planned',
              description: '',
              notes: '',
            });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Neuer Einsatz
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Alle' },
          { value: 'planned', label: 'Geplant' },
          { value: 'in_progress', label: 'In Bearbeitung' },
          { value: 'completed', label: 'Beendet' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filterStatus === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? 'Einsatz bearbeiten' : 'Neuer Einsatz'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Kunde *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Kunde wählen --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Techniker *</label>
                <select
                  value={formData.technician_id}
                  onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Techniker wählen --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Typ</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="installation">Installation</option>
                  <option value="maintenance">Wartung</option>
                  <option value="repair">Reparatur</option>
                </select>
              </div>
              <div>
                <label className="label">Datum *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="planned">Geplant</option>
                  <option value="in_progress">In Bearbeitung</option>
                  <option value="completed">Beendet</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field h-20 resize-none"
              />
            </div>
            <div>
              <label className="label">Notizen</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field h-20 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interventions List */}
      <div className="space-y-3">
        {filteredInterventions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">Keine Einsätze vorhanden</p>
          </div>
        ) : (
          filteredInterventions.map((intervention) => (
            <div key={intervention.id} className="card hover:bg-gray-700/50 transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {intervention.clients?.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${getStatusColor(intervention.status)}`}>
                      {intervention.status === 'planned' && 'Geplant'}
                      {intervention.status === 'in_progress' && 'In Bearbeitung'}
                      {intervention.status === 'completed' && 'Beendet'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      📋 {getTypeLabel(intervention.type)}
                    </p>
                    <p className="text-sm text-gray-400">
                      👨‍🔧 {intervention.technicians?.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      📅 {new Date(intervention.date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(intervention)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-400">Lädt...</p>
        </div>
      )}
    </div>
  );
}
