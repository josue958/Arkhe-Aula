import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUnsavedStore = defineStore('unsaved', () => {
  const isDirty = ref(false)
  let saveCallback: (() => Promise<void> | void) | null = null

  function setDirty(value: boolean, callback?: () => Promise<void> | void) {
    isDirty.value = value
    if (callback) {
      saveCallback = callback
    } else if (!value) {
      saveCallback = null
    }
  }

  async function save() {
    if (saveCallback) {
      await saveCallback()
    }
    isDirty.value = false
    saveCallback = null
  }

  return { isDirty, setDirty, save }
})
