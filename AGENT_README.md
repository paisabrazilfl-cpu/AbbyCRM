# AbbyCRM OpenClaw Agent

Full-access AI agent for AbbyCRM mass tort legal operations.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/paisabrazilfl-cpu/AbbyCRM.git
cd AbbyCRM

# Install dependencies
pnpm install

# Run locally
cd artifacts/api-server && pnpm dev
cd artifacts/mtos-crm && pnpm dev
```

## OpenClaw Agent Configuration

The agent is configured in `.agents/abbycrm-agent.toml`.

### Capabilities

| Capability | Description |
|------------|-------------|
| `lead_management` | Full CRUD on leads |
| `case_management` | Case intake, screening, advancement |
| `provider_verification` | Physician/provider management |
| `npi_verification` | NPI lookup via CMS NPPES |
| `eligibility_decisioning` | AI-powered eligibility checks |
| `paralegal_routing` | Auto-assign leads to paralegals |
| `document_automation` | Trigger document workflows |
| `workflow_management` | Manage n8n workflows |
| `api_integration` | External API calls |
| `database_operations` | Direct DB access |
| `webhook_handling` | Process incoming webhooks |
| `reporting` | Generate reports |
| `billing_access` | Invoice management |

### API Endpoints

```
GET    /api/leads          # List leads
POST   /api/leads          # Create lead
GET    /api/leads/:id      # Get lead
PATCH  /api/leads/:id      # Update lead
DELETE /api/leads/:id      # Delete lead

GET    /api/paralegals     # List paralegals (?tort=X&state=Y&sort=load_asc)
GET    /api/cases          # List cases
GET    /api/providers      # List providers
GET    /api/npi/search     # NPI lookup (?first_name=X&last_name=Y&state=Z)

POST   /webhook/openclaw   # OpenClaw webhook receiver
```

### n8n Workflows

| Workflow | Trigger | Action |
|----------|---------|--------|
| `01-lead-assign` | lead.created | Route to paralegal |
| `02-npi-on-provider-fill` | lead.updated | Auto NPI lookup |
| `03-ocr-routing` | document.uploaded | Route OCR |
| `04-case-auto-advance` | case.updated | Advance case status |
| `01-lead-assign-openclaw` | lead.created | Route with AI fallback |

### Environment Variables

```env
MTOS_API_BASE=http://localhost:3000
MTOS_DB_URL=postgresql://...
OPENCLAW_WEBHOOK_URL=http://localhost:3001/webhook/openclaw
N8N_WEBHOOK_URL=http://localhost:5678/webhook/
SESSION_SECRET=your-secret
ENCRYPTION_KEY_V1=your-key
ENCRYPTION_KEY_V2=your-key
```

### Deploy to Render

```bash
# Push to main - auto-deploys via Blueprint
git push origin main
```

### OpenClaw Integration

The agent can:
1. Receive webhooks from n8n workflows
2. Make API calls to MTOS
3. Verify NPI numbers against CMS
4. Route leads to paralegals
5. Check eligibility
6. Trigger document automation
7. Manage cases

### Scheduled Tasks

- **lead-routing-check** (every 5 min) - Route unassigned leads
- **npi-verification-queue** (every 10 min) - Process NPI queue
- **case-advancement** (hourly) - Check and advance cases
- **paralegal-load-balance** (daily 6 AM) - Rebalance loads
