import { createClient } from '@/utils/supabase/server'

async function inspect() {
  const supabase = await createClient()
  
  console.log('--- Inspecting profiles ---')
  const { data: profileData, error: profileError } = await supabase.from('profiles').select().limit(1)
  if (profileData && profileData.length > 0) {
    console.log('Profiles columns:', Object.keys(profileData[0]))
  } else {
    console.log('No profiles found or error:', profileError)
  }

  console.log('--- Inspecting service_providers ---')
  const { data: spData, error: spError } = await supabase.from('service_providers').select().limit(1)
  if (spData && spData.length > 0) {
    console.log('SP columns:', Object.keys(spData[0]))
  } else {
    console.log('No SP found or error:', spError)
  }
}

inspect()
