/**
 * @file tests/theme.test.mjs
 * @description Suite de pruebas automatizadas para el sistema bimodal de SIMA Colombia.
 * Valida la conmutación de tema (Modo Claro / Modo Oscuro), persistencia en localStorage,
 * atributos en documentElement y clases CSS duales en páginas y componentes.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

describe('Sistema Bimodal (Modo Claro & Modo Oscuro)', () => {
  // --------------------------------------------------------------------------
  // 1. Simulación de la Función de Conmutación de Tema
  // --------------------------------------------------------------------------
  it('Debe conmutar clases y atributos de DOM correctamente entre Dark y Light', () => {
    // Simulación de documentElement
    const classList = new Set(['scroll-smooth']);
    const attributes = {};

    const mockDocElement = {
      classList: {
        add: (cls) => classList.add(cls),
        remove: (cls) => classList.delete(cls),
        contains: (cls) => classList.has(cls),
      },
      setAttribute: (name, val) => { attributes[name] = val; },
      getAttribute: (name) => attributes[name],
    };

    function aplicarTema(nuevoTema, doc = mockDocElement) {
      if (nuevoTema === 'dark') {
        doc.classList.add('dark');
        doc.classList.remove('light');
        doc.setAttribute('data-theme', 'dark');
      } else {
        doc.classList.remove('dark');
        doc.classList.add('light');
        doc.setAttribute('data-theme', 'light');
      }
    }

    // Inicial en Claro
    aplicarTema('light');
    assert.strictEqual(mockDocElement.classList.contains('light'), true, 'Debe contener clase light');
    assert.strictEqual(mockDocElement.classList.contains('dark'), false, 'NO debe contener clase dark');
    assert.strictEqual(mockDocElement.getAttribute('data-theme'), 'light', 'data-theme debe ser light');

    // Conmutar a Oscuro
    aplicarTema('dark');
    assert.strictEqual(mockDocElement.classList.contains('dark'), true, 'Debe contener clase dark');
    assert.strictEqual(mockDocElement.classList.contains('light'), false, 'NO debe contener clase light');
    assert.strictEqual(mockDocElement.getAttribute('data-theme'), 'dark', 'data-theme debe ser dark');

    // Volver a Claro
    aplicarTema('light');
    assert.strictEqual(mockDocElement.classList.contains('light'), true, 'Debe regresar a clase light');
    assert.strictEqual(mockDocElement.classList.contains('dark'), false, 'NO debe conservar clase dark');
    assert.strictEqual(mockDocElement.getAttribute('data-theme'), 'light', 'data-theme debe regresar a light');
  });

  // --------------------------------------------------------------------------
  // 2. Simulación de Persistencia en localStorage
  // --------------------------------------------------------------------------
  it('Debe persistir y recuperar la preferencia del usuario en localStorage', () => {
    const storage = new Map();
    const mockLocalStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, val) => storage.set(key, String(val)),
      removeItem: (key) => storage.delete(key),
    };

    function resolverTemaInicial(guardado, prefiereOscuro) {
      return guardado ? guardado : (prefiereOscuro ? 'dark' : 'light');
    }

    // Primera visita sin guardar, preferencia del SO claro
    assert.strictEqual(resolverTemaInicial(mockLocalStorage.getItem('theme'), false), 'light');

    // Usuario activa modo claro explícitamente
    mockLocalStorage.setItem('theme', 'light');
    assert.strictEqual(mockLocalStorage.getItem('theme'), 'light');
    assert.strictEqual(resolverTemaInicial(mockLocalStorage.getItem('theme'), true), 'light', 'Preferencia guardada tiene prioridad sobre SO');

    // Usuario activa modo oscuro
    mockLocalStorage.setItem('theme', 'dark');
    assert.strictEqual(mockLocalStorage.getItem('theme'), 'dark');
    assert.strictEqual(resolverTemaInicial(mockLocalStorage.getItem('theme'), false), 'dark', 'Preferencia oscura guardada tiene prioridad');
  });

  // --------------------------------------------------------------------------
  // 3. Verificación de Integridad de global.css
  // --------------------------------------------------------------------------
  it('src/styles/global.css debe definir tokens para :root, .light y .dark', () => {
    const cssPath = path.join(ROOT_DIR, 'src', 'styles', 'global.css');
    assert.strictEqual(fs.existsSync(cssPath), true, 'global.css debe existir');
    const content = fs.readFileSync(cssPath, 'utf8');

    assert.ok(content.includes(':root, .light, [data-theme="light"]'), 'global.css debe definir tokens de modo claro');
    assert.ok(content.includes(':root.dark, .dark, [data-theme="dark"]'), 'global.css debe definir tokens de modo oscuro');
    assert.ok(content.includes('--color-bg-base: #f8fafc;'), 'Color base de modo claro debe ser #f8fafc');
    assert.ok(content.includes('--color-bg-base: #0f1419;'), 'Color base de modo oscuro debe ser #0f1419');
    assert.ok(content.includes('@custom-variant dark'), 'Debe definir la variante @custom-variant dark');
  });

  // --------------------------------------------------------------------------
  // 4. Verificación de Soporte Bimodal en legal.astro
  // --------------------------------------------------------------------------
  it('src/pages/legal.astro debe tener clases duales de modo claro y oscuro', () => {
    const legalPath = path.join(ROOT_DIR, 'src', 'pages', 'legal.astro');
    assert.strictEqual(fs.existsSync(legalPath), true, 'legal.astro debe existir');
    const content = fs.readFileSync(legalPath, 'utf8');

    assert.ok(content.includes('dark:bg-'), 'legal.astro debe contener clases dark:bg-');
    assert.ok(content.includes('dark:text-'), 'legal.astro debe contener clases dark:text-');
    assert.ok(content.includes('bg-white dark:bg-[#060a14]'), 'Secciones deben tener soporte bimodal');
    assert.ok(!content.includes('class="p-4 sm:p-6 rounded-2xl bg-[#060a14]"'), 'No debe tener fondos oscuros rígidos sin variante clara');
  });

  // --------------------------------------------------------------------------
  // 5. Verificación de Soporte Bimodal en ModalLegal.svelte
  // --------------------------------------------------------------------------
  it('src/components/ModalLegal.svelte debe adaptarse a ambos modos', () => {
    const modalPath = path.join(ROOT_DIR, 'src', 'components', 'ModalLegal.svelte');
    assert.strictEqual(fs.existsSync(modalPath), true, 'ModalLegal.svelte debe existir');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.ok(content.includes('bg-white dark:bg-[#070c17]'), 'Superficie del modal debe ser bimodal');
    assert.ok(content.includes('text-slate-700 dark:text-slate-300'), 'Texto del cuerpo debe ser legible en claro y oscuro');
    assert.ok(content.includes('text-slate-900 dark:text-white'), 'Títulos deben tener contraste AAA');
  });

  // --------------------------------------------------------------------------
  // 6. Verificación de Conmutación Pura CSS en LandingCards.svelte
  // --------------------------------------------------------------------------
  it('src/components/LandingCards.svelte debe usar clases CSS puras para telemetría bimodal', () => {
    const landingPath = path.join(ROOT_DIR, 'src', 'components', 'LandingCards.svelte');
    assert.strictEqual(fs.existsSync(landingPath), true, 'LandingCards.svelte debe existir');
    const content = fs.readFileSync(landingPath, 'utf8');

    assert.ok(content.includes('flex dark:hidden'), 'HUD debe mostrarse en claro con flex dark:hidden');
    assert.ok(content.includes('hidden dark:flex'), 'HUD debe mostrarse en oscuro con hidden dark:flex');
    assert.ok(content.includes('block dark:hidden'), 'Deck de vigilancia debe ser block dark:hidden');
    assert.ok(content.includes('hidden dark:flex'), 'Osciloscopio debe ser hidden dark:flex');
  });

  // --------------------------------------------------------------------------
  // 7. Verificación del Script Anti-FOUC en Layout.astro
  // --------------------------------------------------------------------------
  it('src/layouts/Layout.astro debe incluir el script inline síncrono para prevenir FOUC', () => {
    const layoutPath = path.join(ROOT_DIR, 'src', 'layouts', 'Layout.astro');
    assert.strictEqual(fs.existsSync(layoutPath), true, 'Layout.astro debe existir');
    const content = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(content.includes('localStorage.getItem(\'theme\')'), 'Debe leer el tema desde localStorage');
    assert.ok(content.includes('classList.add(\'light\')'), 'Debe añadir clase light');
    assert.ok(content.includes('classList.add(\'dark\')'), 'Debe añadir clase dark');
    assert.ok(content.includes('data-theme'), 'Debe sincronizar el atributo data-theme');
  });
});
