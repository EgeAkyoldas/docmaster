// Shared document type definitions — single source of truth
// Used by ChatPanel (toolbar), SessionSettings (editing), and Verifier (cross-check)

export interface DocDefinition {
  label: string;
  docKey: string;
  defaultInstruction: string;
  color: string;
  guidedTopics?: string[];
}

export interface ProjectType {
  id: string;
  label: string;
  icon: string;
  description: string;
  enabledDocKeys: string[];
  instructionOverrides?: Record<string, string>;
  guidedTopicOverrides?: Record<string, string[]>;
}


export const PROJECT_TYPE_PRESETS: ProjectType[] = [
  {
    id: "webapp",
    label: "Web/Mobile App",
    icon: "Monitor",
    description: "Full-stack web or mobile application with API, database, and UI",
    enabledDocKeys: ["PRD", "Design Document", "Tech Stack", "Architecture", "Tech Spec", "API Spec", "UI Design", "Data Model", "Security Spec", "Roadmap", "Task List", "Vibe Prompt"],
    instructionOverrides: {
      "PRD": "generate a complete Product Requirements Document (PRD) for this web/mobile application. Focus on user personas, core user flows, feature prioritization (MoSCoW), success metrics and KPIs, platform scope (web, iOS, Android, PWA), integration requirements, and go-to-market considerations.",
      "Design Document": "generate a complete Design Document covering system design for a web/mobile application. Include architectural trade-offs (monolith vs microservices, SSR vs SPA vs hybrid), caching strategy, CDN considerations, data flow diagrams, third-party service integrations (payments, auth, analytics), and deployment topology.",
      "Tech Stack": "generate a complete Tech Stack Specification for a web/mobile application. Evaluate frontend framework (React/Next.js/Vue/Svelte), backend runtime (Node/Python/Go), database choice (PostgreSQL/MongoDB/Supabase), ORM/query builder, authentication provider (Clerk/Auth0/Firebase Auth), hosting platform (Vercel/AWS/Railway), state management, CI/CD pipeline, and monitoring tools with rationale for each choice.",
      "Architecture": "generate a complete Architecture Document using the C4 model for a web/mobile application. Cover system context, container diagram (frontend, API, database, cache, CDN), component diagrams for core modules, deployment architecture, scaling strategy (horizontal/vertical), and fault tolerance patterns.",
      "Tech Spec": "generate a complete Technical Specification as an implementation blueprint for a web/mobile app. Detail core data models with TypeScript interfaces, API route signatures, business logic rules, validation schemas (Zod/Yup), error handling strategy, middleware pipeline, background job processing, and real-time features (WebSocket/SSE).",
      "API Spec": "generate a complete API Specification for a web/mobile application. Define RESTful endpoints (or GraphQL schema) with request/response types, authentication flows (JWT/OAuth2), rate limiting rules, pagination strategy, webhook integrations, API versioning approach, and OpenAPI/Swagger documentation plan.",
      "UI Design": "generate a complete UI/UX Design Specification for a web/mobile application. Include design philosophy, responsive breakpoint strategy, color system with dark/light modes, typography scale, component library (buttons, forms, modals, navigation), page layouts with wireframe descriptions, micro-interactions, loading states, empty states, and accessibility (WCAG 2.1 AA) compliance plan.",
      "Data Model": "generate a complete Data Model Specification for a web/mobile application. Define all entities (Users, Organizations, Resources) with field types and constraints, relationships (1:1, 1:N, M:N with junction tables), indexing strategy for query patterns, soft delete vs hard delete policy, audit trail fields (createdAt, updatedAt, deletedAt), migration plan, and seed data strategy.",
      "Security Spec": "generate a complete Security Specification for a web/mobile application. Cover authentication model (OAuth2/OIDC/magic links), authorization (RBAC/ABAC), OWASP Top 10 mitigations (XSS, CSRF, SQL Injection, SSRF), data encryption (at rest with AES-256, in transit with TLS 1.3), Content Security Policy headers, rate limiting, GDPR/CCPA compliance plan, and incident response procedures.",
      "Roadmap": "generate a complete Project Roadmap for a web/mobile application. Structure into phases: MVP (core auth + primary feature), Beta (secondary features + polish), Launch (production hardening + monitoring), and Post-Launch (iteration + scaling). Include timeline estimates, team allocation, dependency mapping, and launch criteria.",
      "Task List": "generate a comprehensive nested project task list for a web/mobile application. Structure as Phases → Epics → Stories → Tasks. Cover: project setup (repo, CI/CD, env), database schema + migrations, authentication flow, core features, API development, frontend pages, testing (unit + integration + E2E), deployment pipeline, and documentation.",
      "Vibe Prompt": "generate a comprehensive Vibe Ready Prompt for a web/mobile application — a master AI handoff document that synthesizes ALL existing project documents into a single actionable instruction file for an AI coding assistant. Include project identity, tech stack snapshot, architecture brief, core data models, API routes, phased implementation roadmap, development rules, expected file structure, and bootstrap commands.",
    },
    guidedTopicOverrides: {
      "PRD": ["App name & core concept", "Target users & personas", "Main user flows", "Platform (web/iOS/Android/PWA)", "Key features (MoSCoW)", "Success metrics & KPIs", "Competitor landscape"],
      "Design Document": ["Monolith vs microservices decision", "SSR vs SPA vs hybrid", "Caching strategy", "CDN requirements", "Third-party integrations", "Deployment topology"],
      "Tech Stack": ["Frontend framework preference", "Backend runtime & language", "Database choice", "Authentication provider", "Hosting platform", "CI/CD preferences", "Monitoring tools"],
      "Architecture": ["System boundaries", "Container breakdown (frontend/API/DB)", "Scaling requirements", "Fault tolerance needs", "Security zones"],
      "Tech Spec": ["Core data models", "API style (REST/GraphQL/tRPC)", "Validation strategy", "Error handling approach", "Background jobs needed", "Real-time features (WebSocket/SSE)"],
      "API Spec": ["API style (REST/GraphQL)", "Auth method (JWT/OAuth2)", "Core resources & endpoints", "Rate limiting requirements", "Pagination approach", "Webhook needs"],
      "UI Design": ["Design style & mood", "Dark/light mode requirements", "Color palette direction", "Component library preference", "Key pages & screens", "Accessibility requirements"],
      "Data Model": ["Core entities", "Key relationships", "Multi-tenancy / org structure", "Soft delete policy", "Audit trail requirements", "Common query patterns"],
      "Security Spec": ["Auth model (OAuth2/OIDC/magic links)", "Authorization (RBAC/ABAC)", "Data sensitivity & classification", "Compliance requirements (GDPR/CCPA)", "Encryption requirements", "Incident response needs"],
      "Roadmap": ["MVP scope", "Timeline & deadlines", "Team size & roles", "Beta criteria", "Launch requirements", "Post-launch priorities"],
      "Task List": ["Sprint / phase structure", "Priority system", "Testing requirements", "Deployment pipeline steps", "Documentation requirements"],
    },
  },
  {
    id: "game",
    label: "Game",
    icon: "Gamepad2",
    description: "Video game project — mechanics, art direction, and level design",
    enabledDocKeys: ["PRD", "Design Document", "Tech Stack", "Architecture", "Tech Spec", "UI Design", "Roadmap", "Task List", "Vibe Prompt"],
    instructionOverrides: {
      "PRD": "generate a complete Game Design Document (GDD) for this video game. Focus on the core game loop, genre and gameplay pillars, target audience and player personas, game mechanics (movement, combat, progression, economy), narrative premise, art direction summary, audio design direction, platform targets (PC, console, mobile), monetization model (premium, F2P, DLC), multiplayer scope, and competitive landscape analysis.",
      "Design Document": "generate a complete Game Design Document covering detailed system design. Include core gameplay mechanics with pseudocode, game loop flow diagram, player progression system (XP, levels, skill trees, unlocks), economy design (currencies, crafting, loot tables, drop rates), AI behavior design (state machines, behavior trees), level design philosophy, difficulty scaling, save system architecture, and tutorial/onboarding flow.",
      "Tech Stack": "generate a complete Tech Stack Specification for a video game. Evaluate game engine (Unity/Unreal/Godot/custom), rendering pipeline, physics engine, networking solution (dedicated servers, P2P, relay), audio middleware (FMOD/Wwise), build pipeline and asset management, version control (Git LFS, Perforce), profiling tools, analytics SDK, and platform-specific SDK requirements.",
      "Architecture": "generate a complete Architecture Document for a video game. Cover game loop architecture (update/render cycle), Entity Component System (ECS) vs OOP, scene management and loading strategy, input system abstraction, networking architecture (client-server, rollback netcode, state sync), asset streaming and memory management, plugin/mod system design, and build/deployment pipeline per platform.",
      "Tech Spec": "generate a complete Technical Specification for a video game. Detail core systems implementation: player controller, camera system, combat/interaction system, inventory/equipment, quest/mission system, save/load serialization, localization pipeline, accessibility options, performance budgets (frame time, draw calls, memory), and platform certification requirements.",
      "UI Design": "generate a complete UI/UX Design Specification for a video game. Cover HUD design (health, minimap, objectives, notifications), menu system (main menu, pause, settings, inventory, map), in-game interaction prompts, dialogue/cutscene UI, shop/store UI, controller/touch input considerations, screen-safe zones, colorblind accessibility modes, subtitle system, and platform-specific UI guidelines (Xbox, PlayStation, Nintendo, Steam Deck).",
      "Roadmap": "generate a complete Project Roadmap for a video game. Structure into game development phases: Pre-Production (prototyping, vertical slice), Production (alpha build, feature-complete), Polish (beta, bug fixing, optimization), Certification/Submission, Launch, and Post-Launch (patches, DLC, live ops). Include milestone deliverables, team allocation, and QA test plans.",
      "Task List": "generate a comprehensive nested project task list for a video game. Structure as Phases → Milestones → Features → Tasks. Cover: engine setup and project scaffold, core mechanics prototype, art pipeline (modeling, texturing, animation), level creation, audio integration, UI implementation, networking, optimization passes, platform builds, QA testing rounds, certification requirements, and launch preparation.",
      "Vibe Prompt": "generate a comprehensive Vibe Ready Prompt for a video game — a master AI handoff document synthesizing ALL existing design documents into an actionable instruction file for an AI assistant. Include game identity (genre, pillars, unique hook), engine and tech stack, core systems brief, entity/component catalog, level structure, art and audio direction summary, phased build roadmap, coding conventions, and project file structure.",
    },
    guidedTopicOverrides: {
      "PRD": ["Game title & genre", "Core game loop (30-sec / 3-min / 30-min loops)", "Target platform (PC/console/mobile)", "Target audience & player persona", "Key mechanics (movement, combat, progression)", "Monetization model (premium/F2P/DLC)", "Multiplayer scope"],
      "Design Document": ["Player progression system", "Economy design (currencies, loot tables)", "AI behavior design", "Level design philosophy", "Difficulty scaling", "Save system architecture"],
      "Tech Stack": ["Game engine (Unity/Unreal/Godot)", "Rendering pipeline", "Networking solution", "Audio middleware", "Asset management approach", "Platform-specific SDKs"],
      "Architecture": ["Game loop architecture (ECS vs OOP)", "Scene & level management", "Input system", "Networking architecture", "Asset streaming strategy"],
      "Tech Spec": ["Player controller system", "Combat/interaction system", "Inventory & quest system", "Save/load serialization", "Performance budgets (frame time, draw calls)"],
      "UI Design": ["HUD elements (health, minimap, objectives)", "Menu system (main, pause, inventory)", "Input method (controller/touch/KB+M)", "Accessibility requirements (colorblind, subtitles)", "Platform UI guidelines"],
      "Roadmap": ["Pre-production milestones (prototype, vertical slice)", "Alpha build scope", "Beta scope", "Certification requirements", "Post-launch (patches, DLC, live ops)"],
      "Task List": ["Engine setup & scaffold", "Core mechanics prototype", "Art pipeline (modeling, animation)", "Level creation", "Audio integration", "Optimization passes"],
    },
  },
  {
    id: "business",
    label: "Business/Startup",
    icon: "TrendingUp",
    description: "Business plan, pitch deck foundation, and strategic roadmap",
    enabledDocKeys: ["PRD", "Design Document", "Roadmap", "Task List", "Vibe Prompt"],
    instructionOverrides: {
      "PRD": "generate a complete Product Requirements Document (PRD) for this business/startup. Focus on market opportunity and TAM/SAM/SOM analysis, customer segments and personas, problem-solution fit, value proposition canvas, competitive landscape and differentiation, business model (SaaS, marketplace, subscription tiers, freemium), revenue projections framework, key partnerships and channels, regulatory considerations, and success metrics (CAC, LTV, MRR, churn rate).",
      "Design Document": "generate a complete Design Document for this business/startup. Cover the business architecture: operational workflows, customer journey maps, service blueprints, data flow between departments/systems, decision on build vs buy for key systems, vendor evaluation criteria, scalability of business processes, key automation opportunities, and technology-enabled competitive moats.",
      "Roadmap": "generate a complete Project Roadmap for this business/startup. Structure into: Validation Phase (customer discovery, problem interviews, MVP definition), Build Phase (core product, founding team, initial funding), Launch Phase (go-to-market, early adopter acquisition, feedback loops), Growth Phase (scaling, Series A readiness, team expansion). Include OKR framework, funding milestones, and key decision gates.",
      "Task List": "generate a comprehensive nested task list for this business/startup. Structure as Phases → Workstreams → Deliverables → Tasks. Cover: market research and validation, business model canvas, pitch deck creation, financial modeling, legal entity setup, MVP development, brand identity, marketing strategy, customer acquisition pipeline, investor outreach, team hiring plan, and operational setup.",
      "Vibe Prompt": "generate a comprehensive Vibe Ready Prompt for this business/startup — a master AI handoff document synthesizing ALL existing business documents. Include business identity (mission, vision, values), market analysis summary, business model brief, customer persona snapshots, competitive positioning, product roadmap overview, key metrics dashboard definition, and strategic priorities for the next 90 days.",
    },
    guidedTopicOverrides: {
      "PRD": ["Business/product name & concept", "Target market & customer segments", "Problem being solved", "Business model (SaaS/marketplace/subscription)", "TAM/SAM/SOM sizing", "Competitive landscape", "Success metrics (CAC, LTV, MRR)"],
      "Design Document": ["Operational workflow design", "Customer journey mapping", "Build vs buy decisions", "Key automation opportunities", "Technology competitive moats"],
      "Roadmap": ["Validation phase (discovery, interviews)", "Build phase (MVP, team, funding)", "Launch phase (GTM, acquisition)", "Growth phase (scaling, Series A)"],
      "Task List": ["Market research & validation", "Business model canvas", "Financial modeling", "Legal entity setup", "MVP development", "Investor outreach"],
    },
  },
  {
    id: "design-system",
    label: "Design System",
    icon: "Palette",
    description: "Component library, design tokens, and visual language documentation",
    enabledDocKeys: ["PRD", "Design Document", "UI Design", "Tech Stack", "Vibe Prompt"],
    instructionOverrides: {
      "PRD": "generate a complete Product Requirements Document (PRD) for this design system. Focus on the design system's purpose and adoption goals, target consumers (product teams, number of products/platforms), design principles and philosophy, component coverage scope (atomic → molecular → organism hierarchy), accessibility standards (WCAG 2.1 AA/AAA), multi-brand/theme support requirements, versioning and deprecation policy, contribution model (centralized vs federated), and success metrics (adoption rate, component reuse ratio, design-dev consistency).",
      "Design Document": "generate a complete Design Document for this design system. Cover the design token architecture (color, spacing, typography, elevation, motion), token naming conventions (semantic vs primitive), multi-theme strategy (light/dark/brand variants), component API design philosophy (controlled vs uncontrolled, composition patterns), variant and state matrix for core components, responsive behavior patterns, icon system design, illustration/imagery guidelines, and design-to-code handoff workflow.",
      "UI Design": "generate a complete UI/UX Design Specification for this design system. Define the visual language: color palette with semantic mapping (primary, secondary, success, danger, warning, info), typography scale with line-height and letter-spacing rules, spacing system (4px/8px grid), elevation/shadow levels, border radius tokens, motion/animation principles (easing curves, duration scale), breakpoint system. Then document each component: Button, Input, Select, Checkbox, Radio, Toggle, Card, Modal, Toast, Tooltip, Tabs, Accordion, Table, Navigation, Avatar, Badge, Breadcrumb — with all states (default, hover, focus, active, disabled, error, loading).",
      "Tech Stack": "generate a complete Tech Stack Specification for this design system. Evaluate component framework (React/Vue/Web Components/multi-framework), styling approach (CSS-in-JS/CSS Modules/Tailwind/vanilla CSS), build tools (Vite/Rollup/tsup), documentation platform (Storybook/Docusaurus), token management tool (Style Dictionary/Figma Tokens), testing framework (Vitest + Testing Library + Chromatic), package registry (npm/private), versioning strategy (semantic, independent vs fixed), CI/CD for publishing, and Figma plugin/sync tooling.",
      "Vibe Prompt": "generate a comprehensive Vibe Ready Prompt for this design system — a master AI handoff document synthesizing ALL design system documents. Include design system identity (name, principles, design philosophy), complete token reference (colors, spacing, typography, elevation), component catalog with API signatures, theming architecture, usage patterns and anti-patterns, contribution guidelines, and file structure for the component library repo.",
    },
    guidedTopicOverrides: {
      "PRD": ["Design system name & purpose", "Target consumer teams", "Design principles", "Component scope (atomic → organism)", "Multi-brand/theme support", "Versioning & deprecation policy", "Adoption success metrics"],
      "Design Document": ["Token architecture (color, spacing, typography)", "Naming conventions (semantic vs primitive)", "Multi-theme strategy", "Component API philosophy", "Design-to-code handoff workflow"],
      "UI Design": ["Color palette & semantic mapping", "Typography scale", "Spacing system (4px/8px grid)", "Motion & animation principles", "Core components to document", "Accessibility requirements (WCAG level)"],
      "Tech Stack": ["Component framework (React/Vue/Web Components)", "Styling approach (CSS-in-JS/Tailwind/vanilla CSS)", "Documentation platform (Storybook)", "Token management tool", "Publishing & versioning strategy"],
    },
  },
  {
    id: "marketing",
    label: "Marketing Site",
    icon: "Megaphone",
    description: "Landing page, marketing website, or promotional platform",
    enabledDocKeys: ["PRD", "UI Design", "Tech Stack", "Roadmap", "Task List", "Vibe Prompt"],
    instructionOverrides: {
      "PRD": "generate a complete Product Requirements Document (PRD) for this marketing site. Focus on campaign objectives and conversion goals, target audience segments, key messaging and value propositions, page structure (hero, features, social proof, pricing, CTA sections), SEO strategy and target keywords, lead capture and CRM integration requirements, A/B testing plan, analytics and attribution tracking (UTM, pixel events), content management needs (blog, case studies, changelog), and performance targets (Core Web Vitals, LCP < 2.5s).",
      "UI Design": "generate a complete UI/UX Design Specification for this marketing site. Define the visual identity: hero section with value prop and CTA, feature showcase layouts (grid, bento, alternating), social proof sections (testimonials, logos, case studies, metrics), pricing table design (comparison, toggle annual/monthly, highlighted tier), footer with navigation and newsletter signup, animation strategy (scroll-triggered, parallax, micro-interactions), responsive strategy (mobile-first, breakpoints), dark/light theme, above-the-fold optimization, and conversion-focused CTA hierarchy with visual weight.",
      "Tech Stack": "generate a complete Tech Stack Specification for this marketing site. Evaluate static-site/SSG approach (Next.js/Astro/Nuxt) vs headless CMS, hosting (Vercel/Netlify/Cloudflare Pages), CMS for content editors (Sanity/Contentful/Keystatic/MDX), form handling (Formspree/Resend), analytics stack (Plausible/PostHog/GA4), A/B testing tool, image optimization (sharp, next/image, Cloudinary), SEO tooling (sitemap, robots.txt, structured data), email service, and performance monitoring.",
      "Roadmap": "generate a complete Project Roadmap for this marketing site. Structure into: Design Phase (brand identity, wireframes, copy writing), Build Phase (page templates, CMS setup, integrations), Content Phase (copywriting, imagery, SEO optimization), Launch Phase (DNS, SSL, analytics verification, SEO submission), and Iteration Phase (A/B tests, content pipeline, performance tuning). Include timeline with hard deadlines if applicable.",
      "Task List": "generate a comprehensive nested task list for this marketing site. Structure as Phases → Sections → Tasks. Cover: domain and hosting setup, design system/brand kit, hero section implementation, feature pages, pricing page, blog/changelog setup, CMS integration, form handling, SEO optimization (meta tags, OG images, structured data, sitemap), analytics setup, performance optimization (lazy loading, image optimization), cross-browser testing, mobile testing, and launch checklist.",
      "Vibe Prompt": "generate a comprehensive Vibe Ready Prompt for this marketing site — a master AI handoff document synthesizing ALL project documents. Include site identity (brand, messaging, target audience), page-by-page structure with copy direction, tech stack summary, CMS content model, SEO requirements, performance targets, conversion goals, and deployment instructions.",
    },
    guidedTopicOverrides: {
      "PRD": ["Site name & campaign objective", "Target audience segments", "Key messaging & value props", "Page structure (hero, features, pricing, CTA)", "Lead capture & CRM integration", "SEO target keywords", "Performance targets (Core Web Vitals)"],
      "UI Design": ["Visual identity & brand", "Hero section concept", "Feature showcase layout (grid/bento)", "Social proof approach (testimonials, logos)", "Pricing table design", "Animation strategy", "Mobile-first requirements"],
      "Tech Stack": ["Framework (Next.js/Astro/Nuxt)", "CMS choice", "Hosting platform", "Analytics stack", "Form handling", "A/B testing tool"],
      "Roadmap": ["Design phase scope", "Build phase scope", "Content phase (copy, SEO)", "Launch date & hard deadlines", "Iteration priorities post-launch"],
      "Task List": ["Design & brand kit", "Page sections to build", "CMS integration", "SEO optimization tasks", "Analytics setup", "Launch checklist"],
    },
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: "Server",
    description: "Backend services, DevOps pipelines, cloud infrastructure, or CLI tools",
    enabledDocKeys: ["PRD", "Architecture", "Tech Stack", "Tech Spec", "API Spec", "Data Model", "Security Spec", "Roadmap", "Task List", "Vibe Prompt"],
    instructionOverrides: {
      "PRD": "generate a complete Product Requirements Document (PRD) for this infrastructure project. Focus on the operational problem being solved, target users (developers, SREs, DevOps teams), SLA/SLO requirements (uptime, latency percentiles, throughput), scalability requirements (requests/second, data volume, concurrent connections), compliance requirements (SOC2, HIPAA, PCI-DSS if applicable), integration points with existing systems, migration strategy from legacy, observability requirements (metrics, logs, traces), and cost optimization targets.",
      "Architecture": "generate a complete Architecture Document for this infrastructure project. Cover system topology (multi-region, multi-AZ), service mesh and communication patterns (sync REST/gRPC, async message queues/event streams), container orchestration (Kubernetes/ECS/Nomad), networking architecture (VPC, subnets, load balancers, DNS, CDN), storage architecture (block, object, file systems), caching layers (Redis, Memcached), CI/CD pipeline architecture, blue/green and canary deployment strategy, disaster recovery (RPO/RTO targets), and infrastructure-as-code approach.",
      "Tech Stack": "generate a complete Tech Stack Specification for this infrastructure project. Evaluate cloud provider (AWS/GCP/Azure), compute (EC2/Lambda/Cloud Run/K8s), database (RDS PostgreSQL/DynamoDB/CockroachDB), message queue (SQS/RabbitMQ/Kafka), IaC tool (Terraform/Pulumi/CDK), container runtime, service mesh (Istio/Linkerd), secrets management (Vault/AWS Secrets Manager), monitoring stack (Prometheus+Grafana/Datadog/New Relic), logging (ELK/Loki), tracing (Jaeger/OpenTelemetry), and CI/CD platform (GitHub Actions/GitLab CI/ArgoCD).",
      "Tech Spec": "generate a complete Technical Specification for this infrastructure project. Detail service implementation: API gateway configuration, request routing rules, authentication middleware (mTLS, API keys, JWT validation), rate limiting and circuit breaker patterns, retry policies with exponential backoff, health check endpoints, graceful shutdown handling, configuration management (env vars, config maps, feature flags), database connection pooling, job queue processing, and structured logging format (JSON, correlation IDs).",
      "API Spec": "generate a complete API Specification for this infrastructure project. Define service-to-service APIs (gRPC protobuf definitions or REST OpenAPI), internal vs external API boundaries, authentication between services (mTLS, service tokens), API gateway routing rules, rate limiting per client/tier, webhook delivery system, health and readiness probe endpoints, batch processing APIs, admin/operator APIs, and API deprecation lifecycle.",
      "Data Model": "generate a complete Data Model Specification for this infrastructure project. Define data stores and their purposes (OLTP, OLAP, cache, search index), table/collection schemas with partitioning strategy, event schema for message queues/event streams, data retention policies and archival strategy, backup schedules and restore procedures, cross-region replication topology, data migration and versioning approach, and audit log schema.",
      "Security Spec": "generate a complete Security Specification for this infrastructure project. Cover network security (firewall rules, security groups, WAF), identity and access management (IAM policies, service accounts, least privilege), secrets rotation policy, encryption (TLS termination, at-rest KMS), vulnerability scanning (container images, dependencies, SAST/DAST), compliance framework mapping, penetration testing scope, DDoS mitigation strategy, incident response runbook, and security monitoring alerts (GuardDuty/Security Hub).",
      "Roadmap": "generate a complete Project Roadmap for this infrastructure project. Structure into: Foundation Phase (IaC setup, networking, CI/CD pipeline), Core Services Phase (primary services, database, messaging), Observability Phase (monitoring, alerting, dashboards, SLO tracking), Hardening Phase (security audit, load testing, DR drills), and Operations Phase (runbooks, on-call rotation, cost optimization). Include dependency ordering and rollback plans per phase.",
      "Task List": "generate a comprehensive nested task list for this infrastructure project. Structure as Phases → Systems → Tasks. Cover: cloud account setup and IAM, networking (VPC, subnets, peering), IaC repository structure, CI/CD pipeline, container registry, primary compute deployment, database provisioning and migrations, message queue setup, service mesh configuration, monitoring dashboards and alerts, log aggregation, security scanning integration, load testing, documentation (runbooks, architecture diagrams), and DR testing.",
      "Vibe Prompt": "generate a comprehensive Vibe Ready Prompt for this infrastructure project — a master AI handoff document synthesizing ALL project documents. Include infrastructure identity (purpose, SLOs, scale targets), cloud architecture summary, service catalog with endpoints, IaC module reference, security posture summary, operational runbook index, deployment procedures, and on-call escalation paths.",
    },
    guidedTopicOverrides: {
      "PRD": ["Infrastructure project name & purpose", "Target users (SREs, dev teams)", "SLA/SLO requirements (uptime, latency)", "Scale requirements (RPS, data volume)", "Compliance requirements (SOC2/HIPAA/PCI)", "Migration strategy from legacy", "Cost optimization targets"],
      "Architecture": ["Cloud provider & multi-region strategy", "Compute choice (K8s/ECS/Lambda)", "Service communication (sync/async)", "Networking topology (VPC, subnets)", "Storage architecture", "Disaster recovery (RPO/RTO)"],
      "Tech Stack": ["Cloud provider", "IaC tool (Terraform/Pulumi)", "Container orchestration", "Message queue", "Monitoring stack (Prometheus+Grafana/Datadog)", "CI/CD platform"],
      "Tech Spec": ["API gateway configuration", "Auth middleware (mTLS/JWT)", "Rate limiting & circuit breaker", "Health check strategy", "Configuration management", "Job queue processing"],
      "API Spec": ["Service-to-service API style (gRPC/REST)", "Auth between services", "Rate limiting per tier", "Health & readiness probe endpoints", "Admin API scope"],
      "Data Model": ["Data store types (OLTP/OLAP/cache)", "Partitioning strategy", "Data retention & archival policy", "Backup & restore approach", "Cross-region replication"],
      "Security Spec": ["Network security (firewall, WAF)", "IAM & least privilege", "Secrets rotation policy", "Compliance framework (SOC2/HIPAA)", "Vulnerability scanning approach", "Incident response runbook"],
      "Roadmap": ["Foundation phase scope", "Core services phase", "Observability phase", "Hardening phase", "Operations phase"],
      "Task List": ["IaC repository setup", "Networking provisioning", "CI/CD pipeline", "Primary services deployment", "Monitoring & alerting", "Security scanning", "Load testing"],
    },
  },
  {
    id: "custom",
    label: "Custom",
    icon: "Settings",
    description: "Start from scratch — pick exactly which documents you need",
    enabledDocKeys: ["PRD", "Design Document", "Tech Stack", "Architecture", "Tech Spec", "API Spec", "UI Design", "Data Model", "Security Spec", "Roadmap", "Task List", "Vibe Prompt"],
    // No overrides — uses default generic instructions
  },
];

