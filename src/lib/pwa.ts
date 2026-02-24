import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { onlineManager } from '@tanstack/react-query';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => {
    // onlineManager fires on window online/offline events AND manual setOnline() calls
    return onlineManager.subscribe(setIsOnline);
  }, []);

  return isOnline;
}

export function usePWAUpdate() {
  return useRegisterSW({ immediate: true });
}
