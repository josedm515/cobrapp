import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ebtxxddqdqyrhpbzhcgo.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_vdq8r23wkyv6YMAnVddzuQ_617dgNk7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)