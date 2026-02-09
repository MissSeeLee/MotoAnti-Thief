<template>
  <div class="flex h-dvh w-screen overflow-hidden bg-slate-100 font-sans relative">
    
    <SideBar
      class="hidden md:flex flex-none w-72 z-30 shadow-xl border-r border-slate-200"
      :activeDeviceId="currentDeviceId"
      :devices="devicesArray"
      :isOwner="isOwner"
      @select-device="handleSelectDevice"
      @logout="handleLogout"
      @add-device="showAddDeviceModal = true"
      @delete-device="handleDirectDelete"
      @edit-device="openSettingsModal"
      @share-device="handleOpenShare"
      @open-geofence="openGeofencePanel"
      @view-history="goToHistory"
      @find-bike="findMyBike"
      @toast="triggerToast" 
    />

    <div
      v-if="isMobileMenuOpen"
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
    ></div>

    <transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <SideBar
        v-if="isMobileMenuOpen"
        class="fixed inset-y-0 left-0 z-[70] w-[80vw] max-w-xs shadow-2xl md:hidden"
        :activeDeviceId="currentDeviceId"
        :devices="devicesArray"
        :isOwner="isOwner"
        @select-device="(id) => { handleSelectDevice(id); isMobileMenuOpen = false; }"
        @logout="handleLogout"
        @add-device="showAddDeviceModal = true"
        @delete-device="handleDirectDelete"
        @edit-device="openSettingsModal"
        @share-device="handleOpenShare"
        @open-geofence="openGeofencePanel"
        @view-history="goToHistory"
        @find-bike="findMyBike"
        @toast="triggerToast"
      />
    </transition>

    <button
      @click="isMobileMenuOpen = true"
      class="md:hidden absolute top-4 left-4 z-40 btn btn-circle btn-sm bg-white shadow-md border-slate-100 text-slate-700"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    </button>

    <div class="flex-1 relative w-full h-full overflow-hidden bg-slate-200">
      
      <MapViewer
        ref="mapViewerRef"
        :data="devicesArray"
        :geofence="displayGeofence"
        :isEditing="showGeofencePanel && isOwner"
        @update:center="handleMapCenterUpdate"
        class="absolute inset-0 w-full h-full z-0"
      />

      <StatusCard :vehicle="currentVehicle" />

      <GeofencePanel
        :isOpen="showGeofencePanel"
        :geofenceData="draftGeofence"
        :loading="isSending"
        :readOnly="!isOwner"
        @update:data="(val) => Object.assign(draftGeofence, val)"
        @save="saveGeofence"
        @close="showGeofencePanel = false"
      />

      <SecurityAlert
        v-if="isAlerting"
        :title="alertTitle"
        :message="alertMessage"
        :icon="alertIcon"
        :deviceId="currentDeviceId"
        @close="muteAlert"
        @mute-vehicle="handleRemoteStopAlarm"
        @trigger-toast="triggerToast"
      />

      <AddDeviceModal
        v-if="showAddDeviceModal && isOwner"
        :isOpen="showAddDeviceModal"
        @close="showAddDeviceModal = false"
        @added="handleDeviceAdded"
      />

      <EditDeviceModal
        v-if="showSettingsModal && isOwner"
        :isOpen="showSettingsModal"
        :device="editingDevice"
        @close="showSettingsModal = false"
        @updated="handleDeviceUpdated"
        @deleted="handleDeviceDeleted"
        @toast="triggerToast"
      />

      <ShareDeviceModal
        v-if="showShareModal"
        :isOpen="showShareModal"
        :device="sharingDevice"
        @close="showShareModal = false"
        @toast="triggerToast"
      />

      <Transition name="toast">
        <div v-if="showToast" class="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md min-w-[300px] border transition-all duration-300" :class="toastData.colorClass">
            <div class="text-2xl">{{ toastData.icon }}</div>
            <div class="flex-1">
                <h3 class="font-bold text-sm tracking-wide">{{ toastData.title }}</h3>
                <p class="text-xs opacity-90">{{ toastData.message }}</p>
            </div>
            <button @click="showToast = false" class="opacity-60 hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { io } from "socket.io-client";
