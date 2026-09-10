/**
 * @file normativaAgua.ts
 * @description Módulo de dominio que encapsula la matriz legal de parámetros de calidad de agua
 * en la República de Colombia y su motor de inferencia analítica en tiempo de ejecución (runtime evaluation engine).
 * 
 * Arquitectura & Principios de Diseño:
 * - Deterministic Evaluation: Funciones puras sin side-effects para el cálculo normativo.
 * - Single Source of Truth (SSOT): Centralización de rangos, operadores legales y metadatos.
 * - Type-Safe Invariants: Tipado estricto exhaustivo (discriminated unions) para evitar fallos de evaluación.
 * 
 * Normativa Legal de Referencia:
 * - Res. 2115 de 2007 (Ministerio de la Protección Social & MinAmbiente - Agua Potable)
 * - Res. 0631 de 2015 (MinAmbiente - Vertimientos ARD y ARnD a fuentes superficiales)
 * - Decreto 1076 de 2015 / Dec. 1594 de 1984 (Cuerpos de Agua Superficiales)
 */

export type TipoNorma = 
  | 'AGUA_POTABLE' 
  | 'AGUA_RESIDUAL_DOMESTICA' 
  | 'AGUA_RESIDUAL_NO_DOMESTICA' 
  | 'AGUA_SUPERFICIAL_PRESERVACION' 
  | 'AGUA_SUPERFICIAL_CONSUMO';

export type OperadorRango = 'ENTRE' | 'MENOR_IGUAL' | 'MAYOR_IGUAL' | 'CERO_ESTRICTO';

export type EstadoCumplimiento = 'CUMPLE' | 'ALERTA_PREVENTIVA' | 'NO_CUMPLE';

export interface RangoNormativo {
  min?: number;
  max?: number;
  unidad: string;
  operador: OperadorRango;
}

export interface DefinicionParametro {
  id: string;
  nombre: string;
  categoria: 'FISICOQUIMICO' | 'ORGANICO' | 'INORGANICO_METALES' | 'MICROBIOLOGICO' | 'PLAGUICIDAS';
  tipoAgua: TipoNorma;
  normaLegal: string;
  rango: RangoNormativo;
}

export interface AnimacionAntigravity {
  colorHex: string;
  estadoVisual: EstadoCumplimiento;
  presetCss: 'antigravity-pulse-green' | 'antigravity-warning-glow' | 'antigravity-shake-critico';
  propiedadesTimeline: {
    duracionMs: number;
    repeticiones: number | 'infinito';
    escala: [number, number];
    opacidadBorde: [number, number];
    sombraGlow: string;
  };
}

export interface ResultadoEvaluacion {
  parametroId: string;
  nombre: string;
  tipoAgua: TipoNorma;
  valorMedido: number;
  unidad: string;
  cumple: boolean;
  estado: EstadoCumplimiento;
  ui: AnimacionAntigravity;
  diagnostico: string;
}

export interface InfoNormaAgua {
  id: TipoNorma;
  titulo: string;
  subtitulo: string;
  norma: string;
  descripcion: string;
  icono: string;
  colorBadge: string;
}

/**
 * Metadata institucional por norma técnica.
 * Paleta sobria basada en design tokens minimalistas: Negro profundo, Azul técnico y Verde esmeralda.
 */
