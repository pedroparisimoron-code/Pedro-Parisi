export type DisciplineFilter = 'Todos' | 'Diseño' | 'Publicidad' | 'Fotografía';

export interface PortfolioProject {
  id: string;
  index: string;
  title: string;
  client: string;
  discipline: Exclude<DisciplineFilter, 'Todos'>;
  year: string;
  summary: string;
  image?: string;
  gallery?: string[];
  imageAlt: string;
  featured?: boolean;
  isBrandShowcase?: boolean;
  challenge: string;
  solution: string;
  outcome: string;
  beforeState: string;
  afterState: string;
  deliverables: string[];
}

export interface BrandColorSpec {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  role: string;
  textOnSwatch: 'light' | 'dark';
}

export interface ServiceOffering {
  number: string;
  title: string;
  discipline: Exclude<DisciplineFilter, 'Todos'>;
  timeline: string;
  baseEstimate: string;
  accent: string;
  description: string;
  deliverables: string[];
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  organization: string;
}

export interface HeroMetric {
  value: string;
  label: string;
}

export interface BrandProfileConfig {
  brandName: string;
  tagline: string;
  ownerName: string;
  location: string;
  email: string;
  heroHeadline: string;
  heroLead: string;
  heroImage: string;
  heroImageCaption: string;
  projectsMetricLabel: string;
  heroMetrics: HeroMetric[];
  marqueeItems: string[];
  projectsSectionKicker: string;
  projectsSectionTitle: string;
  brandSystemKicker: string;
  brandSystemTitle: string;
  brandSystemDescription: string;
  showBrandSystem: boolean;
  servicesSectionKicker: string;
  servicesSectionTitle: string;
  servicesSectionDescription: string;
  contactSectionKicker: string;
  contactSectionTitle: string;
  contactSectionDescription: string;
  contactResponseTime: string;
  contactNote: string;
  footerCopyright: string;
  primaryAccent: '#0F3D81' | '#E31838' | '#037046' | '#141413';
  useKapsulaMark: boolean;
}

export const DEFAULT_HERO_METRICS: HeroMetric[] = [
  { value: '08+', label: 'Años en dirección creativa y estudio' },
  { value: '03', label: 'Disciplinas integradas en un estudio' },
  { value: '14', label: 'Menciones y premios iberoamericanos' },
];

export const DEFAULT_MARQUEE_ITEMS: string[] = [
  'diseño de identidad',
  'dirección publicitaria',
  'fotografía editorial',
  'sistemas modulares',
  'manuales de marca',
  'producción de producto',
];

export const DEFAULT_BRAND_PROFILE: BrandProfileConfig = {
  brandName: 'KÁPSULA',
  tagline: 'ESTUDIO DE DISEÑO, PUBLICIDAD & FOTOGRAFÍA',
  ownerName: 'Pedro Parisi',
  location: 'Mendoza / Remoto',
  email: 'pedroparisimoron@gmail.com',
  heroHeadline:
    'Marcas con geometría clara, campañas con pulso y fotografía de autor.',
  heroLead:
    'Kápsula es mi estudio personal de dirección creativa. Construimos sistemas visuales coherentes donde el diseño gráfico, la comunicación publicitaria y la producción fotográfica hablan el mismo idioma.',
  heroImage: '/src/assets/images/pedro_studio_portrait_1795290580721.jpg',
  heroImageCaption: 'Dirección Creativa & Fotografía',
  projectsMetricLabel: 'Proyectos publicados en este archivo',
  heroMetrics: DEFAULT_HERO_METRICS,
  marqueeItems: DEFAULT_MARQUEE_ITEMS,
  projectsSectionKicker: '01 · Archivo interactivo de proyectos',
  projectsSectionTitle: 'Proyectos por disciplina',
  brandSystemKicker: '02 · Manual de identidad corporativa interactivo',
  brandSystemTitle: 'Sistema vivo de marca y aplicaciones',
  brandSystemDescription:
    'Prueba las variaciones del logotipo sobre distintos soportes, ajusta la retícula de textura o adapta esta plantilla completa para otros proyectos.',
  showBrandSystem: true,
  servicesSectionKicker: '03 · Servicios y alcance de estudio',
  servicesSectionTitle: 'Tres disciplinas bajo una misma dirección',
  servicesSectionDescription:
    'Selecciona cualquier servicio para precargar su alcance y estimación directamente en el formulario de consulta.',
  contactSectionKicker: '04 · Contacto y encargos',
  contactSectionTitle: 'Construyamos tu próximo proyecto',
  contactSectionDescription:
    'Disponible para proyectos de identidad visual, dirección publicitaria y sesiones fotográficas en Mendoza / Remoto.',
  contactResponseTime: 'Respuesta en 24–48 h',
  contactNote:
    'Identidad modular, dirección de arte y fotografía bajo los estándares del manual de marca oficial.',
  footerCopyright: 'Todos los derechos reservados',
  primaryAccent: '#0F3D81',
  useKapsulaMark: true,
};

