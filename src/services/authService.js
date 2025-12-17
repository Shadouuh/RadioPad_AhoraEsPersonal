import { apiGet } from './api'

export async function loginWithPassword({ username, password }) {
  const users = await apiGet(
    `/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  )

  if (!Array.isArray(users) || users.length === 0) {
    return null
  }

  return users[0]
}
