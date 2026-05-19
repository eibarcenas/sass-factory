<script setup lang="ts">
import type { BusinessStatus } from '@sass-factory/core'

defineProps<{ status: BusinessStatus }>()

const config: Record<BusinessStatus, { classes: string; label: string }> = {
  draft:     { classes: 'bg-slate-100 text-slate-600',     label: 'Draft' },
  demo:      { classes: 'bg-blue-100 text-blue-700',       label: 'Demo' },
  sent:      { classes: 'bg-yellow-100 text-yellow-700',   label: 'Sent' },
  accepted:  { classes: 'bg-green-100 text-green-700',     label: 'Accepted' },
  active:    { classes: 'bg-emerald-100 text-emerald-700', label: 'Active' },
  suspended: { classes: 'bg-red-100 text-red-700',         label: 'Suspended' },
  expired:   { classes: 'bg-gray-100 text-gray-500',       label: 'Expired' },
  rejected:  { classes: 'bg-red-50 text-red-600',          label: 'Rejected' },
  archived:  { classes: 'bg-gray-50 text-gray-400',        label: 'Archived' },
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
    :class="config[status].classes"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {{ config[status].label }}
  </span>
</template>
