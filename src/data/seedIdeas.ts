import type { VentureIdea } from '../utils/ventureMath';

export interface FounderMember {
  name: string;
  role: string;
  specialty: string;
}

export const INITIAL_FOUNDERS: FounderMember[] = [
  { name: 'Jurjen', role: 'Advisory Board & AI Architect', specialty: 'Beheert de ChatGPT Dot & Strategische Validatie' },
  { name: 'Daan', role: 'B2B Sales & Deals', specialty: 'Enterprise acquisitie & koude outreach' },
  { name: 'Bram', role: 'Product & Automatisering', specialty: 'AI-workflows, integraties & MVP-bouw' },
  { name: 'Thijs', role: 'Finance & Pricing', specialty: 'ARR-modellering, unit economics & €10M-exit math' },
  { name: 'Luuk', role: 'Domain Expert Logistiek/Bouw', specialty: 'Praktijkprocessen & klantinterviews' },
  { name: 'Sander', role: 'Growth & Outbound', specialty: 'Leadgeneratie & schaalbare funnels' },
  { name: 'Wouter', role: 'Full-Stack Engineer', specialty: 'Architectuur, API-koppelingen & security' },
  { name: 'Ruben', role: 'Operations & Onboarding', specialty: 'Klantimplementatie & retentie' },
  { name: 'Stijn', role: 'Legal & Compliance', specialty: 'EU AI Act, contracten & intellectueel eigendom' },
  { name: 'Bas', role: 'Customer Success & Pilots', specialty: 'Begeleiden van de eerste 10 betalende klanten' },
];

