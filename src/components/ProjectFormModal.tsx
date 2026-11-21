import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  DisciplineFilter,
  PRESET_PROJECT_IMAGES,
  PortfolioProject,
  PresetImageOption,
} from '../data/portfolioData';
import { fileToOptimizedDataUrl } from '../utils/imageOptimize';

interface ProjectFormModalProps {
  open: boolean;
  editingProject: PortfolioProject | null;
  nextIndex: string;
  onClose: () => void;
  onSave: (project: PortfolioProject) => void;
}

type PresetCategoryFilter = 'Todas' | PresetImageOption['category'];

const PRESET_CATEGORIES: PresetCategoryFilter[] = [
  'Todas',
  'Diseño',
  'Publicidad',
  'Fotografía',
  'Retrato',
];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  open,
  editingProject,
  nextIndex,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [discipline, setDiscipline] =
    useState<Exclude<DisciplineFilter, 'Todos'>>('Diseño');
  const [year, setYear] = useState('2026');
  const [summary, setSummary] = useState('');
  const [image, setImage] = useState(PRESET_PROJECT_IMAGES[0].url);
  const [imageAlt, setImageAlt] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [customGalleryUrl, setCustomGalleryUrl] = useState('');
  const [presetCategory, setPresetCategory] =
    useState<PresetCategoryFilter>('Todas');
  const [isBrandShowcase, setIsBrandShowcase] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [outcome, setOutcome] = useState('');
  const [beforeState, setBeforeState] = useState('');
  const [afterState, setAfterState] = useState('');
  const [deliverablesText, setDeliverablesText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingProject) {
      setTitle(editingProject.title);
      setClient(editingProject.client);
      setDiscipline(editingProject.discipline);
      setYear(editingProject.year);
      setSummary(editingProject.summary);
      setImage(editingProject.image || PRESET_PROJECT_IMAGES[0].url);
      setImageAlt(editingProject.imageAlt || '');
      setGallery(Array.isArray(editingProject.gallery) ? editingProject.gallery : []);
      setIsBrandShowcase(Boolean(editingProject.isBrandShowcase));
      setFeatured(Boolean(editingProject.featured));
      setChallenge(editingProject.challenge);
      setSolution(editingProject.solution);
      setOutcome(editingProject.outcome);
      setBeforeState(editingProject.beforeState);
      setAfterState(editingProject.afterState);
      setDeliverablesText(editingProject.deliverables.join(', '));
    } else {
      setTitle('');
      setClient('');
      setDiscipline('Diseño');
      setYear('2026');
      setSummary('');
      setImage(PRESET_PROJECT_IMAGES[0].url);
      setImageAlt('');
      setGallery([]);
      setIsBrandShowcase(false);
      setFeatured(false);
      setChallenge('');
      setSolution('');
      setOutcome('');
      setBeforeState('');
      setAfterState('');
      setDeliverablesText('Identidad visual, Dirección de arte, Manual de uso');
    }
    setCustomGalleryUrl('');
    setPresetCategory('Todas');
    setError('');
  }, [open, editingProject]);

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

  const filteredPresets = useMemo(() => {
    if (presetCategory === 'Todas') return PRESET_PROJECT_IMAGES;
    return PRESET_PROJECT_IMAGES.filter((p) => p.category === presetCategory);
  }, [presetCategory]);

  if (!open) return null;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen válido (JPG, PNG o WebP).');
      return;
    }
    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      setImage(dataUrl);
      setIsBrandShowcase(false);
      setError('');
    } catch {
      setError('No se pudo procesar la imagen seleccionada.');
    }
  };

  const handleGalleryFilesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataUrl = await fileToOptimizedDataUrl(file);
        setGallery((prev) =>
          prev.length < 16 && !prev.includes(dataUrl)
            ? [...prev, dataUrl]
            : prev
        );
      } catch {
        // Ignorar archivo fallido individual
      }
    }
  };

  const handleAddPresetToGallery = (url: string) => {
    setGallery((prev) => {
      if (prev.includes(url) || prev.length >= 16) return prev;
      return [...prev, url];
    });
  };

  const handleAddCustomGalleryUrl = () => {
    const trimmed = customGalleryUrl.trim();
    if (!trimmed) return;
    if (
      !trimmed.startsWith('/') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('data:image/')
    ) {
      setError('Introduce una URL válida que empiece por /, https:// o http://.');
      return;
    }
    setGallery((prev) =>
      prev.length < 16 && !prev.includes(trimmed) ? [...prev, trimmed] : prev
    );
    setCustomGalleryUrl('');
    setError('');
  };

  const handleMoveGalleryItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= gallery.length) return;
    setGallery((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handlePromoteToCover = (idx: number) => {
    const chosen = gallery[idx];
    if (!chosen) return;
    setGallery((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (image && image !== chosen && !next.includes(image)) {
        next.unshift(image);
      }
      return next;
    });
    setImage(chosen);
    setIsBrandShowcase(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !client.trim() || !summary.trim()) {
      setError('Indica al menos el título, el cliente y un resumen del proyecto.');
      return;
    }

    const deliverables = deliverablesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: PortfolioProject = {
      id:
        editingProject?.id ||
        `proyecto-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
      index: editingProject?.index || nextIndex,
      title: title.trim(),
      client: client.trim(),
      discipline,
      year: year.trim() || '2026',
      summary: summary.trim(),
      image: image.trim() || PRESET_PROJECT_IMAGES[0].url,
      gallery,
      imageAlt:
        imageAlt.trim() || `Proyecto ${title.trim()} para ${client.trim()}`,
      featured,
      isBrandShowcase,
      challenge:
        challenge.trim() ||
        'Definir una dirección visual coherente y diferenciadora para el lanzamiento del proyecto.',
      solution:
        solution.trim() ||
        'Aplicamos un sistema gráfico modular acompañado de dirección de arte y piezas adaptables.',
      outcome:
        outcome.trim() ||
        'Sistema visual implementado en canales digitales e impresos con plena coherencia.',
      beforeState:
        beforeState.trim() ||
        'Comunicación visual fragmentada sin criterios tipográficos definidos.',
      afterState:
        afterState.trim() ||
        'Lenguaje visual unificado, escalable y listo para futuras campañas.',
      deliverables:
        deliverables.length > 0
          ? deliverables
          : ['Dirección creativa', 'Sistema visual'],
    };

    onSave(payload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/85 backdrop-blur-sm p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-form-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-[#E2DFD7]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[#FAF9F6] border-b border-[#E2DFD7]">
          <div>
            <h2
              id="project-form-title"
              className="font-display text-lg font-bold text-[#141413]"
            >
              {editingProject
                ? `Editar proyecto ${editingProject.index}`
                : 'Añadir nuevo proyecto al portfolio'}
            </h2>
            <p className="text-xs text-[#575550]">
              Edita textos, portada, galería de múltiples imágenes y detalles del caso de estudio.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor de proyecto"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#141413] text-white hover:bg-[#E31838] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="proj-title"
                className="block text-xs font-semibold text-[#141413]"
              >
                Título del proyecto
              </label>
              <input
                id="proj-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Estudio Soler — Identidad & Dirección Web"
                className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="proj-client"
                className="block text-xs font-semibold text-[#141413]"
              >
                Cliente o marca
              </label>
              <input
                id="proj-client"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Nombre del cliente"
                className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="proj-discipline"
                  className="block text-xs font-semibold text-[#141413]"
                >
                  Disciplina
                </label>
                <select
                  id="proj-discipline"
                  value={discipline}
                  onChange={(e) =>
                    setDiscipline(
                      e.target.value as Exclude<DisciplineFilter, 'Todos'>
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                >
                  <option value="Diseño">Diseño</option>
                  <option value="Publicidad">Publicidad</option>
                  <option value="Fotografía">Fotografía</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="proj-year"
                  className="block text-xs font-semibold text-[#141413]"
                >
                  Año
                </label>
                <input
                  id="proj-year"
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-mono text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="proj-summary"
              className="block text-xs font-semibold text-[#141413]"
            >
              Resumen breve
            </label>
            <textarea
              id="proj-summary"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe en una o dos líneas el alcance visual y el objetivo..."
              className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none resize-y"
            />
          </div>

          {/* Editor visual de portada, archivo de estudio y galería múltiple */}
          <div className="space-y-5 rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-semibold text-[#141413]">
                  Imágenes y galería del proyecto
                </span>
                <span className="block text-[11px] text-[#575550]">
                  Elige entre las {PRESET_PROJECT_IMAGES.length} imágenes del estudio, sube archivos propios o añade múltiples vistas a la galería.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2DFD7] text-xs font-medium text-[#141413] hover:border-[#141413] transition-colors cursor-pointer">
                  <ImagePlus className="w-3.5 h-3.5 text-[#0F3D81]" />
                  <span>Subir portada</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="sr-only"
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2DFD7] text-xs font-medium text-[#141413] hover:border-[#141413] transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5 text-[#037046]" />
                  <span>Subir a galería</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFilesUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {editingProject?.isBrandShowcase && (
              <label className="flex items-center gap-2.5 rounded-lg border border-[#E2DFD7] bg-white px-3.5 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBrandShowcase}
                  onChange={(e) => setIsBrandShowcase(e.target.checked)}
                  className="w-4 h-4 accent-[#0F3D81]"
                />
                <span className="text-xs font-medium text-[#141413]">
                  Mostrar mosaico vectorial de Kápsula como vista principal (desactiva para usar fotografía)
                </span>
              </label>
            )}

            {/* Portada actual + URL */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 aspect-[4/3] rounded-lg overflow-hidden border border-[#E2DFD7] bg-white">
                <img
                  src={image}
                  alt={imageAlt || 'Vista previa de portada'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:col-span-7 space-y-3">
                <div>
                  <label
                    htmlFor="proj-img-url"
                    className="block text-[11px] font-medium text-[#575550]"
                  >
                    Ruta o URL de portada principal
                  </label>
                  <input
                    id="proj-img-url"
                    type="text"
                    value={image.startsWith('data:') ? 'Imagen subida localmente' : image}
                    onChange={(e) => {
                      setImage(e.target.value);
                      setIsBrandShowcase(false);
                    }}
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs font-mono text-[#141413] focus:border-[#0F3D81] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="proj-img-alt"
                    className="block text-[11px] font-medium text-[#575550]"
                  >
                    Texto alternativo / pie descriptivo de imagen
                  </label>
                  <input
                    id="proj-img-alt"
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Descripción breve de la fotografía o pieza"
                    className="mt-1 w-full rounded-lg border border-[#E2DFD7] bg-white px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Selector visual de banco de imágenes del estudio */}
            <div className="space-y-2.5 pt-3 border-t border-[#E2DFD7]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#141413]">
                  Banco de imágenes del estudio ({filteredPresets.length})
                </span>
                <div className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-lg bg-[#EAE7DF]">
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPresetCategory(cat)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        presetCategory === cat
                          ? 'bg-white text-[#141413]'
                          : 'text-[#575550] hover:text-[#141413]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {filteredPresets.map((preset) => {
                  const isCover = image === preset.url && !isBrandShowcase;
                  const inGallery = gallery.includes(preset.url);
                  return (
                    <div
                      key={preset.url}
                      className={`rounded-lg border overflow-hidden bg-white flex flex-col ${
                        isCover
                          ? 'border-[#0F3D81] ring-1 ring-[#0F3D81]'
                          : 'border-[#E2DFD7]'
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-[#F6F5F1] overflow-hidden">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 flex-1 flex flex-col justify-between gap-1.5">
                        <p
                          className="text-[11px] font-medium text-[#141413] leading-tight line-clamp-2"
                          title={preset.label}
                        >
                          {preset.label}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setImage(preset.url);
                              setIsBrandShowcase(false);
                            }}
                            className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              isCover
                                ? 'bg-[#0F3D81] text-white'
                                : 'bg-[#F6F5F1] text-[#141413] hover:bg-[#EAE7DF]'
                            }`}
                          >
                            {isCover ? 'Portada' : 'Usar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPresetToGallery(preset.url)}
                            disabled={inGallery}
                            title="Añadir a la galería adicional"
                            className="py-1 px-1.5 rounded border border-[#E2DFD7] text-[10px] font-semibold text-[#575550] hover:text-[#141413] hover:border-[#141413] disabled:opacity-45 cursor-pointer"
                          >
                            {inGallery ? (
                              <Check className="w-3 h-3 text-[#037046]" />
                            ) : (
                              '+Gal'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Galería adicional del proyecto */}
            <div className="space-y-3 pt-3 border-t border-[#E2DFD7]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#141413]">
                  Galería adicional del proyecto ({gallery.length})
                </span>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={customGalleryUrl}
                    onChange={(e) => setCustomGalleryUrl(e.target.value)}
                    placeholder="Pegar URL de imagen para añadir..."
                    className="flex-1 sm:w-56 rounded-lg border border-[#E2DFD7] bg-white px-2.5 py-1.5 text-xs font-mono text-[#141413] focus:border-[#0F3D81] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGalleryUrl}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E2DFD7] bg-white text-xs font-semibold text-[#141413] hover:border-[#141413] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Añadir URL
                  </button>
                </div>
              </div>

              {gallery.length === 0 ? (
                <p className="text-xs text-[#575550] rounded-lg border border-dashed border-[#D8D3C6] bg-white px-4 py-3">
                  Sin imágenes adicionales todavía. Usa “+Gal” en el banco del estudio o “Subir a galería” para mostrar múltiples vistas en el visor del proyecto.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {gallery.map((itemUrl, idx) => (
                    <div
                      key={`${itemUrl.slice(0, 32)}-${idx}`}
                      className="rounded-lg border border-[#E2DFD7] bg-white overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-[#F6F5F1] overflow-hidden">
                        <img
                          src={itemUrl}
                          alt={`Imagen de galería ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 flex items-center justify-between gap-1 border-t border-[#E2DFD7]">
                        <button
                          type="button"
                          onClick={() => handlePromoteToCover(idx)}
                          className="text-[10px] font-semibold text-[#0F3D81] hover:underline cursor-pointer"
                        >
                          Portada
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveGalleryItem(idx, -1)}
                            disabled={idx === 0}
                            aria-label="Mover imagen antes"
                            className="p-1 rounded border border-[#E2DFD7] text-[#141413] disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveGalleryItem(idx, 1)}
                            disabled={idx === gallery.length - 1}
                            aria-label="Mover imagen después"
                            className="p-1 rounded border border-[#E2DFD7] text-[#141413] disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setGallery((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            aria-label="Quitar imagen de galería"
                            className="p-1 rounded border border-[#E2DFD7] text-[#E31838] hover:border-[#E31838] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Destacado Bento (sin selector de color) */}
          <label className="flex items-center gap-3 rounded-xl border border-[#E2DFD7] bg-[#FAF9F6] px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#0F3D81]"
            />
            <div>
              <span className="block text-xs font-semibold text-[#141413]">
                Destacar en formato ancho (Bento 2 columnas)
              </span>
              <span className="block text-[11px] text-[#575550]">
                Amplía la tarjeta en la vista general del portfolio.
              </span>
            </div>
          </label>

          {/* Reto, enfoque, resultado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E2DFD7]">
            <div>
              <label
                htmlFor="proj-challenge"
                className="block text-xs font-semibold text-[#141413]"
              >
                Reto inicial
              </label>
              <textarea
                id="proj-challenge"
                rows={3}
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="Qué problema tenía el cliente..."
                className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="proj-solution"
                className="block text-xs font-semibold text-[#141413]"
              >
                Enfoque creativo
              </label>
              <textarea
                id="proj-solution"
                rows={3}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Cómo lo resolviste..."
                className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="proj-outcome"
                className="block text-xs font-semibold text-[#141413]"
              >
                Resultado medible
              </label>
              <textarea
                id="proj-outcome"
                rows={3}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Impacto o cifra alcanzada..."
                className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Antes y después */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="proj-before"
                className="block text-xs font-semibold text-[#141413]"
              >
                Situación previa (Antes)
              </label>
              <textarea
                id="proj-before"
                rows={2}
                value={beforeState}
                onChange={(e) => setBeforeState(e.target.value)}
                placeholder="Punto de partida visual o de negocio..."
                className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="proj-after"
                className="block text-xs font-semibold text-[#141413]"
              >
                Transformación lograda (Después)
              </label>
              <textarea
                id="proj-after"
                rows={2}
                value={afterState}
                onChange={(e) => setAfterState(e.target.value)}
                placeholder="Estado final tras implementar el proyecto..."
                className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3 py-2 text-xs text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="proj-deliverables"
              className="block text-xs font-semibold text-[#141413]"
            >
              Entregables (separados por comas)
            </label>
            <input
              id="proj-deliverables"
              type="text"
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              placeholder="Identidad visual, Papelería, Fotografía de producto"
              className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-[#E31838]">
              {error}
            </p>
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
              className="px-5 py-2.5 rounded-lg bg-[#0F3D81] text-white text-xs font-semibold hover:bg-[#0B2E63] transition-colors cursor-pointer"
            >
              {editingProject ? 'Guardar cambios' : 'Añadir al portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
