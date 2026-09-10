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
  let vistaDerecha = $state<'TODOS' | 'TARJETAS' | 'TABLA'>('TODOS');
  let exportandoImagen = $state<boolean>(false);
  let mensajeExportacion = $state<string | null>(null);

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

  /**
   * Dibuja un rectángulo con esquinas redondeadas en Canvas 2D
   */
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: boolean,
    stroke: boolean
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  /**
   * Trunca un texto en Canvas agregando '...' si supera el ancho máximo en píxeles
   */
  function truncarTexto(ctx: CanvasRenderingContext2D, texto: string, maxAncho: number): string {
    if (ctx.measureText(texto).width <= maxAncho) return texto;
    let actual = texto;
    while (actual.length > 0 && ctx.measureText(actual + '...').width > maxAncho) {
      actual = actual.slice(0, -1);
    }
    return actual + '...';
  }

  /**
   * Genera un informe gráfico en alta resolución (PNG) mediante HTML5 Canvas 2D
   * con metadatos oficiales de SIMA Colombia, métricas de conformidad y tabla analítica completa.
   */
  async function exportarReporteComoImagen(): Promise<void> {
    if (parametrosActivosCentral.length === 0) return;
    exportandoImagen = true;
    mensajeExportacion = null;

    try {
      // Ciclo corto asíncrono para permitir que la UI pinte el estado de carga
      await new Promise(r => setTimeout(r, 60));

      const scale = 2; // Renderizado nítido de alta definición (Retina)
      const canvasWidth = 1180;
      
      const headerHeight = 150;
      const metricsHeight = 65;
      const tableHeaderHeight = 42;
      const rowHeight = 44;
      const footerHeight = 65;
      const paddingY = 30;

      const totalRows = parametrosActivosCentral.length;
      const canvasHeight = paddingY * 2 + headerHeight + metricsHeight + 20 + tableHeaderHeight + (totalRows * rowHeight) + footerHeight;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar el contexto 2D del Canvas');

      ctx.scale(scale, scale);

      // Fondo general con gradiente profesional (#040711 -> #070c1a)
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      bgGradient.addColorStop(0, '#040711');
      bgGradient.addColorStop(0.5, '#070c1a');
      bgGradient.addColorStop(1, '#050915');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Borde exterior técnico
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

      // Barra superior decorativa tricolor (Azul técnico a Esmeralda)
      const barGrad = ctx.createLinearGradient(10, 10, canvasWidth - 10, 10);
      barGrad.addColorStop(0, '#0284c7');
      barGrad.addColorStop(0.5, '#06b6d4');
      barGrad.addColorStop(1, '#10b981');
      ctx.fillStyle = barGrad;
      ctx.fillRect(10, 10, canvasWidth - 20, 4);

      let currentY = paddingY + 15;

      // -------------------------------------------------------------
      // HEADER: Identidad SIMA y Metadatos de la Norma
      // -------------------------------------------------------------
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText('SIMA COLOMBIA • SISTEMA INTEGRADO DE MONITOREO AMBIENTAL', 35, currentY);

      currentY += 26;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('Reporte Analítico de Calidad de Agua', 35, currentY);

      // Fecha y hora en lateral derecho
      const ahora = new Date();
      const fechaTexto = ahora.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Emisión: ${fechaTexto}`, canvasWidth - 35, currentY - 6);
      ctx.fillText(`Normativa: ${normaActiva.norma}`, canvasWidth - 35, currentY + 12);
      ctx.textAlign = 'left';

      currentY += 22;
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${normaActiva.titulo}`, 35, currentY);

      currentY += 18;
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${normaActiva.subtitulo} • Evaluación automática en tiempo real`, 35, currentY);

      currentY += 30;

      // -------------------------------------------------------------
      // BARRA DE MÉTRICAS (KPIs Resumen de Conformidad)
      // -------------------------------------------------------------
      const kpis = [
        { label: 'PARÁMETROS EVALUADOS', val: `${metricas.total}`, color: '#ffffff', bg: '#0d1527', border: '#1e293b' },
        { label: 'CONFORMES (CUMPLEN)', val: `${metricas.conformes}`, color: '#34d399', bg: '#064e3b30', border: '#05966950' },
        { label: 'ALERTA PREVENTIVA', val: `${metricas.alertas}`, color: '#fbbf24', bg: '#78350f30', border: '#d9770650' },
        { label: 'NO CONFORMES (INCUMPLEN)', val: `${metricas.noConformes}`, color: '#f87171', bg: '#88133730', border: '#e11d4850' },
        { label: 'ÍNDICE DE CONFORMIDAD', val: `${metricas.porcentaje}%`, color: metricas.porcentaje >= 80 ? '#34d399' : metricas.porcentaje >= 50 ? '#fbbf24' : '#f87171', bg: '#0d1527', border: '#1e293b' }
      ];

      const kpiWidth = (canvasWidth - 70 - (kpis.length - 1) * 10) / kpis.length;
      let kpiX = 35;

      kpis.forEach(kpi => {
        ctx.fillStyle = kpi.bg;
        roundRect(ctx, kpiX, currentY, kpiWidth, 54, 8, true, false);
        ctx.strokeStyle = kpi.border;
        ctx.lineWidth = 1;
        roundRect(ctx, kpiX, currentY, kpiWidth, 54, 8, false, true);

        ctx.fillStyle = kpi.color;
        ctx.font = 'bold 18px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText(kpi.val, kpiX + 12, currentY + 26);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
        ctx.fillText(kpi.label, kpiX + 12, currentY + 43);

        kpiX += kpiWidth + 10;
      });

      currentY += 72;

      // -------------------------------------------------------------
      // TABLA: Encabezados de Columna
      // -------------------------------------------------------------
      const colX = {
        num: 35,
        param: 75,
        cat: 340,
        medido: 480,
        limite: 620,
        estado: 780,
        diag: 920
      };

      ctx.fillStyle = '#0f172a';
      roundRect(ctx, 35, currentY, canvasWidth - 70, tableHeaderHeight, 6, true, false);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      roundRect(ctx, 35, currentY, canvasWidth - 70, tableHeaderHeight, 6, false, true);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText('#', colX.num + 10, currentY + 25);
      ctx.fillText('PARÁMETRO', colX.param, currentY + 25);
      ctx.fillText('CATEGORÍA', colX.cat, currentY + 25);
      ctx.fillText('VALOR MEDIDO', colX.medido, currentY + 25);
      ctx.fillText('LÍMITE NORMATIVO', colX.limite, currentY + 25);
      ctx.fillText('ESTADO', colX.estado, currentY + 25);
      ctx.fillText('DIAGNÓSTICO TÉCNICO', colX.diag, currentY + 25);

      currentY += tableHeaderHeight;

      // -------------------------------------------------------------
      // FILAS DE LA TABLA
      // -------------------------------------------------------------
      parametrosActivosCentral.forEach((param, idx) => {
        const evalRes = evaluaciones[param.id];
        const valor = valoresIngresados[param.id];
        const esPar = idx % 2 === 0;

        ctx.fillStyle = esPar ? '#080e1d' : '#050914';
        ctx.fillRect(35, currentY, canvasWidth - 70, rowHeight);

        ctx.strokeStyle = '#1e293b50';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(35, currentY + rowHeight);
        ctx.lineTo(canvasWidth - 35, currentY + rowHeight);
        ctx.stroke();

        // 1. Índice
        ctx.fillStyle = '#475569';
        ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText(String(idx + 1).padStart(2, '0'), colX.num + 10, currentY + 27);

        // 2. Parámetro
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        const nombreTrunc = truncarTexto(ctx, param.nombre, 245);
        ctx.fillText(nombreTrunc, colX.param, currentY + 21);

        ctx.fillStyle = '#64748b';
        ctx.font = '9.5px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText(`ID: ${param.id}`, colX.param, currentY + 35);

        // 3. Categoría
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.fillText(param.categoria, colX.cat, currentY + 26);

        // 4. Valor Medido
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace';
        const valTexto = valor !== undefined ? `${valor} ${param.rango.unidad}` : 'No medido';
        ctx.fillText(valTexto, colX.medido, currentY + 26);

        // 5. Límite Legal
        ctx.fillStyle = '#a7f3d0';
        ctx.font = '10.5px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText(formatoRango(param), colX.limite, currentY + 26);

        // 6. Estado (Badge)
        if (evalRes) {
          let badgeBg = '#064e3b';
          let badgeText = '#34d399';
          let badgeBorder = '#059669';
          let textoEstado = 'CUMPLE';

          if (evalRes.estado === 'ALERTA_PREVENTIVA') {
            badgeBg = '#78350f';
            badgeText = '#fbbf24';
            badgeBorder = '#d97706';
            textoEstado = 'ALERTA';
          } else if (evalRes.estado === 'NO_CUMPLE') {
            badgeBg = '#881337';
            badgeText = '#f87171';
            badgeBorder = '#e11d48';
            textoEstado = 'NO CUMPLE';
          }

          ctx.fillStyle = badgeBg;
          roundRect(ctx, colX.estado, currentY + 11, 105, 22, 11, true, false);
          ctx.strokeStyle = badgeBorder;
          ctx.lineWidth = 1;
          roundRect(ctx, colX.estado, currentY + 11, 105, 22, 11, false, true);

          ctx.fillStyle = badgeText;
          ctx.font = 'bold 9px ui-monospace, SFMono-Regular, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(textoEstado, colX.estado + 52.5, currentY + 25);
          ctx.textAlign = 'left';
        }

        // 7. Diagnóstico Técnico
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        const diagTexto = evalRes ? evalRes.diagnostico : 'Pendiente de medición';
        const diagTrunc = truncarTexto(ctx, diagTexto, 215);
        ctx.fillText(diagTrunc, colX.diag, currentY + 26);

        currentY += rowHeight;
      });

      // Borde contenedor de la tabla
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(35, currentY - (totalRows * rowHeight) - tableHeaderHeight, canvasWidth - 70, (totalRows * rowHeight) + tableHeaderHeight);

      currentY += 25;

      // -------------------------------------------------------------
      // FOOTER: Disclaimer Legal
      // -------------------------------------------------------------
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(35, currentY);
      ctx.lineTo(canvasWidth - 35, currentY);
      ctx.stroke();

      currentY += 18;
      ctx.fillStyle = '#64748b';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText('Nota Técnica Legal: Evaluación automatizada generada conforme a la normatividad ambiental vigente en Colombia (MADS / MinSalud).', 35, currentY);
      ctx.fillText('Este reporte computacional no reemplaza un informe oficial emitido y firmado por un laboratorio acreditado por el IDEAM.', 35, currentY + 14);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText('SIMA COLOMBIA • TECNOLOGÍA AMBIENTAL ABIERTA', canvasWidth - 35, currentY + 6);
      ctx.textAlign = 'left';

      // -------------------------------------------------------------
      // DESCARGA AUTOMÁTICA DEL PNG
      // -------------------------------------------------------------
      const dataUrl = canvas.toDataURL('image/png');
      const enlace = document.createElement('a');
      const timestampFichero = ahora.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      enlace.download = `SIMA-Reporte-Calidad-Agua-${tipoSeleccionado.toLowerCase()}-${timestampFichero}.png`;
      enlace.href = dataUrl;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);

      mensajeExportacion = '¡Imagen PNG exportada y descargada exitosamente!';
      setTimeout(() => {
        mensajeExportacion = null;
      }, 4000);
    } catch (err) {
      console.error('Error al exportar tabla como imagen:', err);
      mensajeExportacion = 'Ocurrió un error al generar la imagen.';
    } finally {
      exportandoImagen = false;
    }
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

    <!-- ÁREA CENTRAL (PUNTO 5): INPUTS Y TABLA DE PARÁMETROS ANALIZADOS -->
    <section class="lg:col-span-8 space-y-5">
      <!-- Header del Panel Central con Selector de Vistas y Botón de Exportación Rápida -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div>
          <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Mediciones Cuantitativas de Muestra</span>
            <span class="text-xs font-mono font-normal text-slate-400">
              ({parametrosActivosCentral.length} en evaluación)
            </span>
          </h2>
          <p class="text-[11px] text-slate-500">
            Digita los resultados de laboratorio o analiza la matriz de contraste normativo en tiempo real.
          </p>
        </div>

        <!-- Controles de Vista y Acción -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Selector de Modo de Visualización (Tarjetas / Tabla / Todo) -->
          <div class="flex items-center gap-1 bg-[#060a14] p-1 rounded-lg border border-white/10 select-none">
            <button
              type="button"
              onclick={() => vistaDerecha = 'TODOS'}
              class="px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer flex items-center gap-1.5 {vistaDerecha === 'TODOS' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}"
              title="Ver simultáneamente tarjetas de edición y tabla de resultados"
            >
              <Icon name="sliders" size={12} />
              <span>Todo</span>
            </button>
            <button
              type="button"
              onclick={() => vistaDerecha = 'TARJETAS'}
              class="px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer flex items-center gap-1.5 {vistaDerecha === 'TARJETAS' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}"
              title="Ver únicamente tarjetas de ajuste de parámetros"
            >
              <Icon name="sliders" size={12} />
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              onclick={() => vistaDerecha = 'TABLA'}
              class="px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer flex items-center gap-1.5 {vistaDerecha === 'TABLA' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}"
              title="Ver únicamente tabla resumen de parámetros analizados"
            >
              <Icon name="table" size={12} />
              <span>Tabla</span>
            </button>
          </div>

          <!-- Botón de Exportación Superior -->
          <button
            type="button"
            onclick={exportarReporteComoImagen}
            disabled={parametrosActivosCentral.length === 0 || exportandoImagen}
            class="min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95"
            title="Exporta y descarga un informe en alta definición (PNG) de la tabla analizada"
          >
            <Icon name={exportandoImagen ? 'download' : 'camera'} size={13} class={exportandoImagen ? 'animate-bounce' : ''} />
            <span>{exportandoImagen ? 'Generando...' : 'Guardar Imagen'}</span>
          </button>
        </div>
      </div>

      <!-- Notificación Toast tras exportar imagen -->
      {#if mensajeExportacion}
        <div
          class="p-3 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 animate-fade-in {mensajeExportacion.includes('exitosamente') ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'}"
        >
          <div class="flex items-center gap-2">
            <Icon name={mensajeExportacion.includes('exitosamente') ? 'check-circle' : 'alert-triangle'} size={15} />
            <span>{mensajeExportacion}</span>
          </div>
          <button
            type="button"
            onclick={() => mensajeExportacion = null}
            class="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      {/if}

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
        <!-- VISTA DE TARJETAS (INPUTS) -->
        {#if vistaDerecha === 'TODOS' || vistaDerecha === 'TARJETAS'}
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

        <!-- TABLA RESUMEN DE PARÁMETROS ANALIZADOS Y EXPORTACIÓN A IMAGEN (PNG) -->
        {#if vistaDerecha === 'TODOS' || vistaDerecha === 'TABLA'}
          <div class="bg-[#060a14] rounded-xl border border-white/[0.08] overflow-hidden shadow-xl space-y-0">
            <!-- Header de la Tabla -->
            <div class="p-4 bg-[#090f1f] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <Icon name="table" size={16} class="text-blue-400" />
                  <h3 class="font-bold text-xs uppercase tracking-wider text-white">
                    Tabla de Parámetros Analizados
                  </h3>
                  <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    {parametrosActivosCentral.length} variables
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">
                  Contraste legal en tiempo real según <span class="text-slate-300 font-mono">{normaActiva.norma}</span> ({normaActiva.titulo}).
                </p>
              </div>

              <!-- Botón Guardar como Imagen (PNG) -->
              <button
                type="button"
                onclick={exportarReporteComoImagen}
                disabled={exportandoImagen}
                class="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95 shrink-0"
              >
                <Icon name={exportandoImagen ? 'download' : 'camera'} size={15} class={exportandoImagen ? 'animate-bounce' : ''} />
                <span>{exportandoImagen ? 'Generando PNG...' : 'Guardar como Imagen (PNG)'}</span>
              </button>
            </div>

            <!-- Estructura Tabular Responsiva -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#0b1328] text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
                    <th class="py-3 px-3 w-10 text-center">#</th>
                    <th class="py-3 px-3 min-w-[180px]">Parámetro</th>
                    <th class="py-3 px-3 min-w-[110px]">Categoría</th>
                    <th class="py-3 px-3 min-w-[120px]">Valor Medido</th>
                    <th class="py-3 px-3 min-w-[130px]">Límite Legal</th>
                    <th class="py-3 px-3 min-w-[110px]">Estado</th>
                    <th class="py-3 px-3 min-w-[200px]">Diagnóstico Técnico</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/[0.04] font-mono">
                  {#each parametrosActivosCentral as param, i (param.id)}
                    {@const evalRes = evaluaciones[param.id]}
                    {@const valor = valoresIngresados[param.id]}
                    {@const esPar = i % 2 === 0}

                    <tr class="transition-colors hover:bg-white/[0.03] {esPar ? 'bg-[#060a14]' : 'bg-[#040711]'}">
                      <!-- 1. Índice -->
                      <td class="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {String(i + 1).padStart(2, '0')}
                      </td>

                      <!-- 2. Nombre del Parámetro -->
                      <td class="py-3 px-3">
                        <div class="font-sans font-medium text-slate-100 text-xs leading-snug">
                          {param.nombre}
                        </div>
                        <div class="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {param.id}
                        </div>
                      </td>

                      <!-- 3. Categoría -->
                      <td class="py-3 px-3">
                        <span class="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] inline-block">
                          {param.categoria}
                        </span>
                      </td>

                      <!-- 4. Valor Medido -->
                      <td class="py-3 px-3">
                        <div class="font-bold text-sky-400 text-xs">
                          {valor !== undefined ? valor : '—'}
                          <span class="text-[10px] font-normal text-slate-400 ml-1">
                            {param.rango.unidad}
                          </span>
                        </div>
                      </td>

                      <!-- 5. Límite Legal -->
                      <td class="py-3 px-3">
                        <div class="text-emerald-400 font-semibold text-xs">
                          {formatoRango(param)}
                        </div>
                        <div class="text-[9px] text-slate-500 truncate max-w-[130px] mt-0.5" title={param.normaLegal}>
                          {param.normaLegal}
                        </div>
                      </td>

                      <!-- 6. Estado de Conformidad -->
                      <td class="py-3 px-3">
                        {#if evalRes}
                          <span
                            class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                            style="color: {evalRes.ui.colorHex}; background-color: {evalRes.ui.colorHex}15; border: 1px solid {evalRes.ui.colorHex}40;"
                          >
                            <span class="w-1.5 h-1.5 rounded-full" style="background-color: {evalRes.ui.colorHex};"></span>
                            <span>{evalRes.estado.replace('_', ' ')}</span>
                          </span>
                        {:else}
                          <span class="text-[10px] text-slate-600 font-mono">
                            PENDIENTE
                          </span>
                        {/if}
                      </td>

                      <!-- 7. Diagnóstico Técnico -->
                      <td class="py-3 px-3">
                        {#if evalRes}
                          <div class="flex items-start gap-1.5" style="color: {evalRes.ui.colorHex};">
                            <Icon
                              name={evalRes.estado === 'CUMPLE' ? 'check' : evalRes.estado === 'ALERTA_PREVENTIVA' ? 'alert-triangle' : 'x'}
                              size={13}
                              class="shrink-0 mt-0.5"
                            />
                            <p class="font-sans text-[11px] text-slate-300 leading-snug">
                              {evalRes.diagnostico}
                            </p>
                          </div>
                        {:else}
                          <span class="text-[11px] font-sans text-slate-600">
                            Sin datos cuantitativos ingresados
                          </span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <!-- Barra Inferior de Métricas Resumen de la Tabla -->
            <div class="p-3 bg-[#080e1e] border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div class="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                <span>Total: <strong class="text-white">{metricas.total}</strong></span>
                <span class="text-emerald-400">● {metricas.conformes} Conformes</span>
                <span class="text-amber-400">● {metricas.alertas} Alerta</span>
                <span class="text-rose-400">● {metricas.noConformes} No Conformes</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-slate-500 text-[11px]">Conformidad:</span>
                <span class="px-2 py-0.5 rounded font-bold text-xs {metricas.porcentaje >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : metricas.porcentaje >= 50 ? 'bg-amber-950 text-amber-400 border border-amber-800/40' : 'bg-rose-950 text-rose-400 border border-rose-800/40'}">
                  {metricas.porcentaje}%
                </span>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </section>
  </div>
</div>
