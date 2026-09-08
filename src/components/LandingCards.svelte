<!--
  @file LandingCards.svelte
  @description Componente interactivo de landing que presenta el catálogo de matrices ambientales.
  
  Patrones y Arquitectura:
  - Islands Architecture: Isla interactiva de Svelte montada de forma aislada sobre Astro SSG.
  - Event-Driven Navigation: La card de Agua realiza navegación dura a `/agua`, mientras que
    las matrices en desarrollo disparan el modal reactivo sin recargar la página.
  - Minimal UI / Noise Reduction: Estructura dominada por negros profundos, bordes sutiles y
    acentos cromáticos limitados exclusivamente a verde esmeralda y azul técnico.
-->
<script lang="ts">
  import ModalAlerta from './ModalAlerta.svelte';

  // Svelte 5 reactive state para control del modal
  let modalVisible = $state(false);
  let moduloSeleccionado = $state('Muestreo Ambiental');
  let iconoSeleccionado = $state('🚧');

  /**
   * Manejador de eventos para matrices no habilitadas
   * @param nombre Etiqueta descriptiva del módulo
   * @param icono Emoji identificador
   */
  function notificarModuloInactivo(nombre: string, icono: string): void {
    moduloSeleccionado = nombre;
    iconoSeleccionado = icono;
    modalVisible = true;
  }
</script>

<div class="space-y-10">
  <!-- Hero Section Sobrio -->
  <div class="max-w-3xl space-y-3">
    <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-950/40 border border-blue-500/20 text-blue-400 text-xs font-mono">
      <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
      Proyecto de Práctica Personal • Fines Educativos y de Aprendizaje
    </div>
    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
      Simulador de Calidad Ambiental
    </h1>
    <p class="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
      Herramienta de estudio y práctica desarrollada de forma independiente para simular la evaluación de parámetros físico-químicos frente a las resoluciones ambientales de Colombia (Res. 2115/2007, Res. 0631/2015 y Dec. 1076/2015).
    </p>
  </div>

  <!-- Matrices Principales (Grid Primario) -->
  <div class="space-y-3">
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
      <h2 class="text-xs font-mono uppercase tracking-wider text-slate-400">
        Matrices Principales de Muestreo
      </h2>
      <span class="text-xs font-mono text-emerald-400">1 Activa</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 1. Muestreo de Agua (ACTIVA - Enlace a /agua) -->
      <a
        href="/agua"
        class="card-minimal rounded-xl p-6 relative group hover:border-emerald-500/40 block focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400">
            💧
          </div>
          <span class="px-2.5 py-0.5 rounded text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
            Disponible
          </span>
        </div>

        <h3 class="text-lg font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors flex items-center gap-2">
          Muestreo de Calidad de Agua
          <span class="text-emerald-400 text-xs group-hover:translate-x-1 transition-transform">→</span>
        </h3>

        <p class="text-xs text-slate-400 leading-relaxed mb-5">
          Agua Potable, Residual Doméstica (ARD), Residual No Doméstica (ARnD) y Cuerpos Superficiales conforme a Res. 2115/2007, Res. 0631/2015 y Dec. 1076/2015.
        </p>

        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
          <span>5 Normas Reglamentadas</span>
          <span class="text-emerald-400 font-semibold">Acceder al analizador</span>
        </div>
      </a>

      <!-- 2. Muestreo de Suelo (INACTIVA - Dispara Modal) -->
      <button
        type="button"
        onclick={() => notificarModuloInactivo('Muestreo de Calidad de Suelos', '🌱')}
        class="card-minimal rounded-xl p-6 text-left w-full cursor-pointer hover:border-blue-500/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-lg bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400">
            🌱
          </div>
          <span class="px-2.5 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-zinc-900 border border-white/10">
            Próximamente
          </span>
        </div>

        <h3 class="text-lg font-bold text-white mb-1.5">
          Muestreo de Suelo
        </h3>

        <p class="text-xs text-slate-400 leading-relaxed mb-5">
          Parámetros agrológicos, metales pesados, hidrocarburos totales (HTP) y criterios de recuperación de suelos degradados.
        </p>

        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-500">
          <span>En etapa de integración legal</span>
          <span class="text-blue-400">Consultar estado</span>
        </div>
      </button>
    </div>
  </div>

  <!-- Matrices Secundarias (Aire, Audio y Otros) -->
  <div class="space-y-3">
    <div class="border-b border-white/[0.06] pb-2">
      <h2 class="text-xs font-mono uppercase tracking-wider text-slate-400">
        Otras Matrices en Desarrollo
      </h2>
      <p class="text-[11px] text-slate-500">Haz clic en cualquier matriz para verificar su estado de disponibilidad</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Aire -->
      <button
        type="button"
        onclick={() => notificarModuloInactivo('Muestreo de Aire (Res. 2254 de 2017)', '💨')}
        class="card-minimal rounded-xl p-4 text-left cursor-pointer hover:border-blue-500/30"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg">💨</span>
          <span class="text-[10px] font-mono text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded">
            Res. 2254/2017
          </span>
        </div>
        <h4 class="font-bold text-sm text-slate-200 mb-1">Muestreo de Aire</h4>
        <p class="text-[11px] text-slate-400 leading-normal mb-2">
          Material Particulado PM10, PM2.5, SO2, NO2 y Ozono.
        </p>
        <span class="text-[10px] font-mono text-slate-500">Próximamente...</span>
      </button>

      <!-- Audio / Ruido -->
      <button
        type="button"
        onclick={() => notificarModuloInactivo('Muestreo de Audio y Ruido Ambiental (Res. 0627 de 2006)', '🔊')}
        class="card-minimal rounded-xl p-4 text-left cursor-pointer hover:border-blue-500/30"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg">🔊</span>
          <span class="text-[10px] font-mono text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded">
            Res. 0627/2006
          </span>
        </div>
        <h4 class="font-bold text-sm text-slate-200 mb-1">Muestreo de Audio / Ruido</h4>
        <p class="text-[11px] text-slate-400 leading-normal mb-2">
          Presión sonora continua (Leq dBA), sonometría diurna y nocturna.
        </p>
        <span class="text-[10px] font-mono text-slate-500">Próximamente...</span>
      </button>

      <!-- Otros Muestreos -->
      <button
        type="button"
        onclick={() => notificarModuloInactivo('Otras Matrices: Olores Ofensivos y Residuos Especiales', '🔬')}
        class="card-minimal rounded-xl p-4 text-left cursor-pointer hover:border-blue-500/30"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg">🔬</span>
          <span class="text-[10px] font-mono text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded">
            Res. 1541/2013
          </span>
        </div>
        <h4 class="font-bold text-sm text-slate-200 mb-1">Olores y Otros Muestreos</h4>
        <p class="text-[11px] text-slate-400 leading-normal mb-2">
          Sulfuro de hidrógeno, amoníaco y caracterización residual.
        </p>
        <span class="text-[10px] font-mono text-slate-500">Próximamente...</span>
      </button>
    </div>
  </div>
</div>

<!-- Modal Dialog Instance -->
<ModalAlerta 
  bind:visible={modalVisible} 
  titulo={moduloSeleccionado}
  mensaje="Próximamente..."
  icono={iconoSeleccionado}
/>