export const INFORMACION_NORMAS_AGUA: Record<TipoNorma, InfoNormaAgua> = {
  AGUA_POTABLE: {
    id: 'AGUA_POTABLE',
    titulo: 'Agua para Consumo Humano',
    subtitulo: 'Redes de distribución y plantas de potabilización',
    norma: 'Resolución 2115 de 2007 (MPS / MADS)',
    descripcion: 'Control físico-químico y microbiológico para garantizar inocuidad en el agua distribuida a poblaciones humanas.',
    icono: 'droplet',
    colorBadge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
  },
  AGUA_RESIDUAL_DOMESTICA: {
    id: 'AGUA_RESIDUAL_DOMESTICA',
    titulo: 'Aguas Residuales Domésticas (ARD)',
    subtitulo: 'Vertimientos sanitarios y alcantarillados municipales',
    norma: 'Resolución 0631 de 2015 Art. 8',
    descripcion: 'Límites máximos permisibles de vertimiento puntual en efluentes domésticos hacia cuerpos hídricos receptores.',
    icono: 'home',
    colorBadge: 'bg-blue-950/60 text-blue-400 border-blue-800/40'
  },
  AGUA_RESIDUAL_NO_DOMESTICA: {
    id: 'AGUA_RESIDUAL_NO_DOMESTICA',
    titulo: 'Aguas Residuales No Domésticas (ARnD)',
    subtitulo: 'Descargas industriales, comerciales y productivas',
    norma: 'Resolución 0631 de 2015 Art. 10',
    descripcion: 'Criterios de vertimiento para metales pesados, hidrocarburos, tensoactivos y materia orgánica en procesos industriales.',
    icono: 'factory',
    colorBadge: 'bg-zinc-900 text-zinc-300 border-zinc-700/60'
  },
  AGUA_SUPERFICIAL_PRESERVACION: {
    id: 'AGUA_SUPERFICIAL_PRESERVACION',
    titulo: 'Agua Superficial - Preservación',
    subtitulo: 'Protección de flora y fauna en ecosistemas lóticos y lénticos',
    norma: 'Decreto 1076 de 2015 / Dec. 1594 de 1984',
    descripcion: 'Criterios de calidad ecológica para soporte de vida acuática en corrientes de aguas cálidas y frías.',
    icono: 'leaf',
    colorBadge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
  },
  AGUA_SUPERFICIAL_CONSUMO: {
    id: 'AGUA_SUPERFICIAL_CONSUMO',
    titulo: 'Agua Superficial - Captación',
    subtitulo: 'Fuentes hídricas destinadas a potabilización',
    norma: 'Decreto 1076 de 2015 Título 9',
    descripcion: 'Límites de admisibilidad en bocatomas de ríos y embalses previo a desinfección o tratamiento convencional.',
    icono: 'mountain',
    colorBadge: 'bg-blue-950/60 text-blue-400 border-blue-800/40'
  }
};

/**
 * Whitelist de Parámetros Preestablecidos por Defecto (Baseline Selection).
 * Optimización UX / Noise Reduction: Selecciona únicamente 5 o 6 parámetros fundamentales
 * de control diario obligatorio por cada norma, evitando sobrecarga cognitiva (cognitive overload)
 * en el initial render. El resto permanece disponible para activación on-demand.
 */
export const PARAMETROS_BASELINE_DEFAULT: Record<TipoNorma, string[]> = {
  // Art. 21 Res. 2115: pH, Turbiedad, Color, Cloro libre, Conductividad y E. coli
  AGUA_POTABLE: [
    'AP_PH',
    'AP_TURBIEDAD',
    'AP_COLOR_APARENTE',
    'AP_CLORO_LIBRE',
    'AP_CONDUCTIVIDAD',
    'AP_E_COLI'
  ],
  // Art. 8 Res. 0631: Parámetros básicos de vertimiento doméstico
  AGUA_RESIDUAL_DOMESTICA: [
    'ARD_PH',
    'ARD_DBO5',
    'ARD_DQO',
    'ARD_SST',
    'ARD_GRASAS_ACEITES'
  ],
  // Art. 10 Res. 0631: Parámetros industriales prioritarios
  AGUA_RESIDUAL_NO_DOMESTICA: [
    'ARND_PH',
    'ARND_DBO5',
    'ARND_DQO',
    'ARND_SST',
    'ARND_HIDROCARBUROS'
  ],
  // Dec. 1076: Oxígeno disuelto para hábitats acuáticos
  AGUA_SUPERFICIAL_PRESERVACION: [
    'AS_OD_PRESERVA',
    'AS_OD_FRIA'
  ],
  // Dec. 1076: Criterios clave para captación humana
  AGUA_SUPERFICIAL_CONSUMO: [
    'AS_OD_CONSUMO',
    'AS_DBO5_CONSUMO',
    'AS_COLIFORMES_TOTALES',
    'AS_COLIFORMES_FECALES',
    'AS_ARSENICO'
  ]
};

/**
 * Matriz Completa de Parámetros Normativos en Colombia.
 * Lookup Table inmutable para todas las evaluaciones del sistema.
 */
