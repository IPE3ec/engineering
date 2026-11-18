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
  const CHAT_STORAGE_KEY = "ipe3-alma-chat-v1";
  const MAX_HISTORY = 6;
  const MAX_MESSAGE_LENGTH = 1200;
  const REQUEST_TIMEOUT_MS = 45000;
  const apiEndpoint = "https://script.google.com/macros/s/AKfycbysdWCW_xUoOypezEPFtpv6oSwozlWWHu5hqlwTK1aTMMrgHTdSy-FmoNQeBwURv6sJbw/exec";
  const whatsappNumber = "593984016027";
  const WELCOME_MESSAGE =
    "Hola, soy ALMA. Puedo orientarte y conectarte con especialistas comerciales, técnicos o de posventa.";

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
        <button class="ipe3-alma__reset" id="ipe3-alma-reset" type="button"
          aria-label="Nueva conversación" title="Nueva conversación">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.65 6.35A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.76-4.24L13 11h7V4l-2.35 2.35Z"/>
          </svg>
        </button>
        <button class="ipe3-alma__close" type="button" aria-label="Cerrar ALMA">×</button>
      </header>
      <div class="ipe3-alma__stream">
        <div class="ipe3-alma__messages" role="log" aria-live="polite" aria-relevant="additions"></div>
        <button class="ipe3-alma__scroll" id="ipe3-alma-scroll" type="button"
          aria-label="Ir al último mensaje" hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 16 6 10h12l-6 6Z"/>
          </svg>
        </button>
      </div>
      <div class="ipe3-alma__suggestions" aria-label="Preguntas sugeridas">
        <button type="button" data-alma-message="Quiero solicitar una cotización">Cotizar</button>
        <button type="button" data-alma-message="No sé qué servicio necesito">Recomendar</button>
        <button type="button" data-alma-message="Quiero agendar una visita técnica">Agendar visita</button>
        <button type="button" data-alma-message="Necesito soporte técnico">Soporte</button>
      </div>
      <form class="ipe3-alma__form">
        <label class="ipe3-alma__visually-hidden" for="ipe3-alma-input">Escribe tu consulta</label>
        <input id="ipe3-alma-input" name="message" type="text" maxlength="${MAX_MESSAGE_LENGTH}"
          placeholder="Escribe tu consulta…" autocomplete="off" required>
        <button type="submit" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.4 20.1 21 12 3.4 3.9 3 10.2l12.5 1.8L3 13.8l.4 6.3Z"/>
          </svg>
        </button>
      </form>
      <p class="ipe3-alma__counter" id="ipe3-alma-counter" hidden></p>
      <div class="ipe3-alma__consent" id="ipe3-alma-consent">
        <p>ALMA envía tu consulta a un proveedor externo de inteligencia artificial para generar la respuesta. IPE3 no guarda el historial. No compartas datos sensibles.</p>
        <div class="ipe3-alma__consent-actions">
          <button class="ipe3-alma__accept" id="ipe3-alma-accept" type="button">Aceptar y consultar</button>
          <a class="ipe3-alma__terms-link" href="./aviso-ia.html" target="_blank" rel="noopener noreferrer">Leer aviso completo</a>
        </div>
      </div>
      <p class="ipe3-alma__note" id="ipe3-alma-note">
        ALMA puede equivocarse. Para cotizaciones, confirmaciones o atención personal,
        <a href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener noreferrer">contacta al equipo IPE3</a>.
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

  function buildCore(container) {
    const layers = [
      "ipe3-core__ring ipe3-core__ring--outer",
      "ipe3-core__ring ipe3-core__ring--mid",
    ];

    layers.forEach((className) => {
      const layer = document.createElement("span");
      layer.className = className;
      layer.setAttribute("aria-hidden", "true");
      container.appendChild(layer);
    });

    createDust(container);

    const core = document.createElement("span");
    core.className = "ipe3-core__core";
    core.setAttribute("aria-hidden", "true");
    container.appendChild(core);

    core.addEventListener("animationend", () => {
      container.classList.remove("is-bursting");
    });
  }

  function createDust(container) {
    const canvas = document.createElement("canvas");
    canvas.className = "ipe3-core__dust";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    const context = canvas.getContext("2d");
    if (!context) return;

    const sprite = document.createElement("canvas");
    const spriteSize = 16;
    sprite.width = spriteSize;
    sprite.height = spriteSize;
    const spriteContext = sprite.getContext("2d");
    if (!spriteContext) return;

    const glow = spriteContext.createRadialGradient(8, 8, 0, 8, 8, 8);
    glow.addColorStop(0, "rgba(255, 255, 255, 1)");
    glow.addColorStop(0.32, "rgba(237, 233, 254, 0.92)");
    glow.addColorStop(0.66, "rgba(167, 139, 250, 0.38)");
    glow.addColorStop(1, "rgba(167, 139, 250, 0)");
    spriteContext.fillStyle = glow;
    spriteContext.fillRect(0, 0, spriteSize, spriteSize);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raf =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (callback) => window.setTimeout(() => callback(performance.now()), 16);
    const caf =
      typeof window.cancelAnimationFrame === "function"
        ? window.cancelAnimationFrame.bind(window)
        : (handle) => window.clearTimeout(handle);
    const particleCount = 22;
    let particles = [];
    let width = 42;
    let frame = 0;

    const buildParticles = () => {
      particles = Array.from({ length: particleCount }, () => ({
        angle: Math.random() * Math.PI * 2,
        orbit: 0.24 + Math.random() * 0.62,
        size: 0.55 + Math.random() * 1.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 0.22,
      }));
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.max(24, Math.round(rect.width || 42));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = size;
      canvas.width = Math.round(size * ratio);
      canvas.height = Math.round(size * ratio);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(performance.now());
    };

    const draw = (time) => {
      const half = width / 2;
      const boost = container.classList.contains("is-thinking") ? 1.9 : 1;
      context.clearRect(0, 0, width, width);

      particles.forEach((particle) => {
        const angle =
          particle.angle +
          time * 0.00013 * particle.speed * boost +
          particle.drift * Math.sin(time * 0.0004 + particle.phase);
        const twinkle = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(time * 0.0017 * particle.speed * boost + particle.phase));
        const radius = half * particle.orbit;
        const size = particle.size * 3 * (0.75 + twinkle * 0.7);

        context.globalAlpha = Math.min(1, twinkle);
        context.drawImage(
          sprite,
          half + Math.cos(angle) * radius - size / 2,
          half + Math.sin(angle) * radius - size / 2,
          size,
          size
        );
      });

      context.globalAlpha = 1;
    };

    const loop = (time) => {
      draw(time);
      frame = raf(loop);
    };

    const start = () => {
      if (frame || reducedMotion || document.hidden) return;
      frame = raf(loop);
    };

    const stop = () => {
      if (!frame) return;
      caf(frame);
      frame = 0;
    };

    buildParticles();
    resize();

    if (typeof window.ResizeObserver === "function") {
      new window.ResizeObserver(() => resize()).observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    if (reducedMotion) draw(0);
    else start();
  }

  const panel = widget.querySelector(".ipe3-alma__panel");
  const launcher = widget.querySelector(".ipe3-alma__launcher");
  const closeButton = widget.querySelector(".ipe3-alma__close");
  const resetButton = widget.querySelector("#ipe3-alma-reset");
  const messageList = widget.querySelector(".ipe3-alma__messages");
  const scrollButton = widget.querySelector("#ipe3-alma-scroll");
  const input = widget.querySelector("#ipe3-alma-input");
  const form = widget.querySelector(".ipe3-alma__form");
  const counter = widget.querySelector("#ipe3-alma-counter");
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

  let chatLog = [];
  let lastAgentId = "";
  let handoffShown = false;

  const normalizeSuggestion = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const persistChat = () => {
    try {
      window.sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(chatLog.slice(-40))
      );
    } catch {
      return;
    }
  };

  const loadChat = () => {
    try {
      const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) =>
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim()
      );
    } catch {
      return [];
    }
  };

  cores.forEach((core) => buildCore(core));

  const playCoreBurst = () => {
    if (reducedMotion) return;

    cores.forEach((core) => {
      core.classList.remove("is-bursting");
      void core.offsetWidth;
      core.classList.add("is-bursting");
    });
  };

  const setThinking = (thinking) => {
    cores.forEach((core) => core.classList.toggle("is-thinking", thinking));
  };

  const applyConsentState = () => {
    consentGate.hidden = consentAccepted;
    onlineStatus.textContent = consentAccepted
      ? (apiEndpoint ? "En línea" : "Vista previa")
      : "Aviso pendiente";
  };

  const scrollToBottom = () => {
    messageList.scrollTop = messageList.scrollHeight;
    scrollButton.hidden = true;
  };

  const isNearBottom = () =>
    messageList.scrollHeight -
      messageList.scrollTop -
      messageList.clientHeight <
    48;

  const renderMessage = (item) => {
    const message = document.createElement("div");
    message.className = `ipe3-alma__message ipe3-alma__message--${item.role}`;

    if (item.agentName) {
      const agent = document.createElement("small");
      agent.className = "ipe3-alma__message-agent";
      agent.textContent = item.agentName;
      message.appendChild(agent);
    }

    const content = document.createElement("span");
    content.textContent = item.content;
    message.appendChild(content);
    messageList.appendChild(message);
  };

  const renderChat = () => {
    messageList.innerHTML = "";
    chatLog.forEach(renderMessage);
    scrollToBottom();
  };

  const addMessage = (text, sender, agentName) => {
    const item = { role: sender, content: text, agentName: agentName || "" };
    chatLog.push(item);
    persistChat();
    renderMessage(item);
    scrollToBottom();
  };

  const addContactLink = (text) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `Hola, quiero información sobre IPE3. ${text}`
    )}`;
    const card = document.createElement("a");
    card.className = "ipe3-alma__handoff";
    card.href = url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.innerHTML = `
      <span class="ipe3-alma__handoff-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04l-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z"/>
        </svg>
      </span>
      <span class="ipe3-alma__handoff-text">
        <strong>Continuar por WhatsApp</strong>
        <small>El equipo IPE3 te atiende de lunes a viernes.</small>
      </span>
    `;
    messageList.appendChild(card);
    scrollToBottom();
  };

  const addRetry = (text) => {
    const wrapper = document.createElement("div");
    wrapper.className = "ipe3-alma__retry";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Reintentar";
    button.addEventListener("click", () => sendMessage(text));

    wrapper.appendChild(button);
    messageList.appendChild(wrapper);
    scrollToBottom();
  };

  const addTyping = () => {
    const typing = document.createElement("div");
    typing.className = "ipe3-alma__typing";
    typing.id = "ipe3-alma-typing";
    typing.setAttribute("role", "status");
    typing.innerHTML =
      '<span class="ipe3-alma__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      "<em>ALMA está pensando</em>";
    messageList.appendChild(typing);
    scrollToBottom();
    return typing;
  };

  const getHistory = () =>
    chatLog.slice(-MAX_HISTORY).map((item) => ({
      role: item.role,
      content: item.content,
    }));

  const setBusy = (busy) => {
    const sendButton = form.querySelector('button[type="submit"]');
    input.disabled = busy;
    sendButton.disabled = busy;
    sendButton.setAttribute(
      "aria-label",
      busy ? "ALMA está respondiendo" : "Enviar mensaje"
    );
    panel.setAttribute("aria-busy", String(busy));
    setThinking(busy);
  };

  const usedSuggestions = () => {
    const asked = chatLog
      .filter((item) => item.role === "user")
      .map((item) => normalizeSuggestion(item.content));
    return new Set(asked);
  };

  const updateSuggestions = (suggestions) => {
    const container = widget.querySelector(".ipe3-alma__suggestions");
    if (!container) return;

    const asked = usedSuggestions();
    const fresh = (suggestions || []).filter(
      (suggestion) => suggestion && !asked.has(normalizeSuggestion(suggestion))
    );

    container.innerHTML = "";

    if (!fresh.length) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    fresh.forEach((suggestion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-alma-message", suggestion);
      button.textContent = suggestion;
      button.addEventListener("click", () => sendMessage(suggestion));
      container.appendChild(button);
    });
  };

  const requestReply = async (text) => {
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

    const typing = addTyping();
    setBusy(true);

    const controller =
      typeof window.AbortController === "function" ? new window.AbortController() : null;
    const timeoutId = window.setTimeout(() => {
      if (controller) controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        signal: controller ? controller.signal : undefined,
        body: JSON.stringify({
          type: "alma",
          sessionId: sessionId,
          message: text,
          agent: lastAgentId,
          history: getHistory(),
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
      lastAgentId = result.agent || lastAgentId;
      addMessage(result.reply, "assistant", result.agentName);
      if (result.handoff && !handoffShown) {
        addContactLink(text);
        handoffShown = true;
      }
      if (result.suggestions) updateSuggestions(result.suggestions);
    } catch (error) {
      const timedOut = error && (error.name === "AbortError" || error.name === "TimeoutError");
      agentStatus.textContent = timedOut ? "Respuesta lenta" : "Conexión interrumpida";
      onlineStatus.textContent = timedOut ? "Reintentar" : "Sin conexión";
      addMessage(
        timedOut
          ? "ALMA está tardando más de lo normal. Puedes reintentar o continuar por WhatsApp con el equipo IPE3."
          : error instanceof Error
            ? error.message
            : "No se pudo conectar con ALMA. Inténtalo de nuevo o contacta al equipo.",
        "assistant"
      );
      addRetry(text);
      addContactLink(text);
    } finally {
      window.clearTimeout(timeoutId);
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

    addMessage(text, "user");
    input.value = "";
    updateCounter();
    requestReply(text);
  };

  const updateCounter = () => {
    const length = input.value.length;
    if (length > MAX_MESSAGE_LENGTH - 300) {
      counter.hidden = false;
      counter.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;
    } else {
      counter.hidden = true;
      counter.textContent = "";
    }
  };

  chatLog = loadChat();

  if (chatLog.length) {
    renderChat();
  } else {
    addMessage(WELCOME_MESSAGE, "assistant");
  }

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
      scrollToBottom();
      input.focus();
    } else {
      launcher.focus();
    }
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

  resetButton.addEventListener("click", () => {
    chatLog = [];
    lastAgentId = "";
    handoffShown = false;
    messageList.innerHTML = "";
    persistChat();
    addMessage(WELCOME_MESSAGE, "assistant");
    agentStatus.textContent = "Especialistas IPE3 · IA";
    input.value = "";
    updateCounter();
    input.focus();
  });

  launcher.addEventListener("click", () => {
    setOpen(panel.hidden);
  });

  closeButton.addEventListener("click", () => setOpen(false));

  scrollButton.addEventListener("click", scrollToBottom);

  messageList.addEventListener("scroll", () => {
    scrollButton.hidden = isNearBottom();
  });

  input.addEventListener("input", updateCounter);

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