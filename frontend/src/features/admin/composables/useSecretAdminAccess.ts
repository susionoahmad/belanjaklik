import { ref } from 'vue';

const isSecretModalOpen = ref(false);
const tapCount = ref(0);
const hintMessage = ref('');
let tapTimer: ReturnType<typeof setTimeout> | null = null;
let hintTimer: ReturnType<typeof setTimeout> | null = null;

export function useSecretAdminAccess() {
  const triggerSecretTap = () => {
    tapCount.value += 1;

    if (tapTimer) clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
      tapCount.value = 0;
    }, 2500);

    if (tapCount.value >= 3 && tapCount.value < 5) {
      const remaining = 5 - tapCount.value;
      hintMessage.value = `Ketuk ${remaining}x lagi untuk Akses Admin...`;
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = setTimeout(() => {
        hintMessage.value = '';
      }, 2000);
    } else if (tapCount.value >= 5) {
      tapCount.value = 0;
      hintMessage.value = '';
      if (tapTimer) clearTimeout(tapTimer);
      isSecretModalOpen.value = true;
    }
  };

  const closeSecretModal = () => {
    isSecretModalOpen.value = false;
  };

  return {
    isSecretModalOpen,
    tapCount,
    hintMessage,
    triggerSecretTap,
    closeSecretModal
  };
}
