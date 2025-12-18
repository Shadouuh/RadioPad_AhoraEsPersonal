import { supabase } from '../lib/supabaseClient'

function mapSoundRow(r) {
  return {
    id: r.id,
    name: r.name,
    scope: r.scope,
    programId: r.program_id ?? null,
    ownerUserId: r.owner_user_id ?? null,
    fileUrl: r.file_url,
    playCount: r.play_count ?? 0,
    durationSeconds: r.duration_seconds ?? null,
    categories: Array.isArray(r.categories) ? r.categories : [],
  }
}

export async function getSounds() {
  if (!supabase) {
    console.error('[soundSupabase] Supabase client not initialized')
    return []
  }
  
  try {
    const { data, error } = await supabase
      .from('sounds')
      .select('id, name, scope, program_id, owner_user_id, file_url, play_count, duration_seconds, categories')
      .order('id', { ascending: true })
    
    if (error) {
      console.error('[soundSupabase] Error fetching sounds:', error)
      throw new Error(`Sounds fetch failed: ${error.message}`)
    }
    
    console.log('[soundSupabase] Sounds fetched successfully:', data?.length || 0)
    return (Array.isArray(data) ? data : []).map(mapSoundRow)
  } catch (err) {
    console.error('[soundSupabase] Exception in getSounds:', err)
    throw err
  }
}

export async function createSound({ name, scope, programId, ownerUserId, fileUrl, durationSeconds, categories }) {
  if (!supabase) {
    console.error('[soundSupabase] Supabase client not initialized')
    throw new Error('Supabase not configured')
  }
  
  try {
    const payload = {
      name,
      scope,
      program_id: programId ?? null,
      owner_user_id: ownerUserId ?? null,
      file_url: fileUrl,
      play_count: 0,
      duration_seconds: durationSeconds ?? null,
      categories: Array.isArray(categories) ? categories : [],
    }
    console.log('[soundSupabase] Creating sound with payload:', payload)
    
    const { data, error } = await supabase
      .from('sounds')
      .insert(payload)
      .select('id, name, scope, program_id, owner_user_id, file_url, play_count, duration_seconds, categories')
      .single()
    
    if (error) {
      console.error('[soundSupabase] Error creating sound:', error)
      throw new Error(`Sound create failed: ${error.message}`)
    }
    
    console.log('[soundSupabase] Sound created successfully:', data)
    return mapSoundRow(data)
  } catch (err) {
    console.error('[soundSupabase] Exception in createSound:', err)
    throw err
  }
}

export async function deleteSound(id) {
  if (!supabase) {
    console.error('[soundSupabase] Supabase client not initialized')
    return null
  }
  
  try {
    console.log('[soundSupabase] Deleting sound with id:', id)
    const { error } = await supabase.from('sounds').delete().eq('id', id)
    
    if (error) {
      console.error('[soundSupabase] Error deleting sound:', error)
      throw new Error(`Sound delete failed: ${error.message}`)
    }
    
    console.log('[soundSupabase] Sound deleted successfully')
    return { ok: true }
  } catch (err) {
    console.error('[soundSupabase] Exception in deleteSound:', err)
    throw err
  }
}

