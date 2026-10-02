/**
 * @file tests/security-audit.test.mjs
 * @description Suite de pruebas automatizadas de seguridad, privacidad y blindaje para GitHub.
 * Valida la integridad del archivo .gitignore, ausencia de claves o secretos en el repositorio,
 * y la ejecución 100% en cliente (client-side privacy) sin fugas de telemetría a servidores externos.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

describe('Auditoría de Seguridad, Privacidad y Blindaje Git/GitHub', () => {
  // --------------------------------------------------------------------------
  // 1. Verificación de Exclusiones Críticas en .gitignore
  // --------------------------------------------------------------------------
  it('.gitignore debe contener exclusiones exhaustivas para secretos, dist y dependencias', () => {
    const gitignorePath = path.join(ROOT_DIR, '.gitignore');
    assert.strictEqual(fs.existsSync(gitignorePath), true, '.gitignore debe existir en la raíz');
    const content = fs.readFileSync(gitignorePath, 'utf8');

    const patronesRequeridos = [
      '.env',
      '*.pem',
      '*.key',
      'dist/',
      'node_modules/',
      '.astro/',
      'AGENTS.md',
      'CLAUDE.md',
      '.vscode/',
      '.idea/'
    ];

    patronesRequeridos.forEach(patron => {
      assert.ok(content.includes(patron), `.gitignore debe excluir el patrón crítico: ${patron}`);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Escaneo de Secretos y Credenciales en Archivos Fuente
  // --------------------------------------------------------------------------
  it('No deben existir claves privadas, tokens ni credenciales hardcodeadas en src/', () => {
    const patronesPeligrosos = [
      /sk-[a-zA-Z0-9_-]{20,}/,
      /ghp_[a-zA-Z0-9]{30,}/,
      /AKIA[0-9A-Z]{16}/,
      /AIza[0-9A-Za-z-_]{35}/,
      /postgres:\/\/.*:.*@/,
      /mongodb(\+srv)?:\/\/.*:.*@/
    ];

    function escanearDirectorio(dir) {
      const entradas = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entradas) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
          escanearDirectorio(fullPath);
        } else if (e.isFile() && !e.name.endsWith('.png') && !e.name.endsWith('.ico')) {
          const texto = fs.readFileSync(fullPath, 'utf8');
          for (const pat of patronesPeligrosos) {
            assert.strictEqual(
              pat.test(texto),
              false,
              `Posible credencial detectada en archivo: ${fullPath}`
            );
          }
        }
      }
    }

    escanearDirectorio(path.join(ROOT_DIR, 'src'));
  });

  // --------------------------------------------------------------------------
  // 3. Verificación de Privacidad y Ejecución 100% Local (Habeas Data)
  // --------------------------------------------------------------------------
  it('La lógica de evaluación de agua no debe transmitir datos a servidores externos', () => {
    const evaluadorPath = path.join(ROOT_DIR, 'src', 'components', 'EvaluadorAgua.svelte');
    assert.strictEqual(fs.existsSync(evaluadorPath), true);
    const content = fs.readFileSync(evaluadorPath, 'utf8');

    // Confirmar que no hay endpoints HTTP de exfiltración de datos
    assert.strictEqual(content.includes('fetch('), false, 'EvaluadorAgua no debe realizar llamadas fetch remotas');
    assert.strictEqual(content.includes('axios'), false, 'EvaluadorAgua no debe incluir cliente Axios');
    assert.strictEqual(content.includes('XMLHttpRequest'), false, 'EvaluadorAgua no debe incluir peticiones XMLHttpRequest');
  });

  // --------------------------------------------------------------------------
  // 4. Verificación de Inexistencia de Archivos de Claves Locales en Raíz
  // --------------------------------------------------------------------------
  it('No deben existir archivos .env o claves en la raíz del proyecto', () => {
    const archivosProhibidos = ['.env', '.env.local', '.env.production', 'id_rsa', 'server.key'];
    archivosProhibidos.forEach(f => {
      const p = path.join(ROOT_DIR, f);
      assert.strictEqual(fs.existsSync(p), false, `Archivo sensible ${f} no debe estar en el repositorio`);
    });
  });
});
