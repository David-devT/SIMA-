<!--
  @file EvaluadorAgua.svelte
  @description Módulo interactivo de análisis y evaluación en tiempo real de calidad de agua.
  
  Arquitectura & Decisiones de Ingeniería:
  - Svelte 5 Runes ($state, $derived): Reemplazo de reactividad basada en Virtual DOM por señales
    directas (signals/fine-grained reactivity). Cero overhead de diffing al actualizar mediciones.
  - Baseline Preset Isolation (UX Optimization): Al cargar o conmutar una norma legal, se activan
    exclusivamente 5 o 6 parámetros fundamentales (e.g. pH, Turbiedad, Cloro libre, E. coli),
    minimizando el ruido cognitivo. Los parámetros restantes permanecen desmarcados en el sidebar.
  - O(1) Lookup Strategy: Uso de estructuras planas Record<string, boolean> y Record<string, number>
    para indexación directa de valores sin escaneos secuenciales de arrays.
  - SSR Hydration Safety: Inicialización unificada de estado para garantizar consistencia entre
    el pre-render de servidor (SSR) y la hidratación en cliente sin layout shifts (FOUC).
  - Minimalist Palette: Negro puro (#030712), Azul técnico (#0284c7) y Verde esmeralda (#10b981).
-->
<script lang="ts">
  import {
    type TipoNorma,
    type DefinicionParametro,
    type ResultadoEvaluacion,
    MATRIZ_PARAMETROS_AGUA_COLOMBIA,
    INFORMACION_NORMAS_AGUA,
    PARAMETROS_BASELINE_DEFAULT,
    evaluarParametro,
    obtenerParametrosPorTipo
  } from '../data/normativaAgua';
  import Icon from './icons/Icon.svelte';

  // Colección inmutable de tipos de norma según orden normativo
  const TIPOS_NORMAS: TipoNorma[] = [
    'AGUA_POTABLE',
    'AGUA_RESIDUAL_DOMESTICA',
    'AGUA_RESIDUAL_NO_DOMESTICA',
    'AGUA_SUPERFICIAL_PRESERVACION',
    'AGUA_SUPERFICIAL_CONSUMO'
  ];

  /**
   * Factory function para inicialización de estado determinista (SSR & Client Safe).
   * Activa ÚNICAMENTE los 5 o 6 parámetros base (PARAMETROS_BASELINE_DEFAULT).
   */
  function generarEstadoInicial(tipo: TipoNorma) {
    const paramsDisponibles = obtenerParametrosPorTipo(tipo);
    const baselineIds = new Set(PARAMETROS_BASELINE_DEFAULT[tipo] || []);
    const seleccionados: Record<string, boolean> = {};
    const valores: Record<string, number> = {};

    paramsDisponibles.forEach(param => {
      // Activa ÚNICAMENTE los parámetros que pertenezcan al baseline reglamentario
      const esBaseline = baselineIds.has(param.id);
      seleccionados[param.id] = esBaseline;

      // Asigna valor representativo dentro de rango para feedback inmediato
      if (param.rango.operador === 'ENTRE' && param.rango.min !== undefined && param.rango.max !== undefined) {
        valores[param.id] = Number(((param.rango.min + param.rango.max) / 2).toFixed(2));
      } else if (param.rango.operador === 'MENOR_IGUAL' && param.rango.max !== undefined) {
        valores[param.id] = Number((param.rango.max * 0.5).toFixed(2));
      } else if (param.rango.operador === 'MAYOR_IGUAL' && param.rango.min !== undefined) {
        valores[param.id] = Number((param.rango.min * 1.3).toFixed(2));
      } else if (param.rango.operador === 'CERO_ESTRICTO') {
        valores[param.id] = 0;
      }
    });

    return { seleccionados, valores };
  }

  // Estado inicial congelado para primer ciclo de render
  const estadoInicial = generarEstadoInicial('AGUA_POTABLE');

  // ==========================================================================
  // Svelte 5 Runes - Estado Reactivo Primario
  // ==========================================================================
  let tipoSeleccionado = $state<TipoNorma>('AGUA_POTABLE');
  let categoriaFiltro = $state<string>('TODAS');
  let busquedaQuery = $state<string>('');
  let sidebarAbiertoMobile = $state<boolean>(false);
  let menuNormasAbierto = $state<boolean>(false);

  // Diccionario reactivo de selección on/off por ID de parámetro
  let seleccionados = $state<Record<string, boolean>>(estadoInicial.seleccionados);

  // Registro de valores cuantitativos ingresados por el usuario
  let valoresIngresados = $state<Record<string, number>>(estadoInicial.valores);

  // ==========================================================================
  // Derivaciones Reactivas ($derived) - Memoized Selectors
  // ==========================================================================
  
  // Lista total de parámetros que aplican a la norma activa
  let parametrosDisponibles = $derived(obtenerParametrosPorTipo(tipoSeleccionado));

  // Metadatos institucionales de la norma activa
  let normaActiva = $derived(INFORMACION_NORMAS_AGUA[tipoSeleccionado]);

  // Total de parámetros activos seleccionados por el usuario
  let cantidadSeleccionados = $derived(
    parametrosDisponibles.filter(p => seleccionados[p.id]).length
  );

  // Categorías únicas presentes en la norma activa para el dropdown selector
  let categoriasDisponibles = $derived([
    'TODAS',
    ...Array.from(new Set(parametrosDisponibles.map(p => p.categoria)))
  ]);

  // Parámetros visibles en el lateral izquierdo según categoría y búsqueda
  let parametrosSidebar = $derived(
    parametrosDisponibles.filter(param => {
      const matchCat = categoriaFiltro === 'TODAS' || param.categoria === categoriaFiltro;
      const matchText = busquedaQuery.trim() === '' || 
        param.nombre.toLowerCase().includes(busquedaQuery.toLowerCase()) ||
        param.id.toLowerCase().includes(busquedaQuery.toLowerCase());
      return matchCat && matchText;
    })
  );

  // Subconjunto de parámetros seleccionados que se renderizan en el panel central
  let parametrosActivosCentral = $derived(
    parametrosDisponibles.filter(param => seleccionados[param.id])
  );

  // Pipeline de evaluación matemática en tiempo real para los parámetros activos
  let evaluaciones = $derived<Record<string, ResultadoEvaluacion | null>>((() => {
    const mapa: Record<string, ResultadoEvaluacion | null> = {};
    for (const param of parametrosActivosCentral) {
      const valor = valoresIngresados[param.id];
      if (valor !== undefined && !isNaN(valor)) {
        try {
          mapa[param.id] = evaluarParametro(param.id, valor);
        } catch {
          mapa[param.id] = null;
        }
      } else {
        mapa[param.id] = null;
      }
    }
    return mapa;
  })());

  // Métricas agregadas de conformidad para el status bar
  let metricas = $derived((() => {
    let total = parametrosActivosCentral.length;
    let conformes = 0;
    let alertas = 0;
    let noConformes = 0;

    for (const p of parametrosActivosCentral) {
      const evalRes = evaluaciones[p.id];
      if (evalRes) {
        if (evalRes.estado === 'CUMPLE') conformes++;
        else if (evalRes.estado === 'ALERTA_PREVENTIVA') alertas++;
        else if (evalRes.estado === 'NO_CUMPLE') noConformes++;
      }
    }

    const porcentaje = total > 0 ? Math.round(((conformes + alertas * 0.5) / total) * 100) : 0;
    return { total, conformes, alertas, noConformes, porcentaje };
  })());

  // ==========================================================================
  // Acciones e Interacciones de Usuario (Action Handlers)
  // ==========================================================================

  /**
   * Conmuta la norma técnica activa y reinicia la selección a los 5 o 6 parámetros baseline
   */
  function cambiarNorma(tipo: TipoNorma): void {
    tipoSeleccionado = tipo;
    const nuevo = generarEstadoInicial(tipo);
    seleccionados = nuevo.seleccionados;
    valoresIngresados = nuevo.valores;
    categoriaFiltro = 'TODAS';
    busquedaQuery = '';
  }

  /**
   * Conmuta el estado de selección individual de un parámetro
   */
  function alternarParametro(id: string): void {
    seleccionados[id] = !seleccionados[id];
  }

  /**
   * Restablece la selección exclusivamente a los 5 o 6 parámetros baseline
   */
  function restablecerABasicos(): void {
    const baselineIds = new Set(PARAMETROS_BASELINE_DEFAULT[tipoSeleccionado] || []);
    const nuevo: Record<string, boolean> = {};
    for (const p of parametrosDisponibles) {
      nuevo[p.id] = baselineIds.has(p.id);
    }
    seleccionados = nuevo;
  }

  /**
   * Activa todos los parámetros de la matriz
   */
  function seleccionarTodos(): void {
    const nuevo: Record<string, boolean> = {};
    for (const p of parametrosDisponibles) {
      nuevo[p.id] = true;
    }
    seleccionados = nuevo;
  }

  /**
   * Desactiva todos los parámetros
   */
  function deseleccionarTodos(): void {
    const nuevo: Record<string, boolean> = {};
    for (const p of parametrosDisponibles) {
      nuevo[p.id] = false;
    }
    seleccionados = nuevo;
  }

  /**
   * Simulación: valores óptimos que cumplen la norma
   */
  function simularCumplimiento(): void {
    const nuevos = { ...valoresIngresados };
    parametrosDisponibles.forEach(p => {
      if (p.rango.operador === 'ENTRE' && p.rango.min !== undefined && p.rango.max !== undefined) {
        nuevos[p.id] = Number(((p.rango.min + p.rango.max) / 2).toFixed(2));
      } else if (p.rango.operador === 'MENOR_IGUAL' && p.rango.max !== undefined) {
        nuevos[p.id] = Number((p.rango.max * 0.4).toFixed(2));
      } else if (p.rango.operador === 'MAYOR_IGUAL' && p.rango.min !== undefined) {
        nuevos[p.id] = Number((p.rango.min * 1.25).toFixed(2));
      } else if (p.rango.operador === 'CERO_ESTRICTO') {
        nuevos[p.id] = 0;
      }
    });
    valoresIngresados = nuevos;
  }

  /**
   * Simulación: valores en umbral de alerta preventiva
   */
  function simularAlerta(): void {
    const nuevos = { ...valoresIngresados };
    parametrosDisponibles.forEach(p => {
      if (p.rango.operador === 'ENTRE' && p.rango.max !== undefined) {
        nuevos[p.id] = Number((p.rango.max * 0.95).toFixed(2));
      } else if (p.rango.operador === 'MENOR_IGUAL' && p.rango.max !== undefined) {
        nuevos[p.id] = Number((p.rango.max * 0.9).toFixed(2));
      } else if (p.rango.operador === 'MAYOR_IGUAL' && p.rango.min !== undefined) {
        nuevos[p.id] = Number((p.rango.min * 1.05).toFixed(2));
      }
    });
    valoresIngresados = nuevos;
  }

  /**
   * Simulación: valores que incumplen la norma
   */
  function simularIncumplimiento(): void {
    const nuevos = { ...valoresIngresados };
    parametrosDisponibles.forEach(p => {
      if (p.rango.operador === 'ENTRE' && p.rango.max !== undefined) {
        nuevos[p.id] = Number((p.rango.max * 1.35).toFixed(2));
      } else if (p.rango.operador === 'MENOR_IGUAL' && p.rango.max !== undefined) {
        nuevos[p.id] = Number((p.rango.max * 1.5).toFixed(2));
      } else if (p.rango.operador === 'MAYOR_IGUAL' && p.rango.min !== undefined) {
        nuevos[p.id] = Number((p.rango.min * 0.5).toFixed(2));
      } else if (p.rango.operador === 'CERO_ESTRICTO') {
        nuevos[p.id] = 15;
      }
    });
    valoresIngresados = nuevos;
  }

  /**
   * Formateador de texto legible para el rango legal
   */
  function formatoRango(p: DefinicionParametro): string {
    const { operador, min, max, unidad } = p.rango;
    if (operador === 'ENTRE') return `${min} a ${max} ${unidad}`;
    if (operador === 'MENOR_IGUAL') return `≤ ${max} ${unidad}`;
    if (operador === 'MAYOR_IGUAL') return `≥ ${min} ${unidad}`;
    return `0 ${unidad}`;
  }

  /**
   * Determina el delta de incremento (step) proporcional a la escala analítica del parámetro
   */
  function determinarStep(param: DefinicionParametro): number {
    if (param.categoria === 'MICROBIOLOGICO') return 1;
    const max = param.rango.max ?? param.rango.min ?? 10;
    if (max <= 0.005) return 0.0005;
    if (max <= 0.05) return 0.005;
    if (max <= 1) return 0.01;
    if (max <= 10) return 0.1;
    if (max <= 50) return 0.5;
    return 1;
  }

  /**
   * Incrementa el valor cuantitativo con precisión aritmética controlada (evita floating-point drift)
   */
  function incrementarValor(param: DefinicionParametro): void {
    const step = determinarStep(param);
    const actual = Number(valoresIngresados[param.id] ?? 0);
    const precision = step < 0.01 ? 4 : step < 0.1 ? 3 : step < 1 ? 2 : 1;
    valoresIngresados[param.id] = Number((actual + step).toFixed(precision));
  }

  /**
   * Decrementa el valor cuantitativo con límite inferior en cero
   */
  function decrementarValor(param: DefinicionParametro): void {
    const step = determinarStep(param);
    const actual = Number(valoresIngresados[param.id] ?? 0);
    const precision = step < 0.01 ? 4 : step < 0.1 ? 3 : step < 1 ? 2 : 1;
    const nuevo = Math.max(0, actual - step);
    valoresIngresados[param.id] = Number(nuevo.toFixed(precision));
  }
</script>

<div class="space-y-6">
  <!-- Encabezado y Breadcrumb -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
    <div>
      <div class="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
        <a href="/" class="text-blue-400 hover:underline">Matrices</a>
        <span>/</span>
        <span class="text-slate-300">Calidad de Agua</span>
      </div>
      <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
        Analizador Normativo de Agua (Colombia)
      </h1>
    </div>

    <!-- Acciones de Prueba Rápida con Touch Targets Ergonómicos (min 40px) -->
    <div class="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto">
      <button
        type="button"
        onclick={simularCumplimiento}
        class="min-h-[40px] sm:min-h-[32px] px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
        title="Simular escenario de cumplimiento general"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>Conforme</span>
      </button>
      <button
        type="button"
        onclick={simularAlerta}
        class="min-h-[40px] sm:min-h-[32px] px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/30 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
        title="Simular escenario de alerta preventiva"
      >
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>Alerta</span>
      </button>
      <button
        type="button"
        onclick={simularIncumplimiento}
        class="min-h-[40px] sm:min-h-[32px] px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
        title="Simular escenario de incumplimiento normativo"
      >
        <span class="w-2 h-2 rounded-full bg-rose-400"></span>
        <span class="truncate">No Conforme</span>
      </button>
    </div>
  </div>

  <!-- BANNER COMPACTO DE LA NORMA ACTIVA CON SELECTOR DESPLEGABLE -->
  <div class="space-y-3">
    <div class="p-3.5 sm:p-4 rounded-xl bg-[#080e1a] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <!-- Info de la Norma Actual -->
      <div class="flex items-start sm:items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Icon name={normaActiva.icono} size={20} />
        </div>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wide">
              {normaActiva.norma}
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-slate-400 border border-white/[0.06]">
              {(PARAMETROS_BASELINE_DEFAULT[tipoSeleccionado] || []).length} parámetros base
            </span>
          </div>
          <h2 class="text-sm sm:text-base font-bold text-white tracking-tight truncate mt-0.5">
            {normaActiva.titulo}
          </h2>
          <p class="hidden md:block text-[11px] text-slate-400 truncate max-w-xl">
            {normaActiva.descripcion}
          </p>
        </div>
      </div>

      <!-- Acciones: Botón Desplegar Menú de Normas + Status de Conformidad -->
      <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
        <!-- Botón para desplegar / ocultar el menú de las 5 normas -->
        <button
          type="button"
          onclick={() => menuNormasAbierto = !menuNormasAbierto}
          class="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border {menuNormasAbierto ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' : 'border-white/10'} transition flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          aria-expanded={menuNormasAbierto}
        >
          <Icon name={menuNormasAbierto ? 'x' : 'sliders'} size={14} class={menuNormasAbierto ? 'text-emerald-400' : 'text-slate-400'} />
          <span>{menuNormasAbierto ? 'Cerrar Menú' : 'Desplegar Menú'}</span>
          <span class="text-xs transition-transform duration-200 {menuNormasAbierto ? 'rotate-180 text-emerald-400' : 'text-slate-500'}">▾</span>
        </button>

        <!-- Conteo de Cumplimiento -->
        <div class="flex items-center gap-3 bg-[#030712] px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs font-mono">
          <div>
            <span class="text-slate-400 block text-[9px] uppercase tracking-wider">Conformidad</span>
            <span class="text-xs sm:text-sm font-bold text-white">{metricas.porcentaje}%</span>
          </div>
          <div class="h-5 w-px bg-white/10"></div>
          <div class="flex items-center gap-2 text-[11px]">
            <span class="text-emerald-400 font-bold" title="Cumple">{metricas.conformes} C</span>
            <span class="text-amber-400 font-bold" title="Alerta">{metricas.alertas} A</span>
            <span class="text-rose-400 font-bold" title="No Cumple">{metricas.noConformes} NC</span>
          </div>
        </div>
      </div>
    </div>

    <!-- EL MENÚ DESPLEGABLE CON LAS 5 NORMAS (SOLO VISIBLE CUANDO SE DESPLIEGA) -->
    {#if menuNormasAbierto}
      <div class="p-4 rounded-xl bg-[#060a14] border border-emerald-500/40 shadow-2xl space-y-3 transition-all duration-200">
        <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-mono uppercase tracking-wider text-white font-bold">
              Selecciona la Matriz Normativa
            </span>
          </div>
          <span class="text-[11px] font-mono text-slate-500">
            Haz clic en una opción para cargar sus parámetros
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {#each TIPOS_NORMAS as tipo}
            {@const info = INFORMACION_NORMAS_AGUA[tipo]}
            {@const esActiva = tipoSeleccionado === tipo}
            {@const baselineCount = (PARAMETROS_BASELINE_DEFAULT[tipo] || []).length}

            <button
              type="button"
              onclick={() => { cambiarNorma(tipo); menuNormasAbierto = false; }}
              class="p-3.5 rounded-xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between border {esActiva ? 'bg-[#0f172a] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20' : 'bg-[#030712] border-white/[0.06] hover:bg-[#0b1222] hover:border-white/15'}"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center {esActiva ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900/80 text-slate-400 border border-white/[0.06]'}">
                  <Icon name={info.icono} size={18} />
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded {esActiva ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-slate-400 border border-white/[0.06]'}">
                  {baselineCount} base
                </span>
              </div>

              <div>
                <h3 class="font-semibold text-xs text-white mb-0.5 line-clamp-1">
                  {info.titulo}
                </h3>
                <p class="text-[11px] text-slate-400 line-clamp-2">
                  {info.subtitulo}
                </p>
              </div>

              <div class="mt-2 pt-2 border-t border-white/[0.04] text-[10px] font-mono flex items-center gap-1.5 {esActiva ? 'text-emerald-400 font-bold' : 'text-slate-600'}">
                {#if esActiva}
                  <Icon name="check" size={12} class="text-emerald-400" />
                  <span>Activa</span>
                {:else}
                  <span>Seleccionar</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- ========================================================================
       GRID PRINCIPAL: SIDEBAR IZQUIERDO (PUNTO 4) + ÁREA CENTRAL (PUNTO 5)
       ======================================================================== -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- LATERAL IZQUIERDO (SIDEBAR): SELECTOR Y CONTEO DE PARÁMETROS -->
    <!-- LATERAL IZQUIERDO (SIDEBAR): SELECTOR Y CONTEO DE PARÁMETROS -->
    <aside class="lg:col-span-4 bg-[#060a14] rounded-xl border border-white/[0.06] lg:sticky lg:top-18 overflow-hidden">
      <!-- Barra Superior / Header del Sidebar (En móvil funciona como botón toggle) -->
      <div class="p-3.5 sm:p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 class="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <span class="flex items-center gap-1.5">
              <Icon name="sliders" size={14} class="text-blue-400" />
              <span>Parámetros a Medir</span>
            </span>
            <span class="lg:hidden text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
              {cantidadSeleccionados} activos
            </span>
          </h3>
          <p class="hidden sm:block text-[11px] text-slate-400 mt-0.5">
            Inicia con los {PARAMETROS_BASELINE_DEFAULT[tipoSeleccionado].length} básicos preseleccionados. Activa variables adicionales según tu análisis.
          </p>
        </div>

        <!-- Botón de apertura/cierre en móvil (< lg) con Touch Target óptimo -->
        <button
          type="button"
          onclick={() => sidebarAbiertoMobile = !sidebarAbiertoMobile}
          class="lg:hidden min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition flex items-center gap-1.5 cursor-pointer active:bg-white/15"
          aria-expanded={sidebarAbiertoMobile}
          aria-label="Abrir o cerrar selector de parámetros"
        >
          <span>{sidebarAbiertoMobile ? 'Ocultar' : 'Configurar'}</span>
          <span class="text-xs transition-transform duration-200 {sidebarAbiertoMobile ? 'rotate-180' : ''}">▾</span>
        </button>

        <span class="hidden lg:inline-flex text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
          {cantidadSeleccionados} de {parametrosDisponibles.length} activos
        </span>
      </div>

      <!-- Contenido colapsable en móvil, permanente en escritorio -->
      <div class="{sidebarAbiertoMobile ? 'block' : 'hidden'} lg:block p-4 space-y-4">
        <!-- Presets de Selección Rápida con altura táctil accesible -->
        <div class="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <button
            type="button"
            onclick={restablecerABasicos}
            class="min-h-[38px] sm:min-h-[30px] py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/20 transition cursor-pointer text-center flex items-center justify-center active:bg-zinc-800"
            title="Restablece la selección a los 5 o 6 parámetros básicos obligatorios"
          >
            Básicos
          </button>
          <button
            type="button"
            onclick={seleccionarTodos}
            class="min-h-[38px] sm:min-h-[30px] py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-white/[0.06] transition cursor-pointer text-center flex items-center justify-center active:bg-zinc-800"
          >
            Todos
          </button>
          <button
            type="button"
            onclick={deseleccionarTodos}
            class="min-h-[38px] sm:min-h-[30px] py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-slate-400 hover:text-slate-200 border border-white/[0.06] transition cursor-pointer text-center flex items-center justify-center active:bg-zinc-800"
          >
            Limpiar
          </button>
        </div>

        <!-- Filtro por Categorías -->
        <div class="space-y-1">
          <label for="filtro-categoria" class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Categoría
          </label>
          <select
            id="filtro-categoria"
            bind:value={categoriaFiltro}
            class="w-full bg-[#0d1424] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition min-h-[40px] sm:min-h-[34px]"
          >
            {#each categoriasDisponibles as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>

        <!-- Buscador de Parámetros -->
        <div class="space-y-1">
          <label for="buscador-input" class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Filtrar Parámetro
          </label>
          <div class="relative">
            <input
              id="buscador-input"
              type="text"
              bind:value={busquedaQuery}
              placeholder="Buscar por nombre o ID..."
              class="w-full bg-[#0d1424] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition min-h-[40px] sm:min-h-[34px]"
            />
            {#if busquedaQuery}
              <button
                type="button"
                onclick={() => busquedaQuery = ''}
                class="absolute right-2 top-2 h-6 w-6 flex items-center justify-center text-xs text-slate-400 hover:text-white cursor-pointer"
                aria-label="Borrar búsqueda"
              >
                <Icon name="x" size={13} />
              </button>
            {/if}
          </div>
        </div>

        <!-- Lista de Parámetros con Checkbox Táctil -->
        <div class="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {#if parametrosSidebar.length === 0}
            <div class="text-center py-6 text-xs text-slate-600">
              Sin resultados para el filtro actual.
            </div>
          {:else}
            {#each parametrosSidebar as param (param.id)}
              {@const activo = !!seleccionados[param.id]}
              {@const evalRes = evaluaciones[param.id]}

              <button
                type="button"
                onclick={() => alternarParametro(param.id)}
                class="w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer border min-h-[44px] sm:min-h-[38px] {activo ? 'bg-[#0f172a] border-blue-500/30 text-white' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.03]'}"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={activo}
                    onchange={() => alternarParametro(param.id)}
                    class="h-4 w-4 rounded border-white/20 bg-zinc-900 text-blue-500 focus:ring-0 cursor-pointer pointer-events-none"
                  />
                  <div class="truncate">
                    <div class="text-xs truncate {activo ? 'font-medium text-slate-200' : 'text-slate-400'}">
                      {param.nombre}
                    </div>
                    <div class="text-[10px] font-mono text-slate-500 truncate">
                      {param.rango.unidad} • {formatoRango(param)}
                    </div>
                  </div>
                </div>

                {#if activo && evalRes}
                  <span 
                    class="w-2.5 h-2.5 rounded-full shrink-0"
                    style="background-color: {evalRes.ui.colorHex};"
                    title={evalRes.diagnostico}
                  ></span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </aside>

    <!-- ÁREA CENTRAL (PUNTO 5): INPUTS DE PARÁMETROS SELECCIONADOS -->
    <section class="lg:col-span-8 space-y-4">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div>
          <h2 class="text-sm font-bold text-white uppercase tracking-wider">
            Mediciones Cuantitativas de Muestra
          </h2>
          <p class="text-[11px] text-slate-500">
            Digita los resultados de laboratorio para contrastar con la normativa en tiempo real.
          </p>
        </div>
        <div class="text-xs font-mono text-slate-400">
          <strong class="text-emerald-400">{parametrosActivosCentral.length}</strong> parámetros en evaluación
        </div>
      </div>

      {#if parametrosActivosCentral.length === 0}
        <div class="p-8 text-center rounded-xl bg-[#060a14] border border-dashed border-white/10 space-y-3">
          <div class="flex justify-center text-slate-600">
            <Icon name="clipboard" size={36} class="text-slate-600" />
          </div>
          <h3 class="text-sm font-semibold text-white">No hay parámetros seleccionados</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            Activa parámetros desde el lateral izquierdo o presiona el botón para cargar los básicos de la norma.
          </p>
          <button
            type="button"
            onclick={restablecerABasicos}
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
          >
            Activar Parámetros Básicos
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {#each parametrosActivosCentral as param (param.id)}
            {@const evalRes = evaluaciones[param.id]}
            {@const presetAnim = evalRes?.ui?.presetCss || ''}

            <div
              class="p-4 rounded-xl bg-[#070d18] border transition-all duration-200 relative flex flex-col justify-between {presetAnim ? presetAnim : 'border-white/[0.08]'}"
              style={evalRes ? `border-color: ${evalRes.ui.colorHex}80;` : ''}
            >
              <div>
                <!-- Header Card: Nombre e Identificador -->
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 class="font-bold text-xs text-white">
                      {param.nombre}
                    </h3>
                    <span class="text-[10px] font-mono text-slate-500">
                      ID: {param.id} • {param.categoria}
                    </span>
                  </div>

                  {#if evalRes}
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0"
                      style="color: {evalRes.ui.colorHex}; background-color: {evalRes.ui.colorHex}15; border: 1px solid {evalRes.ui.colorHex}40;"
                    >
                      {evalRes.estado.replace('_', ' ')}
                    </span>
                  {/if}
                </div>

                <!-- Rango Legal y Norma -->
                <div class="mb-3 bg-[#03060d] p-2 rounded-lg border border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <span class="text-slate-500 block text-[9px]">Límite Legal:</span>
                    <span class="text-emerald-400 font-semibold">{formatoRango(param)}</span>
                  </div>
                  <div class="text-right max-w-[140px] truncate">
                    <span class="text-slate-500 block text-[9px]">Artículo:</span>
                    <span class="text-slate-300 truncate block" title={param.normaLegal}>{param.normaLegal}</span>
                  </div>
                </div>

                <!-- Input Cuantitativo con Flechas Estilizadas y Badge de Unidad Separado -->
                <div class="space-y-1 mb-3">
                  <label for="input-{param.id}" class="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Valor Medido:
                  </label>
                  <div class="relative flex items-center rounded-lg bg-[#03060d] border border-white/10 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition">
                    <!-- Campo de entrada numérico con teclado decimal para móviles y prevención de zoom en iOS -->
                    <input
                      id="input-{param.id}"
                      type="number"
                      inputmode="decimal"
                      step={determinarStep(param)}
                      bind:value={valoresIngresados[param.id]}
                      placeholder="0.00"
                      class="flex-1 min-w-0 bg-transparent px-3 py-2.5 sm:py-2 text-base sm:text-xs font-mono text-white placeholder-slate-700 focus:outline-none"
                    />

                    <!-- Bloque derecho: Unidad y Controles de Flechas Estilizadas -->
                    <div class="flex items-center gap-1.5 pr-1.5 shrink-0 select-none">
                      <!-- Badge de Unidad Legal -->
                      <span class="px-2 py-1 sm:py-0.5 rounded bg-zinc-900/90 border border-white/[0.08] text-[10px] font-mono text-slate-300">
                        {param.rango.unidad}
                      </span>

                      <!-- Flechas personalizadas (Custom Steppers adaptados a touch) -->
                      <div class="flex items-center sm:flex-col border border-white/[0.1] rounded-md sm:rounded bg-zinc-900/80 overflow-hidden shadow-inner">
                        <!-- Botón Decrementar móvil -->
                        <button
                          type="button"
                          onclick={() => decrementarValor(param)}
                          class="sm:hidden h-8 w-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600/40 border-r border-white/[0.06] transition-colors cursor-pointer active:bg-blue-600"
                          title="Disminuir (-{determinarStep(param)})"
                          aria-label="Decrementar {param.nombre}"
                        >
                          <span class="text-sm font-bold font-mono">−</span>
                        </button>
                        <!-- Botón Incrementar (móvil y desktop) -->
                        <button
                          type="button"
                          onclick={() => incrementarValor(param)}
                          class="h-8 w-8 sm:h-3.5 sm:w-5 flex items-center justify-center text-slate-300 sm:text-slate-400 hover:text-white hover:bg-blue-600/40 sm:border-b sm:border-white/[0.06] transition-colors cursor-pointer active:bg-blue-600"
                          title="Aumentar (+{determinarStep(param)})"
                          aria-label="Incrementar {param.nombre}"
                        >
                          <span class="sm:hidden text-sm font-bold font-mono">+</span>
                          <svg class="hidden sm:block w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <!-- Botón Decrementar desktop -->
                        <button
                          type="button"
                          onclick={() => decrementarValor(param)}
                          class="hidden sm:flex h-3.5 w-5 items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/40 transition-colors cursor-pointer active:bg-blue-600"
                          title="Disminuir (-{determinarStep(param)})"
                          aria-label="Decrementar {param.nombre}"
                        >
                          <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Diagnóstico Normativo en Vivo -->
              {#if evalRes}
                <div
                  class="pt-2 border-t border-white/[0.04] text-[11px] font-mono flex items-start gap-1.5"
                  style="color: {evalRes.ui.colorHex};"
                >
                  <Icon
                    name={evalRes.estado === 'CUMPLE' ? 'check-circle' : evalRes.estado === 'ALERTA_PREVENTIVA' ? 'alert-triangle' : 'x-circle'}
                    size={14}
                    class="shrink-0 mt-0.5"
                  />
                  <p class="leading-tight text-[10px]">
                    {evalRes.diagnostico}
                  </p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>