import api from "../api";

// Components
import SideBar from "../components/Side.vue";
import MapViewer from "../components/MapViewer.vue";
import SecurityAlert from "../components/SecurityAlert.vue";
import AddDeviceModal from "../components/AddDeviceModal.vue";
import EditDeviceModal from "../components/EditDeviceModal.vue";
import ShareDeviceModal from "../components/ShareDeviceModal.vue";
import GeofencePanel from "../components/GeofencePanel.vue";
import StatusCard from "../components/StatusCard.vue";
import { calculateDistance } from "../utils/geo";

const router = useRouter();

// 🔌 Socket Configuration (Auto Detect)
const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
const socket = io(socketUrl, {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
});

const isOwner = ref(false);

// State: เก็บข้อมูลเป็น Object (เพื่อความเร็วในการค้นหา)
const vehicles = reactive({});
const connectionStatus = ref("Connecting...");
const currentDeviceId = ref("");
const mapViewerRef = ref(null); // เอาไว้อ้างอิง MapViewer เพื่อสั่ง focusCar
const isMobileMenuOpen = ref(false);

// Geofence
const draftGeofence = reactive({
  enabled: false,
  radius: 200,
  lat: 13.7563,
  lng: 100.5018,
});
const showGeofencePanel = ref(false);

// Modals
const showAddDeviceModal = ref(false);
const showSettingsModal = ref(false);
const showShareModal = ref(false);
const editingDevice = ref(null);
const sharingDevice = ref(null);

// UI Logic
const isSending = ref(false);
const isAlerting = ref(false);
const alertTitle = ref("");
const alertMessage = ref("");
const alertIcon = ref("");
const alertCooldown = ref(0);
const audio = new Audio("/alert.mp3");
const showToast = ref(false);
const toastData = reactive({
  title: "",
  message: "",
  icon: "",
  colorClass: "",
});

// ✅ แก้ไข 3: แปลง Object เป็น Array เพื่อส่งให้ Sidebar และ MapViewer (แก้จอขาว)
const devicesArray = computed(() => {
  return Object.values(vehicles);
});

// ดึงข้อมูลรถคันปัจจุบัน
const currentVehicle = computed(() => vehicles[currentDeviceId.value] || {});

const displayGeofence = computed(() => {
  if (showGeofencePanel.value) return draftGeofence;
  const v = vehicles[currentDeviceId.value];
  return v?.geofence || { enabled: false, lat: 0, lng: 0, radius: 200 };
});

