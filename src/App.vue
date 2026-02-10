<template>
  <div class="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30">
    
    <router-view @toast="handleToast" />

    <Transition name="toast-slide">
      <div v-if="toast.show" 
           class="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 min-w-[320px] max-w-sm"
           :class="toastStyle">
        
        <div class="text-2xl flex-shrink-0">{{ toast.icon }}</div>
        
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-white text-sm tracking-wide truncate">{{ toast.title }}</h3>
          <p class="text-xs text-white/90 font-medium mt-0.5 break-words leading-relaxed">{{ toast.message }}</p>
        </div>

        <button @click="toast.show = false" class="text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';

// --- Toast State ---
const toast = reactive({
  show: false,
  title: '',
  message: '',
  icon: '',
  type: 'success', 
  timer: null
});

// --- Handle Toast Event ---
const handleToast = (payload) => {
  // ป้องกันกรณี payload เป็น null หรือ undefined
  if (!payload) return;

  // กรณี 1: ส่งมาแค่ String (เผื่อมีโค้ดเก่าเรียกใช้)
  if (typeof payload === 'string') {
    setupToast({ title: payload });
    return;
  }

  // กรณี 2: ส่งมาเป็น Object (มาตรฐานใหม่)
  setupToast(payload);
};

const setupToast = (data) => {
  // 1. กำหนดค่า (มี Default กันเหนียว)
  toast.title = data.title || 'แจ้งเตือน';
  toast.message = data.message || '';
  toast.icon = data.icon || '🔔';

  // 2. ตรวจสอบสี (Mapping class จาก Modal ให้เป็น Type ของ App)
  const colorClass = data.color || '';
  if (colorClass.includes('error') || colorClass.includes('rose') || colorClass.includes('red')) {
    toast.type = 'error';
  } else if (colorClass.includes('warning') || colorClass.includes('amber')) {
    toast.type = 'warning';
  } else {
    toast.type = 'success';
  }

  // 3. สั่งแสดงผล
  toast.show = true;

  // 4. ตั้งเวลาปิด (3 วินาที)
  if (toast.timer) clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    toast.show = false;
  }, 3000);
};

// --- Dynamic Styles ---
const toastStyle = computed(() => {
  switch (toast.type) {
    case 'success': 
      return 'bg-emerald-600/90 border-emerald-500/50 shadow-emerald-900/50';
    case 'error':   
      return 'bg-rose-600/90 border-rose-500/50 shadow-rose-900/50';
    case 'warning': 
      return 'bg-amber-500/90 border-amber-400/50 shadow-amber-900/50';
    default:        
      return 'bg-slate-700/90 border-slate-600';
  }
});
</script>

<style>
/* Animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
</style>