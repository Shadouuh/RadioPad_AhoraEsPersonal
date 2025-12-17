import { apiGet, apiPost } from './api'

export function getPrograms() {
  return apiGet('/programs')
}

export function createProgram({ name, description }) {
  return apiPost('/programs', {
    name,
    description,
  })
}