export const DEFAULT_DOC_DEFINITIONS: DocDefinition[] = [
  {
    label: "PRD",
    docKey: "PRD",
    defaultInstruction:
      "generate a complete Product Requirements Document (PRD) for this project.",
    color: "cyan",
    guidedTopics: [
      "Target users & personas",
      "Core problem statement",
      "Key features & scope",
      "Success metrics / KPIs",
      "Constraints & assumptions",
      "Out of scope items",
      "User stories / use cases",
    ],
  },
  {
    label: "Design Doc",
    docKey: "Design Document",
    defaultInstruction:
      "generate a complete Technical Design Document covering system architecture, data flow, integration design, and key technical trade-offs. Focus on backend architecture, data pipelines, third-party service integrations, deployment strategy, and technical constraints. Do NOT cover UI/UX topics — those belong in the separate UI Design document.",
    color: "violet",
    guidedTopics: [
      "System boundaries & context",
      "Key technical trade-offs & decisions",
      "Data flow & integration design",
      "Technology constraints & limitations",
      "Non-functional requirements (performance, scale)",
      "Risk assessment & mitigation",
    ],
  },
  {
    label: "Tech Stack",
    docKey: "Tech Stack",
    defaultInstruction:
      "generate a complete Tech Stack Specification with technology choices and rationale.",
    color: "emerald",
    guidedTopics: [
      "Frontend framework",
      "Backend / runtime",
      "Database type & choice",
      "Authentication method",
      "Hosting & deployment",
      "Key libraries & tools",
      "CI/CD preferences",
      "Existing constraints",
    ],
  },
  {
    label: "Architecture",
    docKey: "Architecture",
    defaultInstruction:
      "generate a complete Architecture Document using the C4 model.",
    color: "amber",
    guidedTopics: [
      "System type (monolith/micro/serverless)",
      "Core components",
      "Data flow & storage",
      "External integrations",
      "Scaling requirements",
      "Security boundaries",
    ],
  },
  {
    label: "Tech Spec",
    docKey: "Tech Spec",
    defaultInstruction:
      "generate a complete Technical Specification as an implementation blueprint.",
    color: "rose",
    guidedTopics: [
      "Core data models",
      "Business logic rules",
      "API style (REST/GraphQL/tRPC)",
      "Error handling strategy",
      "Validation rules",
      "Performance requirements",
      "Security considerations",
    ],
  },
  {
    label: "Roadmap",
    docKey: "Roadmap",
    defaultInstruction:
      "generate a complete Project Roadmap with phases, milestones, and timelines.",
    color: "sky",
    guidedTopics: [
      "Number of phases",
      "Timeline & deadlines",
      "Team size & roles",
      "Priority framework",
      "MVP scope",
      "Launch criteria",
    ],
  },
  {
    label: "API Spec",
    docKey: "API Spec",
    defaultInstruction:
      "generate a complete API Specification covering all endpoints, request/response schemas, and authentication.",
    color: "orange",
    guidedTopics: [
      "API style (REST/GraphQL)",
      "Authentication method",
      "Core resources / endpoints",
      "Versioning strategy",
      "Rate limiting",
      "Error response format",
      "Pagination approach",
    ],
  },
  {
    label: "UI Design",
    docKey: "UI Design",
    defaultInstruction:
      "generate a complete UI/UX Design Specification including design philosophy, color system, typography, component library, and screen layouts.",
    color: "pink",
    guidedTopics: [
      "Design style & mood",
      "Color palette preferences",
      "Typography choices",
      "Responsive strategy",
      "Key screens / pages",
      "Component library approach",
      "Accessibility requirements",
    ],
  },
  {
    label: "Task List",
    docKey: "Task List",
    defaultInstruction:
      "generate a comprehensive nested project task list with all phases, epics, stories, and implementation tasks — covering everything from project setup to launch.",
    color: "green",
    guidedTopics: [
      "Sprint / phase structure",
      "Priority system",
      "Team allocation",
      "Dependency ordering",
      "Testing requirements",
      "Definition of done",
    ],
  },
  {
    label: "Vibe Prompt",
    docKey: "Vibe Prompt",
    defaultInstruction:
      "generate a comprehensive Vibe Ready Prompt — a master AI handoff document that synthesizes ALL existing project documents into a single, actionable instruction file. This prompt will be given to an AI coding assistant to start building the project immediately. Include: project identity, document manifest, tech stack snapshot, architecture brief, core data models, phased implementation roadmap, development rules, expected file structure, bootstrap commands, and meta-instructions for the AI.",
    color: "lime",
    // No guidedTopics — Vibe Prompt is auto-only (synthesizes existing docs)
  },
  // --- New universal doc types ---
  {
    label: "Security Spec",
    docKey: "Security Spec",
    defaultInstruction:
      "generate a complete Security Specification covering threat model, authentication & authorization flows, data classification, encryption strategy, OWASP Top 10 mitigations, compliance requirements, and incident response procedures.",
    color: "red",
    guidedTopics: [
      "Authentication model (OAuth/JWT/SSO)",
      "Authorization & role hierarchy",
      "Data classification levels",
      "Threat vectors & attack surfaces",
      "Encryption (at rest & in transit)",
      "Compliance requirements (GDPR/SOC2)",
      "Incident response plan",
    ],
  },
  {
    label: "Data Model",
    docKey: "Data Model",
    defaultInstruction:
      "generate a complete Data Model Specification covering all core entities, their relationships, field definitions with types and constraints, indexing strategy, migration plan, and common query patterns. Use ERD-style documentation.",
    color: "teal",
    guidedTopics: [
      "Core entities & fields",
      "Relationships (1:1, 1:N, M:N)",
      "Indexing & query strategy",
      "Data validation rules",
      "Migration & versioning plan",
      "Access control patterns",
    ],
  },
];

