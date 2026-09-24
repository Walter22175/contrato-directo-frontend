import { test, expect } from '@playwright/test';

test.describe('Flujo completo de contratación (4 pasos)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'cliente@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Flujo completo: Búsqueda → Selección → Pago → Confirmación', async ({ page }) => {
    // PASO 1: Búsqueda
    await test.step('Paso 1: Búsqueda de servicio', async () => {
      await page.goto('/servicios');
      await expect(page.locator('h1')).toContainText('Buscar Servicios');
      
      // Buscar servicio
      await page.fill('input[placeholder="¿Qué servicio buscás?"]', 'Plomería');
      await page.waitForTimeout(500);
      
      // Verificar resultados
      const tarjetas = page.locator('a[href^="/servicios/"]');
      await expect(tarjetas.first()).toBeVisible();
      
      // Click en primer servicio
      await tarjetas.first().click();
      await expect(page).toHaveURL(/\/servicios\//);
    });

    // PASO 2: Selección
    await test.step('Paso 2: Selección de proveedor', async () => {
      await expect(page.locator('h1')).toBeVisible();
      
      // Verificar que hay proveedores
      const proveedores = page.locator('a[href^="/proveedores/"]');
      await expect(proveedores.first()).toBeVisible();
      
      // Click en "Contactar Proveedor" (button en sidebar)
      await page.click('button:has-text("Contactar Proveedor")');
      
      // Debe redirigir a checkout
      await expect(page).toHaveURL(/\/checkout/);
    });

    // PASO 3: Pago
    await test.step('Paso 3: Pago con Mercado Pago', async () => {
      await expect(page.locator('h1')).toContainText('Checkout');
      
      // Verificar timer visual
      await expect(page.locator('text=Tiempo en Paso de Pago')).toBeVisible();
      await expect(page.locator('text=Paso 3/4')).toBeVisible();
      
      // Verificar métodos de pago
      await expect(page.locator('text=Tarjeta Crédito/Débito')).toBeVisible();
      await expect(page.locator('text=Transferencia')).toBeVisible();
      
      // Verificar resumen de costos
      await expect(page.locator('text=Total a Pagar')).toBeVisible();
      
      // Seleccionar tarjeta (ya seleccionada por defecto)
      await expect(page.locator('text=Tarjeta Crédito/Débito').locator('..')).toHaveClass(/border-cyan-500/);
      
      // Verificar que el checkout de Mercado Pago se renderiza
      // Nota: En test real, el SDK de MP cargaría el iframe
      // Aquí verificamos que el contenedor existe
      await expect(page.locator('#mercadopago-checkout')).toBeVisible();
    });

    // PASO 4: Confirmación (simulado - no completamos pago real en test)
    await test.step('Paso 4: Página de éxito (simulada)', async () => {
      // Navegamos directamente a la página de éxito con parámetros de prueba
      await page.goto('/checkout/exito?id_transaccion=test-uuid&tiempo=45');
      
      await expect(page.locator('h1')).toContainText('¡Pago Confirmado!');
      await expect(page.locator('text=Tiempo de pago')).toBeVisible();
      await expect(page.locator('text=Detalle de la Transacción')).toBeVisible();
      
      // Verificar encuesta SUS
      await expect(page.locator('text=¡Tu opinión nos importa!')).toBeVisible();
      await expect(page.locator('input[type="range"]')).toBeVisible();
      
      // Enviar SUS
      await page.fill('textarea[placeholder="¿Qué te gustó? ¿Qué mejoraríamos?"]', 'Test E2E - Todo perfecto');
      await page.click('button:has-text("Enviar Encuesta")');
      
      // Verificar que se envió
      await expect(page.locator('text=¡Gracias por tu feedback!')).toBeVisible({ timeout: 5000 });
    });
  });

  test('Flujo con pago fallido y reintento', async ({ page }) => {
    await test.step('Navegar a página de fallo', async () => {
      await page.goto('/checkout/fallo?id_transaccion=test-uuid&error=rejected&tiempo=30');
      
      await expect(page.locator('h1')).toContainText('Pago Rechazado');
      await expect(page.locator('text=¿Qué podés hacer?')).toBeVisible();
      
      // Verificar botones de acción
      await expect(page.locator('button:has-text("Reintentar Pago")')).toBeVisible();
      await expect(page.locator('button:has-text("Contactar Soporte")')).toBeVisible();
      
      // Click en reintentar
      await page.click('button:has-text("Reintentar Pago")');
      
      // Debe redirigir al checkout
      await expect(page).toHaveURL(/\/checkout/);
    });
  });
});

test.describe('Métricas y KPIs', () => {
  test('Verificar endpoint de métricas', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@contratodirecto.com');
    await page.fill('input[name="password"]', 'Admin2026!');
    await page.click('button[type="submit"]');
    
    await page.goto('/dashboard/admin/metricas');
    
    await expect(page.locator('text=KPIs')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tiempo promedio')).toBeVisible();
    await expect(page.locator('text=Tasa de éxito')).toBeVisible();
    await expect(page.locator('text=SUS')).toBeVisible();
  });
});