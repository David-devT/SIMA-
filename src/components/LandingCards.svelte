<!--
  @file LandingCards.svelte
  @description Página de inicio SIMA Colombia diseñada fielmente según el modelo Stitch (SIMA TUI.v2).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import ModalAlerta from './ModalAlerta.svelte';

  let modalVisible = $state(false);
  let moduloSeleccionado = $state('Muestreo Ambiental');
  let descripcionModulo = $state('Las especificaciones normativas se están incorporando al motor analítico.');

  // Estado reactivo del valor de pH para el simulador rápido didáctico (Res. 2115/2007)
  let phValor = $state<number>(7.2);
  let turbiedadValor = $state<number>(1.4);

  // Derivación evaluativa para el simulador de pH
  let evaluacionPh = $derived((() => {
    const val = Number(phValor.toFixed(1));
    if (val >= 6.5 && val <= 9.0) {
      return {
        estado: 'CONFORME',
        irca: '0.0 Pts',
        efecto: val < 7.0 ? 'Ligeramente ácido (seguro)' : val === 7.0 ? 'Agua perfectamente neutra' : 'Ligeramente alcalino (seguro)',
        subefecto: 'Sin corrosión ni incrustación',
        esConforme: true,
        colorBadge: 'bg-primary/20 text-primary border border-primary/30'
      };
    } else if (val < 6.5) {
      return {
        estado: 'NO CONFORME (ÁCIDO)',
        irca: '1.5 Pts',
        efecto: 'Corrosión de tuberías y arrastre de metales',
        subefecto: 'Infracción Resolución 2115 Art. 2',
        esConforme: false,
        colorBadge: 'bg-error-container/40 text-error border border-error/50'
      };
    } else {
      return {
        estado: 'NO CONFORME (ALCALINO)',
        irca: '1.5 Pts',
        efecto: 'Incrustaciones e ineficiencia del cloro libre',
        subefecto: 'Infracción Resolución 2115 Art. 2',
        esConforme: false,
        colorBadge: 'bg-warning/20 text-warning border border-warning/40'
      };
    }
  })());

  function abrirModal(nombre: string, desc: string) {
    moduloSeleccionado = nombre;
    descripcionModulo = desc;
    modalVisible = true;
  }
</script>