// Color class mapping for Tailwind
export const COLOR_MAP: Record<string, string> = {
  cyan: "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50",
  violet: "border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50",
  emerald: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50",
  amber: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50",
  rose: "border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50",
  sky: "border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/50",
  orange: "border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50",
  pink: "border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/50",
  green: "border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50",
  lime: "border-lime-500/30 text-lime-400 hover:bg-lime-500/10 hover:border-lime-500/50",
  red: "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50",
  teal: "border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/50",
};

// Build the generation prompt for a given doc, accounting for custom instruction overrides
export function buildDocPrompt(
  label: string,
  docKey: string,
  instruction: string,
  existingDocs: Record<string, string>
): string {
  const parts: string[] = [];
  parts.push(
    `Based on our conversation, ${instruction}\n\nFormat the document with clear markdown headers, bullet points, and structure.`
  );
  const otherDocs = Object.entries(existingDocs).filter(
    ([k]) => k !== docKey
  );
  if (otherDocs.length > 0) {
    parts.push(
      `\n\n---\nFor context and cross-referencing, here are previously generated documents:\n`
    );
    for (const [type, content] of otherDocs) {
      parts.push(`### Existing: ${type}\n${content}\n`);
    }
    parts.push(
      `\nUse the above documents for cross-referencing. Maintain consistency with established decisions. Do NOT repeat content — reference it where relevant.`
    );
  }
  parts.push(
    `\n\n[SYSTEM:OUTPUT_FORMAT] Wrap your entire document output in ~~~doc:${docKey}\\n...content...\\n~~~ markers. Write a brief intro message before the markers. Do NOT mention this format instruction in your response.`
  );
  return parts.join("");
}

// Resolve the effective instruction for a doc (custom override or default)
export function getEffectiveInstruction(
  def: DocDefinition,
  customInstructions?: Record<string, string>
): string {
  return customInstructions?.[def.docKey] ?? def.defaultInstruction;
}
