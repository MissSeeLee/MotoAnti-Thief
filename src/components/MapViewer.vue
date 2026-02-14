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
  data: { type: Array, default: () => [] },
  geofence: { type: Object, default: () => ({ enabled: false, lat: 0, lng: 0, radius: 200 }) },
  isEditing: { type: Boolean, default: false } 
});

const emit = defineEmits(['update:center']);
const map = ref(null);
const markers = {}; 
let geofenceCircle = null;
const isMapReady = ref(false);

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

// 🎨 1. ฟังก์ชันสร้างไอคอน (แสดงสีตามสถานะ: Online/Parked/Offline)
const createCustomIcon = (vehicle) => {
  const id = vehicle.id || vehicle.deviceId;
  const name = vehicle.name || id;
  const status = vehicle.status; 

  let color = '#94a3b8'; // Default: Offline (สีเทา)
  if (status === 'ONLINE') color = getVehicleColor(id);
  if (status === 'PARKED') color = '#f59e0b'; // Parked (สีส้ม)
  
  const displayName = name ? (name.length > 10 ? name.substring(0, 10) + '..' : name) : 'Unknown';
  const wrapperClass = status === 'OFFLINE' ? 'marker-offline' : '';

  return L.divIcon({
    className: 'custom-marker-container', 
    html: `
      <div class="marker-wrapper ${wrapperClass}">
        <div class="marker-pin" style="background-color: ${color};"></div>
        <div class="marker-label">${displayName}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -45]
  });
};

// 📝 2. ปรับปรุง Popup: แสดง Status เด่นๆ และไม่มีความเร็วแล้ว
const buildPopupContent = (v) => {
    let statusColor = 'text-slate-400';
    let statusBg = 'bg-slate-400';
    let statusText = v.status || 'OFFLINE';

    if (v.status === 'ONLINE') {
        statusColor = 'text-emerald-600';
        statusBg = 'bg-emerald-500';
    } else if (v.status === 'PARKED') {
        statusColor = 'text-amber-600';
        statusBg = 'bg-amber-500';
    }

    return `
      <div class="text-sm min-w-[140px] p-1">
        <div class="font-black text-slate-800 text-base mb-2 border-b pb-1">${v.name || v.id}</div>
        
        <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">สถานะ</span>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${statusBg} ${v.status === 'ONLINE' ? 'animate-pulse' : ''}"></span>
                <span class="text-xs font-black ${statusColor}">${statusText}</span>
            </div>
        </div>

        <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
           <div class="flex justify-between items-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase">แบตเตอรี่</span>
              <span class="font-mono font-black text-slate-700">${v.battery || 0}%</span>
           </div>
        </div>
      </div>
    `;
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
  updateGeofenceDraw();
  updateMarkersDraw();
};

const updateGeofenceDraw = () => {
  if (!map.value) return;
  const gf = props.geofence;
  if (!gf || !gf.enabled || !gf.lat || !gf.lng) {
    if (geofenceCircle) { map.value.removeLayer(geofenceCircle); geofenceCircle = null; }
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

// 🎯 3. แก้ไขการวาดหมุด: แยกโหมดปกติ กับโหมดแก้ไข Geofence
const updateMarkersDraw = () => {
    if (!map.value || !props.data) return;
    const vehicles = props.data;
    const currentIds = new Set();

    vehicles.forEach(vehicle => {
        if (!vehicle.lat || !vehicle.lng) return;
        const id = vehicle.id || vehicle.deviceId;
        if (!id) return;
        currentIds.add(id);

        if (!markers[id]) {
            markers[id] = L.marker([vehicle.lat, vehicle.lng], { 
                icon: createCustomIcon(vehicle) 
            }).addTo(map.value);
        } else {
            markers[id].setLatLng([vehicle.lat, vehicle.lng]);
            markers[id].setIcon(createCustomIcon(vehicle));
        }

        // จัดการ Event การคลิก
        markers[id].off('click'); 
        markers[id].on('click', (e) => {
            if (props.isEditing) {
                // 🔥 ถ้าแก้ Geofence อยู่ ให้คลิกที่รถเพื่อวางจุดศูนย์กลางทันที!
                emit('update:center', { lat: vehicle.lat, lng: vehicle.lng });
                markers[id].closePopup();
                L.DomEvent.stopPropagation(e); // ไม่ให้แผนที่ด้านล่างรับ click ซ้ำ
            } else {
                // โหมดปกติ ให้เปิด Popup ดู Status
                markers[id].openPopup();
            }
        });

        markers[id].bindPopup(buildPopupContent(vehicle));
    });

    Object.keys(markers).forEach(id => {
        if (!currentIds.has(id)) {
            map.value.removeLayer(markers[id]);
            delete markers[id];
        }
    });
};

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

onMounted(() => { nextTick(() => { initMap(); }); });
onUnmounted(() => { if (map.value) { map.value.remove(); map.value = null; } });
watch(() => props.data, updateMarkersDraw, { deep: true });
watch(() => props.geofence, updateGeofenceDraw, { deep: true });
defineExpose({ focusCar, focusLatLn });
</script>

<style>
.custom-marker-container { pointer-events: none; } 
.marker-wrapper {
  position: relative;
  width: 40px; height: 40px;
  display: flex; justify-content: center; align-items: flex-end;
  transition: all 0.3s ease;
}
.marker-offline { filter: grayscale(100%); opacity: 0.7; }
.marker-pin {
  width: 14px; height: 14px;
  border-radius: 50%; border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  z-index: 20; position: absolute; bottom: 2px;
  transition: background-color 0.3s ease;
}
.marker-label {
  position: absolute; bottom: 25px;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px; border-radius: 4px;
  font-size: 10px; font-weight: bold; color: #333;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  white-space: nowrap; pointer-events: auto; z-index: 30;
}
.leaflet-popup-content-wrapper { border-radius: 12px; padding: 0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
.leaflet-popup-content { margin: 12px 16px; line-height: 1.5; }
.leaflet-popup-tip { background: white; }
</style>