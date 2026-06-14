// src/lib/insights-data.ts

export type ArticleCategory = "Market" | "AI & Tech" | "Sustainability" | "Operations";
export type ArticleColor = "cyan" | "indigo" | "teal" | "emerald" | "amber";
export type ArticleSection = { heading?: string; paragraphs: string[] };
export type ArticleAuthor = { name: string; role: string };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  date: string;
  readMin: number;
  color: ArticleColor;
  author: ArticleAuthor;
  featured?: boolean;
  body: ArticleSection[];
};

export const ARTICLES: Article[] = [
  {
    slug: "predictive-etas-replacing-static-schedules",
    title: "Why predictive ETAs are replacing static schedules in 2026",
    excerpt:
      "The shift from published timetables to live, confidence-scored arrivals is reshaping how shippers plan inventory and cash flow.",
    category: "AI & Tech",
    date: "Jun 4, 2026",
    readMin: 6,
    color: "cyan",
    featured: true,
    author: { name: "Arjun Mehta", role: "Head of AI" },
    body: [
      {
        paragraphs: [
          "For decades, a shipping schedule was a promise printed in advance and quietly broken in transit. A vessel left with a published arrival date, and everyone downstream — warehouses, factories, finance teams — planned against a number that stopped being true the moment the weather turned. The industry learned to absorb the gap with buffer stock, expedited freight, and apologetic emails.",
          "Predictive ETAs invert that model. Instead of a fixed date, you get a live estimate with a confidence score that updates as conditions change — and that small shift rewrites how a supply chain plans.",
        ],
      },
      {
        heading: "From a date to a distribution",
        paragraphs: [
          "A static ETA is a single point. A predictive ETA is a range with a probability attached: not \"arrives the 14th,\" but \"arrives the 14th, 82% confidence, with port congestion the main risk.\" That lets planners make decisions proportional to certainty — hold inventory when confidence is high, pre-stage a reroute when it isn't.",
          "The inputs are no longer just the carrier's plan. Live vessel positions, port dwell times, berth availability, and weather all feed the estimate, and the model reweighs them continuously.",
        ],
      },
      {
        heading: "What it changes downstream",
        paragraphs: [
          "When arrivals carry confidence scores, working capital stops hiding in safety stock. Inventory can be timed to the actual curve of risk instead of the worst case, and cash that used to sit in buffer inventory goes back to work.",
          "The teams that benefit most aren't the ones with the most data — they're the ones who let the estimate drive the decision instead of treating it as a footnote.",
        ],
      },
    ],
  },
  {
    slug: "red-sea-volatility-resilient-lanes",
    title: "Red Sea volatility: building resilience into your lanes",
    excerpt:
      "A practical framework for pricing risk and pre-staging reroutes before disruption hits.",
    category: "Market",
    date: "May 28, 2026",
    readMin: 5,
    color: "indigo",
    author: { name: "Rachel Donovan", role: "Chief Operations Officer" },
    body: [
      {
        paragraphs: [
          "Every few months, a chokepoint reminds the industry that a handful of narrow waterways carry an outsized share of global trade. When one of them becomes unreliable, the response that matters isn't the announcement — it's the lane plan that was already sitting in a drawer, ready to go.",
          "Resilience isn't a single reroute decision made under pressure. It's a standing posture: routes pre-qualified, costs pre-modeled, and trigger points agreed before anyone needs them.",
        ],
      },
      {
        heading: "Price the alternative before you need it",
        paragraphs: [
          "The expensive part of a disruption is rarely the diversion itself — it's the scramble to figure out, in real time, what the diversion costs and who absorbs it. Shippers that already have a costed alternative route, even a rough one, can make a decision in hours instead of days.",
          "That means treating a handful of secondary lanes as live options, not theoretical ones: known transit times, known capacity constraints, known cost deltas versus the primary route, refreshed on a regular cadence rather than dug up from scratch when the primary route closes.",
        ],
      },
      {
        heading: "Set trigger points, not just contingency plans",
        paragraphs: [
          "A contingency plan that only activates when someone notices a problem is too slow. The more useful version is a set of trigger points — transit delay thresholds, insurance cost movements, capacity utilization on the primary lane — that prompt a pre-agreed action automatically.",
          "This turns a disruption response from a meeting into a checklist. The lane shift happens because a threshold was crossed, not because a committee finally convened.",
        ],
      },
      {
        heading: "Diversify without overpaying for it",
        paragraphs: [
          "Resilience has a cost, and the temptation is to either ignore it (single-lane dependency) or overpay for it (running parallel capacity that mostly sits idle). The middle ground is a primary lane sized for normal volume plus a thin, continuously-used secondary lane that keeps its cost structure current.",
          "When the secondary lane is already moving real freight at low volume, switching more volume onto it during a disruption is an incremental decision, not a cold start.",
        ],
      },
    ],
  },
  {
    slug: "green-corridors-scaling",
    title: "Green corridors are finally scaling — here's what it means",
    excerpt:
      "Low-emission lanes are moving from pilot to mainstream. The cost gap is closing fast.",
    category: "Sustainability",
    date: "May 21, 2026",
    readMin: 4,
    color: "emerald",
    author: { name: "Rachel Donovan", role: "Chief Operations Officer" },
    body: [
      {
        paragraphs: [
          "For years, a \"green corridor\" meant a single pilot route, a press release, and a price premium that made it a marketing line item rather than a logistics strategy. That's changing. As lower-emission fuel availability and port-side infrastructure mature on more routes, the premium for choosing the cleaner lane is shrinking — and in some cases disappearing for shippers who can be flexible on timing.",
          "What used to be a sustainability add-on is becoming a routing variable like any other: cost, transit time, reliability, and now emissions intensity, all weighed together.",
        ],
      },
      {
        heading: "Why the economics are shifting",
        paragraphs: [
          "The original cost gap on low-emission lanes came from thin volume — new fuel supply chains and retrofitted vessels serving a small number of early-adopter shippers, with all the fixed costs spread across too little cargo. As more volume moves onto these lanes, that spread improves, and the per-unit premium compresses.",
          "It hasn't fully closed everywhere, and it won't on every route at the same pace. But on the lanes where it has narrowed furthest, the decision to route through a green corridor is now closer to a routing optimization than a sustainability commitment.",
        ],
      },
      {
        heading: "What this means for booking decisions",
        paragraphs: [
          "The practical shift is that emissions data needs to sit alongside cost and transit time at the point of booking, not in a separate quarterly report. A shipper who can see, lane by lane, what the emissions delta actually costs in dollars can make a real tradeoff instead of guessing.",
          "Blue Route's routing data already carries the lane-level detail needed to make that comparison — the missing piece industry-wide has been surfacing it at decision time, where it can actually change a booking.",
        ],
      },
      {
        heading: "What to watch next",
        paragraphs: [
          "The next phase of scaling depends less on any single shipper's choices and more on whether secondary ports keep pace with the primary hubs already investing in lower-emission handling. Corridors are only as green as their weakest link, and right now that weak link is often the inland leg, not the ocean crossing.",
        ],
      },
    ],
  },
  {
    slug: "cutting-demurrage-inland-scheduling",
    title: "Cutting demurrage with smarter inland scheduling",
    excerpt:
      "How appointment optimization quietly removes one of logistics' most avoidable costs.",
    category: "Operations",
    date: "May 14, 2026",
    readMin: 7,
    color: "amber",
    author: { name: "Rachel Donovan", role: "Chief Operations Officer" },
    body: [
      {
        paragraphs: [
          "Demurrage and detention charges share a quiet feature: almost nobody intends to incur them. They accumulate because a container sits at a terminal past its free time, or a chassis sits at a yard waiting for a dock door — not because anyone decided that was worth the cost, but because two schedules that should have lined up didn't.",
          "The fix is rarely \"move faster.\" It's removing the scheduling gaps that cause the waiting in the first place, and that starts well before the container hits the terminal.",
        ],
      },
      {
        heading: "The gap is almost always inland",
        paragraphs: [
          "Ocean transit times are comparatively predictable; it's the handoff between vessel arrival, terminal release, drayage availability, and warehouse dock scheduling where most of the slippage happens. Each leg is booked somewhat independently, on its own assumptions about when the previous leg finishes.",
          "When those assumptions are wrong by even half a day, the container either arrives at the warehouse before a dock door is free, or — more expensively — sits at the terminal past its free time because the truck wasn't booked to arrive when the cargo actually cleared.",
        ],
      },
      {
        heading: "Appointment optimization as a single thread",
        paragraphs: [
          "Treating drayage and dock appointments as one scheduling problem, rather than two bookings made by two different teams on two different systems, closes most of that gap. If the inland appointment is set from the same live ETA feed that's tracking the vessel, the appointment window can shift automatically when the vessel's arrival shifts — instead of staying fixed and becoming wrong.",
          "This sounds incremental, but the savings compound: every avoided day of demurrage is a flat per-container cost removed, and at scale those flat costs are often larger than the freight rate volatility that gets far more attention.",
        ],
      },
      {
        heading: "What good scheduling looks like in practice",
        paragraphs: [
          "In practice, this means dock appointments booked as a range rather than a fixed slot, drayage capacity reserved against that range rather than a single time, and an automatic re-booking trigger when the upstream ETA moves by more than a small threshold.",
          "None of this requires exotic technology — it requires the inland leg to be planned against the same live data the ocean leg already has, instead of a snapshot taken days earlier.",
        ],
      },
    ],
  },
  {
    slug: "agentic-ai-beyond-the-chatbot",
    title: "Agentic AI in logistics: beyond the chatbot",
    excerpt:
      "When AI can execute multi-step plans, the operating model of a freight desk changes entirely.",
    category: "AI & Tech",
    date: "May 7, 2026",
    readMin: 8,
    color: "teal",
    author: { name: "Arjun Mehta", role: "Head of AI" },
    body: [
      {
        paragraphs: [
          "Most of the AI deployed in logistics over the last few years has been conversational: a chat interface that can answer questions about a shipment, summarize a document, or draft an email. Useful, but bounded — it tells you things, and a person still does the work.",
          "Agentic AI is a different category. It's a system that can take a goal — \"keep this shipment on schedule\" — and carry out the sequence of actions needed to pursue it, checking in only when a decision genuinely needs a human. That shift, from answering to acting, changes what a freight desk actually does day to day.",
        ],
      },
      {
        heading: "From lookups to standing plans",
        paragraphs: [
          "A chatbot answers \"where is my container?\" An agent monitors a shipment continuously, notices when the predicted ETA has drifted past a threshold, checks whether the original dock appointment still makes sense, and — if it doesn't — proposes or executes a rebooking before anyone had to ask.",
          "The work doesn't disappear; it moves. Instead of a person checking dozens of shipments for problems, a person reviews the handful of cases the agent flagged as needing judgment, with the routine cases already handled.",
        ],
      },
      {
        heading: "Where the line should stay human",
        paragraphs: [
          "The hard part of agentic systems isn't getting them to act — it's deciding which actions are safe to automate and which need a human in the loop. Rebooking inland drayage against a confirmed ETA shift is low-risk and high-frequency, a good candidate for automation. Committing to an expensive expedite, or renegotiating a contract term, is the kind of decision that should surface to a person with full context, not get executed silently.",
          "The systems that earn trust are the ones that are explicit about this boundary — they act freely inside it, and they escalate clearly outside it, rather than blurring the two.",
        ],
      },
      {
        heading: "What changes for the team",
        paragraphs: [
          "The practical effect on a freight desk is less time spent on status-checking and re-keying information between systems, and more time spent on the exceptions that actually need a person's judgment — a damaged shipment, a customer escalation, a genuinely novel routing problem.",
          "That's a better use of experienced people, and it's also the only way the industry absorbs more volume without proportionally more headcount. The agent doesn't replace the planner's judgment; it makes sure the planner's judgment is only spent where it's needed.",
        ],
      },
    ],
  },
  {
    slug: "container-rates-outlook-h2-2026",
    title: "Container rates outlook: H2 2026 scenarios",
    excerpt:
      "Three forward curves for the major east–west trades and what could bend them.",
    category: "Market",
    date: "Apr 30, 2026",
    readMin: 6,
    color: "indigo",
    author: { name: "Michael Reyes", role: "Co-founder & CTO" },
    body: [
      {
        paragraphs: [
          "Rate forecasts are most useful not as a single number but as a set of scenarios with the conditions that would produce each one made explicit. For the second half of 2026, three broad paths look plausible for the major east–west trades, and the difference between them comes down to a small number of variables: capacity additions, demand growth, and how much idle capacity gets absorbed by longer routings around contested chokepoints.",
        ],
      },
      {
        heading: "Scenario one: gradual softening",
        paragraphs: [
          "In this path, new vessel deliveries continue to outpace demand growth, chokepoint disruptions ease enough that some capacity returns to shorter routings, and rates drift down through the back half of the year toward levels closer to long-run averages. Shippers with flexible volume benefit from improving spot rates; carriers respond by idling capacity or slowing steaming speeds to manage the oversupply.",
          "This is the scenario where locking in long-term contract rates early in the period would look like a mistake in hindsight — spot exposure is rewarded.",
        ],
      },
      {
        heading: "Scenario two: choppy stability",
        paragraphs: [
          "Here, capacity and demand stay roughly balanced, but disruptions — weather events, regional congestion, intermittent chokepoint issues — create short, sharp rate spikes that fade within a few weeks each time. The annual average looks flat, but any shipper caught needing space during one of these windows pays a real premium.",
          "This scenario rewards exactly the kind of pre-staged flexibility discussed elsewhere: contracted base capacity plus the ability to flex onto alternative lanes or carriers during the spike windows, rather than being fully exposed to spot at the wrong moment.",
        ],
      },
      {
        heading: "Scenario three: a renewed capacity squeeze",
        paragraphs: [
          "The least likely but highest-impact path: a chokepoint disruption that's both severe and prolonged, absorbing enough capacity into longer routings that effective supply tightens meaningfully even without any change in underlying demand. Rates rise broadly, and the gap between contracted and spot pricing widens sharply.",
          "If this scenario starts to materialize, the early signal is usually transit time inflation on the affected trades well before headline rate indices move — which is one more reason live ETA and routing data is worth watching as a leading indicator, not just an operational tool.",
        ],
      },
    ],
  },
  {
    slug: "smart-warehouse-sensors-solar-ai",
    title: "The smart warehouse: sensors, solar, and AI matching",
    excerpt:
      "What separates a modern logistics hub from a plain big box — and why it matters to your TCO.",
    category: "Operations",
    date: "Apr 23, 2026",
    readMin: 5,
    color: "cyan",
    author: { name: "Rachel Donovan", role: "Chief Operations Officer" },
    body: [
      {
        paragraphs: [
          "From the outside, a modern logistics hub and a plain big box warehouse can look identical — same footprint, same dock doors, same steel frame. The difference is almost entirely in what's inside the walls and on the roof, and that difference shows up directly in total cost of ownership, not just in a sustainability report.",
        ],
      },
      {
        heading: "Sensors turn a building into a feed",
        paragraphs: [
          "A plain warehouse knows what's in it because someone scanned it in. A smart warehouse knows continuously — occupancy sensors track dock door utilization in real time, environmental sensors flag temperature or humidity drift in sensitive storage zones before it becomes a claim, and throughput sensors at staging areas reveal bottlenecks that would otherwise only show up as a missed appointment downstream.",
          "The value isn't the sensor data itself; it's that the data becomes an input to scheduling. A dock door that's consistently underused at certain hours is capacity that appointment scheduling can route around, rather than capacity nobody knew was available.",
        ],
      },
      {
        heading: "Solar and the energy line item",
        paragraphs: [
          "Warehouse roofs are large, flat, and mostly idle real estate — an obvious candidate for on-site solar generation that offsets a meaningful share of a facility's own electricity load, particularly for refrigerated or climate-controlled space where power is a significant operating cost.",
          "This isn't primarily a sustainability story, though it has that effect too. It's a hedge against energy price volatility for a cost line that a logistics operator otherwise has almost no control over.",
        ],
      },
      {
        heading: "AI matching closes the loop",
        paragraphs: [
          "The combination of live occupancy data, throughput data, and inbound ETA data is what allows a facility to match incoming freight to available space and labor before the truck arrives, rather than figuring it out at the dock. That's the difference between a warehouse that reacts to what shows up and one that's already staged for it.",
          "None of these three things — sensors, solar, AI matching — is individually exotic. What makes a hub \"smart\" is that they're connected: the energy system, the space, and the scheduling all draw from the same live picture of the facility.",
        ],
      },
    ],
  },
];

export const ARTICLE_SLUGS = ARTICLES.map((a) => a.slug);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
