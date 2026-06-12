<template>
  <DisconnectedState v-if="!connected" icon="mdi-bed" :min-height="220" :title="t('disconnected.defaultTitle')"
    :subtitle="t('disconnected.smartbedInstall')" />
  <v-card class="tools-card" variant="tonal" prepend-icon="mdi-bed" data-testid="smartbed-install-card">
    <template v-slot:title>
      <span class="font-weight-black">{{ t('smartbedInstall.title') }}</span>
    </template>
    <v-card-text class="tools-card__body">
      <p class="smartbed-install__intro text-medium-emphasis">
        {{ t('smartbedInstall.intro') }}
      </p>
      <v-select v-model="selectedManufacturer" :items="manufacturerItems" item-title="label" item-value="slug"
        :label="t('smartbedInstall.manufacturerLabel')" density="comfortable" :disabled="busy || flashInProgress"
        data-testid="smartbed-manufacturer-select" />
      <v-row density="comfortable" align="center" no-gutters class="smartbed-install__version-row">
        <v-col>
          <v-select v-model="selectedVersion" :items="versionItems" item-title="title" item-value="value"
            :label="t('smartbedInstall.versionLabel')" density="comfortable" :loading="versionsLoading"
            :disabled="busy || flashInProgress || versionsLoading" :no-data-text="t('smartbedInstall.noVersions')"
            data-testid="smartbed-version-select" />
        </v-col>
        <v-col cols="auto">
          <v-btn icon variant="text" class="ml-2" :title="t('smartbedInstall.refreshVersions')"
            :disabled="busy || flashInProgress || versionsLoading" data-testid="smartbed-version-refresh"
            @click="loadVersions">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-alert v-if="versionsError" type="error" variant="tonal" density="comfortable" border="start">
        {{ versionsError }}
      </v-alert>
      <v-radio-group v-model="selectedAction" :label="t('smartbedInstall.actionLabel')" hide-details
        :disabled="busy || flashInProgress">
        <v-radio value="erase" :label="t('smartbedInstall.actionErase')" data-testid="smartbed-action-erase" />
        <v-radio value="flash-only" :label="t('smartbedInstall.actionFlashOnly')"
          data-testid="smartbed-action-flash-only" />
      </v-radio-group>
      <p v-if="!connected" class="smartbed-install__hint text-medium-emphasis">
        {{ t('smartbedInstall.connectHint') }}
      </p>
      <v-btn color="primary" size="large" block :disabled="!canInstall" data-testid="smartbed-install-btn"
        @click="handleInstall">
        <v-icon start>mdi-lightning-bolt</v-icon>
        {{ t('smartbedInstall.installButton') }}
      </v-btn>
      <v-alert v-if="status" :type="statusType" variant="tonal" density="comfortable" border="start"
        data-testid="smartbed-install-status">
        {{ status }}
      </v-alert>
    </v-card-text>
  </v-card>
  <v-dialog :model-value="progressDialog.visible" persistent max-width="420" class="progress-dialog">
    <v-card class="progress-dialog__card">
      <v-card-title class="progress-dialog__title">
        <v-icon start color="primary">mdi-lightning-bolt</v-icon>
        {{ t('smartbedInstall.progress.title') }}
      </v-card-title>
      <v-card-text class="progress-dialog__body">
        <div class="progress-dialog__label">
          {{ progressDialog.label || t('smartbedInstall.progress.preparing') }}
        </div>
        <v-progress-linear :model-value="progressDialog.value" height="24" color="primary" rounded striped
          :indeterminate="progressDialog.indeterminate === true" />
      </v-card-text>
      <v-card-actions class="progress-dialog__actions">
        <v-spacer />
        <v-btn color="secondary" variant="tonal" :disabled="!flashInProgress" @click="emit('cancel-flash')">
          <v-icon start>mdi-stop</v-icon>
          {{ t('smartbedInstall.progress.stop') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DisconnectedState from './DisconnectedState.vue';
import type { AlertType, ProgressDialogState } from '../types/flash-firmware';
import type {
  SmartBedInstallAction,
  SmartBedInstallRequest,
  SmartBedManufacturer,
} from '../types/smartbed-install';

// Supported manufacturer targets (slug -> R2 binary base name). Brand names are
// technical identifiers and intentionally not translated. The chair and reseller
// brand variants are excluded by design - they have no field OTA binaries in R2.
const MANUFACTURERS: SmartBedManufacturer[] = [
  { slug: 'timotion', label: 'TiMotion', binName: 'TiMotionBed' },
  { slug: 'jiecang', label: 'Jiecang', binName: 'JiecangBed' },
  { slug: 'duomat9', label: 'Duomat 9', binName: 'Duomat9Bed' },
  { slug: 'okin_cb24', label: 'Okin CB24', binName: 'Okin_CB24Bed' },
  { slug: 'linak', label: 'Linak (wired)', binName: 'LinakBed' },
  { slug: 'ergomotion', label: 'Ergomotion', binName: 'ErgomotionBed' },
  { slug: 'tempurpedic', label: 'Tempurpedic', binName: 'TempurpedicBed' },
  { slug: 'richmat_hjc9', label: 'Richmat HJC9', binName: 'Richmat_HJC9Bed' },
  { slug: 'trimix_s4', label: 'Trimix S4', binName: 'TrimixBed' },
  { slug: 'theorem', label: 'Theorem (lift chair)', binName: 'TheoremBed' },
  { slug: 'linak_ble', label: 'LINAK BLE', binName: 'Linak_BLEBed' },
];

const VERSION_LIST_LIMIT = 15;

const props = withDefaults(
  defineProps<{
    connected: boolean;
    busy: boolean;
    flashInProgress: boolean;
    progressDialog?: ProgressDialogState;
    status?: string | null;
    statusType?: AlertType;
  }>(),
  {
    progressDialog: () => ({ visible: false, value: 0, label: '', indeterminate: false }),
    status: null,
    statusType: 'info',
  },
);

const emit = defineEmits<{
  (e: 'install', payload: SmartBedInstallRequest): void;
  (e: 'cancel-flash'): void;
}>();

const { t } = useI18n();

const manufacturerItems = MANUFACTURERS;
const selectedManufacturer = ref<string | null>(null);
const selectedVersion = ref<string | null>(null);
const selectedAction = ref<SmartBedInstallAction>('erase');
const versions = ref<string[]>([]);
const versionsLoading = ref(false);
const versionsError = ref<string | null>(null);

const versionItems = computed(() =>
  versions.value.map((version, index) => ({
    title: index === 0 ? `${version} ${t('smartbedInstall.latestSuffix')}` : version,
    value: version,
  })),
);

const canInstall = computed(
  () =>
    props.connected &&
    !props.busy &&
    !props.flashInProgress &&
    !versionsLoading.value &&
    selectedManufacturer.value !== null &&
    selectedVersion.value !== null,
);

async function loadVersions() {
  versionsLoading.value = true;
  versionsError.value = null;
  try {
    const response = await fetch('/api/stable/versions', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload: unknown = await response.json();
    const rawVersions = (payload as { versions?: unknown })?.versions;
    const list = Array.isArray(rawVersions)
      ? rawVersions.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
      : [];
    versions.value = list.slice(0, VERSION_LIST_LIMIT);
    if (!selectedVersion.value || !versions.value.includes(selectedVersion.value)) {
      selectedVersion.value = versions.value[0] ?? null;
    }
  } catch (error) {
    versions.value = [];
    selectedVersion.value = null;
    versionsError.value = t('smartbedInstall.versionsError', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    versionsLoading.value = false;
  }
}

function handleInstall() {
  const manufacturer = MANUFACTURERS.find(entry => entry.slug === selectedManufacturer.value);
  if (!manufacturer || !selectedVersion.value) {
    return;
  }
  emit('install', {
    slug: manufacturer.slug,
    label: manufacturer.label,
    binName: manufacturer.binName,
    version: selectedVersion.value,
    erase: selectedAction.value === 'erase',
  });
}

onMounted(() => {
  void loadVersions();
});
</script>

<style scoped>
.tools-card {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--v-theme-primary) 16%, transparent);
  background: color-mix(in srgb, var(--v-theme-surface) 94%, transparent);
}

.tools-card__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.smartbed-install__intro {
  font-size: 0.9rem;
  line-height: 1.4;
}

.smartbed-install__hint {
  font-size: 0.78rem;
  margin-top: -4px;
}

.smartbed-install__version-row {
  flex-wrap: nowrap;
}

.progress-dialog__card {
  padding: 20px;
}

.progress-dialog__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.progress-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-dialog__label {
  font-size: 0.95rem;
}

.progress-dialog__actions {
  justify-content: flex-end;
}
</style>
