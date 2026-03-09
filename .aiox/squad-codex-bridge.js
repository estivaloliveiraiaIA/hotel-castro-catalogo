#!/usr/bin/env node

/**
 * squad-codex-bridge.js
 * Bridge entre o Squad de Elite e o Codex (gpt-5.4).
 *
 * Quando execution_mode = "economico", o @dev usa este script para
 * delegar a GERAÇÃO DE CÓDIGO ao Codex, poupando tokens do Claude.
 *
 * Fluxo:
 *   1. @architect lê código + projeta plano (Claude — poucos tokens)
 *   2. @dev invoca: node .aiox/squad-codex-bridge.js \
 *        --task="Adicionar toggle" \
 *        --plan="Usar Eye/EyeOff, estado togglingIds..." \
 *        --files="src/pages/admin/AdminItineraries.tsx"
 *   3. Bridge lê os arquivos + envia para Codex
 *   4. Codex retorna JSON com changes estruturadas
 *   5. Bridge salva squad-codex-output.json
 *   6. @dev lê o JSON e aplica usando Edit/Write tools
 *   7. @dev roda build para verificar
 *
 * Saída JSON:
 *   { changes: [{ action, file, old_string, new_string }], tokens_used, model }
 */

const fs   = require('fs');
const path = require('path');

