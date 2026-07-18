import { expect, test } from '@playwright/test';

// Fluxo crítico nº 1 (docs/product.md): registrar uma refeição.
test('signup → criar alimento → registrar refeição → totais do dia', async ({ page }) => {
  const unique = Date.now();
  const foodName = `Frango E2E ${unique}`;

  await page.goto('/signup');
  await page.getByLabel('Nome').fill('Usuária E2E');
  await page.getByLabel('E-mail').fill(`e2e-${unique}@motusfit.test`);
  await page.getByLabel('Senha').fill('senha-segura-123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByRole('heading', { name: /Hoje/ })).toBeVisible();

  // Adicionar alimento novo no almoço (segunda seção)
  await page.getByRole('button', { name: '+ Adicionar alimento' }).nth(1).click();
  await page.getByRole('button', { name: 'novo alimento' }).click();
  await page.getByLabel('Nome').fill(foodName);
  await page.getByLabel('kcal', { exact: true }).fill('165');
  await page.getByLabel('Proteína (g)').fill('31');
  await page.getByLabel('Carbo (g)').fill('0');
  await page.getByLabel('Gordura (g)').fill('3.6');
  await page.getByRole('button', { name: 'Salvar alimento' }).click();

  // Alimento criado já vem selecionado — ajustar quantidade e adicionar
  await page.getByLabel(/Quantidade/).fill('150');
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

  // Entrada aparece e totais refletem 150 g
  await expect(page.getByText(`${foodName} — 150 g`)).toBeVisible();
  await expect(page.getByText('248 kcal · P 46.5 · C 0 · G 5.4')).toBeVisible();

  // Remover recalcula
  await page.getByRole('button', { name: `Remover ${foodName}` }).click();
  await expect(page.getByText(`${foodName} — 150 g`)).not.toBeVisible();
});