export const SEED_IDEAS: VentureIdea[] = [
  {
    id: 'idea-jurjen-tender-ai',
    title: 'InfraBestek AI — Autonome Calculatie & Aanbestedings-Agent',
    founderName: 'Jurjen',
    authorUid: 'seed-founder-jurjen',
    shortSummary:
      'Autonome AI-agent voor middelgrote bouw- en infrabedrijven die bestekken van 400+ pagina’s controleert op risicoclausules en direct een calculatie-opzet genereert.',
    problemStatement:
      'Middelgrote aannemers en installatiebedrijven besteden 40 tot 80 uur van dure calculatoren per aanbesteding. Ze winnen slechts 1 op de 6 tenders en missen vaak verborgen boeteclausules in RAW/UAV-GC bestekken.',
    aiSolution:
      'Een gespecialiseerde multi-agent pijplijn die PDF-bestekken, CAD-staatjes en historische kostprijzen van het bouwbedrijf kruist. Binnen 18 minuten levert het systeem een rode-vlaggenrapport, concept-inschrijfstaat en concept-plan van aanpak.',
    targetMarket: 'Middelgrote bouw-, infra- en installatiebedrijven in de Benelux & DACH (50–500 fte)',
    stage: 'execution',
    monthlyPriceEur: 1250,
    targetCustomers: 150,
    arrMultiple: 8,
    estimatedValuationEur: 18_000_000,
    votesCount: 9,
    dotVerdict: 'go',
    dotScore: 92,
    dotSummaryAdvice:
      'Dot van Jurjen oordeel: Voltreffer voor de €10M+ doelstelling (€18,0M waardering bij slechts 150 klanten). Eén gemiste boeteclausule in de bouw kost al €50.000+, waardoor €1.250/mnd een no-brainer is voor elke directie.',
    dotNextSteps:
      '1. Luuk & Daan verzamelen deze week 5 echte oude bestekken bij bevriende aannemers.\n2. Bram & Wouter bouwen een ‘Shadow-Run’ prototype dat op die 5 bestekken fouten aantoont die menselijke calculatoren over het hoofd zagen.\n3. Verkoop 5 betaalde pilots van €1.000/mnd vóórdat jullie het klantportaal uitbouwen.',
    dotCriticalRisk:
      'Aansprakelijkheid bij rekenfouten: positioneer de AI juridisch en in de UI altijd als "Tweede Paar Ogen & Pre-Calculator" waarbij de hoofdcalculator finaal akkoord geeft.',
    createdAt: '2026-11-04T19:30:00.000Z',
    updatedAt: '2026-11-06T07:45:00.000Z',
  },
  {
    id: 'idea-daan-customs-agent',
    title: 'DouaneFlow AI — Automatische HS-Code & CBAM Compliance Engine',
    founderName: 'Daan',
    authorUid: 'seed-founder-daan',
    shortSummary:
      'AI-compliance agent voor Europese importeurs en expediteurs die facturen, paklijsten en leveranciersdata automatisch vertaalt naar foutloze douaneaangiftes en CBAM-emissierapportages.',
    problemStatement:
      'Sinds de strenge EU CBAM-regels en complexe HS-tarifering krijgen importeurs en logistiek dienstverleners hoge boetes en vertragingen in Rotterdam en Antwerpen. Declaranten zijn onvindbaar op de arbeidsmarkt.',
    aiSolution:
      'Koppelt direct aan de mailbox en het ERP/WMS van de importeur. Leest ongestructureerde PDF-facturen en certificaten uit China/Turkije/VS, valideert de juiste goederencode (HS-code) met jurisprudentie-bronverwijzing en vult het aangiftebestand klaar voor verzending.',
    targetMarket: 'Douane-expediteurs en industriële groothandels in Nederland, België en Duitsland',
    stage: 'business_case',
    monthlyPriceEur: 850,
    targetCustomers: 180,
    arrMultiple: 8,
    estimatedValuationEur: 14_688_000,
    votesCount: 8,
    dotVerdict: 'go',
    dotScore: 88,
    dotSummaryAdvice:
      'Dot van Jurjen oordeel: IJzersterke B2B painkiller met €14,7M waarderingspotentieel. Regeldruk vanuit Brussel (CBAM) dwingt duizenden bedrijven om nu te investeren.',
    dotNextSteps:
      '1. Focus eerst 100% op één niche: metaal- en machine-importeurs die onder CBAM vallen.\n2. Laat Stijn de EU CBAM-rapportage-eisen mappen in een vaste validatietemplate.\n3. Daan benadert 20 douane-expediteurs in regio Rotterdam voor een betaalde proefmaand.',
    dotCriticalRisk:
      'Integratie-frictie met verouderde douanesoftware (zoals CargoWise of lokale pakketten). Begin met een CSV/XML-export die elk pakket direct kan inlezen.',
    createdAt: '2026-11-05T10:15:00.000Z',
    updatedAt: '2026-11-06T07:50:00.000Z',
  },
  {
    id: 'idea-bram-medische-verzuim',
    title: 'ArboCasus AI — Dossier- & Wet Verbetering Poortwachter Co-Pilot',
    founderName: 'Bram',
    authorUid: 'seed-founder-bram',
    shortSummary:
      'AI-co-pilot voor arbodiensten en verzuimcasemanagers die gesprekken samenvat, Poortwachter-deadlines bewaakt en loonsancties van het UWV voorkomt.',
    problemStatement:
      'Eén fout of gemiste stap in het 2-jarige Wet Verbetering Poortwachter-traject levert werkgevers een UWV-loonsanctie op van gemiddeld €45.000 tot €60.000. Casemanagers verdrinken in administratie.',
    aiSolution:
      'Zet gespreksverslagen van bedrijfsartsen en casemanagers (zonder medische geheimhouding te schenden) direct om in UWV-conforme Probleemanalyses, Bijstellingen en Eerstejaarsevaluaties, inclusief automatische rode-vlaggen bij dreigende loonsanctie.',
    targetMarket: 'Zelfstandige arbodiensten, verzuimadviseurs en HR-afdelingen (250+ medewerkers)',
    stage: 'validated',
    monthlyPriceEur: 600,
    targetCustomers: 220,
    arrMultiple: 8,
    estimatedValuationEur: 12_672_000,
    votesCount: 7,
    dotVerdict: 'go',
    dotScore: 84,
    dotSummaryAdvice:
      'Dot van Jurjen oordeel: Typisch Nederlands/Europees miljoenenprobleem waar Silicon Valley-giganten nooit voor bouwen. Met 220 aangesloten arbodiensten/middelgrote werkgevers zitten jullie op €12,7M waardering.',
    dotNextSteps:
      '1. Scheid medische data strikt van procesmatige Poortwachter-data (AVG/NEN7510).\n2. Bouw een gratis "UWV Loonsanctie Risico-Scanner" als leadmagnet voor arbodiensten.\n3. Test de output met 3 gecertificeerde register-casemanagers.',
    dotCriticalRisk:
      'Privacy & AVG bij gezondheidsgegevens: verwerk uitsluitend functionele belastbaarheid en processtappen, nooit ruwe medische diagnoses.',
    createdAt: '2026-11-05T14:20:00.000Z',
    updatedAt: '2026-11-06T08:00:00.000Z',
  },
  {
    id: 'idea-thijs-cnc-quoting',
    title: 'VerspaningQuote AI — Instant Offerte-Engine voor Metaal & CNC-Fabrieken',
    founderName: 'Thijs',
    authorUid: 'seed-founder-thijs',
    shortSummary:
      'Leest 3D STEP-files en technische PDF-werktekeningen uit en berekent binnen 60 seconden cyclustijd, materiaalkosten en marge voor toeleveranciers in de maakindustrie.',
    problemStatement:
      'Fijnmechanische en plaatwerkbedrijven krijgen dagelijks tientallen offerte-aanvragen binnen. De werkvoorbereider doet er 3 dagen over; wie het eerst reageert met een scherpe prijs wint de order.',
    aiSolution:
      'Geometrische AI + vision-model dat toleranties, schroefdraad en nabewerkingen op de PDF-tekening herkent, koppelt aan actuele staal/aluminiumprijzen en direct een concept-offerte in het ERP zet.',
    targetMarket: 'Metaalbewerkings-, CNC- en plaatwerkbedrijven in NL, BE en Noordrijn-Westfalen',
    stage: 'business_case',
    monthlyPriceEur: 950,
    targetCustomers: 140,
    arrMultiple: 8,
    estimatedValuationEur: 12_768_000,
    votesCount: 6,
    dotVerdict: 'go',
    dotScore: 86,
    dotSummaryAdvice:
      'Dot van Jurjen oordeel: Maakindustrie betaalt grif voor snelheid aan de voorkant. Slechts 140 fabrieken op €950/mnd is al €1,6M ARR en ~€12,8M bedrijfswaarde.',
    dotNextSteps:
      '1. Verzamel 50 historische STEP-bestanden + daadwerkelijke nacalculaties bij één bevriende metaalfabriek.\n2. Kalibreer de afwijking tot onder de 8%.\n3. Verkoop als "Offerte binnen 5 minuten op je eigen website"-module.',
    dotCriticalRisk:
      'Complexe 5-assige verspaning is lastig exact te schatten; begin met draai-/freeswerk en lasersnijden/kanten waar de rekenregels strakker zijn.',
    createdAt: '2026-11-05T16:40:00.000Z',
    updatedAt: '2026-11-06T08:05:00.000Z',
  },
  {
    id: 'idea-sander-podcaster-clips',
    title: 'SocialClipper B2C — Automatische TikTok & Reels Knipper voor Creators',
    founderName: 'Sander',
    authorUid: 'seed-founder-sander',
    shortSummary:
      'B2C tool van €29/mnd die lange podcasts opknipt in virale shorts met ondertiteling.',
    problemStatement:
      'Content creators en kleine podcasters vinden het tijdrovend om korte videofragmenten te monteren voor TikTok en Instagram.',
    aiSolution:
      'Upload een YouTube-link en ontvang 10 geknipte verticale clips met automatische captions.',
    targetMarket: 'Startende podcasters en hobby-creators',
    stage: 'idea',
    monthlyPriceEur: 29,
    targetCustomers: 1200,
    arrMultiple: 6,
    estimatedValuationEur: 2_505_600,
    votesCount: 2,
    dotVerdict: 'pivot',
    dotScore: 46,
    dotSummaryAdvice:
      'Dot van Jurjen oordeel: Waarschuwing! Bij €29/mnd hebben jullie bijna 5.000 betalende klanten nodig (en enorme advertentiekosten + hoge churn) om €10M waardering te halen. Bovendien zijn OpusClip en Descript al dominant.',
    dotNextSteps:
      '1. Pivot van B2C (€29/mnd) naar B2B Enterprise Compliance Video of interne kennistransfer voor grote technische bedrijven (€750+/mnd).\n2. Zoek een niche waar standaard video-tools falen (bijv. automatische meertalige veiligheidsinstructies voor fabrieksmedewerkers).',
    dotCriticalRisk:
      'Veel te lage ticketprijs (€29/mnd) en moordende concurrentie; met 10 vrienden word je hier niet miljonair van tenzij jullie pivoten naar B2B.',
    createdAt: '2026-11-05T21:10:00.000Z',
    updatedAt: '2026-11-06T08:10:00.000Z',
  },
];
