import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getInvitationByToken, acceptInvitation } from '../services/supabase';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvitation();
  }, []);

  const loadInvitation = async () => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Keine Einladung gefunden');
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await getInvitationByToken(token);
      if (err || !data) {
        setError('Einladung ungültig oder abgelaufen');
      } else {
        setInvitation(data);
      }
    } catch (error) {
      setError('Fehler beim Laden der Einladung');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    try {
      const token = searchParams.get('token');
      // Achtung: name ist jetzt nicht mehr nötig (kommt aus invitation)
      const { error: err } = await acceptInvitation(token, formData.password);

      if (err) {
        setError(err);
      } else {
        alert('Account erstellt! Du kannst dich jetzt einloggen.');
        navigate('/');
      }
    } catch (error) {
      setError('Fehler beim Erstellen des Accounts');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Lädt...</div>;
  }

  if (error && !invitation) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Willkommen, {invitation?.name}!</h1>

        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Deine Email</label>
            <input
              type="email"
              value={invitation?.email}
              disabled
              className="input-field opacity-50"
            />
          </div>

          <div>
            <label className="label">Passwort *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="Mindestens 8 Zeichen"
              required
            />
          </div>

          <div>
            <label className="label">Passwort wiederholen *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="Passwort wiederholen"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Account erstellen
          </button>
        </form>
      </div>
    </div>
  );
}