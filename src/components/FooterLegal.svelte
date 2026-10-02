<!--
  @file FooterLegal.svelte
  @description Pie de página institucional rediseñado con soporte completo para modo claro y oscuro,
  indicadores de telemetría, desglose de marcos normativos y modal interactivo de aviso legal.
-->
<script lang="ts">
  import ModalLegal from './ModalLegal.svelte';
  import Icon from './icons/Icon.svelte';

  let modalVisible = $state(false);

  function abrirModalLegal(): void {
    modalVisible = true;
  }
</script>

<footer class="w-full mt-auto bg-slate-100 dark:bg-[#0a0f14] text-slate-600 dark:text-[#aebac7] border-t border-slate-200 dark:border-white/[0.08] py-10 transition-colors duration-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
    
    <!-- Top Row: Identidad Institucional & Estado de Telemetría -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2.5">
          <img src="/logo.png" alt="SIMA" width="24" height="24" class="w-6 h-6 object-contain rounded-md" />
          <span class="font-bold text-base text-slate-900 dark:text-white">SIMA Colombia</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-[#1b2025] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10">
            v2.4-ECO
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Plataforma empírica de modelado hidrológico y edafológico para ecosistemas andinos y cuencas hidrográficas nacionales. Entorno instrumental orientado a la formación técnica e investigación ambiental.
        </p>
      </div>

      <!-- Indicador de Nodo IDEAM API -->
      <div class="flex items-center gap-3 text-xs font-mono bg-white dark:bg-[#171c21] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-slate-800 dark:text-slate-200 font-medium">Nodo Bogotá IDEAM API: ACTIVO</span>
        </div>
        <span class="text-slate-300 dark:text-slate-600">|</span>
        <div class="flex items-center gap-1">
          <span class="text-slate-400">Latencia:</span>
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">18ms</span>
        </div>
      </div>
    </div>

    <!-- Middle Grid: Columnas de Referencia Normativa -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      <div class="flex flex-col gap-1.5 bg-white dark:bg-[#171c21] p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm">
        <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-[#00dfc1] font-bold">
          Marco Normativo Hídrico
        </span>
        <span class="font-semibold text-slate-900 dark:text-white text-sm">
          Resolución 2115 / 2007
        </span>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Características, instrumentos y frecuencias del sistema de control y vigilancia para la calidad del agua de consumo humano (IRCA).
        </p>
      </div>

      <div class="flex flex-col gap-1.5 bg-white dark:bg-[#171c21] p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm">
        <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-[#00dfc1] font-bold">
          Vertimientos Puntuales
        </span>
        <span class="font-semibold text-slate-900 dark:text-white text-sm">
          Resolución 0631 / 2015
        </span>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Parámetros y valores límites máximos permisibles en vertimientos puntuales a cuerpos de aguas superficiales y alcantarillado.
        </p>
      </div>

      <div class="flex flex-col gap-1.5 bg-white dark:bg-[#171c21] p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm">
        <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-[#00dfc1] font-bold">
          Decreto Único Ambiental
        </span>
        <span class="font-semibold text-slate-900 dark:text-white text-sm">
          Decreto 1076 / 2015
        </span>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Reglamentario del Sector Ambiente y Desarrollo Sostenible para preservación de cuencas, páramos y zonificación de suelo.
        </p>
      </div>
    </div>

    <!-- Bottom Row: Copyright, Conformidad y Botón de Licencia Legal -->
    <div class="pt-2 border-t border-slate-200 dark:border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] font-mono">
      <p class="text-slate-500 dark:text-slate-400 text-center md:text-left">
        © 2024–2026 SIMA Colombia — Simulador Científico de Calidad Ambiental. Fines pedagógicos y modelado académico.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
        <span class="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Icon name="check-circle" size={13} />
          Conformidad WCAG 2.1 AA
        </span>
        <span class="hidden sm:inline">•</span>
        <span>NTC 5854: Triple A Parcial</span>
        <span class="hidden sm:inline">•</span>
        <button
          type="button"
          onclick={abrirModalLegal}
          class="text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold underline underline-offset-4 decoration-slate-300 dark:decoration-white/20 transition cursor-pointer"
        >
          Aviso Legal & Licencia ↗
        </button>
      </div>
    </div>

  </div>
</footer>

<!-- Modal Legal Interactivo -->
<ModalLegal bind:visible={modalVisible} />
