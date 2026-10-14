/**
 * Official BookLeaf Publishing Knowledge Base & Tone Guidelines
 * Extracted directly from BookLeaf Technical Assignment specification
 */

const KNOWLEDGE_BASE = {
  company: {
    name: "BookLeaf Publishing",
    overview: "BookLeaf Publishing is a self-publishing company operating in India and the US, processing 1,200+ books monthly across a catalog of 22,000+ titles.",
    packages: [
      { name: "Standard Free", description: "No upfront cost" },
      { name: "Bestseller Breakthrough", description: "Premium, paid package with marketing and distribution add-ons" }
    ],
    services: ["Cover design", "Typesetting", "ISBN assignment", "Printing", "Distribution", "Royalty management"],
    facilities: "In-house printing facility and warehouse located in Delhi. Print partners include Repro India and Epitome Books."
  },

  royaltyPolicy: {
    split: "80/20 royalty split: 80% of net profit per book goes to author, 20% to BookLeaf.",
    netProfitFormula: "Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.",
    payoutCycle: "Royalties are calculated quarterly and paid within 45 days of the quarter ending.",
    minimumThreshold: 1000,
    thresholdRule: "Minimum payout threshold: ₹1,000. If accumulated royalties are below ₹1,000, they roll over to the next quarter.",
    payoutMethod: "Bank transfer to the account linked in the author's dashboard.",
    dashboardTransparency: "Authors can view a detailed royalty breakdown in their dashboard, showing sales figures per platform."
  },

  isbnPolicy: {
    assignment: "Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf registered under BookLeaf's publisher imprint.",
    customImprint: "If an author wants an ISBN under their own imprint, they need to obtain it independently.",
    errorHandling: "If an author reports an ISBN error (duplicate, wrong book linked), it is treated as a high-priority issue and escalated immediately to the production team with a 48-hour resolution timeline."
  },

  printingAndQuality: {
    printers: "In-house printing handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.",
    turnaround: "Standard print turnaround: 5–7 business days from order confirmation.",
    qualityResolution: "If an author reports a quality issue (misprints, binding defects, color inconsistency), BookLeaf arranges a free reprint after verification upon receiving defect photos. Reprint turnaround: 5–7 business days."
  },

  distributionAndAvailability: {
    platforms: ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"],
    liveTurnaround: "New listings typically go live within 7–10 business days after publication is complete.",
    stockSyncIssue: "If a book is showing as 'Currently Unavailable' on a platform, it usually indicates a stock sync issue. BookLeaf's team triggers a re-sync with the distribution team within 24–48 hours for it to go live again."
  },

  productionStages: {
    stages: [
      "Manuscript Received",
      "Editing (if opted)",
      "Cover Design",
      "Typesetting",
      "Proofreading",
      "ISBN Assignment",
      "Printing",
      "Distribution Setup",
      "Published & Live"
    ],
    updates: "Authors are updated at each stage via email.",
    commonDelays: "Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds)."
  },

  categories: [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry"
  ],

  toneGuidelines: [
    "Always empathetic and professional. Authors are our partners, not customers to be managed.",
    "Acknowledge the author's concern before jumping to solutions.",
    "Be specific: include actual numbers, dates, and statuses wherever possible rather than vague reassurances.",
    "If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.",
    "If the issue requires escalation or investigation, give a clear timeline (e.g. 'Our team will look into this and get back to you within 48 hours') rather than open-ended promises.",
    "Always end with a clear next step for the author and/or the BookLeaf team."
  ]
};

module.exports = KNOWLEDGE_BASE;
