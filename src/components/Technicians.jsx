import { useState, useEffect } from 'react';
import { getTechnicians, createTechnicianRecord, updateTechnicianRecord, deleteTechnicianRecord } from '../services/supabase';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'technician',
  });

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    try {
      const { data, error } = await getTechnicians();
      if (!error) {
        setTechnicians(data || []);
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Name ist erforderlich');
      return;
    }

    try {
      if (editingId) {
        await updateTechnicianRecord(editingId, formData);
      } else {
        await createTechnicianRecord({
          ...formData,
          role: 'technician',
          created_at: new Date().toISOString(),
        });
      }
      
      setFormData({ name: '', phone: '', email: '', role: 'technician' });
      setEditingId(null);
      setShowForm(false);
      await loadTechnicians();
    } catch (error) {
      console.error('Error saving technician:', error);
      alert('Fehler beim Speichern');
    }
  };

  const handleEdit = (technician) => {
    setFormData(technician);
    setEditingId(technician.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Diesen Techniker wirklich löschen?')) {
      try {
        await deleteTechnicianRecord(id);
        await loadTechnicians();
      } catch (error) {
        console.error('Error deleting technician:', error);
        alert('Fehler beim Löschen');
      }
    }
  };

  const filteredTechnicians = technicians.filter((technician) =>
    technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Techniker</h1>
          <p className="text-gray-400">Verwalte deine Techniker</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', role: 'technician' });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Neuer Techniker
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Nach Name oder Telefon suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? 'Techniker bearbeiten' : 'Neuer Techniker'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>
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

      {/* Technicians List */}
      <div className="space-y-3">
        {filteredTechnicians.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">
              {searchTerm ? 'Keine Techniker gefunden' : 'Keine Techniker vorhanden'}
            </p>
          </div>
        ) : (
          filteredTechnicians.map((technician) => (
            <div key={technician.id} className="card hover:bg-gray-700/50 transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-1">{technician.name}</h3>
                  <div className="space-y-1">
                    {technician.phone && (
                      <p className="text-sm text-gray-400">📱 {technician.phone}</p>
                    )}
                    {technician.email && (
                      <p className="text-sm text-gray-400">✉️ {technician.email}</p>
                    )}
                    {technician.role && (
                      <p className="text-sm text-gray-400">👨‍🔧 {technician.role}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(technician)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(technician.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    <Trash2 size={18} />
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