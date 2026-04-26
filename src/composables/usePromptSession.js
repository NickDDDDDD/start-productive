import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export function usePromptSession() {
  const supported = ref(false);
  const availability = ref("unavailable");
  const downloading = ref({ loaded: 0 });
  const error = ref(null);
  const hasSession = ref(false);
  const session = ref(null);
  const abortController = ref(null);

  async function refreshAvailability() {
    if (!supported.value) return "unavailable";
    try {
      const nextAvailability = await window.LanguageModel.availability();
      availability.value = nextAvailability;
      return nextAvailability;
    } catch (err) {
      error.value = err;
      return "unavailable";
    }
  }

  async function initSession() {
    if (!supported.value) {
      throw new Error("Prompt API not supported in this environment.");
    }

    if (session.value) {
      hasSession.value = true;
      return session.value;
    }

    abortController.value?.abort?.();
    const controller = new AbortController();
    abortController.value = controller;

    try {
      const nextSession = await window.LanguageModel.create({
        signal: controller.signal,
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            availability.value = "downloading";
            downloading.value = { loaded: event?.loaded ?? 0 };
          });
        },
      });

      session.value = nextSession;
      hasSession.value = true;
      await refreshAvailability();
      return nextSession;
    } catch (err) {
      error.value = err;
      hasSession.value = false;
      throw err;
    }
  }

  function destroySession() {
    try {
      session.value?.destroy?.();
    } catch (err) {
      error.value = err;
    }
    session.value = null;
    hasSession.value = false;
    downloading.value = { loaded: 0 };
  }

  async function prompt(text, options) {
    if (!session.value) {
      throw new Error("Prompt session not ready. Call initSession() first.");
    }
    return session.value.prompt(text, options);
  }

  onMounted(async () => {
    try {
      const ok = typeof window !== "undefined" && Boolean(window.LanguageModel);
      supported.value = ok;
      if (ok) await refreshAvailability();
    } catch (err) {
      error.value = err;
    }
  });

  onBeforeUnmount(() => {
    destroySession();
    abortController.value?.abort?.();
    abortController.value = null;
  });

  return {
    supported,
    availability,
    downloading,
    error,
    ready: computed(() => hasSession.value),
    initSession,
    destroySession,
    refreshAvailability,
    prompt,
  };
}
