<!--
  @file ModalAlerta.svelte
  @description Componente modal accesible para alertar módulos en desarrollo.
  
  Patrones y Arquitectura:
  - Svelte 5 Runes: Uso de `$props()` con macro `$bindable()` para two-way state binding.
  - Accessibility (a11y): Soporte de teclado (Escape key dismissal) y ARIA attributes (dialog, modal).
  - Minimal Design: Contraste sobrio en negro, azul marino y verde, sin ruido visual.
-->
<script lang="ts">
  import Icon from './icons/Icon.svelte';

  // Props tipadas estrictas con Svelte 5 runes
  let { 
    visible = $bindable(false), 
    titulo = "Módulo en Desarrollo", 
    mensaje = "Próximamente...",
    icono = "construction"
  } = $props<{
    visible?: boolean;
    titulo?: string;
    mensaje?: string;
    icono?: string;
  }>();

  /**
   * Cierra el modal y restablece el estado reactivo
   */
  function cerrarModal(): void {
    visible = false;
  }

  /**
   * Keyboard handler para accesibilidad estándar (dismiss on Escape)
   */
  function manejarTeclado(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      cerrarModal();
    }
  }
</script>

<svelte:window onkeydown={manejarTeclado} />

{#if visible}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-titulo"
  >
    <!-- Backdrop Click Dismissal -->
    <button 
      type="button" 
      class="fixed inset-0 w-full h-full cursor-default -z-10 focus:outline-none" 
      onclick={cerrarModal} 
      aria-label="Cerrar modal"
    ></button>

    <!-- Modal Card Surface -->
    <div class="relative w-full max-w-sm p-6 rounded-2xl bg-[#090e19] border border-white/10 shadow-2xl text-center">
      <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400">
        <Icon name={icono} size={24} />
      </div>

      <span class="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-mono uppercase tracking-wider text-blue-400 bg-blue-950/50 border border-blue-800/40 rounded-md">
        En Construcción
      </span>

      <h3 id="modal-titulo" class="text-base font-bold text-white mb-1">
        {titulo}
      </h3>

      <p class="text-xl font-bold text-emerald-400 font-mono my-3">
        {mensaje}
      </p>

      <p class="text-xs text-slate-400 mb-5 leading-relaxed">
        Las matrices normativas para este componente se están estandarizando. Puedes acceder ahora al módulo operativo de <strong>Muestreo de Agua</strong>.
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={cerrarModal}
          class="flex-1 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-white/10 transition cursor-pointer"
        >
          Cerrar
        </button>
        <a
          href="/agua"
          class="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition text-center shadow-sm"
        >
          Ir a Agua →
        </a>
      </div>
    </div>
  </div>
{/if}
