(() => {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const starsContainer = document.getElementById("header-stars");

  if (starsContainer) {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 45; index += 1) {
      const star = document.createElement("span");
      star.className = "ipe3-star";
      star.style.setProperty("--left", `${Math.random() * 100}%`);
      star.style.setProperty("--top", `${Math.random() * 100}%`);
      star.style.setProperty("--size", `${1 + Math.random() * 2}px`);
      star.style.setProperty("--duration", `${12 + Math.random() * 20}s`);
      star.style.setProperty("--glow-duration", `${2 + Math.random() * 4}s`);
      star.style.setProperty("--delay", `${-Math.random() * 30}s`);
      fragment.appendChild(star);
    }

    starsContainer.appendChild(fragment);
  }

  const revealTargets = document.querySelectorAll(
    "main > section, main article, main .card, main .glass-card, main .glass-panel"
  );
  if (!reducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ipe3-reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealTargets.forEach((target, index) => {
      target.style.setProperty("--ipe3-reveal-delay", `${(index % 4) * 55}ms`);
      target.classList.add("ipe3-reveal");
      revealObserver.observe(target);
    });
  }

  if (document.querySelector(".ipe3-alma")) return;

  const CONSENT_STORAGE_KEY = "ipe3-alma-consent-v1";
  const CORE_PARTICLES = 14;

  const widget = document.createElement("div");
  widget.className = "ipe3-alma";
  widget.innerHTML = `
    <section class="ipe3-alma__panel" id="ipe3-alma-panel" role="dialog"
      aria-labelledby="ipe3-alma-title" aria-describedby="ipe3-alma-note" hidden>
      <header class="ipe3-alma__header">
        <span class="ipe3-alma__avatar" aria-hidden="true" data-core></span>
        <span class="ipe3-alma__identity">
          <strong id="ipe3-alma-title">ALMA</strong>
          <small id="ipe3-alma-agent">Especialistas IPE3 · IA</small>
        </span>
        <span class="ipe3-alma__online" id="ipe3-alma-status">Vista previa</span>
        <button class="ipe3-alma__close" type="button" aria-label="Cerrar ALMA">×</button>
      </header>
      <div class="ipe3-alma__messages" role="log" aria-live="polite" aria-relevant="additions">
        <div class="ipe3-alma__message ipe3-alma__message--assistant">
          <span>Hola, soy ALMA. Puedo orientarte y conectarte con especialistas comerciales, técnicos o de posventa.</span>
        </div>
      </div>
      <div class="ipe3-alma__suggestions" aria-label="Preguntas sugeridas">
        <button type="button" data-alma-message="Quiero solicitar una cotización">Cotizar</button>
        <button type="button" data-alma-message="No sé qué servicio necesito">Recomendar</button>
        <button type="button" data-alma-message="Quiero agendar una visita técnica">Agendar visita</button>
        <button type="button" data-alma-message="Necesito soporte técnico">Soporte</button>
      </div>
      <form class="ipe3-alma__form">
        <label class="ipe3-alma__visually-hidden" for="ipe3-alma-input">Escribe tu consulta</label>
        <input id="ipe3-alma-input" name="message" type="text" maxlength="1200"
          placeholder="Escribe tu consulta…" autocomplete="off" required>
        <button type="submit" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.4 20.1 21 12 3.4 3.9 3 10.2l12.5 1.8L3 13.8l.4 6.3Z"/>
          </svg>
        </button>
      </form>
      <div class="ipe3-alma__consent" id="ipe3-alma-consent">
        <p>ALMA envía tu consulta a un proveedor externo de inteligencia artificial para generar la respuesta. IPE3 no guarda el historial. No compartas datos sensibles.</p>
        <div class="ipe3-alma__consent-actions">
          <button class="ipe3-alma__accept" id="ipe3-alma-accept" type="button">Aceptar y consultar</button>
          <a class="ipe3-alma__terms-link" href="./aviso-ia.html" target="_blank" rel="noopener noreferrer">Leer aviso completo</a>
        </div>
      </div>
      <p class="ipe3-alma__note" id="ipe3-alma-note">
        ALMA puede equivocarse. Para cotizaciones, confirmaciones o atención personal, contacta al equipo IPE3.
      </p>
    </section>
    <button class="ipe3-alma__launcher" type="button"
      aria-controls="ipe3-alma-panel" aria-expanded="false" aria-label="Abrir asistente ALMA">
      <span class="ipe3-alma__launcher-orb" aria-hidden="true" data-core></span>
      <span class="ipe3-alma__launcher-label">
        <strong>ALMA</strong>
        <small>Asistente inteligente</small>
      </span>
    </button>
  `;
  document.body.appendChild(widget);

  function buildCore(container, particles) {
    const orbit = document.createElement("span");
    orbit.className = "ipe3-core__orbit";

    for (let index = 0; index < particles; index += 1) {
      const particle = document.createElement("span");
      particle.className = "ipe3-core__particle";
      particle.style.setProperty("--a", `${(360 / particles) * index}deg`);
      particle.style.setProperty("--r", `${9 + Math.random() * 8}px`);
      particle.style.setProperty("--d", `${1.4 + Math.random() * 1.8}s`);
      particle.style.setProperty("--s", `${1 + Math.random() * 1.8}px`);
      orbit.appendChild(particle);
    }

    const core = document.createElement("span");
    core.className = "ipe3-core__core";

    core.addEventListener("animationend", () => {
      container.classList.remove("is-bursting");
    });

    container.appendChild(orbit);
    container.appendChild(core);
  }

  const apiEndpoint = "https://script.google.com/macros/s/AKfycbxig1xTGc2x7qeFUjlTzYZPBVt-5Whc-orDBqAc31nTmGFjkaGIMHMBAql59EUhi6lE8g/exec";
  const whatsappNumber = "593984016027";
  const panel = widget.querySelector(".ipe3-alma__panel");
  const launcher = widget.querySelector(".ipe3-alma__launcher");
  const closeButton = widget.querySelector(".ipe3-alma__close");
  const messageList = widget.querySelector(".ipe3-alma__messages");
  const input = widget.querySelector("#ipe3-alma-input");
  const form = widget.querySelector(".ipe3-alma__form");
  const consentGate = widget.querySelector("#ipe3-alma-consent");
  const acceptButton = widget.querySelector("#ipe3-alma-accept");
  const agentStatus = widget.querySelector("#ipe3-alma-agent");
  const onlineStatus = widget.querySelector("#ipe3-alma-status");
  const cores = widget.querySelectorAll("[data-core]");

  let consentAccepted = false;
  try {
    consentAccepted = window.localStorage.getItem(CONSENT_STORAGE_KEY) === "aceptado";
  } catch {
    consentAccepted = false;
  }

  cores.forEach((core) => buildCore(core, CORE_PARTICLES));

  const playCoreBurst = () => {
    if (reducedMotion) return;

    cores.forEach((core) => {
      core.classList.remove("is-bursting");
      void core.offsetWidth;
      core.classList.add("is-bursting");
    });
  };

  const applyConsentState = () => {
    consentGate.hidden = consentAccepted;
    onlineStatus.textContent = consentAccepted
      ? (apiEndpoint ? "En línea" : "Vista previa")
      : "Aviso pendiente";
  };

  applyConsentState();
  playCoreBurst();

  const sessionId =
    window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `alma-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const setOpen = (open) => {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    launcher.setAttribute(
      "aria-label",
      open ? "Cerrar asistente ALMA" : "Abrir asistente ALMA"
    );
    document.body.classList.toggle("ipe3-alma-active", open);

    if (open) {
      playCoreBurst();
      input.focus();
    } else {
      launcher.focus();
    }
  };

  const addMessage = (text, sender, agentName) => {
    const message = document.createElement("div");
    message.className = `ipe3-alma__message ipe3-alma__message--${sender}`;
    if (agentName) {
      const agent = document.createElement("small");
      agent.className = "ipe3-alma__message-agent";
      agent.textContent = agentName;
      message.appendChild(agent);
    }
    const content = document.createElement("span");
    content.textContent = text;
    message.appendChild(content);
    messageList.appendChild(message);
    messageList.scrollTop = messageList.scrollHeight;
  };

  const addContactLink = (text) => {
    const link = document.createElement("a");
    link.className = "ipe3-alma__contact";
    link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `Hola, quiero información sobre IPE3. ${text}`
    )}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Continuar por WhatsApp";
    messageList.appendChild(link);
    messageList.scrollTop = messageList.scrollHeight;
  };

  const getHistory = () =>
    Array.from(messageList.querySelectorAll(".ipe3-alma__message"))
      .slice(-8)
      .map((message) => ({
        role: message.classList.contains("ipe3-alma__message--user")
          ? "user"
          : "assistant",
        content: message.querySelector("span:last-child").textContent,
      }));

  const setBusy = (busy) => {
    const sendButton = form.querySelector('button[type="submit"]');
    input.disabled = busy;
    sendButton.disabled = busy;
    sendButton.setAttribute("aria-label", busy ? "ALMA está respondiendo" : "Enviar mensaje");
  };

  const updateSuggestions = (suggestions) => {
    if (!suggestions || !suggestions.length) return;
    const container = widget.querySelector(".ipe3-alma__suggestions");
    if (!container) return;
    container.innerHTML = "";
    suggestions.forEach((suggestion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-alma-message", suggestion);
      button.textContent = suggestion;
      button.addEventListener("click", () => sendMessage(suggestion));
      container.appendChild(button);
    });
  };

  const requestReply = async (text, history) => {
    if (!apiEndpoint) {
      agentStatus.textContent = "Conexión pendiente";
      onlineStatus.textContent = "Vista previa";
      addMessage(
        "La conexión de ALMA aún debe configurarse. Puedes contactar directamente al equipo IPE3.",
        "assistant"
      );
      addContactLink(text);
      return;
    }

    const typing = document.createElement("div");
    typing.className = "ipe3-alma__typing";
    typing.setAttribute("role", "status");
    typing.textContent = "ALMA está consultando a un especialista…";
    messageList.appendChild(typing);
    messageList.scrollTop = messageList.scrollHeight;
    setBusy(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({
          type: "alma",
          sessionId: sessionId,
          message: text,
          history: history,
        }),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("El servidor de ALMA devolvió una respuesta inválida. Contacta al equipo IPE3.");
      }
      if (!response.ok || !result.success || !result.reply) {
        throw new Error(result.message || "No se pudo obtener una respuesta de ALMA.");
      }

      agentStatus.textContent = result.agentName || "Especialista IPE3 · IA";
      onlineStatus.textContent = "En línea";
      addMessage(result.reply, "assistant", result.agentName);
      if (result.handoff) addContactLink(text);
      if (result.suggestions) updateSuggestions(result.suggestions);
    } catch (error) {
      agentStatus.textContent = "Conexión interrumpida";
      onlineStatus.textContent = "Sin conexión";
      addMessage(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con ALMA. Inténtalo de nuevo o contacta al equipo.",
        "assistant"
      );
      addContactLink(text);
    } finally {
      typing.remove();
      setBusy(false);
    }
  };

  const sendMessage = (text) => {
    if (!text || input.disabled) return;

    if (!consentAccepted) {
      addMessage(
        "Antes de enviar tu consulta, acepta el aviso que aparece debajo del campo.",
        "assistant"
      );
      consentGate.classList.add("is-highlighted");
      acceptButton.focus();
      return;
    }

    const history = getHistory();
    addMessage(text, "user");
    input.value = "";
    requestReply(text, history);
  };

  acceptButton.addEventListener("click", () => {
    consentAccepted = true;
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, "aceptado");
    } catch {
      consentAccepted = true;
    }
    consentGate.classList.remove("is-highlighted");
    applyConsentState();
    input.focus();
  });

  launcher.addEventListener("click", () => {
    setOpen(panel.hidden);
  });
  closeButton.addEventListener("click", () => setOpen(false));
  widget.querySelectorAll("[data-alma-message]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.getAttribute("data-alma-message");
      sendMessage(text);
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value.trim());
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
})();