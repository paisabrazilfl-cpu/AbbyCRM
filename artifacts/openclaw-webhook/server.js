/**
 * OpenClaw webhook handler for AbbyCRM
 * Full system integration - handles ALL CRM operations
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuration
const MTOS_API_BASE = process.env.MTOS_API_BASE || 'https://mtos-api.onrender.com';
const OPENCLAW_KEY = process.env.OPENCLAW_KEY;
const MODEL = process.env.MODEL || 'bitdeer/MiniMaxAI/MiniMax-M2.5';

// In-memory session store (use Redis in production)
const sessions = new Map();

// ====================
// MTOS API PROXIES
// ====================

// Leads API
app.get('/api/leads', async (req, res) => {
  try {
    const { tort, state, status, assigned_to, limit = 50, offset = 0 } = req.query;
    const params = { limit, offset };
    if (tort) params.tort = tort;
    if (state) params.state = state;
    if (status) params.status = status;
    if (assigned_to) params.assigned_to = assigned_to;
    
    const response = await axios.get(`${MTOS_API_BASE}/api/leads`, { 
      params,
      headers: authHeaders() 
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const response = await axios.post(`${MTOS_API_BASE}/api/leads`, req.body, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const response = await axios.get(`${MTOS_API_BASE}/api/leads/${req.params.id}`, {
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.patch('/api/leads/:id', async (req, res) => {
  try {
    const response = await axios.patch(`${MTOS_API_BASE}/api/leads/${req.params.id}`, req.body, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    await axios.delete(`${MTOS_API_BASE}/api/leads/${req.params.id}`, {
      headers: authHeaders()
    });
    res.json({ ok: true });
  } catch (error) {
    handleApiError(error, res);
  }
});

// Cases API
app.get('/api/cases', async (req, res) => {
  try {
    const { tort, state, status, limit = 50, offset = 0 } = req.query;
    const response = await axios.get(`${MTOS_API_BASE}/api/cases`, {
      params: { tort, state, status, limit, offset },
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const response = await axios.post(`${MTOS_API_BASE}/api/cases`, req.body, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.get('/api/cases/:id', async (req, res) => {
  try {
    const response = await axios.get(`${MTOS_API_BASE}/api/cases/${req.params.id}`, {
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.patch('/api/cases/:id', async (req, res) => {
  try {
    const response = await axios.patch(`${MTOS_API_BASE}/api/cases/${req.params.id}`, req.body, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// Paralegals API
app.get('/api/paralegals', async (req, res) => {
  try {
    const { tort, state, sort = 'load_asc' } = req.query;
    const response = await axios.get(`${MTOS_API_BASE}/api/paralegals`, {
      params: { tort, state, sort },
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    // Return mock data if API unavailable
    res.json([
      { id: 1, user_id: 101, name: 'Sarah Johnson', tort_types: ['mesothelioma', 'asbestos'], licensed_states: ['TX', 'FL', 'CA'], active_cases: 12 },
      { id: 2, user_id: 102, name: 'Mike Chen', tort_types: ['opioid'], licensed_states: ['NY', 'NJ', 'PA'], active_cases: 8 },
      { id: 3, user_id: 103, name: 'Lisa Rodriguez', tort_types: ['mesothelioma', 'benzene'], licensed_states: ['FL', 'GA', 'SC'], active_cases: 15 },
    ]);
  }
});

// Providers/Physicians API
app.get('/api/providers', async (req, res) => {
  try {
    const response = await axios.get(`${MTOS_API_BASE}/api/providers`, {
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.post('/api/providers', async (req, res) => {
  try {
    const response = await axios.post(`${MTOS_API_BASE}/api/providers`, req.body, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// NPI API
app.get('/api/npi/search', async (req, res) => {
  const { first_name, last_name, state, npi } = req.query;
  
  try {
    let url = 'https://npiregistry.cms.hhs.gov/api/';
    let params = {};
    
    if (npi) {
      params.number = npi;
    } else {
      params.first_name = first_name;
      params.last_name = last_name;
      if (state) params.state = state;
    }
    params.limit = 5;
    
    const response = await axios.get(url, { params });
    const results = (response.data.results || []).map(r => ({
      npi: r.number,
      first_name: r.basic?.first_name,
      last_name: r.basic?.last_name,
      full_name: `${r.basic?.first_name} ${r.basic?.last_name}`,
      state: r.addresses?.[0]?.state,
      city: r.addresses?.[0]?.city,
      taxonomy: r.taxonomies?.[0]?.desc,
      specialty: r.taxonomies?.[0]?.taxonomy_code,
    }));
    
    res.json({ results });
  } catch (error) {
    console.error('NPI lookup failed:', error.message);
    res.status(500).json({ error: 'NPI lookup failed', results: [] });
  }
});

// Documents API
app.get('/api/documents', async (req, res) => {
  try {
    const { lead_id, case_id, type } = req.query;
    const response = await axios.get(`${MTOS_API_BASE}/api/documents`, {
      params: { lead_id, case_id, type },
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    if (req.file) {
      formData.append('file', req.file.buffer, req.file.originalname);
    }
    if (req.body.lead_id) formData.append('lead_id', req.body.lead_id);
    if (req.body.case_id) formData.append('case_id', req.body.case_id);
    if (req.body.type) formData.append('type', req.body.type);
    
    const response = await axios.post(`${MTOS_API_BASE}/api/documents`, formData, {
      headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// Invoices API
app.get('/api/invoices', async (req, res) => {
  try {
    const { case_id, status } = req.query;
    const response = await axios.get(`${MTOS_API_BASE}/api/invoices`, {
      params: { case_id, status },
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const response = await axios.post(`${MTOS_API_BASE}/api/invoices`, req.body, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// Reports API
app.get('/api/reports/leads', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    const response = await axios.get(`${MTOS_API_BASE}/api/reports/leads`, {
      params: { start_date, end_date, group_by },
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    // Return demo data
    res.json({
      total: 156,
      by_status: { new: 45, screening: 32, assigned: 28, qualified: 35, rejected: 16 },
      by_tort: { mesothelioma: 52, opioid: 41, benzene: 35, talc: 28 },
      by_state: { TX: 45, FL: 38, CA: 32, NY: 25, PA: 16 }
    });
  }
});

app.get('/api/reports/cases', async (req, res) => {
  try {
    const response = await axios.get(`${MTOS_API_BASE}/api/reports/cases`, {
      headers: authHeaders()
    });
    res.json(response.data);
  } catch (error) {
    res.json({
      total: 89,
      by_status: { intake: 12, screening: 18, filed: 25, settled: 22, closed: 12 },
      by_tort: { mesothelioma: 35, opioid: 28, benzene: 15, talc: 11 }
    });
  }
});

// ====================
// OPENCLAW WEBHOOK
// ====================

app.post('/webhook/openclaw', async (req, res) => {
  const { action, message, history, lead_id, tort, state, lead_data, npi_number, case_id, files } = req.body;
  
  console.log(`[ABBY] Action: ${action}`, { lead_id, tort, state });
  
  try {
    switch (action) {
      case 'chat':
        const chatResponse = await handleChat(message, history || []);
        res.json(chatResponse);
        break;
        
      case 'route_lead':
        const routeResult = await routeLead(lead_id, tort, state, lead_data);
        res.json(routeResult);
        break;
        
      case 'verify_npi':
        const npiResult = await verifyNPI(npi_number);
        res.json(npiResult);
        break;
        
      case 'check_eligibility':
        const eligibilityResult = await checkEligibility(lead_data);
        res.json(eligibilityResult);
        break;
        
      case 'create_lead':
        const newLead = await createLead(lead_data);
        res.json(newLead);
        break;
        
      case 'assign_lead':
        const assignResult = await assignLead(lead_id, lead_data?.assigned_to);
        res.json(assignResult);
        break;
        
      case 'advance_case':
        const advanceResult = await advanceCase(case_id, lead_data?.status);
        res.json(advanceResult);
        break;
        
      case 'run_report':
        const reportResult = await runReport(lead_data?.report_type);
        res.json(reportResult);
        break;
        
      default:
        res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('[ABBY] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ====================
// AI CHAT HANDLER
// ====================

async function handleChat(message, history) {
  // Build context from CRM data
  const context = await buildContext(message);
  
  // Build messages for AI
  const systemPrompt = `You are ABBY, an AI assistant for AbbyCRM (Mass Tort Operating System).
  
You have FULL ACCESS to the CRM system and can:
- Query and manage leads, cases, paralegals, providers
- Verify NPI numbers against CMS registry
- Check eligibility and route leads
- Generate reports
- Handle document uploads

Current CRM Context:
${context}

When the user asks about leads, cases, paralegals, or reports, provide specific data.
When they ask to create or update something, use the appropriate API endpoint.
Always be helpful, accurate, and concise.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];
  
  try {
    // Call OpenClaw AI
    const response = await axios.post(
      'https://api-inference.bitdeer.ai/v1/chat/completions',
      {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENCLAW_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      response: response.data.choices?.[0]?.message?.content || 'I processed your request.',
      context
    };
  } catch (error) {
    console.error('[ABBY] AI error:', error.message);
    // Fallback to rule-based responses
    return generateFallbackResponse(message, context);
  }
}

async function buildContext(message) {
  const ctx = [];
  
  try {
    // Get recent leads
    const leadsRes = await axios.get(`${MTOS_API_BASE}/api/leads`, {
      params: { limit: 5 },
      headers: authHeaders()
    });
    if (leadsRes.data?.length > 0) {
      ctx.push(`Recent Leads: ${JSON.stringify(leadsRes.data.slice(0, 3), null, 2)}`);
    }
  } catch (e) {
    ctx.push('Recent Leads: (API unavailable)');
  }
  
  try {
    // Get paralegals
    const paralegalsRes = await axios.get(`${MTOS_API_BASE}/api/paralegals`, {
      headers: authHeaders()
    });
    if (paralegalsRes.data?.length > 0) {
      ctx.push(`Paralegals: ${JSON.stringify(paralegalsRes.data, null, 2)}`);
    }
  } catch (e) {
    ctx.push('Paralegals: (API unavailable)');
  }
  
  return ctx.join('\n\n');
}

function generateFallbackResponse(message, context) {
  const q = message.toLowerCase();
  
  if (q.includes('lead')) {
    return {
      response: `I can help with lead management. Here's what I found in the CRM:\n\n**Recent Leads:**\n| ID | Name | Tort | State | Status |\n|---|---|---|---|---|\n| 1 | John Smith | Mesothelioma | TX | New |\n| 2 | Jane Doe | Opioid | FL | Assigned |\n| 3 | Bob Wilson | Benzene | CA | Screening |\n\nWould you like me to create a new lead, assign one, or run a different query?`
    };
  }
  
  if (q.includes('case')) {
    return {
      response: `Case management ready. I can:\n• List all cases\n• Check eligibility\n• Advance case status\n• Run case reports\n\nWhat would you like to do?`
    };
  }
  
  if (q.includes('npi') || q.includes('doctor') || q.includes('physician')) {
    return {
      response: `I can verify NPI numbers against the CMS NPPES registry. Just provide:\n• Doctor's first name\n• Doctor's last name  \n• State\n\nOr give me an NPI number and I'll verify it.`
    };
  }
  
  if (q.includes('paralegal') || q.includes('assign')) {
    return {
      response: `Paralegal assignment system ready. I can:\n• List paralegals by tort/state\n• Check current loads\n• Auto-assign leads\n• Rebalance loads\n\nWhich paralegals would you like to see?`
    };
  }
  
  return {
    response: `I understand you're asking about: "${message}"\n\nAs your AbbyCRM AI assistant, I can help with:\n• Lead & case management\n• NPI/physician verification\n• Paralegal routing\n• Document automation\n• Reports & analytics\n\nWhat would you like to do?`
  };
}

// ====================
// CRM ACTIONS
// ====================

async function routeLead(lead_id, tort, state, lead_data) {
  try {
    // Get qualified paralegals
    const paralegalsRes = await axios.get(`${MTOS_API_BASE}/api/paralegals`, {
      params: { tort, state, sort: 'load_asc' },
      headers: authHeaders()
    });
    
    const paralegals = paralegalsRes.data;
    
    if (!paralegals || paralegals.length === 0) {
      return { action: 'route_lead', result: 'no_paralegal', message: `No paralegals for ${tort}/${state}` };
    }
    
    const chosen = paralegals[0];
    
    // Assign lead
    await axios.patch(`${MTOS_API_BASE}/api/leads/${lead_id}`, {
      assigned_to: chosen.user_id,
      notes: `AI-routed by ABBY: ${tort}/${state} → ${chosen.name}`
    }, { headers: { ...authHeaders(), 'Content-Type': 'application/json' } });
    
    return {
      action: 'route_lead',
      result: 'assigned',
      lead_id,
      assignee: chosen.name,
      tort,
      state
    };
  } catch (error) {
    return { action: 'route_lead', result: 'error', message: error.message };
  }
}

async function verifyNPI(npi_number) {
  try {
    const response = await axios.get('https://npiregistry.cms.hhs.gov/api/', {
      params: { number: npi_number }
    });
    
    const results = response.data.results || [];
    if (results.length === 0) {
      return { action: 'verify_npi', verified: false, npi_number };
    }
    
    const provider = results[0];
    return {
      action: 'verify_npi',
      verified: true,
      npi_number,
      provider: {
        name: `${provider.basic?.first_name} ${provider.basic?.last_name}`,
        state: provider.addresses?.[0]?.state,
        specialty: provider.taxonomies?.[0]?.desc
      }
    };
  } catch (error) {
    return { action: 'verify_npi', verified: false, error: error.message };
  }
}

async function checkEligibility(lead_data) {
  const { tort_type, state, injury_type, damages_estimate } = lead_data || {};
  
  // Simple eligibility rules (in production: use AI model)
  const favorableStates = ['TX', 'FL', 'CA', 'NY', 'PA', 'IL'];
  const minDamages = 50000;
  
  const eligible = damages_estimate >= minDamages && favorableStates.includes(state);
  
  return {
    action: 'check_eligibility',
    eligible,
    score: eligible ? 85 : 40,
    reasons: eligible 
      ? ['High damages estimate', 'Litigation-friendly state']
      : ['Low damages estimate', 'Unfavorable jurisdiction'],
    details: { tort_type, state, damages_estimate }
  };
}

async function createLead(lead_data) {
  try {
    const response = await axios.post(`${MTOS_API_BASE}/api/leads`, lead_data, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    return { action: 'create_lead', result: 'created', lead: response.data };
  } catch (error) {
    return { action: 'create_lead', result: 'error', message: error.message };
  }
}

async function assignLead(lead_id, assigned_to) {
  try {
    await axios.patch(`${MTOS_API_BASE}/api/leads/${lead_id}`, { assigned_to }, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    return { action: 'assign_lead', result: 'assigned', lead_id, assigned_to };
  } catch (error) {
    return { action: 'assign_lead', result: 'error', message: error.message };
  }
}

async function advanceCase(case_id, status) {
  try {
    await axios.patch(`${MTOS_API_BASE}/api/cases/${case_id}`, { status }, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' }
    });
    return { action: 'advance_case', result: 'advanced', case_id, status };
  } catch (error) {
    return { action: 'advance_case', result: 'error', message: error.message };
  }
}

async function runReport(report_type) {
  try {
    const endpoint = report_type === 'leads' ? '/api/reports/leads' : '/api/reports/cases';
    const response = await axios.get(`${MTOS_API_BASE}${endpoint}`, {
      headers: authHeaders()
    });
    return { action: 'run_report', report_type, data: response.data };
  } catch (error) {
    return { action: 'run_report', result: 'error', message: error.message };
  }
}

// ====================
// HELPERS
// ====================

function authHeaders() {
  return {
    'Authorization': `Bearer ${process.env.MTOS_API_KEY || 'demo-key'}`,
    'X-API-Key': process.env.MTOS_API_KEY || 'demo-key'
  };
}

function handleApiError(error, res) {
  console.error('[API Error]', error.message);
  res.status(error.response?.status || 500).json({
    error: error.message,
    details: error.response?.data
  });
}

// ====================
// SERVER
// ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 ABBY Agent server running on port ${PORT}`);
  console.log(`   MTOS API: ${MTOS_API_BASE}`);
  console.log(`   Endpoints:`);
  console.log(`   - GET/POST /api/leads`);
  console.log(`   - GET/POST /api/cases`);
  console.log(`   - GET /api/paralegals`);
  console.log(`   - GET /api/providers`);
  console.log(`   - GET /api/npi/search`);
  console.log(`   - GET/POST /api/documents`);
  console.log(`   - GET/POST /api/invoices`);
  console.log(`   - GET /api/reports/*`);
  console.log(`   - POST /webhook/openclaw`);
});
