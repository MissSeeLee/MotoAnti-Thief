<template>
  <div class="h-dvh w-screen flex flex-col bg-slate-900 relative overflow-hidden font-sans">
    
    <div v-if="isEmergency" class="absolute inset-0 z-[9999] flex items-center justify-center bg-red-600/90 backdrop-blur-sm animate-pulse">
        <div class="text-center text-white p-6 bg-black/80 rounded-3xl border-4 border-white/20 shadow-2xl max-w-sm w-full mx-4 pointer-events-auto">
            <div class="text-6xl mb-4 animate-bounce">💥</div>
            <h1 class="text-3xl font-black uppercase tracking-widest text-red-500 bg-white inline-block px-2 rounded">EMERGENCY</h1>
            <h2 class="text-2xl font-bold mt-4 text-white">{{ alertMessage }}</h2>
            <p class="text-sm opacity-80 mt-1">ตรวจพบเหตุฉุกเฉิน!</p>
            <button @click="stopAlarm" :disabled="loadingBtn" class="mt-6 w-full bg-white text-red-600 font-bold py-4 rounded-xl text-xl shadow-lg hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2">
                <span v-if="loadingBtn" class="loading loading-spinner"></span>
                <span v-else>🔕 รับทราบ / ปิดเสียง</span>
            </button>
        </div>
    </div>

    <div class="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
       <div class="flex justify-between items-start">
          <router-link to="/login" class="pointer-events-auto bg-white/10 backdrop-blur-md p-2 rounded-full text-white shadow-lg border border-white/20 hover:bg-white/20 transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </router-link>

          <div class="pointer-events-auto bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/50 flex items-center gap-3 shadow-xl">
              <div class="flex items-center gap-1.5">
                 <span :class="`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`"></span>
                 <span class="text-xs font-bold tracking-wide text-white">{{ status }}</span>
              </div>
              <div class="w-px h-3 bg-slate-600"></div>
              <div class="text-xs font-mono text-slate-300">
                 {{ speed }} <span class="text-[10px] text-slate-500">km/h</span>
              </div>
          </div>
       </div>
    </div>

    <div class="flex-1 relative z-0 bg-slate-800">
      <MapViewer 
        v-if="device"
        ref="mapRef"
        :data="vehicleList" 
        :geofence="geofenceData" 
        class="w-full h-full"
      />
      
      <div v-else class="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-900">
        <div class="relative">
            <div class="w-16 h-16 border-4 border-slate-700 border-t-pink-500 rounded-full animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🚗</div>
        </div>
        <p class="mt-6 text-sm font-medium tracking-widest uppercase text-slate-500">Connecting Satellite...</p>
      </div>

      <button v-if="device" @click="reCenterMap" class="absolute top-24 right-4 z-10 w-12 h-12 bg-white text-slate-700 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all border border-slate-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
      </button>
    </div>

    <div v-if="device" 
         class="relative z-30 bg-[#0f172a] border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out"
         :class="isPanelExpanded ? 'pb-8 pt-2 rounded-t-3xl' : 'pb-6 pt-2 rounded-t-3xl'">
       
       <div @click="isPanelExpanded = !isPanelExpanded" class="w-full flex justify-center py-2 cursor-pointer hover:bg-white/5 transition-colors">
          <div class="w-12 h-1.5 rounded-full bg-slate-700"></div>
       </div>

       <div class="px-6">
          <div class="flex items-center justify-between mb-4 cursor-pointer" @click="isPanelExpanded = !isPanelExpanded">
             <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">🛵</div>
                <div>
                   <h2 class="text-xl font-bold text-white leading-tight">{{ device.name }}</h2>
                   <div class="flex items-center gap-3 mt-1 text-xs font-mono">
                      <span :class="status === 'ONLINE' ? 'text-emerald-400' : 'text-slate-400'">● {{ status }}</span>
                      <span class="text-slate-400 flex items-center gap-1">🔋 {{ battery }}%</span>
                   </div>
                </div>
             </div>
             <button class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-300" :class="{'rotate-180': isPanelExpanded}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
             </button>
          </div>

          <div v-if="isPanelExpanded" class="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up">
             <div class="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                 <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">ENGINE</span>
                 <div class="flex items-center gap-2">
                     <div class="w-2 h-2 rounded-full" :class="ign ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'"></div>
                     <span class="text-xl font-black tracking-tight" :class="ign ? 'text-white' : 'text-slate-500'">{{ ign ? 'ON' : 'OFF' }}</span>
                 </div>
             </div>
             <div class="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                 <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">BATTERY</span>
                 <div class="flex items-center gap-2">
                     <span class="text-xl font-black tracking-tight text-white">{{ battery }}<span class="text-sm text-slate-500 font-medium ml-0.5">%</span></span>
                 </div>
             </div>
          </div>

          <div v-if="isPanelExpanded" class="w-full animate-fade-in-up delay-75">
             <button @click="sendCommand('find_bike')" :disabled="loadingBtn"
                class="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all p-4 rounded-xl shadow-lg shadow-indigo-900/40 group relative overflow-hidden">
                <span class="text-lg font-bold text-white tracking-wide">ส่งเสียงเรียก (Find Bike)</span>
             </button>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup>
