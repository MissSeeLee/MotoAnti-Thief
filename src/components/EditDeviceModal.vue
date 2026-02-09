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
                    v-model="form.timer" 
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
            <button @click="saveAll" :disabled="loading" class="btn btn-primary w-full rounded-xl shadow-lg shadow-blue-200 text-lg font-bold">
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
    // phone: '', // ❌ ตัดออก
    timer: 0 
});

const deviceIdDisplay = computed(() => props.device?.deviceId || props.device?.id);

// 🔥 ดึงค่าเดิมมาแสดง
watch(() => props.device, (newVal) => {
    if (newVal) {
        form.name = newVal.name || '';
        // form.phone = newVal.emergencyPhone || newVal.phone || ''; // ❌ ตัดออก
        
        if (newVal.alarmDuration !== undefined && newVal.alarmDuration !== null) {
            form.timer = Number(newVal.alarmDuration); 
        } else {
            console.log("⚠️ No alarmDuration found, using DB default: 0");
            form.timer = 0;
        }
    }
}, { immediate: true, deep: true });

const saveAll = async () => {
    // 1. เตรียมข้อมูลที่จะส่ง (เหลือแค่ name กับ timer)
    const id = deviceIdDisplay.value;
    const payload = { 
        name: form.name, 
        // emergencyPhone: form.phone, // ❌ ตัดออก ไม่ส่งไปอัปเดตที่นี่แล้ว
        alarmDuration: Number(form.timer)
    };

    // Optimistic UI Update
    emit('updated', { id, ...payload }); 
    emit('toast', 'Success', 'บันทึกข้อมูลเรียบร้อย', '✅', 'alert-success');
    emit('close'); 

    // Background Process
    try {
        const updatePromise = api.put(`/devices/${id}`, payload);
        const commandPromise = api.post(`/devices/${id}/command`, {
            command: "set_timer",
            seconds: Number(form.timer)
        });

        await Promise.all([updatePromise, commandPromise]);
        console.log("✅ Background Save Complete");

    } catch (err) {
        console.error("❌ Save Failed:", err);
        emit('toast', 'Error', 'การบันทึกล้มเหลว! ข้อมูลอาจไม่ถูกบันทึก', '❌', 'alert-error');
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