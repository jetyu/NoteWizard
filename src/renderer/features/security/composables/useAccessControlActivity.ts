import { onMounted, onUnmounted } from 'vue';
import { securityService } from '../services/security.service';

const ACTIVITY_EVENTS = ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart'] as const;
const ACTIVITY_THROTTLE_MS = 1000;

export function useAccessControlActivity(): void {
  let lastActivityAt = 0;

  function handleActivity(): void {
    if (!securityService.isAccessControlAvailable()) {
      return;
    }

    const now = Date.now();
    if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) {
      return;
    }

    lastActivityAt = now;
    securityService.resetAccessControlIdleTimer();
  }

  onMounted(() => {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, true);
    });
  });

  onUnmounted(() => {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, handleActivity, true);
    });
  });
}
