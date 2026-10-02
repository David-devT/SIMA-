<!--
  @file LandingCards.svelte
  @description Página de inicio de SIMA Colombia completamente rediseñada según el modelo Stitch.
  Soporta alternancia dinámica entre Modo Oscuro y Modo Claro, telemetría andina simulada,
  simulador interactivo de pH en tiempo real (Res. 2115/2007) y catálogo de matrices ambientales.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import ModalAlerta from './ModalAlerta.svelte';
  import Icon from './icons/Icon.svelte';

  // Estado reactivo para modales
  let modalVisible = $state(false);
  let moduloSeleccionado = $state('Muestreo Ambiental');
  let iconoSeleccionado = $state('construction');
  let descripcionModulo = $state('Las especificaciones normativas se están incorporando al motor analítico.');

  // Estado reactivo del tema actual (para telemetría adaptativa)
  let temaActual = $state<'dark' | 'light'>('dark');

  // Estado reactivo para el simulador interactivo de pH (Res. 2115/2007)
  let phValor = $state<number>(7.2);

  onMount(() => {
    // Sincronizar tema inicial desde el DOM o localStorage
    const sincronizarTema = () => {
      const temaGuardado = localStorage.getItem('theme');
      if (temaGuardado === 'light') {
        temaActual = 'light';
      } else if (temaGuardado === 'dark') {
        temaActual = 'dark';
      } else {
        temaActual = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      }
    };

    sincronizarTema();

    // Escuchar cambios de tema desde el Navbar
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'dark' | 'light' }>;
      if (customEvent.detail?.theme) {
        temaActual = customEvent.detail.theme;
      }
    };

    window.addEventListener('theme-change', handleThemeChange);

    // Observar mutaciones en atributos de <html> para sincronización instantánea
    const observer = new MutationObserver(() => {
      const esOscuro = document.documentElement.classList.contains('dark') || 
        document.documentElement.getAttribute('data-theme') === 'dark';
      temaActual = esOscuro ? 'dark' : 'light';
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      observer.disconnect();
    };
  });

  // Evaluación en tiempo real del simulador didáctico de pH
  let evaluacionPh = $derived((() => {
    const val = Number(phValor.toFixed(1));
    if (val >= 6.5 && val <= 9.0) {
      return {
        estado: 'CONFORME',
        colorBadge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-[#00dfc1] border-emerald-300 dark:border-emerald-500/30',
        icono: 'check-circle',
        texto: 'El pH se encuentra dentro del rango admisible sin riesgo para la salud ni deterioro del sistema de distribución.',
        irca: '0.0 Pts',
        colorIrca: 'text-emerald-700 dark:text-[#00dfc1]',
        efecto: val < 7.0 ? 'Ligeramente ácido (seguro)' : val === 7.0 ? 'Agua perfectamente neutra' : 'Ligeramente alcalino (seguro)',
        subefecto: 'Sin corrosión ni incrustación'
      };
    } else if (val < 6.5) {
      return {
        estado: 'NO CONFORME (ÁCIDO)',
        colorBadge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/30',
        icono: 'x-circle',
        texto: 'Riesgo químico: El agua ácida acelera la corrosión de tuberías metálicas, liberando plomo o cobre, y genera sabor agrio.',
        irca: '1.5 Pts',
        colorIrca: 'text-rose-600 dark:text-rose-400',
        efecto: 'Corrosión de tuberías y arrastre de metales',
        subefecto: 'Infracción Resolución 2115 Art. 2'
      };
    } else {
      return {
        estado: 'NO CONFORME (ALCALINO)',
        colorBadge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
        icono: 'alert-triangle',
        texto: 'Riesgo operacional: Favorece la incrustación severa de carbonatos en la red y reduce notablemente la eficacia de desinfección con cloro.',
        irca: '1.5 Pts',
        colorIrca: 'text-amber-600 dark:text-amber-400',
        efecto: 'Incrustaciones e ineficiencia del cloro libre',
        subefecto: 'Infracción Resolución 2115 Art. 2'
      };
    }
  })());

  function notificarModuloInactivo(nombre: string, icono: string, desc: string): void {
    moduloSeleccionado = nombre;
    iconoSeleccionado = icono;
    descripcionModulo = desc;
    modalVisible = true;
  }
</script>

<div class="space-y-12 pb-12">

  <!-- ========================================================================
       HUD TELEMETRÍA & FRANJA DE ESTADO SUPERIOR (ADAPTABLE AL TEMA)
       ======================================================================== -->
  <section class="w-full border-b border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#171c21]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 transition-colors">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <!-- Telemetría Modo Claro (Stitch Spec) - Visible automáticamente en Modo Claro -->
      <div class="flex dark:hidden items-center justify-between w-full flex-wrap gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            SIMA Engine v2.4-ECO Activo
          </span>
          <span class="text-slate-300 hidden sm:inline">/</span>
          <span class="text-slate-600 text-[11px] inline-flex items-center gap-1">
            <Icon name="shield-check" size={13} class="text-teal-600" />
            Conformidad MinAmbiente &amp; MinSalud IDEAM
          </span>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px] shadow-sm">
            <Icon name="sun" size={13} class="text-amber-500" />
            <span class="font-semibold">Modo Claro Activo</span>
            <span class="text-slate-500 text-[10px] uppercase tracking-wider pl-1 font-mono">100% Contraste AAA</span>
          </div>
          <div class="hidden md:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-600 text-[11px]">
            <Icon name="activity" size={13} class="text-teal-600" />
            <span>Latencia Calibración: <strong class="text-slate-900 font-mono">14ms</strong></span>
          </div>
        </div>
      </div>

      <!-- Telemetría Modo Oscuro (Stitch Spec) - Visible automáticamente en Modo Oscuro -->
      <div class="hidden dark:flex items-center justify-between w-full flex-wrap gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/70 text-[#00dfc1] font-semibold tracking-wider uppercase border border-emerald-500/30 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-[#00dfc1] animate-pulse"></span>
            SIMA-CORE v2.4 (IRCA + ICA-NSF)
          </span>
          <span class="text-slate-700 hidden sm:inline">/</span>
          <span class="text-slate-300 text-[11px]">
            SISTEMA ANDINO DE MONITOREO AMBIENTAL
          </span>
          <span class="text-slate-700 hidden md:inline">/</span>
          <span class="text-emerald-400 text-[11px] hidden md:inline">
            COORD: 04°38'19"N 74°05'01"W • 2,640 msnm
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-md bg-[#252a30] text-slate-300 text-[11px] flex items-center gap-1 border border-white/5">
            <Icon name="moon" size={12} class="text-cyan-400" />
            <span>MODO OSCURO ACTIVO</span>
          </span>
          <span class="px-2 py-0.5 rounded-md bg-[#252a30] text-[#00dfc1] text-[11px] font-bold border border-white/5">
            WCAG 2.2 AAA
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       HERO SECTION: PRECISIÓN AMBIENTAL & CONSOLA DE TELEMETRÍA
       ======================================================================== -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      
      <!-- Columna Izquierda: Identidad, Misión y Chips Normativos -->
      <div class="lg:col-span-7 flex flex-col gap-5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-[#00dfc1] font-mono text-[11px] font-semibold tracking-wider uppercase border border-emerald-300 dark:border-emerald-500/30">
            <Icon name="flask" size={13} />
            Proyecto de Práctica Personal • Fines Educativos
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#252a30] text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-white/10">
            <Icon name="shield-check" size={13} class="text-amber-500 dark:text-amber-400" />
            Validación Normativa Vigente
          </span>
        </div>

        <div class="space-y-3">
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Simulador de Calidad Ambiental
          </h1>
          <p class="text-base text-slate-600 dark:text-[#bcc8d5] max-w-2xl leading-relaxed">
            Herramienta de estudio y práctica analítica desarrollada de forma independiente para simular la evaluación sistemática de parámetros físico-químicos frente a las resoluciones ambientales de la República de Colombia.
          </p>
        </div>

        <!-- Chips de Normas Legales Incorporadas -->
        <div class="flex flex-wrap gap-2 pt-1 font-mono text-xs">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#171c21] border border-slate-200 dark:border-white/10 shadow-sm text-slate-800 dark:text-slate-200">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <strong class="text-emerald-700 dark:text-[#00dfc1]">Res. 2115 / 2007</strong>
            <span class="text-slate-500 text-[11px]">(Agua Potable - IRCA)</span>
          </div>

          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#171c21] border border-slate-200 dark:border-white/10 shadow-sm text-slate-800 dark:text-slate-200">
            <span class="w-2 h-2 rounded-full bg-sky-500"></span>
            <strong class="text-sky-700 dark:text-sky-400">Res. 0631 / 2015</strong>
            <span class="text-slate-500 text-[11px]">(Vertimientos ARD/ARnD)</span>
          </div>

          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#171c21] border border-slate-200 dark:border-white/10 shadow-sm text-slate-800 dark:text-slate-200">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <strong class="text-amber-700 dark:text-amber-400">Dec. 1076 / 2015</strong>
            <span class="text-slate-500 text-[11px]">(Cuerpos Superficiales)</span>
          </div>
        </div>

        <!-- Botones de Acción Inmediata -->
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="#simulador-rapido"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00f5d4] dark:hover:bg-[#26fedc] text-white dark:text-[#00382f] font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="droplet" size={18} />
            <span>Comenzar Simulación Rápida</span>
            <Icon name="arrow-down" size={16} />
          </a>

          <a
            href="#matrices-principales"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#1b2025] hover:bg-slate-100 dark:hover:bg-[#252a30] text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-white/10 transition-all shadow-sm cursor-pointer"
          >
            <Icon name="table" size={16} />
            <span>Explorar Matrices</span>
          </a>
        </div>
      </div>

      <!-- Columna Derecha: Tarjeta de Telemetría Dinámica Bimodal (Stitch Spec) -->
      <div class="lg:col-span-5">
        <!-- Modo Claro: Deck de Vigilancia y Métricas Oficiales Stitch (Visible automáticamente en Modo Claro) -->
        <div class="block dark:hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-xl flex-col gap-4 relative">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-mono">
            <span class="font-bold uppercase tracking-wider text-slate-500">
              Vigilancia Simulada
            </span>
            <span class="inline-flex items-center gap-1.5 font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60">
              <Icon name="sliders" size={13} class="text-teal-600" />
              <span>1 Matriz Lista</span>
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 py-1">
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="block text-xs font-mono text-slate-500 mb-1">Normas Integradas</span>
              <span class="font-bold text-3xl text-slate-900 tracking-tight">5</span>
              <span class="block text-[11px] font-mono text-teal-700 font-semibold mt-1">Reglamentadas</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="block text-xs font-mono text-slate-500 mb-1">Parámetros FQ</span>
              <span class="font-bold text-3xl text-slate-900 tracking-tight">24+</span>
              <span class="block text-[11px] font-mono text-sky-700 font-semibold mt-1">Calibrados</span>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <span class="flex items-center gap-2 font-semibold">
              <Icon name="shield-check" size={16} class="text-emerald-600" />
              <span>Cálculo IRCA Automatizado</span>
            </span>
            <span class="font-mono font-bold text-sm text-emerald-800">0 a 100%</span>
          </div>

          <div class="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-100">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Entorno Simulado de Laboratorio</span>
            </span>
            <span class="text-slate-600 font-medium">Validado con Tablas Oficiales</span>
          </div>
        </div>

        <!-- Modo Oscuro: Osciloscopio de Telemetría Andina Stitch (Visible automáticamente en Modo Oscuro) -->
        <div class="hidden dark:flex bg-[#1b2025] rounded-2xl border border-white/10 p-5 shadow-xl flex-col gap-4 relative overflow-hidden">
          <div class="flex items-center justify-between bg-[#121820] px-3.5 py-2 rounded-xl text-xs font-mono">
            <span class="text-slate-400 uppercase tracking-wider font-bold">
              ESTADO DE TELEMETRÍA EN LÍNEA
            </span>
            <span class="text-[#00dfc1] font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#00dfc1] animate-pulse"></span>
              DISPONIBLE
            </span>
          </div>

          <!-- Sensor Visual Simulado / Gráfico Osciloscopio -->
          <div class="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900 flex flex-col justify-between p-4 text-white shadow-inner">
            <div class="flex items-start justify-between z-10">
              <div>
                <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  CUENCA PILOTO SIMULADA
                </span>
                <span class="font-bold text-sm text-emerald-400 tracking-tight">
                  Río Bogotá - Cuenca Alta
                </span>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ESTACIÓN 01
              </span>
            </div>

            <!-- Gráfico Vectorial Sparkline de Caudal y Frecuencia -->
            <div class="w-full my-auto">
              <svg class="w-full h-14 text-emerald-400" width="300" height="50" fill="none" preserveAspectRatio="none" viewBox="0 0 300 50">
                <path d="M0,25 Q30,10 60,30 T120,20 T180,35 T240,15 T300,25" stroke="currentColor" stroke-width="2.5" />
                <path d="M0,25 Q30,10 60,30 T120,20 T180,35 T240,15 T300,25 L300,50 L0,50 Z" fill="currentColor" fill-opacity="0.1" />
                <circle cx="180" cy="35" r="4" fill="#00f5d4" class="animate-ping" style="transform-origin: 180px 35px;" />
                <circle cx="180" cy="35" r="3.5" fill="#00f5d4" />
              </svg>
            </div>

            <div class="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-1 border-t border-white/10 z-10">
              <span>Q = 14.8 m³/s</span>
              <span class="text-emerald-400 font-bold">ICA Estimado: 84 (Bueno)</span>
              <span>T = 13.4 °C</span>
            </div>
          </div>

          <!-- Mosaico de Instrumentos & Capacidades -->
          <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div class="bg-[#121820] p-2.5 rounded-xl border border-white/5 flex flex-col gap-0.5">
              <span class="text-slate-400 text-[10px]">Cálculos IRCA</span>
              <span class="font-bold text-base text-emerald-400">100%</span>
              <span class="text-[9px] text-slate-500">Sin Viabilidad Falla</span>
            </div>
            <div class="bg-[#121820] p-2.5 rounded-xl border border-white/5 flex flex-col gap-0.5">
              <span class="text-slate-400 text-[10px]">Parámetros DB</span>
              <span class="font-bold text-base text-cyan-400">38</span>
              <span class="text-[9px] text-slate-500">Físico-Químicos</span>
            </div>
            <div class="bg-[#121820] p-2.5 rounded-xl border border-white/5 flex flex-col gap-0.5">
              <span class="text-slate-400 text-[10px]">Exportables</span>
              <span class="font-bold text-base text-amber-400">PDF/CSV</span>
              <span class="text-[9px] text-slate-500">Reporte Técnico</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ========================================================================
       SECCIÓN DIDÁCTICA INTERACTIVA: SIMULACIÓN RÁPIDA DE PARÁMETRO
       ======================================================================== -->
  <section id="simulador-rapido" class="w-full bg-slate-100/70 dark:bg-[#121820]/90 border-y border-slate-200 dark:border-white/[0.06] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Herramienta Didáctica en Vivo • Tiempo Real
            </span>
          </div>
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Simulación Rápida de Parámetro (Agua Potable - Res. 2115/2007)
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Ajuste el control deslizante para simular la variación del pH en una red de distribución y observar la ponderación automática del riesgo en el Índice de Riesgo de la Calidad del Agua (IRCA).
          </p>
        </div>

        <div class="bg-white dark:bg-[#1b2025] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2 self-start md:self-auto shadow-sm">
          <Icon name="sliders" size={14} class="text-emerald-500" />
          <span>Norma: <strong>Art. 2, Res. 2115/2007</strong></span>
        </div>
      </div>

      <!-- Consola de Simulación Interactiva en Grid -->
      <div class="bg-white dark:bg-[#171c21] rounded-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <!-- Columna Izquierda: Controles del Slider y Rango Legal -->
        <div class="lg:col-span-6 flex flex-col gap-5">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-[#00dfc1] font-bold block">
                Parámetro Evaluado
              </span>
              <span class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Potencial de Hidrógeno (pH)
              </span>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Unidad de Medida
              </span>
              <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unidades de pH (UP)
              </span>
            </div>
          </div>

          <!-- Caja del Slider Interactivo -->
          <div class="bg-slate-50 dark:bg-[#0f1419] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
                Valor del ensayo en laboratorio:
              </span>
              <div class="flex items-baseline gap-1.5 font-mono">
                <span class="text-3xl font-extrabold text-emerald-600 dark:text-[#00f5d4]">
                  {phValor.toFixed(1)}
                </span>
                <span class="text-xs text-slate-500 font-bold">UP</span>
              </div>
            </div>

            <!-- Slider Range HTML5 -->
            <input
              type="range"
              min="4.0"
              max="11.0"
              step="0.1"
              bind:value={phValor}
              class="w-full h-3 bg-slate-200 dark:bg-[#252a30] rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-[#00f5d4] focus:outline-none"
              aria-label="Ajustar valor de pH para simulación de calidad de agua"
              aria-valuemin="4.0"
              aria-valuemax="11.0"
              aria-valuenow={phValor}
              aria-valuetext="{phValor.toFixed(1)} UP - {evaluacionPh.estado}"
            />

            <!-- Marcadores de Escala Cuantitativa -->
            <div class="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
              <span>4.0 (Muy Ácido)</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-bold">| 6.5 (Límite Inf)</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-bold">| 8.5–9.0 (Límite Sup)</span>
              <span>11.0 (Alcalino)</span>
            </div>
          </div>

          <!-- Barra de Ventana de Conformidad Legal -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-mono">
              <span class="text-slate-500">Ventana de Conformidad Legal</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Rango Admisible: 6.5 a 9.0 UP</span>
            </div>
            <div class="w-full h-3 bg-slate-200 dark:bg-[#0a0f14] rounded-full overflow-hidden flex shadow-inner">
              <div class="w-[35.7%] bg-rose-500/80" title="Ácido no conforme (< 6.5)"></div>
              <div class="w-[35.7%] bg-emerald-500" title="Conforme Res. 2115 (6.5 a 9.0)"></div>
              <div class="w-[28.6%] bg-amber-500/80" title="Alcalino no conforme (> 9.0)"></div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Tarjeta de Diagnóstico Automático en Vivo -->
        <div class="lg:col-span-6 flex flex-col gap-4">
          <div 
            class="bg-slate-50 dark:bg-[#0f1419] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col gap-3 shadow-sm transition-all duration-300 min-h-[200px]"
            aria-live="polite"
            aria-atomic="true"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                DIAGNÓSTICO AUTOMÁTICO
              </span>
              <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 {evaluacionPh.colorBadge}">
                <Icon name={evaluacionPh.icono} size={13} />
                <span>{evaluacionPh.estado}</span>
              </span>
            </div>

            <p class="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed min-h-[44px]">
              {evaluacionPh.texto}
            </p>

            <div class="grid grid-cols-2 gap-3 pt-2">
              <div class="bg-white dark:bg-[#171c21] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col">
                <span class="text-[10px] font-mono text-slate-400 uppercase">Puntaje de Riesgo Asignado</span>
                <span class="text-lg font-bold font-mono {evaluacionPh.colorIrca}">
                  {evaluacionPh.irca}
                </span>
                <span class="text-[10px] text-slate-400">Puntaje IRCA máximo: 1.5</span>
              </div>

              <div class="bg-white dark:bg-[#171c21] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col">
                <span class="text-[10px] font-mono text-slate-400 uppercase">Efecto en Red / Salud</span>
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {evaluacionPh.efecto}
                </span>
                <span class="text-[10px] text-slate-400 truncate">{evaluacionPh.subefecto}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0f1419] text-xs font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
            <span class="flex items-center gap-1.5">
              <Icon name="academic" size={14} class="text-emerald-500" />
              <span>Cálculo reglamentado según Cuadro No. 1 de la Res. 2115 de 2007.</span>
            </span>
            <a href="/agua" class="text-emerald-600 dark:text-[#00f5d4] font-bold hover:underline">
              Ver los 38 parámetros →
            </a>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- ========================================================================
       MATRICES PRINCIPALES DE MUESTREO (CORE BENTO)
       ======================================================================== -->
  <section id="matrices-principales" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
    <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-3 border-b border-slate-200 dark:border-white/[0.06] pb-3">
      <div>
        <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-[#00dfc1] font-bold">
          Núcleo de Inspección Ambiental
        </span>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Matrices Principales de Muestreo
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Sistemas analíticos completos para la carga de ensayos de laboratorio, evaluación automatizada de no-conformidades y generación de reportes periciales.
        </p>
      </div>

      <div class="flex items-center gap-2 font-mono text-xs">
        <span class="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-[#00dfc1] border border-emerald-300 dark:border-emerald-500/30 font-bold">
          1 Activa
        </span>
        <span class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#1b2025] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 font-medium">
          1 En Preparación
        </span>
      </div>
    </div>

    <!-- Bento Dual Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- CARD 1: MUESTREO DE AGUA (ACTIVA - HERO) -->
      <div class="lg:col-span-7 bg-white dark:bg-[#171c21] rounded-2xl border-2 border-emerald-500/80 dark:border-[#00dfc1]/60 p-6 sm:p-8 shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-emerald-500 transition-colors">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-md bg-emerald-600 dark:bg-[#00f5d4] text-white dark:text-[#00382f] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-white dark:bg-[#00382f] animate-pulse"></span>
              DISPONIBLE Y ACTIVA
            </span>
            <span class="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              5 NORMAS REGLAMENTADAS
            </span>
          </div>

          <div>
            <a href="/agua" class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
              <Icon name="droplet" size={24} class="text-emerald-600 dark:text-[#00dfc1]" />
              <span>Muestreo de Calidad de Agua</span>
              <Icon name="arrow-right" size={20} class="text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </a>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Evaluación integral para Agua Potable, Residual Doméstica (ARD), Residual No Doméstica (ARnD) y Cuerpos Superficiales conforme a Res. 2115/2007, Res. 0631/2015 y Dec. 1076/2015.
            </p>
          </div>

          <!-- Mosaico de Especificaciones Técnicas Frecuentes -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div class="bg-slate-50 dark:bg-[#0f1419] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col">
              <span class="text-[10px] font-mono text-slate-400">pH Normativo</span>
              <span class="font-mono font-bold text-slate-900 dark:text-white text-sm">6.5 - 8.5 UP</span>
              <span class="text-[9px] text-emerald-600 dark:text-emerald-400">Límite Aceptable</span>
            </div>
            <div class="bg-slate-50 dark:bg-[#0f1419] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col">
              <span class="text-[10px] font-mono text-slate-400">Turbiedad</span>
              <span class="font-mono font-bold text-slate-900 dark:text-white text-sm">&lt; 2.0 UNT</span>
              <span class="text-[9px] text-emerald-600 dark:text-emerald-400">Conforme IRCA</span>
            </div>
            <div class="bg-slate-50 dark:bg-[#0f1419] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col">
              <span class="text-[10px] font-mono text-slate-400">O₂ Disuelto</span>
              <span class="font-mono font-bold text-slate-900 dark:text-white text-sm">&gt; 4.0 mg/L</span>
              <span class="text-[9px] text-sky-600 dark:text-sky-400">Clase II Preserv.</span>
            </div>
            <div class="bg-slate-50 dark:bg-[#0f1419] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col">
              <span class="text-[10px] font-mono text-slate-400">Coliformes Tot.</span>
              <span class="font-mono font-bold text-emerald-600 dark:text-[#00dfc1] text-sm">0 UFC/100ml</span>
              <span class="text-[9px] text-slate-400">Cero Estricto</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-300 pt-1">
            <span class="flex items-center gap-1.5"><Icon name="check" size={14} class="text-emerald-500" /> 38 Parámetros Físico-Químicos</span>
            <span class="flex items-center gap-1.5"><Icon name="check" size={14} class="text-emerald-500" /> Reportes PDF y CSV</span>
            <span class="flex items-center gap-1.5"><Icon name="check" size={14} class="text-emerald-500" /> Cálculo IRCA Automático</span>
          </div>
        </div>

        <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-white/5">
          <a
            href="/agua"
            class="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00f5d4] dark:hover:bg-[#26fedc] text-white dark:text-[#00382f] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Acceder al analizador</span>
            <Icon name="arrow-right" size={16} />
          </a>
          <span class="text-[11px] font-mono text-slate-400 text-center sm:text-right">
            Módulo listo para entrada de datos
          </span>
        </div>
      </div>

      <!-- CARD 2: MUESTREO DE SUELO (PRÓXIMAMENTE - FASE 2) -->
      <div class="lg:col-span-5 bg-white dark:bg-[#171c21] rounded-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-sm flex flex-col justify-between gap-6 relative overflow-hidden">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Icon name="construction" size={13} />
              PRÓXIMAMENTE • FASE 2
            </span>
            <span class="font-mono text-xs text-slate-400">
              EDAFOLOGÍA
            </span>
          </div>

          <div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="sprout" size={20} class="text-amber-500" />
              <span>Muestreo de Suelo</span>
            </h3>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Parámetros agrológicos, metales pesados (Plomo, Cadmio, Mercurio), hidrocarburos totales de petróleo (HTP) y criterios de recuperación de suelos degradados.
            </p>
          </div>

          <!-- Indicador de Fase Edafológica -->
          <div class="bg-slate-50 dark:bg-[#0f1419] p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-xs font-mono">
            <div class="flex justify-between items-center text-slate-700 dark:text-slate-200">
              <span>Densidad aparente & Capacidad de Intercambio (CIC)</span>
              <span class="text-amber-600 dark:text-amber-400 font-bold">En Modelado</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-[#252a30] h-2 rounded-full overflow-hidden">
              <div class="bg-amber-500 w-3/5 h-full rounded-full"></div>
            </div>
            <p class="text-[10px] text-slate-400 leading-normal">
              En etapa de calibración matemática y mapeo con directrices IGAC / MinAmbiente.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onclick={() => notificarModuloInactivo('Muestreo de Calidad de Suelos', 'sprout', 'El modelado matemático para CIC, pH de suelo y metales pesados está en proceso de calibración.')}
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252a30] hover:bg-slate-200 dark:hover:bg-[#30353b] text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold transition cursor-pointer"
          >
            Consultar estado legal
          </button>
          <span class="text-xs font-mono text-slate-400">Q2 2025</span>
        </div>
      </div>

    </div>
  </section>

  <!-- ========================================================================
       OTRAS MATRICES EN DESARROLLO (AIRE, AUDIO/RUIDO, OLORES)
       ======================================================================== -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
    <div class="space-y-1">
      <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-[#00dfc1]">
        Plan de Expansión del Simulador
      </span>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Otras Matrices en Desarrollo
        </h2>
        <span class="text-xs font-mono text-slate-500">
          Haz clic en cualquier matriz para verificar su estado de disponibilidad
        </span>
      </div>
    </div>

    <!-- 3 Column Bento Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- 1. Muestreo de Aire -->
      <button
        type="button"
        onclick={() => notificarModuloInactivo('Muestreo de Calidad de Aire', 'wind', 'Los algoritmos de cálculo para el Índice de Calidad del Aire (ICA-Aire) conforme a la Res. 2254 de 2017 están siendo integrados.')}
        class="text-left bg-white dark:bg-[#171c21] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-4 cursor-pointer group"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#252a30] text-emerald-700 dark:text-[#00dfc1]">
              Res. 2254 / 2017
            </span>
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>

          <h3 class="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
            <Icon name="wind" size={18} class="text-emerald-500" />
            <span>Muestreo de Aire</span>
          </h3>

          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Material Particulado (PM10, PM2.5), Dióxido de Azufre (SO₂), Dióxido de Nitrógeno (NO₂) y Ozono Troposférico (O₃).
          </p>

          <div class="bg-slate-50 dark:bg-[#0f1419] p-3 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5 text-xs font-mono">
            <div class="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
              <span>Calibración Algorítmica</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-bold">65%</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-[#252a30] h-1.5 rounded-full overflow-hidden">
              <div class="bg-emerald-500 w-[65%] h-full rounded-full"></div>
            </div>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-100 dark:border-white/5">
          <span>Índice ICA-Aire</span>
          <span class="text-amber-600 dark:text-amber-400 font-semibold">Próximamente...</span>
        </div>
      </button>

      <!-- 2. Muestreo de Audio / Ruido -->
      <button
        type="button"
        onclick={() => notificarModuloInactivo('Muestreo de Audio y Ruido Ambiental', 'volume', 'La evaluación de presión sonora continua equivalente (Leq dBA) según Res. 0627 de 2006 se encuentra en calibración acústica.')}
        class="text-left bg-white dark:bg-[#171c21] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-4 cursor-pointer group"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#252a30] text-emerald-700 dark:text-[#00dfc1]">
              Res. 0627 / 2006
            </span>
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>

          <h3 class="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
            <Icon name="volume" size={18} class="text-emerald-500" />
            <span>Muestreo de Audio / Ruido</span>
          </h3>

          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Presión sonora continua equivalente (Leq dBA), sonometría diurna y nocturna, curvas isófonas y mapas acústicos.
          </p>

          <div class="bg-slate-50 dark:bg-[#0f1419] p-3 rounded-xl border border-slate-200 dark:border-white/5 space-y-1 text-xs font-mono">
            <div class="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
              <span>Curva Ponderada A (dBA)</span>
              <span class="text-sky-600 dark:text-sky-400 font-bold">65 dB(A) Diurno</span>
            </div>
            <svg class="w-full h-5 text-emerald-500" width="200" height="24" fill="none" viewBox="0 0 200 24">
              <path d="M0,12 Q10,0 20,12 T40,12 T60,2 T80,22 T100,12 T120,4 T140,20 T160,12 T180,6 T200,12" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-100 dark:border-white/5">
          <span>Sectores A, B, C y D</span>
          <span class="text-amber-600 dark:text-amber-400 font-semibold">Próximamente...</span>
        </div>
      </button>

      <!-- 3. Olores y Otros Muestreos -->
      <button
        type="button"
        onclick={() => notificarModuloInactivo('Olores y Muestreos Especiales', 'cloud', 'Los límites permisibles de calidad del aire para sustancias de olores ofensivos (Res. 1541 de 2013) se encuentran en fase de documentación.')}
        class="text-left bg-white dark:bg-[#171c21] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-4 cursor-pointer group"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#252a30] text-emerald-700 dark:text-[#00dfc1]">
              Res. 1541 / 2013
            </span>
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>

          <h3 class="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
            <Icon name="cloud" size={18} class="text-emerald-500" />
            <span>Olores y Otros Muestreos</span>
          </h3>

          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Sulfuro de hidrógeno (H₂S), amoníaco total (NH₃), compuestos orgánicos volátiles (COV) y caracterización residual.
          </p>

          <div class="bg-slate-50 dark:bg-[#0f1419] p-3 rounded-xl border border-slate-200 dark:border-white/5 space-y-1 text-xs font-mono">
            <div class="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
              <span>Olfatomotría Dinámica</span>
              <span class="text-amber-600 dark:text-amber-400 font-bold">Plan 2025</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-normal">
              Niveles permisibles de inmisión para olores ofensivos.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-100 dark:border-white/5">
          <span>PRIO (Planes de Reducción)</span>
          <span class="text-amber-600 dark:text-amber-400 font-semibold">Próximamente...</span>
        </div>
      </button>

    </div>
  </section>

  <!-- ========================================================================
       DESTACADOS TÉCNICOS & MARCO INSTITUCIONAL
       ======================================================================== -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="bg-white dark:bg-[#171c21] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-2">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-[#00dfc1] mb-1">
          <Icon name="shield-check" size={20} />
        </div>
        <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Accesibilidad Universal WCAG 2.2 AAA
        </h3>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Diseñado con relaciones de contraste óptico superiores a 7:1 en fondos de alta densidad, controles de tamaño tipográfico dinámico y soporte nativo para lectores de pantalla.
        </p>
      </div>

      <div class="bg-white dark:bg-[#171c21] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-2">
        <div class="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-1">
          <Icon name="scale" size={20} />
        </div>
        <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Marco Jurídico de la República de Colombia
        </h3>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Las formulaciones matemáticas siguen las tablas oficiales expedidas por el Ministerio de Ambiente y Desarrollo Sostenible (MADS) y el Ministerio de Salud y Protección Social.
        </p>
      </div>

      <div class="bg-white dark:bg-[#171c21] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-2">
        <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
          <Icon name="academic" size={20} />
        </div>
        <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Objetivo Didáctico y Experimental
        </h3>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Entorno formativo enfocado en dotar a estudiantes de ingeniería ambiental, química y biólogos de herramientas computacionales para la toma de decisiones ecológicas informadas.
        </p>
      </div>

    </div>
  </section>

</div>

<!-- Modal Informativo Dinámico para Módulos en Desarrollo -->
<ModalAlerta
  bind:visible={modalVisible}
  titulo={moduloSeleccionado}
  mensaje="Fase en Calibración"
  icono={iconoSeleccionado}
/>
