import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Auditoría Automatizada de Accesibilidad con axe-core (WCAG 2.2 AA)', () => {
  test('Página Principal (/) cumple con reglas WCAG 2.2 AA', async ({ page }) => {
    // Interceptar /api/clima para hermeticidad
    await page.route('**/api/clima*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          coordenadas: { lat: 4.61, lng: -74.08 },
          zonaHoraria: 'America/Bogota',
          temperaturaActualCelsius: 18.5,
          temperaturaActualFahrenheit: 65.3,
          sensacionTermicaCelsius: 18.0,
          sensacionTermicaFahrenheit: 64.4,
          humedadRelativa: 65,
          velocidadVientoKmH: 12.0,
          codigoWmo: 0,
          descripcion: 'Cielo despejado',
          icono: '☀️',
          pronostico24Horas: [
            {
              hora: '2026-11-14T13:00:00.000Z',
              temperaturaCelsius: 19.0,
              temperaturaFahrenheit: 66.2,
              sensacionTermicaCelsius: 19.0,
              sensacionTermicaFahrenheit: 66.2,
              codigoWmo: 0,
              descripcion: 'Cielo despejado',
              probabilidadPrecipitacion: 5,
              humedadRelativa: 60,
              velocidadVientoKmH: 10,
            },
          ],
          pronostico7Dias: [
            {
              fecha: '2026-11-14',
              temperaturaMinCelsius: 10.0,
              temperaturaMaxCelsius: 20.0,
              temperaturaMinFahrenheit: 50.0,
              temperaturaMaxFahrenheit: 68.0,
              codigoWmo: 0,
              descripcion: 'Cielo despejado',
              probabilidadPrecipitacionMax: 10,
              amanecer: '2026-11-14T06:00:00.000Z',
              atardecer: '2026-11-14T18:00:00.000Z',
            },
          ],
          obtenidoEn: new Date().toISOString(),
          desdeCache: false,
          antiguedadMinutos: 0,
        }),
      });
    });

    await page.goto('/');
    await page.waitForSelector('#contenido-principal');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Página de Búsqueda (/buscar) cumple con reglas WCAG 2.2 AA', async ({ page }) => {
    await page.goto('/buscar');
    await page.waitForSelector('input[role="combobox"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Página de Favoritas (/ciudades) cumple con reglas WCAG 2.2 AA', async ({ page }) => {
    await page.route('**/api/ciudades', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ciudades: [] }),
      });
    });

    await page.goto('/ciudades');
    await page.waitForSelector('#contenido-principal');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
