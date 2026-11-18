import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const config = window.IPE3_REWARDS_CONFIG || {};
const authPanel = document.getElementById("auth-panel");
const consentPanel = document.getElementById("consent-panel");
const memberPanel = document.getElementById("member-panel");
const adminPanel = document.getElementById("admin-panel");
const accountStatus = document.getElementById("account-status");
const memberStatus = document.getElementById("member-status");
const adminStatus = document.getElementById("admin-status");
const verificationActions = document.getElementById("verification-actions");
const googleSignInButton = document.getElementById("google-sign-in");
let auth = null;
let currentUser = null;

function setStatus(element, message, isError) {
  element.textContent = message || "";
  element.classList.toggle("error", Boolean(isError));
}

function showFirebaseError(error) {
  const messages = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/invalid-email": "El correo no tiene un formato válido.",
    "auth/network-request-failed": "No hay conexión. Revisa internet e inténtalo otra vez.",
    "auth/operation-not-allowed": "Ese método de ingreso aún no está habilitado en Firebase.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar el ingreso.",
    "auth/unauthorized-domain": "Este dominio aún no está autorizado en la configuración Firebase.",
    "auth/weak-password": "La contraseña debe tener al menos 8 caracteres.",
  };
  return messages[error.code] || error.message || "No se pudo completar la operación.";
}

function setAccountMode(mode) {
  const isRegister = mode === "register";
  document.getElementById("login-form").hidden = isRegister;
  document.getElementById("register-form").hidden = !isRegister;
  document.getElementById("show-login").classList.toggle("active", !isRegister);
  document.getElementById("show-register").classList.toggle("active", isRegister);
  setStatus(accountStatus, "", false);
}

function isConfigurationReady() {
  const firebase = config.firebase || {};
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
  return Boolean(
    config.apiUrl &&
    /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(config.apiUrl) &&
    requiredKeys.every((key) => firebase[key] && !firebase[key].startsWith("REEMPLAZAR"))
  );
}

async function postRewards(action, values) {
  const user = currentUser;
  if (!user) throw new Error("Inicia sesión para continuar.");
  if (!config.apiUrl) throw new Error("Falta configurar el enlace de Apps Script.");

  const response = await fetch(config.apiUrl, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      type: "rewards",
      action: action,
      idToken: await user.getIdToken(),
      ...values,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "No se pudo consultar el programa de recompensas.");
  }
  return result;
}

function renderHistory(history) {
  const rows = document.getElementById("history-rows");
  rows.replaceChildren();
  document.getElementById("empty-history").hidden = history.length > 0;

  for (const item of history) {
    const row = document.createElement("tr");
    const values = [
      item.date,
      item.type === "ACUMULACION" ? `Pago confirmado · ${item.contract}` : "Canje de mantenimiento",
      item.type === "ACUMULACION" ? `+${item.points}` : `-${item.points}`,
      item.status,
    ];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value || "";
      row.appendChild(cell);
    }
    rows.appendChild(row);
  }
}

function renderRewards(rewards) {
  document.getElementById("available-points").textContent = rewards.availablePoints;
  document.getElementById("earned-points").textContent = rewards.totalEarned;
  document.getElementById("redeemed-points").textContent = rewards.totalRedeemed;
  document.getElementById("request-redemption").disabled = rewards.availablePoints < 50;
  renderHistory(rewards.history);
}

function renderMembers(members) {
  const select = document.getElementById("contract-member");
  select.replaceChildren();
  const prompt = document.createElement("option");
  prompt.value = "";
  prompt.textContent = "Selecciona un cliente";
  prompt.disabled = true;
  prompt.selected = true;
  select.appendChild(prompt);

  for (const member of members) {
    const option = document.createElement("option");
    option.value = member.uid;
    option.textContent = `${member.email} · ${member.pointsBalance} puntos`;
    select.appendChild(option);
  }
}

function renderRedemptions(redemptions) {
  const container = document.getElementById("pending-redemptions");
  container.replaceChildren();
  document.getElementById("empty-redemptions").hidden = redemptions.length > 0;

  for (const redemption of redemptions) {
    const item = document.createElement("article");
    item.className = "admin-request";
    const info = document.createElement("div");
    const email = document.createElement("strong");
    email.textContent = redemption.email;
    const date = document.createElement("p");
    date.textContent = `${redemption.date} · ${redemption.points} puntos`;
    const description = document.createElement("p");
    description.textContent = redemption.detail;
    info.append(email, date, description);

    const actions = document.createElement("div");
    actions.className = "admin-request-actions";
    actions.append(
      makeDecisionButton(redemption.id, "APROBADO", "Aprobar"),
      makeDecisionButton(redemption.id, "RECHAZADO", "Rechazar", true)
    );
    item.append(info, actions);
    container.appendChild(item);
  }
}

