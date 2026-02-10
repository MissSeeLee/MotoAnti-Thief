<template>
  <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
    
    <div class="bg-white rounded-[2rem] shadow-2xl w-[90vw] md:w-full md:max-w-md flex flex-col max-h-[90vh] overflow-hidden">
      
      <div class="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            ⚙️
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-lg">ตั้งค่าอุปกรณ์</h3>
            <p class="text-[10px] text-slate-400 font-mono">ID: {{ deviceIdDisplay }}</p>
          </div>
        </div>
        <button @click="$emit('close')" class="btn btn-sm btn-circle btn-ghost text-slate-400 hover:bg-slate-100">✕</button>
      </div>

      <div class="p-6 space-y-5 overflow-y-auto custom-scrollbar">
        
        <div class="form-control">
          <label class="label pt-0 pb-1">
            <span class="label-text font-bold text-slate-600">ชื่อรถ / ยานพาหนะ</span>
          </label>
          <input v-model="form.name" type="text" class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-blue-500 rounded-xl" placeholder="ตั้งชื่อรถของคุณ" />
        </div>

        <div class="form-control">
            <label class="label pb-1">
                <span class="label-text font-bold text-slate-600 flex items-center gap-2">
                    ⏱️ ระยะเวลาเสียงเตือน (Timer)
                </span>
            </label>
            <div class="relative">
                <input 
                    v-model.number="form.timer" 
                    type="number" 
                    min="0" 
                    max="60"
                    class="input input-bordered w-full bg-orange-50/50 focus:bg-white focus:border-orange-500 text-lg font-mono text-slate-700 pr-12 rounded-xl" 
                />
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    วินาที
                </div>
            </div>
            <label class="label pb-0">
                <span class="label-text-alt text-slate-400">ค่านี้จะถูกส่งไปตั้งค่าที่รถทันที</span>
            </label>
        </div>

        <div class="pt-4">
            <button @click="saveAll" :disabled="loading" class="btn btn-primary w-full rounded-xl shadow-lg shadow-blue-200 text-lg font-bold hover:scale-[1.02] transition-transform">
               <span v-if="loading" class="loading loading-spinner"></span>
               {{ loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
            </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import api from '../api';

const props = defineProps(['isOpen', 'device']);
const emit = defineEmits(['close', 'updated', 'toast']);

const loading = ref(false);
const form = reactive({ 
    name: '', 
    timer: 0 
});

const deviceIdDisplay = computed(() => props.device?.deviceId || props.device?.id || '');

// 🔥 Watch เพื่อดึงค่าเดิมมาใส่ Form ทุกครั้งที่เปิด Modal
watch(
  () => [props.isOpen, props.device], 
  ([isOpen, device]) => {
    if (isOpen && device) {
      form.name = device.name || '';
      // ดึงค่า alarmDuration มาใส่ใน timer
      form.timer = device.alarmDuration || 0; 
    }
  },
  { immediate: true }
);

const saveAll = async () => {
    loading.value = true;
    const id = deviceIdDisplay.value;
    
    // เตรียมข้อมูลสำหรับส่งไป Backend
    const payload = { 
        name: form.name, 
        alarmDuration: Number(form.timer)
    };

    try {
        // 1. ส่งคำสั่งอัปเดต Database
        const updatePromise = api.put(`/devices/${id}`, payload);
        
        // 2. ส่งคำสั่ง MQTT ไปที่รถ (เพื่อให้รถตั้งเวลาใหม่ทันที)
        // ❌ ของเดิม: { command: "set_timer", seconds: ... }
        // ✅ แก้เป็น: ส่ง payload ให้ตรงกับที่ ESP32 รอรับ (ถ้ามี)
        const commandPromise = api.post(`/devices/${id}/command`, {
             command: "set_timer",
             value: Number(form.timer) // หรือ seconds แล้วแต่ ESP32 เขียนรับไว้
        });

        // รอให้เสร็จทั้งคู่ (หรืออย่างน้อย Database เสร็จ)
        await Promise.all([updatePromise, commandPromise]);
        
        console.log("✅ Save Complete");

        // แจ้งเตือนสำเร็จ
        emit('updated', { id, ...payload }); 
        emit('toast', { title: 'สำเร็จ', message: 'บันทึกข้อมูลเรียบร้อย', icon: '✅', color: 'alert-success' });
        emit('close'); 

    } catch (err) {
        console.error("❌ Save Failed:", err);
        emit('toast', { title: 'ผิดพลาด', message: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง', icon: '❌', color: 'alert-error' });
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
</style>