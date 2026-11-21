import React, { useEffect, useState } from 'react';
import {
  Download,
  ImagePlus,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  BrandProfileConfig,
  DEFAULT_BRAND_PROFILE,
  DisciplineFilter,
  PRESET_PROJECT_IMAGES,
  PortfolioProject,
  SERVICES as DEFAULT_SERVICES,
  ServiceOffering,
  TESTIMONIALS as DEFAULT_TESTIMONIALS,
  Testimonial,
} from '../data/portfolioData';
import { fileToOptimizedDataUrl } from '../utils/imageOptimize';

export type PortfolioEditorTab =
  | 'portada'
  | 'servicios'
  | 'testimonios'
  | 'secciones'
  | 'portabilidad';

interface BrandCustomizerModalProps {
  open: boolean;
  initialTab?: PortfolioEditorTab;
  profile: BrandProfileConfig;
  projects: PortfolioProject[];
  services: ServiceOffering[];
  testimonials: Testimonial[];
  onClose: () => void;
  onSaveAll: (payload: {
    profile: BrandProfileConfig;
    services: ServiceOffering[];
    testimonials: Testimonial[];
  }) => Promise<boolean>;
  onImportPortfolio: (data: {
    profile?: BrandProfileConfig;
    projects?: PortfolioProject[];
    services?: ServiceOffering[];
    testimonials?: Testimonial[];
  }) => Promise<boolean>;
  onResetAll: () => void;
}

const ACCENT_PRESETS: {
  hex: BrandProfileConfig['primaryAccent'];
  label: string;
}[] = [
  { hex: '#0F3D81', label: 'Azul Kápsula' },
  { hex: '#E31838', label: 'Rojo Kápsula' },
  { hex: '#037046', label: 'Verde Kápsula' },
  { hex: '#141413', label: 'Negro Editorial' },
];

