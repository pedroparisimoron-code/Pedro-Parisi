import React from 'react';

export type KapsulaLogoVariant =
  | 'original'
  | 'rojo'
  | 'amarillo'
  | 'azul'
  | 'verde'
  | 'positivo'
  | 'negativo';

interface KapsulaMarkProps {
  variant?: KapsulaLogoVariant;
  className?: string;
  decorative?: boolean;
  darkSurface?: boolean;
}

const UNIFIED_K_PATH =
  'M 0 0 L 37 0 L 37 25 C 53 24 67 14 75 0 L 100 0 C 85 33 56 49 20 50 C 56 52 84 69 100 100 L 68 100 C 57 80 39 70 18 69 L 18 100 L 0 100 Z';

export const KapsulaMark: React.FC<KapsulaMarkProps> = ({
  variant = 'original',
  className = 'w-10 h-10',
  decorative = false,
  darkSurface = false,
}) => {
  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': 'Logotipo Kápsula' };

  if (variant === 'original') {
    return (
      <svg viewBox="0 0 100 100" fill="none" className={className} {...ariaProps}>
        {/* Amarillo inferior izquierdo */}
        <path d="M 0 50 L 18 50 L 18 100 L 0 100 Z" fill="#E9AF2A" />
        {/* Azul pierna inferior curva */}
        <path
          d="M 18 50 C 56 52 84 69 100 100 L 68 100 C 57 80 39 70 18 69 Z"
          fill="#0F3D81"
        />
        {/* Rojo bloque y brazo superior */}
        <path
          d="M 0 0 L 37 0 L 37 25 C 53 24 67 14 75 0 L 100 0 C 85 33 56 49 20 50 L 0 50 Z"
          fill="#E31838"
        />
      </svg>
    );
  }

  if (variant === 'positivo') {
    return (
      <svg viewBox="-2 -2 104 104" fill="none" className={className} {...ariaProps}>
        <path
          d={UNIFIED_K_PATH}
          fill={darkSurface ? '#141413' : '#FFFFFF'}
          stroke={darkSurface ? '#FFFFFF' : '#141413'}
          strokeWidth="2.5"
          strokeLinejoin="miter"
        />
      </svg>
    );
  }

  const solidFillMap: Record<Exclude<KapsulaLogoVariant, 'original' | 'positivo'>, string> = {
    rojo: '#E31838',
    amarillo: '#E9AF2A',
    azul: '#0F3D81',
    verde: '#037046',
    negativo: darkSurface ? '#FFFFFF' : '#141413',
  };

  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} {...ariaProps}>
      <path d={UNIFIED_K_PATH} fill={solidFillMap[variant]} />
    </svg>
  );
};

interface KapsulaIsologotipoProps {
  variant?: KapsulaLogoVariant;
  darkSurface?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const KapsulaIsologotipo: React.FC<KapsulaIsologotipoProps> = ({
  variant = 'original',
  darkSurface = false,
  size = 'md',
}) => {
  const sizes = {
    sm: { mark: 'w-12 h-12', title: 'text-2xl', sub: 'text-[9px]' },
    md: { mark: 'w-20 h-20', title: 'text-4xl', sub: 'text-[10px]' },
    lg: { mark: 'w-24 h-24', title: 'text-5xl', sub: 'text-xs' },
  }[size];

  return (
    <div className="inline-flex flex-col items-center text-center select-none">
      <KapsulaMark variant={variant} darkSurface={darkSurface} className={sizes.mark} />
      <span
        className={`mt-4 font-display font-extrabold tracking-tight leading-none ${sizes.title} ${
          darkSurface ? 'text-white' : 'text-[#141413]'
        }`}
      >
        KÁPSULA
      </span>
      <span
        className={`mt-2 font-medium tracking-[0.16em] uppercase ${sizes.sub} ${
          darkSurface ? 'text-white/75' : 'text-[#575550]'
        }`}
      >
        ESTUDIO DE DISEÑO, PUBLICIDAD &amp; FOTOGRAFÍA
      </span>
    </div>
  );
};

interface KapsulaTextureProps {
  className?: string;
  rows?: number;
  cols?: number;
  opacity?: number;
}

const ROW_COLORS = ['#E31838', '#0F3D81', '#E9AF2A'];

export const KapsulaTexture: React.FC<KapsulaTextureProps> = ({
  className = 'w-full h-full',
  rows = 6,
  cols = 6,
  opacity = 1,
}) => {
  const tileW = 48;
  const tileH = 32;
  const width = cols * tileW;
  const height = rows * tileH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: rows }).map((_, r) => {
        const fill = ROW_COLORS[r % ROW_COLORS.length];
        return Array.from({ length: cols }).map((__, c) => {
          const x = c * tileW;
          const y = r * tileH;
          return (
            <path
              key={`${r}-${c}`}
              d={`M ${x} ${y} L ${x + 17} ${y} L ${x + 17} ${y + 15} C ${x + 25} ${y + 14} ${x + 33} ${y + 8} ${x + 37} ${y} L ${x + tileW} ${y} C ${x + 41} ${y + 21} ${x + 27} ${y + tileH} ${x + 8} ${y + tileH} L ${x} ${y + tileH} Z`}
              fill={fill}
            />
          );
        });
      })}
    </svg>
  );
};

export const KapsulaMascot: React.FC<{ className?: string }> = ({
  className = 'w-32 h-40',
}) => {
  return (
    <svg
      viewBox="0 0 160 200"
      fill="none"
      className={className}
      role="img"
      aria-label="Personaje gráfico del manual de marca Kápsula"
    >
      {/* Silueta blanca tipo sticker */}
      <rect x="28" y="12" width="104" height="62" rx="14" fill="#FFFFFF" stroke="#E2DFD7" strokeWidth="2" />
      {/* Ojo izquierdo amarillo */}
      <path d="M 42 26 H 70 V 42 C 70 53 61 60 50 60 H 42 V 26 Z" fill="#E9AF2A" />
      {/* Fondo ojo derecho amarillo + pupila roja */}
      <rect x="88" y="26" width="30" height="30" fill="#E9AF2A" />
      <circle cx="103" cy="41" r="10.5" fill="#E31838" />

      {/* Boca modular gris */}
      <rect x="65" y="79" width="9" height="9" fill="#6F7174" />
      <rect x="76" y="79" width="9" height="9" fill="#6F7174" />
      <rect x="87" y="79" width="9" height="9" fill="#6F7174" />
      <rect x="59" y="90" width="9" height="9" fill="#6F7174" />
      <rect x="70" y="90" width="9" height="9" fill="#6F7174" />
      <rect x="81" y="90" width="9" height="9" fill="#6F7174" />
      <rect x="92" y="90" width="9" height="9" fill="#6F7174" />

      {/* Torso en V azul */}
      <path
        d="M 44 103 L 64 103 L 80 135 L 96 103 L 116 103 C 110 134 98 156 80 167 C 62 156 50 134 44 103 Z"
        fill="#0F3D81"
      />
      {/* Brazos azules */}
      <path d="M 22 128 L 54 142 L 50 148 L 19 133 Z" fill="#0F3D81" />
      <path d="M 138 128 L 106 142 L 110 148 L 141 133 Z" fill="#0F3D81" />

      {/* Arco verde inferior */}
      <path
        d="M 69 183 C 69 172 91 172 91 183"
        stroke="#037046"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
};
