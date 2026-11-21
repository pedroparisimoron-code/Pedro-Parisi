import React, { useState } from 'react';
import { Check, Copy, FileText, SlidersHorizontal } from 'lucide-react';
import { KAPSULA_PALETTE, PRESET_PROJECT_IMAGES } from '../data/portfolioData';
import {
  KapsulaIsologotipo,
  KapsulaLogoVariant,
  KapsulaMark,
  KapsulaMascot,
  KapsulaTexture,
} from './KapsulaBrandAssets';

interface BrandSystemSectionProps {
  isAdmin: boolean;
  kicker?: string;
  title?: string;
  description?: string;
  onOpenManualPdf: () => void;
  onOpenCustomizer: () => void;
}

const VARIANT_OPTIONS: { id: KapsulaLogoVariant; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'rojo', label: 'Rojo' },
  { id: 'amarillo', label: 'Amarillo' },
  { id: 'azul', label: 'Azul' },
  { id: 'verde', label: 'Verde' },
  { id: 'positivo', label: 'Positivo' },
  { id: 'negativo', label: 'Negativo' },
];

type SurfacePreviewMode = 'light' | 'dark' | 'photo' | 'tote';

export const BrandSystemSection: React.FC<BrandSystemSectionProps> = ({
  isAdmin,
  kicker = '02 · Manual de identidad corporativa interactivo',
  title = 'Sistema vivo de marca y aplicaciones',
  description = 'Prueba las variaciones del logotipo sobre distintos soportes, ajusta la retícula de textura o adapta esta plantilla completa para otros proyectos.',
  onOpenManualPdf,
  onOpenCustomizer,
}) => {
  const [selectedVariant, setSelectedVariant] =
    useState<KapsulaLogoVariant>('original');
  const [showIsologotipo, setShowIsologotipo] = useState(true);
  const [surfaceMode, setSurfaceMode] = useState<SurfacePreviewMode>('light');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(
    PRESET_PROJECT_IMAGES[0].url
  );
  const [textureDensity, setTextureDensity] = useState<number>(5);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // Silencio si el portapapeles no está disponible
    }
    setCopiedHex(hex);
    window.setTimeout(() => setCopiedHex(null), 1800);
  };

  const isDarkSurface = surfaceMode === 'dark' || surfaceMode === 'photo';

  return (
    <section
      id="sistema-marca"
      className="py-20 md:py-24 border-t border-[#E2DFD7]"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Encabezado */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-[#E2DFD7]">
          <div>
            <p className="text-xs font-mono text-[#037046] font-medium">
              {kicker}
            </p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight text-[#141413] [text-wrap:balance]">
              {title}
            </h2>
            <p className="mt-3 text-base text-[#575550] max-w-2xl leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenCustomizer}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E2DFD7] bg-white text-[#141413] text-sm font-medium hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#0F3D81]" />
                <span>Editar sección</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenManualPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#037046] text-white text-sm font-medium hover:bg-[#025736] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#037046]"
            >
              <FileText className="w-4 h-4" />
              <span>Explorar manual PDF</span>
            </button>
          </div>
        </div>

        {/* Bloque 1: Visor interactivo de logotipo y soportes */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-[#E2DFD7] bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E2DFD7] bg-[#FAF9F6]">
              <div className="flex items-center gap-1 p-1 bg-[#EFECE5] rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowIsologotipo(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    showIsologotipo
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#575550] hover:text-[#141413]'
                  }`}
                >
                  Isologotipo
                </button>
                <button
                  type="button"
                  onClick={() => setShowIsologotipo(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    !showIsologotipo
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#575550] hover:text-[#141413]'
                  }`}
                >
                  Logotipo
                </button>
              </div>

              {/* Selector de soporte real (Papel / Oscuro / Fotografía / Textura) */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFECE5] rounded-lg">
                {(
                  [
                    { id: 'light', label: 'Papel' },
                    { id: 'dark', label: 'Oscuro' },
                    { id: 'photo', label: 'Fotografía' },
                    { id: 'tote', label: 'Aplicación' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSurfaceMode(mode.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      surfaceMode === mode.id
                        ? 'bg-white text-[#141413] shadow-xs'
                        : 'text-[#575550] hover:text-[#141413]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`relative flex-1 min-h-[300px] flex items-center justify-center p-10 transition-colors duration-200 overflow-hidden ${
                surfaceMode === 'dark'
                  ? 'bg-[#141413]'
                  : surfaceMode === 'tote'
                  ? 'bg-[#EDEAE2]'
                  : 'bg-white'
              }`}
            >
              {surfaceMode === 'photo' && (
                <>
                  <img
                    src={previewPhotoUrl}
                    alt="Prueba de logotipo sobre fotografía editorial"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#141413]/55" />
                  <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-center gap-1.5 overflow-x-auto">
                    {PRESET_PROJECT_IMAGES.slice(0, 6).map((preset, i) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setPreviewPhotoUrl(preset.url)}
                        aria-label={`Probar sobre ${preset.label}`}
                        className={`w-10 h-7 rounded overflow-hidden border cursor-pointer shrink-0 transition-opacity ${
                          previewPhotoUrl === preset.url
                            ? 'border-white opacity-100'
                            : 'border-white/40 opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={`Foto ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {surfaceMode === 'tote' ? (
                <div className="relative z-10 w-full max-w-xs rounded-xl border border-[#D8D3C6] bg-[#FAF8F2] p-6 shadow-sm">
                  <div className="aspect-square rounded-lg overflow-hidden border border-[#E2DFD7] bg-[#FAF8F2] p-3 flex flex-col justify-between">
                    <div className="flex-1 overflow-hidden">
                      <KapsulaTexture
                        rows={4}
                        cols={4}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="pt-2.5 flex items-center justify-between">
                      <span className="font-display text-xs font-extrabold tracking-tight text-[#141413]">
                        KÁPSULA
                      </span>
                      <KapsulaMark
                        variant={selectedVariant}
                        decorative
                        className="w-7 h-7"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-center font-mono text-[11px] text-[#575550]">
                    Simulación soporte algodón · Pág. 10
                  </p>
                </div>
              ) : (
                <div className="relative z-10">
                  {showIsologotipo ? (
                    <KapsulaIsologotipo
                      variant={selectedVariant}
                      darkSurface={isDarkSurface}
                      size="lg"
                    />
                  ) : (
                    <KapsulaMark
                      variant={selectedVariant}
                      darkSurface={isDarkSurface}
                      className="w-36 h-36"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#E2DFD7] bg-[#FAF9F6]">
              <div className="flex flex-wrap items-center gap-1.5">
                {VARIANT_OPTIONS.map((variant) => {
                  const active = selectedVariant === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#141413] text-white'
                          : 'bg-white text-[#575550] border border-[#E2DFD7] hover:text-[#141413]'
                      }`}
                    >
                      {variant.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recursos gráficos interactivos: Personaje y Textura ajustable */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex-1 rounded-2xl border border-[#E2DFD7] bg-white p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#141413]">
                    Recursos gráficos interactivos
                  </h3>
                  <p className="mt-1 text-sm text-[#575550]">
                    Ajusta la densidad de la textura modular o inspecciona el
                    personaje de estudio.
                  </p>
                </div>
                <span className="font-mono text-xs text-[#575550]">Pág. 04</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 items-center">
                <div className="flex flex-col items-center justify-center rounded-xl bg-[#F6F5F1] p-4 border border-[#E2DFD7] h-44">
                  <KapsulaMascot className="w-28 h-32 transition-transform duration-200 hover:scale-105" />
                  <span className="mt-1 text-xs font-medium text-[#575550]">
                    Personaje
                  </span>
                </div>
                <div className="flex flex-col justify-between rounded-xl overflow-hidden border border-[#E2DFD7] h-44 bg-white">
                  <div className="flex-1 overflow-hidden">
                    <KapsulaTexture
                      rows={textureDensity}
                      cols={textureDensity}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="px-3 py-2 bg-[#F6F5F1] border-t border-[#E2DFD7] flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#575550]">
                      Escala
                    </span>
                    <input
                      type="range"
                      min={3}
                      max={8}
                      value={textureDensity}
                      onChange={(e) => setTextureDensity(Number(e.target.value))}
                      aria-label="Densidad de textura modular"
                      className="w-20 accent-[#0F3D81] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bloque 2: Paleta Oficial con copia HEX */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {KAPSULA_PALETTE.map((swatch) => {
            const isCopied = copiedHex === swatch.hex;
            return (
              <div
                key={swatch.hex}
                className="rounded-2xl border border-[#E2DFD7] bg-white overflow-hidden flex flex-col"
              >
                <div
                  className="h-28 p-4 flex items-end justify-between"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <span
                    className={`font-display text-base font-bold ${
                      swatch.textOnSwatch === 'dark'
                        ? 'text-[#141413]'
                        : 'text-white'
                    }`}
                  >
                    {swatch.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyHex(swatch.hex)}
                    aria-label={`Copiar código hexadecimal ${swatch.hex}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                      swatch.textOnSwatch === 'dark'
                        ? 'bg-[#141413]/12 text-[#141413] hover:bg-[#141413]/20'
                        : 'bg-white/18 text-white hover:bg-white/28'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{swatch.hex}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <p className="text-xs text-[#575550] leading-relaxed">
                    {swatch.role}
                  </p>
                  <div className="pt-3 border-t border-[#E2DFD7] space-y-1 font-mono text-[11px] text-[#141413]">
                    <div className="flex justify-between">
                      <span className="text-[#575550]">RGB</span>
                      <span>{swatch.rgb}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#575550]">CMYK</span>
                      <span>{swatch.cmyk}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
