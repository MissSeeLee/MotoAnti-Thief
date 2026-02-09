<template>
  <Transition 
     enter-active-class="transition duration-300 ease-out" 
     enter-from-class="opacity-0 translate-y-10" 
     enter-to-class="opacity-100 translate-y-0" 
     leave-active-class="transition duration-200 ease-in" 
     leave-from-class="opacity-100 translate-y-0" 
     leave-to-class="opacity-0 translate-y-10"
  >
    <div v-if="isOpen" 
         class="absolute z-[500] 
                bottom-0 left-0 right-0 p-4 
                md:left-auto md:right-6 md:bottom-6 md:w-96 md:p-0">
       
       <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-white/50 overflow-hidden flex flex-col w-full">
          
          <div class="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div class="flex items-center gap-2">
                  <span class="text-xl">📡</span>
                  <div>
                    <h3 class="font-bold text-slate-800 leading-tight">Geofence</h3>
                    <p class="text-[10px] text-slate-500 font-medium">
                        สถานะ: <span :class="localGeofence.enabled ? 'text-green-600' : 'text-slate-400'">{{ localGeofence.enabled ? 'ทำงานอยู่' : 'ปิดการทำงาน' }}</span>
                    </p>
                  </div>
              </div>
              <button @click="$emit('close')" class="btn btn-xs btn-circle btn-ghost text-slate-400 hover:bg-slate-200">✕</button>
          </div>

          <div class="p-5 space-y-4">
              <div class="flex items-center justify-between p-3 rounded-xl border transition-all duration-300"
                   :class="localGeofence.enabled ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100'">
                  <span class="text-sm font-bold text-slate-700">เปิดระบบแจ้งเตือน</span>
                  <input type="checkbox" v-model="localGeofence.enabled" @change="handleToggle" 
                         :disabled="readOnly"
                         class="toggle toggle-success toggle-md disabled:opacity-50" />
              </div>

              <div v-if="localGeofence.enabled" class="animate-expand-down overflow-hidden space-y-4">
                  
                  <div class="flex items-start gap-2 text-[10px] text-slate-500 bg-blue-50 border border-blue-100 p-2 rounded-lg">
                    <span>{{ readOnly ? '🔒' : '🎯' }}</span>
                    <span>{{ readOnly ? 'คุณอยู่ในโหมดคนขับ ไม่สามารถแก้ไขขอบเขตได้' : 'ลากแผนที่เพื่อเล็งเป้า (+) ตรงกับจุดที่ต้องการ' }}</span>
                  </div>

                  <div v-if="!readOnly" class="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                      <div class="flex justify-between items-center mb-2">
                          <span class="text-xs font-bold text-slate-400">รัศมี (Radius)</span>
                          <div class="flex items-center gap-1">
                            <input v-model.number="localGeofence.radius" type="number" min="10" class="input input-xs input-bordered w-20 text-center font-black text-purple-600 bg-slate-50 focus:border-purple-500" />
                            <span class="text-xs text-slate-400">m</span>
                          </div>
                      </div>
                      <input v-model.number="localGeofence.radius" type="range" min="100" max="5000" step="50" class="range range-xs range-primary w-full" />
                      <div class="flex justify-between gap-1 mt-2">
                          <button @click="localGeofence.radius = 100" class="btn btn-xs flex-1 bg-slate-50 border-none hover:bg-purple-100 text-slate-500">100m</button>
                          <button @click="localGeofence.radius = 500" class="btn btn-xs flex-1 bg-slate-50 border-none hover:bg-purple-100 text-slate-500">500m</button>
                          <button @click="localGeofence.radius = 1000" class="btn btn-xs flex-1 bg-slate-50 border-none hover:bg-purple-100 text-slate-500">1km</button>
                      </div>
                  </div>
                  
                  <div v-else class="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span class="text-xs text-slate-400 font-bold uppercase">รัศมีปัจจุบัน</span>
                      <div class="text-3xl font-black text-slate-700 mt-1">{{ localGeofence.radius }}<span class="text-sm text-slate-400 ml-1">m</span></div>
                  </div>

                  <button v-if="!readOnly" @click="save" :disabled="loading" class="btn btn-primary btn-sm w-full rounded-xl shadow-lg shadow-blue-200 h-10 text-base">
                      {{ loading ? '...' : 'บันทึกตำแหน่งนี้' }}
                  </button>
              </div>
          </div>
       </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, watch } from 'vue';

// ✅ เพิ่ม prop readOnly
const props = defineProps(['isOpen', 'geofenceData', 'loading', 'readOnly']);
const emit = defineEmits(['close', 'save', 'update:data']);

const localGeofence = reactive({ ...props.geofenceData });

watch(() => props.geofenceData, (newVal) => {
    if (!props.loading) Object.assign(localGeofence, newVal);
}, { deep: true });

watch(localGeofence, (newVal) => {
    // ถ้า ReadOnly ไม่ต้องส่ง event update กลับไป (ป้องกันการขยับ map เล่นแล้วค่าเปลี่ยน)
    if(!props.readOnly) emit('update:data', newVal);
});

const handleToggle = () => {
    if (props.readOnly) return; // ห้ามกด
    if (localGeofence.enabled === false) {
        emit('save', localGeofence);
    } 
};

const save = () => {
    if (props.readOnly) return;
    emit('save', localGeofence);
};
</script>

<style scoped>
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.animate-expand-down { animation: expandDown 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes expandDown { from { opacity: 0; transform: translateY(-10px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 500px; } }
</style>