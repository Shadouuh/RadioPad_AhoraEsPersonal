import { supabase } from '../lib/supabaseClient'
import { ROLES } from '../utils/roles'

export async function getProfileByUserId(userId) {
  if (!supabase || !userId) {
    return null
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, role, assigned_program_ids, legacy_id')
    .eq('user_id', userId)
    .limit(1)
  if (error) {
    return null
  }
  if (Array.isArray(data) && data.length > 0) {
    return data[0]
  }
  return null
}

function safeRole(role) {
  const r = String(role || '').trim().toLowerCase()
  if ([ROLES.CHIEF, ROLES.OPERATOR, ROLES.PRODUCER].includes(r)) return r
  return ROLES.OPERATOR
}

export async function ensureProfileForUser(user) {
  if (!supabase || !user?.id) return null
  const meta = user.user_metadata || {}
  const full_name = meta.fullName || ''
  const role = safeRole(meta.role || 'operator')
  const assigned_program_ids = Array.isArray(meta.assignedProgramIds) ? meta.assignedProgramIds : []
  const legacy_id = Number.isFinite(meta.legacyId) ? meta.legacyId : null

  const payload = {
    user_id: user.id,
    full_name,
    role,
    assigned_program_ids,
    legacy_id,
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' })
  if (error) {
    return null
  }
  return getProfileByUserId(user.id)
}
