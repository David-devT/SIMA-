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

    <!-- Acciones de Prueba Rápida -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={simularCumplimiento}
        class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 transition cursor-pointer"
        title="Simular escenario de cumplimiento general"
      >
        ● Conforme
      </button>
      <button
        type="button"
        onclick={simularAlerta}
        class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/30 transition cursor-pointer"
        title="Simular escenario de alerta preventiva"
      >
        ● Alerta
      </button>
      <button
        type="button"
        onclick={simularIncumplimiento}
        class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 transition cursor-pointer"
        title="Simular escenario de incumplimiento normativo"
      >
        ● No Conforme
      </button>
    </div>
  </div>

  <!-- SELECTOR DE LAS 5 NORMAS (PUNTO 3) - Minimalist & High Contrast -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
    {#each TIPOS_NORMAS as tipo}
      {@const info = INFORMACION_NORMAS_AGUA[tipo]}
      {@const esActiva = tipoSeleccionado === tipo}
      {@const baselineCount = (PARAMETROS_BASELINE_DEFAULT[tipo] || []).length}

      <button
        type="button"
        onclick={() => cambiarNorma(tipo)}
        class="p-3.5 rounded-xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between border {esActiva ? 'bg-[#0f172a] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20' : 'bg-[#060a14] border-white/[0.06] hover:bg-[#0b1222] hover:border-white/10'}"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-base">{info.icono}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded {esActiva ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-slate-400 border border-white/[0.06]'}">
            {baselineCount} base
          </span>
        </div>

        <div>
          <h3 class="font-semibold text-xs text-white mb-0.5 line-clamp-1">
            {info.titulo}
          </h3>
          <p class="text-[11px] text-slate-400 line-clamp-1">
            {info.subtitulo}
          </p>
        </div>

        <div class="mt-2 pt-2 border-t border-white/[0.04] text-[10px] font-mono {esActiva ? 'text-emerald-400 font-bold' : 'text-slate-600'}">
          {esActiva ? '✓ Seleccionada' : 'Seleccionar'}
        </div>
      </button>
    {/each}
  </div>

  <!-- Resumen Normativo y Status Bar -->
  <div class="p-3.5 rounded-xl bg-[#080e1a] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">Norma Aplicable:</span>
        <span class="text-xs font-semibold text-white">{normaActiva.norma}</span>
      </div>
      <p class="text-[11px] text-slate-400 mt-0.5 max-w-2xl">
        {normaActiva.descripcion}
      </p>
    </div>

    <!-- Conteo de Cumplimiento -->
    <div class="flex items-center gap-4 bg-[#030712] px-3 py-2 rounded-lg border border-white/[0.06] shrink-0 text-xs font-mono">
      <div>
        <span class="text-slate-400 block text-[10px]">Conformidad</span>
        <span class="text-sm font-bold text-white">{metricas.porcentaje}%</span>
      </div>
      <div class="h-6 w-px bg-white/10"></div>
      <div class="flex items-center gap-2.5">
        <span class="text-emerald-400" title="Cumple">{metricas.conformes} C</span>
        <span class="text-amber-400" title="Alerta">{metricas.alertas} A</span>
        <span class="text-rose-400" title="No Cumple">{metricas.noConformes} NC</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       GRID PRINCIPAL: SIDEBAR IZQUIERDO (PUNTO 4) + ÁREA CENTRAL (PUNTO 5)
       ======================================================================== -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- LATERAL IZQUIERDO (SIDEBAR): SELECTOR Y CONTEO DE PARÁMETROS -->
    <aside class="lg:col-span-4 bg-[#060a14] p-4 rounded-xl border border-white/[0.06] space-y-4 sticky top-18">
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-bold text-xs uppercase tracking-wider text-white">
            Parámetros a Medir
          </h3>
          <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
            {cantidadSeleccionados} de {parametrosDisponibles.length} activos
          </span>
        </div>
        <p class="text-[11px] text-slate-400">
          Inicia con los {PARAMETROS_BASELINE_DEFAULT[tipoSeleccionado].length} básicos preseleccionados. Activa variables adicionales según tu análisis.
        </p>
      </div>

      <!-- Presets de Selección Rápida -->
      <div class="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
        <button
          type="button"
          onclick={restablecerABasicos}
          class="py-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/20 transition cursor-pointer text-center"
          title="Restablece la selección a los 5 o 6 parámetros básicos obligatorios"
        >
          Básicos
        </button>
        <button
          type="button"
          onclick={seleccionarTodos}
          class="py-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-white/[0.06] transition cursor-pointer text-center"
        >
          Todos
        </button>
        <button
          type="button"
          onclick={deseleccionarTodos}
          class="py-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-slate-500 hover:text-slate-300 border border-white/[0.06] transition cursor-pointer text-center"
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
          class="w-full bg-[#0d1424] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
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
            class="w-full bg-[#0d1424] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
          />
          {#if busquedaQuery}
            <button
              type="button"
              onclick={() => busquedaQuery = ''}
              class="absolute right-2 top-1.5 text-xs text-slate-500 hover:text-white"
            >
              ✕
            </button>
          {/if}
        </div>
      </div>

      <!-- Lista de Parámetros con Checkbox -->
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
              class="w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer border {activo ? 'bg-[#0f172a] border-blue-500/30 text-white' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.03]'}"
            >
              <div class="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={activo}
                  onchange={() => alternarParametro(param.id)}
                  class="rounded border-white/20 bg-zinc-900 text-blue-500 focus:ring-0 cursor-pointer pointer-events-none"
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
                  class="w-2 h-2 rounded-full shrink-0"
                  style="background-color: {evalRes.ui.colorHex};"
                  title={evalRes.diagnostico}
                ></span>
              {/if}
            </button>
          {/each}
        {/if}
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
          <div class="text-2xl text-slate-600">📋</div>
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
                    <!-- Campo de entrada numérico -->
                    <input
                      id="input-{param.id}"
                      type="number"
                      step={determinarStep(param)}
                      bind:value={valoresIngresados[param.id]}
                      placeholder="0.00"
                      class="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs font-mono text-white placeholder-slate-700 focus:outline-none"
                    />

                    <!-- Bloque derecho: Unidad y Controles de Flechas Estilizadas -->
                    <div class="flex items-center gap-1.5 pr-1.5 shrink-0 select-none">
                      <!-- Badge de Unidad Legal -->
                      <span class="px-2 py-0.5 rounded bg-zinc-900/90 border border-white/[0.08] text-[10px] font-mono text-slate-300">
                        {param.rango.unidad}
                      </span>

                      <!-- Flechas personalizadas (Custom Steppers) -->
                      <div class="flex flex-col border border-white/[0.1] rounded bg-zinc-900/80 overflow-hidden shadow-inner">
                        <button
                          type="button"
                          onclick={() => incrementarValor(param)}
                          class="h-3.5 w-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/40 border-b border-white/[0.06] transition-colors cursor-pointer active:bg-blue-600"
                          title="Aumentar (+{determinarStep(param)})"
                          aria-label="Incrementar {param.nombre}"
                        >
                          <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onclick={() => decrementarValor(param)}
                          class="h-3.5 w-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/40 transition-colors cursor-pointer active:bg-blue-600"
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
                  <span class="text-xs shrink-0">
                    {evalRes.estado === 'CUMPLE' ? '✓' : evalRes.estado === 'ALERTA_PREVENTIVA' ? '⚠️' : '✕'}
                  </span>
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
