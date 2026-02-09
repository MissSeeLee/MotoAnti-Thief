import { createRouter, createWebHistory } from 'vue-router';

// Import Views ให้ครบ (ทั้งเก่าและใหม่)
import LoginView from './views/LoginView.vue'; 
import RegisterView from './views/RegisterView.vue';
import DashboardView from './views/DashboardView.vue';
import HistoryView from './views/HistoryView.vue';
import JoinView from './views/JoinView.vue';        // ✅ ของใหม่ (สำหรับรับรถ)
import VerifyEmail from './views/VerifyEmail.vue';  // ✅ ของเดิม (ห้ามลืม! ไม่งั้นยืนยันอีเมลไม่ได้)

const routes = [
  // 1. Login
  { 
    path: '/login', 
    name: 'Login', 
    component: LoginView,
    meta: { requiresAuth: false }
  },
  // 2. Register
  { 
    path: '/register', 
    name: 'Register', 
    component: RegisterView,
    meta: { requiresAuth: false }
  },
  // 3. Verify Email (จุดสำคัญ! ต้องเปิดให้เข้าได้โดยไม่ต้อง Login)
  {
    path: '/verify-email',
    name: 'verify-email',
    component: VerifyEmail,
    meta: { requiresAuth: false } // ✅ เปิดประตูให้เข้าได้เลย
  },
  // 4. Join (รับรถจากลิงก์)
  {
    path: '/join/:token',
    name: 'Join',
    component: JoinView,
    meta: { requiresAuth: false } // ✅ ไม่ต้อง Login ก็กดรับได้ (เดี๋ยวไปจัดการในหน้า Join เอา)
  },
  // 5. Dashboard (ต้อง Login)
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: DashboardView,
    meta: { requiresAuth: true } 
  },
  // 6. History (ต้อง Login)
  {
    path: '/history/:deviceId',
    name: 'History',
    component: HistoryView,
    meta: { requiresAuth: true }
  },
  // 7. Redirect หน้าแรก
  {
    path: '/',
    redirect: '/dashboard'
  },
  // 8. กันลิงก์มั่ว (Catch All) -> ดีดไป Login
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔥 Logic การตรวจบัตรผ่านทาง (Router Guard)
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token');

  // กรณี 1: หน้าที่ต้อง Login (requiresAuth: true) แต่เรายังไม่ Login -> ดีดไป Login
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login');
  } 
  // กรณี 2: เข้าหน้า Login/Register แต่ Login อยู่แล้ว -> ดีดไป Dashboard
  // (แต่ถ้าเข้า VerifyEmail หรือ Join ให้ปล่อยผ่านได้เลย แม้จะมี Token แล้ว)
  else if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    next('/dashboard');
  } 
  else {
    next();
  }
});

export default router;