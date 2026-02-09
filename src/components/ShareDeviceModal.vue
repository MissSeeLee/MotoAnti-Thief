<template>
  <div v-if="isOpen" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="closeModal"></div>

    <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 p-6">
      
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span class="bg-pink-100 text-pink-600 p-2 rounded-lg">🔑</span>
          แชร์กุญแจดิจิทัล
        </h3>
        <button @click="closeModal" class="btn btn-circle btn-ghost btn-sm text-slate-400 hover:bg-slate-100">✕</button>
      </div>

      <div v-if="!shareLink">
        <div class="mb-4">
          <label class="label text-slate-600 font-medium">ชื่อคนขับ / ป้ายกำกับ</label>
          <input 
            v-model="label" 
            type="text" 
            placeholder="เช่น ให้แฟนขับ, ไรเดอร์กะเช้า" 
            class="input input-bordered w-full bg-slate-50 focus:ring-2 focus:ring-pink-400"
            @keyup.enter="generateLink"
          />
        </div>
        
        <div class="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-6 flex gap-2 items-start">
          <span>ℹ️</span>
          <span>ผู้รับลิงก์จะสามารถดูตำแหน่งและติดตามรถคันนี้ได้ทันทีโดยไม่ต้อง Login</span>
        </div>

        <button 
          @click="generateLink" 
          :disabled="isLoading || !label" 
          class="btn w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-none shadow-lg shadow-pink-200"
        >
          <span v-if="isLoading" class="loading loading-spinner"></span>
          <span v-else>สร้างลิงก์แชร์ (Create Link)</span>
        </button>
      </div>

      <div v-else class="text-center">
        <div class="flex flex-col items-center justify-center mb-6">
          <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-3 animate-bounce">
            ✅
          </div>
          <h4 class="text-lg font-bold text-slate-800">สร้างกุญแจสำเร็จ!</h4>
          <p class="text-slate-500 text-sm">ส่งลิงก์นี้ให้คนขับของคุณ</p>
        </div>

        <div class="relative mb-6">
          <input 
            type="text" 
            :value="shareLink" 
            readonly 
            class="input input-bordered w-full pr-24 bg-slate-50 font-mono text-sm text-slate-600"
          />
          <button 
            @click="copyToClipboard" 
            class="absolute right-1 top-1 bottom-1 btn btn-sm bg-slate-800 text-white hover:bg-slate-700 border-none"
          >
            {{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}
          </button>
        </div>

        <button @click="closeModal" class="btn btn-ghost w-full text-slate-500">ปิดหน้าต่าง</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import api from '../api'; 

const props = defineProps({
  isOpen: Boolean,
  device: Object
});

const emit = defineEmits(['close', 'toast']);

const label = ref('');
const isLoading = ref(false);
const shareLink = ref('');
const copied = ref(false);

// Reset values when modal opens
watch(() => props.isOpen, (val) => {
  if (val) {
    label.value = '';
    shareLink.value = '';
    copied.value = false;
  }
});

const closeModal = () => {
  emit('close');
};

const generateLink = async () => {
  if (!label.value) return;
  isLoading.value = true;

  try {
    // ✅ FIX: Removed '/api' prefix. Now uses '/devices/...'
    const res = await api.post(`/devices/${props.device.id}/share`, {
      label: label.value
    });

    if (res.data.success) {
      shareLink.value = res.data.link;
      emit('toast', 'Success', 'สร้างกุญแจสำเร็จ', '✅', 'alert-success');
    }
  } catch (error) {
    console.error(error);
    // Handle error message properly
    const errorMsg = error.response?.data?.message || 'สร้างกุญแจไม่สำเร็จ';
    emit('toast', 'Error', errorMsg, '❌', 'alert-error');
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(shareLink.value);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
  emit('toast', 'Copied', 'คัดลอกลิงก์แล้ว', '📋', 'alert-info');
};
</script>