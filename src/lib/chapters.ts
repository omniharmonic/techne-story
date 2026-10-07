/** Main narration stays brief; chapter notes hold mechanisms, evidence and limits. */
export const SOURCES = {
  enshittification: { title: "Cory Doctorow · Enshittification", url: "https://pluralistic.net/2023/01/21/potemkin-ai/" },
  "internet": {
    "title": "Internet Society · A brief history, by its builders",
    "url": "https://www.internetsociety.org/internet/history-internet/brief-history-internet/"
  },
  "web": {
    "title": "CERN · The birth of the Web",
    "url": "https://home.cern/science/computing/the-birth-of-the-web/"
  },
  "surveillance": {
    "title": "FTC · A Look Behind the Screens (2024)",
    "url": "https://www.ftc.gov/reports/look-behind-screens-examining-data-practices-social-media-video-streaming-services"
  },
  "wellbeing": {
    "title": "Allcott et al. · The Welfare Effects of Social Media",
    "url": "https://www.nber.org/papers/w25514"
  },
  "politics": {
    "title": "Nyhan et al. · Like-minded sources on Facebook (2023)",
    "url": "https://www.nature.com/articles/s41586-023-06297-w"
  },
  "ai": {
    "title": "FTC · AI partnerships and investments (2025)",
    "url": "https://www.ftc.gov/reports/ftc-staff-report-ai-partnerships-investments-6b-study"
  },
  "protocol": {
    "title": "AT Protocol · Architecture and portability",
    "url": "https://atproto.com/guides/overview"
  },
  "sharing": {
    "title": "Airbnb · Founding model and network effects (2020 filing)",
    "url": "https://www.sec.gov/Archives/edgar/data/1559720/000119312520294801/d81668ds1.htm"
  },
  "mobility": {
    "title": "Uber · Platform and network model (2019 filing)",
    "url": "https://www.sec.gov/Archives/edgar/data/1543151/000119312519103850/d647752ds1.htm"
  },
  "lexicons": {
    "title": "AT Protocol · Shared and custom lexicons",
    "url": "https://atproto.com/guides/lexicon"
  }
};
export type SourceKey = keyof typeof SOURCES;
export type Chapter = { id: string; act: string; chapter: string; title: string; body: string; scene: number; action: string; note: string; sources: SourceKey[]; mechanism: string };
export const BEATS: Chapter[] = [
  {
    "id": "connection",
    "act": "Origins",
    "chapter": "Connection",
    "title": "Another web\nis possible.",
    "body": "The internet began with a beautiful idea. People could connect directly. The network belonged to everyone.",
    "scene": 0,
    "action": "",
    "mechanism": "",
    "note": "The opening expresses an ideal, not a claim that access or ownership was ever equal. Governments, universities, companies and communities built the internet. Its distinctive possibility was that independent networks could communicate through shared rules.",
    "sources": [
      "internet"
    ]
  },
  {
    "id": "packets",
    "act": "Origins",
    "chapter": "Networks of networks",
    "title": "No single center.\nMany ways through.",
    "body": "Messages became packets. Separate networks learned a shared language. A university, a laboratory, a person at home: different worlds could finally reach one another.",
    "scene": 0.2,
    "action": "Send a packet",
    "mechanism": "Independent networks · shared rules",
    "note": "Packets are pieces of data, not literal light in every medium. TCP/IP lets networks interoperate without requiring identical hardware or a single operator. Routes can change; delivery still depends on working infrastructure. The illustration compresses decades of development into a landscape of connected places.",
    "sources": [
      "internet"
    ]
  },
  {
    "id": "open-web",
    "act": "Origins",
    "chapter": "The open Web",
    "title": "A link was\nan open door.",
    "body": "Pages linked to pages. People published, discovered, and built on each other’s work. In 1993, CERN released the Web software into the public domain. Permission was no longer the starting point.",
    "scene": 0.42,
    "action": "",
    "mechanism": "Publish · link · discover",
    "note": "The Web is one service on the internet, not the internet itself. Its shared conventions let independently hosted pages link across organizations. Open publishing did not remove inequalities of access, hosting costs or moderation needs; it widened who could build.",
    "sources": [
      "web"
    ]
  },
  {
    "id": "sharing",
    "act": "Enclosure",
    "chapter": "Open roads, private gates",
    "title": "The value was\nalready between us.",
    "body": "Search helped us find. Marketplaces helped us trade. A room, a ride, a friendship: the value was already between us. Airbnb, Uber, and Facebook made these networks useful—then became the gates through which we reached one another.",
    "scene": 1.25,
    "action": "",
    "mechanism": "People supply the assets. Relationships create the value.",
    "note": "Network effects can create real value: a service is often more useful when others participate. The problem arises when that value is difficult to carry elsewhere. This chapter is a model of platform dependence, not a claim that every large service has the same business model. A social graph records relationships between people. Platforms can control access to those records, visibility and discovery without literally owning a friendship. The internet’s open transport layer does not guarantee that applications will make those relationships portable. Enclosure happens through design, contracts, defaults and data access. Airbnb and Uber describe networks in which participants attract one another. Their services also contribute discovery, coordination, payments and trust mechanisms. The distinction is between creating a useful service and controlling access to the network that participants sustain. These are examples of platform enclosure, not a claim that every company is legally a monopoly.",
    "sources": [
      "internet",
      "protocol",
      "sharing",
      "mobility"
    ]
  },
  {
    "id": "growth",
    "act": "Enclosure",
    "chapter": "Enshittification",
    "title": "Our network.\nSomeone else’s return.",
    "body": "Investors expect returns. Attract people. Make leaving hard. Then give them less and charge more. This is enshittification: extracting returns from the people who make the network valuable.",
    "scene": 1.8,
    "action": "",
    "mechanism": "Investment → enclosure → recurring extraction",
    "note": "Cory Doctorow calls this pattern enshittification: platforms attract users, shift value toward business customers, then squeeze both to benefit the platform. Venture capital, private equity and public share ownership are different financing arrangements. The common pressure discussed here is the pursuit of returns through a privately controlled platform. Airbnb and Uber are examples of network businesses, not examples of present-day private-equity ownership. Profit can reward useful service; enclosure can let returns grow without equivalent benefits for participants.",
    "sources": [
      "enshittification",
      "sharing",
      "mobility"
    ]
  },
  {
    "id": "extraction",
    "act": "The human cost",
    "chapter": "The attention market",
    "title": "Our attention.\nTheir empire.",
    "body": "A pause. A click. One more minute. Advertising turns these traces into predictions about what will hold us. The better the system gets at keeping us here, the more attention it can sell.",
    "scene": 2,
    "action": "Trace an exchange",
    "mechanism": "Watch → predict → rank → sell",
    "note": "The FTC’s 2024 study documented extensive data collection and monetization across major social and video services. Ad-funded models can reward engagement and targeting. The gold flowing inward represents captured value; it is not a literal transaction record or a measurement of any one company.",
    "sources": [
      "surveillance"
    ]
  },
  {
    "id": "psyche",
    "act": "The human cost",
    "chapter": "The inner world",
    "title": "The feed enters\nour inner world.",
    "body": "Comparison follows us home. Interruptions fracture the day. Systems tuned for return visits pull against sleep, attention, and the slow work of belonging. Connection is real. So is the cost of never quite leaving.",
    "scene": 2.2,
    "action": "",
    "mechanism": "A person’s rhythm. A platform’s rhythm.",
    "note": "Effects differ across people, platforms and uses. A randomized Facebook deactivation study found improved subjective well-being and more offline activity, but also less factual news knowledge. That result is not a diagnosis of every user or proof that all online connection is harmful.",
    "sources": [
      "wellbeing"
    ]
  },
  {
    "id": "livelihoods",
    "act": "The human cost",
    "chapter": "Life at the gate",
    "title": "A livelihood\non borrowed ground.",
    "body": "Creators need reach. Shops need discovery. Communities need a place to meet. When one gate controls the way in, a changed ranking or rising fee can reshape a life beyond the screen.",
    "scene": 2.36,
    "action": "",
    "mechanism": "Those who make the value do not always set the terms.",
    "note": "This is the economic risk of dependence on an intermediary. A seller may own their products while a platform controls discovery; a creator may make the work while a platform controls distribution. The illustration shows unequal bargaining power, not a quantitative estimate of platform fees or income loss.",
    "sources": []
  },
  {
    "id": "democracy",
    "act": "The human cost",
    "chapter": "The shared world",
    "title": "A public square.\nA private control room.",
    "body": "The same machinery helps decide what becomes visible, whose voice travels, and which conflicts fill the day. Democracy needs shared attention. Its conditions are increasingly shaped by systems the public does not govern.",
    "scene": 2.52,
    "action": "",
    "mechanism": "Who sets the conditions for being heard?",
    "note": "Algorithms shape exposure, but polarization has many causes. In a 2023 Facebook experiment, reducing like-minded content did not measurably reduce political polarization. The chapter’s argument concerns private control of public visibility; the divided light is a metaphor, not evidence that algorithms alone divide society.",
    "sources": [
      "politics"
    ]
  },
  {
    "id": "acceleration",
    "act": "Acceleration",
    "chapter": "The machine eye",
    "title": "The race\ngets a mind.",
    "body": "AI can generate the message, predict the response, and repeat the experiment at scale. Put that capacity inside an extraction machine, and it gains new ways to reach into our lives.",
    "scene": 2.95,
    "action": "",
    "mechanism": "Generate → predict → adapt → repeat",
    "note": "This is a conditional scenario, not an assertion that all AI is used this way. The FTC’s AI partnership study identifies concentration risks around cloud access, contractual commitments and privileged information. AI can also support science, creativity and public benefit. Ownership and incentives help determine the direction.",
    "sources": [
      "ai"
    ]
  },
  {
    "id": "moloch",
    "act": "Acceleration",
    "chapter": "The race for everything",
    "title": "When enough\nis never enough.",
    "body": "More data. More compute. More territory. Each giant races because the others are racing. This is Moloch: a system that can push its participants to sacrifice the world they all depend on.",
    "scene": 3.35,
    "action": "",
    "mechanism": "The pressure to win can outrun the reason to build.",
    "note": "Moloch is a metaphor for destructive competitive incentives, not a literal entity or a theory that firms secretly coordinate. The reaching tendrils dramatize a risk: AI capacity and control of infrastructure reinforcing each other. This future is neither certain nor unavoidable.",
    "sources": [
      "ai"
    ]
  },
  {
    "id": "reconnect",
    "act": "A living web",
    "chapter": "Direct relationships",
    "title": "A different web\nstarts between us.",
    "body": "The value still lives between us. A ride. A shared tool. A meal grown nearby. Community-owned apps help people find each other and exchange locally. Value circulates through reciprocity, instead of always leaving the place that created it.",
    "scene": 4.4,
    "action": "Send a spark",
    "mechanism": "Give · receive · share onward",
    "note": "Peer relationships do not require every device to connect directly to every other device. Servers can still help. The goal is to reduce compulsory dependence on one owner and give people meaningful choice over how they connect. The returning light illustrates reciprocity, not a promised financial return. Open technology is one part of the response. Competition policy, privacy protections, public investment, accountable moderation and cooperative ownership address different parts of the problem. The story proposes combining these approaches; no single protocol guarantees a democratic economy.",
    "sources": []
  },
  {
    "id": "sdk",
    "act": "A living web",
    "chapter": "The Techne layer",
    "title": "Local apps.\nA shared way through.",
    "body": "The Techne SDK is our proposed distribution layer for community-owned apps. Building on AT Protocol, it helps local tools speak a common language and reach connected communities. Each app can join a network larger than itself.",
    "scene": 5.22,
    "action": "",
    "mechanism": "AT Protocol → shared app language → community distribution",
    "note": "This is proof-of-concept storytelling. Techne’s approach adds companion services, or sidecars, and its own lexicons alongside community lexicons. Shared records let compatible apps understand the same events, offers or resources. Distribution means helping communities discover and use these tools. These illustrations describe the intended architecture, not verified deployment or adoption. AT Protocol is one example: it separates hosting, identity and applications in a federated server architecture. It is not device-to-device networking. Successful migration still depends on keys, data and available services. Portability helps make exit possible; it does not eliminate concentration or governance problems.",
    "sources": [
      "lexicons",
      "protocol"
    ]
  },
  {
    "id": "remix",
    "act": "A living web",
    "chapter": "Make it your own",
    "title": "Remix the app.\nKeep the connection.",
    "body": "With AI-assisted “vibe coding,” a community can adapt a calendar, exchange, or tool library to its own needs. Keep the shared language intact, and local differences can flourish while the apps still talk to each other.",
    "scene": 5.43,
    "action": "Remix a local app",
    "mechanism": "Different local tools · compatible shared records",
    "note": "AI assistance can lower the effort of making software. It does not automatically make code safe, accessible or interoperable. The proposal pairs reusable building blocks with review and compatibility checks. A local remix must preserve agreed record formats, permissions and behavior to remain connected. No production-ready SDK or one-click guarantee is implied.",
    "sources": [
      "lexicons"
    ]
  },
  {
    "id": "stewardship",
    "act": "A living web",
    "chapter": "Belonging takes work",
    "title": "Small enough\nto care for.",
    "body": "When members own the platform, its purpose can follow the place: useful exchange, shared care, a thriving economy. Decisions and surplus serve the people doing the work—and the living systems they depend on.",
    "scene": 5.65,
    "action": "",
    "mechanism": "Shared rules · shared upkeep · a real voice",
    "note": "These are design proposals, not claims that every cooperative succeeds. Communities need budgets, accountable decisions, moderation and safe ways to leave. Different groups can choose different arrangements while remaining able to exchange across their boundaries. The circles represent stewardship rather than new walls.",
    "sources": []
  },
  {
    "id": "federation",
    "act": "A living web",
    "chapter": "Many small centers",
    "title": "Small together\nbecomes powerful.",
    "body": "Cooperatives connect across neighborhoods and watersheds. Local ownership. Shared reach. Together, useful alternatives let people leave the giants without leaving one another.",
    "scene": 5.98,
    "action": "Connect the communities",
    "mechanism": "Local ownership · shared reach · network effects that accumulate",
    "note": "This is the David-and-Goliath strategy: combine locally accountable platforms into an interoperable federation. Communities remain distinct; compatible services and consented information can travel between them. Nested circles show social scales, not mandatory administrative layers in AT Protocol. Collective adoption is a goal, not a guaranteed outcome.",
    "sources": []
  },
  {
    "id": "living",
    "act": "A living web",
    "chapter": "Life beyond the screen",
    "title": "A web in service\nof life.",
    "body": "Tools shared. Gardens tended. Neighbors finding each other. Value circulates through workshops, food cooperatives, and ecovillages. These networks nest and connect: a web that grows by nourishing the places within it.",
    "scene": 6.3,
    "action": "Follow the exchange",
    "mechanism": "From connection to community to place",
    "note": "The valley is an imagined possibility. Digital tools do not create housing, ecological restoration or trust by themselves. They can help people coordinate real work, share resources and learn across places. The measure of success is what becomes possible beyond the interface.",
    "sources": []
  },
  {
    "id": "future",
    "act": "A living web",
    "chapter": "Techne",
    "title": "The future is\nsomething we make.",
    "body": "Techne is the craft of shaping tools—and choosing what they serve. Funding supports the proposed SDK, compatible app patterns, and community pilots. Help communities build, own, and connect the technology of a living web.",
    "scene": 7,
    "action": "",
    "mechanism": "",
    "note": "The invitation is to help develop and test this shared foundation with communities. The SDK and federated community applications shown here are a proof-of-concept vision. Contact Techne to discuss funding, pilots or collaboration. This is an invitation to fund development and learning, not an investment-return promise. The proposed priorities are shared tooling, interoperability checks, usable community applications and support for early adopters. Specific budgets, milestones and partners should be agreed with prospective funders. Open protocols, policy and other initiatives are complementary; this is a case for Techne’s contribution, not proof that it is the only possible response.",
    "sources": []
  }
];
export const LAST = BEATS.length-1;
