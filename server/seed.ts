import bcrypt from 'bcryptjs';
import { AdminUser } from './models/AdminUser.ts';
import { Event } from './models/Event.ts';
import { Registration } from './models/Registration.ts';
import { generateRegistrationRef } from '../src/utils/registrationRules.ts';

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Checking database initialization status...');

  // Ensure connection is active before running queries
  if (AdminUser.db.readyState !== 1) {
    console.warn('[Seed] Skipping database seed: MongoDB is offline or disconnected.');
    return;
  }

  // 1. Seed Administrator
  const adminCount = await AdminUser.countDocuments();
  if (adminCount === 0) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@eventflow.dev').toLowerCase();
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await AdminUser.create({
      username: adminUsername,
      email: adminEmail,
      fullName: 'System Administrator',
      passwordHash,
      role: 'superadmin',
    });

    console.log(`[Seed] Administrator provisioned: ${adminEmail} (password: ${adminPassword})`);
  }

  // 2. Seed Events if none exist
  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    console.log('[Seed] Seeding realistic event records...');

    const now = new Date();
    const addDays = (d: number, h: number = 0) => {
      const date = new Date(now.getTime() + d * 86400000 + h * 3600000);
      return date;
    };

    const initialEvents = [
      {
        title: 'CodeNova National Hackathon 2026: Systems & AI',
        slug: 'codenova-national-hackathon-2026',
        shortDescription: 'A 36-hour sprint where top student developers and engineers build production systems and AI agents.',
        fullDescription: 'The CodeNova National Hackathon brings together undergraduate and graduate innovators to solve tough technical challenges in cloud infrastructure, autonomous agents, and distributed data systems. Teams collaborate over 36 intensive hours with industry mentors from leading tech organizations, culminating in live architecture demos and $25,000 in grand prize awards.\n\nAll participants receive dedicated API credits, compute clusters, meals, and mentorship. Projects will be judged on technical depth, fault tolerance, user experience, and real-world applicability.',
        category: 'Workshop & Hackathon',
        startDate: addDays(14, 9),
        endDate: addDays(16, 18),
        timeZone: 'America/New_York',
        venue: 'Engineering Hall, Innovation Quad, Main Campus',
        format: 'Hybrid' as const,
        maxCapacity: 150,
        registrationDeadline: addDays(12),
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['Hackathon', 'AI', 'Systems', 'Full-Stack'],
        prerequisites: 'Basic knowledge of web frameworks, Git, and RESTful APIs. Bring your own laptop.',
        speakerInfo: {
          name: 'Elena Rostova',
          role: 'Lead Architect',
          company: 'HyperScale Systems',
          bio: 'Specialist in distributed consensus and real-time streaming engines.',
        },
      },
      {
        title: 'Modern Full-Stack Architecture Masterclass',
        slug: 'modern-fullstack-architecture-masterclass',
        shortDescription: 'Deep dive into decoupled architectures, database concurrency, caching layers, and production resilience.',
        fullDescription: 'Constructing robust, scalable web applications requires moving far beyond basic CRUD tutorials. In this hands-on 1-day masterclass, you will dissect end-to-end architectures: designing normalized and atomic schema invariants, handling optimistic and pessimistic concurrency in high-throughput APIs, implementing secure session strategies, and deploying zero-downtime containerized workloads.\n\nAttendees will walk away with working code patterns and real benchmark insights.',
        category: 'Technology',
        startDate: addDays(7, 10),
        endDate: addDays(7, 17),
        timeZone: 'America/New_York',
        venue: 'Auditorium C, Computer Science Building & Live Stream',
        format: 'Hybrid' as const,
        maxCapacity: 80,
        registrationDeadline: addDays(6),
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['Architecture', 'MERN', 'Concurrency', 'Security'],
        prerequisites: 'Working familiarity with JavaScript/TypeScript and backend services.',
        speakerInfo: {
          name: 'Marcus Vance',
          role: 'Principal Engineer',
          company: 'Vertex Cloud',
          bio: 'Former staff infrastructure engineer and open-source contributor.',
        },
      },
      {
        title: 'Scalable Microservices with Node.js & Docker',
        slug: 'scalable-microservices-nodejs-docker',
        shortDescription: 'Production engineering workshop covering service boundaries, IPC messaging, and container orchestration.',
        fullDescription: 'This workshop sells out rapidly! Focuses on containerizing Node.js applications, defining clear service contracts, message queues with Redis and RabbitMQ, health checks, graceful shutdowns, and circuit breaker patterns under network partitions.',
        category: 'Engineering',
        startDate: addDays(4, 13),
        endDate: addDays(4, 18),
        timeZone: 'America/New_York',
        venue: 'Lab 402, High Performance Computing Center',
        format: 'In-Person' as const,
        maxCapacity: 50,
        registrationDeadline: addDays(3),
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['Docker', 'Microservices', 'Node.js', 'DevOps'],
        prerequisites: 'Docker Desktop installed, Linux command line fundamentals.',
        speakerInfo: {
          name: 'Devin Thorne',
          role: 'DevOps Architect',
          company: 'CloudNative Labs',
        },
      },
      {
        title: 'Product Design & Design Systems Sprint',
        slug: 'product-design-systems-sprint',
        shortDescription: 'Master the craft of design tokens, accessible component hierarchies, and visual consistency.',
        fullDescription: 'Design is not superficial decoration; it is how software behaves and communicates. This interactive sprint guides designers and engineers through building design tokens, accessible form ergonomics, micro-interactions, responsive typographic scales, and high-contrast usability that complies with WCAG AAA guidelines.',
        category: 'Design & Product',
        startDate: addDays(10, 11),
        endDate: addDays(10, 16),
        timeZone: 'America/New_York',
        venue: 'Studio 2B, Center for Creative Media',
        format: 'In-Person' as const,
        maxCapacity: 45,
        registrationDeadline: addDays(8),
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['Design Systems', 'UI/UX', 'Accessibility', 'Figma'],
        prerequisites: 'Interest in UI/UX and web interface construction.',
        speakerInfo: {
          name: 'Sarah Chen',
          role: 'Head of Product Design',
          company: 'DesignWorks Co.',
        },
      },
      {
        title: 'Tech Career Blueprint & Engineering Networking',
        slug: 'tech-career-blueprint-networking',
        shortDescription: 'Direct networking with tech recruiters, mock technical interviews, and resume architectural critique.',
        fullDescription: 'Connect directly with engineering managers, tech leads, and university recruiters from prominent technology firms and high-growth startups. Receive line-by-line feedback on your technical portfolio, participate in live mock interview sessions, and learn how to position your engineering internship accomplishments effectively.',
        category: 'Career & Networking',
        startDate: addDays(21, 14),
        endDate: addDays(21, 19),
        timeZone: 'America/New_York',
        venue: 'University Student Union Grand Ballroom',
        format: 'In-Person' as const,
        maxCapacity: 200,
        registrationDeadline: addDays(19),
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['Career', 'Networking', 'Interviews', 'Internships'],
        prerequisites: 'Bring printed resumes and an active GitHub/portfolio URL.',
        speakerInfo: {
          name: 'Rajiv Patel',
          role: 'Director of Technical Talent',
          company: 'Novus Talent',
        },
      },
      {
        title: 'Autonomous AI Agents & Tool Calling in Production',
        slug: 'autonomous-ai-agents-tool-calling',
        shortDescription: 'Hands-on development of multi-agent workflows, schema grounding, and LLM orchestration.',
        fullDescription: 'Explore the transition from single-prompt chat to multi-agent architectures that plan, reason, invoke APIs, and inspect state. We will build tool-calling pipelines, structured output validators, and sandboxed execution environments.',
        category: 'Technology',
        startDate: addDays(18, 10),
        endDate: addDays(18, 16),
        timeZone: 'America/New_York',
        venue: 'Online via High-Def Stream',
        format: 'Online' as const,
        maxCapacity: 300,
        registrationDeadline: addDays(17),
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['AI Agents', 'LLMs', 'Tool Calling', 'TypeScript'],
        prerequisites: 'Python or TypeScript proficiency.',
        speakerInfo: {
          name: 'Dr. Aris Thorne',
          role: 'Research Scientist',
          company: 'Cognitive Computing Labs',
        },
      },
      {
        title: 'Quantum Computing Fundamentals & Circuit Synthesis',
        slug: 'quantum-computing-fundamentals',
        shortDescription: 'A rigorous introduction to qubits, superposition, entanglement, and quantum gates.',
        fullDescription: 'Designed for physics and computer science students interested in quantum information science. Covers quantum logic gates, circuit simulation on classical computers, and Bell state experiments.',
        category: 'Science & Research',
        startDate: addDays(25, 13),
        endDate: addDays(25, 17),
        timeZone: 'America/New_York',
        venue: 'Physics Lecture Hall 1',
        format: 'In-Person' as const,
        maxCapacity: 60,
        registrationDeadline: addDays(23),
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['Quantum', 'Physics', 'Algorithms', 'Science'],
        prerequisites: 'Linear algebra and basic probability.',
      },
      {
        title: 'Engineering Leadership & Open Source Governance',
        slug: 'engineering-leadership-open-source',
        shortDescription: 'How engineering organizations govern multi-team repositories, review code, and cultivate technical culture.',
        fullDescription: 'Learn from seasoned engineering vice presidents on how to run efficient technical organizations, write architectural decision records (ADRs), set up RFC processes, and maintain large open-source codebases sustainably.',
        category: 'Leadership',
        startDate: addDays(30, 15),
        endDate: addDays(30, 18),
        timeZone: 'America/New_York',
        venue: 'Executive Seminar Room 301',
        format: 'Hybrid' as const,
        maxCapacity: 100,
        registrationDeadline: addDays(28),
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        status: 'upcoming' as const,
        tags: ['Leadership', 'Open Source', 'Management', 'Governance'],
      },
    ];

    const createdEvents = await Event.insertMany(initialEvents);

    // Seed sample participants for the first 3 events
    // Event 3 will be seeded to MAX CAPACITY (50/50) to test capacity enforcement!
    const sampleParticipants = [
      {
        fullName: 'Maya Lin',
        email: 'maya.lin@polytech.edu',
        organization: 'Polytechnic Institute',
        domainInterests: ['Frontend Development', 'UI/UX Design'],
      },
      {
        fullName: 'Alexander Wright',
        email: 'awright@stateuniv.edu',
        organization: 'State University of Technology',
        domainInterests: ['Cloud & DevOps', 'Cybersecurity'],
      },
      {
        fullName: 'Priya Sharma',
        email: 'priya.sharma@columbia.edu',
        organization: 'Columbia University',
        domainInterests: ['AI & Machine Learning', 'Data Science'],
      },
      {
        fullName: 'David Kim',
        email: 'dkim@mit.edu',
        organization: 'MIT Student Tech Group',
        domainInterests: ['Systems Engineering', 'Cloud & DevOps'],
      },
      {
        fullName: 'Sophia Martinez',
        email: 'smartinez@georgiatech.edu',
        organization: 'Georgia Tech Computing',
        domainInterests: ['Frontend Development', 'Product Management'],
      },
      {
        fullName: 'Liam O’Connor',
        email: 'loconnor@berkeley.edu',
        organization: 'UC Berkeley EECS',
        domainInterests: ['AI & Machine Learning', 'Systems Engineering'],
      },
    ];

    // Seed registrations for event 0 (Hackathon)
    for (let i = 0; i < 4; i++) {
      const p = sampleParticipants[i];
      await Registration.create({
        eventId: createdEvents[0]._id,
        fullName: p.fullName,
        email: p.email,
        normalizedEmail: p.email.toLowerCase(),
        organization: p.organization,
        domainInterests: p.domainInterests,
        registrationRef: generateRegistrationRef(),
        status: 'confirmed',
        registeredAt: addDays(-2, i * 2),
      });
    }
    await Event.findByIdAndUpdate(createdEvents[0]._id, { confirmedRegistrationsCount: 4 });

    // Seed registrations for event 1 (Masterclass)
    for (let i = 2; i < 6; i++) {
      const p = sampleParticipants[i];
      await Registration.create({
        eventId: createdEvents[1]._id,
        fullName: p.fullName,
        email: p.email,
        normalizedEmail: p.email.toLowerCase(),
        organization: p.organization,
        domainInterests: p.domainInterests,
        registrationRef: generateRegistrationRef(),
        status: 'confirmed',
        registeredAt: addDays(-3, i * 3),
      });
    }
    await Event.findByIdAndUpdate(createdEvents[1]._id, { confirmedRegistrationsCount: 4 });

    // Seed event 2 to FULL CAPACITY (50/50)
    // We create a few explicit registrations and set confirmedRegistrationsCount = 50
    for (let i = 0; i < 5; i++) {
      const p = sampleParticipants[i];
      await Registration.create({
        eventId: createdEvents[2]._id,
        fullName: p.fullName,
        email: `full.${i}.${p.email}`,
        normalizedEmail: `full.${i}.${p.email}`.toLowerCase(),
        organization: p.organization,
        domainInterests: p.domainInterests,
        registrationRef: generateRegistrationRef(),
        status: 'confirmed',
        registeredAt: addDays(-5, i * 4),
      });
    }
    // Set confirmedRegistrationsCount = 50 so it's visibly and accurately full!
    await Event.findByIdAndUpdate(createdEvents[2]._id, { confirmedRegistrationsCount: 50 });

    console.log('[Seed] Database seeded with realistic events and registrations successfully.');
  }
}
