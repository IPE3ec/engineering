const IPE3_QUOTE_ENDPOINT = "https://script.google.com/macros/s/AKfycbysdWCW_xUoOypezEPFtpv6oSwozlWWHu5hqlwTK1aTMMrgHTdSy-FmoNQeBwURv6sJbw/exec";

const quoteModal = document.getElementById("quoteModal");
const quoteForm = document.getElementById("quoteForm");
const quoteStatus = document.getElementById("quoteStatus");
const quoteSubmit = document.getElementById("quoteSubmit");

function openQuoteModal() {
  quoteModal.classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => quoteForm.querySelector("input")?.focus(), 100);
}

function closeQuoteModal() {
  quoteModal.classList.remove("open");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-open-quote]").forEach((button) => {
  button.addEventListener("click", openQuoteModal);
});

document.getElementById("closeQuote").addEventListener("click", closeQuoteModal);
quoteModal.addEventListener("click", (event) => {
  if (event.target === quoteModal) closeQuoteModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeQuoteModal();
});

function setQuoteStatus(message, error = false) {
  quoteStatus.textContent = message;
  quoteStatus.classList.remove("hidden", "border-red-500/30", "bg-red-500/10", "border-primary/20", "bg-primary/5");
  quoteStatus.classList.add(error ? "border-red-500/30" : "border-primary/20", error ? "bg-red-500/10" : "bg-primary/5");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      base64: String(reader.result).split(",")[1],
    });
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function submitWhatsAppFallback(data) {
  const message = [
    "Hola IPE3 Engineering, quiero solicitar una cotización:",
    `Nombre: ${data.nombre}`,
    `Teléfono: ${data.telefono}`,
    `Servicio: ${data.servicio}`,
    `Equipo: ${data.categoria} - ${data.modelo || "No especificado"}`,
    `Cantidad: ${data.cantidad}`,
    `Urgencia: ${data.urgencia}`,
    `Descripción: ${data.descripcion}`,
  ].join("\n");
  window.open(`https://wa.me/593984016027?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  setQuoteStatus("Solicitud preparada. Puedes enviarla por WhatsApp. El enlace del sistema aún no está configurado.");
}

quoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!quoteForm.reportValidity()) return;

  const formData = new FormData(quoteForm);
  const files = Array.from(quoteForm.elements.archivos.files || []);

  if (files.length > 5) {
    setQuoteStatus("Selecciona como máximo 5 archivos.", true);
    return;
  }

  if (files.some((file) => file.size > 8 * 1024 * 1024)) {
    setQuoteStatus("Cada archivo debe pesar 8 MB o menos.", true);
    return;
  }

  const data = Object.fromEntries(formData.entries());
  delete data.archivos;
  delete data.consentimiento;

  quoteSubmit.disabled = true;
  quoteSubmit.textContent = "Enviando solicitud...";

  try {
    const attachments = await Promise.all(files.map(fileToBase64));

    if (!IPE3_QUOTE_ENDPOINT) {
      await submitWhatsAppFallback(data);
      return;
    }

    const response = await fetch(IPE3_QUOTE_ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...data, attachments }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "No se pudo guardar la solicitud.");
    }

    quoteForm.reset();
    setQuoteStatus(`Solicitud recibida. Código: ${result.quoteId}`);
  } catch (error) {
    setQuoteStatus(error.message || "Ocurrió un error al enviar la solicitud.", true);
  } finally {
    quoteSubmit.disabled = false;
    quoteSubmit.textContent = "Enviar solicitud";
  }
});
