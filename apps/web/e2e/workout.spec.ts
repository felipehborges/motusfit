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

  await page.getByRole('link', { name: 'Treinos' }).click();

  // Criar rotina com exercício novo
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByLabel('Nome da rotina').fill('Push E2E');
  await page.getByRole('button', { name: 'novo exercício' }).click();
  await page.getByLabel('Nome do exercício').fill(exerciseName);
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await expect(page.getByText(exerciseName)).toBeVisible();
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByText('Push E2E')).toBeVisible();

  // Iniciar sessão e registrar 2 séries
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await expect(page.getByRole('heading', { name: 'Push E2E' })).toBeVisible();

  await page.getByLabel('Reps').fill('10');
  await page.getByLabel('Carga (kg)').fill('60');
  await page.getByRole('button', { name: '✓ Série feita' }).click();
  await expect(page.getByText('#1 — 10 reps × 60 kg')).toBeVisible();
  await expect(page.getByText(/descanso: \d+s/)).toBeVisible();

  await page.getByLabel('Reps').fill('8');
  await page.getByLabel('Carga (kg)').fill('65');
  await page.getByRole('button', { name: '✓ Série feita' }).click();
  await expect(page.getByText('#2 — 8 reps × 65 kg')).toBeVisible();

  // Volume = 60×10 + 65×8 = 1120 kg
  await expect(page.getByText(/1120 kg de volume/)).toBeVisible();

  await page.getByRole('button', { name: 'Concluir treino' }).click();

  // Histórico mostra a sessão concluída
  await expect(page.getByRole('heading', { name: 'Histórico' })).toBeVisible();
  await expect(page.getByText(/2 séries · 1120 kg/)).toBeVisible();
});
