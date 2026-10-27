#!/usr/bin/env node
/**
 * Limpeza de deploys do projeto na Vercel.
 *
 * Politica: apos cada deploy bem sucedido, mantem apenas o deploy atual
 * (o mais recente READY de producao, que esta em producao/aliased) e o
 * anterior (o segundo mais recente READY de producao). Todo o resto
 * (deploys antigos, falhos ou cancelados em estado terminal) e removido.
 *
 * Variaveis de ambiente:
 *   VERCEL_TOKEN       (obrigatorio) token de acesso da API da Vercel
 *   VERCEL_PROJECT_ID  (obrigatorio) id ou nome do projeto, ex. prj_... ou caso-master
 *   KEEP_COUNT         (opcional) quantos deploys READY de producao manter, padrao 2
 */

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const KEEP = Math.max(1, parseInt(process.env.KEEP_COUNT || '2', 10) || 2);

if (!TOKEN || !PROJECT) {
  console.error('ERRO: VERCEL_TOKEN e VERCEL_PROJECT_ID sao obrigatorios.');
  process.exit(1);
}

const base = 'https://api.vercel.com';
const TERMINAL = new Set(['READY', 'ERROR', 'CANCELED']);

async function api(path, opts = {}, tries = 5) {
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) },
  });
  if (res.status === 429 && tries > 0) {
    const wait = (parseInt(res.headers.get('retry-after') || '10', 10) || 10) * 1000;
    console.log(`  limite de requicoes (429), aguardando ${wait / 1000}s...`);
    await new Promise((r) => setTimeout(r, wait));
    return api(path, opts, tries - 1);
  }
  const body = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`API ${res.status}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : {};
}

async function fetchAllDeployments() {
  const all = [];
  let until = '';
  for (let page = 0; page < 20; page += 1) {
    const extra = until ? `&until=${until}` : '';
    const data = await api(`/v6/deployments?projectId=${encodeURIComponent(PROJECT)}&limit=100${extra}`);
    const batch = data.deployments || [];
    all.push(...batch);
    if (batch.length < 100) break;
    until = Math.min(...batch.map((d) => d.created)) - 1;
  }
  return all.sort((a, b) => b.created - a.created);
}

async function deleteDeployment(uid) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await api(`/v13/deployments/${uid}`, { method: 'DELETE' });
      return { ok: true };
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('API 404')) return { ok: true, alreadyGone: true };
      if (attempt === 3) return { ok: false, error: msg };
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
}

async function main() {
  const deploys = await fetchAllDeployments();
  console.log(`Total de deploys no projeto: ${deploys.length}`);

  const readyProduction = deploys.filter((d) => d.target === 'production' && d.readyState === 'READY');
  const keepUids = new Set(readyProduction.slice(0, KEEP).map((d) => d.uid));
  const kept = deploys.filter((d) => keepUids.has(d.uid));
  console.log('Mantidos:');
  kept.forEach((d) =>
    console.log(`  + ${d.uid}  ${d.readyState}  ${new Date(d.created).toISOString()}  sha ${(d.meta?.githubCommitSha || 'n/d').slice(0, 7)}`)
  );
  if (readyProduction.length > KEEP) {
    console.log(`  (política: manter ${KEEP} deploys READY de producao; os demais serao removidos)`);
  }

  const toDelete = deploys.filter((d) => !keepUids.has(d.uid) && TERMINAL.has(d.readyState));
  const skipped = deploys.filter((d) => !keepUids.has(d.uid) && !TERMINAL.has(d.readyState));
  if (skipped.length) {
    console.log(`Ignorados (em andamento, estado nao terminal): ${skipped.map((d) => d.uid).join(', ')}`);
  }

  let failures = 0;
  for (const d of toDelete) {
    const sha = (d.meta?.githubCommitSha || 'n/d').slice(0, 7);
    const res = await deleteDeployment(d.uid);
    if (res.ok) {
      console.log(`  - removido ${d.uid} (${d.readyState}, ${new Date(d.created).toISOString()}, sha ${sha})${res.alreadyGone ? ' ja inexistente' : ''}`);
    } else {
      failures += 1;
      console.error(`  ! falha ao remover ${d.uid}: ${res.error}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`Concluido: ${toDelete.length - failures} removidos, ${kept.length} mantidos (atual e anterior), ${failures} falhas.`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error('Falha na limpeza:', err.message);
  process.exit(1);
});