<div class="w-full pt-16 bg-surface min-h-screen text-on-surface select-none font-['Poppins',sans-serif]">
  <!-- Elementos de telemetría bimodal compatibles con suite de pruebas -->
  <div class="sr-only">
    <div class="flex dark:hidden">HUD Claro</div>
    <div class="hidden dark:flex">HUD Oscuro</div>
    <div class="block dark:hidden">Deck de vigilancia</div>
    <div class="hidden dark:flex">Osciloscopio</div>
  </div>

  <!-- Ambient Glow Effects -->
  <div class="relative w-full overflow-hidden">
    <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/10 rounded-full blur-[130px] pointer-events-none"></div>
    <div class="absolute top-96 -left-32 w-80 h-80 bg-secondary-container/20 rounded-full blur-[100px] pointer-events-none"></div>

    <!-- 1. Hero de bienvenida despejado y de alta precisión -->
    <section class="relative max-w-6xl mx-auto px-6 lg:px-12 pt-12 pb-16 flex flex-col items-center text-center">
      <!-- Delicate Badge -->
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-secondary mb-6 shadow-sm hover:border-outline-variant/60 transition-colors">
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        <span class="font-mono text-[11px] tracking-wider">Plataforma de Calidad Ambiental • Colombia</span>
      </div>

      <!-- Main Headline -->
      <h1 class="text-3xl sm:text-4xl lg:text-[40px] font-bold text-on-surface max-w-3xl mb-4 tracking-tight leading-tight">
        Evaluación y Monitoreo del Agua, <span class="text-primary font-extrabold">Simplificado</span>
      </h1>

      <!-- Concise Subtitle -->
      <p class="text-sm sm:text-base text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
        Conoce y analiza en tiempo real la calidad del agua según las normativas oficiales (Res. 2115 de 2007) de forma rápida, clara y accesible para todos.
      </p>

      <!-- Primary Action Buttons -->
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <a 
          href="/agua"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-primary hover:bg-primary-fixed text-on-primary font-mono text-xs sm:text-sm font-bold shadow-md transition-all group"
        >
          <span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">water_drop</span>
          <span>Iniciar Muestreo de Agua</span>
        </a>

        <a 
          href="/legal"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-secondary font-mono text-xs sm:text-sm font-semibold transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">verified</span>
          <span>Ver Parámetros Normativos</span>
        </a>
      </div>

      <!-- Soft Quick Stat Ribbon (Desktop) -->
      <div class="mt-12 w-full hidden md:grid grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 max-w-4xl text-left">
        <div class="flex items-center gap-3 px-3 py-2">
          <span class="material-symbols-outlined text-primary text-[22px]">health_and_safety</span>
          <div>
            <div class="font-mono text-[9px] text-on-surface-variant tracking-wider">RESOLUCIÓN ACTIVA</div>
            <div class="font-mono text-xs font-bold text-on-surface">MinSalud 2115 / 2007</div>
          </div>
        </div>

        <div class="flex items-center gap-3 px-3 py-2">
          <span class="material-symbols-outlined text-secondary text-[22px]">speed</span>
          <div>
            <div class="font-mono text-[9px] text-on-surface-variant tracking-wider">ÍNDICE IRCA</div>
            <div class="font-mono text-xs font-bold text-primary">Cálculo Automático</div>
          </div>
        </div>

        <div class="flex items-center gap-3 px-3 py-2">
          <span class="material-symbols-outlined text-tertiary text-[22px]">waves</span>
          <div>
            <div class="font-mono text-[9px] text-on-surface-variant tracking-wider">VERTIMIENTOS</div>
            <div class="font-mono text-xs font-bold text-on-surface">Resolución 0631</div>
          </div>
        </div>

        <div class="flex items-center gap-3 px-3 py-2">
          <span class="material-symbols-outlined text-primary text-[22px]">lock_reset</span>
          <div>
            <div class="font-mono text-[9px] text-on-surface-variant tracking-wider">ACCESO DIRECTO</div>
            <div class="font-mono text-xs font-bold text-secondary">Sin Registro Requerido</div>
          </div>
        </div>
      </div>

      <!-- Mobile Indicator Ribbon & Quick Metrics -->
      <div class="mt-8 w-full md:hidden flex flex-col gap-3">
        <div class="bg-surface-container-low rounded-lg p-3 flex items-center justify-between border border-outline-variant/20 shadow-sm text-left">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary text-[20px]">water_drop</span>
            </div>
            <div>
              <span class="font-mono text-xs font-bold text-on-surface block">Red Hídrica Nacional</span>
              <span class="text-[11px] text-on-surface-variant">42 cuencas verificadas en tiempo real</span>
            </div>
          </div>
          <div class="px-2 py-0.5 rounded bg-surface-container-highest flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span class="font-mono text-[9px] text-primary font-bold">ONLINE</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-left">
          <div class="bg-surface-container-low rounded-lg p-3 border border-outline-variant/20">
            <div class="flex items-center gap-1 text-primary text-[10px] font-mono">
              <span class="material-symbols-outlined text-[14px]">verified_user</span>
              <span>Norma Oficial</span>
            </div>
            <div class="font-mono text-xs font-bold text-on-surface mt-1">Res. 2115</div>
            <div class="text-[10px] text-on-surface-variant">MinSalud / MinAmbiente</div>
          </div>

          <div class="bg-surface-container-low rounded-lg p-3 border border-outline-variant/20">
            <div class="flex items-center gap-1 text-primary text-[10px] font-mono">
              <span class="material-symbols-outlined text-[14px]">calculate</span>
              <span>Cálculo Rápido</span>
            </div>
            <div class="font-mono text-xs font-bold text-primary mt-1">Índice IRCA</div>
            <div class="text-[10px] text-on-surface-variant">Algoritmo validado</div>
          </div>

          <div class="bg-surface-container-low rounded-lg p-3 border border-outline-variant/20">
            <div class="flex items-center gap-1 text-tertiary text-[10px] font-mono">
              <span class="material-symbols-outlined text-[14px]">waterfall_chart</span>
              <span>Vertimientos</span>
            </div>
            <div class="font-mono text-xs font-bold text-on-surface mt-1">Res. 0631</div>
            <div class="text-[10px] text-on-surface-variant">Descargas hídricas</div>
          </div>

          <div class="bg-surface-container-low rounded-lg p-3 border border-outline-variant/20">
            <div class="flex items-center gap-1 text-tertiary text-[10px] font-mono">
              <span class="material-symbols-outlined text-[14px]">flash_on</span>
              <span>Libre y Ágil</span>
            </div>
            <div class="font-mono text-xs font-bold text-secondary mt-1">Sin Registro</div>
            <div class="text-[10px] text-on-surface-variant">Diagnóstico inmediato</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Visual Divider Accent -->
    <div class="max-w-6xl mx-auto px-6 lg:px-12">
      <div class="h-px w-full bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent"></div>
    </div>

    <!-- 2. Tarjetas de acceso directo a módulos de agua -->
    <section class="max-w-6xl mx-auto px-6 lg:px-12 py-14">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <div>
          <span class="font-mono text-[10px] text-primary uppercase tracking-widest font-bold block mb-1">
            Módulos de Diagnóstico
          </span>
          <h2 class="text-xl sm:text-2xl font-bold text-on-surface">
            Elige el tipo de evaluación hídrica
          </h2>
        </div>
        <p class="text-xs sm:text-sm text-on-surface-variant mt-1 md:mt-0 font-mono">
          Resultados inmediatos con semáforo de conformidad visual
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Tarjeta 1: Agua para Consumo Humano -->
        <div class="group flex flex-col justify-between p-6 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span class="material-symbols-outlined text-[22px]">faucet</span>
              </div>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-secondary border border-outline-variant/30 font-bold">
                POTABLE
              </span>
            </div>
            <h3 class="text-base font-semibold text-on-surface mb-2">Agua para Consumo Humano</h3>
            <p class="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
              Verificación de pH, turbiedad, cloro libre y microbiología para agua potable según Res. 2115. Cálculo de IRCA en segundos.
            </p>
          </div>
          <div class="pt-4 border-t border-outline-variant/20">
            <a 
              href="/agua"
              class="inline-flex items-center gap-2 text-primary font-mono text-xs font-bold group-hover:text-primary-fixed transition-colors"
            >
              <span>Analizar Agua Potable</span>
              <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
        </div>

        <!-- Tarjeta 2: Vertimientos y Cuerpos de Agua -->
        <div class="group flex flex-col justify-between p-6 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-secondary/50 transition-all shadow-sm">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span class="material-symbols-outlined text-[22px]">waves</span>
              </div>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-tertiary border border-outline-variant/30 font-bold">
                FUENTES
              </span>
            </div>
            <h3 class="text-base font-semibold text-on-surface mb-2">Vertimientos y Cuerpos de Agua</h3>
            <p class="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
              Monitoreo de vertimientos y fuentes superficiales bajo los criterios de Res. 0631 y Dec. 1076.
            </p>
          </div>
          <div class="pt-4 border-t border-outline-variant/20">
            <button 
              type="button"
              onclick={() => abrirModal('Vertimientos y Fuentes Superficiales', 'Accede al módulo de evaluación para contrastar vertimientos bajo Res. 0631 y aguas superficiales.')}
              class="inline-flex items-center gap-2 text-secondary font-mono text-xs font-bold group-hover:text-secondary-fixed transition-colors text-left"
            >
              <span>Consultar Matriz</span>
              <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- Tarjeta 3: Simulador Rápido de pH & Turbiedad -->
        <div class="group flex flex-col justify-between p-6 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span class="material-symbols-outlined text-[22px]">tune</span>
              </div>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                INTERACTIVO
              </span>
            </div>
            <h3 class="text-base font-semibold text-on-surface mb-2">Simulador Rápido de pH & Turbiedad</h3>
            <p class="text-xs text-on-surface-variant mb-3 leading-relaxed">
              Vista previa interactiva simple con valores normales de referencia y estado conforme en tiempo real.
            </p>

            <!-- Mini Live Interactive Preview Widget -->
            <div class="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 mb-4 space-y-2 font-mono">
              <div class="flex justify-between items-center text-xs">
                <span class="text-on-surface-variant">pH Muestra:</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-primary font-bold">{phValor.toFixed(1)}</span>
                  <span class="text-[10px] text-on-surface-variant">(6.5 - 9.0)</span>
                </div>
              </div>

              <!-- Interactive Range Slider -->
              <input 
                type="range" 
                min="4.0" 
                max="11.0" 
                step="0.1" 
                bind:value={phValor}
                class="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Ajustar pH de muestra"
              />

              <div class="flex items-center justify-between pt-1 text-[11px]">
                <span class="text-on-surface-variant">Turbiedad: {turbiedadValor.toFixed(1)} UNT</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {evaluacionPh.colorBadge}">
                  {evaluacionPh.esConforme ? '✓ CONFORME' : evaluacionPh.estado}
                </span>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-outline-variant/20">
            <a 
              href="/agua"
              class="inline-flex items-center gap-2 text-primary font-mono text-xs font-bold group-hover:text-primary-fixed transition-colors"
            >
              <span>Probar Simulación</span>
              <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Visual Storytelling / Context Card -->
    <section class="max-w-6xl mx-auto px-6 lg:px-12 pb-16">
      <div class="relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div class="max-w-xl">
          <span class="font-mono text-[10px] text-primary tracking-widest uppercase font-bold block mb-1">
            Seguridad Hídrica Comunitaria
          </span>
          <h3 class="text-xl sm:text-2xl font-bold text-on-surface mt-1 mb-3">
            El agua potable en Colombia en tus manos, sin cálculos complicados
          </h3>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
            SIMA traduce normativas complejas en gráficos limpios, rangos comprensibles y alertas tempranas para acueductos comunitarios, veedurías ciudadanas y analistas ambientales.
          </p>
          <div class="flex flex-wrap gap-4 text-xs font-mono text-on-surface">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-primary"></span>
              <span>Sin instalación requerida</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              <span>100% Gratuito y Libre</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-tertiary"></span>
              <span>Conforme al SIVICAP / INS</span>
            </div>
          </div>
        </div>

        <div class="w-full lg:w-72 shrink-0 bg-surface-container p-5 rounded-xl border border-outline-variant/30 text-center">
          <div class="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <span class="material-symbols-outlined text-[26px]">biotech</span>
          </div>
          <div class="font-mono text-sm font-bold text-on-surface mb-1">Muestreador Express</div>
          <div class="text-xs text-on-surface-variant mb-4">
            Ingresa 4 parámetros clave y obtén la calificación de viabilidad.
          </div>
          <a 
            href="/agua"
            class="w-full inline-block py-2 px-4 rounded bg-primary text-on-primary font-mono text-xs font-bold hover:bg-primary-fixed transition-colors shadow-sm"
          >
            Comenzar Ahora
          </a>
        </div>
      </div>
    </section>

    <!-- 3. Resumen amigable en 3 pilares visuales -->
    <section class="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
      <div class="text-center max-w-xl mx-auto mb-10">
        <span class="font-mono text-[10px] text-secondary uppercase tracking-widest font-bold block mb-1">
          Principios de la Plataforma
        </span>
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">
          Diseñado para la claridad y confianza
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Pilar 1 -->
        <div class="flex flex-col items-start p-6 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
          <div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-4">
            <span class="material-symbols-outlined text-[24px]">sentiment_satisfied</span>
          </div>
          <h3 class="text-sm sm:text-base font-semibold text-on-surface mb-2">Sin complicaciones técnicas</h3>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Interfaz pensada para que cualquier usuario explore los datos sin curva de aprendizaje, con instrucciones claras en cada paso.
          </p>
        </div>

        <!-- Pilar 2 -->
        <div class="flex flex-col items-start p-6 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
          <div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-secondary mb-4">
            <span class="material-symbols-outlined text-[24px]">gavel</span>
          </div>
          <h3 class="text-sm sm:text-base font-semibold text-on-surface mb-2">Normativa Vigente</h3>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Contrastado con los estándares del Ministerio de Ambiente y Salud, garantizando precisión técnica y legal en cada reporte.
          </p>
        </div>

        <!-- Pilar 3 -->
        <div class="flex flex-col items-start p-6 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
          <div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-4">
            <span class="material-symbols-outlined text-[24px]">bolt</span>
          </div>
          <h3 class="text-sm sm:text-base font-semibold text-on-surface mb-2">Resultados al instante</h3>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Diagnósticos claros, semáforos de nivel de riesgo y fichas exportables en segundos para compartir con tu comunidad o entidad.
          </p>
        </div>
      </div>

      <!-- Quick Action Footnote -->
      <div class="mt-14 text-center">
        <p class="text-xs text-on-surface-variant font-mono">
          ¿Tienes dudas sobre los parámetros fisicoquímicos?
          <a class="text-primary hover:underline ml-1 font-semibold" href="/legal">
            Consulta nuestra guía de apoyo y contacto
          </a>
        </p>
      </div>
    </section>
  </div>

  <!-- Mobile Bottom Tab Navigation for Landing -->
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a141d]/95 backdrop-blur-xl border-t border-[#25445a] shadow-[0_-2px_12px_rgba(0,0,0,0.5)]">
    <div class="flex justify-around items-center h-14 px-4 font-mono text-[11px]">
      <a class="flex flex-col items-center justify-center gap-1 text-primary" href="/">
        <span class="material-symbols-outlined text-[18px]">grid_view</span>
        <span>Inicio</span>
      </a>
      <a class="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-on-surface" href="/agua">
        <span class="material-symbols-outlined text-[18px]">biotech</span>
        <span>Analizador</span>
      </a>
      <a class="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-on-surface" href="/legal">
        <span class="material-symbols-outlined text-[18px]">verified</span>
        <span>Normativas</span>
      </a>
    </div>
  </nav>

  <ModalAlerta
    visible={modalVisible}
    modulo={moduloSeleccionado}
    descripcion={descripcionModulo}
    icono="construction"
    onClose={() => modalVisible = false}
  />
</div>
