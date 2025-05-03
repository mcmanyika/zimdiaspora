import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance of the Supabase client to be used throughout the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Keep this if you still need it for component-level client creation
export const createClientComponentClient = () =>
    createClient(supabaseUrl, supabaseAnonKey) 