import { useState, useEffect } from 'react';
import { getInterventions, getInvoices, getClients } from '../services/supabase';
import { Calendar, DollarSign, Users, AlertCircle } from 'lucide-react';

export default function Dashboard({ userRole }) {
  const [interventions, setInterventions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  
  if (userRole !== 'owner') {
    return <div className="p-4 text-gray-400">Nur Owner Zugriff</div>;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [intRes, invRes, clientRes] = await Promise.all([
        getInterventions(),
        getInvoices(),
        getClients(),
      ]);

      setInterventions(intRes.data || []);
      setInvoices(invRes.data || []);
      setClients(clientRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayInterventions = interventions.filter(
    (i) => new Date(i.date).toDateString() === new Date().toDateString()
  );

  const openInvoices = invoices.filter((i) => i.status === 'open');
  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Willkommen zurück! Hier ist ein Überblick.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Calendar}
          label="Einsätze heute"
          value={todayInterventions.length}
          color="bg-blue-600"
        />
        <StatCard
          icon={DollarSign}
          label="Offene Rechnungen"
          value={openInvoices.length}
          color="bg-orange-600"
        />
        <StatCard
          icon={Users}
          label="Gesamtkunden"
          value={clients.length}
          color="bg-green-600"
        />
        <StatCard
          icon={DollarSign}
          label="Umsatz (bezahlt)"
          value={`${totalRevenue.toFixed(2)} DT`}
          color="bg-purple-600"
        />
      </div>

      {/* Today's Interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Einsätze heute</h2>
          {todayInterventions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto mb-2 text-gray-500" size={32} />
              <p className="text-gray-400">Keine Einsätze heute geplant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-white">
                      {intervention.clients?.name || 'Unbekannt'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      intervention.status === 'completed'
                        ? 'bg-green-900/50 text-green-400'
                        : intervention.status === 'in_progress'
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {intervention.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {intervention.type} • {intervention.technicians?.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Invoices */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Offene Rechnungen</h2>
          {openInvoices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto mb-2 text-gray-500" size={32} />
              <p className="text-gray-400">Keine offenen Rechnungen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openInvoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">Rechnung #{invoice.id}</p>
                      <p className="text-sm text-gray-400">
                        {invoice.interventions?.clients?.name}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {invoice.total?.toFixed(2)} DT
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-8 text-center">
          <p className="text-gray-400">Lädt...</p>
        </div>
      )}
    </div>
  );
}
