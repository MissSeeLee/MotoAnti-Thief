<template>
  <div v-if="isOpen" class="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4 max-w-md mx-auto">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" @click="closeModal"></div>

    <div class="relative w-full bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-8 animate-slide-up">
      
      <div class="flex justify-between items-center mb-8">
        <h3 class="text-xl font-black text-slate-800 flex items-center gap-3">
          <div class="bg-blue-100 text-blue-600 p-2.5 rounded-2xl shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0-10.628a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm0 10.628a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" /></svg>
          </div>
          สร้างลิ้งค์แชร์ใหม่
        </h3>
        <button @click="closeModal" class="btn btn-circle btn-ghost btn-sm text-slate-400 hover:bg-slate-100">✕</button>
      </div>

      <div v-if="!shareToken">
        <div class="mb-6">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อเรียก / ป้ายกำกับ</label>
          <input 
            v-model="label" 
            type="text" 
            placeholder="เช่น ลูกชาย, ภรรยา, พี่วินมอไซค์..." 
            class="input w-full bg-slate-50 border-slate-200 focus:border-blue-500 rounded-2xl mt-2 font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 transition-all h-14"
            @keyup.enter="generateLink"
          />
        </div>
        
        <div class="bg-blue-50 border border-blue-100/50 text-blue-700 text-xs p-4 rounded-2xl mb-8 leading-relaxed font-medium shadow-sm flex gap-3 items-start">
          <span class="text-lg">💡</span>
          <p><b>ลิ้งค์นี้ใช้ลงทะเบียนได้เพียงครั้งเดียว</b> <br>เมื่อผู้รับกรอกข้อมูลเบอร์และอีเมลเสร็จ ลิ้งค์จะหมดอายุทันทีเพื่อความปลอดภัยสูงสุด</p>
        </div>

        <button 
          @click="generateLink" 
          :disabled="isLoading || !label" 
          class="btn btn-block h-14 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-2xl shadow-xl shadow-blue-200 text-base font-black transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
        >
          <span v-if="isLoading" class="loading loading-spinner"></span>
          <span v-else>สร้างลิ้งค์ลงทะเบียน</span>
        </button>
      </div>

      <div v-else class="text-center animate-pop">
        <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto shadow-inner">
          ✓
        </div>
        <h4 class="text-xl font-black text-slate-800 mb-1">ลิ้งค์พร้อมส่งแล้ว!</h4>
        <p class="text-slate-400 text-[10px] font-bold mb-8 uppercase tracking-[0.2em]">ส่งให้ "{{ label }}" เพื่อผูกการแจ้งเตือน</p>

        <div class="relative group mb-8">
          <input 
            type="text" 
            :value="fullShareUrl" 
            readonly 
            class="input w-full bg-slate-50 border-dashed border-2 border-slate-200 rounded-2xl font-mono text-xs text-blue-600 pr-24 h-14 focus:outline-none"
          />
          <button 
            @click="copyToClipboard" 
            class="absolute right-2 top-2 bottom-2 px-4 bg-white shadow-sm border border-slate-100 rounded-xl text-xs font-black text-blue-600 active:scale-95 transition-all hover:bg-blue-50"
          >
            {{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}
          </button>
        </div>

        <button @click="closeModal" class="btn btn-block btn-ghost font-bold text-slate-500 rounded-2xl h-12">
          ปิดหน้าต่าง
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import api from '../api'; 

const props = defineProps({
  isOpen: Boolean,
  deviceId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'refresh', 'toast']);

// --- State ---
const label = ref('');
const isLoading = ref(false);
const shareToken = ref(''); // เก็บ Token ที่สร้างจาก Backend
const copied = ref(false);

// --- Computed ---
// สร้าง URL เต็มรูปแบบอิงจาก Domain ปัจจุบัน เพื่อให้ก๊อปปี้ไปส่งใน Line ได้เลย
const fullShareUrl = computed(() => {
  if (!shareToken.value) return '';
  return `${window.location.origin}/register-share/${shareToken.value}`;
});

// --- Watchers ---
// รีเซ็ตค่าฟอร์มทุกครั้งที่เปิด Modal ขึ้นมาใหม่
watch(() => props.isOpen, (val) => {
  if (val) {
    label.value = '';
    shareToken.value = '';
    copied.value = false;
  }
});

// --- Methods ---
const closeModal = () => {
  if (isLoading.value) return; // ป้องกันการกดปิดตอนกำลังโหลด
  emit('close');
};

const generateLink = async () => {
  if (!label.value) return;
  isLoading.value = true;

  try {
    // ยิง API สร้าง Token ลง Database 
    // หมายเหตุ: Backend ของคุณต้องมี Route POST /devices/:deviceId/sharing
    const res = await api.post(`/devices/${props.deviceId}/sharing`, {
      label: label.value
    });

    if (res.data.token || res.data.share) {
      // Backend ควร Response ส่ง token กลับมา
      shareToken.value = res.data.token || res.data.share.token;
      
      // ส่งสัญญาณบอกหน้าแม่ (SharingManagement) ให้รีเฟรชตารางข้อมูลใหม่
      emit('refresh'); 
      emit('toast', 'สำเร็จ', 'สร้างลิ้งค์ลงทะเบียนเรียบร้อย', '✅', 'alert-success');
    }
  } catch (error) {
    console.error(error);
    const errorMsg = error.response?.data?.message || 'ไม่สามารถสร้างลิ้งค์ได้';
    emit('toast', 'ผิดพลาด', errorMsg, '❌', 'alert-error');
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(fullShareUrl.value).then(() => {
    copied.value = true;
    emit('toast', 'คัดลอกแล้ว', 'นำลิ้งค์ไปวางในแชทได้เลย', '📋', 'alert-info');
    setTimeout(() => copied.value = false, 2000);
  }).catch(err => {
    console.error('Copy failed', err);
    emit('toast', 'ผิดพลาด', 'ไม่สามารถคัดลอกได้', '❌', 'alert-error');
  });
};
</script>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-pop {
  animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes pop {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>