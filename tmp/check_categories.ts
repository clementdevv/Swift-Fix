import { createClient } from '../utils/supabase/client'

async function checkCategories() {
  const supabase = createClient()
  const { data, error } = await supabase.from('service_categories').select('*')
  if (error) {
    console.error('Error fetching categories:', error)
    return
  }
  console.log('Service Categories:', JSON.stringify(data, null, 2))
}

checkCategories()
