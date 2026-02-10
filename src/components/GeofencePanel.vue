<template>
  <Transition 
      enter-active-class="transition duration-300 ease-out" 
      enter-from-class="translate-y-full opacity-0" 
      enter-to-class="translate-y-0 opacity-100" 
      leave-active-class="transition duration-200 ease-in" 
      leave-from-class="translate-y-0 opacity-100" 
      leave-to-class="translate-y-full opacity-0"
  >
    <div v-if="isOpen" 
         class="fixed z-[500] 
                bottom-0 left-0 right-0 
                bg-white rounded-t-2xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)]
                md:top-24 md:left-auto md:right-6 md:bottom-auto md:w-80 md:rounded-2xl md:shadow-2xl border border-slate-100
                max-h-[85vh] flex flex-col" 
    > 
       
       <div class="w-full flex justify-center pt-3 pb-1 md:hidden flex-none" @click="$emit('close')">
          <div class="w-12 h-1.5 bg-slate-200 rounded-full"></div>
       </div>

       <div class="flex flex-col w-full overflow-y-auto"> 
          
          <div class="px-5 py-3 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <div class="flex items-center gap-2">
                  <span class="text-xl">📡</span>
                  <div>
                    <h3 class="font-bold text-slate-800 text-sm leading-none">Geofence</h3>
                    <span class="text-[10px] font-medium" :class="localGeofence.enabled ? 'text-green-500' : 'text-slate-400'">
                        {{ localGeofence.enabled ? '● ทำงานอยู่' : '○ ปิดการทำงาน' }}
                    </span>
                  </div>
              </div>
              <button @click="$emit('close')" class="btn btn-xs btn-circle btn-ghost text-slate-400 hover:bg-slate-100">✕</button>
          </div>

          <div class="px-5 pt-4 pb-8 space-y-4">
              
              <div class="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <span class="text-xs font-bold text-slate-600">แจ้งเตือนเมื่อออกนอกเขต</span>
                  <input type="checkbox" v-model="localGeofence.enabled" @change="handleToggleChange" 
                         :disabled="readOnly"
                         class="toggle toggle-success toggle-sm" />
              </div>

              <div v-if="localGeofence.enabled" class="space-y-4 animate-fade-in">
                  
                  <div class="flex items-start gap-2 text-[10px] text-blue-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 leading-tight">
                    <span class="text-base">🎯</span>
                    <span class="pt-0.5">{{ readOnly ? 'โหมดคนขับแก้ไขไม่ได้' : 'กดบนแผนที่เพื่อกำหนดขอบเขต' }}</span>
                  </div>

                  <div v-if="!readOnly" class="space-y-3">
                      <div class="flex justify-between items-center px-1">
                          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รัศมี (Radius)</span>
                          
                          <div class="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 h-8">
                              <input 
                                  v-model.number="localGeofence.radius" 
                                  type="number" 
                                  min="10" 
                                  class="input input-ghost input-xs p-0 w-16 text-right font-black text-purple-600 focus:outline-none focus:bg-transparent h-full" 
                              />
                              <span class="text-[10px] text-slate-400 ml-1 font-bold">m</span>
                          </div>
                      </div>
                      
                      <input 
                        v-model.number="localGeofence.radius" 
                        type="range" 
                        min="100" 
                        max="5000" 
                        step="50" 
                        class="range range-xs range-primary w-full h-2 accent-purple-600" 
                        style="color: #9333ea;" 
                      />
                      
                      <div class="flex justify-between gap-2">
                          <button @click="localGeofence.radius = 100" class="btn btn-xs flex-1 bg-white border border-slate-200 text-slate-500 font-normal hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50">100m</button>
                          <button @click="localGeofence.radius = 500" class="btn btn-xs flex-1 bg-white border border-slate-200 text-slate-500 font-normal hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50">500m</button>
                          <button @click="localGeofence.radius = 1000" class="btn btn-xs flex-1 bg-white border border-slate-200 text-slate-500 font-normal hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50">1km</button>
                      </div>
                  </div>
                  
                  <div v-else class="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span class="text-[10px] text-slate-400 font-bold uppercase">รัศมีปัจจุบัน</span>
                      <div class="text-2xl font-black text-slate-700">{{ localGeofence.radius }}<span class="text-xs text-slate-400 ml-1">m</span></div>
                  </div>

                  <div v-if="!readOnly" class="pt-2">
                      <button @click="save" :disabled="loading" class="btn btn-primary w-full rounded-xl shadow-md font-bold text-white text-base h-12 min-h-0 border-none bg-gradient-to-r from-blue-600 to-indigo-600">
                          {{ loading ? 'กำลังบันทึก...' : 'บันทึกตำแหน่ง' }}
                      </button>
                  </div>
              </div>
          </div>
       </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps(['isOpen', 'geofenceData', 'loading', 'readOnly']);
const emit = defineEmits(['close', 'save', 'update:data', 'zoom-to-car', 'disable-geofence']);

const localGeofence = reactive({ ...props.geofenceData });

watch(() => props.geofenceData, (newVal) => {
    if (!props.loading && newVal) {
        Object.assign(localGeofence, newVal);
    }
}, { deep: true, immediate: true });

watch(localGeofence, (newVal) => {
    if(!props.readOnly) emit('update:data', newVal);
}, { deep: true });

const handleToggleChange = () => {
    if (props.readOnly) return;
    if (localGeofence.enabled) {
        emit('zoom-to-car');
    } else {
        emit('disable-geofence');
    }
};

const save = () => {
    if (props.readOnly) return;
    emit('save', localGeofence);
};
</script>

<style scoped>
/* ซ่อนปุ่ม Spin ของ Input Number ให้ดูสะอาดตา (แต่ยังพิมพ์ได้) */
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

/* Fix DaisyUI Range Color */
.range-primary {
    --range-shdw: #9333ea; 
}
</style>