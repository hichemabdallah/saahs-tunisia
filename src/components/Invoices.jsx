import { useState, useEffect } from 'react';
import { getInvoices, createInvoice, updateInvoice, getInterventions } from '../services/supabase';
import { Plus, Download, Share2, Edit2, Check } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    intervention_id: '',
    total: '',
    status: 'open',
    items: [{ description: '', amount: '', quantity: 1 }],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invRes, intRes] = await Promise.all([
        getInvoices(),
        getInterventions(),
      ]);

      setInvoices(invRes.data || []);
      setInterventions(intRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.intervention_id || !formData.total) {
      alert('Einsatz und Betrag sind erforderlich');
      return;
    }

    try {
      if (editingId) {
        await updateInvoice(editingId, {
          intervention_id: formData.intervention_id,
          total: parseFloat(formData.total),
          status: formData.status,
        });
      } else {
        await createInvoice({
          intervention_id: formData.intervention_id,
          total: parseFloat(formData.total),
          status: formData.status,
          pdf_url: null,
          created_at: new Date().toISOString(),
        });
      }
      
      setFormData({
        intervention_id: '',
        total: '',
        status: 'open',
        items: [{ description: '', amount: '', quantity: 1 }],
      });
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Fehler beim Speichern');
    }
  };

  const handleMarkPaid = async (id, currentStatus) => {
    try {
      await updateInvoice(id, {
        status: currentStatus === 'paid' ? 'open' : 'paid',
      });
      await loadData();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const generatePDF = (invoice) => {
    const intervention = interventions.find((i) => i.id === invoice.intervention_id);
    const clientName = intervention?.clients?.name || 'Unbekannt';
    
    // Simple HTML to PDF simulation
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rechnung #${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { margin-bottom: 40px; }
          .company { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          h1 { color: #333; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f0f0f0; }
          .total { font-size: 18px; font-weight: bold; text-align: right; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">SaaS Tunisia</div>
          <p>Einsatz- & Rechnungssoftware</p>
        </div>
        
        <h1>Rechnung #${invoice.id}</h1>
        
        <div style="margin-bottom: 30px;">
          <strong>Kunde:</strong> ${clientName}<br>
          <strong>Datum:</strong> ${new Date(invoice.created_at).toLocaleDateString('de-DE')}<br>
          <strong>Status:</strong> ${invoice.status === 'paid' ? 'Bezahlt' : 'Offen'}
        </div>
        
        <table>
          <tr>
            <th>Beschreibung</th>
            <th style="text-align: right;">Betrag (DT)</th>
          </tr>
          <tr>
            <td>Dienstleistungen & Materialien</td>
            <td style="text-align: right;">${invoice.total.toFixed(2)}</td>
          </tr>
        </table>
        
        <div class="total">
          Gesamtbetrag: ${invoice.total.toFixed(2)} DT
        </div>
        
        <div class="footer">
          <p>Vielen Dank für Ihr Vertrauen!</p>
          <p>SaaS Tunisia - Ihre Einsatzplanung</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rechnung_${invoice.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = (invoice) => {
    const intervention = interventions.find((i) => i.id === invoice.intervention_id);
    const clientName = intervention?.clients?.name || 'Kunde';
    const clientPhone = intervention?.clients?.phone || '';
    
    const message = `Hallo ${clientName},\n\nHier ist Ihre Rechnung #${invoice.id}\nBetrag: ${invoice.total.toFixed(2)} DT\n\nVielen Dank!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    if (clientPhone) {
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Keine Telefonnummer für diesen Kunden vorhanden');
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) => filterStatus === 'all' || invoice.status === filterStatus
  );

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rechnungen</h1>
          <p className="text-gray-400">Erstelle und verwalte Rechnungen</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              intervention_id: '',
              total: '',
              status: 'open',
              items: [{ description: '', amount: '', quantity: 1 }],
            });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Neue Rechnung
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Offene Rechnungen</p>
          <p className="text-2xl font-bold text-white">
            {invoices.filter((i) => i.status === 'open').length}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Bezahlte Rechnungen</p>
          <p className="text-2xl font-bold text-green-400">
            {invoices.filter((i) => i.status === 'paid').length}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm mb-1">Gesamtumsatz</p>
          <p className="text-2xl font-bold text-blue-400">{totalRevenue.toFixed(2)} DT</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        {[
          { value: 'all', label: 'Alle' },
          { value: 'open', label: 'Offen' },
          { value: 'paid', label: 'Bezahlt' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
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
            {editingId ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Einsatz *</label>
                <select
                  value={formData.intervention_id}
                  onChange={(e) => setFormData({ ...formData, intervention_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Einsatz wählen --</option>
                  {interventions.map((intervention) => (
                    <option key={intervention.id} value={intervention.id}>
                      {intervention.clients?.name} - {new Date(intervention.date).toLocaleDateString('de-DE')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Betrag (DT) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: e.target.value })}
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
                  <option value="open">Offen</option>
                  <option value="paid">Bezahlt</option>
                </select>
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

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">Keine Rechnungen vorhanden</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const intervention = interventions.find((i) => i.id === invoice.intervention_id);
            return (
              <div key={invoice.id} className="card hover:bg-gray-700/50 transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        Rechnung #{invoice.id}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-orange-900/50 text-orange-400'
                      }`}>
                        {invoice.status === 'paid' ? 'Bezahlt' : 'Offen'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">
                        👤 {intervention?.clients?.name || 'Unbekannt'}
                      </p>
                      <p className="text-sm text-gray-400">
                        📅 {new Date(invoice.created_at).toLocaleDateString('de-DE')}
                      </p>
                      <p className="text-lg font-bold text-blue-400 mt-2">
                        {invoice.total?.toFixed(2) || '0.00'} DT
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => generatePDF(invoice)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      title="PDF herunterladen"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleWhatsApp(invoice)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                      title="Per WhatsApp senden"
                    >
                      <Share2 size={18} />
                    </button>
                    <button
                      onClick={() => handleMarkPaid(invoice.id, invoice.status)}
                      className={`p-2 rounded-lg transition ${
                        invoice.status === 'paid'
                          ? 'bg-gray-600 hover:bg-gray-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                      title={invoice.status === 'paid' ? 'Als offen markieren' : 'Als bezahlt markieren'}
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
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
