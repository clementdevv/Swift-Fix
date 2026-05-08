import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rocqhuhmvjwjsluitlcc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvY3FodWhtdmp3anNsdWl0bGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTE2NTIsImV4cCI6MjA5MDUyNzY1Mn0.-CyCY46qzK7CJhL773EgzZJaCSDU4TbMBOoD0gYThYM'
)

async function checkTables() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')

  if (error) {
    // If permission denied to information_schema, try to just select from common tables
    console.log('Trying direct table check...')
    const tables = ['profiles', 'service_providers', 'bookings', 'service_categories', 'reviews']
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true })
      console.log(`- ${table}: ${tableError ? 'FAIL (' + tableError.message + ')' : 'EXISTS'}`)
    }
    return
  }

  console.log('Tables in public schema:')
  data.forEach(t => console.log(`- ${t.table_name}`))
}

checkTables()
