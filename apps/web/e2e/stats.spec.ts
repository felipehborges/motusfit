import { expect, test } from '@playwright/test';

// Fase 6: estatísticas semanais devem refletir um treino recém-concluído.
test('treino concluído aparece nas estatísticas da semana', async ({ page }) => {
  const unique = Date.now();
  const exerciseName = `Agachamento E2E ${unique}`;

  await page.goto('/signup');
  await page.getByLabel('Nome').fill('Estatística E2E');
  await page.getByLabel('E-mail').fill(`e2e-s-${unique}@motusfit.test`);
  await page.getByLabel('Senha').fill('senha-segura-123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: /Seu treino, hoje/i })).toBeVisible();

  await page.getByRole('link', { name: 'Treinos', exact: true }).click();
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByLabel('Nome da rotina').fill('Legs E2E');
  await page.getByRole('button', { name: 'Não encontrou? Criar exercício' }).click();
  await page.getByLabel('Nome do exercício').fill(exerciseName);
  await page.getByLabel('Grupo muscular').selectOption('legs');
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await expect(page.getByText(exerciseName)).toBeVisible();
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByText('Legs E2E')).toBeVisible();

  await page.getByRole('button', { name: 'Iniciar', exact: true }).click();
  await page.getByLabel('Reps').fill('10');
  await page.getByLabel('Carga (kg)').fill('100');
  await page.getByRole('button', { name: 'Série feita' }).click();
  await expect(page.locator('.mf-set-list > li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Concluir treino' }).click();
  await expect(page.getByRole('heading', { name: 'Atividade recente' })).toBeVisible();

  await page.getByRole('link', { name: 'Progresso' }).click();
  await expect(page.getByRole('heading', { name: 'Evolução em números.' })).toBeVisible();

  // 1 sessão, volume 1000 kg, e grupo "Pernas" com 1 série
  const sessoesBox = page.getByText('Sessões').locator('..');
  await expect(sessoesBox.getByText('1')).toBeVisible();
  await expect(page.locator('.mf-stats-metrics').getByText('1.000', { exact: true })).toBeVisible();
  await expect(page.getByText('Pernas')).toBeVisible();
});
