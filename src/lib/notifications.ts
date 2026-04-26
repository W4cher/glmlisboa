// Notificações: web push (browser Notification API) + alertas in-app via toast
import { toast } from "sonner";

export async function ensureNotifPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const r = await Notification.requestPermission();
  return r === "granted";
}

export function notify(title: string, body: string) {
  // Always show in-app toast
  toast(title, { description: body });
  // Also try browser notification if granted
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico", badge: "/favicon.ico", tag: title });
    }
  } catch {}
}
