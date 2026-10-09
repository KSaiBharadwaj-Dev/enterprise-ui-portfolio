/* Profile content, taken from the resume. Edit the text here and reload the page.
   Each experience entry shows its first `visible` bullets and tucks the rest behind a button. */
window.PROFILE = {
  lead: "PMP- and CSPO-certified Project & Product Manager with 4+ years leading cloud transformation and platform-delivery programs end to end across financial services, retail, and technology.",

  summary:
    "Currently delivery lead on ADMIS UK's flagship $1.5M Microsoft Dynamics 365 Finance transformation, coordinating a 15-member SME team and driving the replanning that compressed the program from 2 years to 18 months. Owns the full lifecycle, from discovery, roadmap, and requirements through build, UAT, cutover, hypercare, and benefits realization, and the governance around it: RAID, Change Advisory Board (CAB), go/no-go, and steering committees. Fluent in Agile/Scrum, backlog and stakeholder management, and technical trade-off discussions with engineering, with hands-on SQL, Power BI, and AWS/GCP depth that lets leadership trust the data behind every decision.",

  // The short list beside the introduction.
  facts: [
    {
      label: "Now",
      value: "Project Manager, ADM Investor Services",
      note: "Delivering a $1.5M Dynamics 365 Finance transformation",
    },
    { label: "Experience", value: "4+ years", note: "Financial services, retail, technology" },
    {
      label: "Also builds",
      value: "HTML, CSS, TypeScript, React",
      note: "Running live on the UI skills page, with Angular examples",
    },
    { label: "Certified", value: "PMP, CSPO, Power BI PL-300" },
    {
      label: "Education",
      value: "MS, USC Marshall",
      note: "Engineering Management and Business Analytics, 4.0 CGPA",
    },
  ],

  // Four headline numbers shown under the introduction.
  results: [
    {
      value: "$1.5M",
      label: "Microsoft Dynamics 365 Finance transformation program at ADMIS UK",
    },
    {
      value: "2 yr to 18 mo",
      label: "Program timeline after re-baselining, with scope and headcount held flat",
    },
    {
      value: "330K",
      label: "Brokerage and retirement clients on Fidelity's modernized account opening",
    },
    { value: "56", label: "Engineering teams using the load-testing platforms I built at Lowe's" },
  ],

  experience: [
    {
      company: "ADM Investor Services (ADMIS)",
      role: "Project Manager",
      location: "Chicago, IL",
      start: "Jan 2026",
      end: "Present",
      visible: 5,
      bullets: [
        "Own end-to-end delivery of ADMIS UK's flagship $1.5M Microsoft Dynamics 365 (D365) Finance transformation, coordinating a 15-member SME team across accounting, treasury, IT, Microsoft, and DevOps to migrate the firm's books and records off the legacy VAX platform.",
        "Compressed the program from a 2-year to an 18-month timeline by re-baselining the delivery plan into parallel and sequential workstreams, holding scope and headcount flat.",
        "Migrated 150K UK customer accounts into D365 and stood up a parallel monthly cutover that transitions the live financial close from VAX to D365, keeping books and records production-stable throughout.",
        "Own the source-to-target design for trade and transaction flows fed from GMI into D365, spanning 56 month-end journals (13 of them automated) feeding 10 management P&L and expense analysis packs.",
        "Delivered an automated, ETL-style Accounting View on the firm's AWS data platform that prepares and reconciles 3 daily journals (CSH, OPN, CMF) and 13 interlinked monthly journals, clearing a reconciliation roadblock that had threatened the UK go-live.",
        "Author and shepherd 28 SDLC change requests from design through Change Advisory Board (CAB) approval into production, chairing go/no-go reviews with rollback plans staged for every release.",
        "Govern the program front to back: maintain the RAID log, present risk, dependency, and milestone status to steering committees, and hold executive sponsors aligned to the 18-month timeline and $1.5M budget.",
        "Act as functional SME for accounting operations, translating account and balance setup, GL and sub-ledger configuration, month-end close, financial reporting, controls, compliance, and GDPR into governed requirements the delivery team builds against.",
        "Own the UAT strategy and test scenarios across the D365 finance modules, orchestrate defect triage in JIRA with the 15 SMEs, and gate each release on formal business sign-off.",
        "Direct mock conversions and cutover rehearsals for the balance migration, reconciling migrated balances to source and documenting break resolution as evidence for internal and external audit.",
        "Lead post-go-live hypercare, driving the team to trace breaks between D365 and downstream reporting through AWS CloudWatch to root-cause closure and stabilize the monthly close.",
        "Champion Agile adoption across the Portfolio Management team, replacing Excel trackers with JIRA and standing up sprint ceremonies that lift task visibility and sprint predictability across business and IT.",
        "Sponsor company-wide Databricks enablement backed by executive leadership, accelerating cloud data-platform adoption across business and technical teams.",
        "Lead product discovery and requirements to integrate treasury services into the NEXUS portal, shaping a unified, one-stop service platform for vendors and customers.",
      ],
      environment:
        "Microsoft Dynamics 365 Finance (Cloud ERP), AWS (S3, CloudWatch), SQL, Databricks, ETL, Power BI, JIRA, Confluence, Agile/Scrum, SDLC, RAID, CAB",
    },
    {
      company: "Fidelity Investments",
      role: "Senior Business Analyst",
      location: "Los Angeles, CA",
      start: "Aug 2024",
      end: "Dec 2025",
      visible: 5,
      bullets: [
        "Co-led delivery coordination alongside the program PM on Fidelity's digital onboarding modernization (Wealthscape Onboarding Engine), a 45-person, front-to-back program across IT/engineering, finance, compliance, and product that modernized account opening for 330K brokerage and retirement (IRA/401(k)) clients.",
        "Anchored the requirements and analysis workstream as one of two BAs, converting a 3-month discovery into BRDs, user stories, and acceptance criteria and grooming a Fibonacci-pointed backlog on a 2-week sprint cadence.",
        "Delivered onboarding automation to 75.9% of custody clients and 37.6% of clearing clients while holding a 99% In-Good-Order (IGO) rate through automated validation, the program's headline outcomes.",
        "Embedded KYC/AML, suitability, and disclosure obligations into onboarding workflows as testable requirements, de-risking releases in a regulated, audited environment.",
        "Shepherded 140+ change requests from requirements through Change Advisory Board (CAB) review across the build, driving go/no-go readiness on a 2-week release cadence.",
        "Reconciled account, transaction, and client data across source systems on AWS (Redshift, S3), authoring SQL validation rules with engineering that tightened reporting accuracy and cut manual exceptions.",
        "Ran end-to-end UAT alongside the second BA, orchestrating defect triage across business, compliance, and engineering and holding requirements traceability (RTM) from intake through release.",
        "Steered pre-live readiness ahead of go-live, certifying the platform against a 250K MAU load target before production cutover.",
        "Stood up the post-launch KPI framework, building Power BI and Tableau dashboards across onboarding conversion, application drop-off, processing turnaround, and 40+ operational metrics that drove roadmap prioritization each release.",
        "Owned business-side incident response post-release, leading root-cause analysis, adjudicating fixes versus workarounds, and managing stakeholder communications under time pressure.",
        "Attested testing evidence, financial controls, and control narratives for internal and external audit across the onboarding release cycle.",
      ],
      environment:
        "AWS (Redshift, S3), SQL, Power BI, Tableau, JIRA, Confluence, Agile/Scrum, UAT, RTM, CAB",
    },
    {
      company: "Lowe's",
      role: "Technical Business Analyst",
      location: "Bengaluru, India",
      start: "Jun 2021",
      end: "Jun 2023",
      visible: 5,
      bullets: [
        "Drove three concurrent workstreams across a 2-year tenure: building two internal performance-engineering platforms within a 10-developer team while running business analysis on Lowe's RELEX omnichannel program, a 47-person effort spanning merchandising, supply chain, store operations, and engineering.",
        "Built and shipped PitStop, then PerfX, internal load-testing platforms adopted by 56 engineering teams org-wide, owning the stack hands-on from Java/Spring Boot services and React UI through metrics pipelines and CI/CD.",
        "Drove the PerfX proof of concept from skeleton to production, evolving the platform from consuming metrics to calculating them in-house and scaling it to 150 daily active users running 1,500+ performance tests per day at peak.",
        "Engineered 28 REST endpoints on Spring Boot and 3 Kafka modules that computed performance metrics asynchronously, decoupling heavy computation from request handling to keep the platform responsive under load.",
        "Containerized the open-source k6 load-testing tool with Docker and integrated InfluxDB and Grafana to ingest and visualize latency, throughput, and error metrics from servers, APIs, and monitored assets.",
        "Stood up CI/CD on Kubernetes with ArgoCD and Rancher, automating build, image, and deployment pipelines and release cadence across both platforms.",
        "Led architecture and design discussions on module boundaries, asynchronous metric processing, and platform scalability, aligning the developer team on technical trade-offs across releases.",
        "Elicited requirements from merchandising, supply chain, and store operations on RELEX and authored functional and interface specifications standardizing omnichannel order routing and fulfillment across 1,700+ North American stores.",
        "Specified integrations across order management, inventory, and store systems, defining data mapping, GCP Pub/Sub event flows, and error-handling rules for SKU rationalization; within the first year post-deployment the program reversed a three-year inventory-turn decline, lifting TTM turnover to 3.41x.",
        "Mapped As-Is/To-Be fulfillment workflows and documented business rules, cutting manual handoffs and reducing order processing cycle time by 30%.",
        "Ran UAT ahead of the peak-season code freeze, coordinating defect triage and business sign-off, and drove rollout readiness through SOPs, training, and knowledge transfer to store operations.",
        "Defined sales, inventory, and fulfillment KPIs and built Power BI and Tableau dashboards on GCP BigQuery, surfacing insights that helped operations cut out-of-stock incidents by 15%.",
      ],
      environment:
        "Java, Spring Boot, React, Kafka, Kubernetes, ArgoCD, Rancher, Docker, k6, InfluxDB, Grafana, GCP (BigQuery, Pub/Sub), SQL, Power BI, Tableau, JIRA, Confluence, Agile/Scrum",
    },
  ],

  skills: [
    {
      group: "Project & program delivery",
      items: [
        "Agile/Scrum",
        "Kanban",
        "SDLC",
        "Roadmapping",
        "Sprint planning and backlog management",
        "RAID and risk management",
        "Change management (CAB)",
        "Release, cutover and go/no-go planning",
        "Hypercare",
        "Dependency management",
        "Timeline re-baselining",
      ],
    },
    {
      group: "Product management",
      items: [
        "Product discovery",
        "Requirements definition",
        "User stories and acceptance criteria",
        "Backlog prioritization (Fibonacci)",
        "Proof of concept to production",
        "Roadmap and stakeholder alignment",
        "KPI definition and benefits realization",
      ],
    },
    {
      group: "Stakeholder & governance",
      items: [
        "Executive and steering committee reporting",
        "Cross-functional leadership",
        "Vendor and compliance coordination",
        "JAD sessions",
        "Audit and financial controls support",
        "Stakeholder management",
      ],
    },
    {
      group: "Technical fluency",
      items: [
        "SQL",
        "Power BI (DAX)",
        "Tableau",
        "AWS (S3, Redshift, CloudWatch, QuickSight)",
        "GCP (BigQuery, Pub/Sub)",
        "Databricks",
        "Kafka",
        "Kubernetes",
        "CI/CD (ArgoCD, Rancher)",
        "Java/Spring and React (delivery oversight)",
        "ETL/ELT",
        "Data modeling",
      ],
    },
    {
      group: "Tools",
      items: [
        "JIRA",
        "Confluence",
        "Microsoft Visio",
        "Lucidchart",
        "SharePoint",
        "Advanced Excel",
        "Git",
      ],
    },
  ],

  certifications: [
    { name: "PMP, Project Management Professional", issuer: "Project Management Institute (PMI)" },
    { name: "CSPO, Certified Scrum Product Owner", issuer: "Scrum Alliance" },
    { name: "Microsoft Certified: Power BI Data Analyst Associate (PL-300)", issuer: "Microsoft" },
    { name: "Google Advanced Data Analytics Professional Certificate", issuer: "Google" },
    {
      name: "Google Data Analytics and IBM Data Analyst Professional Certificates",
      issuer: "Google, IBM",
    },
  ],

  education: [
    {
      school: "University of Southern California, Marshall School of Business",
      degree: "Master of Science in Engineering Management and Business Analytics",
      detail: "CGPA: 4.0",
      location: "Los Angeles, CA",
      date: "May 2025",
    },
  ],
};
