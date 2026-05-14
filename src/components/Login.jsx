import { useState } from 'react';
import { signIn, signUp } from '../services/supabase';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'); // signin or signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = mode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">SaaS Tunisia</h1>
          <p className="text-gray-400">Einsatz- & Rechnungssoftware</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">
            {mode === 'signin' ? 'Anmelden' : 'Registrieren'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Lädt...' : mode === 'signin' ? 'Anmelden' : 'Registrieren'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm transition"
            >
              {mode === 'signin'
                ? 'Noch kein Konto? Jetzt registrieren'
                : 'Hast du schon ein Konto? Anmelden'}
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400 text-xs">
            Demo: test@example.com / password123
          </p>
        </div>
      </div>
    </div>
  );
}
