// ===================== Diagnostic IA — logique & rendu =====================

// URL du Google Apps Script Web App (à remplacer une fois déployé — voir GOOGLE_SHEETS_SETUP.md)
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyG1KRvxbnak_nozYsVKHzfMMEqD6x2Ey29VOTwAe3u6apPMEa7HL075b3RDS3GbmPt_w/exec";

const QUESTIONS = [
  {
    key: "activite",
    label: "Quel est votre type d'activité ?",
    multi: false,
    options: ["Freelance", "Agence", "E-commerce", "PME", "SaaS", "Startup", "Autre"],
  },
  {
    key: "taille",
    label: "Combien de personnes travaillent dans votre entreprise ?",
    multi: false,
    options: ["Seul", "2 à 5", "6 à 10", "11 à 20", "20+"],
  },
  {
    key: "perteTemps",
    label: "Où perdez-vous le plus de temps ?",
    sub: "Plusieurs réponses possibles",
    multi: true,
    options: ["Emails", "SAV", "Création de contenu", "Devis / Propositions", "Prospection", "Reporting", "Administration", "Gestion des commandes", "Réunions", "Autre"],
  },
  {
    key: "process",
    label: "Vos process sont-ils documentés ?",
    multi: false,
    options: ["Aucun", "Quelques-uns", "La plupart", "Tout est documenté"],
  },
  {
    key: "usageIA",
    label: "À quel point utilisez-vous l'IA dans votre business aujourd'hui ?",
    multi: false,
    options: ["Jamais", "Occasionnellement", "Tous les jours"],
  },
  {
    key: "objectif",
    label: "Quel est votre objectif principal ?",
    multi: false,
    options: ["Gagner du temps", "Réduire les erreurs", "Automatiser les tâches", "Structurer l'entreprise", "Développer le chiffre d'affaires"],
  },
  {
    key: "souhait",
    label: "Si vous pouviez récupérer une seule chose immédiatement, laquelle choisiriez-vous ?",
    multi: false,
    options: ["15 heures par semaine", "Des process plus clairs", "Une équipe plus productive", "Plus aucune tâche répétitive"],
  },
];

const TOTAL_STEPS = QUESTIONS.length; // 7 questions, puis étape lead, puis résultat

const state = {
  step: 0, // 0..6 = questions, 7 = lead form, 8 = résultats
  answers: {},
  lead: { prenom: "", email: "", telephone: "" },
};

const app = document.getElementById("diag-app");

function currentAnswer(key) {
  return state.answers[key];
}

function isAnswered(q) {
  const a = state.answers[q.key];
  return q.multi ? Array.isArray(a) && a.length > 0 : !!a;
}

function toggleOption(q, option) {
  if (q.multi) {
    const current = state.answers[q.key] || [];
    const idx = current.indexOf(option);
    if (idx === -1) current.push(option);
    else current.splice(idx, 1);
    state.answers[q.key] = current;
  } else {
    state.answers[q.key] = option;
  }
  updateOptionsUI(q);
}

function updateOptionsUI(q) {
  const answer = currentAnswer(q.key);
  app.querySelectorAll(".diag-option").forEach((btn) => {
    const selected = q.multi ? (answer || []).includes(btn.dataset.option) : answer === btn.dataset.option;
    btn.classList.toggle("diag-option--selected", selected);
  });
  const nextBtn = document.getElementById("diag-next");
  if (nextBtn) nextBtn.disabled = !isAnswered(q);
}

function renderQuestionStep() {
  const qIndex = state.step;
  const q = QUESTIONS[qIndex];
  const progress = Math.round(((qIndex + 1) / (TOTAL_STEPS + 1)) * 100);
  const answer = currentAnswer(q.key);
  const answered = isAnswered(q);

  const optionsHtml = q.options
    .map((opt) => {
      const selected = q.multi ? (answer || []).includes(opt) : answer === opt;
      return `
        <button type="button" class="diag-option${selected ? " diag-option--selected" : ""}" data-option="${escapeAttr(opt)}">
          <span class="diag-option-check" aria-hidden="true"></span>
          <span class="diag-option-label">${opt}</span>
        </button>
      `;
    })
    .join("");

  app.innerHTML = `
    <div class="diag-step diag-fade-in">
      <div class="diag-progress-meta">Question ${qIndex + 1} / ${TOTAL_STEPS}</div>
      <div class="diag-progress-wrap">
        <div class="diag-progress-bar"><div class="diag-progress-fill" style="width:${progress}%"></div></div>
        <div class="diag-progress-pct">${progress}%</div>
      </div>
      ${qIndex > 0 ? `<button type="button" class="diag-back-inline" id="diag-prev"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg> Retour</button>` : ""}
      <h1 class="diag-question">${q.label}</h1>
      ${q.sub ? `<p class="diag-sub">${q.sub}</p>` : ""}
      <div class="diag-options">${optionsHtml}</div>
      <div class="diag-actions">
        <button type="button" class="btn btn-accent btn-lg diag-next" id="diag-next" ${answered ? "" : "disabled"}>
          Suivant
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
        </button>
      </div>
    </div>
  `;

  app.querySelectorAll(".diag-option").forEach((btn) => {
    btn.addEventListener("click", () => toggleOption(q, btn.dataset.option));
  });
  const prevBtn = document.getElementById("diag-prev");
  if (prevBtn) prevBtn.addEventListener("click", goPrev);
  document.getElementById("diag-next").addEventListener("click", goNext);
}

