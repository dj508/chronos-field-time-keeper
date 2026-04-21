# 🚀 App Preview Guide

## ✅ Current Status

### Chronos Field Timekeeper
- **Status**: ✅ Running Successfully
- **Local URL**: http://localhost:3000
- **Network URL**: http://21.0.5.78:3000
- **Framework**: React + Vite + TypeScript
- **Database**: Supabase (Connected)

### ZenTask AI Reminder
- **Status**: ⏸️ Ready to deploy (disk space limitation)
- **Framework**: React + Vite + TypeScript
- **AI**: Google Gemini API
- **Database**: Supabase (Schema ready)

---

## 🔗 Access the App

### Local Development
```bash
cd /workspace/chronos
npm run dev
```

The app will be available at:
- **Local**: http://localhost:3000
- **Network**: http://21.0.5.78:3000

---

## 📊 Supabase Integration

### Connection Details
- **URL**: https://dqorzhjmfzkxcltradgk.supabase.co
- **Auth**: Anon key configured
- **Schema**: Deployed successfully

### Tables Created
**Chronos:**
- technicians
- customers
- projects
- tasks
- activity_types
- time_entries
- entry_steps

**ZenTask:**
- zentask_items
- reminder_settings

### Verify Connection
Visit your Supabase dashboard: https://dqorzhjmfzkxcltradgk.supabase.co

---

## 🛠️ Next Steps

### 1. Test the App
Open http://localhost:3000 in your browser to test the Chronos app.

### 2. Update Services
The app currently uses localStorage. To fully integrate Supabase:

```typescript
// Example: Update storage.ts to use Supabase
import { supabase } from './supabaseClient';

// Instead of localStorage.setItem
await supabase.from('time_entries').insert(data);

// Instead of localStorage.getItem
const { data } = await supabase.from('time_entries').select();
```

### 3. Deploy to Production

#### Option A: Vercel
```bash
cd chronos
npm install -g vercel
vercel
```

#### Option B: Netlify
```bash
cd chronos
npm run build
# Drag dist folder to Netlify
```

#### Option C: Supabase Hosting
```bash
cd chronos
npm run build
npx supabase link --project-ref dqorzhjmfzkxcltradgk
```

---

## 📝 Environment Variables

### Required for Production
Create `.env.production` or set in your hosting platform:

```env
SUPABASE_URL=https://dqorzhjmfzkxcltradgk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=your_actual_gemini_key
```

---

## 🔒 Security Notes

- ✅ Using Supabase Anon Key (safe for client-side)
- ✅ Row Level Security (RLS) enabled on all tables
- ⚠️ Update RLS policies for production based on your auth requirements
- ⚠️ Never commit `.env.local` files to git

---

## 📱 Features Available

### Chronos Field Timekeeper
- ✅ Technician management with PIN authentication
- ✅ Customer & project tracking
- ✅ Time entry with start/stop functionality
- ✅ Activity type categorization
- ✅ Billable vs non-billable hours
- ✅ Step-by-step task tracking
- ✅ Export to Excel (XLSX)
- ✅ Responsive mobile-first design

### ZenTask AI Reminder (Ready to activate)
- ⏸️ AI-powered task creation
- ⏸️ Smart reminders
- ⏸️ Priority management
- ⏸️ Task templates

---

## 🐛 Troubleshooting

### App won't start
```bash
# Kill all node processes
pkill -f node
pkill -f vite

# Clear cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

### Supabase connection issues
1. Check `.env.local` has correct credentials
2. Verify SQL schema was deployed in Supabase
3. Check browser console for errors
4. Test connection: https://dqorzhjmfzkxcltradgk.supabase.co/rest/v1/technicians

### Port already in use
The app will automatically try the next available port (3001, 3002, etc.)

---

## 📞 Support

For issues or questions:
1. Check the Supabase dashboard logs
2. Review browser console errors
3. Verify environment variables are set correctly
4. Ensure SQL schema was deployed without errors

---

**Last Updated**: April 21, 2026
**Version**: 1.0.0
