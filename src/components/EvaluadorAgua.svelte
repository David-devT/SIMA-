<!--
  @file EvaluadorAgua.svelte
  @description Módulo interactivo de análisis y telemetría de calidad de agua (SIMA Water Telemetry CLI / Tactical Rack).
  Diseñado fielmente según el diseño Stitch (SIMA_COLOMBIA // SYS_QC [ONLINE]).
-->
<script lang="ts">
  import { onMount } from 'svelte';
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

  const TIPOS_NORMAS: TipoNorma[] = [
    'AGUA_POTABLE',
    'AGUA_RESIDUAL_DOMESTICA',
    'AGUA_RESIDUAL_NO_DOMESTICA',
    'AGUA_SUPERFICIAL_PRESERVACION',
    'AGUA_SUPERFICIAL_CONSUMO'
  ];

  // Identificadores de canal hardware para los 6 canales baseline de agua potable
  const CHANNEL_CODES: Record<string, { ch: string; code: string; unitTag: string; note: string }> = {
    'AP_PH': { ch: 'CH_01', code: 'AP_PH.SYS', unitTag: '[UP]', note: 'SIGMA: ±0.01' },
    'AP_TURBIEDAD': { ch: 'CH_02', code: 'AP_TURB.SYS', unitTag: '[UNT]', note: 'NEPHELOMETRY: OPT_0' },
    'AP_COLOR': { ch: 'CH_03', code: 'AP_COLOR.SYS', unitTag: '[UPC]', note: 'ESCALA PLATINO-COBALTO' },
    'AP_CONDUCTIVIDAD': { ch: 'CH_04', code: 'AP_COND.SYS', unitTag: '[µS/cm]', note: 'COMPENSADO @ 25°C' },
    'AP_CLORO_LIBRE': { ch: 'CH_05', code: 'AP_CLORO.SYS', unitTag: '[mg/L]', note: 'CLORO LIBRE RESIDUAL DPD-1' },
    'AP_E_COLI': { ch: 'CH_06', code: 'AP_E_COLI.SYS', unitTag: '[UFC/100 mL]', note: 'FILTRACIÓN POR MEMBRANA' },
  };

  function generarEstadoInicial(tipo: TipoNorma) {
    const paramsDisponibles = obtenerParametrosPorTipo(tipo);
    const baselineIds = new Set(PARAMETROS_BASELINE_DEFAULT[tipo] || []);
    const seleccionados: Record<string, boolean> = {};
    const valores: Record<string, number> = {};

    paramsDisponibles.forEach(param => {
      const esBaseline = baselineIds.has(param.id);
      seleccionados[param.id] = esBaseline;

      // Valores nominales de referencia idénticos a la maqueta Stitch
      if (param.id === 'AP_PH') valores[param.id] = 7.75;
      else if (param.id === 'AP_TURBIEDAD') valores[param.id] = 1.0;
      else if (param.id === 'AP_COLOR') valores[param.id] = 7.5;
      else if (param.id === 'AP_CONDUCTIVIDAD') valores[param.id] = 500;
      else if (param.id === 'AP_CLORO_LIBRE') valores[param.id] = 1.20;
      else if (param.id === 'AP_E_COLI') valores[param.id] = 0;
      else if (param.rango.operador === 'ENTRE' && param.rango.min !== undefined && param.rango.max !== undefined) {
        valores[param.id] = Number(((param.rango.min + param.rango.max) / 2).toFixed(2));
      } else if (param.rango.operador === 'MENOR_IGUAL' && param.rango.max !== undefined) {
        valores[param.id] = Number((param.rango.max * 0.5).toFixed(2));
      } else if (param.rango.operador === 'MAYOR_IGUAL' && param.rango.min !== undefined) {
        valores[param.id] = Number((param.rango.min * 1.3).toFixed(2));
      } else {
        valores[param.id] = 0;
      }
    });

    return { seleccionados, valores };
  }

  const estadoInicial = generarEstadoInicial('AGUA_POTABLE');

  // Estado reactivo Svelte 5 Runes
  let tipoSeleccionado = $state<TipoNorma>('AGUA_POTABLE');
  let categoriaFiltro = $state<string>('ALL_ANALYTICAL_DOMAINS');
  let busquedaQuery = $state<string>('');
  let vistaModo = $state<'RACK' | 'RAW' | 'LOG_TABLE'>('RACK');
  let pestanaMovil = $state<'RACK' | 'SWITCHBOARD' | 'LOGS'>('RACK');
  let mensajeTerminal = $state<string>('STREAM_IDLE');

  let seleccionados = $state<Record<string, boolean>>(estadoInicial.seleccionados);
  let valoresIngresados = $state<Record<string, number>>(estadoInicial.valores);
  let utcClock = $state<string>('2026-03-30T14:22:09Z');

  onMount(() => {
    const updateTime = () => {
      utcClock = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });

  // Parámetros disponibles según norma activa
  let parametrosDisponibles = $derived(obtenerParametrosPorTipo(tipoSeleccionado));
  let normaActiva = $derived(INFORMACION_NORMAS_AGUA[tipoSeleccionado]);

  // Filtrado de parámetros para el Diagnostic Switchboard
  let parametrosFiltrados = $derived(parametrosDisponibles.filter(p => {
    let cumpleCategoria = true;
    if (categoriaFiltro === 'DOMAIN_01: FISICOQUIMICOS_BASICOS') cumpleCategoria = p.categoria === 'FISICOQUIMICO';
    else if (categoriaFiltro === 'DOMAIN_02: MICROBIOLOGICOS_PATOGENOS') cumpleCategoria = p.categoria === 'MICROBIOLOGICO';
    else if (categoriaFiltro === 'DOMAIN_03: METALES_PESADOS') cumpleCategoria = p.categoria === 'INORGANICO_METALES';
    else if (categoriaFiltro === 'DOMAIN_04: COMPUESTOS_ORGANICOS') cumpleCategoria = p.categoria === 'ORGANICO';

    const matchTexto = busquedaQuery.trim() === '' || 
      p.nombre.toLowerCase().includes(busquedaQuery.toLowerCase()) || 
      p.id.toLowerCase().includes(busquedaQuery.toLowerCase());

    return cumpleCategoria && matchTexto;
  }));

  // Parámetros actualmente activos en el Rack
  let parametrosActivos = $derived(parametrosDisponibles.filter(p => seleccionados[p.id]));

  // Evaluaciones de los parámetros activos
  let resultadosActivos = $derived(parametrosActivos.map(p => {
    const valor = valoresIngresados[p.id] ?? 0;
    const evaluacion = evaluarParametro(p.id, valor);
    return { parametro: p, valor, evaluacion };
  }));

  // Contadores de conformidad
  let totalActivos = $derived(parametrosActivos.length);
  let countOk = $derived(resultadosActivos.filter(r => r.evaluacion.estado === 'CUMPLE').length);
  let countWarn = $derived(resultadosActivos.filter(r => r.evaluacion.estado === 'ALERTA_PREVENTIVA').length);
  let countFail = $derived(resultadosActivos.filter(r => r.evaluacion.estado === 'NO_CUMPLE').length);

  // Cálculo de IRCA estimado
  let ircaEstimado = $derived((() => {
    if (tipoSeleccionado !== 'AGUA_POTABLE' || totalActivos === 0) return 0.0;
    // Ponderación oficial Res. 2115: E. coli = 25, Cloro = 15, Turbiedad = 15, pH = 1.5, Color = 6, Conductividad = 7.3
    const pesos: Record<string, number> = {
      'AP_E_COLI': 25,
      'AP_CLORO_LIBRE': 15,
      'AP_TURBIEDAD': 15,
      'AP_COLOR': 6,
      'AP_CONDUCTIVIDAD': 7.3,
      'AP_PH': 1.5
    };
    let riesgoAsignado = 0;
    let puntajeTotal = 0;
    resultadosActivos.forEach(r => {
      const p = pesos[r.parametro.id] ?? 5;
      puntajeTotal += p;
      if (r.evaluacion.estado === 'NO_CUMPLE') {
        riesgoAsignado += p;
      } else if (r.evaluacion.estado === 'ALERTA_PREVENTIVA') {
        riesgoAsignado += (p * 0.2);
      }
    });
    if (puntajeTotal === 0) return 0.0;
    return Number(((riesgoAsignado / puntajeTotal) * 100).toFixed(1));
  })());

  let ircaTexto = $derived(
    ircaEstimado === 0 ? '[SIN RIESGO]' : 
    ircaEstimado <= 5 ? '[RIESGO BAJO]' : 
    ircaEstimado <= 14 ? '[RIESGO MEDIO]' : 
    ircaEstimado <= 35 ? '[RIESGO ALTO]' : '[INVIABLE SANITARIAMENTE]'
  );

  let segmentGaugePercent = $derived(totalActivos > 0 ? Math.round((countOk / totalActivos) * 100) : 100);

  // Stepper helpers con protección contra floating point drift
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

  function ajustarValor(paramId: string, direccion: 1 | -1) {
    const param = parametrosDisponibles.find(p => p.id === paramId);
    if (!param) return;
    const step = determinarStep(param);
    const precision = step < 0.01 ? 4 : step < 0.1 ? 3 : step < 1 ? 2 : 1;
    const actual = valoresIngresados[paramId] ?? 0;
    let nuevo = direccion === 1 ? actual + step : Math.max(0, actual - step);
    valoresIngresados[paramId] = Number(nuevo.toFixed(precision));
  }

  function handleInputChange(paramId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value);
    if (!isNaN(val) && val >= 0) {
      valoresIngresados[paramId] = val;
    }
  }

  // Presets de selección
  function activarDef6() {
    const baselines = new Set(PARAMETROS_BASELINE_DEFAULT[tipoSeleccionado] || []);
    parametrosDisponibles.forEach(p => {
      seleccionados[p.id] = baselines.has(p.id);
    });
  }

  function activarTodos() {
    parametrosDisponibles.forEach(p => {
      seleccionados[p.id] = true;
    });
  }

  function purgarTodos() {
    parametrosDisponibles.forEach(p => {
      seleccionados[p.id] = false;
    });
  }

  function cambiarNorma(nuevaNorma: TipoNorma) {
    tipoSeleccionado = nuevaNorma;
    const nuevo = generarEstadoInicial(nuevaNorma);
    seleccionados = nuevo.seleccionados;
    valoresIngresados = nuevo.valores;
  }

  // Exportación JSON local pura sin fetch (Client-Side Privacy)
  function exportarJson() {
    const dump = {
      header: {
        host: 'sima-core-v2.4',
        timestamp: utcClock,
        norm: normaActiva.norma,
        matrix: tipoSeleccionado,
        operator: 'LAB_OP_042',
        node: 'BOGOTA_D.C.'
      },
      telemetry: {
        irca_score: `${ircaEstimado}%`,
        status: ircaTexto,
        channels_active: totalActivos,
        conformance: { ok: countOk, warn: countWarn, fail: countFail }
      },
      channels: resultadosActivos.map(r => ({
        channel_id: r.parametro.id,
        name: r.parametro.nombre,
        value: r.valor,
        unit: r.parametro.rango.unidad,
        status: r.evaluacion.estado,
        in_range: r.evaluacion.cumple,
        norm_ref: r.parametro.normaLegal
      }))
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIMA_TELEMETRY_${tipoSeleccionado}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mensajeTerminal = 'LOG_DUMP_EXPORTED';
    setTimeout(() => mensajeTerminal = 'STREAM_IDLE', 3000);
  }

  // Exportación CSV local pura
  function exportarCsv() {
    const headers = ['ID_CANAL', 'PARAMETRO', 'VALOR_MEDIDO', 'UNIDAD', 'ESTADO', 'CONFORME', 'NORMA_LEGAL'];
    const rows = resultadosActivos.map(r => [
      r.parametro.id,
      `"${r.parametro.nombre}"`,
      r.valor,
      `"${r.parametro.rango.unidad}"`,
      r.evaluacion.estado,
      r.evaluacion.cumple ? 'SI' : 'NO',
      `"${r.parametro.normaLegal}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIMA_TELEMETRY_${tipoSeleccionado}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mensajeTerminal = 'CSV_EXPORTED';
    setTimeout(() => mensajeTerminal = 'STREAM_IDLE', 3000);
  }
</script>

<div class="bg-tactical-pitch text-tactical-text min-h-screen flex flex-col font-mono selection:bg-tactical-cerulean selection:text-tactical-pitch text-xs antialiased tactical-grid-bg">
  <!-- 1. Status Bar Superior / Polybar / Linux Status Ribbon -->
  <header class="border-b border-tactical-wirelight bg-tactical-slate/95 sticky top-0 z-50 select-none backdrop-blur-sm">
    <div class="border-b border-tactical-wireframe/80 px-3 py-1 flex flex-wrap items-center justify-between text-[10px] text-tactical-dim font-mono tracking-tight bg-tactical-pitch/90">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-tactical-softcyan font-bold tracking-wider">[HOST: sima-core-v2.4]</span>
        <span class="text-tactical-wirelight">|</span>
        <span>[UTC: {utcClock}]</span>
        <span class="text-tactical-wirelight">|</span>
        <span>[MEM_BUFFER: <span class="text-tactical-text">412MB</span>/2048MB]</span>
        <span class="text-tactical-wirelight hidden sm:inline">|</span>
        <span class="hidden sm:inline">[SYS_LATENCY: <span class="text-tactical-ice">14ms</span>]</span>
        <span class="text-tactical-wirelight hidden md:inline">|</span>
        <span class="hidden md:inline text-tactical-amber">[NORM: {normaActiva.norma}]</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-tactical-dim hidden lg:inline">[HASH: <span class="text-tactical-dimmer">e8b9...4f10</span>]</span>
        <span class="text-tactical-wirelight hidden lg:inline">|</span>
        <div class="flex items-center gap-1.5 px-2 py-0.5 bg-tactical-surface border border-tactical-wirelight text-[10px]">
          <span class="w-1.5 h-1.5 rounded-none bg-tactical-ice led-live"></span>
          <span class="text-tactical-ice font-bold tracking-widest">[STATUS: DAEMON_ACTIVE]</span>
        </div>
      </div>
    </div>

    <!-- Primary Header & Matrix Submodule Selector Tabs -->
    <div class="max-w-[1720px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      <!-- Identity -->
      <a href="/" class="flex items-center gap-3 group focus:outline-none">
        <div class="w-7 h-7 bg-tactical-surface border border-tactical-cerulean/60 flex items-center justify-center text-tactical-ice font-bold text-xs shadow-inner">
          SIM
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-extrabold tracking-widest text-tactical-softcyan text-sm group-hover:text-tactical-icebright transition-colors">
              SIMA_COLOMBIA // SYS_QC
            </span>
            <span class="text-[9px] uppercase px-1.5 py-0.2 bg-tactical-surface text-tactical-ice border border-tactical-wirehighlight font-bold">
              [ONLINE]
            </span>
          </div>
          <p class="text-[10px] text-tactical-dim">Módulo de Contrastación Analítica Fisicoquímica & Bacteriológica</p>
        </div>
      </a>

      <!-- Matrix CLI Submodule Selector Tabs -->
      <nav aria-label="Selector de matriz de monitoreo" class="flex items-center gap-1 text-[11px] overflow-x-auto">
        <button 
          type="button"
          onclick={() => cambiarNorma('AGUA_POTABLE')}
          class="px-2.5 py-1 border transition-colors flex items-center gap-1.5 {tipoSeleccionado === 'AGUA_POTABLE' ? 'bg-tactical-surface border-tactical-cerulean text-tactical-softcyan font-bold shadow-sm' : 'bg-tactical-pitch border-tactical-wirelight text-tactical-dim hover:text-tactical-text hover:border-tactical-wirehighlight'}"
        >
          {#if tipoSeleccionado === 'AGUA_POTABLE'}<span class="text-tactical-ice font-mono">&gt;</span>{/if}
          [/sys/matriz/agua_potable*]
        </button>

        <button 
          type="button"
          onclick={() => cambiarNorma('AGUA_RESIDUAL_DOMESTICA')}
          class="px-2.5 py-1 border transition-colors flex items-center gap-1.5 {tipoSeleccionado === 'AGUA_RESIDUAL_DOMESTICA' ? 'bg-tactical-surface border-tactical-cerulean text-tactical-softcyan font-bold shadow-sm' : 'bg-tactical-pitch border-tactical-wirelight text-tactical-dim hover:text-tactical-text hover:border-tactical-wirehighlight'}"
        >
          {#if tipoSeleccionado === 'AGUA_RESIDUAL_DOMESTICA'}<span class="text-tactical-ice font-mono">&gt;</span>{/if}
          [/sys/matriz/vertimientos]
        </button>

        <button 
          type="button"
          onclick={() => cambiarNorma('AGUA_SUPERFICIAL_PRESERVACION')}
          class="px-2.5 py-1 border transition-colors flex items-center gap-1.5 hidden sm:flex {tipoSeleccionado === 'AGUA_SUPERFICIAL_PRESERVACION' ? 'bg-tactical-surface border-tactical-cerulean text-tactical-softcyan font-bold shadow-sm' : 'bg-tactical-pitch border-tactical-wirelight text-tactical-dim hover:text-tactical-text hover:border-tactical-wirehighlight'}"
        >
          {#if tipoSeleccionado === 'AGUA_SUPERFICIAL_PRESERVACION'}<span class="text-tactical-ice font-mono">&gt;</span>{/if}
          [/sys/matriz/suelo_edafico]
        </button>
      </nav>

      <!-- Lab Operator Credentials -->
      <div class="flex items-center gap-2 text-[10px]">
        <div class="px-2 py-1 bg-tactical-pitch border border-tactical-wirelight text-tactical-dim">
          UID: <span class="text-tactical-softcyan font-bold">LAB_OP_042</span>
        </div>
        <div class="px-2 py-1 bg-tactical-surface border border-tactical-wirelight text-tactical-text">
          NODE: <span class="text-tactical-ice font-bold">BOGOTA_D.C.</span>
        </div>
      </div>
    </div>
  </header>

  <!-- 2. Main Content Area -->
  <main class="flex-1 max-w-[1720px] w-full mx-auto px-4 py-4 space-y-4">
    <!-- Mission Control Diagnostic Bar -->
    <section aria-label="Diagnóstico Normativo y Telemetría IRCA" class="bg-tactical-slate border border-tactical-wirelight p-3 relative shadow-md">
      <!-- Tactical Corner Accents -->
      <div class="absolute -top-1.5 -left-1.5 text-tactical-cerulean text-[10px] font-bold select-none">+</div>
      <div class="absolute -top-1.5 -right-1.5 text-tactical-cerulean text-[10px] font-bold select-none">+</div>
      <div class="absolute -bottom-1.5 -left-1.5 text-tactical-cerulean text-[10px] font-bold select-none">+</div>
      <div class="absolute -bottom-1.5 -right-1.5 text-tactical-cerulean text-[10px] font-bold select-none">+</div>

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- Standard Specification Banner -->
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2 text-[10px]">
            <span class="px-1.5 py-0.5 bg-tactical-surface border border-tactical-cerulean/60 text-tactical-softcyan font-bold tracking-wider">
              [SPEC: {normaActiva.norma.replace(/\s+/g, '_').toUpperCase()}]
            </span>
            <span class="text-tactical-dim uppercase font-mono">
              DECRETO 1575/2007 // MPS-MADS // CONTROL EN RED DE DISTRIBUCIÓN
            </span>
            <span class="text-tactical-wirehighlight">::</span>
            <span class="text-tactical-ice font-bold font-mono">
              [CHANNELS_ACTIVE: {totalActivos < 10 ? '0' + totalActivos : totalActivos}/{parametrosDisponibles.length}]
            </span>
          </div>

          <div class="flex items-baseline gap-2 flex-wrap">
            <h1 class="text-sm font-bold tracking-tight uppercase text-tactical-softcyan">
              MATRIZ_{tipoSeleccionado} // DISPOSITIVO TELEMETRICO
            </h1>
            <span class="text-[10px] text-tactical-dim font-mono">
              [MUESTRA_ID: SMP-2026-COL-8891]
            </span>
          </div>
        </div>

        <!-- Tactical Global Telemetry Indicators -->
        <div class="flex flex-wrap items-center gap-3 bg-tactical-pitch border border-tactical-wirelight p-2">
          <!-- Global Index IRCA -->
          <div class="pr-3 border-r border-tactical-wireframe">
            <div class="text-[9px] uppercase tracking-wider text-tactical-dim font-bold">IRCA_ESTIMADO</div>
            <div class="flex items-baseline gap-1 font-mono">
              <span class="text-xl font-black text-tactical-ice">{ircaEstimado.toFixed(1)}%</span>
              <span class="text-[9px] {ircaEstimado === 0 ? 'text-tactical-ice' : ircaEstimado <= 14 ? 'text-tactical-amber' : 'text-tactical-crimson'}">
                {ircaTexto}
              </span>
            </div>
          </div>

          <!-- Segmented Status Gauge -->
          <div class="pr-3 border-r border-tactical-wireframe">
            <div class="text-[9px] uppercase tracking-wider text-tactical-dim font-bold">SEGMENT_BAR</div>
            <div class="text-[11px] font-mono font-bold text-tactical-ice tracking-tighter">
              [==========] <span class="text-tactical-text">{segmentGaugePercent}% NOMINAL</span>
            </div>
          </div>

          <!-- Metric Badges High-Contrast Wireframe -->
          <div class="flex items-center gap-1.5 text-[10px] font-mono">
            <span class="px-1.5 py-0.5 bg-tactical-surface border border-tactical-ice text-tactical-ice font-bold">
              [200_OK: {countOk < 10 ? '0' + countOk : countOk}]
            </span>
            <span class="px-1.5 py-0.5 bg-tactical-amber/10 border border-tactical-amber/50 text-tactical-amber">
              [WARN: {countWarn < 10 ? '0' + countWarn : countWarn}]
            </span>
            <span class="px-1.5 py-0.5 bg-tactical-crimson/10 border border-tactical-crimson/50 text-tactical-crimson">
              [FAIL: {countFail < 10 ? '0' + countFail : countFail}]
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Workspace Grid: Left Sidebar vs Instrumentation Rack -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      <!-- 3. Left Sidebar (Diagnostic Switchboard) -->
      <aside 
        aria-label="Matriz de diagnóstico y configuración" 
        class="lg:col-span-4 bg-tactical-slate border border-tactical-wirelight p-3.5 space-y-3 relative {pestanaMovil === 'SWITCHBOARD' ? 'block' : 'hidden lg:block'}"
      >
        <div class="absolute -top-1 -left-1 text-tactical-dimmer text-[9px]">+</div>
        <div class="absolute -top-1 -right-1 text-tactical-dimmer text-[9px]">+</div>

        <!-- Panel Header -->
        <div class="flex items-center justify-between pb-2 border-b border-tactical-wireframe">
          <div class="flex items-center gap-1.5 text-xs font-bold text-tactical-softcyan">
            <span class="text-tactical-ice font-mono">&gt;</span>
            <span>DIAGNOSTIC_SWITCHBOARD</span>
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-tactical-pitch border border-tactical-wirelight text-tactical-ice">
            [{totalActivos}_OF_{parametrosDisponibles.length}_ENABLED]
          </span>
        </div>

        <!-- Quick Action Presets -->
        <div class="grid grid-cols-3 gap-1">
          <button 
            type="button"
            onclick={activarDef6}
            class="py-1 px-1 bg-tactical-surface border border-tactical-cerulean text-tactical-softcyan hover:bg-tactical-cerulean/20 text-[10px] font-bold uppercase transition-colors text-center"
          >
            [SET_DEF_6]
          </button>
          <button 
            type="button"
            onclick={activarTodos}
            class="py-1 px-1 bg-tactical-pitch border border-tactical-wirelight text-tactical-dim hover:text-tactical-text hover:border-tactical-wirehighlight text-[10px] uppercase transition-colors text-center"
          >
            [ALL_{parametrosDisponibles.length}]
          </button>
          <button 
            type="button"
            onclick={purgarTodos}
            class="py-1 px-1 bg-tactical-pitch border border-tactical-wirelight text-tactical-dim hover:text-tactical-crimson hover:border-tactical-crimson/50 text-[10px] uppercase transition-colors text-center"
          >
            [PURGE]
          </button>
        </div>

        <!-- Category Selector -->
        <div class="space-y-1">
          <label class="block text-[10px] uppercase tracking-wider text-tactical-dim font-bold" for="category-select">
            --target-category=
          </label>
          <select 
            id="category-select"
            bind:value={categoriaFiltro}
            class="w-full bg-[#0e1c26] border border-tactical-wirelight text-tactical-text text-xs p-1.5 font-mono focus:border-tactical-softcyan focus:ring-0 rounded-none cursor-pointer"
          >
            <option value="ALL_ANALYTICAL_DOMAINS">ALL_ANALYTICAL_DOMAINS</option>
            <option value="DOMAIN_01: FISICOQUIMICOS_BASICOS">DOMAIN_01: FISICOQUIMICOS_BASICOS</option>
            <option value="DOMAIN_02: MICROBIOLOGICOS_PATOGENOS">DOMAIN_02: MICROBIOLOGICOS_PATOGENOS</option>
            <option value="DOMAIN_03: METALES_PESADOS">DOMAIN_03: METALES_PESADOS</option>
            <option value="DOMAIN_04: COMPUESTOS_ORGANICOS">DOMAIN_04: COMPUESTOS_ORGANICOS</option>
          </select>
        </div>

        <!-- CLI Prompt Search -->
        <div class="space-y-1">
          <label class="block text-[10px] uppercase tracking-wider text-tactical-dim font-bold" for="search-param">
            &gt; grep_param --filter=
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-tactical-softcyan text-xs font-mono">&gt;</span>
            <input 
              id="search-param"
              type="text"
              bind:value={busquedaQuery}
              placeholder="AP_PH | Turbiedad | Cloro..."
              class="w-full bg-[#0e1c26] border border-tactical-wirelight text-tactical-ice placeholder-tactical-dimmer text-xs pl-6 pr-2 py-1 font-mono focus:border-tactical-softcyan focus:ring-0 rounded-none"
            />
          </div>
        </div>

        <!-- Parameter Switchboard List -->
        <div class="space-y-1 max-h-[520px] overflow-y-auto pr-0.5" role="group" aria-label="Canales de telemetría analítica">
          {#each parametrosFiltrados as param, idx}
            {@const activo = seleccionados[param.id]}
            {@const chMeta = CHANNEL_CODES[param.id] ?? { ch: `CH_${(idx + 1) < 10 ? '0' + (idx + 1) : idx + 1}`, code: `${param.id}.SYS` }}
            <button
              type="button"
              onclick={() => seleccionados[param.id] = !activo}
              class="w-full flex items-center justify-between p-2 border text-left cursor-pointer select-none transition-colors {activo ? 'bg-[#0e1c26] border-tactical-wirelight hover:border-tactical-softcyan/70' : 'bg-[#0a151e]/60 border-tactical-wireframe opacity-50 hover:opacity-85'}"
            >
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-bold {activo ? 'text-tactical-ice' : 'text-tactical-dimmer'}">
                  [{activo ? 'x' : ' '}]
                </span>
                <div>
                  <div class="text-[11px] font-bold tracking-tight flex items-center gap-1.5 {activo ? 'text-tactical-text' : 'text-tactical-dim'}">
                    <span>{param.nombre}</span>
                    <span class="text-[9px] text-tactical-softcyan font-normal font-mono">[{chMeta.ch}]</span>
                  </div>
                  <span class="text-[9px] text-tactical-dim font-mono block">
                    LIM: {param.rango.operador === 'ENTRE' ? `${param.rango.min} .. ${param.rango.max}` : param.rango.operador === 'MENOR_IGUAL' ? `≤ ${param.rango.max}` : param.rango.operador === 'MAYOR_IGUAL' ? `≥ ${param.rango.min}` : '0'} {param.rango.unidad} // {param.normaLegal}
                  </span>
                </div>
              </div>
              <span class="w-1.5 h-1.5 rounded-none {activo ? 'bg-tactical-ice' : 'bg-tactical-wirelight'}" title={activo ? 'Canal activo' : 'Canal inactivo'}></span>
            </button>
          {/each}
        </div>

        <!-- Quick System Info Footnote -->
        <div class="pt-2 border-t border-tactical-wireframe text-[9px] text-tactical-dim font-mono flex items-center justify-between">
          <span>POLL_INTERVAL: 250ms</span>
          <span class="text-tactical-softcyan font-bold">DRIVER: SIMA_ADC_V4</span>
        </div>
      </aside>

      <!-- 4. Right Section: Instrumentation Rack / Log Table -->
      <section 
        aria-label="Canales de adquisición de datos" 
        class="lg:col-span-8 space-y-3 {pestanaMovil === 'SWITCHBOARD' ? 'hidden lg:block' : 'block'}"
      >
        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-tactical-slate border border-tactical-wirelight p-2.5">
          <div class="flex items-center gap-2">
            <span class="text-tactical-softcyan font-bold text-xs">&gt; SYS_INSTRUMENTATION_RACK</span>
            <span class="text-[10px] text-tactical-dim font-mono">// {totalActivos} ACTIVOS // CONTRASTACIÓN AUTOMÁTICA EN TIEMPO REAL</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex bg-tactical-pitch border border-tactical-wirelight p-0.5 text-[10px]">
              <button 
                type="button"
                onclick={() => vistaModo = 'RAW'}
                class="px-2 py-0.5 transition-colors {vistaModo === 'RAW' ? 'bg-tactical-surface border border-tactical-cerulean/70 text-tactical-softcyan font-bold' : 'text-tactical-dim hover:text-white'}"
              >
                RAW
              </button>
              <button 
                type="button"
                onclick={() => vistaModo = 'RACK'}
                class="px-2 py-0.5 transition-colors {vistaModo === 'RACK' ? 'bg-tactical-surface border border-tactical-cerulean/70 text-tactical-softcyan font-bold' : 'text-tactical-dim hover:text-white'}"
              >
                RACK
              </button>
              <button 
                type="button"
                onclick={() => vistaModo = 'LOG_TABLE'}
                class="px-2 py-0.5 transition-colors {vistaModo === 'LOG_TABLE' ? 'bg-tactical-surface border border-tactical-cerulean/70 text-tactical-softcyan font-bold' : 'text-tactical-dim hover:text-white'}"
              >
                LOG_TABLE
              </button>
            </div>

            <button 
              type="button"
              onclick={exportarJson}
              class="px-2.5 py-1 bg-tactical-cerulean/20 hover:bg-tactical-cerulean/35 text-tactical-ice border border-tactical-cerulean font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1"
            >
              <span>[DUMP_LOG_JSON]</span>
            </button>
          </div>
        </div>

        {#if vistaModo === 'RACK' || pestanaMovil === 'RACK'}
          <!-- 6 Hardware-Style Instrument Boxes Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each resultadosActivos as r, idx}
              {@const p = r.parametro}
              {@const chMeta = CHANNEL_CODES[p.id] ?? { ch: `CH_${(idx + 1) < 10 ? '0' + (idx + 1) : idx + 1}`, code: `${p.id}.SYS`, unitTag: `[${p.rango.unidad}]`, note: 'TELEMETRÍA DIGITAL' }}
              {@const isOk = r.evaluacion.estado === 'CUMPLE'}
              {@const isWarn = r.evaluacion.estado === 'ALERTA_PREVENTIVA'}
              {@const isFail = r.evaluacion.estado === 'NO_CUMPLE'}

              <article class="bg-tactical-slate border border-tactical-wirelight p-3 relative flex flex-col justify-between hover:border-tactical-softcyan/60 transition-colors shadow-sm">
                <!-- Crosshair corners -->
                <span class="absolute top-0.5 left-1 text-tactical-wirehighlight text-[9px] font-mono select-none">[+</span>
                <span class="absolute top-0.5 right-1 text-tactical-wirehighlight text-[9px] font-mono select-none">+]</span>
                <span class="absolute bottom-0.5 left-1 text-tactical-wirehighlight text-[9px] font-mono select-none">[+</span>
                <span class="absolute bottom-0.5 right-1 text-tactical-wirehighlight text-[9px] font-mono select-none">+]</span>

                <div>
                  <!-- Box Title Header -->
                  <div class="flex items-center justify-between pb-1.5 border-b border-tactical-wireframe">
                    <div>
                      <span class="text-[10px] font-bold text-tactical-softcyan font-mono tracking-wider">
                        {chMeta.ch} // {chMeta.code}
                      </span>
                      <h3 class="text-xs font-bold uppercase tracking-wider text-tactical-text">
                        {p.nombre}
                      </h3>
                    </div>

                    <span class="px-1.5 py-0.5 border font-mono text-[9px] font-bold {isOk ? 'bg-tactical-surface border-tactical-ice text-tactical-ice' : isWarn ? 'bg-tactical-amber/15 border-tactical-amber text-tactical-amber' : 'bg-tactical-crimson/15 border-tactical-crimson text-tactical-crimson'}">
                      {isOk ? '[200_OK // IN_SPEC]' : isWarn ? '[WARN_503 // THRESHOLD]' : p.id === 'AP_E_COLI' ? '[CRIT: CERO_TOLERANCIA]' : '[FAIL_400 // CRIT_FAIL]'}
                    </span>
                  </div>

                  <!-- Readout Display -->
                  <div class="mt-2.5 flex items-baseline justify-between">
                    <div class="flex items-baseline gap-2">
                      <span class="text-3xl font-black font-mono text-tactical-ice tracking-tight">
                        {r.valor}
                      </span>
                      <span class="text-xs font-mono text-tactical-dim">{chMeta.unitTag}</span>
                    </div>
                    <span class="text-[9px] font-mono text-tactical-dim uppercase">{chMeta.note}</span>
                  </div>

                  <!-- Dynamic ASCII Bar Sparkline Visualizer -->
                  <div class="mt-1 bg-tactical-pitch px-2 py-1 border border-tactical-wireframe flex items-center justify-between text-[10px] font-mono">
                    <span class="font-bold tracking-widest">
                      {#if isFail}
                        <span class="text-tactical-crimson">||||||||||||||||||||</span>
                      {:else if isWarn}
                        <span class="text-tactical-amber">||||||||||||||</span><span class="text-tactical-dimmer">......</span>
                      {:else}
                        <span class="text-tactical-ice">||||||||</span><span class="text-tactical-softcyan">||||||||</span><span class="text-tactical-dimmer">......</span>
                      {/if}
                    </span>
                    <span class="text-tactical-dim text-[9px]">
                      {isOk ? '[50.0% OF RANGE]' : isWarn ? '[85.0% OF LIMIT]' : '[CRIT_EXCEEDED]'}
                    </span>
                  </div>

                  <!-- Standard Reference Specs -->
                  <div class="mt-2 text-[9px] font-mono text-tactical-dim bg-tactical-pitch/70 p-1.5 border border-tactical-wireframe">
                    <span class="text-tactical-text font-bold">RULE_REF:</span> {p.normaLegal} // 
                    <span class="text-tactical-softcyan font-semibold">
                      {p.rango.operador === 'ENTRE' ? `RANGO: ${p.rango.min} .. ${p.rango.max}` : p.rango.operador === 'MENOR_IGUAL' ? `MAX: ≤ ${p.rango.max}` : p.rango.operador === 'MAYOR_IGUAL' ? `MIN: ≥ ${p.rango.min}` : 'EXIGIDO: 0'} {p.rango.unidad}
                    </span>
                  </div>

                  <!-- Tactical Lab Step Potentiometer -->
                  <div class="mt-2.5 space-y-1">
                    <span class="text-[9px] uppercase tracking-wider text-tactical-dim font-bold block">
                      POTENTIOMETER // INPUT_VAL
                    </span>
                    <div class="flex items-stretch bg-tactical-pitch border border-tactical-wirelight">
                      <button 
                        type="button"
                        onclick={() => ajustarValor(p.id, -1)}
                        class="w-9 bg-tactical-surface hover:bg-tactical-cerulean/25 active:bg-tactical-cerulean/40 text-tactical-ice border-r border-tactical-wirelight font-mono text-sm font-bold flex items-center justify-center select-none"
                        aria-label="Disminuir valor"
                      >
                        −
                      </button>

                      <input 
                        type="number" 
                        value={r.valor}
                        step={determinarStep(p)}
                        oninput={(e) => handleInputChange(p.id, e)}
                        class="flex-1 bg-[#0e1c26] font-mono text-sm font-bold text-center py-1 px-2 border-0 focus:ring-1 focus:ring-tactical-softcyan text-tactical-ice"
                      />

                      <button 
                        type="button"
                        onclick={() => ajustarValor(p.id, 1)}
                        class="w-9 bg-tactical-surface hover:bg-tactical-cerulean/25 active:bg-tactical-cerulean/40 text-tactical-ice border-l border-tactical-wirelight font-mono text-sm font-bold flex items-center justify-center select-none"
                        aria-label="Aumentar valor"
                      >
                        +
                      </button>

                      <div class="px-2 bg-tactical-surface border-l border-tactical-wirelight flex items-center text-[10px] text-tactical-dim font-mono">
                        {chMeta.unitTag}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bottom Status Telemetry Footer -->
                <div class="mt-3 pt-1.5 border-t border-tactical-wireframe text-[10px] font-mono flex items-center gap-1.5">
                  <span class="font-bold {isOk ? 'text-tactical-ice' : isWarn ? 'text-tactical-amber' : 'text-tactical-crimson'}">&gt;&gt;</span>
                  <span class="text-tactical-text text-[10px]">
                    VERIFICADO: <strong class="{isOk ? 'text-tactical-ice' : isWarn ? 'text-tactical-amber' : 'text-tactical-crimson'}">{r.valor} {p.rango.unidad}</strong> 
                    {isOk ? 'dentro de especificaciones normales.' : isWarn ? 'en umbral de advertencia temprana.' : 'no conforme según norma vigente.'}
                  </span>
                </div>
              </article>
            {/each}
          </div>
        {:else if vistaModo === 'LOG_TABLE' || pestanaMovil === 'LOGS'}
          <!-- Telemetry Log Table View -->
          <div class="bg-tactical-slate border border-tactical-wirelight p-3 overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead>
                <tr class="border-b border-tactical-wireframe text-tactical-dim text-[10px] uppercase">
                  <th class="p-2">Canal</th>
                  <th class="p-2">Parámetro</th>
                  <th class="p-2">Valor</th>
                  <th class="p-2">Unidad</th>
                  <th class="p-2">Límite Normativo</th>
                  <th class="p-2">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-tactical-wireframe/40">
                {#each resultadosActivos as r}
                  <tr class="hover:bg-tactical-surface/50">
                    <td class="p-2 text-tactical-softcyan font-bold">{r.parametro.id}</td>
                    <td class="p-2 text-tactical-text">{r.parametro.nombre}</td>
                    <td class="p-2 text-tactical-ice font-bold">{r.valor}</td>
                    <td class="p-2 text-tactical-dim">{r.parametro.rango.unidad}</td>
                    <td class="p-2 text-tactical-dimmer">{r.parametro.normaLegal}</td>
                    <td class="p-2">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold {r.evaluacion.cumple ? 'bg-tactical-surface text-tactical-ice border border-tactical-ice/50' : 'bg-tactical-crimson/20 text-tactical-crimson border border-tactical-crimson/40'}">
                        {r.evaluacion.estado}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <!-- RAW JSON Inspection Stream -->
          <div class="bg-[#060f18] border border-tactical-wirelight p-3 font-mono text-xs text-tactical-ice overflow-x-auto max-h-[600px]">
            <pre>{JSON.stringify({
              matrix: tipoSeleccionado,
              timestamp: utcClock,
              active_channels: totalActivos,
              irca_score: ircaEstimado,
              readings: resultadosActivos.map(r => ({
                id: r.parametro.id,
                name: r.parametro.nombre,
                val: r.valor,
                unit: r.parametro.rango.unidad,
                status: r.evaluacion.estado
              }))
            }, null, 2)}</pre>
          </div>
        {/if}

        <!-- Mobile CLI Quick Actions & Terminal Prompt -->
        <div class="lg:hidden space-y-2 pt-2">
          <div class="grid grid-cols-2 gap-1.5">
            <button 
              type="button"
              onclick={exportarCsv}
              class="bg-[#0e1b24] border border-[#355e7d] text-[#82d1f2] px-2 py-2 min-h-[44px] flex items-center justify-center gap-1 font-mono text-[10px] tracking-wider active:bg-[#4ba3cc] active:text-[#00202d] shadow-sm transition-colors"
            >
              <span class="material-symbols-outlined text-[16px]">file_download</span>
              <span>[EXPORT_TELEMETRY.CSV]</span>
            </button>
            <button 
              type="button"
              onclick={exportarJson}
              class="bg-[#142533] border border-[#355e7d] text-[#68b8de] px-2 py-2 min-h-[44px] flex items-center justify-center gap-1 font-mono text-[10px] tracking-wider active:bg-[#82d1f2] active:text-[#00344d] shadow-sm transition-colors"
            >
              <span class="material-symbols-outlined text-[16px]">terminal</span>
              <span>[RUN_DIAGNOSTIC_BATCH]</span>
            </button>
          </div>

          <div class="bg-[#060f18] border border-[#25445a] px-2 py-1.5 flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
            <span class="truncate text-[#68b8de]">SIMA-COLOMBIA/BOG-SUB-04 ❯ {mensajeTerminal}</span>
            <span class="text-[#82d1f2] animate-pulse">█</span>
          </div>
        </div>
      </section>
    </div>
  </main>

  <!-- 5. Footer Institucional de Telemetría -->
  <footer class="mt-auto border-t border-tactical-wirelight bg-tactical-pitch/95 py-2 px-4 text-[10px] font-mono text-tactical-dim select-none">
    <div class="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="text-tactical-softcyan font-bold">&gt; SIMA_COLOMBIA // CORE_TELEMETRY</span>
        <span class="text-tactical-wirelight">|</span>
        <span>MARCO: DECRETO 1575 / RES. 2115 DE 2007 (MPS/MADS)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-tactical-ice">[PROTOCOLO_INS]</span>
        <span>/</span>
        <span class="text-tactical-softcyan">[SIVICAP_BRIDGE]</span>
        <span>/</span>
        <span>[SLA: 99.98% REALTIME]</span>
      </div>
    </div>
  </footer>

  <!-- 6. Mobile Bottom Navigation Bar (Tactical Handheld Dock) -->
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a141d]/95 backdrop-blur-xl border-t border-[#25445a] shadow-[0_-4px_24px_rgba(6,15,24,0.8)] pb-safe">
    <div class="flex items-center justify-between px-3 py-1 bg-[#060f18] border-b border-[#25445a]/60 text-[10px] font-mono">
      <div class="flex items-center gap-2">
        <span class="text-[#82d1f2] bg-[#142533] border border-[#25445a] px-1.5 py-0.5">[OK: {countOk}]</span>
        <span class="text-warning bg-warning/10 border border-warning/30 px-1.5 py-0.5">[WARN: {countWarn}]</span>
        <span class="text-error bg-error/10 border border-error/30 px-1.5 py-0.5">[FAIL: {countFail}]</span>
      </div>
      <span class="text-on-surface-variant font-mono text-[9px] tracking-wider">LINK: DUPLEX_9600bps</span>
    </div>

    <div class="grid grid-cols-3 h-12 p-1 gap-1 font-mono text-xs">
      <button 
        type="button"
        onclick={() => pestanaMovil = 'RACK'}
        class="flex items-center justify-center gap-1 transition-colors min-h-[36px] {pestanaMovil === 'RACK' ? 'bg-[#1c3244] border border-[#355e7d] text-[#82d1f2] font-bold' : 'text-on-surface-variant'}"
      >
        <span class="material-symbols-outlined text-[16px]">developer_board</span>
        <span>[RACK]</span>
      </button>

      <button 
        type="button"
        onclick={() => pestanaMovil = 'SWITCHBOARD'}
        class="flex items-center justify-center gap-1 transition-colors min-h-[36px] {pestanaMovil === 'SWITCHBOARD' ? 'bg-[#1c3244] border border-[#355e7d] text-[#82d1f2] font-bold' : 'text-on-surface-variant'}"
      >
        <span class="material-symbols-outlined text-[16px]">tune</span>
        <span>[SWITCHBOARD]</span>
      </button>

      <button 
        type="button"
        onclick={() => pestanaMovil = 'LOGS'}
        class="flex items-center justify-center gap-1 transition-colors min-h-[36px] {pestanaMovil === 'LOGS' ? 'bg-[#1c3244] border border-[#355e7d] text-[#82d1f2] font-bold' : 'text-on-surface-variant'}"
      >
        <span class="material-symbols-outlined text-[16px]">terminal</span>
        <span>[LOGS]</span>
      </button>
    </div>
  </nav>
</div>
