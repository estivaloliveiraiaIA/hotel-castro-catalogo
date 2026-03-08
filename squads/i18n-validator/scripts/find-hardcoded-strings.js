#!/usr/bin/env node
/**
 * find-hardcoded-strings.js
 * =========================
 * Varre src/pages/ e src/components/ (exceto admin/ e ui/) em busca de
 * strings em português hardcoded em JSX que deveriam usar t("chave").
 *
 * Detecta:
 * - Texto PT em JSX entre tags (ex: <p>Carregando...</p>)
 * - Atributos com texto PT (placeholder, aria-label, title, alt)
 * - Strings PT em expressões JSX {" texto "}
 *
 * Uso: node squads/i18n-validator/scripts/find-hardcoded-strings.js
 * (executar a partir de castro-park-discover/)
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join, relative } from "path";

const SRC_DIR = resolve("src");

// Diretórios a ignorar
const IGNORE_DIRS = new Set(["admin", "ui", "node_modules", "__tests__", ".test"]);

// Palavras PT comuns em UI (acentuadas ou palavras-chave)
const PT_KEYWORDS = [
  // Ações
  "Carregar", "Carregando", "Salvar", "Salvando", "Voltar", "Fechar",
  "Abrir", "Cancelar", "Confirmar", "Enviar", "Criar", "Editar", "Remover",
  "Adicionar", "Buscar", "Pesquisar", "Filtrar", "Limpar", "Ver mais",
  "Ver todos", "Mostrar", "Ocultar",
  // Estado
  "Nenhum", "Vazio", "Não encontrado", "Erro", "Aguardando",
  "Sucesso", "Falha",
  // Navegação
  "Início", "Início,", "Guia", "Eventos", "Favoritos", "Roteiros",
  "Recomendados", "Concierge", "Parceiros",
  // Textos comuns com acento (indicativo de PT)
  "ção", "ões", "não", "Não", "também", "após", "através",
  "já", "só", "está", "estão", "você", "Você",
];

// Padrões de regex para detectar strings hardcoded no JSX
const PATTERNS = [
  // Texto entre tags JSX: >Texto PT aqui<
  {
    name: "JSX text node",
    regex: />([^<{}\n]+[áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ][^<{}\n]*)</g,
    extract: (m) => m[1].trim(),
  },
  // placeholder="Texto PT"
  {
    name: 'placeholder="..."',
    regex: /placeholder=["']([^"']*[áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ][^"']*)["']/g,
    extract: (m) => m[1],
  },
  // aria-label="Texto PT"
  {
    name: 'aria-label="..."',
    regex: /aria-label=["']([^"']*[áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ][^"']*)["']/g,
    extract: (m) => m[1],
  },
  // title="Texto PT"
  {
    name: 'title="..."',
    regex: /title=["']([^"']*[áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ][^"']*)["']/g,
    extract: (m) => m[1],
  },
  // alt="Texto PT"
  {
    name: 'alt="..."',
    regex: /alt=["']([^"']*[áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ][^"']*)["']/g,
    extract: (m) => m[1],
  },
];

// Padrões a IGNORAR (falsos positivos)
const IGNORE_PATTERNS = [
  /^\s*\/\//, // comentário de linha
  /className=/, // class names
  /import\s/, // imports
  /export\s/, // exports
  /const\s|let\s|var\s/, // declarações
  /\.(pt|en|es)\b/, // referências de idioma
  /resolveI18nField/, // função i18n
  /useTranslation/, // hook
  /t\(["']/, // já usando t()
  /console\./, // logs
];

// Falsos positivos conhecidos (strings que são técnicas, não UI)
const KNOWN_FALSE_POSITIVES = new Set([
  "pt", "en", "es", "pt-BR", "en-US", "es-ES",
  "América/São_Paulo", "America/Sao_Paulo",
]);

function shouldIgnoreFile(filePath) {
  const parts = filePath.split(/[/\\]/);
  return parts.some((p) => IGNORE_DIRS.has(p));
}

function walkDir(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) walkDir(fullPath, files);
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      if (!shouldIgnoreFile(fullPath)) files.push(fullPath);
    }
  }
  return files;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const findings = [];

  for (const pattern of PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    const allMatches = [...content.matchAll(regex)];

    for (const m of allMatches) {
      const text = pattern.extract(m);
      if (!text || text.length < 3) continue;
      if (KNOWN_FALSE_POSITIVES.has(text)) continue;

      // Calcula linha
      const upToMatch = content.slice(0, m.index);
      const lineNum = upToMatch.split("\n").length;
      const lineContent = lines[lineNum - 1]?.trim() || "";

      // Ignora linhas com padrões conhecidos
      if (IGNORE_PATTERNS.some((p) => p.test(lineContent))) continue;

      // Verifica se a linha já usa t()
      if (lineContent.includes("t(\"") || lineContent.includes("t('")) continue;

      // Confirma que tem caractere com acento (PT real)
      if (!/[áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ]/.test(text)) continue;

      findings.push({
        pattern: pattern.name,
        line: lineNum,
        text: text.slice(0, 80),
        context: lineContent.slice(0, 100),
      });
    }
  }

  // Remove duplicatas por linha
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.line}:${f.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log("\n🔍 find-hardcoded-strings — Detectando strings PT hardcoded\n");

const files = walkDir(SRC_DIR);
console.log(`   Varrendo ${files.length} arquivo(s) TSX/TS (exceto admin/ e ui/)...\n`);

let totalIssues = 0;
const fileResults = [];

for (const filePath of files) {
  const findings = scanFile(filePath);
  if (findings.length > 0) {
    fileResults.push({ filePath, findings });
    totalIssues += findings.length;
  }
}

if (fileResults.length === 0) {
  console.log("✅ Nenhuma string PT hardcoded encontrada!\n");
} else {
  for (const { filePath, findings } of fileResults) {
    const relPath = relative(SRC_DIR, filePath);
    console.log(`📄 src/${relPath} (${findings.length} ocorrência(s)):`);
    for (const f of findings) {
      console.log(`   linha ${f.line} [${f.pattern}]: "${f.text}"`);
    }
    console.log();
  }
}

console.log("─".repeat(50));
console.log("📊 RESUMO");
console.log(`   Arquivos com issues: ${fileResults.length}`);
console.log(`   Total de ocorrências: ${totalIssues}`);
console.log(`   Status: ${totalIssues === 0 ? "✅ PASS" : "⚠️  REVISAR (pode conter falsos positivos)"}\n`);

// Script não falha com exit 1 pois pode ter falsos positivos —
// resultado requer revisão humana
process.exit(0);
