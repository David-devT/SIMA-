<!--
  @file FooterLegal.svelte
  @description Pie de página institucional rediseñado con el estilo oficial Stitch (SIMA TUI.v2).
-->
<script lang="ts">
  import ModalLegal from './ModalLegal.svelte';

  let modalVisible = $state(false);

  function abrirModalLegal(): void {
    modalVisible = true;
  }
</script>

<footer class="w-full bg-[#060f18] mt-auto border-t border-[#25445a] py-4 text-on-surface-variant font-mono text-[11px] select-none">
  <div class="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <span class="text-primary font-bold tracking-wider uppercase">SIMA Colombia</span>
      <span class="text-outline-variant hidden sm:inline">|</span>
      <span class="text-on-surface-variant text-[11px]">Red Nacional de Telemetría y Calidad Hídrica</span>
    </div>

    <div class="flex items-center gap-4 text-on-surface-variant text-[10px]">
      <span class="flex items-center gap-1.5 text-primary font-bold">
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        DATALINK ESTABLE
      </span>
      <span class="text-tactical-wirelight">|</span>
      <button 
        type="button" 
        onclick={abrirModalLegal} 
        class="hover:text-primary transition-colors cursor-pointer underline underline-offset-2 decoration-outline-variant/40"
      >
        Aviso Legal
      </button>
      <span class="opacity-60">© 2024–2026 SIMA. Protocolo TUI-3A</span>
    </div>
  </div>
</footer>

<ModalLegal bind:visible={modalVisible} />
