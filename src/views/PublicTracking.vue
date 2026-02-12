<template>
  <div class="h-screen flex flex-col bg-slate-100">
    <div class="bg-red-600 text-white p-3 shadow-lg z-20">
      <div class="container mx-auto flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-2xl animate-pulse">🚨</span>
          <div>
            <h1 class="font-bold text-lg leading-tight">LIVE TRACKING</h1>
            <p class="text-xs opacity-90">Police / Emergency Mode</p>
          </div>
        </div>
        <div class="text-right">
           <span class="badge badge-sm bg-red-800 border-none text-white font-mono">
             REFRESH: 5s
           </span>
        </div>
      </div>
    </div>

    <div class="flex-1 relative z-10">
      
      <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-50">
        <span class="loading loading-spinner loading-lg text-red-600 mb-4"></span>
        <p class="text-slate-500 animate-pulse">กำลังค้นหาสัญญาณดาวเทียม...</p>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center bg-slate-100 z-50">
        <div class="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm mx-4">
          <div class="text-5xl mb-4">🚫</div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">ไม่พบสัญญาณติดตาม</h2>
          <p class="text-slate-500 text-sm">{{ error }}</p>
          <div class="mt-4 text-xs text-slate-400 bg-slate-100 p-2 rounded">
            Token อาจหมดอายุ หรือถูกยกเลิกโดยเจ้าของรถ
          </div>
        </div>
      </div>

      <div v-else class="relative w-full h-full">
        <div id="map" class="absolute inset-0 z-0"></div>

        <div class="absolute bottom-6 left-0 right-0 px-4 z-10 flex flex-col items-center gap-3">
          
          <div class="bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl w-full max-w-md border-l-4 border-red-500">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h2 class="text-xl font-bold text-slate-800">{{ vehicle.name }}</h2>
                <p class="text-xs text-slate-400">Update: {{ formatDate(vehicle.updatedAt) }}</p>
              </div>
              <span class="badge badge-error text-white font-bold">{{ vehicle.status || 'UNKNOWN' }}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <p class="text-xs text-slate-400">SPEED</p>
                <p class="font-mono text-xl font-bold text-slate-700">{{ vehicle.speed || 0 }} <span class="text-sm font-normal">km/h</span></p>
              </div>
              <div>
                <p class="text-xs text-slate-400">BATTERY</p>
                <div class="flex items-center gap-1">
                  <span class="font-mono text-xl font-bold" 
                        :class="vehicle.battery < 20 ? 'text-red-500' : 'text-green-600'">
                    {{ vehicle.battery || 0 }}%
                  </span>
                  <div class="w-6 h-3 border border-slate-300 rounded-sm relative">
                    <div class="h-full bg-current opacity-50" :style="`width: ${vehicle.battery}%`"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <a :href="`https://www.google.com/maps/dir/?api=1&destination=${vehicle.lat},${vehicle.lng}`" 
             target="_blank"
             class="btn btn-error btn-lg w-full max-w-md shadow-lg text-white font-bold text-lg rounded-xl">
             📍 นำทางด้วย Google Maps
          </a>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios'; // ใช้ Axios ตรงๆ หรือ api instance ของคุณก็ได้
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = 'http://localhost:3000/api'; // ⚠️ แก้เป็น Backend URL ของคุณ
const route = useRoute();
const token = route.params.token;

const loading = ref(true);
const error = ref(null);
const vehicle = ref({});
const map = ref(null);
const marker = ref(null);
let pollingTimer = null;

// ฟังก์ชันดึงข้อมูล
const fetchLocation = async () => {
  try {
    // ✅ แก้ path ให้ตรงกับ Backend: /devices/public-info/:token
    const res = await axios.get(`${API_URL}/devices/public-info/${token}`);
    
    vehicle.value = res.data;
    const { lat, lng } = res.data;

    if (!map.value) {
      initMap(lat, lng); // ถ้ายังไม่มีแมพ ให้สร้าง
      loading.value = false;
    } else {
      updateMap(lat, lng); // ถ้ามีแล้ว ให้อัปเดต
    }
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || 'เชื่อมต่อล้มเหลว';
    loading.value = false;
    if (pollingTimer) clearInterval(pollingTimer);
  }
};

// สร้างแผนที่ครั้งแรก
const initMap = (lat, lng) => {
  // ใช้ setTimeout เล็กน้อยเพื่อให้ DOM render div#map เสร็จก่อน
  setTimeout(() => {
    map.value = L.map('map', { zoomControl: false }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map.value);

    // Marker วงกลมสีแดง
    const redIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color:#ef4444; width:24px; height:24px; border:3px solid white; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    marker.value = L.marker([lat, lng], { icon: redIcon }).addTo(map.value);
  }, 100);
};

// อัปเดตตำแหน่ง
const updateMap = (lat, lng) => {
  if (marker.value) {
    marker.value.setLatLng([lat, lng]);
    map.value.setView([lat, lng], map.value.getZoom()); // Pan กล้องตาม
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('th-TH');
};

onMounted(() => {
  fetchLocation();
  pollingTimer = setInterval(fetchLocation, 5000);
});

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);
  if (map.value) map.value.remove();
});
</script>

<style>
/* CSS สำหรับ Marker Animation */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>