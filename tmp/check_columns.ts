import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rocqhuhmvjwjsluitlcc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvY3FodWhtdmp3anNsdWl0bGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTE2NTIsImV4cCI6MjA5MDUyNzY1Mn0.-CyCY46qzK7CJhL773EgzZJaCSDU4TbMBOoD0gYThYM'
)

async function checkColumns() {
  const { data, error } = await supabase
    .rpc('check_columns', { table_name: 'reviews' })

  if (error) {
    // If RPC doesn't exist, try a raw query workaround if possible
    console.log('RPC check_columns not found, trying query...')
    const { data: cols, error: colError } = await supabase
      .from('reviews')
      .select('*')
      .limit(0)
    
    if (colError) {
       console.error('Error:', colError)
       return
    }
  }
}

async function listAll() {
    const { data, error } = await supabase.from('bookings').select('*').limit(1)
    console.log('Booking Columns:', data ? Object.keys(data[0]) : 'No data')
    
    // We can't easily see columns without data using postgrest unless we have Rpc
    // But we know standard patterns.
}

listAll()
