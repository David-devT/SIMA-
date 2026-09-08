# SIMA Colombia — Sistema Integral de Monitoreo Ambiental

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Framework: Astro](https://img.shields.io/badge/Astro-v7-FF5D01.svg)
![UI: Svelte 5](https://img.shields.io/badge/Svelte-5_Runes-FF3E00.svg)
![Styles: Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg)
![Language: TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)
![Package Manager: pnpm](https://img.shields.io/badge/pnpm-v11-F69220.svg)

**Plataforma interactiva para la simulación, pre-evaluación técnica y análisis normativo de calidad de agua en la República de Colombia.**

[Demostración](#-características-principales) • [Arquitectura](#-arquitectura-y-tecnologías) • [Estructura](#-estructura-del-proyecto) • [Instalación](#-instalación-y-despliegue) • [Marco Legal](#-marco-legal-y-licencia)

</div>

---

> 🎓 **Declaración de Propósito Educativo:**  
> Este software fue diseñado y desarrollado como un **ejercicio de práctica personal, estudio técnico y aprendizaje académico**. Su objetivo es explorar la integración de arquitecturas frontend modernas con motores de inferencia analítica basados en la legislación ambiental colombiana. No constituye una plataforma gubernamental oficial ni un servicio pericial vinculante.

---

## 📋 Resumen del Proyecto

**SIMA Colombia** permite contrastar mediciones cuantitativas de laboratorio frente a los topes máximos permisibles establecidos en la normativa ambiental nacional. La aplicación evalúa de forma determinista y en tiempo real si una muestra es **Conforme**, se encuentra en **Alerta Preventiva** o resulta **No Conforme**, citando el artículo y resolución exactos aplicables.

### Matrices Normativas Incorporadas:
1. **Agua para Consumo Humano (Agua Potable)**: *Resolución 2115 de 2007* (Ministerio de la Protección Social y MinAmbiente).
2. **Aguas Residuales Domésticas (ARD)**: *Resolución 0631 de 2015, Artículo 8* (Efluentes a cuerpos receptores).
3. **Aguas Residuales No Domésticas (ARnD)**: *Resolución 0631 de 2015, Artículo 10* (Descargas industriales y productivas).
4. **Agua Superficial — Preservación**: *Decreto 1076 de 2015* (Conservación de ecosistemas de fauna y flora cálida y fría).
5. **Agua Superficial — Captación**: *Decreto 1076 de 2015, Título 9* (Admisibilidad en bocatomas para potabilización).

---

## ✨ Características Principales

- **Islands Architecture (Arquitectura de Islas)**: Despliegue estático de ultra alta velocidad impulsado por Astro con hidratación selectiva únicamente en los componentes interactivos.
- **Motor Reactivo con Svelte 5 (Runes)**: Gestión de estado reactivo mediante `$state` y `$derived` sin la sobrecarga computacional de un Virtual DOM.
- **Preselección Inteligente (Noise Reduction)**: Al ingresar a cualquier matriz, el sistema activa por defecto los 5 o 6 parámetros fundamentales obligatorios según la ley, permitiendo activar los demás bajo demanda para prevenir saturación visual.
- **Controles Stepper Personalizados**: Entradas numéricas con micro-flechas estilizadas que evitan colisiones de interfaz con las unidades legales (`mg/L`, `UNT`, `UPC`, `UFC/100 mL`).
- **Simulador de Escenarios**: Botones de prueba rápida en un clic para modelar escenarios de *Conformidad (Verde)*, *Tolerancia Preventiva (Ámbar)* e *Incumplimiento Crítico (Rojo)*.
- **Paleta Minimalista de Alta Gama**: Interfaz sobria en negro carbón (`#030712`), verde esmeralda y azul técnico, optimizada para claridad analítica y lectura de datos.
- **Cero Riesgo de Privacidad (Client-Side Only)**: Todo el cómputo se realiza en la memoria local del navegador del cliente; no se transmiten ni almacenan datos en bases de datos remotas.

---

## 🏗️ Arquitectura y Tecnologías

| Componente | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Generador Estático** | **Astro v7** | Proporciona páginas HTML estáticas ultra veloces (SSG) con cero JavaScript innecesario enviado al cliente. |
| **Reactividad UI** | **Svelte 5** | Utiliza Runes reactivos quirúrgicos con un peso de runtime insignificante (~3KB) frente a alternativas más pesadas. |
| **Diseño y Estilos** | **Tailwind CSS v4** | Utilidades CSS modernas y variables de diseño compiladas sin dependencias en tiempo de ejecución. |
| **Tipado y Dominio** | **TypeScript (Strict)** | Garantiza contratos de datos estrictos, operadores discriminados y prevención de errores en tiempo de compilación. |
| **Package Manager** | **pnpm v11** | Manejo determinista de dependencias mediante enlaces duros (hard links), ahorrando espacio en disco y acelerando builds. |

---

## 📁 Estructura del Proyecto

```text
proyecto-ambiental/
├── public/                       # Activos estáticos públicos (favicon, íconos)
├── src/
│   ├── components/
│   │   ├── EvaluadorAgua.svelte  # Workbench interactivo: 5 normas, sidebar y evaluación en vivo
│   │   ├── LandingCards.svelte   # Catálogo principal de matrices (Agua, Suelo, Aire, Ruido)
│   │   ├── ModalAlerta.svelte    # Diálogo accesible para módulos en desarrollo (Próximamente)
│   │   ├── ModalLegal.svelte     # Modal con fundamento legal, acreditación IDEAM y términos
│   │   └── FooterLegal.svelte    # Pie de página institucional con enlaces normativos
│   ├── data/
│   │   └── normativaAgua.ts      # Matriz legal completa de Colombia y motor evaluarParametro()
│   ├── layouts/
│   │   └── Layout.astro          # Shell HTML universal con tipografía y navegación
│   ├── pages/
│   │   ├── index.astro           # Portada principal (Landing)
│   │   ├── agua.astro            # Analizador especializado de calidad de agua
│   │   └── legal.astro           # Documento formal de términos, responsabilidades y licencia
│   └── styles/
│       └── global.css            # Tokens de color minimalista y animaciones sutiles
├── astro.config.mjs              # Configuración de integraciones de Astro y Vite
├── LICENSE                       # Licencia MIT con anexo legal de la República de Colombia
├── package.json                  # Scripts de ejecución y dependencias del proyecto
├── pnpm-workspace.yaml           # Configuración de políticas de compilación en pnpm
├── README.md                     # Documentación oficial del proyecto
└── tsconfig.json                 # Configuración del compilador TypeScript (Strictest)
```

---

## ⚙️ Instalación y Despliegue

### Requisitos Previos:
- **Node.js**: v22.12.0 o superior (compatible con Node v24).
- **pnpm**: v11 o superior (`npm install -g pnpm`).

### Pasos para Ejecutar Localmente:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/proyecto-ambiental.git

# 2. Acceder al directorio
cd proyecto-ambiental

# 3. Instalar dependencias
pnpm install

# 4. Iniciar el servidor de desarrollo local
pnpm dev

# El entorno estará disponible de inmediato en:
# Local: http://localhost:4321/
```

### Comandos de Script Disponibles:

```bash
pnpm dev       # Inicia el servidor de desarrollo interactivo
pnpm build     # Compila el sitio para producción optimizada en la carpeta ./dist/
pnpm preview   # Previsualiza la compilación de producción de manera local
```

---

## ⚖️ Marco Legal y Licencia

### 1. Libre Reproducción Normativa
De acuerdo con el **Artículo 41 de la Ley 23 de 1982** de la República de Colombia:
> *"Es permitido a todos reproducir la Constitución, leyes, decretos, ordenanzas, acuerdos, reglamentos, demás actos administrativos y decisiones judiciales, bajo la obligación de conformarse puntualmente con la edición oficial..."*

La parametrización de las resoluciones oficiales del Ministerio de Ambiente y del Ministerio de Salud es de dominio público y su utilización para este simulador académico respeta fielmente los textos legales vigentes.

### 2. Acreditación de Laboratorios (IDEAM)
Conforme al **Decreto 1076 de 2015**, los análisis de laboratorio que requieran validez jurídica o probatoria ante autoridades ambientales (CAR, ANLA, MinSalud) **únicamente pueden ser emitidos por laboratorios acreditados por el IDEAM bajo la norma NTC-ISO/IEC 17025**. Este software es un instrumento pedagógico preliminar y no sustituye dichos dictámenes.

### 3. Términos de Licencia
Este proyecto se distribuye bajo los términos de la **[Licencia MIT](./LICENSE)**. Se permite el uso, estudio, adaptación y distribución del código sin costo alguno, bajo la condición de mantener el aviso de derechos de autor y la cláusula de exención de responsabilidad (*AS IS*).
#   S I M A -  
 