function makeDecisionButton(redemptionId, decision, label, isDanger) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isDanger ? "button button-danger" : "button";
  button.textContent = label;
  button.addEventListener("click", async () => {
    button.disabled = true;
    setStatus(adminStatus, "Actualizando la solicitud...", false);
    try {
      await postRewards("resolveRedemption", { redemptionId, decision });
      await refreshAccount();
      setStatus(adminStatus, decision === "APROBADO" ? "Canje aprobado." : "Canje rechazado.", false);
    } catch (error) {
      setStatus(adminStatus, showFirebaseError(error), true);
      button.disabled = false;
    }
  });
  return button;
}

async function refreshAccount() {
  const user = currentUser;
  if (!user) return;
  const result = await postRewards("dashboard");
  if (!currentUser || currentUser.uid !== user.uid) return;
  if (result.consentRequired) {
    authPanel.hidden = true;
    consentPanel.hidden = false;
    memberPanel.hidden = true;
    adminPanel.hidden = true;
    return;
  }
  consentPanel.hidden = true;
  document.getElementById("member-email").textContent = result.profile.email;
  renderRewards(result.rewards);
  authPanel.hidden = true;
  memberPanel.hidden = false;
  adminPanel.hidden = !result.isAdmin;

  if (result.isAdmin) {
    const admin = await postRewards("adminDashboard");
    if (!currentUser || currentUser.uid !== user.uid) return;
    renderMembers(admin.members);
    renderRedemptions(admin.pendingRedemptions);
  }
}

async function handleAuthenticatedUser(user) {
  currentUser = user;
  if (!user) {
    currentUser = null;
    authPanel.hidden = false;
    consentPanel.hidden = true;
    memberPanel.hidden = true;
    adminPanel.hidden = true;
    verificationActions.hidden = true;
    setStatus(accountStatus, "", false);
    return;
  }

  if (!user.emailVerified) {
    authPanel.hidden = false;
    consentPanel.hidden = true;
    memberPanel.hidden = true;
    adminPanel.hidden = true;
    verificationActions.hidden = false;
    setStatus(accountStatus, "Verifica tu correo electrónico para activar la cuenta.", false);
    return;
  }

  verificationActions.hidden = true;
  setStatus(accountStatus, "", false);
  authPanel.hidden = true;
  memberPanel.hidden = false;
  setStatus(memberStatus, "Cargando tus puntos...", false);
  try {
    await refreshAccount();
    setStatus(memberStatus, "", false);
  } catch (error) {
    setStatus(memberStatus, showFirebaseError(error), true);
  }
}

async function refreshAdmin() {
  setStatus(adminStatus, "Actualizando...", false);
  try {
    const result = await postRewards("adminDashboard");
    renderMembers(result.members);
    renderRedemptions(result.pendingRedemptions);
    setStatus(adminStatus, "Información actualizada.", false);
  } catch (error) {
    setStatus(adminStatus, showFirebaseError(error), true);
  }
}

document.getElementById("show-login").addEventListener("click", () => setAccountMode("login"));
document.getElementById("show-register").addEventListener("click", () => setAccountMode("register"));
document.getElementById("accept-terms").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const consent = document.getElementById("terms-consent");
  if (!consent.checked) {
    setStatus(document.getElementById("consent-status"), "Marca la casilla para continuar.", true);
    return;
  }

  button.disabled = true;
  setStatus(document.getElementById("consent-status"), "Guardando tu aceptación...", false);
  try {
    await postRewards("acceptTerms", { accepted: true });
    await refreshAccount();
  } catch (error) {
    setStatus(document.getElementById("consent-status"), showFirebaseError(error), true);
  } finally {
    button.disabled = false;
  }
});

document.getElementById("consent-sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    setStatus(document.getElementById("consent-status"), showFirebaseError(error), true);
  }
});

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setStatus(accountStatus, "Ingresando...", false);
  try {
    await signInWithEmailAndPassword(auth, form.get("email"), form.get("password"));
  } catch (error) {
    setStatus(accountStatus, showFirebaseError(error), true);
  }
});

