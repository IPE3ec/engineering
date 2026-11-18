const installButton = document.getElementById("install-app");
const installHint = document.getElementById("install-hint");
const connectionStatus = document.getElementById("connection-status");
let deferredInstallPrompt = null;

function updateConnectionStatus() {
  connectionStatus.textContent = navigator.onLine
    ? "Conexión disponible. Los puntos y canjes requieren internet."
    : "Sin conexión. El portal está disponible, pero requiere internet para consultar tus puntos.";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .catch((error) => {
      connectionStatus.textContent =
        `No se pudo preparar la instalación sin conexión: ${error.message || "error de registro"}.`;
    });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
  installHint.hidden = true;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  installButton.disabled = true;
  try {
    await deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  } catch (error) {
    installHint.textContent = `No se pudo iniciar la instalación: ${error.message || "inténtalo desde el menú de Chrome"}.`;
    installHint.hidden = false;
  } finally {
    installButton.disabled = false;
  }
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
  installHint.textContent = "IPE3 Recompensas está instalada en este dispositivo.";
  installHint.hidden = false;
});

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
updateConnectionStatus();