const COUNTRY_CODES = [
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+352", label: "🇱🇺 +352" },
  { code: "+1", label: "🇨🇦 +1" },
  { code: "+212", label: "🇲🇦 +212" },
  { code: "+213", label: "🇩🇿 +213" },
  { code: "+216", label: "🇹🇳 +216" },
  { code: "+221", label: "🇸🇳 +221" },
  { code: "+225", label: "🇨🇮 +225" },
  { code: "+971", label: "🇦🇪 +971" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS_REGEX = /^[1-9]\d{6,11}$/; // 7 à 12 chiffres, sans le 0 initial ni l'indicatif

function renderLeadStep() {
  const dial = state.lead.dial || "+33";
  app.innerHTML = `
    <div class="diag-step diag-fade-in">
      <button type="button" class="diag-back-inline" id="diag-prev"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg> Retour</button>
      <h1 class="diag-question diag-question--lg">Recevez votre diagnostic personnalisé</h1>
      <p class="diag-sub diag-sub--lg">Indiquez vos coordonnées pour débloquer votre résultat personnalisé.</p>

      <form id="diag-lead-form" class="diag-lead-form" novalidate>
        <div class="diag-field">
          <label for="diag-prenom">Prénom</label>
          <input type="text" id="diag-prenom" name="prenom" class="diag-input" placeholder="Ton prénom" required value="${escapeAttr(state.lead.prenom)}">
          <span class="diag-error" id="diag-prenom-error"></span>
        </div>
        <div class="diag-field">
          <label for="diag-email">Email</label>
          <input type="email" id="diag-email" name="email" class="diag-input" placeholder="Adresse mail" required value="${escapeAttr(state.lead.email)}">
          <span class="diag-error" id="diag-email-error"></span>
        </div>
        <div class="diag-field">
          <label for="diag-tel">Téléphone / WhatsApp</label>
          <div class="diag-phone-row">
            <select id="diag-dial" name="dial" class="diag-input diag-dial-select">
              ${COUNTRY_CODES.map((c) => `<option value="${c.code}" ${c.code === dial ? "selected" : ""}>${c.label}</option>`).join("")}
            </select>
            <input type="tel" id="diag-tel" name="telephone" class="diag-input" placeholder="6 12 34 56 78" inputmode="numeric" required value="${escapeAttr(state.lead.telephoneLocal || "")}">
          </div>
          <span class="diag-error" id="diag-tel-error"></span>
        </div>
        <div class="diag-actions">
          <button type="submit" class="btn btn-accent btn-lg diag-next" id="diag-submit">
            Voir mon résultat
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
          </button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("diag-prev").addEventListener("click", goPrev);
  document.getElementById("diag-lead-form").addEventListener("submit", onLeadSubmit);
}

function setFieldError(fieldId, message) {
  const errorEl = document.getElementById(`${fieldId}-error`);
  const inputEl = document.getElementById(fieldId === "diag-tel" ? "diag-tel" : fieldId);
  if (errorEl) errorEl.textContent = message || "";
  if (inputEl) inputEl.classList.toggle("diag-input--invalid", !!message);
}

function onLeadSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const prenom = form.prenom.value.trim();
  const email = form.email.value.trim();
  const dial = form.dial.value;
  const telephoneLocal = form.telephone.value.trim();
  const phoneDigits = telephoneLocal.replace(/\D/g, "").replace(/^0+/, "");

  let hasError = false;

  if (!prenom) {
    setFieldError("diag-prenom", "Indique ton prénom.");
    hasError = true;
  } else {
    setFieldError("diag-prenom", "");
  }

  if (!EMAIL_REGEX.test(email)) {
    setFieldError("diag-email", "Indique une adresse email valide.");
    hasError = true;
  } else {
    setFieldError("diag-email", "");
  }

  if (!PHONE_DIGITS_REGEX.test(phoneDigits)) {
    setFieldError("diag-tel", "Indique un numéro de téléphone valide.");
    hasError = true;
  } else {
    setFieldError("diag-tel", "");
  }

  if (hasError) return;

  const telephone = `${dial} ${phoneDigits}`;
  state.lead = { prenom, email, dial, telephoneLocal, telephone };

  const submitBtn = document.getElementById("diag-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Calcul en cours...";

  const result = computeResult();
  sendLeadToSheet(result).finally(() => {
    state.result = result;
    state.step = TOTAL_STEPS + 1;
    render();
  });
}

function computeResult() {
  const a = state.answers;
  let score = 10;

  const processScore = { "Aucun": 25, "Quelques-uns": 17, "La plupart": 8, "Tout est documenté": 2 };
  score += processScore[a.process] || 0;

  const iaScore = { "Jamais": 25, "Occasionnellement": 15, "Tous les jours": 7 };
  score += iaScore[a.usageIA] || 0;

  const perte = Array.isArray(a.perteTemps) ? a.perteTemps.length : 0;
  score += Math.min(perte * 4, 24);

  const objectifBoost = { "Automatiser les tâches": 10, "Gagner du temps": 9, "Structurer l'entreprise": 7, "Réduire les erreurs": 6, "Développer le chiffre d'affaires": 5 };
  score += objectifBoost[a.objectif] || 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let hoursRange = "5 à 8 heures par semaine";
  if (score >= 80) hoursRange = "15 à 20 heures par semaine";
  else if (score >= 60) hoursRange = "10 à 15 heures par semaine";
  else if (score >= 40) hoursRange = "8 à 12 heures par semaine";

  return { score, hoursRange };
}

function sendLeadToSheet(result) {
  if (!SHEET_WEBHOOK_URL || SHEET_WEBHOOK_URL.indexOf("REMPLACE_PAR") === 0) {
    return Promise.resolve();
  }
  const a = state.answers;
  const payload = {
    date: new Date().toISOString(),
    prenom: state.lead.prenom,
    email: state.lead.email,
    telephone: state.lead.telephone,
    activite: a.activite || "",
    taille: a.taille || "",
    perteTemps: Array.isArray(a.perteTemps) ? a.perteTemps.join(", ") : "",
    process: a.process || "",
    usageIA: a.usageIA || "",
    objectif: a.objectif || "",
    souhait: a.souhait || "",
    score: result.score,
    heuresGagnables: result.hoursRange,
  };

  return fetch(SHEET_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("Erreur d'envoi vers Google Sheets :", err);
  });
}

function renderResultStep() {
  const r = state.result || computeResult();

  app.innerHTML = `
    <div class="diag-step diag-fade-in diag-result-step">
      <div class="diag-score-circle">
        <span class="diag-score-num">${r.score}</span>
        <span class="diag-score-max">/100</span>
      </div>
      <p class="diag-result-lead">
        Votre entreprise pourrait probablement économiser entre <strong>${r.hoursRange}</strong> grâce à une meilleure organisation, des automatisations et des assistants IA.
      </p>

      <div class="final-cta diag-final-cta">
        <div class="final-cta-glow" aria-hidden="true"></div>
        <div class="final-cta-content">
          <h2 class="final-cta-title diag-final-cta-title">Prêt à passer au <span class="hl-text">niveau supérieur</span> ?</h2>
          <a href="https://www.cal.eu/mikhael-5kbnzs/30min" target="_blank" rel="noopener" class="btn btn-accent btn-xl">
            Réserver un appel découverte
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
          </a>
          <a href="/#prestations" class="text-link text-link--center diag-secondary-link">Découvrir mes prestations</a>
        </div>
      </div>
    </div>
  `;
}

function goNext() {
  if (state.step < TOTAL_STEPS - 1) {
    state.step += 1;
  } else {
    state.step = TOTAL_STEPS; // -> lead form
  }
  render();
}

function goPrev() {
  if (state.step > 0) {
    state.step -= 1;
    render();
  }
}

function escapeAttr(str) {
  return String(str || "").replace(/"/g, "&quot;");
}

function render() {
  if (state.step < TOTAL_STEPS) renderQuestionStep();
  else if (state.step === TOTAL_STEPS) renderLeadStep();
  else renderResultStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

render();
