<template>
  <div class="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30">
    
    <router-view @toast="handleToast" />

    <Transition name="toast-slide">
      <div v-if="toast.show" 
           class="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 min-w-[320px]"
           :class="toastStyle">
        
        <div class="text-2xl">{{ toast.icon }}</div>
        
        <div class="flex-1">
          <h3 class="font-bold text-white text-sm tracking-wide">{{ toast.title }}</h3>
          <p class="text-xs opacity-90 font-medium mt-0.5">{{ toast.message }}</p>
        </div>

        <button @click="toast.show = false" class="text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';

// --- Toast Logic ---
const toast = reactive({
  show: false,
  title: '',
  message: '',
  icon: '',
  type: 'success', // success, error, warning
  timer: null
});

// ฟังก์ชันรับค่า Toast (เรียกจาก emit ในหน้าต่างๆ)
const handleToast = (payload) => {
  // payload: { title, message, icon, color }
  
  // 1. รับค่า
  toast.title = payload.title || 'แจ้งเตือน';
  toast.message = payload.message || '';
  toast.icon = payload.icon || '🔔';
  
  // แปลง class สี (alert-success -> success) เพื่อความง่าย
  if (payload.color?.includes('error')) toast.type = 'error';
  else if (payload.color?.includes('warning')) toast.type = 'warning';
  else toast.type = 'success';

  // 2. แสดงผล
  toast.show = true;

  // 3. ตั้งเวลาปิดอัตโนมัติ (3 วินาที)
  if (toast.timer) clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    toast.show = false;
  }, 3000);
};

// เลือกสีตามประเภท (Dark Mode Theme)
const toastStyle = computed(() => {
  switch (toast.type) {
    case 'success': return 'bg-emerald-600/90 border-emerald-500/50 text-white shadow-emerald-900/50';
    case 'error':   return 'bg-rose-600/90 border-rose-500/50 text-white shadow-rose-900/50';
    case 'warning': return 'bg-amber-500/90 border-amber-400/50 text-white shadow-amber-900/50';
    default:        return 'bg-slate-700/90 border-slate-600 text-white';
  }
});
</script>

<style>
/* Animation ให้ Toast เด้งเข้ามาสวยๆ */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}
</style>