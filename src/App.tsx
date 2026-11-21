import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { AdminAccessModal } from './components/AdminAccessModal';
import {
  KapsulaMark,
  KapsulaMascot,
  KapsulaTexture,
} from './components/KapsulaBrandAssets';
import {
  BrandCustomizerModal,
  PortfolioEditorTab,
} from './components/BrandCustomizerModal';
import { PdfManualModal } from './components/PdfManualModal';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ProjectLightboxModal } from './components/ProjectLightboxModal';
import {
  BrandProfileConfig,
  DEFAULT_BRAND_PROFILE,
  DisciplineFilter,
  PORTFOLIO_PROJECTS,
  PortfolioProject,
  SERVICES,
  ServiceOffering,
  TESTIMONIALS,
  Testimonial,
} from './data/portfolioData';

const FILTERS: DisciplineFilter[] = [
  'Todos',
  'Diseño',
  'Publicidad',
  'Fotografía',
];

const PROFILE_STORAGE_KEY = 'kapsula_brand_profile_v1';
const PORTFOLIO_BACKUP_KEY = 'kapsula_portfolio_backup_v1';
const ADMIN_TOKEN_STORAGE_KEY = 'kapsula_admin_token_v1';

interface PortfolioBundlePayload {
  profile?: BrandProfileConfig;
  projects?: PortfolioProject[];
  services?: ServiceOffering[];
  testimonials?: Testimonial[];
}

function reindexProjects(list: PortfolioProject[]): PortfolioProject[] {
  return list.map((item, idx) => ({
    ...item,
    index: String(idx + 1).padStart(2, '0'),
  }));
}

