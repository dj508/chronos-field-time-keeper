# Supabase Integration Guide

## ✅ Setup Complete

Your Supabase credentials have been successfully configured in both projects:

- **Chronos Field Timekeeper**
- **ZenTask AI Reminder**

## Configuration Files Updated

### `.env.local` files now contain:
```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
SUPABASE_URL=https://dqorzhjmfzkxcltradgk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Schema

The SQL schema has been created with the following tables:

### Chronos Tables:
- `technicians` - User accounts with PIN authentication
- `customers` - Client information
- `projects` - Work projects/assets
- `tasks` - Task assignments
- `activity_types` - Work categories (6 default types seeded)
- `time_entries` - Time tracking records
- `entry_steps` - Individual work steps

### ZenTask Tables:
- `zentask_items` - Task management with priorities
- `reminder_settings` - Notification preferences

### Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Auto-updating timestamps via triggers
- ✅ Performance indexes on foreign keys
- ✅ Helper functions for statistics
- ✅ Seed data for activity types and templates

## New Files Created

### Chronos:
- `/services/supabaseClient.ts` - Supabase client configuration

### ZenTask:
- `/services/supabaseClient.ts` - Supabase client configuration

## Next Steps

### 1. Install Dependencies
```bash
cd chronos
npm install @supabase/supabase-js

cd ../zentask
npm install @supabase/supabase-js
```

### 2. Update Your Services

Replace localStorage calls with Supabase queries. Example:

```typescript
import { supabase } from './services/supabaseClient';

// Fetch time entries
const { data, error } = await supabase
  .from('time_entries')
  .select('*')
  .eq('technician_id', technicianId)
  .order('start_time', { ascending: false });

// Insert new entry
const { data, error } = await supabase
  .from('time_entries')
  .insert({
    technician_id: id,
    project_id: projectId,
    activity_type_id: activityId,
    start_time: new Date().toISOString(),
  });
```

### 3. Test Connection

```typescript
import { supabase } from './services/supabaseClient';

async function testConnection() {
  const { data, error } = await supabase
    .from('activity_types')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('✅ Connected to Supabase!', data);
  }
}
```

## Security Notes

- ✅ Using ANON key (safe for client-side)
- ⚠️ SECRET key should only be used server-side
- 🔒 RLS policies are permissive by default - customize for production
- 📁 `.env.local` files are gitignored

## API Reference

```typescript
// SELECT
const { data } = await supabase.from('table').select('*');

// INSERT
const { data } = await supabase.from('table').insert({...});

// UPDATE
const { data } = await supabase.from('table').update({...}).eq('id', id);

// DELETE
const { data } = await supabase.from('table').delete().eq('id', id);
```

---

**Database URL**: https://dqorzhjmfzkxcltradgk.supabase.co  
**Schema File**: `/workspace/supabase_schema.sql`