const EDITOR_TABS: { id: PortfolioEditorTab; label: string }[] = [
  { id: 'portada', label: 'Marca y portada' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'secciones', label: 'Secciones y cinta' },
  { id: 'portabilidad', label: 'Exportar / Restaurar' },
];

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  open,
  initialTab = 'portada',
  profile,
  projects,
  services,
  testimonials,
  onClose,
  onSaveAll,
  onImportPortfolio,
  onResetAll,
}) => {
  const [activeTab, setActiveTab] = useState<PortfolioEditorTab>(initialTab);
  const [draft, setDraft] = useState<BrandProfileConfig>(profile);
  const [draftServices, setDraftServices] =
    useState<ServiceOffering[]>(services);
  const [draftTestimonials, setDraftTestimonials] =
    useState<Testimonial[]>(testimonials);
  const [marqueeText, setMarqueeText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setDraft({
        ...DEFAULT_BRAND_PROFILE,
        ...profile,
        heroMetrics:
          profile.heroMetrics && profile.heroMetrics.length > 0
            ? profile.heroMetrics
            : DEFAULT_BRAND_PROFILE.heroMetrics,
        marqueeItems:
          profile.marqueeItems && profile.marqueeItems.length > 0
            ? profile.marqueeItems
            : DEFAULT_BRAND_PROFILE.marqueeItems,
      });
      setDraftServices(services);
      setDraftTestimonials(testimonials);
      setMarqueeText(
        (profile.marqueeItems || DEFAULT_BRAND_PROFILE.marqueeItems).join(', ')
      );
      setImportStatus('');
      setSaving(false);
    }
  }, [open, initialTab, profile, services, testimonials]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleHeroImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      setDraft((d) => ({ ...d, heroImage: dataUrl }));
    } catch {
      // Ignorar si falla la lectura
    }
  };

  const handleExportJson = () => {
    const nextMarquee = marqueeText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const bundle = {
      exportedAt: new Date().toISOString(),
      profile: { ...draft, marqueeItems: nextMarquee },
      services: draftServices,
      testimonials: draftTestimonials,
      projects,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draft.brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')}-portfolio.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || (!Array.isArray(parsed.projects) && !parsed.profile)) {
          setImportStatus('El archivo JSON no tiene el formato de portfolio.');
          return;
        }
        const ok = await onImportPortfolio({
          profile: parsed.profile,
          projects: parsed.projects,
          services: parsed.services,
          testimonials: parsed.testimonials,
        });
        if (parsed.profile) {
          const merged = { ...DEFAULT_BRAND_PROFILE, ...parsed.profile };
          setDraft(merged);
          setMarqueeText(merged.marqueeItems.join(', '));
        }
        if (Array.isArray(parsed.services)) {
          setDraftServices(parsed.services);
        }
        if (Array.isArray(parsed.testimonials)) {
          setDraftTestimonials(parsed.testimonials);
        }
        setImportStatus(
          ok
            ? 'Portfolio importado y guardado en el servidor.'
            : 'Portfolio aplicado localmente; revisa el estado de guardado.'
        );
      } catch {
        setImportStatus('No se pudo leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const nextMarquee = marqueeText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const ok = await onSaveAll({
      profile: {
        ...draft,
        marqueeItems:
          nextMarquee.length > 0
            ? nextMarquee
            : DEFAULT_BRAND_PROFILE.marqueeItems,
      },
      services: draftServices,
      testimonials: draftTestimonials.filter(
        (t) => t.quote.trim() && t.author.trim()
      ),
    });
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/85 backdrop-blur-sm p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-customizer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-[#E2DFD7]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[#FAF9F6] border-b border-[#E2DFD7]">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <h2
                id="brand-customizer-title"
                className="font-display text-lg font-bold text-[#141413]"
              >
                Editor completo del portfolio
              </h2>
              <p className="text-xs text-[#575550]">
                Edita la identidad, portada, imagen principal, métricas, servicios, testimonios y secciones.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar editor de portfolio"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#141413] text-white hover:bg-[#E31838] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 pb-3 flex flex-wrap items-center gap-1.5">
            {EDITOR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#141413] text-white'
                    : 'bg-white text-[#575550] border border-[#E2DFD7] hover:text-[#141413]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeTab === 'portada' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cfg-brand"
                    className="block text-xs font-semibold text-[#141413]"
                  >
                    Nombre de la marca o estudio
                  </label>
                  <input
                    id="cfg-brand"
                    type="text"
                    value={draft.brandName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, brandName: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cfg-owner"
                    className="block text-xs font-semibold text-[#141413]"
                  >
                    Autor / Dirección
                  </label>
                  <input
                    id="cfg-owner"
                    type="text"
                    value={draft.ownerName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ownerName: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="cfg-tagline"
                    className="block text-xs font-semibold text-[#141413]"
                  >
                    Subtítulo / Disciplinas
                  </label>
                  <input
                    id="cfg-tagline"
                    type="text"
                    value={draft.tagline}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, tagline: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cfg-email"
                    className="block text-xs font-semibold text-[#141413]"
                  >
                    Correo de contacto
                  </label>
                  <input
                    id="cfg-email"
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, email: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cfg-location"
                    className="block text-xs font-semibold text-[#141413]"
                  >
                    Ubicación
                  </label>
                  <input
                    id="cfg-location"
                    type="text"
                    value={draft.location}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, location: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cfg-headline"
                  className="block text-xs font-semibold text-[#141413]"
                >
                  Titular principal de portada
                </label>
                <input
                  id="cfg-headline"
                  type="text"
                  value={draft.heroHeadline}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, heroHeadline: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-lead"
                  className="block text-xs font-semibold text-[#141413]"
                >
                  Descripción introductoria
                </label>
                <textarea
                  id="cfg-lead"
                  rows={3}
                  value={draft.heroLead}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, heroLead: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Editor de fotografía principal de portada */}
              <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="block text-xs font-semibold text-[#141413]">
                      Imagen principal de portada
                    </span>
                    <span className="block text-[11px] text-[#575550]">
                      Elige una fotografía del archivo del estudio o sube una nueva imagen.
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2DFD7] text-xs font-medium text-[#141413] hover:border-[#141413] transition-colors cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5 text-[#0F3D81]" />
                    <span>Subir imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4 aspect-[4/3] rounded-lg overflow-hidden border border-[#E2DFD7] bg-white">
                    <img
                      src={draft.heroImage}
                      alt="Vista previa de portada"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-[50%_25%]"
                    />
                  </div>
                  <div className="sm:col-span-8 space-y-3">
                    <div>
                      <label
                        htmlFor="cfg-hero-img-url"
                        className="block text-[11px] font-medium text-[#575550]"
                      >
                        Ruta o URL de la imagen
                      </label>
                      <input
                        id="cfg-hero-img-url"
                        type="text"
                        value={
                          draft.heroImage.startsWith('data:')
                            ? 'Imagen subida localmente'
                            : draft.heroImage
                        }
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, heroImage: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs font-mono text-[#141413] focus:border-[#0F3D81] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="cfg-hero-caption"
                        className="block text-[11px] font-medium text-[#575550]"
                      >
                        Pie de foto sobre la imagen
                      </label>
                      <input
                        id="cfg-hero-caption"
                        type="text"
                        value={draft.heroImageCaption}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            heroImageCaption: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-[#E2DFD7]">
                  {PRESET_PROJECT_IMAGES.map((preset) => {
                    const selected = draft.heroImage === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({ ...d, heroImage: preset.url }))
                        }
                        className={`rounded-lg overflow-hidden border text-left bg-white cursor-pointer transition-all ${
                          selected
                            ? 'border-[#0F3D81] ring-1 ring-[#0F3D81]'
                            : 'border-[#E2DFD7] hover:border-[#141413]'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-[#F6F5F1] overflow-hidden">
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="p-1.5 text-[10px] font-medium text-[#141413] truncate">
                          {preset.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Métricas de la franja debajo del Hero */}
              <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4 space-y-3">
                <span className="block text-xs font-semibold text-[#141413]">
                  Métricas de portada (4 columnas)
                </span>
                <div>
                  <label
                    htmlFor="cfg-proj-metric"
                    className="block text-[11px] font-medium text-[#575550]"
                  >
                    Etiqueta para el conteo automático de proyectos
                  </label>
                  <input
                    id="cfg-proj-metric"
                    type="text"
                    value={draft.projectsMetricLabel}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        projectsMetricLabel: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {draft.heroMetrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#E2DFD7] bg-white p-3 space-y-2"
                    >
                      <input
                        type="text"
                        value={metric.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((d) => ({
                            ...d,
                            heroMetrics: d.heroMetrics.map((m, i) =>
                              i === idx ? { ...m, value: val } : m
                            ),
                          }));
                        }}
                        placeholder="08+"
                        className="w-full rounded border border-[#E2DFD7] bg-[#FAF9F6] px-2.5 py-1.5 text-sm font-mono font-bold text-[#141413] focus:border-[#0F3D81] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={metric.label}
                        onChange={(e) => {
                          const lbl = e.target.value;
                          setDraft((d) => ({
                            ...d,
                            heroMetrics: d.heroMetrics.map((m, i) =>
                              i === idx ? { ...m, label: lbl } : m
                            ),
                          }));
                        }}
                        placeholder="Descripción de la métrica"
                        className="w-full rounded border border-[#E2DFD7] bg-[#FAF9F6] px-2.5 py-1.5 text-xs text-[#575550] focus:border-[#0F3D81] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <span className="block text-xs font-semibold text-[#141413]">
                    Color principal de botones del sitio
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({ ...d, primaryAccent: preset.hex }))
                        }
                        title={preset.label}
                        aria-label={preset.label}
                        className={`w-8 h-8 rounded-lg border-2 cursor-pointer transition-transform ${
                          draft.primaryAccent === preset.hex
                            ? 'border-[#141413] scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.useKapsulaMark}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        useKapsulaMark: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#0F3D81]"
                  />
                  <span className="text-xs font-medium text-[#141413]">
                    Mostrar símbolo geométrico Kápsula en cabecera y pie
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'servicios' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#141413]">
                    Servicios del estudio ({draftServices.length})
                  </h3>
                  <p className="text-xs text-[#575550]">
                    Edita títulos, plazos, estimaciones y entregables de cada disciplina.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraftServices((prev) => [
                      ...prev,
                      {
                        number: String(prev.length + 1).padStart(2, '0'),
                        title: 'Nuevo servicio de estudio',
                        discipline: 'Diseño',
                        timeline: '2–4 semanas',
                        baseEstimate: '3.000 € – 7.000 €',
                        accent: '#0F3D81',
                        description:
                          'Descripción del alcance y objetivos del servicio.',
                        deliverables: ['Propuesta visual', 'Arte final'],
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141413] text-white text-xs font-semibold hover:bg-[#0F3D81] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir servicio</span>
                </button>
              </div>

              <div className="space-y-4">
                {draftServices.map((srv, idx) => (
                  <div
                    key={`${srv.number}-${idx}`}
                    className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#141413]">
                        Servicio {srv.number}
                      </span>
                      {draftServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftServices((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs text-[#E31838] hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Número
                        </label>
                        <input
                          type="text"
                          value={srv.number}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftServices((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, number: val } : item
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs font-mono text-[#141413]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Título del servicio
                        </label>
                        <input
                          type="text"
                          value={srv.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftServices((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, title: val } : item
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs font-semibold text-[#141413]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Disciplina
                        </label>
                        <select
                          value={srv.discipline}
                          onChange={(e) => {
                            const val = e.target.value as Exclude<
                              DisciplineFilter,
                              'Todos'
                            >;
                            setDraftServices((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, discipline: val } : item
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                        >
                          <option value="Diseño">Diseño</option>
                          <option value="Publicidad">Publicidad</option>
                          <option value="Fotografía">Fotografía</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Plazo habitual
                        </label>
                        <input
                          type="text"
                          value={srv.timeline}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftServices((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, timeline: val } : item
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Presupuesto de referencia (en brief)
                        </label>
                        <input
                          type="text"
                          value={srv.baseEstimate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftServices((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, baseEstimate: val }
                                  : item
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#575550]">
                        Descripción
                      </label>
                      <textarea
                        rows={2}
                        value={srv.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftServices((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, description: val } : item
                            )
                          );
                        }}
                        className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#575550]">
                        Entregables (uno por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={srv.deliverables.join('\n')}
                        onChange={(e) => {
                          const items = e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setDraftServices((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, deliverables: items } : item
                            )
                          );
                        }}
                        className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'testimonios' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#141413]">
                    Testimonios de clientes ({draftTestimonials.length})
                  </h3>
                  <p className="text-xs text-[#575550]">
                    Edita citas, autores, cargos y organizaciones mostradas junto a los servicios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraftTestimonials((prev) => [
                      ...prev,
                      {
                        quote:
                          'Experiencia destacada trabajando junto al estudio en identidad y dirección creativa.',
                        author: 'Nombre del cliente',
                        role: 'Dirección',
                        organization: 'Empresa',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141413] text-white text-xs font-semibold hover:bg-[#0F3D81] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir testimonio</span>
                </button>
              </div>

              <div className="space-y-4">
                {draftTestimonials.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#141413]">
                        Testimonio {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftTestimonials((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs text-[#E31838] hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#575550]">
                        Cita / Declaración
                      </label>
                      <textarea
                        rows={3}
                        value={item.quote}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftTestimonials((prev) =>
                            prev.map((t, i) =>
                              i === idx ? { ...t, quote: val } : t
                            )
                          );
                        }}
                        className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          value={item.author}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftTestimonials((prev) =>
                              prev.map((t, i) =>
                                i === idx ? { ...t, author: val } : t
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={item.role}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftTestimonials((prev) =>
                              prev.map((t, i) =>
                                i === idx ? { ...t, role: val } : t
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#575550]">
                          Organización
                        </label>
                        <input
                          type="text"
                          value={item.organization}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftTestimonials((prev) =>
                              prev.map((t, i) =>
                                i === idx ? { ...t, organization: val } : t
                              )
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'secciones' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4 space-y-2">
                <label
                  htmlFor="cfg-marquee"
                  className="block text-xs font-semibold text-[#141413]"
                >
                  Cinta tipográfica divisoria (términos separados por comas)
                </label>
                <input
                  id="cfg-marquee"
                  type="text"
                  value={marqueeText}
                  onChange={(e) => setMarqueeText(e.target.value)}
                  className="w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs font-mono text-[#141413]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4">
                <div className="sm:col-span-2 text-xs font-bold text-[#141413]">
                  Sección 01 · Proyectos
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Antetítulo (kicker)
                  </label>
                  <input
                    type="text"
                    value={draft.projectsSectionKicker}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        projectsSectionKicker: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Título de sección
                  </label>
                  <input
                    type="text"
                    value={draft.projectsSectionTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        projectsSectionTitle: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4">
                <div className="sm:col-span-2 text-xs font-bold text-[#141413]">
                  Sección · Servicios
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Antetítulo
                  </label>
                  <input
                    type="text"
                    value={draft.servicesSectionKicker}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        servicesSectionKicker: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Título de sección
                  </label>
                  <input
                    type="text"
                    value={draft.servicesSectionTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        servicesSectionTitle: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={draft.servicesSectionDescription}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        servicesSectionDescription: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4">
                <div className="sm:col-span-2 text-xs font-bold text-[#141413]">
                  Sección 04 · Contacto y pie de página
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Antetítulo de contacto
                  </label>
                  <input
                    type="text"
                    value={draft.contactSectionKicker}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        contactSectionKicker: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Título de contacto
                  </label>
                  <input
                    type="text"
                    value={draft.contactSectionTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        contactSectionTitle: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Descripción de disponibilidad
                  </label>
                  <textarea
                    rows={2}
                    value={draft.contactSectionDescription}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        contactSectionDescription: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Tiempo de respuesta
                  </label>
                  <input
                    type="text"
                    value={draft.contactResponseTime}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        contactResponseTime: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#575550]">
                    Nota legal del pie de página
                  </label>
                  <input
                    type="text"
                    value={draft.footerCopyright}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        footerCopyright: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portabilidad' && (
            <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#141413]">
                  Portabilidad completa del portfolio (.json)
                </span>
                <span className="text-xs font-mono text-[#575550]">
                  {projects.length} proyectos · {draftServices.length} servicios ·{' '}
                  {draftTestimonials.length} testimonios
                </span>
              </div>
              <p className="text-xs text-[#575550] leading-relaxed">
                Descarga una copia completa de tu portfolio (marca, portada, servicios, testimonios y todos los proyectos con sus imágenes) o restaura la configuración inicial.
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E2DFD7] text-xs font-semibold text-[#141413] hover:border-[#141413] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar JSON completo</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E2DFD7] text-xs font-semibold text-[#141413] hover:border-[#141413] transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar JSON</span>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportJson}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    onResetAll();
                    setDraft(DEFAULT_BRAND_PROFILE);
                    setDraftServices(DEFAULT_SERVICES);
                    setDraftTestimonials(DEFAULT_TESTIMONIALS);
                    setMarqueeText(
                      DEFAULT_BRAND_PROFILE.marqueeItems.join(', ')
                    );
                    setImportStatus('Restaurado al manual original de Kápsula.');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E2DFD7] text-xs font-semibold text-[#E31838] hover:border-[#E31838] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Kápsula</span>
                </button>
              </div>
              {importStatus && (
                <p className="text-xs font-medium text-[#037046]">
                  {importStatus}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2DFD7]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#E2DFD7] text-xs font-semibold text-[#141413] hover:bg-[#F6F5F1] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-[#0F3D81] text-white text-xs font-semibold hover:bg-[#0B2E63] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar todo el portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