// 🔥 แก้จุดที่ 2: เพิ่ม 'computed' ใน import
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { io } from "socket.io-client";
import api from '../api';
import MapViewer from '../components/MapViewer.vue';

const route = useRoute();
const token = route.params.token;

const device = ref(null);
const status = ref('CONNECTING...');
const speed = ref(0);
const battery = ref(0);
const ign = ref(false);
const vehicleData = reactive({});
const geofenceData = reactive({ enabled: false, lat: 0, lng: 0, radius: 200 });

// 🔥 แก้จุดที่ 3: แปลง Object เป็น Array เพื่อแก้บั๊ก "forEach is not a function"
const vehicleList = computed(() => Object.values(vehicleData));

const isEmergency = ref(false);
const alertMessage = ref("");
const loadingBtn = ref(false);
const isPanelExpanded = ref(false);
const mapRef = ref(null);

const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
const socket = io(socketUrl, {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
});

const sendCommand = async (val) => {
  loadingBtn.value = true;
  try {
    // ✅ URL ถูกต้อง (ไม่มี /api นำหน้า)
    await api.post(`/devices/share/${token}/command`, { command: val });
    if(navigator.vibrate) navigator.vibrate(200);
  } catch (err) {
    alert("Error: " + (err.response?.data?.message || err.message));
  } finally {
    loadingBtn.value = false;
  }
};

const stopAlarm = async () => {
    loadingBtn.value = true;
    try {
        await api.post(`/devices/share/${token}/command`, { command: 'stop_alarm' });
        isEmergency.value = false;
    } catch (e) {
        alert("คำสั่งล้มเหลว: " + e.message);
    } finally {
        loadingBtn.value = false;
    }
};

const reCenterMap = () => {
    if (mapRef.value && device.value) {
        mapRef.value.focusCar(device.value.deviceId);
    }
};

onMounted(async () => {
  if (!token) return;

  try {
    // ✅ URL ถูกต้อง
    const res = await api.get(`/devices/share/${token}`);
    device.value = res.data;
    
    const initialLat = Number(res.data.lat) || 0;
    const initialLng = Number(res.data.lng) || 0;
    battery.value = Number(res.data.battery) || 0; 
    ign.value = !!res.data.ign;
    
    if (res.data.geofence) Object.assign(geofenceData, res.data.geofence);

    vehicleData[device.value.deviceId] = {
        id: device.value.deviceId,
        name: device.value.name,
        lat: initialLat, 
        lng: initialLng,
        status: res.data.currentStatus || 'WAITING', 
        speed: 0, 
        ign: ign.value
    };

    setTimeout(() => reCenterMap(), 800);

    socket.on("connect", () => { status.value = "ONLINE"; });
    socket.on("new_location", (data) => {
        if (data.deviceId === device.value.deviceId) { 
            status.value = data.status || 'ONLINE';
            speed.value = Number(data.speed) || 0;
            battery.value = Number(data.battery) || battery.value;
            ign.value = !!data.ign;

            vehicleData[device.value.deviceId] = {
                ...vehicleData[device.value.deviceId],
                lat: Number(data.lat), 
                lng: Number(data.lng),
                speed: speed.value, 
                ign: ign.value, 
                status: status.value
            };
        }
    });
    
    socket.on("new_alert", (data) => {
         if (data.deviceId === device.value.deviceId) {
             const msg = data.message || data.event || data.status || "";
             if (msg === 'ACCIDENT_FALLEN' || data.type === 'CRASH') {
                 isEmergency.value = true;
                 alertMessage.value = "รถล้ม / อุบัติเหตุ!";
                 isPanelExpanded.value = true;
             }
         }
    });

  } catch (err) {
    console.error(err);
    status.value = "INVALID LINK";
  }
});

onUnmounted(() => { if(socket) socket.disconnect(); });
</script>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.delay-75 { animation-delay: 75ms; }
</style>