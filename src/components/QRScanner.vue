<template>
  <div class="qr-scanner-wrapper">
    <div id="reader" class="rounded-lg overflow-hidden shadow-inner border-2 border-slate-200"></div>
    
    <p class="text-center text-sm text-slate-500 mt-2">
      วาง QR Code ให้อยู่ในกรอบ
    </p>
    
    <button @click="$emit('close')" class="mt-4 w-full py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">
      ยกเลิก / ปิดกล้อง
    </button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { Html5Qrcode } from "html5-qrcode";

const emit = defineEmits(['result', 'close']);
let html5QrCode = null;

onMounted(() => {
  startScanner();
});

onUnmounted(() => {
  stopScanner();
});

const startScanner = async () => {
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  
  try {
    html5QrCode = new Html5Qrcode("reader");
    
    // สั่งให้ใช้ "กล้องหลัง" (environment)
    await html5QrCode.start(
      { facingMode: "environment" }, 
      config, 
      onScanSuccess,
      onScanFailure
    );
  } catch (err) {
    console.error("เปิดกล้องไม่สำเร็จ:", err);
    alert("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตให้เข้าถึงกล้อง");
    emit('close');
  }
};

const stopScanner = async () => {
  if (html5QrCode && html5QrCode.isScanning) {
    await html5QrCode.stop();
    html5QrCode.clear();
  }
};

const onScanSuccess = (decodedText) => {
  // พอสแกนเจอ -> ส่งค่ากลับไปบอกตัวแม่ -> ปิดตัวเอง
  console.log(`Scan result: ${decodedText}`);
  emit('result', decodedText);
  stopScanner();
};

const onScanFailure = (error) => {
  // (ไม่ต้องทำอะไร ให้มันสแกนต่อไปเงียบๆ)
};
</script>

<style scoped>
/* ปรับแต่งหน้าตากล้อง */
#reader {
  width: 100%;
  min-height: 300px;
  background: #000;
}
</style>