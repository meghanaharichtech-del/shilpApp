// Override EXPO_PUBLIC_API_URL when using a local development backend.
// export const BASEURL = ("https://shilpappbackend-production.up.railway.app/" || "http://localhost:3001/"
// ).replace(/\/$/, "") + "/";
// export const BASEURL ="http://192.168.3.164:3000/" local IP address
export const BASEURL ="https://shilpappbackend-production.up.railway.app/" //  production url

export const LOGIN_API = BASEURL + 'api/broker/login';
export const PROJECTS_API = BASEURL + 'api/projects';
export const PROFILE_API = BASEURL + "api/broker/profile";

export const REGISTER_API = BASEURL + "api/broker/register";
export const VERIFY_OTP_API = BASEURL + "api/broker/verify-otp";
export const RESEND_OTP_API = BASEURL + "api/broker/resend-otp";
export const COMPANY_API = BASEURL + "api/broker/company";
export const DASHBOARD_API = BASEURL + "api/dashboard/home";
export const FAVORITES_API = BASEURL + "api/favorites";
export const NOTIFICATIONS_API = BASEURL + "api/notifications";
export const NOTIFICATION_UNREAD_COUNT_API = BASEURL + "api/notifications/unread-count";
export const NOTIFICATIONS_READ_ALL_API = BASEURL + "api/notifications/read-all";

// Encode dynamic IDs once, at the endpoint boundary.
export const PROJECT_DETAIL_API = (id) => PROJECTS_API + "/" + encodeURIComponent(id);
export const PROJECT_DOCUMENTS_API = (id) => PROJECT_DETAIL_API(id) + "/documents";
export const FAVORITE_API = (id) => FAVORITES_API + "/" + encodeURIComponent(id);
export const NOTIFICATION_READ_API = (id) => NOTIFICATIONS_API + "/" + encodeURIComponent(id) + "/read";