// ฟังก์ชันโหลดข้อมูล
const fetchInitialData = async () => {
  try {
    const res = await api.get("/devices");

    // ดัก Error กรณี Cloudflare ส่ง HTML มา
    if (typeof res.data === "string" && res.data.includes("<!DOCTYPE html>")) {
      throw new Error(
        "Server returned HTML (Tunnel might be down or Auth failed)"
      );
    }

    let devicesList = [];
    if (Array.isArray(res.data)) devicesList = res.data;
    else if (res.data?.data && Array.isArray(res.data.data))
      devicesList = res.data.data;
    else if (res.data?.devices && Array.isArray(res.data.devices))
      devicesList = res.data.devices;

    console.log("📦 Loaded Devices:", devicesList.length, "items");

    if (devicesList.length === 0) {
      if (res.status === 200)
        Object.keys(vehicles).forEach((k) => delete vehicles[k]);
      return;
    }

    // ล้างข้อมูลเก่า
    Object.keys(vehicles).forEach((key) => delete vehicles[key]);

    // เติมข้อมูลใหม่
    devicesList.forEach((d) => {
      const history = Array.isArray(d.locationHistory) ? d.locationHistory : [];
      const lastLoc = history.length > 0 ? history[0] : null;

      // ✅ แก้ไข 4: ดักจับค่าแบตเตอรี่ทุกรูปแบบ (battery, currentBattery, batt)
      const batteryVal = d.currentBattery ?? d.battery ?? d.batt ?? 0;

      vehicles[d.deviceId] = {
        id: d.deviceId,
        name: d.name || `Device ${d.deviceId}`,
        emergencyPhone: d.emergencyPhone || "",

        lat: Number(lastLoc?.lat) || Number(d.lat) || 0,
        lng: Number(lastLoc?.lng) || Number(d.lng) || 0,
        speed: Number(lastLoc?.speed) || Number(d.speed) || 0,

        ign: !!(lastLoc?.ign ?? d.ign),
        status: d.currentStatus || "OFFLINE",
        battery: Number(batteryVal), // ใช้ค่าที่หาได้

        geofence: {
          enabled: !!d.isGeofenceActive,
          lat: Number(d.geofenceLat) || 0,
          lng: Number(d.geofenceLng) || 0,
          radius: Number(d.geofenceRadius) || 200,
        },
      };
    });

    // เลือกคันแรกอัตโนมัติ
    if (
      (!currentDeviceId.value || !vehicles[currentDeviceId.value]) &&
      devicesList.length > 0
    ) {
      currentDeviceId.value = devicesList[0].deviceId;
    }
  } catch (e) {
    console.error("❌ Fetch Data Error:", e);
    if (e.message !== "Network Error") {
      triggerToast(
        "Connection Error",
        "ไม่สามารถโหลดข้อมูลอุปกรณ์ได้",
        "⚠️",
        "alert-error"
      );
    }
  }
};

// --- Event Handlers ---

const handleDeviceAdded = () => {
  showAddDeviceModal.value = false;
  fetchInitialData();
  triggerToast("Success", "เพิ่มอุปกรณ์เรียบร้อย", "🎉", "alert-success");
};
const openSettingsModal = (d) => {
  editingDevice.value = d;
  showGeofencePanel.value = false;
  isMobileMenuOpen.value = false;
  showSettingsModal.value = true;
};

const handleOpenShare = (d) => {
  sharingDevice.value = d;
  showShareModal.value = true;
  isMobileMenuOpen.value = false;
};

const handleDeviceUpdated = (newData) => {
  if (vehicles[newData.id]) {
    vehicles[newData.id].name = newData.name;
    vehicles[newData.id].emergencyPhone = newData.emergencyPhone;
  }
  triggerToast("Saved", "บันทึกข้อมูลเรียบร้อย", "💾", "alert-success");
};
const handleDeviceDeleted = (deletedId) => {
  delete vehicles[deletedId];
  triggerToast("Deleted", "ลบอุปกรณ์แล้ว", "🗑️", "alert-warning");
  if (currentDeviceId.value === deletedId) {
    const keys = Object.keys(vehicles);
    currentDeviceId.value = keys.length > 0 ? keys[0] : "";
  }
};

const handleDirectDelete = async (device) => {
  if (!confirm(`ยืนยันการลบ "${device.name || device.id}"?`)) return;
  try {
    await api.delete(`/devices/${device.id}`);
    handleDeviceDeleted(device.id);
  } catch (e) {
    triggerToast("Error", "ลบไม่สำเร็จ", "❌", "alert-error");
  }
};

const goToHistory = (id) => {
  router.push(`/history/${id}`);
};

