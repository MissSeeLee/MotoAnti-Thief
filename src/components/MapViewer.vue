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

const props = defineProps({
  data: { type: Array, default: () => [] }, // รับเป็น Array จาก Dashboard
  geofence: { type: Object, default: () => ({ enabled: false, lat: 0, lng: 0, radius: 200 }) },
  isEditing: { type: Boolean, default: false } 
});

const emit = defineEmits(['update:center']);
const map = ref(null);
const markers = {}; // เก็บ Object ของ Marker โดยใช้ ID เป็น Key
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
  const displayName = name ? (name.length > 10 ? name.substring(0, 10) + '..' : name) : 'Unkown';

  return L.divIcon({
    className: 'custom-marker-container', 
    html: `
      <div class="marker-wrapper">
        <div class="marker-pin" style="background-color: ${color};"></div>
        <div class="marker-pulse" style="background-color: ${color};"></div>
        <div class="marker-label">${displayName}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40], // จุดชี้อยู่ตรงกลางล่าง
    popupAnchor: [0, -40]
  });
};

const initMap = () => {
  map.value = L.map('mainMap', { zoomControl: false }).setView([13.7563, 100.5018], 10);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
  }).addTo(map.value);

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

const updateGeofenceDraw = () => {
  if (!map.value) return;
  const gf = props.geofence;

  // ถ้าไม่มี Geofence หรือปิดอยู่ ให้ลบวงกลมออก
  if (!gf || !gf.enabled || !gf.lat || !gf.lng) {
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

const updateMarkersDraw = () => {
    if (!map.value || !props.data) return;
    
    const vehicles = props.data; // Array ของรถ
    const currentIds = new Set();

    vehicles.forEach(vehicle => {
        if (!vehicle.lat || !vehicle.lng) return;
        
        const id = vehicle.id || vehicle.deviceId; // รองรับทั้ง id และ deviceId
        if (!id) return;

        currentIds.add(id);
        const name = vehicle.name || id;

        if (markers[id]) {
            // มีหมุดอยู่แล้ว -> ขยับตำแหน่ง
            markers[id].setLatLng([vehicle.lat, vehicle.lng]);
            markers[id].setIcon(createCustomIcon(id, name)); // อัปเดตชื่อ/สีเผื่อเปลี่ยน
            
            // อัปเดต Popup (ถ้าเปิดอยู่)
            if (markers[id].getPopup() && markers[id].getPopup().isOpen()) {
                markers[id].setPopupContent(buildPopupContent(vehicle));
            } else {
                markers[id].bindPopup(buildPopupContent(vehicle));
            }

        } else {
            // ยังไม่มีหมุด -> สร้างใหม่
            markers[id] = L.marker([vehicle.lat, vehicle.lng], { 
                icon: createCustomIcon(id, name) 
            }).addTo(map.value);
            
            markers[id].bindPopup(buildPopupContent(vehicle));
        }
    });

    // ลบหมุดที่ไม่มีในข้อมูลชุดใหม่ (เช่น รถถูกลบออก)
    Object.keys(markers).forEach(id => {
        if (!currentIds.has(id)) {
            map.value.removeLayer(markers[id]);
            delete markers[id];
        }
    });
};

const buildPopupContent = (v) => {
    return `
      <div class="text-sm">
        <div class="font-bold text-slate-700">${v.name || v.id}</div>
        <div class="text-xs text-slate-500 mt-1">
           Speed: <span class="font-mono font-bold">${v.speed?.toFixed(1) || 0}</span> km/h<br>
           Battery: ${v.battery || 0}%
        </div>
      </div>
    `;
};

// --- Exposed Functions (ให้ Parent เรียกใช้) ---

const focusCar = (deviceId) => { 
    const marker = markers[deviceId];
    if(marker && map.value) {
        map.value.flyTo(marker.getLatLng(), 16, { duration: 1.5 });
        marker.openPopup();
    }
};

const focusLatLn = (lat, lng, zoom = 16) => {
  if (!map.value) return;
  map.value.setView([lat, lng], zoom);
};

// Lifecycle Hooks
onMounted(() => {
    // รอ DOM พร้อมก่อน init map
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

// Watchers
watch(() => props.data, updateMarkersDraw, { deep: true });
watch(() => props.geofence, updateGeofenceDraw, { deep: true });

defineExpose({ focusCar, focusLatLn });
</script>

<style>
/* Custom Marker CSS */
.custom-marker-container { pointer-events: none; } 

.marker-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-end; /* ให้หมุดอยู่ด้านล่าง */
}

.marker-pin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  z-index: 20;
  position: absolute;
  bottom: 2px;
}

.marker-pulse {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  opacity: 0.4;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  animation: pulse-ring 2s infinite;
  z-index: 10;
}

.marker-label {
  position: absolute;
  bottom: 25px; /* อยู่เหนือหมุด */
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  color: #333;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  white-space: nowrap;
  pointer-events: auto; /* ให้คลิกได้ถ้าต้องการ */
  z-index: 30;
}

@keyframes pulse-ring {
  0% { transform: translateX(-50%) scale(0.5); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(1.5); opacity: 0; }
}

/* Leaflet Popup Clean Style */
.leaflet-popup-content-wrapper {
    border-radius: 8px;
    padding: 0;
    overflow: hidden;
}
.leaflet-popup-content {
    margin: 10px 14px;
}
</style>