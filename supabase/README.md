# Supabase Real-time Backend

This folder contains the Supabase configuration for real-time synchronization.

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready

### 2. Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `schema.sql`
3. Paste and run the SQL to create tables and enable real-time

### 3. Configure Environment Variables

```bash
cp supabase/.env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these values in Supabase dashboard: **Settings > API**

### 4. Restart the App

```bash
npm run dev
```

## How It Works

The `syncService` provides real-time synchronization:

- **Tables**: When `setTableStatus` or `updateTable` is called, changes are written to Supabase
- **Orders**: Order CRUD operations sync with Supabase
- **Audit Log**: All actions are logged to Supabase in real-time

When Supabase is not configured (placeholder URL), the app falls back to localStorage persistence and broadcastChannel sync (same-device tabs only).

## Real-time Subscriptions

The `realtime.ts` module handles:

- Initial data load from Supabase
- Real-time subscriptions to database changes
- Automatic UI updates when remote changes occur
- Cleanup on unmount

## Database Tables

| Table | Description |
|-------|-------------|
| `tables` | Cafe table configurations and statuses |
| `orders` | Order data with items, totals, status |
| `audit_log` | Action history for audit trail |
