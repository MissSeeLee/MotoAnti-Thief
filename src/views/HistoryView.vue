<template>
  <div class="flex flex-col md:flex-row h-dvh bg-slate-100 overflow-hidden font-sans relative">
    
    <div class="bg-white shadow-xl z-30 flex flex-col border-r border-slate-200 transition-transform duration-300 ease-out
                md:relative md:w-80 md:h-full md:translate-y-0
                fixed bottom-0 left-0 right-0 rounded-t-3xl md:rounded-none h-[85vh] md:h-auto"
         :class="isPanelOpen ? 'translate-y-0' : 'translate-y-[85%] md:translate-y-0'">
      
      <div @click="isPanelOpen = !isPanelOpen" class="md:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer bg-white rounded-t-3xl border-b border-slate-100">
          <div class="w-12 h-1.5 bg-slate-300 rounded-full"></div>
      </div>

      <div class="p-5 overflow-y-auto h-full relative">
        
        <div class="mb-6 flex justify-between items-start">
          <div>
            <h2 class="text-xl font-black text-slate-800 mb-1 flex items-center gap-2">
              <span class="text-2xl">⏪</span> ประวัติการเดินทาง
            </h2>
            <p class="text-xs text-slate-400">เลือกวันเวลาเพื่อดูเส้นทางย้อนหลัง</p>
          </div>
          <button @click="goBack" class="btn btn-circle btn-sm btn-ghost text-slate-400 hidden md:flex">✕</button>
        </div>

        <div class="space-y-4">
          <div class="form-control w-full">
            <label class="label pb-1"><span class="label-text font-bold text-slate-600">วันที่ (Date)</span></label>
            <input type="date" v-model="selectedDate" class="input input-bordered w-full bg-slate-50 focus:bg-white transition-colors rounded-xl" />
          </div>

          <div class="form-control w-full">
             <label class="label pb-1"><span class="label-text font-bold text-slate-600">ช่วงเวลา</span></label>
             <select v-model="selectedRange" class="select select-bordered w-full bg-slate-50 focus:bg-white transition-colors rounded-xl">
               <option value="full">🕒 ทั้งวัน (00:00 - 23:59)</option>
               <option value="morning">☀️ เช้า (06:00 - 12:00)</option>
               <option value="afternoon">🌤️ บ่าย (12:00 - 18:00)</option>
               <option value="evening">🌙 เย็น/ค่ำ (18:00 - 23:59)</option>
             </select>
          </div>

          <button 
            @click="loadHistory" 
            class="btn btn-primary w-full rounded-xl text-lg font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-2" 
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner"></span>
            <span v-else class="text-xl">🔍</span>
            <span>{{ loading ? 'กำลังโหลด...' : 'ค้นหาประวัติ' }}</span>
          </button>
        </div>

        <div v-if="historyData.length > 0" class="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 class="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
              📊 สรุปการเดินทาง
          </h3>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-bold text-slate-600">🚩 ระยะทาง</span>
            <div><span class="font-black text-slate-800 text-lg">{{ tripStats.distance }}</span> <span class="text-xs text-slate-500">km</span></div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-bold text-slate-600">⏱️ เวลาขับขี่</span>
            <span class="font-black text-slate-800 text-base">{{ tripStats.duration }}</span>
          </div>
        </div>

        <button @click="goBack" class="btn btn-outline btn-sm w-full mt-8 border-slate-300 text-slate-500 md:hidden rounded-xl">
           ← กลับ Dashboard
        </button>
      </div>
    </div>

    <div class="flex-1 relative w-full h-full">
      <button @click="goBack" class="absolute top-4 left-4 z-20 btn btn-circle btn-sm bg-white shadow-md text-slate-700 md:hidden">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
      </button>

      <div id="historyMap" class="w-full h-full z-0 outline-none"></div>

      <div v-if="historyData.length > 0" 
           class="absolute left-4 right-4 z-[20] transition-all duration-300"
           :class="isPanelOpen ? 'bottom-[85%] md:bottom-8' : 'bottom-24 md:bottom-8'"> 
           <div class="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex flex-col gap-3 max-w-2xl mx-auto">
          
          <input 
            type="range" 
            min="0" 
            :max="historyData.length - 1" 
            v-model.number="currentIndex" 
            @input="updateMarkerPosition"
            class="range range-primary range-xs w-full cursor-pointer" 
          />

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button @click="togglePlay" class="btn btn-circle btn-primary btn-sm shadow-md pl-0.5">
                {{ isPlaying ? '⏸' : '▶' }}
              </button>
              
              <div class="flex flex-col">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
                  <div class="text-sm font-mono font-black text-slate-700">
                    {{ formatTime(historyData[currentIndex]?.createdAt) }}
                  </div>
              </div>
            </div>

            <div class="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg">
               <span class="text-[10px] font-bold text-slate-500">x</span>
               <select v-model="playbackSpeed" class="select select-ghost select-xs text-xs font-bold p-0 h-auto min-h-0 focus:bg-transparent">
                  <option :value="1">1</option>
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
               </select>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
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
const loading = ref(false);
const historyData = ref([]); // ✅ เริ่มต้นเป็น Array ว่างเสมอ
const currentIndex = ref(0);
const isPlaying = ref(false);
const playbackSpeed = ref(10); 
const tripStats = ref({ distance: '0.00', duration: '0 นาที' });