export interface PresetImageOption {
  label: string;
  category: 'Diseño' | 'Publicidad' | 'Fotografía' | 'Retrato';
  url: string;
}

export const PRESET_PROJECT_IMAGES: PresetImageOption[] = [
  {
    label: 'Identidad & Papelería (Studio Aeterna)',
    category: 'Diseño',
    url: '/src/assets/images/project_soler_branding_1795289471459.jpg',
  },
  {
    label: 'Monografía Editorial Abierta (Travertino)',
    category: 'Diseño',
    url: '/src/assets/images/editorial_book_spread_1795298350366.jpg',
  },
  {
    label: 'Cerámica & Packaging Minimalista',
    category: 'Diseño',
    url: '/src/assets/images/industrial_ceramic_design_1795298349492.jpg',
  },
  {
    label: 'Gráfica Expositiva (Museo Shift)',
    category: 'Diseño',
    url: '/src/assets/images/project_museo_exhibition_1795289470943.jpg',
  },
  {
    label: 'Producto & Campaña Digital (Kairo)',
    category: 'Publicidad',
    url: '/src/assets/images/project_kairo_product_1795289471691.jpg',
  },
  {
    label: 'Cartel Urbano & Campaña Exterior',
    category: 'Publicidad',
    url: '/src/assets/images/advertising_billboard_campaign_1795298350079.jpg',
  },
  {
    label: 'Fotografía & Packaging Botánico (Auralis)',
    category: 'Fotografía',
    url: '/src/assets/images/project_verve_packaging_1795289471236.jpg',
  },
  {
    label: 'Sesión Editorial Luz Natural (Atelier)',
    category: 'Fotografía',
    url: '/src/assets/images/fashion_studio_photography_1795298350094.jpg',
  },
  {
    label: 'Retrato de Dirección Creativa (Pedro)',
    category: 'Retrato',
    url: '/src/assets/images/pedro_studio_portrait_1795290580721.jpg',
  },
  {
    label: 'Retrato Editorial de Estudio',
    category: 'Retrato',
    url: '/src/assets/images/hero_creative_director_1795289470729.jpg',
  },
];

