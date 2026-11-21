import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), '.data');
const AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio-store.json');
const SESSION_SECRET_FILE = path.join(DATA_DIR, 'session-secret');

function loadOrCreateSessionSecret(): string {
  const envSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (envSecret) return envSecret;
  try {
    if (fs.existsSync(SESSION_SECRET_FILE)) {
      const existing = fs.readFileSync(SESSION_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SESSION_SECRET_FILE, generated, {
      encoding: 'utf8',
      mode: 0o600,
    });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const SESSION_SECRET = loadOrCreateSessionSecret();

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

interface StoredAdminAuth {
  salt: string;
  hash: string;
  claimedAt: string;
}

interface StoredPortfolio {
  profile: Record<string, unknown> | null;
  projects: unknown[] | null;
  services?: unknown[] | null;
  testimonials?: unknown[] | null;
  updatedAt: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(filePath: string, data: unknown): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
}

function hashPasswordScrypt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function verifyScryptPassword(
  password: string,
  stored: StoredAdminAuth
): boolean {
  const derived = crypto.scryptSync(password, stored.salt, 64);
  const target = Buffer.from(stored.hash, 'hex');
  if (derived.length !== target.length) return false;
  return crypto.timingSafeEqual(derived, target);
}

function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: crypto.randomBytes(12).toString('hex'),
    })
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { role?: string; exp?: number };
    if (parsed.role !== 'admin') return false;
    if (typeof parsed.exp !== 'number' || Date.now() > parsed.exp) return false;
    return true;
  } catch {
    return false;
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token || !verifySessionToken(token)) {
    res.status(401).json({ error: 'Sesión de administrador requerida.' });
    return;
  }
  next();
}

function getAdminSource(): {
  configured: boolean;
  source: 'env' | 'claimed' | 'unconfigured';
} {
  const envPass = process.env.ADMIN_PASSCODE?.trim();
  if (envPass) {
    return { configured: true, source: 'env' };
  }
  const claimed = readJsonFile<StoredAdminAuth>(AUTH_FILE);
  if (claimed && claimed.salt && claimed.hash) {
    return { configured: true, source: 'claimed' };
  }
  return { configured: false, source: 'unconfigured' };
}

function sanitizeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return undefined;
}

function validateProject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (
    typeof item.id !== 'string' ||
    typeof item.title !== 'string' ||
    typeof item.client !== 'string' ||
    typeof item.discipline !== 'string' ||
    typeof item.summary !== 'string'
  ) {
    return null;
  }

  const allowedDisciplines = ['Diseño', 'Publicidad', 'Fotografía'];
  const discipline = allowedDisciplines.includes(item.discipline)
    ? item.discipline
    : 'Diseño';

  const deliverables = Array.isArray(item.deliverables)
    ? item.deliverables
        .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
        .slice(0, 12)
        .map((d) => d.trim().slice(0, 120))
    : ['Sistema visual'];

  const gallery = Array.isArray(item.gallery)
    ? item.gallery
        .map((g) => sanitizeImageUrl(g))
        .filter((g): g is string => Boolean(g))
        .slice(0, 16)
    : [];

  return {
    id: item.id.trim().slice(0, 80),
    index: typeof item.index === 'string' ? item.index.slice(0, 8) : '01',
    title: item.title.trim().slice(0, 180),
    client: item.client.trim().slice(0, 120),
    discipline,
    year:
      typeof item.year === 'string'
        ? item.year.trim().slice(0, 12)
        : '2026',
    summary: item.summary.trim().slice(0, 600),
    image: sanitizeImageUrl(item.image),
    gallery,
    imageAlt:
      typeof item.imageAlt === 'string'
        ? item.imageAlt.trim().slice(0, 240)
        : item.title.trim().slice(0, 180),
    featured: Boolean(item.featured),
    isBrandShowcase: Boolean(item.isBrandShowcase),
    challenge:
      typeof item.challenge === 'string'
        ? item.challenge.trim().slice(0, 800)
        : '',
    solution:
      typeof item.solution === 'string'
        ? item.solution.trim().slice(0, 800)
        : '',
    outcome:
      typeof item.outcome === 'string'
        ? item.outcome.trim().slice(0, 500)
        : '',
    beforeState:
      typeof item.beforeState === 'string'
        ? item.beforeState.trim().slice(0, 600)
        : '',
    afterState:
      typeof item.afterState === 'string'
        ? item.afterState.trim().slice(0, 600)
        : '',
    deliverables,
  };
}

