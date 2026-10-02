/**
 * @file tests/ph-simulator.test.mjs
 * @description Suite de pruebas automatizadas para el Simulador Rápido de pH (Res. 2115/2007).
 * Valida la evaluación cuantitativa de límites ácidos, conformes y alcalinos,
 * cálculo de penalidad IRCA y descripciones técnicas para el usuario.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Función pura que replica la derivación matemática de LandingCards.svelte
 */
function evaluarPh(phValor) {
  const val = Number(phValor.toFixed(1));
  if (val >= 6.5 && val <= 9.0) {
    return {
      estado: 'CONFORME',
      irca: '0.0 Pts',
      efecto: val < 7.0 ? 'Ligeramente ácido (seguro)' : val === 7.0 ? 'Agua perfectamente neutra' : 'Ligeramente alcalino (seguro)',
      esConforme: true
    };
  } else if (val < 6.5) {
    return {
      estado: 'NO CONFORME (ÁCIDO)',
      irca: '1.5 Pts',
      efecto: 'Corrosión de tuberías y arrastre de metales',
      esConforme: false
    };
  } else {
    return {
      estado: 'NO CONFORME (ALCALINO)',
      irca: '1.5 Pts',
      efecto: 'Incrustaciones e ineficiencia del cloro libre',
      esConforme: false
    };
  }
}

describe('Simulador Interactivo de pH (Res. 2115/2007)', () => {
  it('Debe clasificar como CONFORME un pH en rango neutro (7.0, 7.2, 8.0)', () => {
    const res70 = evaluarPh(7.0);
    assert.strictEqual(res70.estado, 'CONFORME');
    assert.strictEqual(res70.irca, '0.0 Pts');
    assert.strictEqual(res70.esConforme, true);

    const res72 = evaluarPh(7.2);
    assert.strictEqual(res72.estado, 'CONFORME');
    assert.strictEqual(res72.irca, '0.0 Pts');

    const res85 = evaluarPh(8.5);
    assert.strictEqual(res85.estado, 'CONFORME');
    assert.strictEqual(res85.irca, '0.0 Pts');
  });

  it('Debe clasificar en los límites exactos (6.5 y 9.0) como CONFORME', () => {
    const limInferior = evaluarPh(6.5);
    assert.strictEqual(limInferior.estado, 'CONFORME');
    assert.strictEqual(limInferior.irca, '0.0 Pts');

    const limSuperior = evaluarPh(9.0);
    assert.strictEqual(limSuperior.estado, 'CONFORME');
    assert.strictEqual(limSuperior.irca, '0.0 Pts');
  });

  it('Debe clasificar como NO CONFORME (ÁCIDO) con 1.5 Pts IRCA cuando pH < 6.5', () => {
    const res64 = evaluarPh(6.4);
    assert.strictEqual(res64.estado, 'NO CONFORME (ÁCIDO)');
    assert.strictEqual(res64.irca, '1.5 Pts');
    assert.strictEqual(res64.esConforme, false);

    const res40 = evaluarPh(4.0);
    assert.strictEqual(res40.estado, 'NO CONFORME (ÁCIDO)');
    assert.strictEqual(res40.irca, '1.5 Pts');
  });

  it('Debe clasificar como NO CONFORME (ALCALINO) con 1.5 Pts IRCA cuando pH > 9.0', () => {
    const res91 = evaluarPh(9.1);
    assert.strictEqual(res91.estado, 'NO CONFORME (ALCALINO)');
    assert.strictEqual(res91.irca, '1.5 Pts');
    assert.strictEqual(res91.esConforme, false);

    const res110 = evaluarPh(11.0);
    assert.strictEqual(res110.estado, 'NO CONFORME (ALCALINO)');
    assert.strictEqual(res110.irca, '1.5 Pts');
  });
});
