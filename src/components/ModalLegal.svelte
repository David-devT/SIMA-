<!--
  @file ModalLegal.svelte
  @description Componente modal accesible que despliega el marco legal, descargo de
  responsabilidad técnica y términos de licencia MIT para la República de Colombia.
  
  Consideraciones de Accesibilidad & Estilo:
  - Diseño Bimodal (WCAG 2.2 AAA): Adaptación fluida entre Modo Claro y Modo Oscuro.
  - Teclado y Foco: Cierre con tecla Escape, trampa de interacción por backdrop y roles ARIA.
  - Compliance Legal: Art. 41 Ley 23/1982, Decreto 1076/2015 (IDEAM), Ley 1581/2012 (Habeas Data).
-->
<script lang="ts">
  import Icon from './icons/Icon.svelte';

  // Propiedad bidireccional vinculada al estado de visibilidad
  let { visible = $bindable(false) } = $props<{ visible?: boolean }>();

  // Pestaña de contenido activa en el modal
  let seccionActiva = $state<'DISCLAIMER' | 'IDEAM' | 'LICENCIA' | 'DATOS'>('DISCLAIMER');

  /**
   * Cierra el diálogo modal
   */
  function cerrar(): void {
    visible = false;
  }

  /**
   * Listener global de teclado: permite cerrar el modal presionando Escape
   */
  function manejarTeclado(e: KeyboardEvent): void {
    if (e.key === 'Escape') cerrar();
  }
</script>

<svelte:window onkeydown={manejarTeclado} />

