import { ref, onMounted } from 'vue';

const deferredPrompt = ref<any>(null);
const canInstall = ref(false);

export function usePwaInstall() {
  onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt.value = e;
      canInstall.value = true;
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt.value = null;
      canInstall.value = false;
    });
  });

  const installPwa = async () => {
    if (!deferredPrompt.value) return;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    if (outcome === 'accepted') {
      canInstall.value = false;
    }
    deferredPrompt.value = null;
  };

  return {
    canInstall,
    installPwa
  };
}
