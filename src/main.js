import { faqs as sourceFaqs } from "./data/faqs.js";
import "./styles.css";

const offTopicTerms = [
  "notebook", "notebook lm", "notebooklm", "substack", "twitter", "udemy", "camtasia", "google drive",
  "google's notebooks", "google notebooks", "youtube channel", "youtube description workflow",
  "paid subscription on substack"
];

const zenlerTerms = [
  "zenler", "course", "lesson", "membership", "site", "page", "funnel", "email", "broadcast",
  "automation", "community", "live", "webinar", "class", "booking", "payment", "student",
  "certificate", "domain", "blog", "analytics", "mobile app", "download", "quiz", "survey"
];

function removeSources(value) {
  return value
    .replace(/\sSource:\shttps?:\/\/\S+/g, "")
    .replace(/\shttps?:\/\/\S+/g, "")
    .trim();
}

function isZenlerFaq(faq) {
  const text = `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase();
  const question = faq.question.toLowerCase();
  const hasZenlerSignal = zenlerTerms.some((term) => text.includes(term));
  const isClearlyOffTopic = offTopicTerms.some((term) => question.includes(term) || text.includes(term));
  return hasZenlerSignal && !isClearlyOffTopic;
}

function zenlerizeAnswer(answer) {
  return removeSources(answer)
    .replace(/\bZenler Zoom\b/g, "Zenler Live")
    .replace(/\bZoom cloud recordings\b/gi, "Zenler live-session cloud recordings")
    .replace(/\bpersonal Zoom account\b/gi, "connected live-session account")
    .replace(/\bpaid Zoom account\b/gi, "connected live-session account")
    .replace(/\byour own Zoom account\b/gi, "a connected live-session account")
    .replace(/\bZoom subscription\b/gi, "separate live-session subscription")
    .replace(/\bZoom plan\b/gi, "separate live-session plan")
    .replace(/\bZoom links\b/gi, "Zenler live-session links")
    .replace(/\bZoom link\b/gi, "Zenler live-session link")
    .replace(/\bZoom session\b/gi, "Zenler live session")
    .replace(/\bZoom meeting\b/gi, "Zenler live session")
    .replace(/\bZoom\b/g, "Zenler Live");
}

function zenlerizeQuestion(question) {
  return question
    .replace(/\bZenler Zoom\b/g, "Zenler Live")
    .replace(/\bZoom\b/g, "Zenler Live")
    .replace(/\bNotebook\s*LM\b/gi, "Zenler");
}

const faqs = sourceFaqs
  .filter(isZenlerFaq)
  .map((faq) => ({
    ...faq,
    question: zenlerizeQuestion(faq.question),
    answer: zenlerizeAnswer(faq.answer)
  }));

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from", "how",
  "i", "in", "is", "it", "me", "my", "of", "on", "or", "our", "that", "the", "this", "to",
  "use", "using", "what", "when", "where", "which", "with", "you", "your", "zenler"
]);

const state = {
  activeCategory: "All",
  query: "",
  selected: null,
  isThinking: false
};

const categories = ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))];
const quickQuestions = [
  "Can I drip course content over time?",
  "How do I connect my custom domain?",
  "Can I run live classes or webinars?",
  "What analytics are available?",
  "Can I create memberships in Zenler?"
];

const tokenize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/s$/, ""))
    .filter((word) => word.length > 2 && !stopWords.has(word));

const faqVectors = faqs.map((faq) => {
  const questionTokens = tokenize(faq.question);
  const answerTokens = tokenize(faq.answer);
  return {
    ...faq,
    tokens: [...questionTokens, ...questionTokens, ...answerTokens, ...tokenize(faq.category)]
  };
});

function scoreFaq(faq, query) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return 0;

  const tokenSet = new Set(faq.tokens);
  const exactPhrase = `${faq.question} ${faq.answer}`.toLowerCase().includes(query.toLowerCase().trim()) ? 8 : 0;
  const overlap = queryTokens.reduce((score, token) => score + (tokenSet.has(token) ? 3 : 0), 0);
  const partial = queryTokens.reduce((score, token) => {
    const found = faq.tokens.some((candidate) => candidate.includes(token) || token.includes(candidate));
    return score + (found ? 0.8 : 0);
  }, 0);
  const categoryBoost = state.activeCategory === "All" || state.activeCategory === faq.category ? 1.15 : 0.74;

  return (exactPhrase + overlap + partial) * categoryBoost;
}

function searchFaqs(query) {
  const scoped = state.activeCategory === "All"
    ? faqVectors
    : faqVectors.filter((faq) => faq.category === state.activeCategory);

  if (!query.trim()) return scoped.slice(0, 9);

  return scoped
    .map((faq) => ({ ...faq, score: scoreFaq(faq, query) }))
    .filter((faq) => faq.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9);
}

function isOffPlatformQuery(query) {
  const text = query.toLowerCase();
  return offTopicTerms.some((term) => text.includes(term));
}

function confidence(score = 0) {
  if (score >= 24) return "High match";
  if (score >= 12) return "Good match";
  if (score > 0) return "Related answer";
  return "Browse result";
}

function formatAnswer(answer) {
  return removeSources(answer);
}

function answerIntro(faq) {
  const starts = [
    "I found the closest Zenler FAQ match.",
    "Here is the most relevant support answer.",
    "This looks like the right Zenler guidance."
  ];
  return `${starts[faq.id % starts.length]} ${formatAnswer(faq.answer)}`;
}

function render() {
  const results = searchFaqs(state.query);
  if (!state.selected && results.length) state.selected = results[0];

  document.querySelector("#app").innerHTML = `
    <main class="shell">
      <section class="support-panel">
        <header class="topbar">
          <img class="brand-logo" src="/assets/Logo_Zenler.png" alt="Zenler" />
          <div class="agent-pill" aria-label="Support agent status">
            <span class="status-dot"></span>
            Live FAQ agent
          </div>
        </header>

        <div class="hero-grid">
          <section class="ask-zone" aria-label="Ask a question">
            <p class="eyebrow">Zenler knowledge assistant</p>
            <h1>Ask a Zenler question and get a support-ready answer.</h1>
            <form class="ask-form">
              <label class="sr-only" for="questionInput">Ask a Zenler question</label>
              <textarea id="questionInput" placeholder="Ask about courses, memberships, domains, payments, webinars, analytics..." rows="4">${escapeHtml(state.query)}</textarea>
              <button class="ask-button" type="submit">
                <span>Ask</span>
                <span class="button-spark"></span>
              </button>
            </form>
            <div class="quick-row">
              ${quickQuestions.map((question) => `<button class="quick-chip" type="button" data-query="${escapeHtml(question)}">${question}</button>`).join("")}
            </div>
          </section>

          <section class="answer-card" aria-live="polite">
            <div class="agent-head">
              <div class="agent-avatar">Z</div>
              <div>
                <p>Zenler Support</p>
                <span>${state.isThinking ? "Reviewing FAQ bank" : "Ready with sourced guidance"}</span>
              </div>
            </div>
            ${renderAgentAnswer(state.selected)}
          </section>
        </div>
      </section>

      <section class="workspace">
        <aside class="category-rail" aria-label="FAQ categories">
          ${categories.map((category) => `
            <button class="category-button ${category === state.activeCategory ? "active" : ""}" data-category="${escapeHtml(category)}" type="button">
              <span>${escapeHtml(category)}</span>
              <b>${category === "All" ? faqs.length : faqs.filter((faq) => faq.category === category).length}</b>
            </button>
          `).join("")}
        </aside>

        <section class="results-list" aria-label="FAQ matches">
          <div class="list-header">
            <div>
              <p class="eyebrow">Matched answers</p>
              <h2>${results.length ? `${results.length} best matches` : "No direct matches yet"}</h2>
            </div>
            <a href="/Zenler_FAQ_Content_Analytics_Report.pdf">Analytics PDF</a>
          </div>
          <div class="cards">
            ${results.length ? results.map((faq) => renderResult(faq)).join("") : renderEmpty()}
          </div>
        </section>
      </section>
    </main>
  `;

  attachEvents();
}

function renderAgentAnswer(faq) {
  if (!faq) {
    const offPlatform = state.query.trim() && isOffPlatformQuery(state.query);
    return `
      <div class="thinking-block">
        <span></span><span></span><span></span>
      </div>
      <p class="answer-text">${offPlatform
        ? "I can help with Zenler product and support questions. Try asking about Zenler courses, memberships, live sessions, funnels, email, communities, payments, domains, blogs or analytics."
        : "Ask a Zenler product question to search the FAQ bank."}</p>
    `;
  }

  if (state.isThinking) {
    return `
      <div class="thinking-block">
        <span></span><span></span><span></span>
      </div>
      <div class="process-steps">
        <span>Reading question</span>
        <span>Matching FAQ patterns</span>
        <span>Preparing answer</span>
      </div>
    `;
  }

  return `
    <div class="match-meta">
      <span>${escapeHtml(faq.category)}</span>
      <span>${confidence(faq.score)}</span>
    </div>
    <h2>${escapeHtml(faq.question)}</h2>
    <p class="answer-text">${escapeHtml(answerIntro(faq))}</p>
    <div class="support-actions">
      <button class="ghost-button" type="button" data-query="${escapeHtml(faq.question)}">Ask this again</button>
      <button class="ghost-button" type="button" data-category="${escapeHtml(faq.category)}">View ${escapeHtml(faq.category)}</button>
    </div>
  `;
}

function renderResult(faq) {
  return `
    <article class="result-card ${state.selected?.id === faq.id ? "selected" : ""}" data-id="${faq.id}">
      <div class="result-topline">
        <span>${escapeHtml(faq.category)}</span>
        <b>${confidence(faq.score)}</b>
      </div>
      <h3>${escapeHtml(faq.question)}</h3>
      <p>${escapeHtml(formatAnswer(faq.answer))}</p>
    </article>
  `;
}

function renderEmpty() {
  const offPlatform = state.query.trim() && isOffPlatformQuery(state.query);
  return `
    <div class="empty-state">
      <h3>${offPlatform ? "That is outside the Zenler FAQ scope." : "No FAQ matched that wording."}</h3>
      <p>${offPlatform
        ? "This assistant is intentionally focused on Zenler. Try a Zenler-specific phrase like custom domain, drip lessons, payments, live sessions, funnels or memberships."
        : "Try a shorter phrase like custom domain, drip lessons, payments, live sessions or memberships."}</p>
    </div>
  `;
}

function attachEvents() {
  document.querySelector(".ask-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#questionInput").value.trim();
    askQuestion(input);
  });

  document.querySelector("#questionInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    state.selected = searchFaqs(state.query)[0] || null;
    render();
    document.querySelector("#questionInput").focus();
    document.querySelector("#questionInput").setSelectionRange(state.query.length, state.query.length);
  });

  document.querySelectorAll("[data-query]").forEach((button) => {
    button.addEventListener("click", () => askQuestion(button.dataset.query));
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      state.selected = searchFaqs(state.query)[0] || null;
      render();
    });
  });

  document.querySelectorAll(".result-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selected = faqVectors.find((faq) => faq.id === Number(card.dataset.id));
      state.isThinking = false;
      render();
    });
  });
}

function askQuestion(query) {
  state.query = query;
  state.isThinking = true;
  state.selected = null;
  render();

  window.setTimeout(() => {
    const results = searchFaqs(state.query);
    state.selected = results[0] || null;
    state.isThinking = false;
    render();
  }, 850);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

render();
