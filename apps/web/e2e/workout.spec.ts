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
  await expect(page.getByRole('heading', { name: /Seu treino em perspectiva/i })).toBeVisible();
  await expect(
    page.getByText('Nenhuma sessão concluída hoje. Sua rotina está a um clique.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resumo da semana' })).toBeVisible();

  await page.getByRole('link', { name: 'Treinos', exact: true }).click();

  // Criar rotina com exercício novo
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByLabel('Nome da rotina').fill('Push E2E');
  await page.getByRole('button', { name: 'Não encontrou? Criar exercício' }).click();
  await page.getByLabel('Nome do exercício').fill(exerciseName);
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await expect(page.getByText(exerciseName)).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Descanso (s)', exact: true }).fill('120');
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByText('Push E2E')).toBeVisible();

  // Iniciar sessão e registrar 2 séries
  await page.getByRole('button', { name: 'Iniciar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Push E2E' })).toBeVisible();

  await page.getByRole('spinbutton', { name: 'Reps', exact: true }).fill('10');
  await page.getByRole('spinbutton', { name: 'Carga (kg)', exact: true }).fill('60');
  await page.getByRole('button', { name: 'Série feita' }).click();
  const sets = page.locator('.mf-set-row-complete');
  await expect(sets).toHaveCount(1);
  await expect(sets.nth(0)).toContainText(/60\s*kg\s*10\s*reps/);
  await expect(page.getByText('Salvo', { exact: true })).toBeVisible();
  await expect(page.locator('.mf-rest-timer')).toContainText(/01:(?:59|58)/);

  // O descanso configurado na rotina continua após recarregar a sessão.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Push E2E' })).toBeVisible();
  await expect(page.locator('.mf-rest-timer')).toContainText(/01:(?:5\d|4\d)/);

  await page.getByRole('spinbutton', { name: 'Reps', exact: true }).fill('8');
  await page.getByRole('spinbutton', { name: 'Carga (kg)', exact: true }).fill('65');
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

  // Logout encerra a sessão e a área protegida redireciona para o login.
  const signOutRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/sign-out')) signOutRequests.push(request.url());
  });
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(signOutRequests).toHaveLength(1);
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login$/);
});
