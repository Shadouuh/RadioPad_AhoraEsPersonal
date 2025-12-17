import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export function getSounds() {
  return apiGet('/sounds')
}

export function createSound({ name, scope, programId, ownerUserId, fileUrl }) {
  return apiPost('/sounds', {
    name,
    scope,
    programId,
    ownerUserId,
    fileUrl,
    playCount: 0,
  })
}

export function incrementSoundPlayCount(id, nextCount) {
  if (id == null) return Promise.resolve(null)
  const safe = Number.isFinite(nextCount) ? Math.max(0, Math.floor(nextCount)) : 0
  return apiPatch(`/sounds/${id}`, { playCount: safe })
}

export function deleteSound(id) {
  if (id == null) return Promise.resolve(null)
  return apiDelete(`/sounds/${id}`)
}
