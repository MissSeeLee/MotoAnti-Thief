import { createRouter, createWebHistory } from "vue-router";

// 1. Import Views ทั้งหมด
import LoginView from "./views/LoginView.vue";
import RegisterView from "./views/RegisterView.vue";
import DashboardView from "./views/DashboardView.vue";
import HistoryView from "./views/HistoryView.vue";
import JoinView from "./views/JoinView.vue"; // สำหรับรับรถจากเพื่อน
import VerifyEmail from "./views/VerifyEmail.vue"; // สำหรับยืนยันอีเมล
import PublicTracking from "./views/PublicTracking.vue";
import ChangePasswordView from "./views/ChangePassword.vue";
import ForgotPasswordView from "./views/ForgotPasswordView.vue";
import ResetPasswordView from "./views/ResetPasswordView.vue";

// 🔥 เพิ่ม 2 บรรทัดนี้สำหรับระบบ Family Security Network
import RegisterShare from "./views/RegisterShare.vue"; // 🔓 หน้าลูกชายกรอกเบอร์
import SharingManagement from "./views/SharingManagement.vue"; // 🔒 หน้าเจ้าของรถจัดการลิ้งค์
import GuestTracking from "./views/GuestTracking.vue"; // 👈 เพิ่มบรรทัดนี้ลงไป
const routes = [
  // ==========================================
  // 🔓 Public Routes (ไม่ต้อง Login)
  // ==========================================
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: ForgotPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: "/verify-email",
    name: "VerifyEmail",
    component: VerifyEmail,
    meta: { requiresAuth: false },
  },
  {
    path: "/join/:token",
    name: "Join",
    component: JoinView,
    meta: { requiresAuth: false },
  },
  {
    path: "/track-public/:token",
    name: "PublicTracking",
    component: PublicTracking,
    meta: {
      requiresAuth: false,
      layout: "empty",
    },
  },
 {
    path: '/track/:token',
    name: 'GuestTracking',
    component: GuestTracking,
    meta: { 
      requiresAuth: false, // 🔓 สำคัญมาก: ต้องระบุให้ชัดว่าไม่ต้อง Login
      layout: 'empty'      // 📱 แนะนำให้ใช้ Layout เปล่าเพื่อพื้นที่แผนที่สูงสุด
    }
  },
  // ✅ แก้ไข: เพิ่ม meta ให้รู้ว่าเป็น Public และแก้ Error หน้าขาวแล้ว
  {
    path: "/register-share/:token",
    name: "RegisterShare",
    component: RegisterShare,
    meta: { requiresAuth: false },
  },

  // ==========================================
  // 🔒 Private Routes (ต้อง Login)
  // ==========================================
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/history/:deviceId",
    name: "History",
    component: HistoryView,
    meta: { requiresAuth: true },
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: ChangePasswordView,
    meta: { requiresAuth: true },
  },
  // ✅ เพิ่ม: หน้าจัดการลิ้งค์แชร์ของเจ้าของรถ
  {
    path: "/sharing-management/:deviceId",
    name: "SharingManagement",
    component: SharingManagement,
    meta: { requiresAuth: true },
  },

  // ==========================================
  // 🔄 Redirects & Catch All
  // ==========================================
  {
    path: "/",
    redirect: "/dashboard",
  },
  // กันลิงก์มั่ว (Catch All) -> ดีดไป Login
  {
    path: "/:pathMatch(.*)*",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔥 Logic การตรวจบัตรผ่านทาง (Router Guard)
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem("token");

  // 1. ถ้าหน้านั้นต้องการ Login (requiresAuth: true) แต่เราไม่มี Token -> ดีดไป Login
  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/login");
  }
  // 2. ถ้าเข้าหน้า Login/Register แต่มี Token อยู่แล้ว -> ดีดไป Dashboard
  else if ((to.path === "/login" || to.path === "/register") && isLoggedIn) {
    next("/dashboard");
  }
  // 3. กรณีอื่นๆ -> ปล่อยผ่าน
  else {
    next();
  }
});

export default router;
