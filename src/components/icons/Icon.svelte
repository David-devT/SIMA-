<!--
  @file Icon.svelte
  @description Componente SVG minimalista de alta precisión basado en la iconografía técnica Lucide.
  Reemplaza el uso de emojis por vectores monocromáticos que respetan la paleta técnica (#030712, esmeralda, azul).
-->
<script lang="ts">
  export type IconName =
    | 'sprout'
    | 'droplet'
    | 'home'
    | 'factory'
    | 'leaf'
    | 'mountain'
    | 'scale'
    | 'wind'
    | 'volume'
    | 'flask'
    | 'sliders'
    | 'clipboard'
    | 'check'
    | 'check-circle'
    | 'alert-triangle'
    | 'x'
    | 'x-circle'
    | 'construction'
    | 'academic'
    | 'shield-check'
    | 'table'
    | 'camera'
    | 'download';

  interface Props {
    name: IconName | string;
    size?: number | string;
    class?: string;
    strokeWidth?: number | string;
  }

  let {
    name,
    size = 18,
    class: className = '',
    strokeWidth = 2
  }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class="inline-block shrink-0 select-none {className}"
  aria-hidden="true"
>
  {#if name === 'sprout'}
    <!-- Plántula / Semillero / Biomasa -->
    <path d="M7 20h10" />
    <path d="M12 20v-9" />
    <path d="M12 11c-2.5-3-6-3-8 0 0 3 2.5 5 8 5" />
    <path d="M12 11c2.5-3 6-3 8 0 0 3-2.5 5-8 5" />
  {:else if name === 'droplet'}
    <!-- Gota de agua potable / Monitoreo hídrico -->
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  {:else if name === 'home'}
    <!-- Vivienda / Efluente Doméstico (ARD) -->
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  {:else if name === 'factory'}
    <!-- Industria / Efluente No Doméstico (ARnD) -->
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M17 18h1" />
    <path d="M12 18h1" />
    <path d="M7 18h1" />
  {:else if name === 'leaf'}
    <!-- Hoja / Flora y Fauna Acuática -->
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  {:else if name === 'mountain'}
    <!-- Montaña / Bocatoma / Captación hídrica -->
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    <path d="m4.14 15.08 3.86-5.08 4 6" />
  {:else if name === 'scale'}
    <!-- Balanza de la justicia / Marco legal normativo -->
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  {:else if name === 'wind'}
    <!-- Viento / Calidad del aire -->
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  {:else if name === 'volume'}
    <!-- Sonido / Ruido ambiental -->
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  {:else if name === 'flask'}
    <!-- Matraz / Laboratorio químico y olores -->
    <path d="M10 2v7.31L4.17 19.4a2 2 0 0 0 1.66 3.03h12.34a2 2 0 0 0 1.66-3.03L14 9.31V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  {:else if name === 'sliders'}
    <!-- Deslizadores / Parámetros a configurar -->
    <line x1="4" x2="4" y1="21" y2="14" />
    <line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" />
    <line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" />
    <line x1="20" x2="20" y1="12" y2="3" />
    <line x1="1" x2="7" y1="14" y2="14" />
    <line x1="9" x2="15" y1="8" y2="8" />
    <line x1="17" x2="23" y1="16" y2="16" />
  {:else if name === 'clipboard'}
    <!-- Portapapeles vacío / Registro de laboratorio -->
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  {:else if name === 'check'}
    <!-- Checkmark simple -->
    <polyline points="20 6 9 17 4 12" />
  {:else if name === 'check-circle'}
    <!-- Checkmark circular / Conforme -->
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  {:else if name === 'alert-triangle'}
    <!-- Triángulo de advertencia / Alerta preventiva -->
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  {:else if name === 'x'}
    <!-- Cruz simple para cerrar -->
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  {:else if name === 'x-circle'}
    <!-- Círculo cruz / No conforme -->
    <circle cx="12" cy="12" r="10" />
    <line x1="15" x2="9" y1="9" y2="15" />
    <line x1="9" x2="15" y1="9" y2="15" />
  {:else if name === 'construction'}
    <!-- Llave inglesa / Próximamente en desarrollo -->
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  {:else if name === 'academic'}
    <!-- Birrete académico / Fines educativos -->
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  {:else if name === 'shield-check'}
    <!-- Escudo con verificación legal -->
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  {:else if name === 'table'}
    <!-- Tabla de datos analíticos -->
    <path d="M12 3v18" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
  {:else if name === 'camera'}
    <!-- Cámara / Captura de pantalla -->
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  {:else if name === 'download'}
    <!-- Descarga de archivo / Exportar -->
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  {:else}
    <!-- Fallback neutro -->
    <circle cx="12" cy="12" r="10" />
  {/if}
</svg>