export const MATRIZ_PARAMETROS_AGUA_COLOMBIA: DefinicionParametro[] = [
  // =========================================================================
  // 1. AGUA POTABLE (Resolución 2115 de 2007)
  // =========================================================================
  { id: 'AP_PH', nombre: 'pH', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 4', rango: { min: 6.5, max: 9.0, unidad: 'unidades pH', operador: 'ENTRE' } },
  { id: 'AP_TURBIEDAD', nombre: 'Turbiedad', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 2', rango: { max: 2.0, unidad: 'UNT', operador: 'MENOR_IGUAL' } },
  { id: 'AP_COLOR_APARENTE', nombre: 'Color Aparente', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 2', rango: { max: 15.0, unidad: 'UPC', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CONDUCTIVIDAD', nombre: 'Conductividad Eléctrica', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 3', rango: { max: 1000.0, unidad: 'µS/cm', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CLORO_LIBRE', nombre: 'Cloro Residual Libre', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 9', rango: { min: 0.3, max: 2.0, unidad: 'mg/L Cl2', operador: 'ENTRE' } },
  { id: 'AP_ALCALINIDAD', nombre: 'Alcalinidad Total', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 200.0, unidad: 'mg/L CaCO3', operador: 'MENOR_IGUAL' } },
  { id: 'AP_DUREZA', nombre: 'Dureza Total', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 300.0, unidad: 'mg/L CaCO3', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CLORUROS', nombre: 'Cloruros', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 250.0, unidad: 'mg/L Cl-', operador: 'MENOR_IGUAL' } },
  { id: 'AP_SULFATOS', nombre: 'Sulfatos', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 250.0, unidad: 'mg/L SO4-2', operador: 'MENOR_IGUAL' } },
  { id: 'AP_HIERRO_TOTAL', nombre: 'Hierro Total', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 0.3, unidad: 'mg/L Fe', operador: 'MENOR_IGUAL' } },
  { id: 'AP_MANGANESO', nombre: 'Manganeso', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 0.1, unidad: 'mg/L Mn', operador: 'MENOR_IGUAL' } },
  { id: 'AP_NITRATOS', nombre: 'Nitratos', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 10.0, unidad: 'mg/L NO3-', operador: 'MENOR_IGUAL' } },
  { id: 'AP_NITRITOS', nombre: 'Nitritos', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 0.1, unidad: 'mg/L NO2-', operador: 'MENOR_IGUAL' } },
  { id: 'AP_FLUORUROS', nombre: 'Fluoruros', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 1.0, unidad: 'mg/L F-', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CALCIO', nombre: 'Calcio', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 60.0, unidad: 'mg/L Ca', operador: 'MENOR_IGUAL' } },
  { id: 'AP_MAGNESIO', nombre: 'Magnesio', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 36.0, unidad: 'mg/L Mg', operador: 'MENOR_IGUAL' } },
  { id: 'AP_FOSFATOS', nombre: 'Fosfatos', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 0.5, unidad: 'mg/L PO4-3', operador: 'MENOR_IGUAL' } },
  { id: 'AP_ALUMINIO', nombre: 'Aluminio Residual', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 6', rango: { max: 0.2, unidad: 'mg/L Al3+', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CARBONO_ORGANICO_TOTAL', nombre: 'Carbono Orgánico Total (COT)', categoria: 'ORGANICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 7', rango: { max: 5.0, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },

  // Metales Pesados y Sustancias Químicas (Art. 5, 8)
  { id: 'AP_ANTIMONIO', nombre: 'Antimonio', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.02, unidad: 'mg/L Sb', operador: 'MENOR_IGUAL' } },
  { id: 'AP_ARSENICO', nombre: 'Arsénico', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.01, unidad: 'mg/L As', operador: 'MENOR_IGUAL' } },
  { id: 'AP_BARIO', nombre: 'Bario', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.7, unidad: 'mg/L Ba', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CADMIO', nombre: 'Cadmio', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.003, unidad: 'mg/L Cd', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CIANURO', nombre: 'Cianuro Libre', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.05, unidad: 'mg/L CN-', operador: 'MENOR_IGUAL' } },
  { id: 'AP_COBRE', nombre: 'Cobre', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 1.0, unidad: 'mg/L Cu', operador: 'MENOR_IGUAL' } },
  { id: 'AP_CROMO_TOTAL', nombre: 'Cromo Total', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.05, unidad: 'mg/L Cr', operador: 'MENOR_IGUAL' } },
  { id: 'AP_MERCURIO', nombre: 'Mercurio', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.001, unidad: 'mg/L Hg', operador: 'MENOR_IGUAL' } },
  { id: 'AP_NIQUEL', nombre: 'Níquel', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.02, unidad: 'mg/L Ni', operador: 'MENOR_IGUAL' } },
  { id: 'AP_PLOMO', nombre: 'Plomo', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.01, unidad: 'mg/L Pb', operador: 'MENOR_IGUAL' } },
  { id: 'AP_SELENIO', nombre: 'Selenio', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 5', rango: { max: 0.01, unidad: 'mg/L Se', operador: 'MENOR_IGUAL' } },
  { id: 'AP_TRIHALOMETANOS', nombre: 'Trihalometanos Totales', categoria: 'ORGANICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 7', rango: { max: 0.2, unidad: 'mg/L THMs', operador: 'MENOR_IGUAL' } },
  { id: 'AP_PLAGUICIDAS_TOTALES', nombre: 'Plaguicidas Totales', categoria: 'PLAGUICIDAS', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 8', rango: { max: 0.1, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },

  // Microbiología (Art. 11)
  { id: 'AP_E_COLI', nombre: 'Escherichia coli', categoria: 'MICROBIOLOGICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 11', rango: { max: 0, unidad: 'UFC/100 mL', operador: 'CERO_ESTRICTO' } },
  { id: 'AP_COLIFORMES_TOTALES', nombre: 'Coliformes Totales', categoria: 'MICROBIOLOGICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 11', rango: { max: 0, unidad: 'UFC/100 mL', operador: 'CERO_ESTRICTO' } },
  { id: 'AP_GIARDIA', nombre: 'Giardia', categoria: 'MICROBIOLOGICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 13', rango: { max: 0, unidad: 'Quistes/L', operador: 'CERO_ESTRICTO' } },
  { id: 'AP_CRYPTOSPORIDIUM', nombre: 'Cryptosporidium', categoria: 'MICROBIOLOGICO', tipoAgua: 'AGUA_POTABLE', normaLegal: 'Res. 2115/2007 Art. 13', rango: { max: 0, unidad: 'Ooquistes/L', operador: 'CERO_ESTRICTO' } },

  // =========================================================================
  // 2. AGUA RESIDUAL DOMÉSTICA (ARD) - Res. 0631/2015 Art. 8
  // =========================================================================
  { id: 'ARD_PH', nombre: 'pH', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 8', rango: { min: 6.0, max: 9.0, unidad: 'unidades pH', operador: 'ENTRE' } },
  { id: 'ARD_DBO5', nombre: 'Demanda Bioquímica de Oxígeno (DBO5)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 8', rango: { max: 90.0, unidad: 'mg/L O2', operador: 'MENOR_IGUAL' } },
  { id: 'ARD_DQO', nombre: 'Demanda Química de Oxígeno (DQO)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 8', rango: { max: 180.0, unidad: 'mg/L O2', operador: 'MENOR_IGUAL' } },
  { id: 'ARD_SST', nombre: 'Sólidos Suspendidos Totales (SST)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 8', rango: { max: 90.0, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },
  { id: 'ARD_SEDIMENTABLES', nombre: 'Sólidos Sedimentables (SSED)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 8', rango: { max: 2.0, unidad: 'mL/L', operador: 'MENOR_IGUAL' } },
  { id: 'ARD_GRASAS_ACEITES', nombre: 'Grasas y Aceites', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 8', rango: { max: 20.0, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },

  // =========================================================================
  // 3. AGUA RESIDUAL NO DOMÉSTICA (ARnD) - Res. 0631/2015 Art. 10
  // =========================================================================
  { id: 'ARND_PH', nombre: 'pH Industrial', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { min: 6.0, max: 9.0, unidad: 'unidades pH', operador: 'ENTRE' } },
  { id: 'ARND_DBO5', nombre: 'DBO5 Industrial', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 200.0, unidad: 'mg/L O2', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_DQO', nombre: 'DQO Industrial', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 400.0, unidad: 'mg/L O2', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_SST', nombre: 'SST Industrial', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 100.0, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_CADMIO', nombre: 'Cadmio en Vertimiento', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.1, unidad: 'mg/L Cd', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_CIANURO', nombre: 'Cianuro Total', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.5, unidad: 'mg/L CN-', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_CROMO_TOTAL', nombre: 'Cromo Total Industrial', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.5, unidad: 'mg/L Cr', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_CROMO_HEXAVALENTE', nombre: 'Cromo Hexavalente (Cr+6)', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.1, unidad: 'mg/L Cr+6', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_MERCURIO', nombre: 'Mercurio en Vertimiento', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.01, unidad: 'mg/L Hg', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_NIQUEL', nombre: 'Níquel en Vertimiento', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.5, unidad: 'mg/L Ni', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_PLOMO', nombre: 'Plomo en Vertimiento', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.2, unidad: 'mg/L Pb', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_HIDROCARBUROS', nombre: 'Hidrocarburos Totales (HTP)', categoria: 'ORGANICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 20.0, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_FENOLES', nombre: 'Compuestos Fenólicos', categoria: 'ORGANICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 0.2, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },
  { id: 'ARND_SAAM', nombre: 'Detergentes (SAAM)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_RESIDUAL_NO_DOMESTICA', normaLegal: 'Res. 0631/2015 Art. 10', rango: { max: 10.0, unidad: 'mg/L', operador: 'MENOR_IGUAL' } },

  // =========================================================================
  // 4. CUERPOS DE AGUA SUPERFICIALES (Decreto 1076/2015)
  // =========================================================================
  { id: 'AS_OD_PRESERVA', nombre: 'Oxígeno Disuelto (Fauna Cálida)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_SUPERFICIAL_PRESERVACION', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { min: 4.0, unidad: 'mg/L O2', operador: 'MAYOR_IGUAL' } },
  { id: 'AS_OD_FRIA', nombre: 'Oxígeno Disuelto (Fauna Fría)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_SUPERFICIAL_PRESERVACION', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { min: 5.0, unidad: 'mg/L O2', operador: 'MAYOR_IGUAL' } },
  { id: 'AS_OD_CONSUMO', nombre: 'Oxígeno Disuelto (Destino Consumo)', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { min: 4.0, unidad: 'mg/L O2', operador: 'MAYOR_IGUAL' } },
  { id: 'AS_DBO5_CONSUMO', nombre: 'DBO5 Fuente Abastecimiento', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 4.0, unidad: 'mg/L O2', operador: 'MENOR_IGUAL' } },
  { id: 'AS_COLIFORMES_TOTALES', nombre: 'Coliformes Totales (Captación)', categoria: 'MICROBIOLOGICO', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 20000.0, unidad: 'NMP/100 mL', operador: 'MENOR_IGUAL' } },
  { id: 'AS_COLIFORMES_FECALES', nombre: 'Coliformes Fecales (Captación)', categoria: 'MICROBIOLOGICO', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 2000.0, unidad: 'NMP/100 mL', operador: 'MENOR_IGUAL' } },
  { id: 'AS_ARSENICO', nombre: 'Arsénico en Fuente Superficial', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 0.05, unidad: 'mg/L As', operador: 'MENOR_IGUAL' } },
  { id: 'AS_BARIO', nombre: 'Bario en Fuente Superficial', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 1.0, unidad: 'mg/L Ba', operador: 'MENOR_IGUAL' } },
  { id: 'AS_CADMIO', nombre: 'Cadmio en Fuente Superficial', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 0.01, unidad: 'mg/L Cd', operador: 'MENOR_IGUAL' } },
  { id: 'AS_CIANURO', nombre: 'Cianuros en Fuente Superficial', categoria: 'FISICOQUIMICO', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 0.2, unidad: 'mg/L CN-', operador: 'MENOR_IGUAL' } },
  { id: 'AS_PLOMO', nombre: 'Plomo en Fuente Superficial', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 0.05, unidad: 'mg/L Pb', operador: 'MENOR_IGUAL' } },
  { id: 'AS_MERCURIO', nombre: 'Mercurio en Fuente Superficial', categoria: 'INORGANICO_METALES', tipoAgua: 'AGUA_SUPERFICIAL_CONSUMO', normaLegal: 'Dec. 1076/2015 Tit. 9', rango: { max: 0.002, unidad: 'mg/L Hg', operador: 'MENOR_IGUAL' } }
];