export default function App() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const isAdmin = Boolean(adminToken);

  const [brandProfile, setBrandProfile] = useState<BrandProfileConfig>(
    DEFAULT_BRAND_PROFILE
  );
  const [projects, setProjects] = useState<PortfolioProject[]>(
    PORTFOLIO_PROJECTS
  );
  const [services, setServices] = useState<ServiceOffering[]>(SERVICES);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(TESTIMONIALS);
  const [saveNotice, setSaveNotice] = useState<{
    type: 'saving' | 'saved' | 'error';
    message: string;
  } | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<PortfolioBundlePayload | null>(null);

  // Verificar token guardado en sesión al cargar
  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      if (!savedToken) return;
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { authenticated?: boolean } | null) => {
          if (data?.authenticated) {
            setAdminToken(savedToken);
            setManageMode(true);
          } else {
            sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          }
        })
        .catch(() => {
          // Ignorar error de red
        });
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }, []);

  // Cargar datos publicados desde el servidor (con respaldo local si algún bloque es null)
  useEffect(() => {
    let active = true;
    const readBackup = (): PortfolioBundlePayload | null => {
      try {
        const raw = localStorage.getItem(PORTFOLIO_BACKUP_KEY);
        return raw ? (JSON.parse(raw) as PortfolioBundlePayload) : null;
      } catch {
        return null;
      }
    };

    fetch('/api/portfolio')
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            profile?: BrandProfileConfig | null;
            projects?: PortfolioProject[] | null;
            services?: ServiceOffering[] | null;
            testimonials?: Testimonial[] | null;
          } | null
        ) => {
          if (!active) return;
          const backup = readBackup();
          const serverProfile = data?.profile || backup?.profile || null;
          if (serverProfile) {
            setBrandProfile({ ...DEFAULT_BRAND_PROFILE, ...serverProfile });
          } else {
            try {
              const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.location === 'Madrid / Remoto') {
                  parsed.location = 'Mendoza / Remoto';
                }
                setBrandProfile({ ...DEFAULT_BRAND_PROFILE, ...parsed });
              }
            } catch {
              // Ignorar
            }
          }

          const serverProjects =
            Array.isArray(data?.projects) && data.projects.length > 0
              ? data.projects
              : Array.isArray(backup?.projects) && backup.projects.length > 0
              ? backup.projects
              : null;
          if (serverProjects) {
            setProjects(serverProjects);
          }

          const serverServices =
            Array.isArray(data?.services) && data.services.length > 0
              ? data.services
              : Array.isArray(backup?.services) && backup.services.length > 0
              ? backup.services
              : null;
          if (serverServices) {
            setServices(serverServices);
          }

          const serverTestimonials =
            Array.isArray(data?.testimonials) && data.testimonials.length > 0
              ? data.testimonials
              : Array.isArray(backup?.testimonials) &&
                backup.testimonials.length > 0
              ? backup.testimonials
              : null;
          if (serverTestimonials) {
            setTestimonials(serverTestimonials);
          }
        }
      )
      .catch(() => {
        if (!active) return;
        const backup = readBackup();
        if (backup?.profile) {
          setBrandProfile({ ...DEFAULT_BRAND_PROFILE, ...backup.profile });
        }
        if (Array.isArray(backup?.projects) && backup.projects.length > 0) {
          setProjects(backup.projects);
        }
        if (Array.isArray(backup?.services) && backup.services.length > 0) {
          setServices(backup.services);
        }
        if (
          Array.isArray(backup?.testimonials) &&
          backup.testimonials.length > 0
        ) {
          setTestimonials(backup.testimonials);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const [activeFilter, setActiveFilter] = useState<DisciplineFilter>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'bento' | 'list'>('bento');
  const [manageMode, setManageMode] = useState(false);

  const [selectedProject, setSelectedProject] =
    useState<PortfolioProject | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] =
    useState<PortfolioProject | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [customizerTab, setCustomizerTab] =
    useState<PortfolioEditorTab>('portada');
  const [manualOpen, setManualOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [heroImgError, setHeroImgError] = useState(false);
  const [failedCardImages, setFailedCardImages] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setHeroImgError(false);
  }, [brandProfile.heroImage]);

  // Estado interactivo del formulario de contacto y estimador
  const [briefDiscipline, setBriefDiscipline] = useState<string>('Diseño');
  const [briefPace, setBriefPace] = useState<'Estándar' | 'Integral' | 'Urgente'>(
    'Estándar'
  );
  const [briefName, setBriefName] = useState('');
  const [briefEmail, setBriefEmail] = useState('');
  const [briefBudget, setBriefBudget] = useState('3.000 € – 7.000 €');
  const [briefMessage, setBriefMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  const disciplineCounts = useMemo(() => {
    return {
      Todos: projects.length,
      Diseño: projects.filter((p) => p.discipline === 'Diseño').length,
      Publicidad: projects.filter((p) => p.discipline === 'Publicidad').length,
      Fotografía: projects.filter((p) => p.discipline === 'Fotografía').length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesDiscipline =
        activeFilter === 'Todos' || p.discipline === activeFilter;
      if (!matchesDiscipline) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.deliverables.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [projects, activeFilter, searchQuery]);

  const liveEstimate = useMemo(() => {
    const baseWeeks =
      briefDiscipline === 'Fotografía'
        ? '2–3 semanas'
        : briefDiscipline === 'Integral'
        ? '6–10 semanas'
        : '4–6 semanas';
    const paceNote =
      briefPace === 'Urgente'
        ? 'Entrega prioritaria (-30% plazo)'
        : briefPace === 'Integral'
        ? 'Incluye dirección de arte y producción'
        : 'Ritmo habitual de estudio';
    return { baseWeeks, paceNote };
  }, [briefDiscipline, briefPace]);

  const showSaveStatus = (
    type: 'saving' | 'saved' | 'error',
    message: string
  ) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveNotice({ type, message });
    if (type === 'saved') {
      saveTimerRef.current = window.setTimeout(() => {
        setSaveNotice(null);
      }, 3200);
    }
  };

  const writeLocalBackup = (partial: PortfolioBundlePayload) => {
    try {
      const existingRaw = localStorage.getItem(PORTFOLIO_BACKUP_KEY);
      const existing = existingRaw
        ? (JSON.parse(existingRaw) as PortfolioBundlePayload)
        : {};
      localStorage.setItem(
        PORTFOLIO_BACKUP_KEY,
        JSON.stringify({ ...existing, ...partial })
      );
    } catch {
      // Ignorar si excede cuota de localStorage
    }
  };

  const syncPortfolioBundle = async (
    payload: PortfolioBundlePayload,
    tokenOverride?: string
  ): Promise<boolean> => {
    const tokenToUse = tokenOverride ?? adminToken;
    writeLocalBackup(payload);

    if (!tokenToUse) {
      pendingSaveRef.current = { ...(pendingSaveRef.current || {}), ...payload };
      setAdminModalOpen(true);
      showSaveStatus(
        'error',
        'Inicia sesión como administrador para guardar en el servidor.'
      );
      return false;
    }

    showSaveStatus('saving', 'Guardando cambios del portfolio...');
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        pendingSaveRef.current = { ...(pendingSaveRef.current || {}), ...payload };
        try {
          sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        } catch {
          // Ignorar
        }
        setAdminToken(null);
        setManageMode(false);
        setAdminModalOpen(true);
        showSaveStatus(
          'error',
          'Tu sesión expiró. Vuelve a entrar para guardar los cambios.'
        );
        return false;
      }

      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        showSaveStatus(
          'error',
          errData?.error || 'No se pudieron guardar los cambios en el servidor.'
        );
        return false;
      }

      pendingSaveRef.current = null;
      showSaveStatus('saved', 'Cambios guardados correctamente.');
      return true;
    } catch {
      showSaveStatus(
        'error',
        'Error de conexión. Los cambios quedaron respaldados localmente.'
      );
      return false;
    }
  };

  const syncProjectsToServer = async (nextProjects: PortfolioProject[]) => {
    return syncPortfolioBundle({ projects: nextProjects });
  };

  const openEditorTab = (tab: PortfolioEditorTab) => {
    if (!isAdmin) {
      setAdminModalOpen(true);
      return;
    }
    setCustomizerTab(tab);
    setCustomizerOpen(true);
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // Ignorar
    }
    setAdminToken(null);
    setManageMode(false);
    setProjectFormOpen(false);
    setCustomizerOpen(false);
  };

  const handleSaveProject = (saved: PortfolioProject) => {
    if (!isAdmin) return;
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const next = reindexProjects(
        exists
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [...prev, saved]
      );
      void syncProjectsToServer(next);
      return next;
    });
    if (selectedProject?.id === saved.id) {
      setSelectedProject(saved);
    }
    setEditingProject(null);
  };

  const handleDeleteProject = (id: string) => {
    if (!isAdmin) return;
    setProjects((prev) => {
      const next = reindexProjects(prev.filter((p) => p.id !== id));
      void syncProjectsToServer(next);
      return next;
    });
  };

  const handleMoveProject = (id: string, direction: -1 | 1) => {
    if (!isAdmin) return;
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      const next = reindexProjects(copy);
      void syncProjectsToServer(next);
      return next;
    });
  };

  const handleToggleFeatured = (id: string) => {
    if (!isAdmin) return;
    setProjects((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, featured: !p.featured } : p
      );
      void syncProjectsToServer(next);
      return next;
    });
  };

  const handleSelectPrevProject = () => {
    if (!selectedProject || filteredProjects.length === 0) return;
    const idx = filteredProjects.findIndex((p) => p.id === selectedProject.id);
    const prevIdx =
      (idx - 1 + filteredProjects.length) % filteredProjects.length;
    setSelectedProject(filteredProjects[prevIdx]);
  };

  const handleSelectNextProject = () => {
    if (!selectedProject || filteredProjects.length === 0) return;
    const idx = filteredProjects.findIndex((p) => p.id === selectedProject.id);
    const nextIdx = (idx + 1) % filteredProjects.length;
    setSelectedProject(filteredProjects[nextIdx]);
  };

  const handleUseProjectAsReference = (project: PortfolioProject) => {
    setBriefDiscipline(project.discipline);
    setBriefMessage(
      `Hola ${brandProfile.ownerName}, me interesa un proyecto con un enfoque similar a "${project.title}" (${project.client}). `
    );
    setFormSubmitted(false);
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectServiceForBrief = (
    discipline: string,
    baseEstimate: string,
    title: string
  ) => {
    setBriefDiscipline(discipline);
    setBriefBudget(baseEstimate);
    setBriefMessage(
      `Hola ${brandProfile.ownerName}, quisiera solicitar una propuesta para el servicio "${title}". `
    );
    setFormSubmitted(false);
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(brandProfile.email);
    } catch {
      // Fallback visual
    }
    setEmailCopied(true);
    window.setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleSubmitBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefName.trim() || !briefEmail.trim() || !briefMessage.trim()) {
      setFormError(
        'Completa tu nombre, correo electrónico y una breve descripción del proyecto.'
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(briefEmail.trim())) {
      setFormError('Introduce un correo electrónico válido.');
      return;
    }
    setFormError('');
    setFormSubmitted(true);
  };

  const handleResetBrief = () => {
    setFormSubmitted(false);
    setBriefName('');
    setBriefEmail('');
    setBriefMessage('');
  };

  const accent = brandProfile.primaryAccent;

  return (
    <div id="inicio" className="min-h-screen bg-[#F6F5F1] text-[#141413]">
      {/* Top Bar Contract: 3 zonas exactas separadas por gap-8 */}
      <header className="sticky top-0 z-40 bg-[#F6F5F1]/92 backdrop-blur-md border-b border-[#E2DFD7]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zona 1: Marca (1 línea, sin subtítulos ni píldoras) */}
          <a
            href="#inicio"
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F3D81]"
          >
            {brandProfile.useKapsulaMark && (
              <KapsulaMark variant="original" decorative className="w-6 h-6" />
            )}
            <span className="font-display text-lg font-extrabold tracking-tight text-[#141413]">
              {brandProfile.brandName}
            </span>
          </a>

          {/* Zona 2: Enlaces de navegación (4 enlaces limpios de una línea) */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#575550]"
          >
            <a
              href="#proyectos"
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Proyectos
            </a>
            <a
              href="#servicios"
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Servicios
            </a>
            <a
              href="#contacto"
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Contacto
            </a>
          </nav>

          {/* Zona 3: 1 acción principal + menú móvil */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#contacto"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D81]"
              style={{ backgroundColor: accent }}
            >
              Iniciar proyecto
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E2DFD7] bg-white text-[#141413] cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Menú desplegable móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2DFD7] bg-[#FAF9F6] px-6 py-4 space-y-3">
            <nav className="flex flex-col gap-3 text-sm font-medium text-[#141413]">
              <a
                href="#proyectos"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Proyectos
              </a>
              <a
                href="#servicios"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Servicios
              </a>
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Contacto
              </a>
            </nav>
            <a
              href="#contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex w-full items-center justify-center px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: accent }}
            >
              Iniciar proyecto
            </a>
          </div>
        )}
      </header>

      <main>
        {/* Hero Split-Screen + Fila de métricas a ancho completo */}
        <section className="pt-10 pb-14 md:pt-14 md:pb-18">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Columna izquierda: jerarquía tipográfica */}
              <div className="lg:col-span-7 flex flex-col justify-between py-2">
                <div>
                  <p className="text-xs font-medium tracking-wide text-[#575550]">
                    {brandProfile.tagline} · {brandProfile.ownerName}
                  </p>

                  <h1 className="mt-5 font-display text-[clamp(2.35rem,4.4vw,3.85rem)] font-extrabold leading-[1.04] tracking-tight text-[#141413] [text-wrap:balance]">
                    {brandProfile.heroHeadline}
                  </h1>

                  <p className="mt-6 text-base md:text-lg leading-relaxed text-[#575550] max-w-xl">
                    {brandProfile.heroLead}
                  </p>
                </div>

                <div className="mt-8 pt-6 flex flex-wrap items-center gap-3">
                  <a
                    href="#proyectos"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D81]"
                    style={{ backgroundColor: accent }}
                  >
                    <span>Explorar proyectos</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(null);
                          setProjectFormOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#E2DFD7] bg-white text-[#141413] text-sm font-medium hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Añadir proyecto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditorTab('portada')}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-[#E2DFD7] bg-white text-[#141413] text-sm font-medium hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Pencil className="w-4 h-4 text-[#0F3D81]" />
                        <span>Editar portada</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdminModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-[#E2DFD7] bg-white text-[#141413] text-sm font-medium hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Pencil className="w-4 h-4 text-[#0F3D81]" />
                      <span>Editar portfolio</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setManualOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-[#E2DFD7] bg-white text-[#141413] hover:border-[#141413] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-4 h-4 text-[#037046]" />
                    <span>Manual PDF</span>
                  </button>
                </div>
              </div>

              {/* Columna derecha: retrato editorial en altura alineada */}
              <div className="lg:col-span-5">
                <div className="relative h-full min-h-[380px] lg:min-h-[480px] rounded-2xl overflow-hidden border border-[#E2DFD7] bg-[#EAE7DF]">
                  {!heroImgError && brandProfile.heroImage ? (
                    <img
                      src={brandProfile.heroImage}
                      alt={`${brandProfile.ownerName}, director creativo de ${brandProfile.brandName}`}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover object-[50%_25%]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#F6F5F1]">
                      <KapsulaMascot className="w-32 h-40" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#141413]/85 via-[#141413]/45 to-transparent text-white">
                    <p className="font-display text-sm font-bold tracking-tight">
                      {brandProfile.ownerName}
                    </p>
                    <p className="text-xs text-white/90">
                      {brandProfile.heroImageCaption} · {brandProfile.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Franja de 4 métricas a ancho completo debajo del split */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border-y border-[#E2DFD7] bg-white rounded-2xl overflow-hidden border-x">
              <div className="p-6">
                <p className="font-mono text-2xl md:text-3xl font-medium text-[#141413] tabular-nums">
                  {String(projects.length).padStart(2, '0')}
                </p>
                <p className="mt-1.5 text-xs md:text-sm text-[#575550] leading-snug">
                  {brandProfile.projectsMetricLabel}
                </p>
              </div>
              {(brandProfile.heroMetrics || []).map((metric, idx) => (
                <div
                  key={`${metric.label}-${idx}`}
                  className="p-6 border-t lg:border-t-0 border-l border-[#E2DFD7]"
                >
                  <p className="font-mono text-2xl md:text-3xl font-medium text-[#141413] tabular-nums">
                    {metric.value}
                  </p>
                  <p className="mt-1.5 text-xs md:text-sm text-[#575550] leading-snug">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cinta tipográfica divisoria */}
        <div
          aria-hidden="true"
          className="border-y border-[#E2DFD7] bg-white py-3.5 overflow-hidden select-none"
        >
          <div className="flex w-max animate-kapsula-marquee">
            {[0, 1].map((dup) => (
              <div
                key={dup}
                className="flex items-center gap-8 pr-8 text-xs font-mono tracking-wide text-[#575550] whitespace-nowrap"
              >
                {(brandProfile.marqueeItems || []).map((item, idx) => (
                  <React.Fragment key={`${dup}-${idx}`}>
                    <span>{item}</span>
                    <span className="text-[#575550]/60">·</span>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sección 1: Proyectos Seleccionados (Buscador + Filtros + Vista Bento/Índice + Modo Editor) */}
        <section id="proyectos" className="py-20 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E2DFD7]">
              <div>
                <p
                  className="text-xs font-mono font-medium"
                  style={{ color: accent }}
                >
                  {brandProfile.projectsSectionKicker}
                </p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight text-[#141413] [text-wrap:balance]">
                  {brandProfile.projectsSectionTitle}
                </h2>
              </div>

              {/* Barra de herramientas de edición */}
              {isAdmin ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setProjectFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo proyecto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManageMode((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      manageMode
                        ? 'bg-[#141413] text-white border-[#141413]'
                        : 'bg-white text-[#141413] border-[#E2DFD7] hover:border-[#141413]'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{manageMode ? 'Ocultar controles' : 'Gestionar tarjetas'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditorTab('portada')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2DFD7] bg-white text-xs font-semibold text-[#141413] hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Editar portfolio</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2DFD7] bg-white text-xs font-medium text-[#575550] hover:text-[#E31838] hover:border-[#E31838] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar admin</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2DFD7] bg-white text-xs font-semibold text-[#141413] hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start lg:self-auto"
                >
                  <Lock className="w-3.5 h-3.5 text-[#575550]" />
                  <span>Editar proyectos y portfolio</span>
                </button>
              )}
            </div>

            {/* Sub-barra: Filtros con conteo + Buscador + Selector de vista Bento / Índice */}
            <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div
                role="tablist"
                aria-label="Filtrar proyectos por disciplina"
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#EAE7DF] self-start"
              >
                {FILTERS.map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                        isActive
                          ? 'bg-white text-[#141413] shadow-xs'
                          : 'text-[#575550] hover:text-[#141413]'
                      }`}
                    >
                      {filter}{' '}
                      <span className="font-mono text-[11px] opacity-70 tabular-nums">
                        {disciplineCounts[filter]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-[#575550] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar cliente o entregable..."
                    aria-label="Buscar proyectos"
                    className="w-full rounded-lg border border-[#E2DFD7] bg-white pl-9 pr-3 py-2 text-xs text-[#141413] placeholder:text-[#8E8B84] focus:border-[#0F3D81] focus:outline-none"
                  />
                </div>

                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EAE7DF] shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('bento')}
                    aria-label="Vista cuadrícula Bento"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'bento'
                        ? 'bg-white text-[#141413] shadow-xs'
                        : 'text-[#575550] hover:text-[#141413]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="Vista índice editorial"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-[#141413] shadow-xs'
                        : 'text-[#575550] hover:text-[#141413]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Estado vacío cuando el filtro/búsqueda no coincide */}
            {filteredProjects.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-[#E2DFD7] bg-white p-12 text-center space-y-3">
                <p className="font-display text-lg font-bold text-[#141413]">
                  No hay proyectos que coincidan con tu búsqueda
                </p>
                <p className="text-sm text-[#575550]">
                  Prueba otro término o crea un nuevo caso de estudio para este
                  portfolio.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('Todos');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-lg border border-[#E2DFD7] text-xs font-semibold text-[#141413] hover:bg-[#F6F5F1] cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(null);
                        setProjectFormOpen(true);
                      }}
                      className="px-4 py-2 rounded-lg text-white text-xs font-semibold cursor-pointer"
                      style={{ backgroundColor: accent }}
                    >
                      Añadir proyecto
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === 'bento' ? (
              /* Vista Bento Grid */
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, idx) => {
                  const isWide =
                    activeFilter === 'Todos' &&
                    !searchQuery &&
                    Boolean(project.featured);
                  const imgBroken = Boolean(failedCardImages[project.id]);

                  return (
                    <article
                      key={project.id}
                      className={`group flex flex-col rounded-2xl border border-[#E2DFD7] bg-white overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 ${
                        isWide ? 'md:col-span-2' : ''
                      }`}
                    >
                      {isAdmin && manageMode && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E2DFD7]">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveProject(project.id, -1)}
                              disabled={idx === 0}
                              aria-label="Mover antes"
                              className="p-1.5 rounded border border-[#E2DFD7] bg-white text-[#141413] disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveProject(project.id, 1)}
                              disabled={idx === filteredProjects.length - 1}
                              aria-label="Mover después"
                              className="p-1.5 rounded border border-[#E2DFD7] bg-white text-[#141413] disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(project.id)}
                              title="Destacar en ancho completo"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                                project.featured
                                  ? 'bg-[#E9AF2A] border-[#E9AF2A] text-[#141413]'
                                  : 'bg-white border-[#E2DFD7] text-[#575550]'
                              }`}
                            >
                              <Star className="w-3 h-3" />
                              <span>Destacar</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProject(project);
                                setProjectFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E2DFD7] bg-white text-[11px] font-semibold text-[#141413] hover:border-[#141413] cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(project.id)}
                              aria-label={`Eliminar ${project.title}`}
                              className="p-1.5 rounded border border-[#E2DFD7] bg-white text-[#E31838] hover:border-[#E31838] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedProject(project)}
                        className="text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D81]"
                      >
                        <div
                          className={`relative w-full overflow-hidden bg-[#F6F5F1] border-b border-[#E2DFD7] ${
                            isWide ? 'aspect-[16/9]' : 'aspect-[4/3]'
                          }`}
                        >
                          {project.isBrandShowcase ? (
                            <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2">
                              <div className="flex flex-col items-center justify-center p-8 bg-white border-b sm:border-b-0 sm:border-r border-[#E2DFD7]">
                                <KapsulaMark
                                  variant="original"
                                  decorative
                                  className="w-20 h-20 transition-transform duration-300 group-hover:scale-105"
                                />
                                <span className="mt-4 font-display text-xl font-extrabold tracking-tight text-[#141413]">
                                  {brandProfile.brandName}
                                </span>
                              </div>
                              <div className="relative overflow-hidden">
                                <KapsulaTexture
                                  rows={5}
                                  cols={5}
                                  className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            </div>
                          ) : project.image && !imgBroken ? (
                            <img
                              src={project.image}
                              alt={project.imageAlt}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedCardImages((prev) => ({
                                  ...prev,
                                  [project.id]: true,
                                }))
                              }
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#F6F5F1]">
                              <KapsulaMark
                                variant="negativo"
                                decorative
                                className="w-10 h-10 opacity-40"
                              />
                              <span className="mt-3 text-xs font-mono text-[#575550]">
                                {project.client}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#575550]">
                              <span>{project.index}</span>
                              <span aria-hidden="true">·</span>
                              <span>{project.discipline}</span>
                              <span aria-hidden="true">·</span>
                              <span>{project.year}</span>
                              <span aria-hidden="true">·</span>
                              <span>{project.client}</span>
                              {project.gallery && project.gallery.length > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{project.gallery.length + 1} imágenes</span>
                                </>
                              )}
                            </div>

                            <h3 className="mt-2.5 font-display text-xl font-bold tracking-tight text-[#141413] group-hover:text-[#0F3D81] transition-colors [text-wrap:balance]">
                              {project.title}
                            </h3>

                            <p className="mt-2 text-sm text-[#575550] leading-relaxed">
                              {project.summary}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-[#E2DFD7] flex items-center justify-between text-xs font-semibold text-[#141413]">
                            <span>Ver caso de estudio</span>
                            <ArrowUpRight className="w-4 h-4 text-[#0F3D81] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Vista Índice Editorial */
              <div className="mt-8 rounded-2xl border border-[#E2DFD7] bg-white overflow-hidden divide-y divide-[#E2DFD7]">
                {filteredProjects.map((project, idx) => (
                  <div
                    key={project.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-[#FAF9F6] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="flex-1 text-left flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
                    >
                      <span className="font-mono text-xs text-[#575550] tabular-nums w-8 shrink-0">
                        {project.index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-bold text-[#141413] truncate">
                          {project.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#575550] truncate">
                          {project.client} · {project.discipline} ·{' '}
                          {project.year}
                        </p>
                      </div>
                      <span className="hidden lg:inline text-xs font-mono text-[#037046] max-w-xs truncate">
                        {project.outcome}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && manageMode && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(project.id, -1)}
                            disabled={idx === 0}
                            aria-label="Subir"
                            className="p-2 rounded-lg border border-[#E2DFD7] bg-white disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(project.id, 1)}
                            disabled={idx === filteredProjects.length - 1}
                            aria-label="Bajar"
                            className="p-2 rounded-lg border border-[#E2DFD7] bg-white disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProject(project);
                              setProjectFormOpen(true);
                            }}
                            className="px-3 py-2 rounded-lg border border-[#E2DFD7] bg-white text-xs font-semibold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            aria-label="Eliminar"
                            className="p-2 rounded-lg border border-[#E2DFD7] bg-white text-[#E31838] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedProject(project)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2DFD7] bg-white text-xs font-semibold text-[#141413] hover:border-[#141413] cursor-pointer"
                      >
                        <span>Abrir</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sección 2: Servicios interactivos & Testimonios */}
        <section
          id="servicios"
          className="py-20 md:py-24 border-t border-[#E2DFD7] bg-white"
        >
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-10 border-b border-[#E2DFD7]">
              <div>
                <p className="text-xs font-mono text-[#E31838] font-medium">
                  {brandProfile.servicesSectionKicker}
                </p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight text-[#141413] [text-wrap:balance]">
                  {brandProfile.servicesSectionTitle}
                </h2>
                <p className="mt-3 text-base text-[#575550] max-w-2xl leading-relaxed">
                  {brandProfile.servicesSectionDescription}
                </p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditorTab('servicios')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] text-xs font-semibold text-[#141413] hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar servicios</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditorTab('testimonios')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] text-xs font-semibold text-[#141413] hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar testimonios</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <div
                  key={`${service.number}-${idx}`}
                  className="rounded-2xl border border-[#E2DFD7] bg-[#F6F5F1] p-6 flex flex-col justify-between gap-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 font-mono text-xs text-[#575550]">
                      <span
                        className="font-semibold"
                        style={{ color: service.accent }}
                      >
                        {service.number}.
                      </span>
                      <span>Plazo habitual · {service.timeline}</span>
                    </div>

                    <h3 className="mt-3 font-display text-xl font-bold text-[#141413]">
                      {service.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-[#575550] leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <ul className="pt-4 border-t border-[#E2DFD7] space-y-2 text-xs text-[#141413]">
                      {service.deliverables.map((item) => (
                        <li key={item} className="leading-relaxed">
                          — {item}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectServiceForBrief(
                          service.discipline,
                          service.baseEstimate,
                          service.title
                        )
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#E2DFD7] text-xs font-semibold text-[#141413] hover:border-[#141413] transition-colors cursor-pointer"
                    >
                      <span>Solicitar este servicio</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonios adyacentes */}
            {testimonials.length > 0 && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                {testimonials.map((item, idx) => (
                  <blockquote
                    key={`${item.author}-${idx}`}
                    className="rounded-2xl border border-[#E2DFD7] bg-white p-6 md:p-8 flex flex-col justify-between gap-6"
                  >
                    <p className="text-sm md:text-base leading-relaxed text-[#141413]">
                      “{item.quote}”
                    </p>
                    <footer className="pt-4 border-t border-[#E2DFD7] flex items-center justify-between gap-4">
                      <div>
                        <p className="font-display text-sm font-bold text-[#141413]">
                          {item.author}
                        </p>
                        <p className="text-xs text-[#575550]">
                          {item.role} · {item.organization}
                        </p>
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sección 4: Contacto Directo + Estimador interactivo */}
        <section id="contacto" className="py-20 md:py-24 border-t border-[#E2DFD7]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-xs font-mono font-medium"
                      style={{ color: accent }}
                    >
                      {brandProfile.contactSectionKicker}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => openEditorTab('secciones')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#575550] hover:text-[#141413] cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight text-[#141413] [text-wrap:balance]">
                    {brandProfile.contactSectionTitle}
                  </h2>
                  <p className="mt-3 text-base text-[#575550] leading-relaxed">
                    {brandProfile.contactSectionDescription}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E2DFD7] bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-[#575550]">
                      Correo directo
                    </span>
                    <span className="text-xs text-[#037046] font-medium">
                      {brandProfile.contactResponseTime}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <a
                      href={`mailto:${brandProfile.email}`}
                      className="inline-flex items-center gap-2 font-display text-base font-bold text-[#141413] hover:text-[#0F3D81] transition-colors"
                    >
                      <Mail className="w-4 h-4 text-[#0F3D81]" />
                      <span>{brandProfile.email}</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DFD7] bg-[#F6F5F1] text-xs font-medium text-[#141413] hover:bg-[#EAE7DF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {emailCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#037046]" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-[#E2DFD7] bg-white p-6 md:p-8">
                {formSubmitted ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-[#037046] text-white flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-[#141413]">
                      Brief recibido correctamente
                    </h3>
                    <p className="text-sm text-[#575550] max-w-md mx-auto leading-relaxed">
                      Gracias, {briefName}. Revisaré los detalles para{' '}
                      <span className="font-medium text-[#141413]">
                        {briefDiscipline} ({briefPace})
                      </span>{' '}
                      y te responderé a{' '}
                      <span className="font-medium text-[#141413]">
                        {briefEmail}
                      </span>{' '}
                      en un plazo de 24 a 48 horas.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetBrief}
                      className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[#E2DFD7] text-xs font-semibold text-[#141413] hover:bg-[#F6F5F1] transition-colors cursor-pointer"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitBrief} className="space-y-6" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <span className="block text-xs font-semibold text-[#141413]">
                          Disciplina principal
                        </span>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {['Diseño', 'Publicidad', 'Fotografía', 'Integral'].map(
                            (item) => {
                              const selected = briefDiscipline === item;
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => setBriefDiscipline(item)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                    selected
                                      ? 'bg-[#141413] text-white'
                                      : 'bg-[#F6F5F1] text-[#575550] border border-[#E2DFD7] hover:text-[#141413]'
                                  }`}
                                >
                                  {item}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold text-[#141413]">
                          Modalidad de entrega
                        </span>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {(['Estándar', 'Integral', 'Urgente'] as const).map(
                            (pace) => {
                              const selected = briefPace === pace;
                              return (
                                <button
                                  key={pace}
                                  type="button"
                                  onClick={() => setBriefPace(pace)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                    selected
                                      ? 'bg-[#0F3D81] text-white'
                                      : 'bg-[#F6F5F1] text-[#575550] border border-[#E2DFD7] hover:text-[#141413]'
                                  }`}
                                >
                                  {pace}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resumen vivo del estimador */}
                    <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-[#575550]">
                        Plazo estimado:{' '}
                        <strong className="text-[#141413]">
                          {liveEstimate.baseWeeks}
                        </strong>
                      </span>
                      <span className="text-[#037046] font-medium">
                        {liveEstimate.paceNote}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="brief-name"
                          className="block text-xs font-semibold text-[#141413]"
                        >
                          Nombre completo
                        </label>
                        <input
                          id="brief-name"
                          type="text"
                          value={briefName}
                          onChange={(e) => setBriefName(e.target.value)}
                          placeholder="Tu nombre o empresa"
                          className="mt-2 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#8E8B84] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="brief-email"
                          className="block text-xs font-semibold text-[#141413]"
                        >
                          Correo electrónico
                        </label>
                        <input
                          id="brief-email"
                          type="email"
                          value={briefEmail}
                          onChange={(e) => setBriefEmail(e.target.value)}
                          placeholder="nombre@empresa.com"
                          className="mt-2 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#8E8B84] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="brief-budget"
                        className="block text-xs font-semibold text-[#141413]"
                      >
                        Presupuesto estimado
                      </label>
                      <select
                        id="brief-budget"
                        value={briefBudget}
                        onChange={(e) => setBriefBudget(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                      >
                        <option value="1.500 € – 3.000 €">
                          1.500 € – 3.000 €
                        </option>
                        <option value="3.000 € – 7.000 €">
                          3.000 € – 7.000 €
                        </option>
                        <option value="7.000 € – 15.000 €">
                          7.000 € – 15.000 €
                        </option>
                        <option value="Más de 15.000 €">Más de 15.000 €</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="brief-message"
                        className="block text-xs font-semibold text-[#141413]"
                      >
                        Cuéntanos sobre tu marca o proyecto
                      </label>
                      <textarea
                        id="brief-message"
                        rows={4}
                        value={briefMessage}
                        onChange={(e) => setBriefMessage(e.target.value)}
                        placeholder="Objetivos, plazos deseados y alcance..."
                        className="mt-2 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#8E8B84] focus:border-[#0F3D81] focus:bg-white focus:outline-none resize-y"
                      />
                    </div>

                    {formError && (
                      <p
                        role="alert"
                        className="text-xs font-medium text-[#E31838]"
                      >
                        {formError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <span className="text-xs text-[#575550]">
                        Confidencialidad garantizada desde el primer contacto.
                      </span>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D81]"
                        style={{ backgroundColor: accent }}
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar propuesta</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Pie de página sobrio y limpio */}
      <footer className="border-t border-[#E2DFD7] bg-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {brandProfile.useKapsulaMark && (
              <KapsulaMark variant="original" decorative className="w-6 h-6" />
            )}
            <div>
              <p className="font-display text-sm font-bold text-[#141413]">
                {brandProfile.brandName} — {brandProfile.tagline}
              </p>
              <p className="text-xs text-[#575550]">
                © 2026 {brandProfile.ownerName} · {brandProfile.footerCopyright}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#575550]">
            <a
              href="#proyectos"
              className="hover:text-[#141413] transition-colors"
            >
              Proyectos
            </a>
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="hover:text-[#141413] transition-colors cursor-pointer"
            >
              Manual PDF
            </button>
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => openEditorTab('portada')}
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Editar portfolio
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="inline-flex items-center gap-1.5 text-[#E31838] hover:underline cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar admin</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAdminModalOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-[#141413] transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Acceso administrador</span>
              </button>
            )}
            <a
              href="#inicio"
              className="inline-flex items-center gap-1 text-[#141413] hover:text-[#0F3D81] transition-colors"
            >
              <span>Subir</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modales interactivos */}
      <ProjectLightboxModal
        project={selectedProject}
        isAdmin={isAdmin}
        onClose={() => setSelectedProject(null)}
        onPrev={handleSelectPrevProject}
        onNext={handleSelectNextProject}
        onEditProject={(proj) => {
          setEditingProject(proj);
          setProjectFormOpen(true);
        }}
        onUseAsReference={handleUseProjectAsReference}
      />

      {isAdmin && (
        <>
          <ProjectFormModal
            open={projectFormOpen}
            editingProject={editingProject}
            nextIndex={String(projects.length + 1).padStart(2, '0')}
            onClose={() => {
              setProjectFormOpen(false);
              setEditingProject(null);
            }}
            onSave={handleSaveProject}
          />

          <BrandCustomizerModal
            open={customizerOpen}
            initialTab={customizerTab}
            profile={brandProfile}
            projects={projects}
            services={services}
            testimonials={testimonials}
            onClose={() => setCustomizerOpen(false)}
            onSaveAll={async ({
              profile: nextProfile,
              services: nextServices,
              testimonials: nextTestimonials,
            }) => {
              setBrandProfile(nextProfile);
              setServices(nextServices);
              setTestimonials(nextTestimonials);
              return syncPortfolioBundle({
                profile: nextProfile,
                services: nextServices,
                testimonials: nextTestimonials,
              });
            }}
            onImportPortfolio={async ({
              profile: importedProfile,
              projects: importedProjects,
              services: importedServices,
              testimonials: importedTestimonials,
            }) => {
              const bundle: PortfolioBundlePayload = {};
              if (importedProfile) {
                const nextProfile = {
                  ...DEFAULT_BRAND_PROFILE,
                  ...importedProfile,
                };
                setBrandProfile(nextProfile);
                bundle.profile = nextProfile;
              }
              if (
                Array.isArray(importedProjects) &&
                importedProjects.length > 0
              ) {
                const nextProjects = reindexProjects(importedProjects);
                setProjects(nextProjects);
                bundle.projects = nextProjects;
              }
              if (
                Array.isArray(importedServices) &&
                importedServices.length > 0
              ) {
                setServices(importedServices);
                bundle.services = importedServices;
              }
              if (Array.isArray(importedTestimonials)) {
                setTestimonials(importedTestimonials);
                bundle.testimonials = importedTestimonials;
              }
              return syncPortfolioBundle(bundle);
            }}
            onResetAll={() => {
              setBrandProfile(DEFAULT_BRAND_PROFILE);
              setProjects(PORTFOLIO_PROJECTS);
              setServices(SERVICES);
              setTestimonials(TESTIMONIALS);
              try {
                localStorage.removeItem(PORTFOLIO_BACKUP_KEY);
                localStorage.removeItem(PROFILE_STORAGE_KEY);
              } catch {
                // Ignorar
              }
              if (adminToken) {
                void fetch('/api/portfolio/reset', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${adminToken}` },
                }).then((res) => {
                  if (res.ok) {
                    showSaveStatus('saved', 'Restaurado al portfolio original.');
                  }
                });
              }
            }}
          />
        </>
      )}

      <AdminAccessModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onAuthenticated={(token) => {
          try {
            sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
          } catch {
            // Ignorar
          }
          setAdminToken(token);
          setManageMode(true);
          if (pendingSaveRef.current) {
            const pending = pendingSaveRef.current;
            pendingSaveRef.current = null;
            void syncPortfolioBundle(pending, token);
          }
        }}
      />

      <PdfManualModal open={manualOpen} onClose={() => setManualOpen(false)} />

      {saveNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-semibold shadow-sm ${
            saveNotice.type === 'error'
              ? 'border-[#E31838]/30 bg-white text-[#E31838]'
              : saveNotice.type === 'saved'
              ? 'border-[#037046]/30 bg-white text-[#037046]'
              : 'border-[#E2DFD7] bg-white text-[#141413]'
          }`}
        >
          <span>{saveNotice.message}</span>
          {saveNotice.type === 'error' && (
            <button
              type="button"
              onClick={() => setSaveNotice(null)}
              aria-label="Cerrar aviso"
              className="p-0.5 text-[#575550] hover:text-[#141413] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
