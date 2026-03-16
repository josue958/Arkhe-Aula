<script setup lang="ts">
import { onMounted } from 'vue'
import { useLicenseStore } from '@/stores/license'

const licenseStore = useLicenseStore()

onMounted(() => {
  licenseStore.loadLicense()
  licenseStore.loadCounts()
})
</script>

<template>
  <div v-if="licenseStore.isFree && licenseStore.loaded" class="license-banner">
    <div class="license-banner-content">
      <div class="license-info">
        <span class="license-badge">FREE</span>
        <span class="license-text">
          {{ licenseStore.groupsRemaining }} grupos · {{ licenseStore.studentsRemaining }} alumnos restantes
        </span>
      </div>
      <a href="https://arkhegroup.com/precios" target="_blank" class="upgrade-btn">
        Actualizar a Premium
      </a>
    </div>
  </div>
</template>

<style scoped>
.license-banner {
  background: linear-gradient(135deg, #0D1B2A 0%, #1B263B 100%);
  padding: 8px 16px;
  border-bottom: 1px solid #1B9AAA;
}

.license-banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.license-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.license-badge {
  background: #E1A140;
  color: #0D1B2A;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.license-text {
  color: #E0E1DD;
  font-size: 13px;
}

.upgrade-btn {
  background: #1B9AAA;
  color: white;
  padding: 6px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.upgrade-btn:hover {
  background: #1B9AAA;
  opacity: 0.9;
}
</style>