// ── Carregar .env
const ENV_PATH = path.join(__dirname, '..', '.env');
try {
  fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch {}

const { dispatchWithFallback } = require('./codex-dispatcher');

// ── Parse de args CLI
const args    = process.argv.slice(2);
const getArg  = (name) => {
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a ? a.slice(`--${name}=`.length).replace(/^["']|["']$/g, '') : null;
};

const task       = getArg('task')   || args.find(a => !a.startsWith('--')) || '';
const plan       = getArg('plan')   || '';
const filesArg   = getArg('files')  || '';
const files      = filesArg.split(',').map(f => f.trim()).filter(Boolean);
const outputPath = getArg('output') || path.join(__dirname, 'squad-codex-output.json');

if (!task) {
  console.error('\nUso: node .aiox/squad-codex-bridge.js \\\n'
    + '       --task="Descrição da task" \\\n'
    + '       --plan="Plano do @architect" \\\n'
    + '       --files="path/file1.tsx,path/file2.ts"\n');
  process.exit(1);
}

// ── Verificar modo de execução
const modePath = path.join(__dirname, 'execution-mode.json');
const modeConfig = JSON.parse(fs.readFileSync(modePath, 'utf8'));
if (modeConfig.execution_mode !== 'economico') {
  console.warn(`⚠️  execution_mode = "${modeConfig.execution_mode}". Bridge é para modo ECONOMICO.`);
  console.warn('   Use: node .aiox/execution-engine.js toggle economico\n');
}

// ── System prompt: instrui Codex a responder APENAS JSON
const SYSTEM_PROMPT = [
  'Você é um engenheiro sênior de TypeScript, React e Node.js.',
  'Receberá uma task de desenvolvimento com plano e arquivos de contexto.',
  'Sua resposta DEVE ser APENAS um JSON array válido, sem markdown, sem explicações.',
  '',
  'Formato obrigatório:',
  '[',
  '  {',
  '    "action": "edit",',
  '    "file": "caminho/relativo/do/arquivo",',
  '    "old_string": "string EXATA como aparece no arquivo",',
  '    "new_string": "string de substituição"',
  '  },',
  '  {',
  '    "action": "create",',
  '    "file": "caminho/novo/arquivo",',
  '    "content": "conteúdo completo do arquivo"',
  '  }',
  ']',
  '',
  'REGRAS CRÍTICAS:',
  '- Retorne SOMENTE JSON válido. Nenhum texto fora do array.',
  '- old_string deve ser exatamente como aparece no arquivo (verbatim, case-sensitive).',
  '- old_string deve ser única o suficiente para não ter ambiguidade.',
  '- Se nenhuma mudança for necessária, retorne: []',
  '- Preserve indentação e estilo do código existente.',
  '- Escreva comentários e strings em português quando necessário.',
].join('\n');

// ── Ler arquivos para contexto
function readFiles(filePaths) {
  const root = path.join(__dirname, '..');
  return filePaths.map(fp => {
    const full = path.resolve(root, fp);
    try {
      const content = fs.readFileSync(full, 'utf8');
      return `### ${fp}\n\`\`\`\n${content}\n\`\`\``;
    } catch {
      return `### ${fp}\n[arquivo não encontrado]`;
    }
  }).join('\n\n');
}

// ── Parser do JSON retornado pelo Codex
function parseCodexResponse(raw) {
  // Remover possível markdown (```json ... ```) caso Codex adicione
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Resposta não é um array JSON');
    return { changes: parsed, error: null };
  } catch (err) {
    return { changes: [], error: `Falha ao parsear JSON do Codex: ${err.message}`, raw: cleaned };
  }
}

// ── Atualizar stats do execution-mode.json
function updateStats(tokensUsed) {
  modeConfig.stats.total_tasks_economico = (modeConfig.stats.total_tasks_economico || 0) + 1;
  modeConfig.stats.tokens_saved = (modeConfig.stats.tokens_saved || 0) + Math.round(tokensUsed * 0.85);
  modeConfig.stats.last_updated = new Date().toISOString();
  fs.writeFileSync(modePath, JSON.stringify(modeConfig, null, 2));
}

async function run() {
  console.log('\n🤖 Squad Codex Bridge [MODO ECONÔMICO]');
  console.log('═══════════════════════════════════════════');
  console.log(`📋 Task: ${task.substring(0, 80)}${task.length > 80 ? '...' : ''}`);
  console.log(`📁 Arquivos: ${files.length > 0 ? files.join(', ') : '(nenhum)'}`);
  console.log('═══════════════════════════════════════════\n');

  // Montar contexto completo
  const sections = [];
  if (plan) {
    sections.push(`## Plano do Architect\n${plan}`);
  }
  if (files.length > 0) {
    sections.push(`## Arquivos de Contexto\n${readFiles(files)}`);
  }
  const context = sections.join('\n\n');

  console.log('📡 [Codex] Gerando implementação via gpt-5.4...\n');

  const result = await dispatchWithFallback({ task, context, systemPrompt: SYSTEM_PROMPT });

  if (!result) {
    console.error('❌ Codex indisponível (fallback). Claude deve implementar diretamente.');
    console.error('   Verifique o token OAuth: node .aiox/oauth/pkce-flow.js\n');
    process.exit(2);
  }

  console.log('✅ Resposta recebida do Codex.\n');

  const { changes, error, raw } = parseCodexResponse(result.content);

  // Salvar output completo
  const outputData = {
    task,
    plan: plan || null,
    files,
    model:        result.model,
    tokens_used:  result.tokens_used,
    changes,
    parse_error:  error || null,
    raw_response: result.content,
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

  // Relatório
  console.log('═══════════════════════════════════════════');
  if (error) {
    console.error(`⚠️  Erro de parsing: ${error}`);
    if (raw) console.log('\nResposta bruta do Codex:\n', raw.substring(0, 500));
  } else if (changes.length === 0) {
    console.log('ℹ️  Codex indicou: sem mudanças necessárias.');
  } else {
    console.log(`📦 ${changes.length} change(s) gerada(s):\n`);
    changes.forEach((c, i) => {
      const label = c.action === 'edit'
        ? `EDIT ${c.file} (${(c.old_string || '').substring(0, 40).replace(/\n/g, '↵')}...)`
        : `CREATE ${c.file}`;
      console.log(`  ${i + 1}. [${c.action.toUpperCase()}] ${label}`);
    });
  }

  console.log(`\n💰 Tokens Codex: ${result.tokens_used}`);
  console.log(`💾 Output: ${outputPath}`);
  console.log('═══════════════════════════════════════════\n');

  updateStats(result.tokens_used);

  // Imprimir JSON final para @dev aplicar
  if (changes.length > 0) {
    console.log('## CHANGES (para @dev aplicar com Edit/Write tools):\n');
    console.log(JSON.stringify(changes, null, 2));
  }

  process.exit(error ? 1 : 0);
}

run().catch(err => {
  console.error('\n❌ Erro fatal no bridge:', err.message, '\n');
  process.exit(1);
});
