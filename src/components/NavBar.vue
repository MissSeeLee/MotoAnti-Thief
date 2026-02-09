<template>
  <nav class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center px-6 fixed top-0 right-0 left-0 z-50 lg:left-72 transition-all duration-300">
    
    <!-- Left: Mobile Toggle (อนาคต) & Brand -->
    <div class="flex items-center gap-3">
      <span class="text-2xl">🏍️</span>
      <h1 class="font-bold text-slate-800 hidden sm:block">Dashboard</h1>
    </div>

    <!-- Right: Status & User -->
    <div class="flex items-center gap-4">
      <!-- Status Badge -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span class="w-2 h-2 rounded-full transition-colors duration-300" 
          :class="{
            'bg-emerald-500': status === 'Online',
            'bg-amber-500': status === 'Connecting...',
            'bg-red-500': status === 'Offline'
          }">
        </span>
        {{ status }}
      </div>
    </div>
  </nav>
</template>

<script setup>
defineProps({ status: String });
</script>