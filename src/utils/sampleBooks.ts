import { Book } from '../types/book';
import { THEMES } from './themes';

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book-saas-growth',
    title: 'The Modern SaaS Growth Engine',
    subtitle: 'From Seed to $10M ARR: Playbooks for Customer Acquisition and Retention',
    author: 'Elena Vance & Marcus Wright',
    createdAt: '2026-09-18T10:30:00.000Z',
    themeId: 'indigo',
    theme: THEMES.indigo,
    category: 'B2B Growth & Marketing',
    tags: ['SaaS', 'Product-Led Growth', 'B2B Sales', 'Retention'],
    readTimeMinutes: 18,
    persona: {
      targetRole: 'VP of Growth & Early Founders',
      industry: 'B2B Software & Cloud Platforms',
      mainPainPoint: 'Plateaued organic inbound acquisition, high customer churn at renewal, and bloated CAC.',
      coreTransformation: 'Transition from sporadic ad campaigns to a predictable product-led acquisition and retention machine.',
      idealAudienceDescription: 'Series A to B tech founders and growth leaders managing sales cycles between 14-60 days seeking capital-efficient scaling levers.',
    },
    chapters: [
      {
        chapterNumber: 1,
        title: 'Architecting the Product-Led Flywheel',
        pillBadge: 'Foundation',
        summaryBox: 'Shift your acquisition model from friction-heavy sales demos to self-serve value realization within the first 7 minutes of product onboarding.',
        subheadings: [
          {
            title: 'Deconstructing the Time-To-Value (TTV) Metric',
            content: 'The most lethal friction point in modern B2B SaaS is not price—it is delay. When prospective buyers are forced to schedule discovery calls before touching the software, conversion decays by up to 64%. By architecting an interactive sandbox environment with pre-populated dummy datasets, users immediately experience the "Aha!" epiphany before hitting a paywall.'
          },
          {
            title: 'Instrumenting High-Intent In-App Activation Loops',
            content: 'Activation is not merely finishing account setup; it is completing the specific single action that predicts 90-day retention. Pinpoint your core aha event—such as inviting two collaborators or running their first pipeline audit—and eliminate every extraneous form field leading up to that milestone.'
          }
        ],
        quote: {
          text: 'The best products do not demand belief from the prospect; they deliver immediate proof before asking for a signature.',
          attribution: 'Elena Vance, Venture Partner'
        },
        bulletPoints: [
          'Reduce signup friction by enabling single-click Google/GitHub workspace authorization.',
          'Inject realistic sample data so blank-state anxiety does not cause premature abandonment.',
          'Measure Activation Rate weekly: Target a minimum of 42% completion on the primary aha metric.'
        ]
      },
      {
        chapterNumber: 2,
        title: 'Precision Demographic Targeting & Inbound Moats',
        pillBadge: 'Acquisition',
        summaryBox: 'Build authoritative content engines and programmatic landing pages that capture buyers at the exact moment of tool evaluation.',
        subheadings: [
          {
            title: 'Categorical Search Intent vs. Vanity Traffic',
            content: 'Generating 100,000 monthly blog impressions means nothing if the audience lacks budget authority. Instead of broad industry thought leadership, direct your organic resources into high-conversion evaluation queries: comparative teardowns ("Competitor X vs Competitor Y"), workflow templates, and interactive calculators.'
          },
          {
            title: 'Engineering the Micro-Tool Lead Magnet',
            content: 'Traditional gated whitepapers now suffer abysmal download-to-read rates under 8%. In contrast, single-purpose utility web apps (e.g., Free Privacy Policy Generator, API Latency Benchmark Checker) generate qualified marketing pipeline with conversion rates exceeding 28%.'
          }
        ],
        quote: {
          text: 'If your lead magnet feels like a textbook, nobody reads it. If it feels like a power tool, they bookmark and share it.',
          attribution: 'Marcus Wright, Head of Acquisition'
        },
        bulletPoints: [
          'Replace 40-page generic whitepapers with single-topic actionable playbooks and templates.',
          'Optimize lead capture forms to collect company domain and role without requiring phone numbers.',
          'Distribute automated enrichment via Clearbit or Apollo to qualify pipeline silently behind the scenes.'
        ]
      },
      {
        chapterNumber: 3,
        title: 'Pricing Dynamics & Net Revenue Retention',
        pillBadge: 'Monetization',
        summaryBox: 'Align pricing tiers with customer value metrics rather than arbitrary seat counts to capture upside as your clients grow.',
        subheadings: [
          {
            title: 'The Fallacy of Pure Per-Seat Pricing Models',
            content: 'Per-seat pricing inadvertently penalizes collaboration. When teams must pay for each seat, team leads actively share passwords or restrict junior colleagues from accessing the system. Modern breakout SaaS companies adopt hybrid pricing: a base access tier combined with consumption units (events processed, projects active, storage utilized).'
          },
          {
            title: 'Proactive Health Scores & Renewal Defense',
            content: 'Churn is rarely sudden; it is the culmination of weeks of dwindling weekly active minutes. Construct a composite Customer Health Score combining login frequency, key feature utilization, and executive sponsorship changes. Any account dropping below 60 points triggers an automated customer success audit.'
          }
        ],
        quote: {
          text: 'Net Revenue Retention over 120% is the ultimate proof that you are solving genuine structural problems for your market.',
          attribution: 'Elena Vance'
        },
        bulletPoints: [
          'Audit current seat licensing vs. usage-based metric alignment quarterly.',
          'Design expansion triggers into product UI when accounts reach 80% of tier quota.',
          'Automate monthly executive ROI reports highlighting hours saved and dollars protected.'
        ]
      },
      {
        chapterNumber: 4,
        title: 'Scaling the Sales-Assist Enterprise Bridge',
        pillBadge: 'Expansion',
        summaryBox: 'Empower product specialist account executives to intervene precisely when product usage signals enterprise security or governance needs.',
        subheadings: [
          {
            title: 'Identifying Product-Qualified Leads (PQLs)',
            content: 'Do not unleash enterprise sales reps on cold lists. PQLs originate from free or self-serve tiers when multiple employees from the same corporate email domain cluster on a workspace. When 5+ accounts share a domain and trigger data volume thresholds, your sales team enters as helpful consultants rather than cold callers.'
          },
          {
            title: 'Security, Compliance, and Enterprise Governance',
            content: 'The bridge from $10k ACV to $80k ACV is built with compliance: SAML SSO, SOC2 Type II compliance reports, custom role-based access control, and dedicated data sovereignty. Package these governance modules into an Enterprise tier with customized MSA terms.'
          }
        ],
        quote: {
          text: 'Enterprise deals are not won by smooth talk; they are won by eliminating procurement and compliance vulnerabilities.',
          attribution: 'Marcus Wright'
        },
        bulletPoints: [
          'Implement domain-clustering alerts to identify grassroots enterprise adoption early.',
          'Prepare automated compliance trust portals with ready-to-sign NDAs and SOC2 reports.',
          'Establish a predictable 30-day pilot SLA with explicit success criteria agreed upfront.'
        ]
      }
    ]
  },
  {
    id: 'book-ai-engineering',
    title: 'The AI Engineering Playbook',
    subtitle: 'Production LLMs, Evaluators, Retrieval Systems, and Latency Optimization',
    author: 'Dr. Aris Thorne',
    createdAt: '2026-10-01T14:15:00.000Z',
    themeId: 'emerald',
    theme: THEMES.emerald,
    category: 'Engineering & Artificial Intelligence',
    tags: ['AI', 'LLMOps', 'Prompt Engineering', 'RAG', 'Vector Search'],
    readTimeMinutes: 22,
    persona: {
      targetRole: 'Staff Engineers & Tech Leads',
      industry: 'Applied AI & Cloud Infrastructure',
      mainPainPoint: 'Unreliable LLM hallucinations, unpredictable token costs, and sluggish P99 inference latencies in production.',
      coreTransformation: 'Transform fragile prototype AI prompts into deterministic, evaluated, high-throughput microservices.',
      idealAudienceDescription: 'Senior developers and infrastructure architects moving generative AI features out of sandbox staging into mission-critical production pipelines.',
    },
    chapters: [
      {
        chapterNumber: 1,
        title: 'Deterministic Grounding & System Architectures',
        pillBadge: 'Architecture',
        summaryBox: 'Separate cognitive synthesis from factual data retrieval to ensure verifiable, deterministic system outputs.',
        subheadings: [
          {
            title: 'The Illusion of Parametric Knowledge',
            content: 'Never rely on an LLM weight matrix for rapidly evolving business truths. Weights store linguistic reasoning and syntactic conventions; external databases store facts. Architect all production workflows so model outputs are strictly constrained by validated structured context injected into prompt boundaries.'
          },
          {
            title: 'Structured Output Enforcement & JSON Schemas',
            content: 'Unstructured prose is the enemy of enterprise orchestration. Always constrain model responses using strict JSON Schema validation. Modern SDK interfaces reject malformed payload outputs before they ever touch internal application services.'
          }
        ],
        quote: {
          text: 'Treat LLMs as non-deterministic CPUs. You wouldn’t execute arbitrary assembly without a compiler; do not execute raw model text without strict validation.',
          attribution: 'Dr. Aris Thorne'
        },
        bulletPoints: [
          'Enforce strict JSON response schemas at the API gateway layer.',
          'Maintain clean separation between system instructions and untrusted user inputs.',
          'Standardize temperature configs below 0.3 for deterministic data extraction workflows.'
        ]
      },
      {
        chapterNumber: 2,
        title: 'Hybrid Retrieval & Context Window Optimization',
        pillBadge: 'Retrieval',
        summaryBox: 'Combine dense vector search with sparse BM25 indexing and cross-encoder re-ranking for reliable context retrieval.',
        subheadings: [
          {
            title: 'Why Vector Search Alone Fails Edge Cases',
            content: 'Cosine similarity in embedding space is fantastic for fuzzy conceptual queries but notoriously brittle when matching exact alphanumeric identifiers, serial codes, or specialized jargon. Production retrieval systems utilize reciprocal rank fusion (RRF) combining dense vectors with keyword-based sparse search.'
          },
          {
            title: 'Chunking Strategies & Semantic Boundary Preservation',
            content: 'Arbitrary 500-token fixed chunking splits critical sentences across boundaries. Utilize hierarchical chunking where parent document headers and metadata envelopes accompany child text blocks, ensuring context is preserved at retrieval time.'
          }
        ],
        quote: {
          text: 'Bad retrieval creates bad answers. The smartest reasoning model in existence cannot salvage an incomplete context injection.',
          attribution: 'Dr. Aris Thorne'
        },
        bulletPoints: [
          'Implement two-stage retrieval: broad candidate generation followed by cross-encoder re-ranking.',
          'Preserve table hierarchies and markdown headers in chunk metadata.',
          'Limit context injection to the top 5 highest-confidence chunks to prevent attention decay.'
        ]
      },
      {
        chapterNumber: 3,
        title: 'Automated Evaluation & LLM-As-A-Judge',
        pillBadge: 'Testing',
        summaryBox: 'Build regression test suites with synthetic test cases and multi-faceted LLM evaluators to guard against model drift.',
        subheadings: [
          {
            title: 'Moving Beyond Human Review Bottlenecks',
            content: 'Manual spot-checking 20 prompts in a spreadsheet gives a false sense of security. Reliable AI engineering requires continuous CI/CD evaluation benches measuring faithfulness, answer relevancy, and context recall across hundreds of curated ground-truth pairs.'
          },
          {
            title: 'Adversarial Prompt Inoculation',
            content: 'Before deploying to customers, submit prompts to red-teaming batteries that probe jailbreaks, prompt extraction, and data poisoning attempts. Build secondary guardrail checkers that inspect model inputs and outputs asynchronously.'
          }
        ],
        quote: {
          text: 'You cannot optimize what you do not evaluate. Without continuous benchmark suites, prompt tuning is just guesswork.',
          attribution: 'Dr. Aris Thorne'
        },
        bulletPoints: [
          'Run automated evaluation tests in CI before merging system prompt modifications.',
          'Score outputs against three core pillars: Factuality, Completeness, and Tone Compliance.',
          'Log edge-case failures into an active learning dataset for periodic model fine-tuning.'
        ]
      },
      {
        chapterNumber: 4,
        title: 'Cost, Caching, and Latency Optimization',
        pillBadge: 'Production',
        summaryBox: 'Deploy semantic prompt caching, model routing, and token streaming to slash P99 latency and API expenses by over 70%.',
        subheadings: [
          {
            title: 'Dynamic Intelligent Model Routing',
            content: 'Not every incoming request requires an ultra-heavy frontier reasoning model. Simple classification, entity extraction, and sentiment scoring can be routed to ultra-fast lightweight models (like Flash), reserving Pro reasoning models exclusively for multi-step synthesis.'
          },
          {
            title: 'Semantic Caching & Prompt Compression',
            content: 'A high percentage of user questions are variations of recurring questions. By deploying vector-based semantic caching with an embedding similarity threshold (e.g. 0.96 cosine distance), identical queries are served in sub-20ms at zero LLM inference cost.'
          }
        ],
        quote: {
          text: 'The true mark of a production engineer is not just making it work, but making it fast, resilient, and economically sustainable.',
          attribution: 'Dr. Aris Thorne'
        },
        bulletPoints: [
          'Implement semantic caching with Redis or Cloud SQL vector indexes.',
          'Route requests dynamically based on prompt complexity scoring.',
          'Stream token deltas to frontend clients immediately using Server-Sent Events.'
        ]
      }
    ]
  },
  {
    id: 'book-cognitive-habits',
    title: 'Micro-Habits for Peak Focus',
    subtitle: 'The Neuroscience of Deep Work, Dopamine Regulation, and Executive Stamina',
    author: 'Clara Sterling, M.Sc.',
    createdAt: '2026-10-08T09:00:00.000Z',
    themeId: 'crimson',
    theme: THEMES.crimson,
    category: 'Productivity & Behavioral Science',
    tags: ['Deep Work', 'Neuroscience', 'Focus', 'Peak Performance'],
    readTimeMinutes: 15,
    persona: {
      targetRole: 'Knowledge Workers & Executives',
      industry: 'High-Velocity Professional Services',
      mainPainPoint: 'Chronic attention fragmentation, afternoon energy crashes, and reactive email firefighting.',
      coreTransformation: 'Reclaim 3 to 4 uninterrupted hours of deep cognitive flow every single day through biological micro-habits.',
      idealAudienceDescription: 'Remote knowledge workers, managers, and creative professionals struggling to produce deep work amidst continuous notification onslaughts.',
    },
    chapters: [
      {
        chapterNumber: 1,
        title: 'The Neurological Anatomy of Distraction',
        pillBadge: 'Cognition',
        summaryBox: 'Understand the biological tension between your prefrontal cortex and primitive dopamine hunting circuits to neutralize attentional hijacks.',
        subheadings: [
          {
            title: 'Context Switching Tax and Attention Residue',
            content: 'Every time you glance at Slack or your inbox for "just five seconds", your brain leaves behind attentional residue. Studies show that returning to deep cognitive synthesis after a micro-interruption takes an average of 23 minutes. You are not multitasking; you are inducing cognitive whiplash.'
          },
          {
            title: 'Resetting the Baseline Dopamine Setpoint',
            content: 'Super-stimuli (algorithmic feeds, instant notifications) elevate dopamine baselines artificially high. When baseline dopamine is inflated, high-effort cognitive tasks feel physically unbearable. Resetting your baseline starts with the morning dopamine buffer.'
          }
        ],
        quote: {
          text: 'Focus is not an act of willpower; it is the natural consequence of an unfragmented environment.',
          attribution: 'Clara Sterling, M.Sc.'
        },
        bulletPoints: [
          'Establish a mandatory 45-minute zero-screen buffer upon waking up.',
          'Batch email and message checks into two designated 30-minute daily windows.',
          'Physicalize separation: leave smartphones in a different room during high-focus sessions.'
        ]
      },
      {
        chapterNumber: 2,
        title: 'Circadian Ultradian Rhythms & Energy Waves',
        pillBadge: 'Biology',
        summaryBox: 'Synchronize your most demanding intellectual challenges with natural 90-minute ultradian cognitive peaks.',
        subheadings: [
          {
            title: 'Mastering the 90-Minute Ultradian Wave',
            content: 'Human physiology operates on cyclical 90-minute ultradian rhythms throughout wakefulness. At the start of the cycle, alertness climbs, peaks around minute 60, and descends into fatigue by minute 85. Attempting to force continuous 4-hour grinds without rest causes cognitive diminishing returns.'
          },
          {
            title: 'Strategic Rest: The Power of NSDR',
            content: 'Non-Sleep Deep Rest (NSDR) or structured 15-minute sensory deprivation restores acetylcholine reserves in the motor cortex and parietal lobes far more effectively than passive screen scrolling.'
          }
        ],
        quote: {
          text: 'Rest is not the absence of productivity; it is the biological prerequisite for superior output.',
          attribution: 'Clara Sterling'
        },
        bulletPoints: [
          'Structure your daily calendar into two 90-minute deep work sprints.',
          'Take genuine physiological breaks: walk outdoors, hydrate, practice panoramic viewing.',
          'Protect your biological peak hour: schedule meetings exclusively in the afternoon.'
        ]
      },
      {
        chapterNumber: 3,
        title: 'Environmental Architecture & Friction Inversion',
        pillBadge: 'Systems',
        summaryBox: 'Increase friction on destructive distractions while removing all resistance from creative rituals.',
        subheadings: [
          {
            title: 'The Law of Inverted Resistance',
            content: 'Make bad habits require at least 20 seconds of deliberate physical friction: log out of addictive platforms, use hard blockers, unplug secondary screens. Conversely, prepare your physical and digital workspaces the night before so beginning deep work requires zero setup time.'
          },
          {
            title: 'Auditory Anchoring and Binaural Focus',
            content: 'Pair deep work exclusively with specific non-verbal soundscapes (brown noise, 40Hz gamma frequency beats, or minimalist ambient audio). Over time, this conditions your brain to enter theta/alpha flow states rapidly on cue.'
          }
        ],
        quote: {
          text: 'You do not rise to the level of your goals; you fall to the level of your environmental systems.',
          attribution: 'Clara Sterling'
        },
        bulletPoints: [
          'Set up app-level blockers that prevent social feeds during working hours.',
          'Adopt an auditory ritual: one consistent playlist reserved solely for deep creative work.',
          'Clear your physical desktop every evening to greet a blank canvas each morning.'
        ]
      },
      {
        chapterNumber: 4,
        title: 'The Evening Shutdown & Neural Consolidation',
        pillBadge: 'Recovery',
        summaryBox: 'Execute an unshakeable shutdown ritual to clear the cognitive RAM of your prefrontal cortex before sleep.',
        subheadings: [
          {
            title: 'The Zeigarnik Effect and Unfinished Tasks',
            content: 'The brain obsesses over incomplete loops. If you close your laptop with loose ends rattling in your memory, stress hormones keep neural circuits buzzing all night. Writing down tomorrow’s top three priorities explicitly releases the brain from keeping active vigilance.'
          },
          {
            title: 'Adenosine Cleansing and Sleep Hygiene',
            content: 'During slow-wave sleep, the brain’s glymphatic system flushes out metabolic waste, including beta-amyloid plaques. Deep work output is fundamentally capped by your quality of deep sleep.'
          }
        ],
        quote: {
          text: 'A great day of focus does not start in the morning. It begins the evening before with a disciplined shutdown.',
          attribution: 'Clara Sterling'
        },
        bulletPoints: [
          'Perform a 10-minute end-of-day task sweep and schedule tomorrow’s calendar.',
          'Say an explicit mental or verbal shutdown phrase to mark the boundary between work and rest.',
          'Eliminate bright blue overhead lighting 2 hours before target bedtime.'
        ]
      }
    ]
  }
];
