# SIMA Colombia — Sistema Integral de Monitoreo Ambiental

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Framework](https://img.shields.io/badge/Framework-Astro_v7-FF5D01.svg)](https://astro.build)
[![UI](https://img.shields.io/badge/UI-Svelte_5_Runes-FF3E00.svg)](https://svelte.dev)
[![Styles](https://img.shields.io/badge/Styles-Tailwind_CSS_v4-06B6D4.svg)](https://tailwindcss.com)
[![Language](https://img.shields.io/badge/Language-TypeScript_Strict-3178C6.svg)](https://www.typescriptlang.org)
[![Package Manager](https://img.shields.io/badge/Package_Manager-pnpm-F69220.svg)](https://pnpm.io)

Plataforma interactiva para la simulación, pre-evaluación técnica y análisis normativo de calidad de agua en la República de Colombia.

---

> [!NOTE]
> **Declaración de Propósito Educativo**  
> Este proyecto fue desarrollado como un **ejercicio de práctica personal, estudio técnico y aprendizaje académico**. Su propósito es explorar la integración de arquitecturas frontend modernas con modelos de inferencia basados en normativas ambientales colombianas. No representa una plataforma gubernamental oficial ni un servicio pericial vinculante.

---

## Tabla de Contenidos

- [Resumen del Proyecto](#resumen-del-proyecto)
- [Matrices Normativas Soportadas](#matrices-normativas-soportadas)
- [Características Principales](#características-principales)
- [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Instalación y Uso Local](#instalación-y-uso-local)
- [Marco Legal y Licencia](#marco-legal-y-licencia)

---

## Resumen del Proyecto

**SIMA Colombia** permite ingresar mediciones fisicoquímicas y microbiológicas de muestras de agua para contrastarlas de forma determinista y en tiempo real contra los valores máximos permisibles definidos por la legislación ambiental vigente en Colombia.

El evaluador clasifica cada parámetro en tres estados:
- **Conforme (Verde):** El valor medido se encuentra dentro del rango admisible por la norma.
- **Alerta Preventiva (Ámbar):** El valor medido se aproxima al límite máximo permisible (≥ 80% del tope legal).
- **No Conforme (Rojo):** El valor incumple el límite normativo establecido.

---

## Matrices Normativas Soportadas

1. **Agua para Consumo Humano (Agua Potable)**
   - Norma: *Resolución 2115 de 2007* (Ministerio de la Protección Social y MinAmbiente).
   - Parámetros clave: pH, Turbiedad, Cloro Residual Libre, Color Aparente, Conductividad, Coliformes Totales y *E. coli*.

2. **Aguas Residuales Domésticas (ARD)**
   - Norma: *Resolución 0631 de 2015, Artículo 8* (Vertimientos a cuerpos de agua superficiales).
   - Parámetros clave: DBO₅, DQO, Sólidos Suspendidos Totales (SST), Grasas y Aceites, pH.

3. **Aguas Residuales No Domésticas (ARnD - Industrial y Comercial)**
   - Norma: *Resolución 0631 de 2015, Artículo 10*.
   - Parámetros clave: DBO₅, DQO, SST, Hidrocarburos Totales, Sustancias Activas al Azul de Metileno (SAAM).

4. **Agua Superficial — Preservación de Flora y Fauna**
   - Norma: *Decreto 1076 de 2015* (Sector Ambiente y Desarrollo Sostenible).
   - Parámetros clave: Oxígeno Disuelto (OD), pH, Temperatura, Criterios de vida acuática.

5. **Agua Superficial — Captación y Consumo Humano**
   - Norma: *Decreto 1076 de 2015, Título 9*.
   - Parámetros clave: Criterios de admisibilidad de fuentes de agua cruda previo a potabilización.

---

## Características Principales

- **Arquitectura de Islas (Islands Architecture):** Generación de páginas estáticas ultra ligeras con hidratación interactiva aislada únicamente donde se requiere.
- **Reactividad con Svelte 5:** Empleo del nuevo modelo de *Runes* (`$state`, `$derived`) para un rendimiento de cómputo reactivo óptimo sin overhead de virtual DOM.
- **Preselección Inteligente:** Carga por defecto con los parámetros principales obligatorios por norma para evitar fatiga visual, permitiendo habilitar parámetros complementarios según el análisis requerido.
- **Controles Numéricos Optimizados:** Campos con controles numéricos adaptados que evitan sobreposiciones con unidades de medida complejas (`mg/L`, `UNT`, `UPC`, `UFC/100 mL`).
- **Simulador de Escenarios:** Presets para poblar rápidamente casos de prueba en estado conforme, preventivo o crítico con un solo clic.
- **Diseño Minimalista Técnico:** Paleta enfocada en alto contraste, legibilidad y sobriedad visual en fondos oscuros (`#030712`), esmeralda y cian técnico.
- **Procesamiento Exclusivamente Local:** Todo el cálculo se ejecuta en el navegador del usuario en memoria; no se transfieren datos a servicios externos.

---

## Arquitectura y Tecnologías

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Base** | Astro v7 | Renderizado estático (SSG), enrutamiento rápido y arquitectura de componentes desacoplada. |
| **Capa Interactiva** | Svelte 5 | Interfaz reactiva con Runes de alto rendimiento y footprint mínimo de JavaScript. |
| **Estilizado** | Tailwind CSS v4 | Sistema de diseño declarativo de última generación compilado a CSS nativo. |
| **Tipado** | TypeScript (Modo Estricto) | Tipado formal de parámetros, normas, rangos y validadores analíticos. |
| **Gestor de Paquetes** | pnpm v11 | Gestión eficiente, rápida y determinista de dependencias. |

---

## Estructura del Repositorio

```text
proyecto-ambiental/
├── public/                 # Activos estáticos públicos (favicons, metadatos)
├── src/
│   ├── components/
│   │   ├── EvaluadorAgua.svelte   # Workbench reactivo de evaluación de agua
│   │   ├── LandingCards.svelte    # Módulos del sistema (Agua, Suelo, Aire, Ruido)
│   │   ├── ModalAlerta.svelte     # Notificación para módulos futuros
│   │   ├── ModalLegal.svelte      # Ventana con marco legal y condiciones
│   │   └── FooterLegal.svelte     # Pie de página institucional y enlaces normativos
│   ├── data/
│   │   └── normativaAgua.ts       # Matriz normativa colombiana y reglas de evaluación
│   ├── layouts/
│   │   └── Layout.astro           # Plantilla base HTML con tipografía y navegación
│   ├── pages/
│   │   ├── index.astro            # Página de bienvenida e introducción general
│   │   ├── agua.astro             # Interfaz analítica del evaluador de agua
│   │   └── legal.astro            # Términos, marco regulatorio y exención de responsabilidad
│   └── styles/
│       └── global.css             # Configuración de estilos globales y temas
├── astro.config.mjs        # Configuración del entorno Astro
├── LICENSE                 # Licencia MIT con declaración regulatoria colombiana
├── package.json            # Metadatos del proyecto y dependencias
├── pnpm-workspace.yaml     # Configuración de workspace pnpm
├── README.md               # Documentación general del repositorio
└── tsconfig.json           # Configuración de TypeScript
```

---

## Instalación y Uso Local

### Requisitos

- **Node.js**: Versión 22 o superior
- **pnpm**: Versión 9 o superior (`npm install -g pnpm`)

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/proyecto-ambiental.git
   cd proyecto-ambiental
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Ejecutar el servidor local:**
   ```bash
   pnpm dev
   ```

4. **Abrir en el navegador:**  
   Ingresa a [http://localhost:4321](http://localhost:4321) para interactuar con la aplicación.

### Scripts Disponibles

- `pnpm dev`: Inicia el entorno local de desarrollo.
- `pnpm build`: Genera la versión estática optimizada para producción en `dist/`.
- `pnpm preview`: Permite previsualizar localmente el paquete generado en `dist/`.

---

## Marco Legal y Licencia

### Reproducción Normativa
De acuerdo con el **Artículo 41 de la Ley 23 de 1982** de la República de Colombia:
> *"Es permitido a todos reproducir la Constitución, leyes, decretos, ordenanzas, acuerdos, reglamentos, demás actos administrativos y decisiones judiciales, bajo la obligación de conformarse puntualmente con la edición oficial..."*

Los valores y topes regulatorios implementados en este software corresponden a transcripciones de las normas oficiales de dominio público publicadas en el Diario Oficial de Colombia.

### Validez Oficial y Acreditación
De conformidad con el **Decreto 1076 de 2015**, los análisis que requieran validez jurídica o probatoria ante autoridades ambientales (como CAR, ANLA, MinAmbiente o Secretarías de Salud) **deben ser expedidos por laboratorios acreditados por el IDEAM bajo la norma NTC-ISO/IEC 17025**. Esta herramienta digital tiene carácter didáctico, orientativo y analítico preliminar.

### Licencia
Este proyecto se encuentra publicado bajo la **[Licencia MIT](./LICENSE)**. Puede ser utilizado, modificado y estudiado libremente con fines educativos y de investigación, siempre conservando los créditos de autoría y las declaraciones de exención de responsabilidad correspondientes.