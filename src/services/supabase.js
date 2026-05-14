import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth Functions
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user;
};

// Clients (Kunden)
export const getClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createClientRecord = async (clientData) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select();
  return { data, error };
};

export const updateClientRecord= async (id, clientData) => {
  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select();
  return { data, error };
};

export const deleteClientRecord = async (id) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  return { error };
};

// Interventions (Einsätze)
export const getInterventions = async () => {
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      *,
      clients(name, phone),
      technicians(name, phone)
    `)
    .order('date', { ascending: false });
  return { data, error };
};

export const createIntervention = async (interventionData) => {
  const { data, error } = await supabase
    .from('interventions')
    .insert([interventionData])
    .select();
  return { data, error };
};

export const updateIntervention = async (id, interventionData) => {
  const { data, error } = await supabase
    .from('interventions')
    .update(interventionData)
    .eq('id', id)
    .select();
  return { data, error };
};

// Invoices (Rechnungen)
export const getInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      interventions(client_id, clients(name))
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createInvoice = async (invoiceData) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select();
  return { data, error };
};

export const updateInvoice = async (id, invoiceData) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', id)
    .select();
  return { data, error };
};

// Technicians
// Technicians
export const getTechnicians = async () => {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createTechnicianRecord = async (technicianData) => {
  const { data, error } = await supabase
    .from('technicians')
    .insert([technicianData])
    .select();
  return { data, error };
};

export const updateTechnicianRecord = async (id, technicianData) => {
  const { data, error } = await supabase
    .from('technicians')
    .update(technicianData)
    .eq('id', id)
    .select();
  return { data, error };
};

export const deleteTechnicianRecord = async (id) => {
  const { error } = await supabase
    .from('technicians')
    .delete()
    .eq('id', id);
  return { error };
};

export const updateInterventionStatus = async (id, status, data = {}) => {
  const updateData = { status, ...data };
  
  if (status === 'in_progress' && !data.started_at) {
    updateData.started_at = new Date().toISOString();
  }
  if (status === 'completed' && !data.ended_at) {
    updateData.ended_at = new Date().toISOString();
  }
  
  const { data: result, error } = await supabase
    .from('interventions')
    .update(updateData)
    .eq('id', id)
    .select();
  return { data: result, error };
};

export const approveIntervention = async (id) => {
  const { data, error } = await supabase
    .from('interventions')
    .update({ status: 'completed', approval_status: 'approved' })
    .eq('id', id)
    .select();
  return { data, error };
};

export const rejectIntervention = async (id, reason) => {
  const { data, error } = await supabase
    .from('interventions')
    .update({ 
      status: 'in_progress',
      approval_status: 'rejected',
      rejection_reason: reason 
    })
    .eq('id', id)
    .select();
  return { data, error };
};

export const autoCreateInvoice = async (interventionId, total) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([{
      intervention_id: interventionId,
      total: total,
      status: 'open',
      auto_created: true,
      created_at: new Date().toISOString(),
    }])
    .select();
  return { data, error };
};
export const switchUserRole = async (userId, newRole) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select();
  return { data, error };
};

export const getUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return { data, error };
};