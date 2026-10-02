<!--
  @file Navbar.svelte
  @description Barra de navegación institucional SIMA Colombia basada en el rediseño Stitch.
  Soporta alternancia fluida entre Modo Oscuro y Modo Claro, barra de herramientas de accesibilidad
  (zoom tipográfico, alto contraste, selector de temas) e integración del nuevo emblema institucional.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './icons/Icon.svelte';
  import ModalAlerta from './ModalAlerta.svelte';

  let tema = $state<'dark' | 'light'>('dark');
  let escalaTexto = $state<number>(1);
  let altoContraste = $state<boolean>(false);
  let menuMovilAbierto = $state<boolean>(false);
  let modalSueloVisible = $state<boolean>(false);

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
    // Sincronizar tema inicial desde localStorage o clase en <html>
    const temaGuardado = localStorage.getItem('theme');
    if (temaGuardado === 'light') {
      aplicarTema('light');
    } else if (temaGuardado === 'dark') {
      aplicarTema('dark');
    } else {
      const esOscuro = document.documentElement.classList.contains('dark') || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      aplicarTema(esOscuro ? 'dark' : 'light');
    }

    // Observador para cambios externos en atributos de <html>
    const observer = new MutationObserver(() => {
      const esOscuro = document.documentElement.classList.contains('dark') || 
        document.documentElement.getAttribute('data-theme') === 'dark';
      tema = esOscuro ? 'dark' : 'light';
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    return () => observer.disconnect();
  });

  function toggleTheme(): void {
    const nuevoTema = tema === 'dark' ? 'light' : 'dark';
    aplicarTema(nuevoTema);
    try {
      localStorage.setItem('theme', nuevoTema);
    } catch (_) {}
    // Disparar evento para componentes que requieran sincronizar UI dependiente del tema
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

<header class="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#0f1419]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] transition-colors duration-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
    <!-- Brand / Emblema Oficial -->
    <a href="/" class="flex items-center gap-3 shrink-0 group focus:outline-none">
      <img
        src="/logo.png"
        alt="Emblema Oficial SIMA Colombia"
        width="36"
        height="36"
        class="h-9 w-9 object-contain rounded-xl shadow-sm border border-emerald-500/20 group-hover:scale-105 transition-transform"
      />
      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <span class="font-bold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            SIMA Colombia
          </span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            Fines Educativos
          </span>
        </div>
        <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Simulador de Calidad Ambiental
        </span>
      </div>
    </a>

    <!-- Navegación de Escritorio -->
    <nav class="hidden lg:flex items-center gap-1.5 text-xs font-medium">
      <a
        href="/"
        class="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#00f5d4]/15 text-emerald-800 dark:text-[#00f5d4] font-semibold border border-emerald-200/60 dark:border-[#00f5d4]/30 transition"
      >
        Inicio
      </a>
      <a
        href="/agua"
        class="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Muestreo de Agua</span>
      </a>
      <button
        type="button"
        onclick={() => modalSueloVisible = true}
        class="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
      >
        Suelo
      </button>
      <a
        href="https://www.minambiente.gov.co"
        target="_blank"
        rel="noopener noreferrer"
        class="px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1"
      >
        <span>Normativa MinAmbiente</span>
        <span class="text-[10px] font-mono">↗</span>
      </a>
    </nav>

    <!-- Barra de Herramientas de Accesibilidad Universal (WCAG 2.2 AAA) -->
    <div class="flex items-center gap-2 shrink-0">
      <div
        class="flex items-center bg-slate-100 dark:bg-[#171c21] rounded-xl p-1 border border-slate-200 dark:border-white/10"
        role="toolbar"
        aria-label="Herramientas de Accesibilidad"
      >
        <!-- Toggle Modo Claro / Oscuro -->
        <button
          type="button"
          onclick={toggleTheme}
          class="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 shadow-sm transition cursor-pointer flex items-center justify-center"
          title={tema === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label="Alternar tema claro y oscuro"
        >
          <Icon name={tema === 'dark' ? 'sun' : 'moon'} size={15} class={tema === 'dark' ? 'text-amber-400' : 'text-slate-700'} />
        </button>

        <!-- Reducir Tamaño de Texto -->
        <button
          type="button"
          onclick={() => ajustarTexto(-0.05)}
          class="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 font-mono text-[11px] font-bold transition cursor-pointer"
          title="Reducir tamaño del texto (A-)"
          aria-label="Reducir tamaño tipográfico"
        >
          A-
        </button>

        <!-- Aumentar Tamaño de Texto -->
        <button
          type="button"
          onclick={() => ajustarTexto(0.05)}
          class="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 font-mono text-[11px] font-bold transition cursor-pointer"
          title="Aumentar tamaño del texto (A+)"
          aria-label="Aumentar tamaño tipográfico"
        >
          A+
        </button>

        <!-- Toggle Alto Contraste -->
        <button
          type="button"
          onclick={toggleAltoContraste}
          class="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center {altoContraste ? 'bg-emerald-500/20 text-emerald-500' : ''}"
          title="Alternar contraste reforzado"
          aria-label="Modo alto contraste"
        >
          <Icon name="contrast" size={15} />
        </button>
      </div>

      <!-- Avatar Indicador de Entorno Científico -->
      <div
        class="w-8 h-8 rounded-full bg-emerald-600 dark:bg-[#00dfc1] text-white dark:text-[#00382f] flex items-center justify-center shadow-sm select-none"
        title="Perfil de Operador Ambiental"
        aria-hidden="true"
      >
        <Icon name="user" size={16} />
      </div>

      <!-- Botón de Menú Móvil (< lg) -->
      <button
        type="button"
        onclick={() => menuMovilAbierto = !menuMovilAbierto}
        class="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
        aria-label="Abrir menú de navegación"
        aria-expanded={menuMovilAbierto}
      >
        <Icon name={menuMovilAbierto ? 'x' : 'sliders'} size={18} />
      </button>
    </div>
  </div>

  <!-- Menú Desplegable en Móvil -->
  {#if menuMovilAbierto}
    <div class="lg:hidden px-4 pt-2 pb-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1419] flex flex-col gap-2 text-xs font-medium animate-fade-in">
      <a
        href="/"
        onclick={() => menuMovilAbierto = false}
        class="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-[#00f5d4]/15 text-emerald-800 dark:text-[#00f5d4] font-semibold"
      >
        Inicio
      </a>
      <a
        href="/agua"
        onclick={() => menuMovilAbierto = false}
        class="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Muestreo de Calidad de Agua</span>
      </a>
      <button
        type="button"
        onclick={() => { menuMovilAbierto = false; modalSueloVisible = true; }}
        class="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
      >
        Muestreo de Suelo (Próximamente)
      </button>
      <a
        href="https://www.minambiente.gov.co"
        target="_blank"
        rel="noopener noreferrer"
        class="px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between"
      >
        <span>Normativa MinAmbiente</span>
        <span class="font-mono">↗</span>
      </a>
    </div>
  {/if}
</header>

<!-- Modal Informativo para Muestreo de Suelo -->
<ModalAlerta
  bind:visible={modalSueloVisible}
  titulo="Módulo Edafológico (Suelo)"
  mensaje="Fase 2 en Modelado"
  icono="sprout"
/>