export const KAPSULA_PALETTE: BrandColorSpec[] = [
  {
    name: 'Amarillo Kápsula',
    hex: '#E9AF2A',
    rgb: '233, 175, 42',
    cmyk: '0, 25, 82, 9',
    role: 'Base vertical del símbolo y acento luminoso en gráfica impresa.',
    textOnSwatch: 'dark',
  },
  {
    name: 'Azul Kápsula',
    hex: '#0F3D81',
    rgb: '15, 61, 129',
    cmyk: '88, 73, 0, 15',
    role: 'Extremidad inferior, foco institucional y acciones principales.',
    textOnSwatch: 'light',
  },
  {
    name: 'Rojo Kápsula',
    hex: '#E31838',
    rgb: '227, 24, 56',
    cmyk: '0, 94, 77, 0',
    role: 'Trazo superior del logotipo, énfasis editorial y energía de campaña.',
    textOnSwatch: 'light',
  },
  {
    name: 'Verde Kápsula',
    hex: '#037046',
    rgb: '3, 112, 70',
    cmyk: '90, 10, 78, 18',
    role: 'Cabeceras documentales del manual y soporte gráfico secundario.',
    textOnSwatch: 'light',
  },
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'studio-aeterna',
    index: '01',
    title: 'Studio Aeterna — Identidad & Monografía Arquitectónica',
    client: 'Studio Aeterna',
    discipline: 'Diseño',
    year: '2026',
    summary:
      'Sistema de identidad corporativa, papelería en papel algodón con golpe seco y libro monográfico de obra residencial.',
    image: '/src/assets/images/project_soler_branding_1795289471459.jpg',
    gallery: ['/src/assets/images/editorial_book_spread_1795298350366.jpg'],
    imageAlt:
      'Papelería corporativa y monografía editorial de Studio Aeterna sobre mesa de estudio con piedra travertino',
    featured: true,
    challenge:
      'El estudio necesitaba unificar su presencia impresa y digital antes de presentar tres pabellones en ferias internacionales de arquitectura.',
    solution:
      'Diseñamos un monograma arquitectónico, una retícula modular suiza para memorias de proyecto y acabados táctiles sobre papel algodón y latón.',
    outcome:
      '+58% en solicitudes de proyectos privados durante los 4 meses posteriores al relanzamiento.',
    beforeState:
      'Dossiers en PDF sin retícula unificada, tarjetas genéricas y ausencia de tono editorial en presentaciones a clientes.',
    afterState:
      'Sistema completo de papelería en algodón, libro monográfico y manual de aplicación con identidad consistente en sala y web.',
    deliverables: [
      'Identidad visual completa',
      'Papelería con relieve y sello',
      'Dirección editorial de monografía',
      'Manual de aplicaciones físicas',
    ],
  },
  {
    id: 'kairo-campana',
    index: '02',
    title: 'Kairo Finance — Campaña Digital & Sistema de Producto',
    client: 'Kairo Finance',
    discipline: 'Publicidad',
    year: '2026',
    summary:
      'Dirección creativa de campaña de lanzamiento multicanal y arquitectura visual para plataforma de gestión patrimonial.',
    image: '/src/assets/images/project_kairo_product_1795289471691.jpg',
    gallery: [
      '/src/assets/images/advertising_billboard_campaign_1795298350079.jpg',
    ],
    imageAlt:
      'Interfaz editorial financiera de Kairo Finance presentada en portátil sobre mesa de nogal',
    challenge:
      'Comunicar transparencia financiera a inversores jóvenes sin caer en códigos bancarios fríos ni gráficas saturadas.',
    solution:
      'Estructuramos una campaña centrada en piezas editoriales claras, tipografía tabular limpia y demostraciones reales de producto en escena cotidiana.',
    outcome:
      '3.4x más registros cualificados en las primeras 8 semanas de campaña en España y Latinoamérica.',
    beforeState:
      'Anuncios con stock corporativo rígido, baja tasa de clic y desconexión entre la publicidad y la interfaz real del producto.',
    afterState:
      'Campaña coherente con fotografía de estudio real y visualizaciones tabulares limpias que multiplicaron por 3,4 el registro cualificado.',
    deliverables: [
      'Concepto y dirección de campaña',
      'Sistema de piezas publicitarias',
      'Diseño de producto web',
      'Guía de tono visual',
    ],
  },
  {
    id: 'auralis-botanical',
    index: '03',
    title: 'Auralis Lab — Dirección Fotográfica & Packaging',
    client: 'Auralis Botanical',
    discipline: 'Fotografía',
    year: '2025',
    summary:
      'Serie fotográfica de producto con luz natural direccional y etiquetado tipográfico minimalista sobre piedra caliza.',
    image: '/src/assets/images/project_verve_packaging_1795289471236.jpg',
    gallery: [
      '/src/assets/images/industrial_ceramic_design_1795298349492.jpg',
    ],
    imageAlt:
      'Frascos de vidrio ámbar de Auralis con etiquetas tipográficas sobre piedra caliza iluminados por luz lateral',
    challenge:
      'Posicionar una línea botánica de laboratorio frente a marcas establecidas con un presupuesto de producción contenido.',
    solution:
      'Combinamos dirección de arte en set real con luz solar natural, piedra caliza y etiquetas de alta legibilidad sin ornamentos superfluos.',
    outcome:
      'Adoptado en 24 puntos de venta boutique y +42% en tasa de conversión en ficha de producto.',
    beforeState:
      'Renders 3D planos sobre fondo blanco que no transmitían origen botánico ni diferenciación en tienda física.',
    afterState:
      'Banco de 48 fotografías con luz natural sobre piedra caliza y sistema de etiquetas suizas listo para imprenta y comercio electrónico.',
    deliverables: [
      'Dirección fotográfica en estudio',
      'Diseño de etiquetas y packaging',
      'Banco de 48 fotografías editoriales',
      'Activos para campaña retail',
    ],
  },
  {
    id: 'shift-exposicion',
    index: '04',
    title: 'Ciclo Shift — Gráfica Expositiva & Cartelería',
    client: 'Museo de Arte Contemporáneo',
    discipline: 'Diseño',
    year: '2025',
    summary:
      'Sistema de señalética, cartelería tipográfica de gran formato y programa de mano para exposición de arte geométrico.',
    image: '/src/assets/images/project_museo_exhibition_1795289470943.jpg',
    gallery: [
      '/src/assets/images/advertising_billboard_campaign_1795298350079.jpg',
    ],
    imageAlt:
      'Galería de museo con tres carteles tipográficos de gran formato colgados sobre muro de hormigón',
    challenge:
      'Integrar tres muestras temporales distintas bajo una narrativa visual coherente que guiara al visitante por la arquitectura de hormigón.',
    solution:
      'Construimos una familia de carteles tipográficos en blanco roto y negro profundo con proporciones armónicas a la escala del muro.',
    outcome:
      '38.000 visitantes durante la temporada y selección en anuario iberoamericano de gráfica cultural.',
    beforeState:
      'Cada sala contaba con vinilos aislados sin relación visual ni jerarquía de lectura a distancia.',
    afterState:
      'Recorrido tipográfico unificado en gran formato que ordenó el flujo de 38.000 visitantes en sala.',
    deliverables: [
      'Cartelería de gran formato',
      'Señalética de sala',
      'Catálogo de mano',
      'Adaptación para exterior y prensa',
    ],
  },
  {
    id: 'atelier-vera-retrato',
    index: '05',
    title: 'Atelier Véra — Serie Editorial & Campaña de Temporada',
    client: 'Atelier Véra',
    discipline: 'Fotografía',
    year: '2026',
    summary:
      'Dirección fotográfica en luz natural de estudio para colección cápsula de sastrería y lookbook impreso.',
    image: '/src/assets/images/fashion_studio_photography_1795298350094.jpg',
    gallery: [
      '/src/assets/images/hero_creative_director_1795289470729.jpg',
    ],
    imageAlt:
      'Retrato editorial de moda en estudio con luz lateral de ventanal sobre muro de yeso cálido',
    challenge:
      'Capturar la caída textil y el carácter artesanal de una colección limitada sin artificios de iluminación artificial.',
    solution:
      'Trabajamos exclusivamente con luz cenital y lateral de taller en película de 35mm, acompañada de un cuaderno editorial sin barnices.',
    outcome:
      'Agotamiento del 90% de las piezas en las primeras tres semanas de lanzamiento.',
    beforeState:
      'Fotografía de catálogo convencional en ciclorama blanco sin atmósfera ni narrativa de marca.',
    afterState:
      'Serie editorial con luz arquitectónica natural utilizada en prensa, escaparate y catálogo digital.',
    deliverables: [
      'Dirección de arte en sesión',
      'Serie fotográfica de 32 retratos',
      'Lookbook editorial impreso',
      'Piezas de lanzamiento digital',
    ],
  },
  {
    id: 'kapsula-sistema',
    index: '06',
    title: 'Kápsula — Identidad Propia & Aplicaciones de Estudio',
    client: 'Kápsula Estudio',
    discipline: 'Publicidad',
    year: '2026',
    summary:
      'Desarrollo de identidad modular propia, textura geométrica, personaje ilustrado y línea editorial en soporte textil.',
    image: '/src/assets/images/industrial_ceramic_design_1795298349492.jpg',
    gallery: [
      '/src/assets/images/editorial_book_spread_1795298350366.jpg',
    ],
    imageAlt:
      'Sistema visual modular oficial de Kápsula con aplicaciones físicas y editoriales',
    featured: true,
    isBrandShowcase: true,
    challenge:
      'Crear una marca personal que integrara diseño gráfico, publicidad y fotografía bajo un símbolo flexible pero inconfundible.',
    solution:
      'Partimos de una "K" construida con arcos modulares de alto contraste, expandida hacia una textura continua y personaje propio.',
    outcome:
      'Sistema implementado íntegramente en papelería, bolsas textiles, dossiers de cliente y plataforma digital.',
    beforeState:
      'Portfolio personal basado únicamente en nombre propio sin sistema gráfico reconocible ni soporte normativo.',
    afterState:
      'Identidad completa con manual de 10 páginas, textura modular replicable, personaje de marca y aplicaciones textiles.',
    deliverables: [
      'Logotipo e isologotipo modular',
      'Textura geométrica de marca',
      'Personaje gráfico de estudio',
      'Manual de identidad y usos',
    ],
  },
];

