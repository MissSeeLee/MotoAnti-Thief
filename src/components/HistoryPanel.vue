<template>
  <Transition 
    enter-active-class="transition-transform duration-300 ease-out" 
    enter-from-class="translate-y-full" 
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-300 ease-in" 
    leave-from-class="translate-y-0" 
    leave-to-class="translate-y-full"
  >
    <div class="fixed bottom-0 left-0 right-0 z-[500] 
                bg-white/95 backdrop-blur-md rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] 
                border-t border-white/50 md:left-auto md:right-6 md:bottom-6 md:w-96 md:rounded-2xl">
      
      <div @click="isExpanded = !isExpanded" 
           class="flex flex-col items-center justify-center pt-2 pb-3 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-3xl md:rounded-t-2xl">
        
        <div class="w-12 h-1.5 bg-slate-200 rounded-full mb-2 md:hidden"></div>
        
        <div class="w-full px-6 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <span class="text-xl">📅</span>
                <div>
                    <h3 class="font-bold text-slate-800 text-sm">ประวัติย้อนหลัง</h3>
                    <p class="text-[10px] text-slate-400" v-if="!isExpanded && selectedDate">
                        {{ formatDate(selectedDate) }}
                    </p>
                </div>
            </div>
            
            <button class="btn btn-xs btn-circle btn-ghost text-slate-400 transform transition-transform duration-300"
                    :class="isExpanded ? 'rotate-180' : 'rotate-0'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
            </button>
        </div>
      </div>

      <div v-if="isExpanded" class="px-6 pb-6 space-y-4 animate-expand">
          
          <div class="form-control">
              <label class="label"><span class="label-text text-xs font-bold text-slate-500">เลือกวันที่</span></label>
              <input type="date" v-model="selectedDate" class="input input-sm input-bordered w-full bg-slate-50 font-bold text-slate-700" />
          </div>

          <div class="grid grid-cols-2 gap-3">
              <div class="form-control">
                  <label class="label"><span class="label-text text-xs font-bold text-slate-500">ตั้งแต่</span></label>
                  <input type="time" v-model="startTime" class="input input-sm input-bordered w-full bg-slate-50" />
              </div>
              <div class="form-control">
                  <label class="label"><span class="label-text text-xs font-bold text-slate-500">ถึง</span></label>
                  <input type="time" v-model="endTime" class="input input-sm input-bordered w-full bg-slate-50" />
              </div>
          </div>

          <button @click="handleSearch" 
                  :disabled="isLoading"
                  class="btn btn-primary w-full rounded-xl shadow-lg shadow-blue-200 text-white font-bold text-lg mt-2">
              <span v-if="isLoading" class="loading loading-spinner"></span>
              <span v-else>🔍 ค้นหาเส้นทาง</span>
          </button>
      </div>

    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['isLoading']);
const emit = defineEmits(['search']);

const isExpanded = ref(true); // เริ่มต้นแบบกางออก
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const startTime = ref('00:00');
const endTime = ref('23:59');

const handleSearch = () => {
    // 1. ส่งข้อมูลไปให้ Parent Component เพื่อดึง API
    emit('search', { 
        date: selectedDate.value, 
        start: startTime.value, 
        end: endTime.value 
    });

    // ✅ 2. KEY POINT: สั่งหุบ panel ลงทันที เพื่อให้เห็นแผนที่!
    isExpanded.value = false;
};

const formatDate = (dateStr) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}
</script>

<style scoped>
.animate-expand { animation: expand 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes expand { 
    from { opacity: 0; max-height: 0; transform: translateY(10px); } 
    to { opacity: 1; max-height: 400px; transform: translateY(0); } 
}
</style>