document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setStatus(accountStatus, "Creando cuenta...", false);
  try {
    const credential = await createUserWithEmailAndPassword(auth, form.get("email"), form.get("password"));
    await updateProfile(credential.user, { displayName: form.get("name") });
    await sendEmailVerification(credential.user);
    setStatus(accountStatus, "Revisa tu correo y confirma la cuenta para empezar a acumular puntos.", false);
  } catch (error) {
    setStatus(accountStatus, showFirebaseError(error), true);
  }
});

document.getElementById("reset-password").addEventListener("click", async () => {
  const email = document.querySelector('#login-form input[name="email"]').value.trim();
  if (!email) {
    setStatus(accountStatus, "Escribe tu correo para enviarte el enlace de recuperación.", true);
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    setStatus(accountStatus, "Si existe una cuenta con ese correo, recibirás instrucciones para recuperar el acceso.", false);
  } catch (error) {
    setStatus(accountStatus, showFirebaseError(error), true);
  }
});

document.getElementById("resend-verification").addEventListener("click", async () => {
  if (!currentUser) return;
  try {
    await sendEmailVerification(currentUser);
    setStatus(accountStatus, "Enviamos otro correo de verificación.", false);
  } catch (error) {
    setStatus(accountStatus, showFirebaseError(error), true);
  }
});

document.getElementById("check-verification").addEventListener("click", async () => {
  if (!currentUser) return;
  try {
    await currentUser.reload();
    if (currentUser.emailVerified) {
      await handleAuthenticatedUser(currentUser);
    } else {
      setStatus(accountStatus, "Aún no aparece la verificación. Abre el enlace del correo y vuelve a intentar.", false);
    }
  } catch (error) {
    setStatus(accountStatus, showFirebaseError(error), true);
  }
});

googleSignInButton.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  setStatus(accountStatus, "Conectando con Google...", false);
  try {
    if (matchMedia("(max-width: 720px)").matches) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    setStatus(accountStatus, showFirebaseError(error), true);
  }
});

document.getElementById("sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    setStatus(memberStatus, showFirebaseError(error), true);
  }
});

document.getElementById("request-redemption").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  setStatus(memberStatus, "Enviando solicitud de canje...", false);
  try {
    const result = await postRewards("requestRedemption");
    setStatus(memberStatus, result.message, false);
    await refreshAccount();
  } catch (error) {
    setStatus(memberStatus, showFirebaseError(error), true);
    button.disabled = false;
  }
});

document.getElementById("award-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const contractDate = new Date(form.get("contractDate"));
  if (Number.isNaN(contractDate.getTime())) {
    setStatus(adminStatus, "Ingresa una fecha y hora válida.", true);
    return;
  }
  const button = formElement.querySelector('button[type="submit"]');
  button.disabled = true;
  setStatus(adminStatus, "Validando contrato y pago...", false);
  try {
    const result = await postRewards("awardContract", {
      uid: form.get("uid"),
      contractCode: form.get("contractCode"),
      contractTimestamp: contractDate.getTime(),
      paidAmount: form.get("paidAmount"),
    });
    setStatus(adminStatus, `Pago confirmado. Se acreditaron ${result.points} puntos.`, false);
    formElement.elements.contractCode.value = "";
    formElement.elements.contractDate.value = "";
    formElement.elements.paidAmount.value = "";
    await refreshAccount();
  } catch (error) {
    setStatus(adminStatus, showFirebaseError(error), true);
  } finally {
    button.disabled = false;
  }
});

document.getElementById("refresh-admin").addEventListener("click", refreshAdmin);

if (!isConfigurationReady()) {
  setStatus(
    accountStatus,
    "El registro aún no está activado. Configura Firebase y publica el servicio de recompensas siguiendo las instrucciones del repositorio.",
    true
  );
  document.querySelectorAll(
    "#login-form button, #register-form button, #login-form input, #register-form input, #google-sign-in"
  ).forEach((control) => {
    control.disabled = true;
  });
} else {
  try {
    const app = initializeApp(config.firebase);
    auth = getAuth(app);
    auth.languageCode = "es";
    getRedirectResult(auth).catch((error) => setStatus(accountStatus, showFirebaseError(error), true));
    onAuthStateChanged(auth, handleAuthenticatedUser);
  } catch (error) {
    setStatus(accountStatus, showFirebaseError(error), true);
  }
}