const findMyBike = async (id) => {
  try {
    const targetId = id || currentDeviceId.value;
    if (!targetId) return;

    // ❌ ของเดิม: { action: "find_bike" }
    // ✅ แก้เป็น: { command: "find_bike" }
    await api.post(`/devices/${targetId}/command`, { 
        command: "find_bike" 
    });

    triggerToast("Sent", "ส่งสัญญาณตามหาแล้ว", "📢", "alert-info");
  } catch (e) {
    console.error(e);
    triggerToast("Error", "ส่งคำสั่งไม่สำเร็จ", "❌", "alert-error");
  }
};
const openGeofencePanel = () => {
  const v = vehicles[currentDeviceId.value];
  if (v && v.geofence) {
    Object.assign(draftGeofence, v.geofence);
  }
  showGeofencePanel.value = true;
  isMobileMenuOpen.value = false;
  if (mapViewerRef.value && draftGeofence.lat !== 0)
    mapViewerRef.value.focusLatLn(draftGeofence.lat, draftGeofence.lng);
};

const saveGeofence = async () => {
  if (!isOwner.value) return;
  isSending.value = true;
  try {
    const currentV = vehicles[currentDeviceId.value];
    await api.put(`/devices/${currentDeviceId.value}`, {
      geofence: { ...draftGeofence },
      name: currentV.name,
      emergencyPhone: currentV.emergencyPhone,
    });

    if (vehicles[currentDeviceId.value]) {
      vehicles[currentDeviceId.value].geofence = { ...draftGeofence };
    }

    triggerToast(
      "Success",
      "บันทึก Geofence ลงระบบแล้ว",
      "✅",
      "alert-success"
    );
    setTimeout(() => (showGeofencePanel.value = false), 500);
  } catch (e) {
    console.error(e);
    triggerToast("Error", "บันทึกผิดพลาด", "❌", "alert-error");
  } finally {
    isSending.value = false;
  }
};

const handleMapCenterUpdate = (center) => {
  if (showGeofencePanel.value && isOwner.value) {
    draftGeofence.lat = center.lat;
    draftGeofence.lng = center.lng;
  }
};

const triggerAlert = (type, title, msg, icon) => {
  if (Date.now() < alertCooldown.value) return;
  isAlerting.value = true;
  alertTitle.value = title;
  alertMessage.value = msg;
  alertIcon.value = icon;
  audio.play().catch((e) => console.log("Audio play failed:", e));
};

const muteAlert = () => {
  isAlerting.value = false;
  audio.pause();
  alertCooldown.value = Date.now() + 60000;
};

// 🔥🔥🔥 ฟังก์ชันใหม่: สั่งปิดเสียงที่รถ (Remote Stop) 🔥🔥🔥
const handleRemoteStopAlarm = async () => {
  // 1. ปิดหน้าจอและเสียงในคอมก่อน
  muteAlert();

  // 2. เช็คว่ามี Device ID ไหม
  if (!currentDeviceId.value) return;

  try {
    console.log(`📤 Sending STOP_ALARM to ${currentDeviceId.value}...`);

    // ❌ ของเดิม: { action: "stop_alarm" }
    // ✅ แก้เป็น: { command: "stop_alarm" }
    await api.post(`/devices/${currentDeviceId.value}/command`, {
      command: "stop_alarm",
    });

    triggerToast("Info", "ส่งคำสั่งปิดเสียงรถแล้ว", "🔕", "alert-info");
  } catch (e) {
    console.error("Failed to stop alarm:", e);
    triggerToast("Error", "ส่งคำสั่งไม่สำเร็จ", "❌", "alert-error");
  }
};
const triggerToast = (t, m, i, c) => {
  showToast.value = true;
  toastData.title = t;
  toastData.message = m;
  toastData.icon = i;
  toastData.colorClass = c;
  setTimeout(() => (showToast.value = false), 3000);
};
const handleLogout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};

// ✅ แก้ไข 5: ฟังก์ชันเลือกอุปกรณ์ ต้องสั่ง mapViewerRef ให้ Focus ไปที่รถ
const handleSelectDevice = (id) => {
  currentDeviceId.value = id;
  // ตรวจสอบว่า mapViewerRef มีอยู่จริง และมีฟังก์ชัน focusCar ให้เรียก
  if (mapViewerRef.value && typeof mapViewerRef.value.focusCar === "function") {
    mapViewerRef.value.focusCar(id);
  }
};

