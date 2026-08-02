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
const transcriptDerivedPatterns = [
  /\b(i am|i'm|i was|i had|i have|i want|i need|i think|i don't|i can't|i realized|i realise|my client|my daughter)\b/i,
  /\b(let me|gonna|wanna|yeah|uh|um|sorry,|oh,|no, no|link in chat|in the chat|facebook group)\b/i,
  /\b(you can you can|and and|the the|to to|that that|this this|it it|what i|when i|if i)\b/i,
  /\b(notebook\s*lm|notebookllm|substack|twitter|google notebooks|google's notebooks|youtube channel)\b/i,
  /,\?/,
  /^(and|but|because|with|that|if|no|now|sorry)\b/i
];

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
  return hasZenlerSignal
    && !isClearlyOffTopic
    && !isNoisyTranscript
    && !isTranscriptDerivedFaq(faq)
    && cleanedAnswer.length > 35;
}

function isTranscriptDerivedFaq(faq) {
  const answer = cleanAnswer(faq.answer);
  const text = `${faq.question} ${answer}`;
  const numericId = Number(faq.id);
  const knownTranscriptBatch = Number.isFinite(numericId) && numericId >= 49 && numericId < 186;
  const startsLikeTranscript = /^[a-z]/.test(answer) && !/^(yes|no|go to|use|open|create|add|set|check|confirm|review)\b/i.test(answer);
  const firstPersonMatches = answer.match(/\b(i|i'm|i've|i'd|me|my|mine)\b/gi) || [];
  const secondPersonTranscript = answer.match(/\byou\b/gi) || [];
  const repeatedFiller = /\b(\w+)\s+\1\b/i.test(answer);

  return knownTranscriptBatch
    || transcriptDerivedPatterns.some((pattern) => pattern.test(text))
    || startsLikeTranscript
    || firstPersonMatches.length >= 2
    || (firstPersonMatches.length >= 1 && secondPersonTranscript.length >= 4)
    || repeatedFiller;
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
  draftQuery: "",
  selected: null,
  isThinking: false,
  isListening: false,
  resultLimit: 9
};

let speechRecognition = null;

const categories = ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))];
const quickQuestions = [
  "What marketing tools does Zenler have?",
  "Can I drip course content over time?",
  "How do I connect my custom domain?",
  "Can I run live classes or webinars?",
  "Can I create memberships in Zenler?"
];

const relatedGuideIds = {
  "product-zenler-overview": ["product-marketing-tools", "product-drip-courses", "product-lives"],
  "product-marketing-tools": ["product-funnels", "product-email-automations", "product-blog-seo", "product-communities", "product-lives"],
  "product-drip-courses": ["product-memberships", "product-email-automations"],
  "product-lives": ["product-zenler-live-zoom", "product-communities", "product-email-automations"],
  "product-zenler-live-zoom": ["product-lives"],
  "product-memberships": ["product-communities", "product-email-automations", "product-monetisation"],
  "product-funnels": ["product-marketing-tools", "product-email-automations", "product-blog-seo"],
  "product-blog-seo": ["product-marketing-tools", "product-funnels", "product-email-automations"],
  "product-communities": ["product-memberships", "product-lives", "product-email-automations"],
  "product-email-automations": ["product-marketing-tools", "product-funnels", "product-memberships"],
  "product-quizzes-surveys": ["product-drip-courses", "product-email-automations"],
  "product-monetisation": ["product-memberships", "product-funnels", "product-email-automations"],
  "product-pricing-plans": ["product-monetisation", "product-marketing-tools", "product-lives"],
  "product-resources": ["product-drip-courses", "product-marketing-tools", "product-lives"]
};

