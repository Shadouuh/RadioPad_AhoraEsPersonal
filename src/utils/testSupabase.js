import { supabase } from '../lib/supabaseClient'

export async function testSupabaseConnection() {
  console.log('=== Testing Supabase Connection ===')
  
  if (!supabase) {
    console.error('❌ Supabase client is not initialized')
    return { success: false, error: 'Client not initialized' }
  }
  
  console.log('✅ Supabase client initialized')
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return { success: false, error: 'Session error', details: sessionError }
    }
    
    if (!session) {
      console.warn('⚠️ No active session - user not authenticated')
      return { success: false, error: 'Not authenticated' }
    }
    
    console.log('✅ User authenticated:', session.user.email)
    
    console.log('\n--- Testing Programs Table ---')
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .limit(5)
    
    if (programsError) {
      console.error('❌ Programs query error:', programsError)
      return { success: false, error: 'Programs query failed', details: programsError }
    }
    
    console.log('✅ Programs query successful:', programs?.length || 0, 'records')
    console.log('Sample programs:', programs)
    
    console.log('\n--- Testing Sounds Table ---')
    const { data: sounds, error: soundsError } = await supabase
      .from('sounds')
      .select('*')
      .limit(5)
    
    if (soundsError) {
      console.error('❌ Sounds query error:', soundsError)
      return { success: false, error: 'Sounds query failed', details: soundsError }
    }
    
    console.log('✅ Sounds query successful:', sounds?.length || 0, 'records')
    console.log('Sample sounds:', sounds)
    
    console.log('\n=== All Tests Passed ===')
    return { 
      success: true, 
      session: session.user.email,
      programsCount: programs?.length || 0,
      soundsCount: sounds?.length || 0
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { success: false, error: 'Unexpected error', details: err }
  }
}

export async function testCreateProgram() {
  console.log('\n=== Testing Program Creation ===')
  
  if (!supabase) {
    console.error('❌ Supabase client is not initialized')
    return { success: false, error: 'Client not initialized' }
  }
  
  try {
    const testProgram = {
      name: `Test Program ${Date.now()}`,
      description: 'Test program created by diagnostic tool'
    }
    
    console.log('Attempting to create program:', testProgram)
    
    const { data, error } = await supabase
      .from('programs')
      .insert(testProgram)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Create program error:', error)
      return { success: false, error: 'Create failed', details: error }
    }
    
    console.log('✅ Program created successfully:', data)
    
    console.log('Cleaning up test program...')
    const { error: deleteError } = await supabase
      .from('programs')
      .delete()
      .eq('id', data.id)
    
    if (deleteError) {
      console.warn('⚠️ Could not delete test program:', deleteError)
    } else {
      console.log('✅ Test program deleted')
    }
    
    return { success: true, program: data }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { success: false, error: 'Unexpected error', details: err }
  }
}

window.testSupabase = testSupabaseConnection
window.testCreateProgram = testCreateProgram
