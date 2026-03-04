# Supabase Setup for PitakaPal

Follow these steps to configure your Supabase database.

## 1. Environment Variables
Add the following to your `.env` file (you can find these in Project Settings > API):

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 2. Run SQL Query
Go to the SQL Editor in your Supabase dashboard and run this script.

### Part A: Transactions Table (If not already created)
```sql
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    category TEXT,
    account TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    note TEXT,
    location_name TEXT,
    lat NUMERIC,
    lng NUMERIC
);
```

### Part B: Accounts Table (NEW! Run this to enable Wallet features)
```sql
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0,
    type TEXT, -- 'gcash', 'maya', 'gotyme', 'cash', 'bank'
    icon TEXT,
    color_theme TEXT, -- JSON string for colors
    number TEXT, -- Masked number e.g. **** 1234
    theme TEXT, -- 'light', 'dark', 'platinum' (for text contrast)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for now to ensure Clerk compatibility without complex setup
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
```

## 3. Verify Connection
After creating the table and setting `.env`, restart your Expo server: `npx expo start -c`.
