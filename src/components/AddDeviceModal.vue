<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fade-in">
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
      
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-gray-800 text-lg">เพิ่มอุปกรณ์ใหม่</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">✖</button>
      </div>

      <div class="p-6 space-y-4">
        
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Device ID (Serial Number)</label>
          <input 
            v-model="form.deviceId" 
            type="text" 
            class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="เช่น lilygo-test-01"
          /> 
          </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">ตั้งชื่อรถ</label>
          <input 
            v-model="form.name" 
            type="text" 
            class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="เช่น รถคันเก่ง"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">
            เบอร์แจ้งเตือนฉุกเฉิน
          </label>
          <div class="relative">
            <input 
              v-model="form.emergencyPhone"
              @input="handlePhoneInput"
              type="tel" 
              maxlength="10"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm pl-9"
              placeholder="08xxxxxxxx"
            />
            <span class="absolute left-3 top-2 text-gray-400">📞</span>
          </div>
          <p class="text-[10px] text-gray-400 mt-1">*ค่าเริ่มต้นดึงจากเบอร์สมาชิก (ตัวเลข 10 หลัก)</p>
        </div>

        <div v-if="errorMessage" class="text-red-500 text-xs bg-red-50 p-2 rounded border border-red-200">
          ⚠️ {{ errorMessage }}
        </div>

      </div>

      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
        <button @click="$emit('close')" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">ยกเลิก</button>
        <button 
          @click="submit" 
          :disabled="loading"
          class="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'กำลังเพิ่ม...' : 'เพิ่มอุปกรณ์' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import api from '../api';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close', 'added']);

const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  deviceId: '',
  name: '',
  emergencyPhone: ''
});

// ✅ ฟังก์ชันกรองให้พิมพ์ได้แค่ตัวเลข
const handlePhoneInput = (event) => {
  // แทนที่ทุกอย่างที่ไม่ใช่ตัวเลข (0-9) ด้วยค่าว่าง
  let value = event.target.value.replace(/\D/g, '');
  
  // ตัดให้เหลือแค่ 10 ตัว (กันเหนียวเผื่อ maxlength ไม่ทำงานในบาง browser)
  if (value.length > 10) value = value.slice(0, 10);
  
  // อัปเดตค่ากลับเข้าไป
  form.emergencyPhone = value;
  event.target.value = value;
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.deviceId = '';
    form.name = '';
    // ดึงเบอร์เดิมมา แล้วกรองให้เหลือแต่เลขทันที (เผื่อเบอร์เดิมมีขีด - )
    const savedPhone = localStorage.getItem('user_phone') || '';
    form.emergencyPhone = savedPhone.replace(/\D/g, '').slice(0, 10);
    errorMessage.value = '';
  }
});

const submit = async () => {
  errorMessage.value = '';

  // เช็คค่าว่าง
  if (!form.deviceId || !form.name) {
    errorMessage.value = "กรุณากรอก Device ID และชื่อรถ";
    return;
  }

  // ✅ เช็คเบอร์โทร: ต้องมีค่า และต้องครบ 10 หลัก
  if (!form.emergencyPhone || form.emergencyPhone.length !== 10) {
    errorMessage.value = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
    return;
  }
  
  loading.value = true;
  try {
    await api.post('/devices', {
      deviceId: form.deviceId,
      name: form.name,
      emergencyPhone: form.emergencyPhone 
    });

    // alert("✅ เพิ่มอุปกรณ์สำเร็จ!"); // เอา alert ออกก็ได้ถ้าต้องการความสมูท
    emit('added');
    emit('close');
    
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    errorMessage.value = msg;
  } finally {
    loading.value = false;
  }
};
</script>