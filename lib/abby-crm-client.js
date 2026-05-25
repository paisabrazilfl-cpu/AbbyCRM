/**
 * ABBY CRM Client - Direct API integration for OpenClaw
 * Use this to make real API calls to AbbyCRM from any agent
 */

const axios = require('axios');

const MTOS_API_BASE = process.env.MTOS_API_BASE || 'https://mtos-api.onrender.com';
const MTOS_API_KEY = process.env.MTOS_API_KEY || 'demo-key';

const api = axios.create({
  baseURL: MTOS_API_BASE,
  headers: {
    'Authorization': `Bearer ${MTOS_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// ====================
// LEADS
// ====================

async function listLeads(params = {}) {
  // params: tort, state, status, assigned_to, limit, offset
  const response = await api.get('/api/leads', { params });
  return response.data;
}

async function getLead(id) {
  const response = await api.get(`/api/leads/${id}`);
  return response.data;
}

async function createLead(leadData) {
  // leadData: { name, tort_type, state, phone, email, injury_type, damages_estimate, ... }
  const response = await api.post('/api/leads', leadData);
  return response.data;
}

async function updateLead(id, updates) {
  // updates: { assigned_to, status, notes, npi_number, ... }
  const response = await api.patch(`/api/leads/${id}`, updates);
  return response.data;
}

async function deleteLead(id) {
  await api.delete(`/api/leads/${id}`);
  return { ok: true, lead_id: id };
}

// ====================
// CASES
// ====================

async function listCases(params = {}) {
  // params: tort, state, status, lead_id, limit, offset
  const response = await api.get('/api/cases', { params });
  return response.data;
}

async function getCase(id) {
  const response = await api.get(`/api/cases/${id}`);
  return response.data;
}

async function createCase(caseData) {
  const response = await api.post('/api/cases', caseData);
  return response.data;
}

async function updateCase(id, updates) {
  const response = await api.patch(`/api/cases/${id}`, updates);
  return response.data;
}

async function advanceCase(id, newStatus) {
  // status: intake -> screening -> qualified -> filed -> settled -> closed
  const response = await api.patch(`/api/cases/${id}`, { status: newStatus });
  return response.data;
}

// ====================
// PARALEGALS
// ====================

async function listParalegals(params = {}) {
  // params: tort, state, sort (load_asc, load_desc)
  const response = await api.get('/api/paralegals', { params });
  return response.data;
}

async function assignLeadToParalegal(leadId, paralegalId) {
  const response = await api.patch(`/api/leads/${leadId}`, {
    assigned_to: paralegalId,
    notes: `Assigned by ABBY agent`
  });
  return response.data;
}

async function autoRouteLead(leadId, tort, state) {
  // Get lowest-load paralegal for this tort/state
  const paralegals = await listParalegals({ tort, state, sort: 'load_asc' });
  
  if (!paralegals || paralegals.length === 0) {
    return { error: `No paralegals available for ${tort} in ${state}` };
  }
  
  const chosen = paralegals[0];
  return assignLeadToParalegal(leadId, chosen.user_id || chosen.id);
}

// ====================
// PROVIDERS / NPI
// ====================

async function searchNPI(params = {}) {
  // params: first_name, last_name, state, OR npi (single)
  const response = await api.get('/api/npi/search', { params });
  return response.data;
}

async function verifyNPI(npiNumber) {
  const response = await api.get('/api/npi/search', { params: { npi: npiNumber } });
  const results = response.data.results || [];
  return {
    verified: results.length > 0,
    provider: results[0] || null
  };
}

async function listProviders(params = {}) {
  const response = await api.get('/api/providers', { params });
  return response.data;
}

async function createProvider(providerData) {
  const response = await api.post('/api/providers', providerData);
  return response.data;
}

// ====================
// DOCUMENTS
// ====================

async function listDocuments(params = {}) {
  // params: lead_id, case_id, type
  const response = await api.get('/api/documents', { params });
  return response.data;
}

async function uploadDocument(fileBuffer, filename, metadata = {}) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fileBuffer, filename);
  if (metadata.lead_id) form.append('lead_id', metadata.lead_id);
  if (metadata.case_id) form.append('case_id', metadata.case_id);
  if (metadata.type) form.append('type', metadata.type);
  
  const response = await api.post('/api/documents', form, {
    headers: { ...form.getHeaders() }
  });
  return response.data;
}

// ====================
// INVOICES
// ====================

async function listInvoices(params = {}) {
  // params: case_id, status
  const response = await api.get('/api/invoices', { params });
  return response.data;
}

async function createInvoice(invoiceData) {
  const response = await api.post('/api/invoices', invoiceData);
  return response.data;
}

// ====================
// REPORTS
// ====================

async function getLeadReport(params = {}) {
  // params: start_date, end_date, group_by (day, week, month)
  const response = await api.get('/api/reports/leads', { params });
  return response.data;
}

async function getCaseReport(params = {}) {
  const response = await api.get('/api/reports/cases', { params });
  return response.data;
}

// ====================
// ELIGIBILITY
// ====================

async function checkEligibility(leadData) {
  const { tort_type, state, injury_type, damages_estimate } = leadData;
  
  // Favorable states for mass tort
  const favorableStates = ['TX', 'FL', 'CA', 'NY', 'PA', 'IL', 'OH'];
  const minDamages = 50000;
  
  const eligible = damages_estimate >= minDamages && favorableStates.includes(state);
  
  let reasons = [];
  if (damages_estimate >= minDamages) {
    reasons.push('Damages estimate meets minimum threshold');
  } else {
    reasons.push('Damages estimate below minimum');
  }
  
  if (favorableStates.includes(state)) {
    reasons.push('State is litigation-friendly');
  } else {
    reasons.push('State may not be favorable for litigation');
  }
  
  return {
    eligible,
    score: eligible ? 85 : 40,
    reasons,
    details: { tort_type, state, damages_estimate }
  };
}

// ====================
// EXPORTS
// ====================

module.exports = {
  // Leads
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  
  // Cases
  listCases,
  getCase,
  createCase,
  updateCase,
  advanceCase,
  
  // Paralegals
  listParalegals,
  assignLeadToParalegal,
  autoRouteLead,
  
  // Providers/NPI
  searchNPI,
  verifyNPI,
  listProviders,
  createProvider,
  
  // Documents
  listDocuments,
  uploadDocument,
  
  // Invoices
  listInvoices,
  createInvoice,
  
  // Reports
  getLeadReport,
  getCaseReport,
  
  // Eligibility
  checkEligibility,
  
  // Config
  api,
  MTOS_API_BASE,
  MTOS_API_KEY
};
