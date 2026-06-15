<template>
  <div class="fleet-dashboard-tab">
    <v-card variant="tonal">
      <v-card-title class="text-h6 d-flex align-center ga-2">
        <v-icon color="primary">mdi-view-dashboard</v-icon>
        {{ t('dashboard.title') }}
      </v-card-title>
      <v-card-text class="text-body-2">
        <p class="mb-4">
          {{ t('dashboard.description') }}
        </p>
        <v-btn color="primary" :href="SMARTBED_DASHBOARD_URL" target="_blank" rel="noreferrer noopener"
          append-icon="mdi-open-in-new" data-testid="fleet-dashboard-link">
          {{ t('dashboard.openButton') }}
        </v-btn>
        <p class="text-medium-emphasis mt-4 mb-0">
          {{ t('dashboard.hint') }}
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { SMARTBED_DASHBOARD_URL } from '../constants/app';

const { t } = useI18n();
</script>

<style scoped>
.fleet-dashboard-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  min-height: 100%;
}
</style>
