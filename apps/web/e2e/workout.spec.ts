import { expect, test } from '@playwright/test';

// Fluxo crítico nº 2 (docs/product.md): executar um treino.
test('rotina → sessão → séries → concluir → histórico', async ({ page }) => {
  const unique = Date.now();
  const exerciseName = `Supino E2E ${unique}`;

  await page.goto('/signup');
  await page.getByLabel('Nome').fill('Atleta E2E');
  await page.getByLabel('E-mail').fill(`e2e-w-${unique}@motusfit.test`);
  await page.getByLabel('Senha').fill('senha-segura-123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: /Seu treino, hoje/i })).toBeVisible();

  await page.getByRole('link', { name: 'Treinos', exact: true }).click();

  // Criar rotina com exercício novo
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByLabel('Nome da rotina').fill('Push E2E');
  await page.getByRole('button', { name: 'Não encontrou? Criar exercício' }).click();
  await page.getByLabel('Nome do exercício').fill(exerciseName);
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await expect(page.getByText(exerciseName)).toBeVisible();
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByText('Push E2E')).toBeVisible();

  // Iniciar sessão e registrar 2 séries
  await page.getByRole('button', { name: 'Iniciar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Push E2E' })).toBeVisible();

  await page.getByLabel('Reps').fill('10');
  await page.getByLabel('Carga (kg)').fill('60');
  await page.getByRole('button', { name: 'Série feita' }).click();
  const sets = page.locator('.mf-set-list > li');
  await expect(sets).toHaveCount(1);
  await expect(sets.nth(0)).toContainText(/60\s*kg\s*10\s*reps/);
  await expect(page.locator('.mf-rest-timer')).toContainText(/\d+s/);

  await page.getByLabel('Reps').fill('8');
  await page.getByLabel('Carga (kg)').fill('65');
  await page.getByRole('button', { name: 'Série feita' }).click();
  await expect(sets).toHaveCount(2);
  await expect(sets.nth(1)).toContainText(/65\s*kg\s*8\s*reps/);

  // Volume = 60×10 + 65×8 = 1120 kg
  await expect(
    page.locator('.mf-session-metrics').getByText('1120', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Concluir treino' }).click();

  // Histórico mostra a sessão concluída
  await expect(page.getByRole('heading', { name: 'Atividade recente' })).toBeVisible();
  await expect(page.getByText(/2\s*séries\s*1120\s*kg/)).toBeVisible();
});