function sanitizeProfile(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const allowedAccents = ['#0F3D81', '#E31838', '#037046', '#141413'];
  const str = (key: string, fallback: string, max = 200) =>
    typeof p[key] === 'string' ? (p[key] as string).trim().slice(0, max) : fallback;

  const heroMetrics = Array.isArray(p.heroMetrics)
    ? p.heroMetrics
        .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
        .slice(0, 6)
        .map((m) => ({
          value: typeof m.value === 'string' ? m.value.trim().slice(0, 20) : '00',
          label: typeof m.label === 'string' ? m.label.trim().slice(0, 120) : '',
        }))
    : undefined;

  const marqueeItems = Array.isArray(p.marqueeItems)
    ? p.marqueeItems
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 16)
        .map((item) => item.trim().slice(0, 80))
    : undefined;

  return {
    brandName: str('brandName', 'KÁPSULA', 60) || 'KÁPSULA',
    tagline: str('tagline', 'ESTUDIO DE DISEÑO, PUBLICIDAD & FOTOGRAFÍA', 140),
    ownerName: str('ownerName', 'Pedro Parisi', 80),
    location: str('location', 'Mendoza / Remoto', 80),
    email: str('email', 'pedroparisimoron@gmail.com', 120),
    heroHeadline: str('heroHeadline', '', 240),
    heroLead: str('heroLead', '', 600),
    heroImage:
      sanitizeImageUrl(p.heroImage) ||
      '/src/assets/images/pedro_studio_portrait_1795290580721.jpg',
    heroImageCaption: str(
      'heroImageCaption',
      'Dirección Creativa & Fotografía',
      120
    ),
    projectsMetricLabel: str(
      'projectsMetricLabel',
      'Proyectos publicados en este archivo',
      120
    ),
    heroMetrics,
    marqueeItems,
    projectsSectionKicker: str(
      'projectsSectionKicker',
      '01 · Archivo interactivo de proyectos',
      120
    ),
    projectsSectionTitle: str(
      'projectsSectionTitle',
      'Proyectos por disciplina',
      140
    ),
    brandSystemKicker: str(
      'brandSystemKicker',
      '02 · Manual de identidad corporativa interactivo',
      120
    ),
    brandSystemTitle: str(
      'brandSystemTitle',
      'Sistema vivo de marca y aplicaciones',
      140
    ),
    brandSystemDescription: str('brandSystemDescription', '', 400),
    showBrandSystem:
      typeof p.showBrandSystem === 'boolean' ? p.showBrandSystem : true,
    servicesSectionKicker: str(
      'servicesSectionKicker',
      '03 · Servicios y alcance de estudio',
      120
    ),
    servicesSectionTitle: str(
      'servicesSectionTitle',
      'Tres disciplinas bajo una misma dirección',
      140
    ),
    servicesSectionDescription: str('servicesSectionDescription', '', 400),
    contactSectionKicker: str(
      'contactSectionKicker',
      '04 · Contacto y encargos',
      120
    ),
    contactSectionTitle: str(
      'contactSectionTitle',
      'Construyamos tu próximo proyecto',
      140
    ),
    contactSectionDescription: str('contactSectionDescription', '', 400),
    contactResponseTime: str(
      'contactResponseTime',
      'Respuesta en 24–48 h',
      80
    ),
    contactNote: str('contactNote', '', 300),
    footerCopyright: str(
      'footerCopyright',
      'Todos los derechos reservados',
      140
    ),
    primaryAccent:
      typeof p.primaryAccent === 'string' &&
      allowedAccents.includes(p.primaryAccent)
        ? p.primaryAccent
        : '#0F3D81',
    useKapsulaMark: Boolean(p.useKapsulaMark),
  };
}

function sanitizeServices(rawList: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(rawList) || rawList.length > 12) return null;
  const allowedDisciplines = ['Diseño', 'Publicidad', 'Fotografía'];
  return rawList
    .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
    .map((s, idx) => ({
      number:
        typeof s.number === 'string' && s.number.trim()
          ? s.number.trim().slice(0, 8)
          : String(idx + 1).padStart(2, '0'),
      title:
        typeof s.title === 'string' ? s.title.trim().slice(0, 140) : 'Servicio',
      discipline:
        typeof s.discipline === 'string' &&
        allowedDisciplines.includes(s.discipline)
          ? s.discipline
          : 'Diseño',
      timeline:
        typeof s.timeline === 'string'
          ? s.timeline.trim().slice(0, 60)
          : '3–4 semanas',
      baseEstimate:
        typeof s.baseEstimate === 'string'
          ? s.baseEstimate.trim().slice(0, 60)
          : '3.000 € – 7.000 €',
      accent:
        typeof s.accent === 'string' && s.accent.startsWith('#')
          ? s.accent.slice(0, 12)
          : '#0F3D81',
      description:
        typeof s.description === 'string'
          ? s.description.trim().slice(0, 400)
          : '',
      deliverables: Array.isArray(s.deliverables)
        ? s.deliverables
            .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
            .slice(0, 10)
            .map((d) => d.trim().slice(0, 120))
        : [],
    }));
}