/**
 * Cache Map para búsqueda con complejidad temporal O(1) en el runtime.
 */
const PARAMETRO_INDEX_MAP = new Map<string, DefinicionParametro>(
  MATRIZ_PARAMETROS_AGUA_COLOMBIA.map(p => [p.id, p])
);

/**
 * Motor de Evaluación Analítica y Mapeo Dinámico (Pure Function).
 * 
 * @param parametroId Identificador normativo único (e.g. 'AP_PH', 'ARD_DBO5').
 * @param valorMedido Lectura cuantitativa de laboratorio o sonda.
 * @returns ResultadoEvaluacion Objeto inmutable con status de conformidad y timeline tokens.
 * @throws Error si el identificador no existe en la matriz legal (early failure pattern).
 */
export function evaluarParametro(parametroId: string, valorMedido: number): ResultadoEvaluacion {
  const param = PARAMETRO_INDEX_MAP.get(parametroId);

  if (!param) {
    throw new Error(`[Invariant Violation]: Identificador '${parametroId}' no reconocido en la normativa colombiana.`);
  }

  const { operador, min, max, unidad } = param.rango;
  let cumple = false;
  let enAlerta = false;

  // Evaluación determinista según operador algebraico normado
  switch (operador) {
    case 'ENTRE':
      if (min !== undefined && max !== undefined) {
        cumple = valorMedido >= min && valorMedido <= max;
        // Ventana de tolerancia preventiva: umbral del 10% en límites
        const margen = (max - min) * 0.1;
        enAlerta = cumple && (valorMedido <= min + margen || valorMedido >= max - margen);
      }
      break;

    case 'MENOR_IGUAL':
      if (max !== undefined) {
        cumple = valorMedido <= max;
        // Advertencia preventiva al sobrepasar el 85% del tope máximo
        enAlerta = cumple && valorMedido >= max * 0.85;
      }
      break;

    case 'MAYOR_IGUAL':
      if (min !== undefined) {
        cumple = valorMedido >= min;
        // Advertencia si cae dentro del 15% superior del límite mínimo admisible
        enAlerta = cumple && valorMedido <= min * 1.15;
      }
      break;

    case 'CERO_ESTRICTO':
      cumple = valorMedido === 0;
      enAlerta = false;
      break;
  }

  // Asignación de tokens visuales sobrios para el semáforo Antigravity
  let estado: EstadoCumplimiento = 'NO_CUMPLE';
  let ui: AnimacionAntigravity;

  if (cumple && !enAlerta) {
    estado = 'CUMPLE';
    ui = {
      colorHex: '#10b981', // Emerald 500 minimalista
      estadoVisual: 'CUMPLE',
      presetCss: 'antigravity-pulse-green',
      propiedadesTimeline: {
        duracionMs: 2500,
        repeticiones: 'infinito',
        escala: [1.0, 1.01],
        opacidadBorde: [0.3, 0.7],
        sombraGlow: '0 0 12px rgba(16, 185, 129, 0.25)'
      }
    };
  } else if (cumple && enAlerta) {
    estado = 'ALERTA_PREVENTIVA';
    ui = {
      colorHex: '#f59e0b', // Amber 500 técnico
      estadoVisual: 'ALERTA_PREVENTIVA',
      presetCss: 'antigravity-warning-glow',
      propiedadesTimeline: {
        duracionMs: 1500,
        repeticiones: 'infinito',
        escala: [1.0, 1.015],
        opacidadBorde: [0.4, 0.8],
        sombraGlow: '0 0 12px rgba(245, 158, 11, 0.25)'
      }
    };
  } else {
    estado = 'NO_CUMPLE';
    ui = {
      colorHex: '#ef4444', // Red 500 sobrio
      estadoVisual: 'NO_CUMPLE',
      presetCss: 'antigravity-shake-critico',
      propiedadesTimeline: {
        duracionMs: 400,
        repeticiones: 3,
        escala: [0.99, 1.01],
        opacidadBorde: [0.6, 0.9],
        sombraGlow: '0 0 16px rgba(239, 68, 68, 0.35)'
      }
    };
  }

  const detalleRango = 
    operador === 'ENTRE' ? `[${min} - ${max}]` :
    operador === 'MENOR_IGUAL' ? `≤ ${max}` :
    operador === 'MAYOR_IGUAL' ? `≥ ${min}` : '0 estricto';

  return {
    parametroId: param.id,
    nombre: param.nombre,
    tipoAgua: param.tipoAgua,
    valorMedido,
    unidad,
    cumple,
    estado,
    ui,
    diagnostico: cumple 
      ? `Conforme: ${valorMedido} ${unidad} se encuentra dentro del rango de ${param.normaLegal} (${detalleRango}).`
      : `No Conforme: ${valorMedido} ${unidad} supera el límite normado en ${param.normaLegal} (${detalleRango}).`
  };
}

/**
 * Filtro declarativo por tipo de matriz legal (pure helper).
 */
export function obtenerParametrosPorTipo(tipo: TipoNorma): DefinicionParametro[] {
  return MATRIZ_PARAMETROS_AGUA_COLOMBIA.filter(p => p.tipoAgua === tipo);
}
