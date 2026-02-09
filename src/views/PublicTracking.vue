<template>
  <div class="min-h-screen bg-slate-100 flex flex-col">
    <div class="bg-red-600 text-white p-4 shadow-lg z-10">
      <div class="container mx-auto flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-2xl animate-pulse">🚨</span>
          <div>
            <h1 class="font-bold text-lg leading-tight">LIVE TRACKING</h1>
            <p class="text-xs opacity-80">Police / Emergency Mode</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs font-mono bg-red-700 px-2 py-1 rounded">
            Auto-Refresh: 5s
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 relative z-0">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-100 z-50">
        <span class="loading loading-spinner loading-lg text-red-600"></span>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center bg-slate-100 z-50">
        <div class="text-center p-6 max-w-sm">
          <div class="text-5xl mb-4">🚫</div>
          <h2 class="text-xl font-bold text-slate-700">ลิงก์ใช้งานไม่ได้</h2>
          <p class="text-slate-500 mt-2">{{ error }}</p>
        </div>
      </div>

      <div v-else class="h-full flex flex-col items-center justify-center p-4 space-y-4">
        
        <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border-l-4 border-red-500">
          <h2 class="text-xl font-bold text-slate-800 mb-4 flex justify-between">
            {{ vehicle.name }}
            <span class="badge badge-error text-white">{{ vehicle.status }}</span>
          </h2>
          
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-slate-400">ความเร็ว</p>
              <p class="font-mono text-lg font-bold">{{ vehicle.speed }} km/h</p>
            </div>
            <div>
              <p class="text-slate-400">แบตเตอรี่</p>
              <p class="font-mono text-lg font-bold text-green-600">{{ vehicle.battery }}%</p>
            </div>
            <div class="col-span-2">
              <p class="text-slate-400">อัปเดตล่าสุด</p>
              <p class="font-mono">{{ new Date(vehicle.updatedAt).toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <a :href="`https://www.google.com/maps/search/?api=1&query=${vehicle.lat},${vehicle.lng}`" 
           target="_blank"
           class="btn btn-error btn-lg w-full max-w-md shadow-lg text-white text-xl">
           📍 เปิดนำทาง (Google Maps)
        </a>
        
        <p class="text-slate-400 text-xs mt-4">พิกัด: {{ vehicle.lat }}, {{ vehicle.lng }}</p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api'; // Axios instance ของคุณ

const route = useRoute();
const token = route.params.token;

const loading = ref(true);
const error = ref(null);
const vehicle = ref({});
let polling = null;

const fetchData = async () => {
  try {
    // ยิงไป API ที่เราเพิ่งสร้าง
    const res = await api.get(`/devices/public/track/${token}`);
    vehicle.value = res.data;
    loading.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || 'เชื่อมต่อล้มเหลว';
    loading.value = false;
    clearInterval(polling); // ถ้า Error ให้หยุดดึงข้อมูล
  }
};

onMounted(() => {
  fetchData();
  // ดึงข้อมูลใหม่ทุกๆ 5 วินาที
  polling = setInterval(fetchData, 5000);
});

onUnmounted(() => {
  clearInterval(polling);
});
</script>