import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  X,
} from 'lucide-react';
import { PortfolioProject } from '../data/portfolioData';
import { KapsulaIsologotipo, KapsulaTexture } from './KapsulaBrandAssets';

interface ProjectLightboxModalProps {
  project: PortfolioProject | null;
  isAdmin: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEditProject: (project: PortfolioProject) => void;
  onUseAsReference: (project: PortfolioProject) => void;
}

type ModalTab = 'resumen' | 'transformacion' | 'ficha';

type MediaSlide =
  | { type: 'brand-showcase'; key: string }
  | { type: 'image'; url: string; key: string };

export const ProjectLightboxModal: React.FC<ProjectLightboxModalProps> = ({
  project,
  isAdmin,
  onClose,
  onPrev,
  onNext,
  onEditProject,
  onUseAsReference,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<ModalTab>('resumen');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [comparePosition, setComparePosition] = useState(50);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const slides: MediaSlide[] = useMemo(() => {
    if (!project) return [];
    const list: MediaSlide[] = [];
    if (project.isBrandShowcase) {
      list.push({ type: 'brand-showcase', key: 'brand-showcase' });
    }
    const seen = new Set<string>();
    const pushImg = (url?: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      list.push({ type: 'image', url, key: url });
    };
    pushImg(project.image);
    if (Array.isArray(project.gallery)) {
      project.gallery.forEach((g) => pushImg(g));
    }
    return list;
  }, [project]);

  useEffect(() => {
    setFailedImages({});
    setActiveTab('resumen');
    setActiveSlideIdx(0);
    setComparePosition(50);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [project, onClose, onPrev, onNext]);

  if (!project) return null;

  const currentSlide = slides[activeSlideIdx] || slides[0];

  const handleCopyCase = async () => {
    const text = `${project.title} (${project.client}, ${project.year}) — ${project.summary} | Resultado: ${project.outcome}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Silencio si el navegador bloquea el portapapeles
    }
    setCopiedSummary(true);
    window.setTimeout(() => setCopiedSummary(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/85 backdrop-blur-sm p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-project-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#FFFFFF] text-[#141413] border border-[#E2DFD7]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior del modal */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#E2DFD7]">
          <div className="flex items-center gap-2 text-xs text-[#575550] font-mono">
            <span>{project.index}</span>
            <span aria-hidden="true">·</span>
            <span>{project.discipline}</span>
            <span aria-hidden="true">·</span>
            <span>{project.year}</span>
            <span aria-hidden="true">·</span>
            <span>{project.client}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProject(project);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2DFD7] text-xs font-medium text-[#141413] hover:bg-[#F6F5F1] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onPrev}
              aria-label="Proyecto anterior"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E2DFD7] text-[#141413] hover:bg-[#F6F5F1] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D81]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Siguiente proyecto"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E2DFD7] text-[#141413] hover:bg-[#F6F5F1] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D81]"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle de proyecto"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#141413] text-white hover:bg-[#0F3D81] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D81]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual principal y selector de galería */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div
              className={`relative mx-auto overflow-hidden rounded-xl border border-[#E2DFD7] bg-[#F6F5F1] ${
                currentSlide?.type === 'brand-showcase' ||
                (currentSlide?.type === 'image' && failedImages[currentSlide.url]) ||
                !currentSlide
                  ? 'w-full aspect-video'
                  : 'w-fit max-w-full flex items-center justify-center'
              }`}
            >
              {currentSlide?.type === 'brand-showcase' ? (
                <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-2 bg-[#F6F5F1]">
                  <div className="flex items-center justify-center p-10 bg-white border-b md:border-b-0 md:border-r border-[#E2DFD7]">
                    <KapsulaIsologotipo variant="original" size="lg" />
                  </div>
                  <div className="relative overflow-hidden bg-[#F6F5F1]">
                    <KapsulaTexture rows={5} cols={6} className="w-full h-full" />
                  </div>
                </div>
              ) : currentSlide?.type === 'image' &&
                !failedImages[currentSlide.url] ? (
                <img
                  src={currentSlide.url}
                  alt={`${project.imageAlt} (${activeSlideIdx + 1})`}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedImages((prev) => ({
                      ...prev,
                      [currentSlide.url]: true,
                    }))
                  }
                  className="block w-auto h-auto max-w-full max-h-[72vh] object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#F6F5F1]">
                  <span className="font-mono text-xs text-[#575550]">
                    {project.client}
                  </span>
                  <p className="mt-2 font-display text-xl font-bold text-[#141413]">
                    {project.title}
                  </p>
                </div>
              )}

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSlideIdx(
                        (prev) => (prev - 1 + slides.length) % slides.length
                      )
                    }
                    aria-label="Imagen anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[#141413]/75 text-white hover:bg-[#141413] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSlideIdx((prev) => (prev + 1) % slides.length)
                    }
                    aria-label="Siguiente imagen"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[#141413]/75 text-white hover:bg-[#141413] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute right-3 bottom-3 px-2.5 py-1 rounded-md bg-[#141413]/80 text-white font-mono text-[11px] tabular-nums">
                    {activeSlideIdx + 1} / {slides.length}
                  </div>
                </>
              )}
            </div>

            {slides.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {slides.map((slide, idx) => {
                  const isActive = idx === activeSlideIdx;
                  return (
                    <button
                      key={slide.key}
                      type="button"
                      onClick={() => setActiveSlideIdx(idx)}
                      aria-label={`Ver imagen ${idx + 1}`}
                      className={`relative w-20 aspect-[4/3] rounded-lg overflow-hidden border shrink-0 cursor-pointer transition-opacity ${
                        isActive
                          ? 'border-[#141413] ring-1 ring-[#141413] opacity-100'
                          : 'border-[#E2DFD7] opacity-65 hover:opacity-100'
                      }`}
                    >
                      {slide.type === 'brand-showcase' ? (
                        <div className="w-full h-full bg-white flex items-center justify-center text-[10px] font-display font-bold text-[#141413]">
                          KÁPSULA
                        </div>
                      ) : (
                        <img
                          src={slide.url}
                          alt={`Miniatura ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Título + Navegación interactiva por pestañas del caso */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2
                id="lightbox-project-title"
                className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#141413] [text-wrap:balance]"
              >
                {project.title}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[#575550] max-w-3xl">
                {project.summary}
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EAE7DF] shrink-0 self-start">
              {(
                [
                  { id: 'resumen', label: 'Caso completo' },
                  { id: 'transformacion', label: 'Antes / Después' },
                  { id: 'ficha', label: 'Ficha técnica' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#575550] hover:text-[#141413]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido dinámico según pestaña */}
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#E2DFD7]">
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-[#141413]">
                  01. Reto inicial
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#575550]">
                  {project.challenge}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-[#141413]">
                  02. Enfoque creativo
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#575550]">
                  {project.solution}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-[#0F3D81]">
                  03. Resultado medible
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#141413]">
                  {project.outcome}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'transformacion' && (
            <div className="pt-6 border-t border-[#E2DFD7] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[#141413]">
                  Desliza para comparar situación inicial vs. resultado aplicado
                </p>
                <span className="font-mono text-xs text-[#575550]">
                  Balance visual · {comparePosition}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={comparePosition}
                onChange={(e) => setComparePosition(Number(e.target.value))}
                aria-label="Comparador antes y después"
                className="w-full accent-[#0F3D81] cursor-pointer"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div
                  className="rounded-xl border border-[#E2DFD7] p-5 transition-opacity"
                  style={{
                    backgroundColor: '#F6F5F1',
                    opacity: comparePosition >= 50 ? 0.65 : 1,
                  }}
                >
                  <p className="font-mono text-xs text-[#575550]">
                    Antes · Punto de partida
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#141413]">
                    {project.beforeState}
                  </p>
                </div>

                <div
                  className="rounded-xl border border-[#E2DFD7] p-5 transition-opacity"
                  style={{
                    backgroundColor: '#FFFFFF',
                    opacity: comparePosition < 50 ? 0.65 : 1,
                  }}
                >
                  <p className="font-mono text-xs text-[#037046]">
                    Después · Solución implantada
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#141413]">
                    {project.afterState}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ficha' && (
            <div className="pt-6 border-t border-[#E2DFD7] grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4">
                <p className="font-mono text-[11px] text-[#575550]">Cliente</p>
                <p className="mt-1 font-display text-sm font-bold text-[#141413]">
                  {project.client}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4">
                <p className="font-mono text-[11px] text-[#575550]">
                  Disciplina
                </p>
                <p className="mt-1 font-display text-sm font-bold text-[#141413]">
                  {project.discipline}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4">
                <p className="font-mono text-[11px] text-[#575550]">Año</p>
                <p className="mt-1 font-mono text-sm font-bold text-[#141413]">
                  {project.year}
                </p>
              </div>
            </div>
          )}

          {/* Pie del modal con entregables y acciones */}
          <div className="pt-6 border-t border-[#E2DFD7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-semibold text-[#575550]">
                Entregables del proyecto
              </h3>
              <p className="mt-1.5 text-sm text-[#141413]">
                {project.deliverables.join(' · ')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyCase}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E2DFD7] bg-white text-xs font-semibold text-[#141413] hover:bg-[#F6F5F1] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#037046]" />
                    <span>Resumen copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar ficha</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUseAsReference(project);
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#0F3D81] text-white text-xs font-semibold hover:bg-[#0B2E63] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Usar como referencia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
