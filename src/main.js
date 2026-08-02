import { faqs as sourceFaqs } from "./data/faqs.js";
import { productKnowledge } from "./data/productKnowledge.js";
import "./styles.css";

const offTopicTerms = [
  "notebook", "notebook lm", "notebooklm", "substack", "twitter", "udemy", "camtasia", "google drive",
  "google's notebooks", "google notebooks", "youtube channel", "youtube description workflow",
  "paid subscription on substack", "which ai model", "ai model should", "chatgpt", "gemini"
];

const zenlerTerms = [
  "zenler", "course", "lesson", "membership", "site", "page", "funnel", "email", "broadcast",
  "automation", "community", "live", "webinar", "class", "booking", "payment", "student",
  "certificate", "domain", "blog", "analytics", "mobile app", "download", "quiz", "survey"
];

const timestampPattern = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
const emojiPattern = /[\p{Extended_Pictographic}\uFE0F]/gu;
const transcriptNoisePattern = /^use the relevant zenler settings for this workflow\.?\s*/i;

function removeSources(value) {
  return value
    .replace(/\sSource:\shttps?:\/\/\S+/g, "")
    .replace(/\shttps?:\/\/\S+/g, "")
    .trim();
}

function cleanDisplayText(value) {
  return removeSources(value)
    .replace(emojiPattern, "")
    .replace(/^[-\s:|]*(?:\d+\.)?\s*/, "")
    .replace(new RegExp(`^\\s*${timestampPattern.source}\\s*[-–—:]?\\s*`, "i"), "")
    .replace(timestampPattern, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanQuestion(value) {
  return cleanDisplayText(value)
    .replace(/^question\s*[-:]?\s*/i, "")
    .replace(/\s+\?/g, "?")
    .trim();
}

function cleanAnswer(value) {
  return cleanDisplayText(value)
    .replace(transcriptNoisePattern, "")
    .replace(/\s+\?/g, "?")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function isZenlerFaq(faq) {
  const text = `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase();
  const question = faq.question.toLowerCase();
  const hasZenlerSignal = zenlerTerms.some((term) => text.includes(term));
  const isClearlyOffTopic = offTopicTerms.some((term) => question.includes(term) || text.includes(term));
  const cleanedAnswer = cleanAnswer(faq.answer);
  const isNoisyTranscript = transcriptNoisePattern.test(faq.answer) && cleanedAnswer.length < 140;
  return hasZenlerSignal && !isClearlyOffTopic && !isNoisyTranscript && cleanedAnswer.length > 35;
}

function zenlerizeAnswer(answer) {
  return cleanAnswer(answer)
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
  return cleanQuestion(question)
    .replace(/\bZenler Zoom\b/g, "Zenler Live")
    .replace(/\bZoom\b/g, "Zenler Live")
    .replace(/\bNotebook\s*LM\b/gi, "Zenler");
}

const refinedFaqs = sourceFaqs
  .filter(isZenlerFaq)
  .map((faq) => ({
    ...faq,
    question: zenlerizeQuestion(faq.question),
    answer: zenlerizeAnswer(faq.answer)
  }));

const faqs = [
  ...productKnowledge.map((item) => ({ ...item, curated: true })),
  ...refinedFaqs
];

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from", "how",
  "i", "in", "is", "it", "me", "my", "of", "on", "or", "our", "that", "the", "this", "to",
  "use", "using", "what", "when", "where", "which", "with", "you", "your", "zenler"
]);

const state = {
  activeCategory: "All",
  query: "",
  selected: null,
  isThinking: false,
  resultLimit: 9
};

const categories = ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))];
const quickQuestions = [
  "What marketing tools does Zenler have?",
  "Can I drip course content over time?",
  "How do I connect my custom domain?",
  "Can I run live classes or webinars?",
  "Can I create memberships in Zenler?"
];

const relatedGuideIds = {
  "product-marketing-tools": ["product-funnels", "product-email-automations", "product-blog-seo", "product-communities", "product-lives"],
  "product-drip-courses": ["product-memberships", "product-email-automations"],
  "product-lives": ["product-zenler-live-zoom", "product-communities", "product-email-automations"],
  "product-zenler-live-zoom": ["product-lives"],
  "product-memberships": ["product-communities", "product-email-automations", "product-monetisation"],
  "product-funnels": ["product-marketing-tools", "product-email-automations", "product-blog-seo"],
  "product-blog-seo": ["product-marketing-tools", "product-funnels", "product-email-automations"],
  "product-communities": ["product-memberships", "product-lives", "product-email-automations"],
  "product-email-automations": ["product-marketing-tools", "product-funnels", "product-memberships"],
  "product-monetisation": ["product-memberships", "product-funnels", "product-email-automations"]
};

const knownFeatureAliases = [
  "marketing", "marketing tools", "tools", "features",
  "zoom", "zenler live", "live", "webinar", "webinars", "live class", "live classes",
  "course", "courses", "membership", "memberships", "community", "communities",
  "funnel", "funnels", "marketing funnel", "email", "emails", "broadcast", "broadcasts",
  "automation", "automations", "blog", "blogs", "seo", "domain", "custom domain",
  "payment", "payments", "coupon", "coupons", "affiliate", "analytics", "mobile app",
  "download", "downloads", "quiz", "quizzes", "survey", "surveys", "certificate", "certificates",
  "booking", "bookings", "coaching", "drip", "pricing", "subscription", "bundle", "bundles"
];

const productIntentRoutes = [
  { id: "product-marketing-tools", pattern: /\b(marketing tools|marketing toolkit|promote|promotion tools)\b/i },
  { id: "product-zenler-live-zoom", pattern: /\b(zoom|built[-\s]?in zoom)\b/i },
  { id: "product-drip-courses", pattern: /\b(drip|scheduled content|release content)\b/i },
  { id: "product-communities", pattern: /\b(community|communities|discussion|discussions)\b/i },
  { id: "product-memberships", pattern: /\b(membership|memberships|member-only|member only)\b/i },
  { id: "product-funnels", pattern: /\b(funnel|funnels|landing page|opt[-\s]?in|lead magnet)\b/i },
  { id: "product-blog-seo", pattern: /\b(blog|blogs|blogging|seo|sitemap|search)\b/i },
  { id: "product-email-automations", pattern: /\b(email|emails|broadcast|broadcasts|newsletter|automation|automations|sequence|tagging|tags)\b/i },
  { id: "product-lives", pattern: /\b(live class|live classes|webinar|webinars|interactive webinar|live stream|booking|bookings|coaching call)\b/i },
  { id: "product-monetisation", pattern: /\b(payment|payments|checkout|coupon|coupons|pricing|subscription|sell|selling|monetise|monetize)\b/i }
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
  const keywordTokens = tokenize((faq.keywords || []).join(" "));
  return {
    ...faq,
    tokens: [
      ...questionTokens,
      ...questionTokens,
      ...answerTokens,
      ...keywordTokens,
      ...keywordTokens,
      ...keywordTokens,
      ...tokenize(faq.category)
    ]
  };
});

function scoreFaq(faq, query) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return 0;

  const tokenSet = new Set(faq.tokens);
  const cleanQuery = query.toLowerCase().trim();
  const questionText = faq.question.toLowerCase();
  const combinedText = `${faq.question} ${faq.answer}`.toLowerCase();
  const exactQuestion = questionText === cleanQuery ? 32 : 0;
  const exactPhrase = combinedText.includes(cleanQuery) ? 10 : 0;
  const overlap = queryTokens.reduce((score, token) => score + (tokenSet.has(token) ? 3 : 0), 0);
  const partial = queryTokens.reduce((score, token) => {
    const found = faq.tokens.some((candidate) => candidate.includes(token) || token.includes(candidate));
    return score + (found ? 0.8 : 0);
  }, 0);
  const categoryBoost = state.activeCategory === "All" || state.activeCategory === faq.category ? 1.15 : 0.74;
  const curatedBoost = faq.curated ? productGuideBoost(faq, queryTokens, query) : 1;
  const coverage = queryTokens.filter((token) => tokenSet.has(token)).length / Math.max(queryTokens.length, 1);
  const coverageBoost = coverage >= 0.8 ? 1.25 : coverage >= 0.5 ? 1 : 0.62;

  return (exactQuestion + exactPhrase + overlap + partial) * categoryBoost * curatedBoost * coverageBoost;
}

function productGuideBoost(faq, queryTokens, query) {
  const queryText = query.toLowerCase();
  const routedIntent = productIntentRoutes.find((route) => route.pattern.test(query));
  if (routedIntent && faq.id !== routedIntent.id) return 0.08;

  const keywordMatches = (faq.keywords || []).filter((keyword) => {
    const keywordText = keyword.toLowerCase();
    return queryText.includes(keywordText) || keywordText.split(/\s+/).some((part) => queryTokens.includes(part));
  }).length;
  const broadCapabilityQuestion = /\b(what|which|have|include|tools|features|platform|all-in-one|can zenler|does zenler)\b/i.test(query);
  const marketingIntent = /\b(marketing|promote|sell|lead|sales|funnel|audience|grow)\b/i.test(query);
  const asksForGeneralToolset = /\b(marketing tools|tools|features|platform|all-in-one|toolkit|what can|what does zenler do)\b/i.test(query);

  if (!keywordMatches && !asksForGeneralToolset) return 0.12;

  let boost = 0.9;
  if (routedIntent?.id === faq.id) boost += 5.5;
  if (keywordMatches) boost += Math.min(keywordMatches, 5) * 0.55;
  if (broadCapabilityQuestion && keywordMatches) boost += 0.8;
  if (marketingIntent && faq.id === "product-marketing-tools") boost += 2.2;
  if (asksForGeneralToolset && faq.id === "product-marketing-tools") boost += 1.2;
  return boost;
}

function getAllMatches(query) {
  if (isOffPlatformQuery(query)) return [];
  if (isUnknownFeatureQuery(query)) return [];

  const scoped = state.activeCategory === "All"
    ? faqVectors
    : faqVectors.filter((faq) => faq.category === state.activeCategory);

  if (!query.trim()) return scoped;

  return scoped
    .map((faq) => ({ ...faq, score: scoreFaq(faq, query) }))
    .filter((faq) => faq.score >= minimumScoreForQuery(query, faq))
    .sort((a, b) => b.score - a.score);
}

function isUnknownFeatureQuery(query) {
  const text = query.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
  const featureQuestion = /\b(does|do|can)\s+zenler\s+(have|include|support|do|run|offer)\b/.test(text);
  if (!featureQuestion) return false;
  return !knownFeatureAliases.some((alias) => text.includes(alias));
}

function minimumScoreForQuery(query, faq) {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;
  if (faq.curated) return 8;
  return tokens.length <= 2 ? 7 : 10;
}

function searchFaqs(query) {
  return getAllMatches(query).slice(0, state.resultLimit);
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
  if (faq.curated) {
    return formatAnswer(faq.answer);
  }

  return formatAnswer(faq.answer);
}

function render() {
  const allResults = getAllMatches(state.query);
  const results = allResults.slice(0, state.resultLimit);
  const hasMoreResults = allResults.length > results.length;
  if (!state.query.trim() && !state.isThinking) {
    state.selected = null;
  } else if (!results.some((faq) => String(faq.id) === String(state.selected?.id))) {
    state.selected = results[0] || null;
  }

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
            <h1 class="zen-hero-title">ALL-IN-ONE ONLINE COURSE PLATFORM TO CREATE, SELL AND GROW</h1>
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
            ${renderAgentAnswer(state.selected, results)}
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
              <h2>${allResults.length ? `${Math.min(results.length, allResults.length)} of ${allResults.length} best matches` : "No direct matches yet"}</h2>
            </div>
          </div>
          <div class="cards">
            ${results.length ? results.map((faq) => renderResult(faq)).join("") : renderEmpty()}
          </div>
          ${hasMoreResults ? `
            <div class="lazy-load-zone" data-lazy-load="true">
              <span></span>
              <button class="load-more-button" type="button">Load more answers</button>
            </div>
          ` : ""}
        </section>
      </section>
    </main>
  `;

  attachEvents();
}

function renderAgentAnswer(faq, results = []) {
  if (!faq) {
    const offPlatform = state.query.trim() && isOffPlatformQuery(state.query);
    const isInitial = !state.query.trim() && !state.isThinking;
    return `
      ${isInitial ? `<div class="match-meta"><span>Zenler FAQ Assistant</span><span>Ready</span></div><h2>ASK A QUESTION</h2>` : `
        <div class="thinking-block">
          <span></span><span></span><span></span>
        </div>
      `}
      <p class="answer-text">${offPlatform
        ? "I can help with Zenler product and support questions. Try asking about Zenler courses, memberships, live sessions, funnels, email, communities, payments, domains, blogs or analytics."
        : isInitial
          ? "Type a Zenler question on the left and I will search the FAQ bank, product knowledge vault, support resources and tutorial links to give you the best support-ready answer. You can ask about courses, memberships, marketing funnels, blogs, communities, live sessions, email, automations, payments, domains, analytics and more."
          : "I do not have a strong enough Zenler FAQ match for that wording. Try asking it more specifically, for example with the feature name, page area, or workflow you are using."}</p>
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
      <span>${faq.curated ? "Product guide" : confidence(faq.score)}</span>
    </div>
    <p class="qa-label">Question</p>
    <h2>${escapeHtml(faq.question)}</h2>
    <p class="qa-label">Answer</p>
    <p class="answer-text">${escapeHtml(answerIntro(faq))}</p>
    ${renderResources(faq)}
    ${renderRelatedQuickAnswers(faq, results)}
    <div class="support-actions">
      <button class="ghost-button" type="button" data-query="${escapeHtml(faq.question)}">Ask this again</button>
      <button class="ghost-button" type="button" data-category="${escapeHtml(faq.category)}">View ${escapeHtml(faq.category)}</button>
    </div>
  `;
}

function renderRelatedQuickAnswers(faq, results) {
  const preferredIds = relatedGuideIds[faq.id] || [];
  const preferred = preferredIds
    .map((id) => faqVectors.find((item) => String(item.id) === String(id)))
    .filter(Boolean);
  const sameCategory = results
    .filter((item) => String(item.id) !== String(faq.id))
    .filter((item) => item.category === faq.category)
    .filter((item) => !faq.curated || item.curated);
  const fallback = faq.curated || preferredIds.length
    ? []
    : results.filter((item) => String(item.id) !== String(faq.id));
  const seen = new Set([String(faq.id)]);
  const related = [...preferred, ...sameCategory, ...fallback]
    .filter((item) => {
      const id = String(item.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, 3);

  if (!related.length) return "";

  return `
    <div class="related-answers">
      <p>Related quick answers</p>
      ${related.map((item) => `
        <button class="related-answer" type="button" data-query="${escapeHtml(item.question)}">
          <span>${escapeHtml(item.category)}</span>
          <b>${escapeHtml(item.question)}</b>
        </button>
      `).join("")}
    </div>
  `;
}

function renderResult(faq) {
  return `
    <article class="result-card ${state.selected?.id === faq.id ? "selected" : ""}" data-id="${faq.id}">
      <div class="result-topline">
        <span>${escapeHtml(faq.category)}</span>
        <b>${faq.curated ? "Product guide" : confidence(faq.score)}</b>
      </div>
      <h3>${escapeHtml(faq.question)}</h3>
      <p>${escapeHtml(formatAnswer(faq.answer))}</p>
    </article>
  `;
}

function renderResources(faq) {
  if (!faq.resources?.length) return "";
  return `
    <div class="resource-links">
      ${faq.resources.slice(0, 4).map((resource) => `
        <a href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">${escapeHtml(resource.title)}</a>
      `).join("")}
    </div>
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
    state.resultLimit = 9;
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
      state.resultLimit = 9;
      state.selected = searchFaqs(state.query)[0] || null;
      render();
    });
  });

  document.querySelectorAll(".result-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selected = faqVectors.find((faq) => String(faq.id) === card.dataset.id);
      state.isThinking = false;
      render();
    });
  });

  document.querySelector(".load-more-button")?.addEventListener("click", () => {
    loadMoreResults();
  });

  const lazyZone = document.querySelector("[data-lazy-load='true']");
  if (lazyZone && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadMoreResults();
      }
    }, { rootMargin: "220px 0px" });
    observer.observe(lazyZone);
  }
}

function askQuestion(query) {
  state.query = query;
  state.isThinking = true;
  state.selected = null;
  state.resultLimit = 9;
  render();

  window.setTimeout(() => {
    const results = searchFaqs(state.query);
    state.selected = results[0] || null;
    state.isThinking = false;
    render();
  }, 850);
}

function loadMoreResults() {
  state.resultLimit += 9;
  render();
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