{#if visible}
  <!-- ======================================================================
       CONTENEDOR DIALOG Y BACKDROP OSCURO
       ====================================================================== -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-legal-titulo"
  >
    <!-- Capa invisible para cerrar al hacer clic en el fondo -->
    <button
      type="button"
      class="fixed inset-0 w-full h-full cursor-default -z-10 focus:outline-none"
      onclick={cerrar}
      aria-label="Cerrar modal legal"
    ></button>

    <!-- Superficie Principal del Modal -->
    <div class="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-[#070c17] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden text-left">
      
      <!-- ====================================================================
           HEADER DEL MODAL
           ==================================================================== -->
      <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between bg-slate-50 dark:bg-[#040812]">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-sky-100 dark:bg-blue-950/60 border border-sky-300 dark:border-blue-500/30 flex items-center justify-center text-sky-700 dark:text-blue-400">
            <Icon name="scale" size={16} />
          </div>
          <div>
            <h2 id="modal-legal-titulo" class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Aviso de Práctica Personal, Fines Educativos y Licencia
            </h2>
            <p class="text-[11px] font-mono text-teal-700 dark:text-blue-400 font-medium">
              Proyecto de Aprendizaje y Estudio Individual • República de Colombia
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={cerrar}
          class="min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition text-sm cursor-pointer"
          aria-label="Cerrar modal legal"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <!-- ====================================================================
           PESTAÑAS DE NAVEGACIÓN INTERNA
           ==================================================================== -->
      <div class="flex items-center gap-1.5 p-2 bg-slate-100 dark:bg-[#050914] border-b border-slate-200 dark:border-white/[0.04] overflow-x-auto text-[11px] font-mono">
        <button
          type="button"
          onclick={() => seccionActiva = 'DISCLAIMER'}
          class="min-h-[36px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 {seccionActiva === 'DISCLAIMER' ? 'bg-white dark:bg-blue-950/80 text-teal-800 dark:text-blue-400 font-bold border border-slate-300 dark:border-blue-500/30 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
        >
          1. Alcance & Validez
        </button>
        <button
          type="button"
          onclick={() => seccionActiva = 'IDEAM'}
          class="min-h-[36px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 {seccionActiva === 'IDEAM' ? 'bg-white dark:bg-blue-950/80 text-teal-800 dark:text-blue-400 font-bold border border-slate-300 dark:border-blue-500/30 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
        >
          2. Acreditación IDEAM
        </button>
        <button
          type="button"
          onclick={() => seccionActiva = 'LICENCIA'}
          class="min-h-[36px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 {seccionActiva === 'LICENCIA' ? 'bg-white dark:bg-blue-950/80 text-teal-800 dark:text-blue-400 font-bold border border-slate-300 dark:border-blue-500/30 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
        >
          3. Licencia MIT
        </button>
        <button
          type="button"
          onclick={() => seccionActiva = 'DATOS'}
          class="min-h-[36px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 {seccionActiva === 'DATOS' ? 'bg-white dark:bg-blue-950/80 text-teal-800 dark:text-blue-400 font-bold border border-slate-300 dark:border-blue-500/30 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
        >
          4. Datos & Privacidad
        </button>
      </div>

      <!-- ====================================================================
           CUERPO DE CONTENIDO POR PESTAÑA
           ==================================================================== -->
      <div class="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        {#if seccionActiva === 'DISCLAIMER'}
          <div class="space-y-3">
            <div class="p-3.5 rounded-xl bg-sky-50 dark:bg-blue-950/40 border border-sky-200 dark:border-blue-500/30 text-sky-950 dark:text-blue-300">
              <span class="flex items-center gap-1.5 font-bold text-xs mb-1">
                <Icon name="academic" size={14} class="text-sky-600 dark:text-blue-400" />
                <span>Proyecto de Práctica Personal:</span>
              </span>
              Esta aplicación fue desarrollada por su autor con <strong>fines estrictamente educativos, académicos y de práctica personal</strong> en desarrollo web y simulación de normatividad ambiental. No constituye un servicio comercial ni una plataforma oficial de ninguna entidad gubernamental.
            </div>

            <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-300">
              <span class="flex items-center gap-1.5 font-bold text-xs mb-1">
                <Icon name="shield-check" size={14} class="text-emerald-600 dark:text-emerald-400" />
                <span>Fundamento de Libre Reproducción:</span>
              </span>
              De conformidad con el <strong>Artículo 41 de la Ley 23 de 1982</strong> de la República de Colombia, las leyes, decretos y resoluciones oficiales son de dominio público y su estudio/reproducción con fines pedagógicos y técnicos es completamente lícito.
            </div>

            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Carácter Informativo y Simulación Didáctica</h4>
            <p>
              SIMA Colombia es un simulador académico. Las evaluaciones y diagnósticos automáticos generados por el algoritmo <strong>no tienen valor legal vinculante ni sustituyen peritajes oficiales</strong> ante autoridades ambientales (CAR, ANLA, MinAmbiente, MinSalud).
            </p>
          </div>
        {:else if seccionActiva === 'IDEAM'}
          <div class="space-y-3">
            <div class="p-3.5 rounded-xl bg-sky-50 dark:bg-blue-950/30 border border-sky-200 dark:border-blue-500/20 text-sky-950 dark:text-blue-300">
              <span class="flex items-center gap-1.5 font-bold text-xs mb-1">
                <Icon name="scale" size={14} class="text-sky-600 dark:text-blue-400" />
                <span>Exigencia de Acreditación Oficial:</span>
              </span>
              Conforme al <strong>Decreto 1076 de 2015</strong>, los análisis físicos, químicos e hidrobiológicos con validez jurídica oficial deben ser ejecutados por laboratorios acreditados por el <strong>IDEAM</strong>.
            </div>

            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Norma Técnica NTC-ISO/IEC 17025</h4>
            <p>
              Para que una caracterización de aguas o vertimientos tenga validez en procesos regulatorios en Colombia, debe cumplir con la cadena de custodia, calibración metrológica y métodos estandarizados (Standard Methods) ejecutados por personal idóneo acreditado por el Instituto de Hidrología, Meteorología y Estudios Ambientales (IDEAM).
            </p>
            <p class="text-slate-500 dark:text-slate-400">
              Este software sirve como apoyo analítico preliminar para operadores de plantas (PTAR / PTAP), ingenieros sanitarios y estudiantes, pero no reemplaza el ensayo pericial de laboratorio.
            </p>
          </div>
        {:else if seccionActiva === 'LICENCIA'}
          <div class="space-y-3">
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Licencia de Código Abierto MIT</h4>
            <p class="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#02050c] p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06]">
              El software se entrega "TAL CUAL" ("AS IS"), sin garantías de ninguna índole, expresas o implícitas. En ningún caso los autores o titulares del derecho de autor serán responsables por reclamos, daños o perjuicios que surjan del uso del software o de decisiones operativas tomadas con base en sus cálculos.
            </p>
            <p>
              El código fuente puede ser utilizado, auditado, adaptado y distribuido conforme a los términos de la Licencia MIT contenida en el archivo <code class="text-teal-700 dark:text-emerald-400 font-semibold font-mono">LICENSE</code> del repositorio.
            </p>
          </div>
        {:else if seccionActiva === 'DATOS'}
          <div class="space-y-3">
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Cumplimiento de la Ley 1581 de 2012 (Habeas Data)</h4>
            <p>
              SIMA Colombia procesa los valores analíticos <strong>exclusivamente en la memoria local del navegador del usuario (client-side execution)</strong>.
            </p>
            <ul class="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>No se transmiten datos de laboratorio a servidores remotos ni se almacenan en bases de datos externas.</li>
              <li>No se recopila información personal identificable (PII), coordenadas geográficas ni datos sensibles de empresas.</li>
              <li>El usuario tiene el control total de sus mediciones, las cuales se limpian al cerrar la sesión del navegador.</li>
            </ul>
          </div>
        {/if}
      </div>

      <!-- ====================================================================
           FOOTER DEL MODAL
           ==================================================================== -->
      <div class="p-3 sm:p-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#040812] flex items-center justify-between">
        <a
          href="/legal"
          class="text-[11px] font-mono text-teal-700 dark:text-blue-400 hover:underline font-semibold"
        >
          Ver página legal completa →
        </a>
        <button
          type="button"
          onclick={cerrar}
          class="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm active:scale-95"
        >
          Entendido y Conforme
        </button>
      </div>

    </div>
  </div>
{/if}
