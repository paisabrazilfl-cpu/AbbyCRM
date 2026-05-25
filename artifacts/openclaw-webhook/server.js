/**
 * OpenClaw webhook handler for AbbyCRM
 * Handles: route_lead, verify_npi, check_eligibility, route_case
 */

const express = require('express');
const app = express();
app.use(express.json());

// MTOS API base URL
const MTOS_API_BASE = process.env.MTOS_API_BASE || 'http://localhost:3000';

// In-memory cache for paralegals (would use Redis in production)
const paralegalCache = new Map();

/**
 * GET /api/paralegals - List paralegals with filtering
 */
app.get('/api/paralegals', async (req, res) => {
  const { tort, state, sort = 'load_asc' } = req.query;
  
  // In production: query database
  // For now: return mock data structure
  const paralegals = [
    { id: 1, user_id: 101, name: 'Sarah Johnson', tort_types: ['mesothelioma', 'asbestos'], licensed_states: ['TX', 'FL', 'CA'], active_cases: 12 },
    { id: 2, user_id: 102, name: 'Mike Chen', tort_types: ['opioid'], licensed_states: ['NY', 'NJ', 'PA'], active_cases: 8 },
    { id: 3, user_id: 103, name: 'Lisa Rodriguez', tort_types: ['mesothelioma', 'benzene'], licensed_states: ['FL', 'GA', 'SC'], active_cases: 15 },
  ];
  
  let filtered = paralegals;
  
  if (tort) {
    filtered = filtered.filter(p => p.tort_types.includes(tort.toLowerCase()));
  }
  if (state) {
    filtered = filtered.filter(p => p.licensed_states.includes(state.toUpperCase()));
  }
  
  if (sort === 'load_asc') {
    filtered.sort((a, b) => a.active_cases - b.active_cases);
  }
  
  res.json(filtered);
});

/**
 * PATCH /api/leads/:id - Update lead
 */
app.patch('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { assigned_to, notes, npi_number } = req.body;
  
  // In production: update database
  console.log(`Lead ${id} updated:`, { assigned_to, notes, npi_number });
  
  res.json({ ok: true, lead_id: id });
});

/**
 * GET /api/npi/search - NPI lookup (uses CMS NPPES API)
 */
app.get('/api/npi/search', async (req, res) => {
  const { first_name, last_name, state } = req.query;
  
  try {
    // Query CMS NPPES API
    const npiResponse = await fetch(
      `https://npiregistry.cms.hhs.gov/api/?first_name=${first_name}&last_name=${last_name}&state=${state}&limit=5`
    );
    const data = await npiResponse.json();
    
    const results = (data.results || []).map(r => ({
      npi: r.number,
      first_name: r.basic.first_name,
      last_name: r.basic.last_name,
      full_name: `${r.basic.first_name} ${r.basic.last_name}`,
      state: r.addresses?.[0]?.state,
      taxonomy: r.taxonomies?.[0]?.desc,
    }));
    
    res.json({ results });
  } catch (error) {
    console.error('NPI lookup failed:', error);
    res.status(500).json({ error: 'NPI lookup failed' });
  }
});

/**
 * POST /webhook/openclaw - OpenClaw webhook receiver
 */
app.post('/webhook/openclaw', async (req, res) => {
  const { action, lead_id, tort, state, lead_data } = req.body;
  
  console.log(`OpenClaw action: ${action}`, { lead_id, tort, state });
  
  switch (action) {
    case 'route_lead':
      // AI-powered lead routing logic
      const paralegals = await fetchParalegals(tort, state);
      
      if (paralegals.length === 0) {
        return res.json({
          action: 'route_lead',
          result: 'no_paralegal',
          message: `No paralegals available for ${tort} in ${state}`,
        });
      }
      
      // Pick lowest load
      const chosen = paralegals[0];
      
      // Update lead
      await fetch(`${MTOS_API_BASE}/api/leads/${lead_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: chosen.user_id,
          notes: `AI-routed by OpenClaw: ${tort}/${state} → ${chosen.name}`,
        }),
      });
      
      res.json({
        action: 'route_lead',
        result: 'assigned',
        lead_id,
        assignee_user_id: chosen.user_id,
        paralegal_name: chosen.name,
        tort,
        state,
      });
      break;
      
    case 'verify_npi':
      // Verify NPI number against CMS
      const { npi_number } = req.body;
      const verified = await verifyNPI(npi_number);
      res.json({ action: 'verify_npi', verified, npi_number });
      break;
      
    case 'check_eligibility':
      // AI eligibility decisioning
      const eligibility = await checkEligibility(lead_data);
      res.json({ action: 'check_eligibility', ...eligibility });
      break;
      
    default:
      res.status(400).json({ error: `Unknown action: ${action}` });
  }
});

async function fetchParalegals(tort, state) {
  // In production: query MTOS database
  const paralegals = [
    { id: 1, user_id: 101, name: 'Sarah Johnson', tort_types: ['mesothelioma', 'asbestos'], licensed_states: ['TX', 'FL', 'CA'], active_cases: 12 },
    { id: 2, user_id: 102, name: 'Mike Chen', tort_types: ['opioid'], licensed_states: ['NY', 'NJ', 'PA'], active_cases: 8 },
    { id: 3, user_id: 103, name: 'Lisa Rodriguez', tort_types: ['mesothelioma', 'benzene'], licensed_states: ['FL', 'GA', 'SC'], active_cases: 15 },
  ];
  
  return paralegals.filter(p => 
    p.tort_types.includes(tort?.toLowerCase()) && 
    p.licensed_states.includes(state?.toUpperCase())
  ).sort((a, b) => a.active_cases - b.active_cases);
}

async function verifyNPI(npi_number) {
  try {
    const response = await fetch(`https://npiregistry.cms.hhs.gov/api/?number=${npi_number}`);
    const data = await response.json();
    return data.results?.length > 0;
  } catch {
    return false;
  }
}

async function checkEligibility(lead_data) {
  // AI eligibility logic based on tort type, state, injuries, etc.
  const { tort_type, state, injury_type, damages_estimate } = lead_data || {};
  
  // Simple rules (in production: use AI model)
  const eligible = damages_estimate > 50000 && 
    ['TX', 'FL', 'CA', 'NY', 'PA'].includes(state);
  
  return {
    eligible,
    score: eligible ? 85 : 40,
    reasons: eligible ? ['High damages estimate', 'Litigation-friendly state'] : ['Low damages', 'Unfavorable jurisdiction'],
  };
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OpenClaw webhook server running on port ${PORT}`);
});