// Lifecycle Hooks
onMounted(async () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const base64Url = token.split(".")[1];
      if (base64Url) {
        const payload = JSON.parse(atob(base64Url));
        isOwner.value = payload.role === "ADMIN";
      }
    }
  } catch (e) {
    console.error("Token decode error:", e);
    isOwner.value = false;
  }

  await fetchInitialData();

  socket.on("connect", () => {
    connectionStatus.value = "Online";
    console.log("🟢 Socket Connected!");
  });
  socket.on("connect_error", (err) => {
    console.error("🔴 Socket Error:", err);
  });

  socket.on("new_location", (data) => {
    if (vehicles[data.deviceId]) {
      // ✅ อัปเดตแบตเตอรี่แบบ Realtime
      const bat =
        data.battery ?? data.currentBattery ?? vehicles[data.deviceId].battery;

      vehicles[data.deviceId] = {
        ...vehicles[data.deviceId],
        lat: Number(data.lat),
        lng: Number(data.lng),
        speed: Number(data.speed),
        ign: !!data.ign,
        status: data.status || "ONLINE",
        battery: Number(bat),
      };
    }

    // เช็ค Geofence
    const v = vehicles[data.deviceId];
    if (v && v.geofence && v.geofence.enabled && v.geofence.lat !== 0) {
      let lat = Number(data.lat || 0);
      let lng = Number(data.lng || 0);
      if (
        calculateDistance(lat, lng, v.geofence.lat, v.geofence.lng) >
        v.geofence.radius
      ) {
        if (data.deviceId === currentDeviceId.value) {
          triggerAlert(
            "GEOFENCE",
            "ออกนอกเขต!",
            `รถ ${v.name} อยู่นอกรัศมี ${v.geofence.radius}m`,
            "🚧"
          );
        }
      }
    }
  });

  socket.on("new_alert", (data) => {
    if (vehicles[data.deviceId]) {
      const carName = vehicles[data.deviceId].name;
      // ดึงข้อความประเภทการแจ้งเตือนออกมา (เช่น THEFT_DETECTED, ACCIDENT_FALLEN)
      const alertType = data.message;

      console.log(`🔔 Alert Received: ${alertType} from ${carName}`);

      // ✅ แยกประเภทการแจ้งเตือนตามสิ่งที่ส่งมา
      if (alertType === "ACCIDENT_FALLEN") {
        // กรณีรถล้ม / อุบัติเหตุ
        triggerAlert(
          "CRASH",
          "แจ้งเตือนอุบัติเหตุ!",
          `ตรวจพบรถล้มหรือแรงกระแทกอย่างรุนแรงที่ "${carName}"`,
          "💥"
        );
      } else if (alertType === "THEFT_DETECTED") {
        // กรณีขโมย (สั่น + เคลื่อนที่)
        triggerAlert(
          "THEFT",
          "สัญญาณกันขโมย!",
          `ตรวจพบการเคลื่อนย้ายรถ "${carName}" ผิดปกติ!`,
          "🚨"
        );
      } else if (alertType === "BUMP_DETECTED") {
        // กรณีโดนชน / มีคนมาจับรถ (สั่นเบาๆ)
        triggerAlert(
          "BUMP",
          "ตรวจพบแรงสั่นสะเทือน",
          `มีการกระทบกระเทือนที่รถ "${carName}"`,
          "⚠️"
        );
      } else if (alertType === "GEOFENCE") {
        // กรณีออกนอกพื้นที่ (เผื่อไว้)
        triggerAlert(
          "GEOFENCE",
          "ออกนอกพื้นที่!",
          `รถ "${carName}" ออกนอกเขตที่กำหนด`,
          "🚧"
        );
      }
    }
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
  muteAlert();
});
</script>
<style scoped>
/* Animation สำหรับ Toast */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-20px); }
</style>