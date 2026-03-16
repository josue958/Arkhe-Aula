import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'teacher'
  school_id: number
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const checked = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function checkSession() {
    try {
      const currentUser = await window.electronAPI.getCurrentUser()
      user.value = currentUser
    } catch (e) {
      user.value = null
    }
    checked.value = true
  }

  async function login(email: string, password: string) {
    const result = await window.electronAPI.login({ email, password })
    if (result.success) {
      user.value = result.user
    }
    return result
  }

  async function logout() {
    await window.electronAPI.logout()
    user.value = null
  }

  return { user, checked, isAuthenticated, isAdmin, checkSession, login, logout }
})