const resourceSuggestions = [
  {
    pattern: /\b(course|courses|lesson|lessons|drip|certificate|curriculum|student|students|quiz|quizzes|survey|surveys)\b/i,
    resources: [
      { title: "Courses support collection", url: "https://support.newzenler.com/en/collections/4027752-courses" },
      { title: "The Complete Guide to Zenler", url: "https://tutorials.newzenler.com/courses/the-complete-guide-to-zenler" },
      { title: "Quick Start Guide", url: "https://tutorials.newzenler.com/courses/zenler-quick-start-guide-for-beginners" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(funnel|funnels|landing page|opt-in|lead magnet|sales page|checkout|campaign)\b/i,
    resources: [
      { title: "Marketing Funnels support collection", url: "https://support.newzenler.com/en/collections/4027689-marketing-funnels" },
      { title: "Zenler Sales Funnel Software", url: "https://www.newzenler.com/features/sales-funnel-software" },
      { title: "Marketing Funnel tutorial course", url: "https://tutorials.newzenler.com/courses/creating-a-marketing-funnel-and-marketing-it-for-leads-and-sales-conversions" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(email|emails|broadcast|broadcasts|newsletter|automation|automations|sequence|tag|tags|mail)\b/i,
    resources: [
      { title: "Email Broadcasts support collection", url: "https://support.newzenler.com/en/collections/4027749-email-broadcasts" },
      { title: "Zenler Business Automations", url: "https://www.newzenler.com/features/automate-your-business" },
      { title: "Zenler Email Marketing 2026", url: "https://www.newzenler.com/blog/zenler-email-marketing-2026" },
      { title: "3 Day Email Marketing Bootcamp", url: "https://tutorials.newzenler.com/courses/3-day-email-challenge" }
    ]
  },
  {
    pattern: /\b(live|lives|webinar|webinars|zoom|class|classes|booking|bookings|coaching|stream|streams|one-to-one|121)\b/i,
    resources: [
      { title: "Live support collection", url: "https://support.newzenler.com/en/collections/3591863-live" },
      { title: "Zenler Lives complete guide", url: "https://www.newzenler.com/blog/zenler-lives-complete-guide-webinars-one-to-one-bookings-recurring-sessions-zoom-integration" },
      { title: "Zenler Virtual Classroom Software", url: "https://www.newzenler.com/features/virtual-classroom-software" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(community|communities|discussion|member|members|membership|memberships|subscription|recurring)\b/i,
    resources: [
      { title: "Communities support collection", url: "https://support.newzenler.com/en/collections/1697651-communities" },
      { title: "Zenler Membership Site Software", url: "https://www.newzenler.com/features/membership-site-software" },
      { title: "Zenler Communities Explained", url: "https://www.newzenler.com/blog/zenler-communities-explained-when-to-use-public-private-secret-course-discussions" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(blog|blogs|seo|sitemap|search|google|traffic|article|articles|content)\b/i,
    resources: [
      { title: "Zenler Blogging Platform", url: "https://www.newzenler.com/features/blogging-platform" },
      { title: "Zenler Blog", url: "https://www.newzenler.com/blog" },
      { title: "Get More Traffic to Your Zenler Blog and Site", url: "https://tutorials.newzenler.com/courses/get-more-traffic-to-your-zenler-blog-and-site" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(domain|domains|custom domain|site|website|page|builder|ssl|dns|dmarc)\b/i,
    resources: [
      { title: "Site support collection", url: "https://support.newzenler.com/en/collections/4027754-site" },
      { title: "Zenler Website Builder", url: "https://www.newzenler.com/features/website-builder" },
      { title: "The Complete Guide to Zenler", url: "https://tutorials.newzenler.com/courses/the-complete-guide-to-zenler" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(payment|payments|pricing|price|plans|checkout|coupon|coupons|affiliate|sell|selling|sales|digital product|downloads)\b/i,
    resources: [
      { title: "Zenler Pricing", url: "https://www.newzenler.com/pricing" },
      { title: "Zenler Online Payments", url: "https://www.newzenler.com/features/sell-online" },
      { title: "Sell Digital Products With Zenler 2026", url: "https://www.newzenler.com/blog/sell-digital-products-with-zenler-2026" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(learn|training|tutorial|tutorials|quick start|complete guide|accelerator|60-day|60 day|onboarding|resources)\b/i,
    resources: [
      { title: "Quick Start Guide", url: "https://tutorials.newzenler.com/courses/zenler-quick-start-guide-for-beginners" },
      { title: "The Complete Guide to Zenler", url: "https://tutorials.newzenler.com/courses/the-complete-guide-to-zenler" },
      { title: "60-Day Accelerator Program", url: "https://tutorials.newzenler.com/f/free-user-get-started-quick-with-us" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  },
  {
    pattern: /\b(analytics|reports|reporting|dashboard|video analytics|progress|metrics)\b/i,
    resources: [
      { title: "Zenler Course Analytics", url: "https://www.newzenler.com/features/course-analytics" },
      { title: "Zenler support center", url: "https://support.newzenler.com/en/" },
      { title: "The Complete Guide to Zenler", url: "https://tutorials.newzenler.com/courses/the-complete-guide-to-zenler" },
      { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
    ]
  }
];

const defaultResources = [
  { title: "Zenler support center", url: "https://support.newzenler.com/en/" },
  { title: "The Complete Guide to Zenler", url: "https://tutorials.newzenler.com/courses/the-complete-guide-to-zenler" },
  { title: "Zenler Blog", url: "https://www.newzenler.com/blog" },
  { title: "Zenler YouTube training", url: "https://www.youtube.com/@zenler" }
];

const knownFeatureAliases = [
  "zenler", "all in one", "all-in-one", "platform", "overview", "marketing", "marketing tools", "tools", "features",
  "zoom", "zenler live", "live", "webinar", "webinars", "live class", "live classes",
  "course", "courses", "membership", "memberships", "community", "communities",
  "funnel", "funnels", "marketing funnel", "email", "emails", "broadcast", "broadcasts",
  "automation", "automations", "blog", "blogs", "seo", "domain", "custom domain",
  "payment", "payments", "coupon", "coupons", "affiliate", "analytics", "mobile app",
  "download", "downloads", "quiz", "quizzes", "survey", "surveys", "certificate", "certificates",
  "booking", "bookings", "coaching", "drip", "pricing", "price", "prices", "plan", "plans",
  "starter", "pro", "premium", "subscription", "bundle", "bundles", "learn", "training",
  "tutorial", "tutorials", "quick start", "complete guide", "accelerator"
];

const productIntentRoutes = [
  { id: "product-zenler-overview", pattern: /\b(what is zenler|what's zenler|what does zenler do|explain zenler|zenler overview|all[-\s]?in[-\s]?one platform|online course platform)\b/i },
  { id: "product-pricing-plans", pattern: /\b(pricing|price|prices|plans|starter|pro|premium|cost|allowances|limits|transaction fees)\b/i },
  { id: "product-zenler-live-zoom", pattern: /\b(zoom|built[-\s]?in zoom|enterprise[-\s]?level zoom|no zoom subscription|121|one[-\s]?to[-\s]?one|charge for live|charge for zoom)\b/i },
  { id: "product-resources", pattern: /\b(learn zenler|learning zenler|training|tutorial|tutorials|quick start|complete guide|accelerator|60[-\s]?day|where should i start|how do i learn|how can i learn|learn the platform)\b/i },
  { id: "product-marketing-tools", pattern: /\b(marketing tools|marketing toolkit|promote|promotion tools)\b/i },
  { id: "product-drip-courses", pattern: /\b(drip|scheduled content|release content)\b/i },
  { id: "product-communities", pattern: /\b(community|communities|discussion|discussions)\b/i },
  { id: "product-memberships", pattern: /\b(membership|memberships|member-only|member only)\b/i },
  { id: "product-funnels", pattern: /\b(funnel|funnels|landing page|opt[-\s]?in|lead magnet)\b/i },
  { id: "product-blog-seo", pattern: /\b(blog|blogs|blogging|seo|sitemap|search)\b/i },
  { id: "product-email-automations", pattern: /\b(email|emails|broadcast|broadcasts|newsletter|automation|automations|sequence|tagging|tags)\b/i },
  { id: "product-quizzes-surveys", pattern: /\b(quiz|quizzes|survey|surveys|assessment|passing score)\b/i },
  { id: "product-lives", pattern: /\b(live class|live classes|webinar|webinars|interactive webinar|live stream|booking|bookings|coaching call)\b/i },
  { id: "product-monetisation", pattern: /\b(payment|payments|checkout|coupon|coupons|subscription|sell|selling|monetise|monetize)\b/i }
];

function getProductIntent(query) {
  return productIntentRoutes.find((route) => route.pattern.test(query));
}

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
    questionTokens,
    categoryTokens: tokenize(faq.category),
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
  const questionTokenSet = new Set(faq.questionTokens || []);
  const categoryTokenSet = new Set(faq.categoryTokens || []);
  const cleanQuery = query.toLowerCase().trim();
  const questionText = faq.question.toLowerCase();
  const combinedText = `${faq.question} ${faq.answer}`.toLowerCase();
  const exactQuestion = questionText === cleanQuery ? 32 : 0;
  const exactPhrase = combinedText.includes(cleanQuery) ? 10 : 0;
  const overlap = queryTokens.reduce((score, token) => score + (tokenSet.has(token) ? 3 : 0), 0);
  const questionOverlap = queryTokens.reduce((score, token) => score + (questionTokenSet.has(token) ? 1 : 0), 0);
  const categoryOverlap = queryTokens.reduce((score, token) => score + (categoryTokenSet.has(token) ? 1 : 0), 0);
  const titleCategoryBoost = 1 + Math.min(questionOverlap * 0.22 + categoryOverlap * 0.28, 1.1);
  const partial = queryTokens.reduce((score, token) => {
    const found = faq.tokens.some((candidate) => candidate.includes(token) || token.includes(candidate));
    return score + (found ? 0.8 : 0);
  }, 0);
  const categoryBoost = state.activeCategory === "All" || state.activeCategory === faq.category ? 1.15 : 0.74;
  const curatedBoost = faq.curated ? productGuideBoost(faq, queryTokens, query) : 1;
  const coverage = queryTokens.filter((token) => tokenSet.has(token)).length / Math.max(queryTokens.length, 1);
  const coverageBoost = coverage >= 0.8 ? 1.25 : coverage >= 0.5 ? 1 : 0.62;

  if (!faq.curated && queryTokens.length <= 3 && questionOverlap === 0 && categoryOverlap === 0) {
    return 0;
  }

  return (exactQuestion + exactPhrase + overlap + partial) * categoryBoost * curatedBoost * coverageBoost * titleCategoryBoost;
}

function productGuideBoost(faq, queryTokens, query) {
  const queryText = query.toLowerCase();
  const routedIntent = getProductIntent(query);
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
  const routedIntent = getProductIntent(query);

  const scoped = state.activeCategory === "All"
    ? faqVectors
    : faqVectors.filter((faq) => faq.category === state.activeCategory);

  if (!query.trim()) return scoped;

  const bankMatches = scoped
    .filter((faq) => !faq.curated)
    .map((faq) => ({ ...faq, score: scoreFaq(faq, query) }))
    .filter((faq) => faq.score >= minimumScoreForQuery(query, faq))
    .sort((a, b) => b.score - a.score);

  const productMatch = routedIntent
    ? scoped
      .filter((faq) => faq.curated && faq.id === routedIntent.id)
      .map((faq) => ({ ...faq, score: Math.max(scoreFaq(faq, query), 64) }))
      .filter((faq) => faq.score >= minimumScoreForQuery(query, faq))
    : [];

  if (productMatch.length && isProductGuideQuestion(query, routedIntent.id)) {
    return [...productMatch, ...bankMatches];
  }

  // The refined FAQ bank is authoritative for specific support questions. Product
  // guides handle broad feature intent and fill gaps when no strong FAQ exists.
  if (bankMatches[0]?.score >= authoritativeFaqScore(query)) {
    return bankMatches;
  }

  return [...productMatch, ...bankMatches].sort((a, b) => b.score - a.score);
}

function isProductGuideQuestion(query, routeId) {
  const text = query.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
  const asksIfZenlerHasFeature = /\b(does|do|can)\s+(?:i\s+)?zenler\s+(have|include|support|offer|run|do|create|make)\b/.test(text);
  const asksWhatZenlerHas = /\bwhat\s+.*\b(zenler|tools|features|platform|plans|pricing|price)\b.*\b(have|include|offer|do|work|cost|are|is)?\b/.test(text);
  const asksHowFeatureWorks = /\bhow\s+(?:do|does|can|would|should)\b.*\b(work|create|make|use|run|set up|setup|sell|charge)\b/.test(text);
  const asksSubscription = /\b(do i need|need a|separate)\b.*\b(subscription|zoom)\b/.test(text);
  const explicitPricing = routeId === "product-pricing-plans" && /\b(pricing|price|prices|plans|starter|pro|premium|cost)\b/.test(text);
  const explicitMarketing = routeId === "product-marketing-tools" && /\b(marketing tools|marketing toolkit|what marketing)\b/.test(text);
  const explicitOverview = routeId === "product-zenler-overview" && /\b(what is zenler|what does zenler do|explain zenler|overview|all in one|all-in-one|platform)\b/.test(text);
  const explicitZoom = routeId === "product-zenler-live-zoom" && /\b(zoom|one to one|121|charge for live|charge for zoom|enterprise level)\b/.test(text);
  const explicitQuiz = routeId === "product-quizzes-surveys" && /\b(quiz|quizzes|survey|surveys)\b/.test(text);
  const explicitLearning = routeId === "product-resources" && /\b(learn|training|tutorial|tutorials|quick start|complete guide|accelerator|60 day|where should i start)\b/.test(text);

  return asksIfZenlerHasFeature || asksWhatZenlerHas || asksHowFeatureWorks || asksSubscription
    || explicitPricing || explicitMarketing || explicitOverview || explicitZoom || explicitQuiz || explicitLearning;
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

function authoritativeFaqScore(query) {
  const tokens = tokenize(query);
  return tokens.length <= 2 ? 14 : 18;
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
              <div class="question-input-wrap">
                <textarea id="questionInput" placeholder="Ask about courses, memberships, domains, payments, webinars, analytics..." rows="4">${escapeHtml(state.draftQuery)}</textarea>
                <button class="voice-button" type="button" data-voice-input aria-label="${state.isListening ? "Stop voice typing" : "Voice type question"}" title="${state.isListening ? "Stop voice typing" : "Voice type question"}" aria-pressed="${state.isListening ? "true" : "false"}">
                  <span class="mic-icon" aria-hidden="true"></span>
                </button>
              </div>
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
          ? "Type a Zenler question on the left and I will search the refined FAQ bank, product knowledge vault, support resources and official Zenler pages to give you the best support-ready answer. You can ask about courses, memberships, marketing funnels, blogs, communities, live sessions, email, automations, payments, domains, analytics and more."
          : "I do not have a strong enough Zenler FAQ match for that wording. Try asking it more specifically with the feature name, page area, or workflow you are using. If you still need help, contact support@zenler.com."}</p>
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
  const resources = getResourcesForFaq(faq);
  if (!resources.length) return "";
  return `
    <div class="resource-links">
      <p>Useful resources</p>
      ${resources.slice(0, 6).map((resource) => {
        const url = safeResourceUrl(resource.url);
        if (!url) return "";
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.title)}</a>`;
      }).join("")}
    </div>
  `;
}

function getResourcesForFaq(faq) {
  const text = `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase();
  const suggested = resourceSuggestions
    .filter((group) => group.pattern.test(text))
    .flatMap((group) => group.resources);
  const seen = new Set();

  return [...(faq.resources || []), ...suggested, ...defaultResources]
    .filter((resource) => {
      const url = safeResourceUrl(resource.url);
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function safeResourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function renderEmpty() {
  const offPlatform = state.query.trim() && isOffPlatformQuery(state.query);
  return `
    <div class="empty-state">
      <h3>${offPlatform ? "That is outside the Zenler FAQ scope." : "No FAQ matched that wording."}</h3>
      <p>${offPlatform
        ? "This assistant is intentionally focused on Zenler. Try a Zenler-specific phrase like custom domain, drip lessons, payments, live sessions, funnels or memberships. For support, contact support@zenler.com."
        : "Try a shorter phrase like custom domain, drip lessons, payments, live sessions or memberships. If you still need help, contact support@zenler.com."}</p>
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
    state.draftQuery = event.target.value;
  });

  document.querySelector("[data-voice-input]")?.addEventListener("click", toggleVoiceInput);

  document.querySelectorAll("[data-query]").forEach((button) => {
    button.addEventListener("click", () => {
      const fromAnswerCard = Boolean(button.closest(".answer-card"));
      askQuestion(button.dataset.query, { scrollTo: fromAnswerCard ? "answer" : null });
    });
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const fromAnswerCard = Boolean(button.closest(".answer-card"));
      state.activeCategory = button.dataset.category;
      state.resultLimit = 9;
      state.selected = searchFaqs(state.query)[0] || null;
      render();
      if (fromAnswerCard) {
        scheduleScrollTo("results");
      }
    });
  });

  document.querySelectorAll(".result-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selected = faqVectors.find((faq) => String(faq.id) === card.dataset.id);
      state.isThinking = false;
      render();
      scheduleScrollTo("answer", { mobileOnly: true });
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

function askQuestion(query, options = {}) {
  state.query = query;
  state.draftQuery = query;
  state.isThinking = true;
  state.selected = null;
  state.resultLimit = 9;
  render();

  window.setTimeout(() => {
    const results = searchFaqs(state.query);
    state.selected = results[0] || null;
    state.isThinking = false;
    render();
    if (options.scrollTo) {
      scheduleScrollTo(options.scrollTo);
    }
  }, 850);
}

function scheduleScrollTo(target, options = {}) {
  const { mobileOnly = false } = options;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (mobileOnly && window.matchMedia("(min-width: 681px)").matches) return;
      const selector = target === "results" ? ".workspace" : ".answer-card";
      const element = document.querySelector(selector);
      if (!element) return;
      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

function toggleVoiceInput() {
  if (state.isListening) {
    speechRecognition?.stop();
    return;
  }

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    window.alert("Voice typing is not available in this browser. You can still type your question and click Ask.");
    return;
  }

  speechRecognition = new Recognition();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = true;
  speechRecognition.lang = "en-GB";
  let finalTranscript = state.draftQuery.trim();

  speechRecognition.onresult = (event) => {
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();
      if (event.results[index].isFinal) {
        finalTranscript = [finalTranscript, transcript].filter(Boolean).join(" ").trim();
      } else {
        interimTranscript = transcript;
      }
    }

    state.draftQuery = [finalTranscript, interimTranscript].filter(Boolean).join(" ").trim();
    const input = document.querySelector("#questionInput");
    if (input) {
      input.value = state.draftQuery;
      input.focus();
    }
  };

  speechRecognition.onerror = () => {
    state.isListening = false;
    render();
  };

  speechRecognition.onend = () => {
    state.isListening = false;
    render();
  };

  state.isListening = true;
  render();
  try {
    speechRecognition.start();
  } catch (error) {
    state.isListening = false;
    render();
  }
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
