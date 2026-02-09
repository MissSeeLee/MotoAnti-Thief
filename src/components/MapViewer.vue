<template>
  <div class="w-full h-full relative z-0">
    <div id="mainMap" class="w-full h-full outline-none bg-slate-200"></div>
    
    <div v-if="!isMapReady" class="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-[1000] backdrop-blur-sm">
       <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  data: { type: Array, default: () => [] }, // ✅ แก้ไข 1: รับเป็น Array (ให้ตรงกับ Dashboard)
  geofence: { type: Object, default: () => ({ enabled: false, lat: 0, lng: 0, radius: 200 }) },
  isEditing: { type: Boolean, default: false } 
});

const emit = defineEmits(['update:center']);
const map = ref(null);
const markers = {};
let geofenceCircle = null;
const isMapReady = ref(false);

// 🎨 Palette สี
const vehicleColors = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

const getVehicleColor = (id) => {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % vehicleColors.length;
  return vehicleColors[index];
};

const createCustomIcon = (vehicleId, name) => {
  const color = getVehicleColor(vehicleId);
  const displayName = name.length > 10 ? name.substring(0, 10) + '..' : name;

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
    iconAnchor: [10, 10]
  });
};

onMounted(() => initMap());
onUnmounted(() => { if (map.value) map.value.remove(); });

const initMap = () => {
  map.value = L.map('mainMap', { zoomControl: false }).setView([13.7563, 100.5018], 15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
  }).addTo(map.value);

  map.value.on('click', (e) => {
      if (props.isEditing) {
          emit('update:center', { lat: e.latlng.lat, lng: e.latlng.lng });
      }
  });

  isMapReady.value = true;

  updateGeofenceDraw();
  updateMarkersDraw();
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

// ✅✅✅ แก้ไข 2: ปรับ Logic การวาด Marker สำหรับ Array Input
const updateMarkersDraw = () => {
    if (!map.value) return;
    const vehicles = props.data; // รับเป็น Array

    // เก็บรายการ ID ที่มีอยู่จริง เพื่อเอาไว้ลบตัวเก่า
    const currentIds = new Set();

    vehicles.forEach(vehicle => {
        if (!vehicle.lat || !vehicle.lng) return;
        
        // ใช้ ID จริงๆ จาก Object (สำคัญมาก! ไม่งั้น focusCar ไม่ทำงาน)
        const deviceId = vehicle.id; 
        const name = vehicle.name || deviceId;
        
        currentIds.add(deviceId);

        if (!markers[deviceId]) {
            // สร้างหมุดใหม่
            markers[deviceId] = L.marker([vehicle.lat, vehicle.lng], { 
                icon: createCustomIcon(deviceId, name) 
            }).addTo(map.value);
            
            markers[deviceId].bindPopup(`<b>${name}</b><br>Speed: ${vehicle.speed} km/h`);
        } else {
            // ขยับหมุดเดิม
            markers[deviceId].setLatLng([vehicle.lat, vehicle.lng]);
            markers[deviceId].setPopupContent(`<b>${name}</b><br>Speed: ${vehicle.speed} km/h`);
        }
    });

    // ลบ Marker ที่หายไปจากระบบ (เช่น ลบรถออก)
    Object.keys(markers).forEach(id => {
        if (!currentIds.has(id)) {
            map.value.removeLayer(markers[id]);
            delete markers[id];
        }
    });
};

// Watchers
watch(() => props.data, updateMarkersDraw, { deep: true });
watch(() => props.geofence, updateGeofenceDraw, { deep: true });

// ✅ ฟังก์ชันนี้ Dashboard จะเรียกใช้ (ต้องใช้ deviceId เป็น Key ให้ตรงกับ markers)
const focusCar = (deviceId) => { 
    if(markers[deviceId] && map.value) {
        // ใช้ flyTo เพื่อความสมูท
        map.value.flyTo(markers[deviceId].getLatLng(), 17, { duration: 1.5 });
    }
};

const focusLatLn = (lat, lng) => { 
    if(map.value) map.value.setView([lat, lng], 16, { animate: true }); 
}; 

// เปิดช่องให้ Dashboard เรียกใช้
defineExpose({ focusCar, focusLatLn });
</script>

<style>
/* CSS เหมือนเดิม */
.custom-marker-container { pointer-events: none; } 
.custom-marker-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: auto;
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
  bottom: 20px;
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
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
}
</style>