function sanitizeTestimonials(rawList: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(rawList) || rawList.length > 20) return null;
  return rawList
    .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object'))
    .map((t) => ({
      quote: typeof t.quote === 'string' ? t.quote.trim().slice(0, 600) : '',
      author: typeof t.author === 'string' ? t.author.trim().slice(0, 100) : '',
      role: typeof t.role === 'string' ? t.role.trim().slice(0, 100) : '',
      organization:
        typeof t.organization === 'string'
          ? t.organization.trim().slice(0, 120)
          : '',
    }))
    .filter((t) => t.quote && t.author);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Estado del acceso administrador
  app.get('/api/admin/status', (_req, res) => {
    res.json(getAdminSource());
  });

  // Verificación de token en memoria
  app.get('/api/admin/verify', (req, res) => {
    const token = extractBearerToken(req);
    const valid = Boolean(token && verifySessionToken(token));
    res.json({ authenticated: valid });
  });

  // Configuración inicial de contraseña (solo si no existe env ni hash previo)
  app.post('/api/admin/claim', (req, res) => {
    const status = getAdminSource();
    if (status.configured) {
      res.status(409).json({
        error: 'La contraseña de administrador ya fue configurada.',
      });
      return;
    }

    const password =
      typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({
        error: 'La contraseña debe tener entre 6 y 128 caracteres.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPasswordScrypt(password, salt);
    writeJsonFile(AUTH_FILE, {
      salt,
      hash,
      claimedAt: new Date().toISOString(),
    } satisfies StoredAdminAuth);

    const token = createSessionToken();
    res.status(201).json({ token, source: 'claimed' });
  });

  // Inicio de sesión de administrador
  app.post('/api/admin/login', (req, res) => {
    const password =
      typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password) {
      res.status(400).json({ error: 'Introduce la contraseña de administrador.' });
      return;
    }

    const envPass = process.env.ADMIN_PASSCODE?.trim();
    if (envPass) {
      if (!timingSafeEqualStr(password, envPass)) {
        res.status(401).json({ error: 'Contraseña incorrecta.' });
        return;
      }
      res.json({ token: createSessionToken(), source: 'env' });
      return;
    }

    const stored = readJsonFile<StoredAdminAuth>(AUTH_FILE);
    if (!stored || !stored.salt || !stored.hash) {
      res.status(409).json({
        error: 'Aún no hay una contraseña configurada. Créala primero.',
      });
      return;
    }

    if (!verifyScryptPassword(password, stored)) {
      res.status(401).json({ error: 'Contraseña incorrecta.' });
      return;
    }

    res.json({ token: createSessionToken(), source: 'claimed' });
  });

  // Lectura pública del portfolio publicado
  app.get('/api/portfolio', (_req, res) => {
    const stored = readJsonFile<StoredPortfolio>(PORTFOLIO_FILE);
    const cleanedProjects = Array.isArray(stored?.projects)
      ? stored.projects.map((p) => {
          if (p && typeof p === 'object') {
            const { accentColor: _removed, ...rest } = p as Record<string, unknown>;
            return rest;
          }
          return p;
        })
      : null;

    res.json({
      profile: stored?.profile || null,
      projects: cleanedProjects,
      services: stored?.services || null,
      testimonials: stored?.testimonials || null,
    });
  });

  // Actualización atómica protegida del portfolio completo (solo administrador)
  app.put('/api/portfolio', requireAdmin, (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const current = readJsonFile<StoredPortfolio>(PORTFOLIO_FILE);

    let nextProfile = current?.profile || null;
    if (body.profile !== undefined && body.profile !== null) {
      const clean = sanitizeProfile(body.profile);
      if (!clean) {
        res.status(400).json({ error: 'Perfil de marca no válido.' });
        return;
      }
      nextProfile = clean;
    }

    let nextProjects = current?.projects || null;
    if (body.projects !== undefined && body.projects !== null) {
      if (!Array.isArray(body.projects) || body.projects.length > 60) {
        res.status(400).json({ error: 'Lista de proyectos no válida.' });
        return;
      }
      const sanitizedProjects: Record<string, unknown>[] = [];
      for (const item of body.projects) {
        const clean = validateProject(item);
        if (!clean) {
          res.status(400).json({ error: 'Uno de los proyectos tiene campos inválidos.' });
          return;
        }
        sanitizedProjects.push(clean);
      }
      nextProjects = sanitizedProjects;
    }

    let nextServices = current?.services || null;
    if (body.services !== undefined && body.services !== null) {
      const cleanServices = sanitizeServices(body.services);
      if (!cleanServices) {
        res.status(400).json({ error: 'Lista de servicios no válida.' });
        return;
      }
      nextServices = cleanServices;
    }

    let nextTestimonials = current?.testimonials || null;
    if (body.testimonials !== undefined && body.testimonials !== null) {
      const cleanTestimonials = sanitizeTestimonials(body.testimonials);
      if (!cleanTestimonials) {
        res.status(400).json({ error: 'Lista de testimonios no válida.' });
        return;
      }
      nextTestimonials = cleanTestimonials;
    }

    const updated: StoredPortfolio = {
      profile: nextProfile,
      projects: nextProjects,
      services: nextServices,
      testimonials: nextTestimonials,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(PORTFOLIO_FILE, updated);
    res.json({
      profile: updated.profile,
      projects: updated.projects,
      services: updated.services,
      testimonials: updated.testimonials,
    });
  });

  // Actualización protegida de proyectos (solo administrador)
  app.put('/api/portfolio/projects', requireAdmin, (req, res) => {
    const rawList = req.body?.projects;
    if (!Array.isArray(rawList) || rawList.length > 60) {
      res.status(400).json({ error: 'Lista de proyectos no válida.' });
      return;
    }

    const sanitized: Record<string, unknown>[] = [];
    for (const item of rawList) {
      const clean = validateProject(item);
      if (!clean) {
        res.status(400).json({ error: 'Uno de los proyectos tiene campos inválidos.' });
        return;
      }
      sanitized.push(clean);
    }

    const current = readJsonFile<StoredPortfolio>(PORTFOLIO_FILE);
    const updated: StoredPortfolio = {
      profile: current?.profile || null,
      projects: sanitized,
      services: current?.services || null,
      testimonials: current?.testimonials || null,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(PORTFOLIO_FILE, updated);
    res.json({ projects: sanitized });
  });

  // Actualización protegida de perfil y textos del portfolio (solo administrador)
  app.put('/api/portfolio/profile', requireAdmin, (req, res) => {
    const cleanProfile = sanitizeProfile(req.body?.profile);
    if (!cleanProfile) {
      res.status(400).json({ error: 'Perfil de marca no válido.' });
      return;
    }

    const current = readJsonFile<StoredPortfolio>(PORTFOLIO_FILE);
    const updated: StoredPortfolio = {
      profile: cleanProfile,
      projects: current?.projects || null,
      services: current?.services || null,
      testimonials: current?.testimonials || null,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(PORTFOLIO_FILE, updated);
    res.json({ profile: cleanProfile });
  });

  // Actualización protegida de servicios (solo administrador)
  app.put('/api/portfolio/services', requireAdmin, (req, res) => {
    const sanitized = sanitizeServices(req.body?.services);
    if (!sanitized) {
      res.status(400).json({ error: 'Lista de servicios no válida.' });
      return;
    }

    const current = readJsonFile<StoredPortfolio>(PORTFOLIO_FILE);
    const updated: StoredPortfolio = {
      profile: current?.profile || null,
      projects: current?.projects || null,
      services: sanitized,
      testimonials: current?.testimonials || null,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(PORTFOLIO_FILE, updated);
    res.json({ services: sanitized });
  });

  // Actualización protegida de testimonios (solo administrador)
  app.put('/api/portfolio/testimonials', requireAdmin, (req, res) => {
    const sanitized = sanitizeTestimonials(req.body?.testimonials);
    if (!sanitized) {
      res.status(400).json({ error: 'Lista de testimonios no válida.' });
      return;
    }

    const current = readJsonFile<StoredPortfolio>(PORTFOLIO_FILE);
    const updated: StoredPortfolio = {
      profile: current?.profile || null,
      projects: current?.projects || null,
      services: current?.services || null,
      testimonials: sanitized,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(PORTFOLIO_FILE, updated);
    res.json({ testimonials: sanitized });
  });

  // Restaurar valores originales (solo administrador)
  app.post('/api/portfolio/reset', requireAdmin, (_req, res) => {
    if (fs.existsSync(PORTFOLIO_FILE)) {
      fs.unlinkSync(PORTFOLIO_FILE);
    }
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kápsula server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
