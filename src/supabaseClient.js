import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebtxxddqdqyrhpbzhcgo.supabase.co'
const supabaseAnonKey = 'sb_publishable_vdq8r23wkyv6YMAnVddzuQ_617dgNk7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)