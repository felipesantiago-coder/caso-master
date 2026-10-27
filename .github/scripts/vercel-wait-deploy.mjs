#!/usr/bin/env node
/**
 * Aguarda a conclusao do deploy de producao no Vercel referente ao commit
 * disparador (COMMIT_SHA). Usado pelo workflow de limpeza para so remover
 * deploys antigos depois que o novo deploy estiver de fato pronto (READY).
 *
 * Variaveis de ambiente:
 *   VERCEL_TOKEN       (obrigatorio) token de acesso da API da Vercel
 *   VERCEL_PROJECT_ID  (obrigatorio) id ou nome do projeto, ex. prj_... ou caso-master
 *   COMMIT_SHA         (opcional) sha do commit que disparou o deploy
 *   WAIT_TIMEOUT_MIN   (opcional) tempo limite em minutos, padrao 30
 *
 * Saida: exit 0 se o novo deploy ficou READY (ou se nenhum deploy novo
 * apareceu no periodo de graca, apenas avisa); exit 1 se o novo deploy
 * falhou (ERROR/CANCELED).
 */

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const SHA = process.env.COMMIT_SHA || '';
const TIMEOUT_MS = (parseInt(process.env.WAIT_TIMEOUT_MIN || '30', 10) || 30) * 60 * 1000;
const POLL_MS = 15000;
const GRACE_MS = 5 * 60 * 1000; // tempo extra aguardando surgir deploy novo

if (!TOKEN || !PROJECT) {
  console.error('ERRO: VERCEL_TOKEN e VERCEL_PROJECT_ID sao obrigatorios.');
  process.exit(1);
}

const base = 'https://api.vercel.com';
const q = (extra = '') =>
  `?projectId=${encodeURIComponent(PROJECT)}&target=production&limit=10${extra}`;

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
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function listProduction() {
  const data = await api(`/v6/deployments${q()}`);
  return (data.deployments || []).sort((a, b) => b.created - a.created);
}

async function main() {
  const started = Date.now();
  const first = await listProduction();
  const beforeTs = first.length ? first[0].created : 0;
  const shortSha = SHA ? SHA.slice(0, 7) : '';
  console.log(
    `Aguardando deploy de producao${shortSha ? ` do commit ${shortSha}` : ''} (marco anterior: ${new Date(beforeTs).toISOString()}).`
  );

  while (Date.now() - started < TIMEOUT_MS) {
    const deploys = await listProduction();
    const target =
      deploys.find((d) => shortSha && (d.meta?.githubCommitSha || '').startsWith(shortSha)) ||
      (deploys[0] && deploys[0].created > beforeTs ? deploys[0] : null);

    if (!target) {
      const elapsed = Date.now() - started;
      // Nenhum deploy novo registrado ainda; se passar da carencia, segue sem bloquear.
      if (elapsed > GRACE_MS && !deploys.some((d) => (d.meta?.githubCommitSha || '').startsWith(shortSha))) {
        console.log('Nenhum deploy novo detectado ate agora; seguindo para a limpeza (ela mantem os 2 mais recentes de qualquer forma).');
        process.exit(0);
      }
      console.log(`  deploy ainda nao registrado; aguardando... (${Math.round(elapsed / 1000)}s)`);
      await new Promise((r) => setTimeout(r, POLL_MS));
      continue;
    }

    if (target.readyState === 'READY') {
      console.log(`Deploy ${target.uid} READY (sha ${(target.meta?.githubCommitSha || '').slice(0, 7) || 'n/d'}).`);
      process.exit(0);
    }
    if (target.readyState === 'ERROR' || target.readyState === 'CANCELED') {
      console.error(`Deploy ${target.uid} terminou como ${target.readyState}; limpeza cancelada.`);
      process.exit(1);
    }
    console.log(`  deploy ${target.uid} em ${target.readyState}; aguardando... (${Math.round((Date.now() - started) / 1000)}s)`);
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  console.log('Tempo limite atingido sem confirmacao de READY; seguindo para a limpeza.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha ao consultar a API da Vercel:', err.message);
  process.exit(1);
});
