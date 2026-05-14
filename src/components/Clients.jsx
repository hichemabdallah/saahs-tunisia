import { useState, useEffect } from 'react';
import { getClients, createClientRecord, updateClientRecord, deleteClientRecord } from '../services/supabase';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await getClients();
      console.log('Clients loaded:', data, error);
      if (!error) {
        setClients(data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
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
        await updateClientRecord(editingId, formData);
      } else {
        await createClientRecord({
          ...formData,
          created_at: new Date().toISOString(),
        });
      }
      
      setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
      setEditingId(null);
      setShowForm(false);
      await loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Fehler beim Speichern');
    }
  };

  const handleEdit = (client) => {
    setFormData(client);
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Diesen Kunden wirklich löschen?')) {
      try {
        await deleteClientRecord(id);
        await loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Fehler beim Löschen');
      }
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Kunden</h1>
          <p className="text-gray-400">Verwalte deine Kundendaten</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Neuer Kunde
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
            {editingId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
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
              <div>
                <label className="label">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                />
              </div>
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

      {/* Clients List */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">
              {searchTerm ? 'Keine Kunden gefunden' : 'Keine Kunden vorhanden'}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="card hover:bg-gray-700/50 transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-1">{client.name}</h3>
                  <div className="space-y-1">
                    {client.phone && (
                      <p className="text-sm text-gray-400">📱 {client.phone}</p>
                    )}
                    {client.address && (
                      <p className="text-sm text-gray-400">📍 {client.address}</p>
                    )}
                    {client.email && (
                      <p className="text-sm text-gray-400">✉️ {client.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
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
