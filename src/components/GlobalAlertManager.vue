<template>
  <Teleport to="body">
    
    <div v-if="criticalAlert" class="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-xs overflow-hidden flex flex-col relative animate-pop-up">
        
        <div class="pt-8 pb-6 px-6 text-center flex flex-col items-center">
             <div class="absolute top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-red-100 rounded-full animate-ping opacity-75 pointer-events-none"></div>
             
             <div class="relative z-10 text-5xl mb-4 transform transition-transform hover:scale-110">
                {{ criticalAlert.icon || '🚨' }}
             </div>
             
             <h2 class="relative z-10 text-xl font-black text-slate-800 mb-1 tracking-tight">
                {{ criticalAlert.title || 'แจ้งเตือน!' }}
             </h2>
             
             <p class="relative z-10 text-slate-500 font-medium text-xs leading-relaxed">
                {{ criticalAlert.message }}
             </p>

             <span class="mt-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono bg-slate-50 px-2 py-1 rounded">
                {{ criticalAlert.deviceId || 'UNKNOWN' }}
             </span>
        </div>

        <div class="p-4 pt-0 space-y-3 bg-white">
             <button 
                @click="muteVehicle" 
                class="btn w-full rounded-xl bg-red-500 hover:bg-red-600 border-none text-white shadow-lg shadow-red-200 group transition-all active:scale-95"
             >
                <span class="text-lg group-hover:animate-pulse">🔇</span>
                <span class="font-bold">ปิดเสียงรถ</span>
             </button>

             <button 
                @click="goToTracking" 
                class="btn w-full rounded-xl btn-ghost text-slate-400 hover:bg-slate-50 font-normal"
             >
                <span class="text-lg">📍</span>
                <span>ดูตำแหน่งรถ</span>
             </button>
             
             <button 
                @click="dismissAlert" 
                class="w-full text-xs text-slate-400 hover:text-slate-600 mt-2 underline transition-colors"
             >
                ปิดหน้าต่างนี้
             </button>
        </div>

      </div>
    </div>

    <div class="fixed top-4 right-4 z-[999999] flex flex-col gap-3 pointer-events-none items-end">
      <transition-group name="toast-slide">
        <div v-for="toast in toasts" :key="toast.id" 
             class="pointer-events-auto bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-4 min-w-[280px] max-w-sm flex gap-4 items-start border border-slate-100 ring-1 ring-black/5"
             :class="toast.type === 'warning' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-blue-500'">
          <div class="text-2xl mt-1">{{ toast.type === 'warning' ? '⚠️' : 'ℹ️' }}</div>
          <div class="flex-1">
            <h4 class="font-bold text-slate-800 text-sm">{{ toast.title }}</h4>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ toast.message }}</p>
          </div>
          <button @click="removeToast(toast.id)" class="text-slate-400 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-200 rounded-full">✕</button>
        </div>
      </transition-group>
    </div>

  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api'; // สมมติว่าคุณมีไฟล์ axios/api อยู่
// import { socket } from '../services/socket'; 

const router = useRouter();

// --- State ---
const criticalAlert = ref(null);
const toasts = ref([]);
let toastId = 0;
let sirenAudio = null;

onMounted(() => {
  sirenAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
  sirenAudio.loop = true;

  // 🔌 จุดรับข้อมูล Socket (ถ้ามี)
  /* socket.on('device_alert', processIncomingAlert); */

  // 🧪 คำสั่งจำลองสำหรับทดสอบ (พิมพ์ window.triggerTest() ใน Console)
  window.triggerTest = () => {
    processIncomingAlert({ 
        type: 'THEFT', 
        deviceId: 'DEVICE-999',
        title: 'ตรวจพบการโจรกรรม!',
        message: 'ระบบตรวจพบแรงสั่นสะเทือนรุนแรงขณะล็อครถ', 
        publicToken: 'test-token',
        icon: '🚨'
    });
  };
});

onUnmounted(() => { stopSiren(); });

const processIncomingAlert = (data) => {
  const isCritical = ['THEFT', 'CRASH', 'FALLEN'].includes(data.type);
  if (isCritical) {
    criticalAlert.value = data;
    playSiren();
  } else {
    showToast(data.title || 'แจ้งเตือน', data.message, 'warning');
  }
};

// 🔇 ฟังก์ชันปิดเสียงรถ (ยิง API ไปบอกกล่อง IoT)
const muteVehicle = async () => {
  if (!criticalAlert.value) return;
  try {
    // สมมติ URL API ของคุณ
    await api.post(`/devices/${criticalAlert.value.deviceId}/mute`);
    showToast('สำเร็จ', 'ส่งคำสั่งปิดเสียงรถแล้ว', 'info');
  } catch (error) {
    showToast('ผิดพลาด', 'ไม่สามารถปิดเสียงรถได้', 'warning');
  }
};

const goToTracking = () => {
  const token = criticalAlert.value?.publicToken;
  dismissAlert();
  if (token) router.push(`/track-public/${token}`);
  else router.push('/dashboard');
};

const dismissAlert = () => {
  criticalAlert.value = null;
  stopSiren();
};

const showToast = (title, message, type = 'info') => {
  const id = toastId++;
  toasts.value.push({ id, title, message, type });
  setTimeout(() => removeToast(id), 5000);
};

const removeToast = (id) => toasts.value = toasts.value.filter(t => t.id !== id);
const playSiren = () => { if (sirenAudio) sirenAudio.play().catch(e => console.warn(e)); };
const stopSiren = () => { if (sirenAudio) { sirenAudio.pause(); sirenAudio.currentTime = 0; } };
</script>

<style scoped>
/* เก็บ Animation เดิมของคุณไว้ทั้งหมด */
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
.animate-pop-up { animation: popUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popUp { 
  0% { opacity: 0; transform: scale(0.9) translateY(10px); } 
  100% { opacity: 1; transform: scale(1) translateY(0); } 
}

/* ของแถมสำหรับ Toasts */
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.4s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(50px) scale(0.9); }
</style>