<script setup lang="ts">
import { useToast } from '~/composables/useToast'
import { useNotifications } from '~/composables/useNotifications'
import MfeErrorBoundary from '~/components/MfeErrorBoundary.vue'

const { toasts, remove } = useToast()
const { notifications, unreadCount, isOpen, openAndMarkRead, close, timeAgo } = useNotifications()

const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/', icon: '📱' },
  { label: 'Generate', to: '/apps/generate', icon: '🤖' },
  { label: 'Apps', to: '/apps/new', icon: '✨' },
  { label: 'Infrastructure', to: '/infra', icon: '🏗️' },
  { label: 'Simulate', to: '/infra/new', icon: '🐳' },
  { label: 'Deploy to GCP', to: '/infra/deploy', icon: '🚀' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const sidebarOpen = ref(false)

const toastStyles: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 md:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div
          class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"
        >
          S
        </div>
        <div>
          <p class="font-semibold text-gray-900 text-sm leading-tight">SASS Factory</p>
          <p class="text-xs text-gray-400 leading-tight">Admin Panel</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          :class="
            isActive(item.to)
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          "
          @click="sidebarOpen = false"
        >
          <span class="text-base">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-100">
        <p class="text-xs text-gray-400 text-center">SASS Factory v0.1.0</p>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Main content -->
    <div class="flex-1 md:ml-64 flex flex-col min-h-screen">
      <!-- Top bar -->
      <header class="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex-1" />

        <!-- Notification bell -->
        <div class="relative">
          <button
            class="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            @click="isOpen ? close() : openAndMarkRead()"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span
              v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="isOpen"
              v-click-outside="close"
              class="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span class="text-sm font-semibold text-gray-900">Notifications</span>
                <span v-if="notifications.length" class="text-xs text-gray-400">{{ notifications.length }} total</span>
              </div>

              <div class="max-h-96 overflow-y-auto divide-y divide-gray-50">
                <div v-if="!notifications.length" class="px-4 py-8 text-center text-sm text-gray-400">
                  No notifications yet
                </div>

                <NuxtLink
                  v-for="n in notifications"
                  :key="n.id"
                  :to="n.link ?? '/'"
                  class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  :class="n.read ? 'opacity-70' : ''"
                  @click="close"
                >
                  <!-- Type icon -->
                  <div
                    class="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                    :class="{
                      'bg-green-100': n.type === 'app_created',
                      'bg-blue-100':  n.type === 'app_deployed',
                      'bg-purple-100': n.type === 'app_simulated',
                      'bg-red-100':   n.type === 'error',
                      'bg-gray-100':  n.type === 'info',
                    }"
                  >
                    <span v-if="n.type === 'app_created'">✨</span>
                    <span v-else-if="n.type === 'app_deployed'">🚀</span>
                    <span v-else-if="n.type === 'app_simulated'">🐳</span>
                    <span v-else-if="n.type === 'error'">⚠️</span>
                    <span v-else>ℹ️</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ n.title }}</p>
                      <span
                        v-if="!n.read"
                        class="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"
                      />
                    </div>
                    <p v-if="n.message" class="text-xs text-gray-500 mt-0.5 truncate">{{ n.message }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ timeAgo(n.createdAt) }}</p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>

        <NuxtLink
          to="/apps/new"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New App
        </NuxtLink>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-6">
        <MfeErrorBoundary>
          <slot />
        </MfeErrorBoundary>
      </main>
    </div>

    <!-- Toast notifications -->
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm text-sm"
          :class="toastStyles[toast.type]"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            @click="remove(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
