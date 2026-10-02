/**
 * @file tests/ui-water-evaluator.test.mjs
 * @description Suite de pruebas automatizadas para la lógica analítica de calidad de agua.
 * Valida la matriz legal de parámetros (Res. 2115, Res. 0631, Dec. 1076), baselines,
 * evaluación matemática, precisión aritmética de steppers y generadores de escenarios.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MATRIZ_PARAMETROS_AGUA_COLOMBIA,
  INFORMACION_NORMAS_AGUA,
  PARAMETROS_BASELINE_DEFAULT,
  obtenerParametrosPorTipo,
  evaluarParametro
} from '../src/data/normativaAgua.ts';

/**
 * Replica de determinarStep utilizada en EvaluadorAgua.svelte
 */
function determinarStep(param) {
  if (param.categoria === 'MICROBIOLOGICO') return 1;
  const max = param.rango.max ?? param.rango.min ?? 10;
  if (max <= 0.005) return 0.0005;
  if (max <= 0.05) return 0.005;
  if (max <= 1) return 0.01;
  if (max <= 10) return 0.1;
  if (max <= 50) return 0.5;
  return 1;
}

/**
 * Replica de incremento controlado para evitar floating-point drift
 */
function calcularIncremento(actual, param) {
  const step = determinarStep(param);
  const precision = step < 0.01 ? 4 : step < 0.1 ? 3 : step < 1 ? 2 : 1;
  return Number((actual + step).toFixed(precision));
}

/**
 * Replica de decremento controlado con cota mínima en 0
 */
function calcularDecremento(actual, param) {
  const step = determinarStep(param);
  const precision = step < 0.01 ? 4 : step < 0.1 ? 3 : step < 1 ? 2 : 1;
  const nuevo = Math.max(0, actual - step);
  return Number(nuevo.toFixed(precision));
}

describe('Motor Analítico de Calidad de Agua (Colombia)', () => {
  // --------------------------------------------------------------------------
  // 1. Catálogo Normativo y Filtros por Tipo de Agua
  // --------------------------------------------------------------------------
  it('Debe contener las 5 normas oficiales reglamentadas con metadatos completos', () => {
    const normas = [
      'AGUA_POTABLE',
      'AGUA_RESIDUAL_DOMESTICA',
      'AGUA_RESIDUAL_NO_DOMESTICA',
      'AGUA_SUPERFICIAL_PRESERVACION',
      'AGUA_SUPERFICIAL_CONSUMO'
    ];

    normas.forEach(tipo => {
      const info = INFORMACION_NORMAS_AGUA[tipo];
      assert.ok(info, `Norma ${tipo} debe tener metadatos definidos`);
      assert.ok(info.norma, `Norma ${tipo} debe tener referencia legal`);
      assert.ok(info.titulo, `Norma ${tipo} debe tener título`);

      const params = obtenerParametrosPorTipo(tipo);
      assert.ok(params.length > 0, `Norma ${tipo} debe tener parámetros asignados`);

      const baselines = PARAMETROS_BASELINE_DEFAULT[tipo];
      assert.ok(baselines && baselines.length >= 2, `Norma ${tipo} debe tener al menos 2 baselines definidos`);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Evaluación de Parámetros de Agua Potable (Res. 2115/2007)
  // --------------------------------------------------------------------------
  it('Debe evaluar correctamente pH potable ([6.5 - 9.0])', () => {
    // Cumple
    const c = evaluarParametro('AP_PH', 7.5);
    assert.strictEqual(c.estado, 'CUMPLE');
    assert.strictEqual(c.cumple, true);

    // Alerta preventiva (cercano al límite)
    const a = evaluarParametro('AP_PH', 6.6);
    assert.strictEqual(a.estado, 'ALERTA_PREVENTIVA');

    // No cumple (ácido)
    const ncAcido = evaluarParametro('AP_PH', 5.0);
    assert.strictEqual(ncAcido.estado, 'NO_CUMPLE');
    assert.strictEqual(ncAcido.cumple, false);

    // No cumple (alcalino)
    const ncAlcalino = evaluarParametro('AP_PH', 10.5);
    assert.strictEqual(ncAlcalino.estado, 'NO_CUMPLE');
    assert.strictEqual(ncAlcalino.cumple, false);
  });

  it('Debe evaluar correctamente Cloro Libre Residual (0.3 a 2.0 mg/L)', () => {
    const c = evaluarParametro('AP_CLORO_LIBRE', 1.2);
    assert.strictEqual(c.estado, 'CUMPLE');

    const ncBajo = evaluarParametro('AP_CLORO_LIBRE', 0.1);
    assert.strictEqual(ncBajo.estado, 'NO_CUMPLE');

    const ncAlto = evaluarParametro('AP_CLORO_LIBRE', 3.5);
    assert.strictEqual(ncAlto.estado, 'NO_CUMPLE');
  });

  it('Debe evaluar correctamente Coliformes Totales y E. Coli (Cero Estricto)', () => {
    const ecoliCero = evaluarParametro('AP_E_COLI', 0);
    assert.strictEqual(ecoliCero.estado, 'CUMPLE');
    assert.strictEqual(ecoliCero.cumple, true);

    const ecoliPositivo = evaluarParametro('AP_E_COLI', 1);
    assert.strictEqual(ecoliPositivo.estado, 'NO_CUMPLE');
    assert.strictEqual(ecoliPositivo.cumple, false);
  });

  // --------------------------------------------------------------------------
  // 3. Evaluación de Vertimientos ARD y ARnD (Res. 0631/2015)
  // --------------------------------------------------------------------------
  it('Debe evaluar DBO5 y DQO en vertimientos domésticos (≤ 90 y ≤ 180 mg/L)', () => {
    const dboCumple = evaluarParametro('ARD_DBO5', 60);
    assert.strictEqual(dboCumple.estado, 'CUMPLE');

    const dboNoCumple = evaluarParametro('ARD_DBO5', 120);
    assert.strictEqual(dboNoCumple.estado, 'NO_CUMPLE');

    const dqoCumple = evaluarParametro('ARD_DQO', 140);
    assert.strictEqual(dqoCumple.estado, 'CUMPLE');

    const dqoNoCumple = evaluarParametro('ARD_DQO', 250);
    assert.strictEqual(dqoNoCumple.estado, 'NO_CUMPLE');
  });

  // --------------------------------------------------------------------------
  // 4. Steppers con Precisión Aritmética y Protección Anti-Drift
  // --------------------------------------------------------------------------
  it('Debe calcular incrementos con precisión sin drift de punto flotante', () => {
    const paramMicro = { categoria: 'MICROBIOLOGICO', rango: { max: 0 } };
    assert.strictEqual(determinarStep(paramMicro), 1);
    assert.strictEqual(calcularIncremento(0, paramMicro), 1);

    const paramPlomo = { categoria: 'INORGANICO_METALES', rango: { max: 0.01 } };
    assert.strictEqual(determinarStep(paramPlomo), 0.005);
    const suma1 = calcularIncremento(0.005, paramPlomo);
    assert.strictEqual(suma1, 0.01);

    // Verificación de decrementar con piso en cero
    const decCero = calcularDecremento(0.002, paramPlomo);
    assert.strictEqual(decCero, 0, 'No debe permitir valores negativos');
  });
});
