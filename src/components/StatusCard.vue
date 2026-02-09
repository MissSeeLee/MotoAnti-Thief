<template>
  <div v-if="vehicle && vehicle.id" 
       class="absolute z-20 transition-all duration-300
              /* 📱 Mobile: กลางบน */
              top-16 left-1/2 -translate-x-1/2 w-[90vw] 
              /* 🖥️ Desktop: ขวาบน */
              md:top-4 md:right-4 md:left-auto md:translate-x-0 md:w-72 
              animate-fade-in-up">
    
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 overflow-hidden transition-all duration-300"
         :class="isExpanded ? 'p-0' : 'cursor-pointer hover:scale-[1.02] active:scale-95'"
         @click="!isExpanded && toggleExpand()">
      
      <div class="flex justify-between items-center p-3 bg-slate-50/50" 
           :class="{ 'border-b border-slate-100': isExpanded }">
        
        <div class="flex items-center gap-3 overflow-hidden">
             <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm"
                  :class="vehicle.status === 'ONLINE' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'">
                 <span class="text-xl">🛵</span>
             </div>
             
             <div class="min-w-0 flex flex-col">
                 <h2 class="font-black text-slate-800 text-sm leading-tight truncate max-w-[120px]">
                    {{ vehicle.name || 'Unnamed' }}
                 </h2>
                 <div v-if="!isExpanded" class="flex items-center gap-1 mt-0.5">
                    <div class="w-1.5 h-1.5 rounded-full" :class="vehicle.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'"></div>
                    <span class="text-[10px] font-bold" :class="vehicle.status === 'ONLINE' ? 'text-green-600' : 'text-slate-400'">
                        {{ vehicle.status || 'OFFLINE' }}
                    </span>
                 </div>
                 <span v-else class="text-[10px] text-slate-400 font-mono">ID: {{ vehicle.id }}</span>
             </div>
        </div>

        <button @click.stop="toggleExpand" 
                class="btn btn-xs btn-circle btn-ghost text-slate-400 hover:bg-slate-200 transition-transform duration-300"
                :class="{ 'rotate-180': isExpanded }">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      <div v-if="isExpanded" class="p-4 pt-3 space-y-3 animate-slide-down bg-white">
         
         <div class="badge font-bold border-none h-6 gap-1 w-full justify-center" 
             :class="vehicle.status === 'ONLINE' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'">
            <span v-if="vehicle.status === 'ONLINE'" class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            {{ vehicle.status || 'OFFLINE' }}
         </div>

         <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-50 rounded-xl p-2 py-3 flex flex-col items-center justify-center border border-slate-100">
               <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Engine</span>
               <div class="text-lg mt-1 font-bold" :class="vehicle.ign ? 'text-green-500' : 'text-slate-300 grayscale'">
                 {{ vehicle.ign ? 'ON' : 'OFF' }}
               </div>
            </div>
            <div class="bg-slate-50 rounded-xl p-2 py-3 flex flex-col items-center justify-center border border-slate-100">
               <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Battery</span>
               <div class="flex items-center gap-1 mt-1">
                 <span class="text-base">🔋</span>
                 <span class="font-bold text-slate-600">{{ vehicle.battery || 0 }}%</span>
               </div>
            </div>
         </div>

         <div class="text-center pt-1">
            <span class="text-[10px] text-slate-300">
              อัปเดต: {{ new Date().toLocaleTimeString('th-TH') }}
            </span>
         </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps(['vehicle']);

// เริ่มต้นให้ "กางออก (true)" หรือ "หุบ (false)" ตามชอบครับ
const isExpanded = ref(true); 

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-slide-down { animation: slideDown 0.3s ease-out; transform-origin: top; }
@keyframes slideDown { 
    from { opacity: 0; transform: scaleY(0.95) translateY(-10px); max-height: 0; } 
    to { opacity: 1; transform: scaleY(1) translateY(0); max-height: 500px; } 
}
</style>