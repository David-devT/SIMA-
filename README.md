<div align="center">

# 💧 SIMA Colombia

### Sistema Integral de Monitoreo y Simulación de Calidad Ambiental

**Plataforma analítica para la pre-evaluación normativa y contraste técnico de parámetros de agua en la República de Colombia.**

[![Astro](https://img.shields.io/badge/Astro-7.x-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![Svelte](https://img.shields.io/badge/Svelte-5.x_Runes-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](./LICENSE)

</div>

---

> [!NOTE]
> **Declaración de Proyecto Personal y Fines Educativos:**  
> Este software fue concebido, diseñado y construido de forma independiente como un **ejercicio de práctica personal, aprendizaje técnico y exploración académica**. Su objetivo es investigar la aplicación de arquitecturas web modernas (Islands Architecture, Runes reactivos y estilos utilitarios) en la modelación algorítmica de la legislación ambiental colombiana. No constituye una plataforma gubernamental oficial ni un servicio pericial vinculante.

---

## 📌 Descripción

**SIMA Colombia** es una plataforma web interactiva de alto rendimiento desarrollada para simular y pre-evaluar el cumplimiento normativo de muestras fisicoquímicas y microbiológicas frente a las resoluciones ambientales vigentes emitidas por el Ministerio de Ambiente y Desarrollo Sostenible (MADS) y el Ministerio de la Protección Social (MPS).

La aplicación opera bajo un **motor de inferencia analítica determinista** que contrasta mediciones cuantitativas en tiempo real contra los topes máximos permisibles de la legislación nacional, diagnosticando cada parámetro en estados de **Conformidad**, **Alerta Preventiva** o **Incumplimiento Crítico**, citando de manera precisa el articulado legal y la resolución correspondiente.

Todo el procesamiento se ejecuta estrictamente en la memoria del navegador del cliente (**Client-Side Only**), garantizando cero persistencia de datos sensibles en la nube, máxima privacidad bajo la Ley de Habeas Data y una velocidad de respuesta instantánea.

---

## 🚀 Características Principales

- ⚡ **Islands Architecture (Arquitectura de Islas)**: Shell estático ultraligero impulsado por Astro con hidratación parcial aislada únicamente en los componentes con interactividad reactiva.
- 🔄 **Reactividad Quirúrgica con Svelte 5 (Runes)**: Gestión de estado reactivo mediante `$state` y selectores memorizados con `$derived`, eliminando la sobrecarga computacional del Virtual DOM.
- 🎯 **Preselección Inteligente (Noise Reduction)**: Al seleccionar cualquier norma, el sistema activa por defecto los 5 o 6 parámetros fundamentales obligatorios según la ley, permitiendo habilitar variables adicionales bajo demanda para evitar fatiga cognitiva.
- 📱 **Diseño Ergonómico y Accesibilidad Móvil (A11y)**:
  - Selector de normas en carrusel horizontal táctil (`snap-x`) para pantallas verticales.
  - Panel de selección de parámetros colapsable en teléfonos para enfocar la pantalla en las mediciones.
  - Soporte de `inputmode="decimal"` para despliegue automático del teclado numérico en smartphones.
  - Prevención de auto-zoom en iOS Safari (`text-base` en campos móviles) y áreas de toque ergonómicas (mínimo 40px).
- 🎛️ **Controles Stepper Adaptativos**: Entradas numéricas con micro-flechas desktop y botones táctiles dedicados (`+` / `−`) en móviles para evitar solapamientos con unidades complejas (`mg/L`, `UNT`, `UPC`, `UFC/100 mL`).
- 🧪 **Simulador de Escenarios de Prueba**: Modelación rápida con un clic para escenarios de *Conformidad*, *Alerta Preventiva* e *Incumplimiento Normativo*.
- 🎨 **Iconografía Vectorial SVG Nativa**: Sistema integral de iconos vectoriales SVG de alta precisión (`Icon.svelte`), sin uso de emojis heterogéneos, preservando una paleta sobria en negro carbón (`#030712`), verde esmeralda y azul técnico.
- 🔒 **Privacidad por Diseño (Cero Cookies)**: Sin cookies de rastreo, sin almacenamiento invasivo y sin transferencia de coordenadas ni parámetros a servidores externos.

---

## 🏗️ Arquitectura del Sistema

```text
sima-colombia/
├── public/                         # Activos estáticos públicos
│   ├── favicon.svg                 # Isotipo vectorial del sistema
│   └── robots.txt                  # Directivas de indexación
│
├── src/
│   ├── components/                 # Componentes interactivos de UI (Svelte 5)
│   │   ├── icons/                  # Sistema de iconografía vectorial SVG
│   │   │   └── Icon.svelte         # Catálogo SVG minimalista (Lucide-inspired)
│   │   ├── EvaluadorAgua.svelte    # Workbench analítico interactivo con menú desplegable
│   │   ├── LandingCards.svelte     # Catálogo principal de matrices ambientales
│   │   ├── ModalAlerta.svelte      # Diálogo accesible para módulos en desarrollo
│   │   ├── ModalLegal.svelte       # Modal con fundamentación legal y términos
│   │   └── FooterLegal.svelte      # Pie de página institucional con enlaces normativos
│   │
│   ├── data/                       # Capa de dominio y lógica legal
│   │   └── normativaAgua.ts        # Matriz legal completa y motor evaluarParametro()
│   │
│   ├── layouts/                    # Plantillas maestras de Astro (SSG Shell)
│   │   └── Layout.astro            # Layout base HTML con tipografía y navegación
│   │
│   ├── pages/                      # Enrutamiento estático de la aplicación
│   │   ├── index.astro             # Portada principal del sistema
│   │   ├── agua.astro              # Analizador especializado de calidad de agua
│   │   └── legal.astro             # Documento formal de términos, licencias y alcance
│   │
│   └── styles/
│       └── global.css              # Tokens de diseño, Tailwind CSS v4 y animaciones
│
├── astro.config.mjs                # Configuración del compilador Astro y Vite
├── LICENSE                         # Licencia MIT con anexo legal de la República de Colombia
├── package.json                    # Scripts del proyecto y dependencias de producción
├── pnpm-workspace.yaml             # Configuración de workspace pnpm
├── README.md                       # Documentación técnica principal
└── tsconfig.json                   # Configuración del compilador TypeScript (Strictest)
```

---

## 💻 Stack Tecnológico

| Tecnología | Versión | Propósito Arquitectónico |
|:---|:---:|:---|
| **Astro** | 7.x | Framework generador de sitios estáticos (SSG) e Islands Architecture |
| **Svelte** | 5.x | Runtime reactivo ultraligero (~3KB) mediante señales (*Runes*) |
| **Tailwind CSS** | 4.x | Motor de estilos de última generación con variables CSS nativas |
| **TypeScript** | Strict | Tipado estático de contratos legales, rangos y validadores |
| **Vite** | 6.x | Empaquetador modular y pipeline de compilación de producción |
| **pnpm** | 11.x | Gestor determinista de dependencias mediante enlaces duros |

---

## 📐 Matrices Normativas Incorporadas

El sistema implementa la parametrización oficial de **5 matrices normativas** de la República de Colombia:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SIMA COLOMBIA - MATRICES                              │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ├── 1. Agua para Consumo Humano (Agua Potable)
         │      └─ Resolución 2115 de 2007 (MinProtección / MinAmbiente)
         │         [pH, Turbiedad, Cloro Libre, Color, Conductividad, E. coli...]
         │
         ├── 2. Aguas Residuales Domésticas (ARD)
         │      └─ Resolución 0631 de 2015, Artículo 8 (Efluentes a cuerpos de agua)
         │         [DBO₅, DQO, Sólidos Suspendidos Totales, Grasas y Aceites, pH]
         │
         ├── 3. Aguas Residuales No Domésticas (ARnD)
         │      └─ Resolución 0631 de 2015, Artículo 10 (Descargas industriales/comerciales)
         │         [DBO₅, DQO, SST, Hidrocarburos Totales, SAAM, Metales Pesados]
         │
         ├── 4. Agua Superficial — Preservación de Flora y Fauna
         │      └─ Decreto 1076 de 2015 / Dec. 1594 de 1984 (Ecosistemas lénticos y lóticos)
         │         [Oxígeno Disuelto, pH, Temperatura, Criterios de vida acuática]
         │
         └── 5. Agua Superficial — Captación y Consumo Humano
                └─ Decreto 1076 de 2015, Título 9 (Admisibilidad en bocatomas)
                   [Criterios de agua cruda previo a desinfección y potabilización]
```

---

## ⚖️ Lógica de Evaluación y Reglas de Negocio

Cada parámetro ingresado es procesado por la función analítica `evaluarParametro(id, valor)` en tiempo constante $O(1)$:

```
           Valor Medido (x)
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
Operador ENTRE          Operador MENOR_IGUAL / CERO
 (ej: pH 6.5 - 9.0)       (ej: Turbiedad ≤ 2.0 UNT)
     │                         │
     ├─ x dentro de rango ──►  ├─ x ≤ 80% del límite ──►  [ CUMPLE ] (Verde)
     ├─ x al 80% del límite ─► ├─ 80% < x ≤ 100% límite ─► [ ALERTA ] (Ámbar)
     └─ x fuera de rango ────► └─ x > 100% límite ──────►  [ NO CONFORME ] (Rojo)
```

| Estado | Significado Técnico | Acción del Sistema |
|:---|:---|:---|
| **CUMPLE** | El valor registrado cumple holgadamente con el rango legal. | Borde esmeralda `#10b981`, badge verde y animación sutil de pulso. |
| **ALERTA PREVENTIVA** | El parámetro se encuentra al 80% o más del límite máximo admisible. | Borde ámbar `#f59e0b`, badge de advertencia e indicador de atención. |
| **NO CONFORME** | El valor incumple el límite máximo permitido por la norma colombiana. | Borde carmesí `#ef4444`, micro-vibración y citación de infracción legal. |

---

## 📑 Resumen de Parámetros Fisicoquímicos y Microbiológicos

| Parámetro | Unidad | Operador Legal | Rango de Referencia | Matriz Normativa |
|:---|:---:|:---:|:---:|:---|
| **Potencial de Hidrógeno (pH)** | Unidades pH | `ENTRE` | 6.5 a 9.0 | Agua Potable / ARD / ARnD |
| **Turbiedad** | UNT | `MENOR_IGUAL` | ≤ 2.0 | Agua Potable (Res. 2115) |
| **Cloro Residual Libre** | mg/L | `ENTRE` | 0.3 a 2.0 | Redes de Distribución |
| **Color Aparente** | UPC | `MENOR_IGUAL` | ≤ 15 | Agua Potable |
| **Escherichia coli** | UFC/100 mL | `CERO_ESTRICTO` | 0 | Microbiología Potable |
| **Coliformes Totales** | UFC/100 mL | `CERO_ESTRICTO` | 0 | Microbiología Potable |
| **DBO₅ (Demanda Bioquímica)** | mg/L | `MENOR_IGUAL` | ≤ 90.0 | ARD Vertimientos (Res. 0631) |
| **DQO (Demanda Química)** | mg/L | `MENOR_IGUAL` | ≤ 180.0 | ARD Vertimientos (Res. 0631) |
| **Sólidos Suspendidos Totales (SST)** | mg/L | `MENOR_IGUAL` | ≤ 90.0 | ARD / ARnD |
| **Grasas y Aceites** | mg/L | `MENOR_IGUAL` | ≤ 20.0 | ARD / ARnD |
| **Oxígeno Disuelto (OD)** | mg/L | `MAYOR_IGUAL` | ≥ 4.0 | Preservación de Fauna y Flora |

---

## 🛠️ Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js**: Versión `>= 22.12.0` (o Node 24.x)
- **pnpm**: Versión `>= 10.x` (`npm install -g pnpm`)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/David-devT/SIMA-.git
cd SIMA-
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Iniciar el Servidor Local de Desarrollo
```bash
pnpm dev
```

La aplicación se desplegará de forma inmediata en:
```text
Local:   http://localhost:4321/
Network: http://<tu-ip-local>:4321/
```

### 4. Compilar para Producción
```bash
pnpm build
```
Genera los archivos HTML, CSS y JS 100% estáticos en el directorio `./dist/`.

---

## 📜 Scripts Disponibles

| Comando | Propósito |
|:---|:---|
| `pnpm dev` | Inicia el servidor de desarrollo de Astro con recarga en caliente (HMR) |
| `pnpm build` | Compila y optimiza la versión estática de producción en `./dist/` |
| `pnpm preview` | Ejecuta un servidor local para inspeccionar el build de producción |
| `pnpm astro` | Ejecuta comandos directos de la CLI de Astro (`astro preferences`, etc.) |

---

## ⚖️ Marco Regulatorio y Términos Legales

### 1. Libre Reproducción Normativa (Ley 23 de 1982)
Conforme al **Artículo 41 de la Ley 23 de 1982** de la República de Colombia:
> *"Es permitido a todos reproducir la Constitución, leyes, decretos, ordenanzas, acuerdos, reglamentos, demás actos administrativos y decisiones judiciales, bajo la obligación de conformarse puntualmente con la edición oficial..."*

La parametrización de rangos, límites y artículos de las resoluciones del Ministerio de Ambiente y del Ministerio de Salud son de dominio público y su utilización para este simulador académico respeta fielmente los textos legales oficiales vigentes.

### 2. Acreditación de Laboratorios (Decreto 1076 de 2015)
Los análisis de laboratorio que requieran validez jurídica o probatoria ante autoridades ambientales (CAR, ANLA, MinAmbiente, Secretarías de Salud) **únicamente pueden ser emitidos por laboratorios acreditados por el IDEAM bajo la norma técnica NTC-ISO/IEC 17025**. Esta herramienta digital tiene carácter didáctico, orientativo y analítico preliminar.

### 3. Licencia de Software (Open Source)
Este proyecto se distribuye bajo los términos de la **[Licencia MIT](./LICENSE)**. Se permite el uso, estudio, adaptación y distribución del código sin costo alguno, bajo la condición de conservar los avisos de derechos de autor y la cláusula de exención de responsabilidad (*AS IS*).

---

<div align="center">

Desarrollado con arquitectura moderna en Astro, Svelte 5 y Tailwind CSS para la ingeniería ambiental colombiana.

</div>