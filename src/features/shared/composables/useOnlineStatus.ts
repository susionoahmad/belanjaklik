import { useOnline } from '@vueuse/core';

export function useOnlineStatus() {
  const isOnline = useOnline();
  return {
    isOnline
  };
}
