<!--
  @file FooterLegal.svelte
  @description Pie de página institucional que integra los enlaces de cumplimiento normativo,
  descargo de responsabilidad y apertura interactiva del ModalLegal.
-->
<script lang="ts">
  import ModalLegal from './ModalLegal.svelte';

  let modalVisible = $state(false);

  function abrirModalLegal(): void {
    modalVisible = true;
  }
</script>

<footer class="mt-auto border-t border-white/[0.06] bg-[#02050c] py-5 text-xs text-slate-500">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <span class="text-slate-400 font-medium">SIMA Colombia</span>
      <span class="text-slate-600">•</span>
      <span class="text-[11px] font-mono text-slate-500">Proyecto de Práctica Personal (Fines Educativos)</span>
    </div>

    <!-- Enlaces Legales & Regulatorios -->
    <div class="flex items-center gap-4 text-[11px] font-mono">
      <button
        type="button"
        onclick={abrirModalLegal}
        class="text-slate-400 hover:text-blue-400 transition cursor-pointer flex items-center gap-1 underline underline-offset-4 decoration-white/10 hover:decoration-blue-400"
      >
        <span>⚖️</span>
        <span>Aviso Legal & Licencia</span>
      </button>

      <a
        href="/legal"
        class="text-slate-400 hover:text-emerald-400 transition underline underline-offset-4 decoration-white/10 hover:decoration-emerald-400"
      >
        Términos Oficiales ↗
      </a>

      <span class="hidden md:inline text-slate-600">
        Res. 2115/2007 • Res. 0631/2015 • Dec. 1076/2015
      </span>
    </div>
  </div>
</footer>

<!-- Modal Legal Interactivo -->
<ModalLegal bind:visible={modalVisible} />
