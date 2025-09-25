# Supabase Database Setup Guide

## Quick Setup via Dashboard (Recommended)

1. **Open Supabase Dashboard**: https://daasugoddauwhqzxorsc.supabase.co
2. **Go to SQL Editor** (left sidebar)
3. **Copy the SQL** from `supabase/migrations/20240101000000_initial_schema.sql`
4. **Paste and Run** the SQL to create all tables and sample data

## CLI Setup (Advanced)

### 1. Authenticate with Supabase
```bash
# You'll need your Supabase access token from:
# Dashboard → Settings → API → Personal access tokens
supabase login --token YOUR_ACCESS_TOKEN
```

### 2. Link to your remote project
```bash
supabase link --project-ref daasugoddauwhqzxorsc
```

### 3. Push the database schema
```bash
supabase db push
```

### 4. Start local development (optional)
```bash
supabase start
```

## Direct psql Connection (Alternative)

If you want to connect directly with psql, you can also:

```bash
# Add to your ~/.zshrc for permanent PATH
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Connect directly (if network allows)
psql "postgresql://postgres:xexpaT-qasbe8-cupmes@db.daasugoddauwhqzxorsc.supabase.co:5432/postgres"
```

## Available Tables After Setup

- **properties**: Property information
- **tracks**: Quest tracks with badges
- **guest_sessions**: Individual guest sessions  
- **track_steps**: Individual quest steps
- **submissions**: Guest quest submissions
- **kb_docs**: Knowledge base for AI chat

## Sample Queries

```sql
-- View all properties
SELECT * FROM properties;

-- View quest progress for a session
SELECT gs.*, t.name as track_name, t.badge_emoji
FROM guest_sessions gs
JOIN tracks t ON gs.track_id = t.id
WHERE gs.id = 'session-123';

-- View completed steps
SELECT s.*, ts.prompt, ts.quest_type
FROM submissions s
JOIN track_steps ts ON s.step_id = ts.id
WHERE s.session_id = 'session-123' AND s.approved_bool = true;

-- View knowledge base
SELECT question, answer FROM kb_docs WHERE property_id = 'property-123';
```

## Troubleshooting

If direct psql connection fails:
- Use the Supabase Dashboard SQL Editor instead
- Check your network/firewall settings
- Ensure the password is correct in the connection string

The dashboard approach is most reliable and user-friendly!


