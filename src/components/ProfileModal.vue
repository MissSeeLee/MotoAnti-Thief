<template>
  <div class="w-full h-full relative z-0">
    <div id="mainMap" class="w-full h-full outline-none bg-slate-200"></div>
    
    <div v-if="!isMapReady" class="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-[1000] backdrop-blur-sm">
       <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// รับ Props
const props = defineProps({
  data: { type: Array, default: () => [] }, // รับเป็น Array ของรถหลายคัน
  geofence: { type: Object, default: () => ({ enabled: false, lat: 0, lng: 0, radius: 200 }) },
  isEditing: { type: Boolean, default: false } // โหมดแก้ไข Geofence
});

const emit = defineEmits(['update:center']);
const map = ref(null);
const markers = {}; // เก็บ Object Marker { deviceId: L.Marker }
let geofenceCircle = null;
const isMapReady = ref(false);

// 🎨 Palette สีสำหรับแต้มสีรถแต่ละคันไม่ให้ซ้ำกัน
const vehicleColors = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

// ฟังก์ชันสุ่มสีจาก ID (ID เดิมจะได้สีเดิมเสมอ)
const getVehicleColor = (id) => {
  let hash = 0;
  for (let i = 0; i < (id || "").toString().length; i++) {
    hash = (id || "").toString().charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % vehicleColors.length;
  return vehicleColors[index];
};

// สร้าง Icon HTML (CSS Marker)
const createCustomIcon = (vehicleId, name) => {
  const color = getVehicleColor(vehicleId);
  const displayName = (name || 'Unknown').length > 10 ? (name || 'Unknown').substring(0, 10) + '..' : (name || 'Unknown');

  return L.divIcon({
    className: 'custom-marker-container', 
    html: `
      <div class="custom-marker-pin" style="--marker-color: ${color}">
        <div class="marker-label">${displayName}</div>
        <div class="marker-pulse"></div>
        <div class="marker-dot"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

onMounted(() => {
    // ใช้ nextTick เพื่อให้มั่นใจว่า Div #mainMap ถูกสร้างแล้วจริงๆ
    nextTick(() => {
        initMap();
    });
});

onUnmounted(() => { 
    if (map.value) {
        map.value.remove();
        map.value = null;
    }
});

const initMap = () => {
  // เริ่มต้นแผนที่
  map.value = L.map('mainMap', { zoomControl: false }).setView([13.7563, 100.5018], 15);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
  }).addTo(map.value);

  // Event คลิกแผนที่ (สำหรับแก้ Geofence)
  map.value.on('click', (e) => {
      if (props.isEditing) {
          emit('update:center', { lat: e.latlng.lat, lng: e.latlng.lng });
      }
  });

  isMapReady.value = true;

  // วาดครั้งแรก
  updateGeofenceDraw();
  updateMarkersDraw();
};

// ---------------------------------------------
// 🛠️ ส่วนจัดการ Marker (หัวใจหลัก)
// ---------------------------------------------
const updateMarkersDraw = () => {
    if (!map.value) return; // ป้องกัน Error map is null

    const vehicles = props.data || []; 
    const currentIds = new Set();

    vehicles.forEach(vehicle => {
        // รองรับทั้ง deviceId และ id
        const deviceId = vehicle.deviceId || vehicle.id;
        
        // ถ้าไม่มีพิกัด หรือไม่มี ID ให้ข้ามไป
        if (!vehicle.lat || !vehicle.lng || !deviceId) return;

        // จำไว้ว่า ID นี้ยังมีตัวตนอยู่
        currentIds.add(deviceId);

        const name = vehicle.name || deviceId;
        const lat = parseFloat(vehicle.lat);
        const lng = parseFloat(vehicle.lng);

        if (!markers[deviceId]) {
            // ✅ Case 1: ยังไม่มี Marker -> สร้างใหม่
            markers[deviceId] = L.marker([lat, lng], { 
                icon: createCustomIcon(deviceId, name) 
            }).addTo(map.value);
            
            markers[deviceId].bindPopup(`
                <div class="text-center">
                    <b class="text-primary">${name}</b><br>
                    <span class="text-xs text-gray-500">Speed: ${vehicle.speed || 0} km/h</span><br>
                    <span class="text-xs text-gray-400">Batt: ${vehicle.battery || 0}%</span>
                </div>
            `);
        } else {
            // ✅ Case 2: มีแล้ว -> ขยับตำแหน่ง (Animation จะทำงานเองถ้าใช้ CSS transition หรือ Leaflet Move)
            const oldLatLng = markers[deviceId].getLatLng();
            
            // อัปเดตตำแหน่ง
            markers[deviceId].setLatLng([lat, lng]);
            
            // อัปเดต Popup (เฉพาะถ้ามีการเปลี่ยนข้อมูล)
            if (!markers[deviceId].isPopupOpen()) {
                 markers[deviceId].setPopupContent(`
                    <div class="text-center">
                        <b class="text-primary">${name}</b><br>
                        <span class="text-xs text-gray-500">Speed: ${vehicle.speed || 0} km/h</span><br>
                        <span class="text-xs text-gray-400">Batt: ${vehicle.battery || 0}%</span>
                    </div>
                `);
            }
        }
    });

    // ✅ Case 3: ลบ Marker ที่หายไปจากระบบ (เช่น รถถูกลบ หรือ Filter ออก)
    Object.keys(markers).forEach(id => {
        if (!currentIds.has(id)) {
            map.value.removeLayer(markers[id]);
            delete markers[id];
        }
    });
};

const updateGeofenceDraw = () => {
  if (!map.value) return;
  const gf = props.geofence;

  if (!gf.enabled || gf.lat === 0) {
    if (geofenceCircle) { 
        map.value.removeLayer(geofenceCircle); 
        geofenceCircle = null; 
    }
    return;
  }
  
  const color = props.isEditing ? '#f59e0b' : '#9333ea'; 
  
  if (geofenceCircle) {
    geofenceCircle.setLatLng([gf.lat, gf.lng]); 
    geofenceCircle.setRadius(gf.radius);
    geofenceCircle.setStyle({ color: color, fillColor: color });
  } else {
    geofenceCircle = L.circle([gf.lat, gf.lng], {
      color: color, fillColor: color, fillOpacity: 0.15, radius: gf.radius, weight: 2, dashArray: '5, 5'
    }).addTo(map.value);
  }
};

// Watchers: คอยดูการเปลี่ยนแปลงของ Props
watch(() => props.data, updateMarkersDraw, { deep: true });
watch(() => props.geofence, updateGeofenceDraw, { deep: true });

// ---------------------------------------------
// 🎮 Exposed Functions (ให้ Dashboard เรียกใช้)
// ---------------------------------------------

// ฟังก์ชันโฟกัสไปที่รถคันใดคันหนึ่ง
const focusCar = (deviceId) => { 
    if (!map.value) return;
    
    const marker = markers[deviceId];
    if (marker) {
        // ใช้ flyTo เพื่อความสมูท
        map.value.flyTo(marker.getLatLng(), 17, { duration: 1.5 });
        // เปิด Popup โชว์ชื่อรถด้วย
        marker.openPopup();
    } else {
        console.warn(`Marker for device ${deviceId} not found on map.`);
    }
};

// ฟังก์ชันโฟกัสไปที่พิกัด (เช่น ตอนกด Geofence)
const focusLatLn = (lat, lng) => { 
    if(map.value) map.value.setView([lat, lng], 16, { animate: true }); 
}; 

defineExpose({ focusCar, focusLatLn });
</script>

<style>
/* CSS Styling */
.custom-marker-container { pointer-events: none; } 
.custom-marker-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  transition: transform 0.3s ease; /* เพิ่มความสมูท */
}

.marker-dot {
  width: 14px;
  height: 14px;
  background-color: var(--marker-color); 
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
  z-index: 20;
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background-color: var(--marker-color);
  opacity: 0.5;
  border-radius: 50%;
  z-index: 10;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.marker-label {
  position: absolute;
  bottom: 22px; /* ขยับขึ้นนิดนึง */
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.95);
  color: #334155;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid rgba(0,0,0,0.05);
  z-index: 30;
  pointer-events: none;
}

.marker-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -3px;
  border-width: 3px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
}

@keyframes pulse-ring {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}
</style>