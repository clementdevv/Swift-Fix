
import { createClient } from '@/utils/supabase/server'

export async function checkProfiles() {
  const supabase = await createClient()
  
  // Attempt to get column names by selecting one row (even if it doesn't exist)
  const { data, error } = await supabase.from('profiles').select('*').limit(1)
  
  if (error) {
    console.error('Error fetching profiles:', error)
    return
  }
  
  if (data && data.length > 0) {
    console.log('Profile columns:', Object.keys(data[0]))
  } else {
    // Try to get schema info via RPC if available, or just try specific columns
    const { data: cols, error: colError } = await supabase
      .from('profiles')
      .select('id, full_name, user_type, phone')
      .limit(1)
    
    if (colError) {
      console.error('Column check failed:', colError)
    } else {
      console.log('Known columns exist: id, full_name, user_type, phone')
    }
  }
}
