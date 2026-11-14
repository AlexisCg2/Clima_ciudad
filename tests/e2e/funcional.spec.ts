import { test, expect } from '@playwright/test';

test.describe('Validación Funcional End-to-End (Criterios de Aceptación RF-01 a RF-06)', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar API de clima para ejecución hermética y determinista
    await page.route('**/api/clima*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          coordenadas: { lat: 4.61, lng: -74.08 },
          zonaHoraria: 'America/Bogota',
          temperaturaActualCelsius: 20.0,
          temperaturaActualFahrenheit: 68.0,
          sensacionTermicaCelsius: 20.0,
          sensacionTermicaFahrenheit: 68.0,
          humedadRelativa: 60,
          velocidadVientoKmH: 10.0,
          codigoWmo: 0,
          descripcion: 'Cielo despejado',
          icono: '☀️',
          pronostico24Horas: [
            {
              hora: '2026-11-14T13:00:00.000Z',
              temperaturaCelsius: 21.0,
              temperaturaFahrenheit: 69.8,
              sensacionTermicaCelsius: 21.0,
              sensacionTermicaFahrenheit: 69.8,
              codigoWmo: 0,
              descripcion: 'Cielo despejado',
              probabilidadPrecipitacion: 0,
              humedadRelativa: 55,
              velocidadVientoKmH: 8,
            },
          ],
          pronostico7Dias: [
            {
              fecha: '2026-11-14',
              temperaturaMinCelsius: 12.0,
              temperaturaMaxCelsius: 22.0,
              temperaturaMinFahrenheit: 53.6,
              temperaturaMaxFahrenheit: 71.6,
              codigoWmo: 0,
              descripcion: 'Cielo despejado',
              probabilidadPrecipitacionMax: 5,
              amanecer: '2026-11-14T05:45:00.000Z',
              atardecer: '2026-11-14T17:45:00.000Z',
            },
          ],
          obtenidoEn: new Date().toISOString(),
          desdeCache: false,
          antiguedadMinutos: 0,
        }),
      });
    });
  });

  test('RF-02 y RF-05: Carga página principal con clima actual, pronóstico 24h y 7 días', async ({ page }) => {
    await page.goto('/');

    // Verificar encabezado principal accesible
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bogotá');

    // Verificar secciones de pronóstico
    await expect(page.getByRole('heading', { level: 2, name: /próximas 24 horas/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /pronóstico de 7 días/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /obtener clima para mi ubicación actual/i })).toBeVisible();
  });

  test('RF-03: Alternar entre Celsius y Fahrenheit actualiza la interfaz', async ({ page }) => {
    await page.goto('/');

    // Localizar botón de cambio de unidad en cabecera
    const botonUnidad = page.getByRole('button', { name: /cambiar a grados fahrenheit/i });
    await expect(botonUnidad).toBeVisible();

    // Estado inicial en Celsius
    await expect(page.getByText('°C').first()).toBeVisible();

    // Alternar a Fahrenheit
    await botonUnidad.click();

    // Comprobar que muestra °F
    await expect(page.getByText('°F').first()).toBeVisible();
  });

  test('RF-01: Búsqueda de ciudades ofrece combobox y permite seleccionar resultado', async ({ page }) => {
    await page.route('**/api/ciudades/buscar*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ciudades: [
            {
              id: 101,
              nombre: 'Medellín',
              pais: 'Colombia',
              region: 'Antioquia',
              lat: 6.25,
              lng: -75.56,
            },
          ],
        }),
      });
    });

    await page.goto('/buscar');

    const input = page.getByLabel('Buscar ciudad por nombre');
    await input.fill('Medellin');

    // Esperar a que aparezca la opción en el listbox
    const opcion = page.getByRole('option', { name: /medellín/i });
    await expect(opcion).toBeVisible();

    // Seleccionar opción
    await opcion.click();

    // Comprobar que se carga la información de Medellín como encabezado de nivel 2
    await expect(page.getByRole('heading', { level: 2, name: /medellín/i })).toBeVisible();
  });

  test('Accesibilidad y Teclado: Enlace "Saltar al contenido principal" es navegable por Tab', async ({ page }) => {
    await page.goto('/');

    // Pulsar tecla Tab para enfocar el skip-link
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: /saltar al contenido principal/i });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test('Responsive: Comprobar ausencia de desplazamiento horizontal en 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await page.waitForSelector('#contenido-principal');

    const desbordamiento = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(desbordamiento).toBe(false);
  });
});