export const SERVICES: ServiceOffering[] = [
  {
    number: '01',
    title: 'Diseño & Identidad Visual',
    discipline: 'Diseño',
    timeline: '4–6 semanas',
    baseEstimate: '3.000 € – 7.000 €',
    accent: '#0F3D81',
    description:
      'Construcción de marcas personales y corporativas desde la geometría del símbolo hasta manuales normativos listos para imprenta y digital.',
    deliverables: [
      'Logotipo, isologotipo y variaciones normativas',
      'Sistema de proporciones y usos permitidos',
      'Recursos gráficos, texturas y sistema tipográfico',
      'Manual de marca y aplicaciones editoriales',
    ],
  },
  {
    number: '02',
    title: 'Publicidad & Dirección Creativa',
    discipline: 'Publicidad',
    timeline: '3–6 semanas',
    baseEstimate: '3.000 € – 7.000 €',
    accent: '#E31838',
    description:
      'Conceptos visuales con foco comercial y estética autoral para lanzamientos de producto, campañas digitales y piezas exteriores.',
    deliverables: [
      'Concepto creativo y narrativa de campaña',
      'Dirección de arte para piezas digitales e impresas',
      'Sistemas modulares para redes y performance',
      'Supervisión de producción y artes finales',
    ],
  },
  {
    number: '03',
    title: 'Fotografía Editorial & Producto',
    discipline: 'Fotografía',
    timeline: '1–3 semanas',
    baseEstimate: '1.500 € – 3.000 €',
    accent: '#037046',
    description:
      'Producción fotográfica de retrato profesional, producto sobre materiales nobles y cobertura documental con luz natural o controlada.',
    deliverables: [
      'Retrato de marca personal y equipo directivo',
      'Bodegón de producto y packaging en set',
      'Tratamiento visual alineado a la identidad',
      'Entrega optimizada para prensa, web e impresión',
    ],
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Antes de trabajar con Kápsula nuestra comunicación era dispersa entre estudios externos. Unificaron identidad, fotografía de obra y papelería en un único sistema que elevó nuestras reuniones con inversores desde la primera semana.',
    author: 'Clara Mendoza',
    role: 'Socia Directora',
    organization: 'Studio Aeterna',
  },
  {
    quote:
      'Necesitábamos imágenes de producto con carácter sin perder rigor técnico en las etiquetas. La dirección fotográfica y el criterio tipográfico de Pedro duplicaron la atención en nuestro lanzamiento minorista.',
    author: 'Mateo Salgado',
    role: 'Director de Marca',
    organization: 'Auralis Botanical',
  },
];
