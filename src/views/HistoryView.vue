<template>
  <div class="flex flex-col md:flex-row h-dvh bg-slate-100 overflow-hidden font-sans relative">
    
    <div class="bg-white shadow-[0_-5px_25px_rgba(0,0,0,0.1)] z-30 flex flex-col border-r border-slate-200 transition-transform duration-300 ease-out
                /* Desktop Style */
                md:relative md:w-80 md:h-full md:translate-y-0 md:rounded-none md:shadow-xl
                /* Mobile Style (Bottom Sheet) */
                fixed bottom-0 left-0 right-0 rounded-t-[2rem] h-auto max-h-[85vh]"
         :class="isPanelOpen ? 'translate-y-0' : 'translate-y-[100%] md:translate-y-0'">
      
      <div @click="isPanelOpen = !isPanelOpen" class="md:hidden w-full flex justify-center pt-4 pb-2 cursor-pointer bg-white rounded-t-[2rem] hover:bg-slate-50 transition-colors">
          <div class="w-12 h-1.5 bg-slate-200 rounded-full"></div>
      </div>

      <div class="p-6 pt-2 md:pt-6 flex flex-col h-full overflow-visible">
        
        <div class="mb-6 flex justify-between items-center">
          <div>
            <h2 class="text-xl font-black text-slate-800 mb-1 flex items-center gap-2">
              <span class="text-2xl">⏪</span> ประวัติการเดินทาง
            </h2>
            <p class="text-xs text-slate-400 font-medium">เลือกวันเวลาเพื่อดูเส้นทางย้อนหลัง</p>
          </div>
          <button @click="router.push('/')" class="btn btn-circle btn-sm btn-ghost text-slate-400 hidden md:flex hover:bg-slate-100">✕</button>
        </div>

        <div class="space-y-5 flex-1 relative">
          
          <div class="form-control w-full">
            <label class="label pb-1.5"><span class="label-text font-bold text-slate-500 text-[10px] uppercase tracking-wider">วันที่ (Date)</span></label>
            <input type="date" v-model="selectedDate" class="input input-bordered w-full h-12 bg-slate-50 focus:bg-white transition-colors rounded-xl font-bold text-slate-700 shadow-sm border-slate-200" />
          </div>

          <div class="relative z-50">
              <label class="label pb-1.5"><span class="label-text font-bold text-slate-500 text-[10px] uppercase tracking-wider">ช่วงเวลา</span></label>
              
              <button 
                @click="isDropdownOpen = !isDropdownOpen" 
                class="btn btn-ghost w-full justify-between bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-300 rounded-xl font-medium text-slate-700 normal-case h-12 shadow-sm"
              >
                <span class="flex items-center gap-3">
                  <span class="text-lg" v-if="selectedRange === 'full'">🕒</span>
                  <span class="text-lg" v-else-if="selectedRange === 'morning'">☀️</span>
                  <span class="text-lg" v-else-if="selectedRange === 'afternoon'">🌤️</span>
                  <span class="text-lg" v-else-if="selectedRange === 'evening'">🌙</span>
                  {{ getRangeLabel(selectedRange) }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-300 text-slate-400" :class="isDropdownOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              <transition 
                enter-active-class="transition ease-out duration-150"
                enter-from-class="opacity-0 scale-95 translate-y-2"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition ease-in duration-100"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 translate-y-2"
              >
                <div v-if="isDropdownOpen" 
                     class="absolute left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-1 z-[100]
                            bottom-[110%] mb-1  /* Mobile: เด้งขึ้นบน */
                            md:bottom-auto md:top-[110%] md:mt-1 /* Desktop: เด้งลงล่าง */">
                  <div 
                    v-for="option in rangeOptions" 
                    :key="option.value"
                    @click="selectRange(option.value)"
                    class="px-4 py-3.5 hover:bg-blue-50 cursor-pointer flex items-center gap-3 text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-none group"
                    :class="selectedRange === option.value ? 'bg-blue-50/50' : ''"
                  >
                    <span class="text-xl group-hover:scale-110 transition-transform">{{ option.icon }}</span>
                    <span :class="selectedRange === option.value ? 'font-bold text-blue-600' : 'font-medium'">{{ option.label }}</span>
                    <span v-if="selectedRange === option.value" class="ml-auto text-blue-600 font-bold">✓</span>
                  </div>
                </div>
              </transition>
              
              <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="fixed inset-0 z-[-1] cursor-default bg-transparent"></div>
          </div>

          <div class="pt-2">
            <button 
                @click="loadHistory" 
                class="btn btn-primary w-full rounded-xl text-lg font-bold shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 h-14 hover:scale-[1.02] active:scale-95 transition-all text-white border-none bg-gradient-to-r from-blue-600 to-indigo-600" 
                :disabled="loading"
            >
                <span v-if="loading" class="loading loading-spinner text-white"></span>
                <span v-else class="text-xl">🔍</span>
                <span>{{ loading ? 'กำลังโหลด...' : 'ค้นหาประวัติ' }}</span>
            </button>
          </div>

        </div>
        
        <div class="h-6 md:hidden"></div>

      </div>
    </div>

    <div class="flex-1 relative w-full h-full">
      <button @click="router.push('/')" class="absolute top-4 left-4 z-20 btn btn-circle btn-sm bg-white shadow-md text-slate-700 md:hidden border-none hover:bg-slate-50">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
      </button>

      <div id="historyMap" class="w-full h-full z-0 outline-none bg-slate-200"></div>

      <transition name="slide-up">
        <div v-if="historyData.length > 0" 
             class="absolute left-4 right-4 z-[20] transition-all duration-300"
             :class="isPanelOpen ? 'bottom-[20px] md:bottom-8' : 'bottom-6 md:bottom-8'"> 
             
           <div class="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 flex flex-col gap-4 max-w-2xl mx-auto ring-1 ring-black/5">
             
             <input 
               type="range" 
               min="0" 
               :max="historyData.length - 1" 
               v-model.number="currentIndex" 
               @input="handleSliderChange"
               class="range range-primary range-xs w-full cursor-pointer" 
             />

             <div class="flex items-center justify-between">
               
               <div class="flex items-center gap-4">
                 <button @click="togglePlay" class="btn btn-circle btn-primary shadow-lg shadow-blue-300 hover:scale-110 transition-transform border-none bg-blue-600">
                   <span class="text-xl pl-0.5 text-white">{{ isPlaying ? '⏸' : '▶' }}</span>
                 </button>
                 
                 <div class="flex flex-col">
                     <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</span>
                     <div class="text-base font-mono font-black text-slate-800">
                       {{ formatTime(historyData[currentIndex]?.createdAt) }}
                     </div>
                 </div>
               </div>

               <div class="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span class="text-[10px] font-bold text-slate-500 uppercase">Speed</span>
                  <select v-model="playbackSpeed" class="select select-ghost select-xs text-xs font-black p-0 h-auto min-h-0 focus:bg-transparent text-blue-600 w-12 text-right cursor-pointer">
                     <option :value="1">1x</option>
                     <option :value="5">5x</option>
                     <option :value="10">10x</option>
                     <option :value="20">20x</option>
                  </select>
               </div>

             </div>
           </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api'; 

const route = useRoute();
const router = useRouter();
const deviceId = route.params.deviceId;

// State
const isPanelOpen = ref(true);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedRange = ref('full');
const isDropdownOpen = ref(false); 
const loading = ref(false);
const historyData = ref([]); 
const currentIndex = ref(0);
const isPlaying = ref(false);
const playbackSpeed = ref(10); 

// Dropdown Options
const rangeOptions = [
  { value: 'full', label: 'ทั้งวัน (00:00 - 23:59)', icon: '🕒' },
  { value: 'morning', label: 'เช้า (06:00 - 12:00)', icon: '☀️' },
  { value: 'afternoon', label: 'บ่าย (12:00 - 18:00)', icon: '🌤️' },
  { value: 'evening', label: 'เย็น/ค่ำ (18:00 - 23:59)', icon: '🌙' }
];

let map = null;
let polyline = null;
let marker = null;
let playInterval = null;

onMounted(() => { 
    setTimeout(() => initMap(), 100);
});

onUnmounted(() => { 
    stopPlay(); 
    if (map) {
        map.remove();
        map = null;
    }
});

const initMap = () => {
  if (map) return;
  map = L.map('historyMap', { zoomControl: false }).setView([13.7563, 100.5018], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
      attribution: '&copy; CARTO', 
      maxZoom: 19 
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
};

// Dropdown Helpers
const getRangeLabel = (val) => {
  const opt = rangeOptions.find(o => o.value === val);
  return opt ? opt.label : 'เลือกช่วงเวลา';
};

const selectRange = (val) => {
  selectedRange.value = val;
  isDropdownOpen.value = false;
};

const loadHistory = async () => {
  loading.value = true;
  stopPlay();
  
  if(polyline) map.removeLayer(polyline);
  if(marker) map.removeLayer(marker);
  historyData.value = [];
  
  try {
    let start = new Date(selectedDate.value); 
    let end = new Date(selectedDate.value);
    
    if (selectedRange.value === 'morning') {
        start.setHours(6,0,0,0); end.setHours(12,0,0,0);
    } else if (selectedRange.value === 'afternoon') { 
        start.setHours(12,0,0,0); end.setHours(18,0,0,0); 
    } else if (selectedRange.value === 'evening') {
        start.setHours(18,0,0,0); end.setHours(23,59,59,999);
    } else {
        start.setHours(0,0,0,0); end.setHours(23,59,59,999);
    }

    const res = await api.get(`/devices/${deviceId}/history`, { 
        params: { start: start.toISOString(), end: end.toISOString() } 
    });
    
    let rawData = [];
    if (Array.isArray(res.data)) rawData = res.data;
    else if (res.data && Array.isArray(res.data.data)) rawData = res.data.data;
    else if (res.data && Array.isArray(res.data.history)) rawData = res.data.history;

    historyData.value = rawData.filter(p => p.lat && p.lng);

    if (historyData.value.length === 0) {
      alert("ไม่พบข้อมูลการเดินทางในช่วงเวลานี้");
    } else {
      drawRoute();
      if (window.innerWidth < 768) {
          isPanelOpen.value = false; 
      }
    }
  } catch (error) { 
      console.error("History Error:", error); 
      alert("เกิดข้อผิดพลาด: " + (error.response?.data?.message || error.message)); 
  } finally { 
      loading.value = false; 
  }
};

const drawRoute = () => {
  if (!map || historyData.value.length === 0) return;

  const latlngs = historyData.value.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
  
  polyline = L.polyline(latlngs, { 
      color: '#3b82f6', 
      weight: 5, 
      opacity: 0.8, 
      lineJoin: 'round' 
  }).addTo(map);
  
  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  
  const startPoint = latlngs[0];
  marker = L.marker(startPoint, { 
      icon: L.divIcon({ 
          className: 'history-pin', 
          html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-[3px] border-white shadow-lg"></div>`, 
          iconSize: [16, 16], 
          iconAnchor: [8, 8] 
      }) 
  }).addTo(map);
  
  currentIndex.value = 0;
};

const updateMarkerPosition = () => { 
    if (!historyData.value.length || !marker) return; 
    const point = historyData.value[currentIndex.value]; 
    if(point) {
        const newLatLng = [parseFloat(point.lat), parseFloat(point.lng)];
        marker.setLatLng(newLatLng);
    }
};

const handleSliderChange = () => {
    stopPlay(); 
    updateMarkerPosition();
};

const togglePlay = () => { 
    if (isPlaying.value) stopPlay(); 
    else startPlay(); 
};

const startPlay = () => { 
    if (historyData.value.length < 2) return;
    if (currentIndex.value >= historyData.value.length - 1) currentIndex.value = 0;
    
    isPlaying.value = true; 
    if (playInterval) clearInterval(playInterval);

    playInterval = setInterval(() => { 
        if (currentIndex.value < historyData.value.length - 1) { 
            currentIndex.value++; 
            updateMarkerPosition(); 
        } else { 
            stopPlay(); 
        } 
    }, 1000 / playbackSpeed.value); 
};

const stopPlay = () => { 
    isPlaying.value = false; 
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
};

watch(playbackSpeed, () => {
    if (isPlaying.value) startPlay();
});

const formatTime = (isoString) => { 
    if (!isoString) return "--:--"; 
    return new Date(isoString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); 
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100px); opacity: 0; }
</style>