import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export function getUsers() {
  return apiGet('/users')
}

export function createUser({ username, password, fullName, role, assignedProgramIds }) {
  return apiPost('/users', {
    username,
    password,
    fullName,
    role,
    assignedProgramIds: Array.isArray(assignedProgramIds) ? assignedProgramIds : [],
  })
}

export function updateUser(id, patch) {
  return apiPatch(`/users/${id}`, patch)
}

export function deleteUser(id) {
  return apiDelete(`/users/${id}`)
}
