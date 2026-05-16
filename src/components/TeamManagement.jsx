import { useState, useEffect } from 'react';
import { supabase, inviteTeamMember, getTeamInvitations } from '../services/supabase';
import { Plus, Copy, Check } from 'lucide-react';
import { Trash2 } from 'lucide-react';

export default function TeamManagement({ user, userRole }) {
  const [invitations, setInvitations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',      // NEU!
    phone: '',
    role: 'technician',
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (userRole === 'owner') loadInvitations();
  }, [userRole]);

  const loadInvitations = async () => {
    try {
      const { data } = await getTeamInvitations(user.id);
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAcceptInviteLink = (invitation) => {
  return `${window.location.origin}/accept-invite?token=${invitation.token}`;
  };
  
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Name, Email und Telefon erforderlich');
      return;
    }

    try {
      await inviteTeamMember(
        user.id,
        formData.name,
        formData.email,  // NEU!
        formData.phone,
        formData.role
      );
      setFormData({ name: '', email: '', phone: '', role: 'technician' });
      await loadInvitations();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateWhatsAppLink = (invitation) => {
    if (!invitation.phone) {
      return '#'; // Fallback wenn keine Telefon
    }
    const inviteURL = `${window.location.origin}/accept-invite?token=${invitation.token}`;
    const message = `Hallo ${invitation.name}, deine Zugangsdaten:\n\nBenutzername: ${invitation.email}\nPasswort: [dein Password]\n\nAkzeptiere Einladung: ${inviteURL}`;
    return `https://wa.me/${invitation.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const copyToClipboard = (text, invId) => {
    navigator.clipboard.writeText(text);
    setCopied(invId);
    setTimeout(() => setCopied(null), 2000);
  };

  if (userRole !== 'owner') {
    return <div className="p-4 text-gray-400">Nur Owner</div>;
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Team Management</h1>

      {/* Invite Form */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Team-Member einladen</h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Ahmed"
              required
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="ahmed@gmail.com"
              required
            />
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
              placeholder="+216 20 123 456"
              required
            />
          </div>
          <div>
            <label className="label">Rolle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
            >
              <option value="technician">Techniker</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Einladen
          </button>
        </form>
      </div>
      {/* Invitations List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white mb-4">Ausstehende Einladungen</h2>
        {invitations.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            Keine ausstehenden Einladungen
          </div>
        ) : (
          invitations.map((inv) => (
            <div key={inv.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-white font-bold">{inv.name}</p>
                  <p className="text-sm text-gray-400">
                    {inv.role} • {inv.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={generateWhatsAppLink(inv)} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    WhatsApp
                  </a>
                  <button
                    onClick={() => copyToClipboard(getAcceptInviteLink(inv), inv.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    {copied === inv.id ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Einladung wirklich löschen?')) {
                        try {
                          await supabase.from('team_invitations').delete().eq('id', inv.id);
                          await loadInvitations();
                        } catch (error) {
                          alert('Fehler beim Löschen');
                        }
                      }
                    }}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}