let map = null;
let polyline = null;
let marker = null;
let playInterval = null;

const goBack = () => { router.push('/'); };

onMounted(() => { initMap(); });

const initMap = () => {
  map = L.map('historyMap', { zoomControl: false }).setView([13.7563, 100.5018], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 19 }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
};

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (parseFloat(lat2) - parseFloat(lat1)) * (Math.PI / 180); 
  const dLon = (parseFloat(lon2) - parseFloat(lon1)) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(parseFloat(lat1) * (Math.PI / 180)) * Math.cos(parseFloat(lat2) * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
};

const calculateTripStats = (data) => {
  if (!Array.isArray(data) || data.length < 2) return { distance: '0.00', duration: '0 นาที' };
  
  let totalDist = 0;
  for (let i = 0; i < data.length - 1; i++) { 
      const p1 = data[i]; 
      const p2 = data[i + 1]; 
      totalDist += getDistanceFromLatLonInKm(p1.lat, p1.lng, p2.lat, p2.lng); 
  }
  
  const startTime = new Date(data[0].createdAt); 
  const endTime = new Date(data[data.length - 1].createdAt);
  const diffMs = endTime - startTime; 
  const diffMins = Math.floor(diffMs / 60000);
  
  let durationStr = `${diffMins} นาที`;
  if (diffMins >= 60) { 
      const hrs = Math.floor(diffMins / 60); 
      const mins = diffMins % 60; 
      durationStr = `${hrs} ชม. ${mins} นาที`; 
  }
  
  return { distance: totalDist.toFixed(2), duration: durationStr };
};

const loadHistory = async () => {
  loading.value = true;
  stopPlay();
  
  try {
    let start = new Date(selectedDate.value); let end = new Date(selectedDate.value);
    start.setHours(0,0,0,0); end.setHours(23,59,59,999);
    
    if (selectedRange.value === 'morning') end.setHours(12,0,0,0);
    else if (selectedRange.value === 'afternoon') { start.setHours(12,0,0,0); end.setHours(18,0,0,0); }
    else if (selectedRange.value === 'evening') start.setHours(18,0,0,0);

    // ✅ FIX: ลบ /api ออก เพราะ api.js ใส่ baseURL ให้แล้ว
    const res = await api.get(`/devices/${deviceId}/history`, { params: { start: start.toISOString(), end: end.toISOString() } });
    
    // ✅ FIX: แกะ Data ให้เป็น Array ชัวร์ๆ (เหมือน Dashboard)
    if (Array.isArray(res.data)) {
        historyData.value = res.data;
    } else if (res.data && Array.isArray(res.data.data)) {
        historyData.value = res.data.data;
    } else {
        historyData.value = [];
    }

    tripStats.value = calculateTripStats(historyData.value);

    if (historyData.value.length === 0) {
      alert("ไม่พบข้อมูลการเดินทางในช่วงเวลานี้");
    } else {
      drawRoute();
      if (window.innerWidth < 768) {
          isPanelOpen.value = false;
      }
    }
  } catch (error) { 
      console.error(error); 
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + (error.response?.data?.message || error.message)); 
  } finally { 
      loading.value = false; 
  }
};

const drawRoute = () => {
  if (!map) return;
  // ✅ FIX: เช็คก่อน map ว่ามีข้อมูลจริงไหม
  if (!historyData.value || historyData.value.length === 0) return;

  if (polyline) map.removeLayer(polyline);
  if (marker) map.removeLayer(marker);
  
  const latlngs = historyData.value.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
  
  polyline = L.polyline(latlngs, { color: '#3b82f6', weight: 5, opacity: 0.8, lineJoin: 'round' }).addTo(map);
  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  
  marker = L.marker(latlngs[0], { icon: L.divIcon({ className: 'history-pin', html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(map);
  
  currentIndex.value = 0;
};

const updateMarkerPosition = () => { 
    if (!historyData.value.length || !marker) return; 
    const point = historyData.value[currentIndex.value]; 
    if(point) marker.setLatLng([parseFloat(point.lat), parseFloat(point.lng)]); 
};

const togglePlay = () => { if (isPlaying.value) stopPlay(); else startPlay(); };

const startPlay = () => { 
    if (currentIndex.value >= historyData.value.length - 1) currentIndex.value = 0; 
    isPlaying.value = true; 
    playInterval = setInterval(() => { 
        if (currentIndex.value < historyData.value.length - 1) { 
            currentIndex.value++; 
            updateMarkerPosition(); 
        } else { 
            stopPlay(); 
        } 
    }, 1000 / playbackSpeed.value); 
};

const stopPlay = () => { isPlaying.value = false; clearInterval(playInterval); };

const formatTime = (isoString) => { 
    if (!isoString) return "--:--"; 
    return new Date(isoString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); 
};

onUnmounted(() => { stopPlay(); if (map) map.remove(); });
</script>