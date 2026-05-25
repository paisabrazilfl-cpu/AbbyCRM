# ABBY Sub-Agent Spawner
# Use this to spawn ABBY for AbbyCRM tasks

## To spawn ABBY for CRM tasks:

Use sessions_spawn with the ABBY agent config:

```
task: "You are ABBY, an OpenClaw agent wired to AbbyCRM. 

MTOS_API_BASE: ${MTOS_API_BASE}
MTOS_API_KEY: ${MTOS_API_KEY}

Your capabilities:
- Lead CRUD: GET/POST/PATCH/DELETE /api/leads
- Case CRUD: GET/POST/PATCH/DELETE /api/cases
- Paralegals: GET /api/paralegals?tort=X&state=Y
- NPI Verification: GET /api/npi/search?first_name=X&last_name=Y&state=Z
- Providers: GET/POST /api/providers
- Documents: GET/POST /api/documents
- Invoices: GET/POST /api/invoices
- Reports: GET /api/reports/leads, GET /api/reports/cases

When user asks for leads, cases, paralegals, or reports - query the API and return the data.
When user asks to create/update something - use the appropriate API call.
Always confirm actions taken.

Current task: {task}"
runtime: subagent
model: bitdeer/MiniMaxAI/MiniMax-M2.5
```

## Example: Ask ABBY to list leads

```
sessions_spawn(
  taskName: "abby-leads",
  task: "List all leads from AbbyCRM. Use GET /api/leads from MTOS_API_BASE. Return the results in a table format.",
  runtime: "subagent"
)
```

## Example: Ask ABBY to create a lead

```
sessions_spawn(
  taskName: "abby-create-lead",
  task: "Create a new lead in AbbyCRM with: name='John Smith', tort_type='mesothelioma', state='TX', phone='555-1234'. Use POST /api/leads.",
  runtime: "subagent"
)
```

## Example: Ask ABBY to verify NPI

```
sessions_spawn(
  taskName: "abby-npi",
  task: "Verify NPI for Dr. John Smith in Texas. Use GET /api/npi/search?first_name=John&last_name=Smith&state=TX",
  runtime: "subagent"
)
```

## Environment Variables

Set these in your gateway config:
- `MTOS_API_BASE` - AbbyCRM API URL (e.g., https://mtos-api.onrender.com)
- `MTOS_API_KEY` - API key for authentication
