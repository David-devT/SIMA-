<!--
  @file Navbar.svelte
  @description Barra de navegación institucional SIMA Colombia basada exactamente en el diseño Stitch (SIMA TUI.v2).
-->
<script lang="ts">
  import { onMount } from 'svelte';

  let tema = $state<'dark' | 'light'>('dark');
  let escalaTexto = $state<number>(1);
  let altoContraste = $state<boolean>(false);
  let menuHerramientasAbierto = $state<boolean>(false);
  let rutaActual = $state<string>('/');

  function aplicarTema(nuevoTema: 'dark' | 'light'): void {
    tema = nuevoTema;
    if (nuevoTema === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      rutaActual = window.location.pathname;
      const temaGuardado = localStorage.getItem('theme');
      if (temaGuardado === 'light') {
        aplicarTema('light');
      } else {
        aplicarTema('dark');
      }

      const observer = new MutationObserver(() => {
        const esOscuro = document.documentElement.classList.contains('dark') || 
          document.documentElement.getAttribute('data-theme') === 'dark';
        tema = esOscuro ? 'dark' : 'light';
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

      return () => observer.disconnect();
    }
  });

  function toggleTheme(): void {
    const nuevoTema = tema === 'dark' ? 'light' : 'dark';
    aplicarTema(nuevoTema);
    try {
      localStorage.setItem('theme', nuevoTema);
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: nuevoTema } }));
  }

  function ajustarTexto(delta: number): void {
    escalaTexto = Math.max(0.85, Math.min(1.25, Number((escalaTexto + delta).toFixed(2))));
    document.documentElement.style.fontSize = `${escalaTexto * 100}%`;
  }

  function toggleAltoContraste(): void {
    altoContraste = !altoContraste;
    document.documentElement.classList.toggle('high-contrast', altoContraste);
  }
</script>

<header class="fixed top-0 w-full z-50 bg-[#060f18]/90 dark:bg-[#060f18]/90 backdrop-blur-xl border-b border-[#25445a] shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
  <div class="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
    <!-- Brand SIMA TUI.v2 -->
    <div class="flex items-center gap-3">
      <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      <a class="font-mono text-base tracking-wider font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-2" href="/">
        SIMA
        <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-primary tracking-widest font-normal border border-outline-variant/30">
          TUI.v2
        </span>
      </a>
    </div>

    <!-- Desktop Navigation Links -->
    <nav class="hidden md:flex items-center gap-2">
      <a 
        class="px-3 py-1 font-mono text-[11px] tracking-wider transition-colors rounded {rutaActual === '/' ? 'bg-secondary-container text-on-secondary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}" 
        href="/"
      >
        Inicio
      </a>
      <a 
        class="px-3 py-1 font-mono text-[11px] tracking-wider transition-colors rounded {rutaActual.startsWith('/agua') ? 'bg-secondary-container text-on-secondary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}" 
        href="/agua"
      >
        Analizador de Agua
      </a>
      <a 
        class="px-3 py-1 font-mono text-[11px] tracking-wider transition-colors rounded {rutaActual.startsWith('/legal') ? 'bg-secondary-container text-on-secondary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}" 
        href="/legal"
      >
        Normativas
      </a>
      <a 
        class="px-3 py-1 font-mono text-[11px] tracking-wider transition-colors rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface" 
        href="/legal#marco-juridico"
      >
        Contacto / Acerca de
      </a>
    </nav>

    <!-- Telemetry Status Ribbon & Profile/Accessibility Tools -->
    <div class="flex items-center gap-3">
      <div class="hidden sm:flex items-center gap-1.5 text-on-surface-variant font-mono text-[10px] tracking-tight">
        <span class="text-primary font-bold">SYS_ONLINE</span>
        <span class="opacity-40">//</span>
        <span>COL_BASIN_NET</span>
      </div>

      <!-- Accessibility / Settings Quick Menu -->
      <div class="relative">
        <button 
          type="button"
          onclick={() => menuHerramientasAbierto = !menuHerramientasAbierto}
          class="w-8 h-8 rounded-full bg-primary hover:bg-primary-fixed text-on-primary flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          title="Herramientas y Perfil"
          aria-label="Herramientas y Perfil"
        >
          <span class="material-symbols-outlined text-[18px]">person</span>
        </button>

        {#if menuHerramientasAbierto}
          <div class="absolute right-0 mt-2 w-64 bg-surface-container border border-outline-variant/40 rounded-xl p-3 shadow-2xl z-50 text-xs font-mono">
            <div class="text-[10px] uppercase text-primary font-bold tracking-wider mb-2 pb-1 border-b border-outline-variant/20 flex items-center justify-between">
              <span>Terminal Operator</span>
              <span class="text-secondary font-normal">[OP_042]</span>
            </div>

            <div class="space-y-2">
              <button 
                type="button"
                onclick={toggleTheme}
                class="w-full flex items-center justify-between p-2 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] text-primary">
                    {tema === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                  Tema Visual
                </span>
                <span class="text-secondary uppercase">{tema}</span>
              </button>

              <button 
                type="button"
                onclick={toggleAltoContraste}
                class="w-full flex items-center justify-between p-2 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] text-primary">contrast</span>
                  Alto Contraste
                </span>
                <span class="text-secondary">{altoContraste ? 'ON' : 'OFF'}</span>
              </button>

              <div class="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface">
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] text-primary">format_size</span>
                  Escala
                </span>
                <div class="flex items-center gap-1">
                  <button 
                    type="button" 
                    onclick={() => ajustarTexto(-0.05)}
                    class="w-6 h-6 rounded bg-surface-container-high hover:bg-primary hover:text-on-primary flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span class="text-[10px] w-8 text-center">{Math.round(escalaTexto * 100)}%</span>
                  <button 
                    type="button" 
                    onclick={() => ajustarTexto(0.05)}
                    class="w-6 h-6 rounded bg-surface-container-high hover:bg-primary hover:text-on-primary flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>
