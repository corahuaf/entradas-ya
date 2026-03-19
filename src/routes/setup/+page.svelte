<script lang="ts">
	let resetting = false;
	let status = '';
	let error = '';
	let productos: any[] = [];

	async function setupCompleto() {
		resetting = true;
		error = '';
		status = 'Inicializando...';
		productos = [];

		try {
			const response = await fetch('/api/setup-completo', { method: 'POST' });
			const result = await response.json();

			if (result.success) {
				status = `✅ ${result.message}`;
				productos = result.productos || [];
			} else {
				error = `❌ Error: ${result.message}`;
			}
		} catch (e) {
			error = `❌ Error de conexión: ${e}`;
		} finally {
			resetting = false;
		}
	}
</script>

<div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white;">
	<div style="max-width: 800px; margin: 0 auto;">
		<h1>🔧 Reiniciar Sistema Completamente</h1>

		<div style="background: white; color: #333; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
			<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
				<strong>⚠️ Advertencia:</strong> Este proceso eliminará la tabla de productos actual y la recreará con los datos por defecto.
			</div>

			<button
				onclick={setupCompleto}
				disabled={resetting}
				style="width: 100%; padding: 15px; font-size: 1.1rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;"
			>
				{resetting ? '⏳ Inicializando...' : '🚀 INICIALIZAR SISTEMA'}
			</button>
		</div>

		{#if status}
			<div
				style="background: white; color: #333; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #2ecc71;"
			>
				<p style="margin: 0; font-weight: bold;">{status}</p>
			</div>
		{/if}

		{#if error}
			<div
				style="background: white; color: #333; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #e74c3c;"
			>
				<p style="margin: 0; font-weight: bold;">{error}</p>
			</div>
		{/if}

		{#if productos.length > 0}
			<div style="background: white; color: #333; padding: 20px; border-radius: 12px;">
				<h3 style="margin-top: 0;">✅ Productos Creados ({productos.length})</h3>
				<table style="width: 100%; border-collapse: collapse;">
					<thead>
						<tr style="background: #f4f4f9; border-bottom: 2px solid #ddd;">
							<th style="padding: 12px; text-align: left;">Producto</th>
							<th style="padding: 12px; text-align: right;">Precio</th>
							<th style="padding: 12px; text-align: center;">Activo</th>
						</tr>
					</thead>
					<tbody>
						{#each productos as prod}
							<tr style="border-bottom: 1px solid #ddd;">
								<td style="padding: 12px;">{prod.nombre}</td>
								<td style="padding: 12px; text-align: right;"><strong>S/. {Number(prod.precio).toFixed(2)}</strong></td>
								<td style="padding: 12px; text-align: center; color: {prod.activo ? 'green' : 'red'};">
									{prod.activo ? '✓' : '✗'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<div style="margin-top: 20px; padding: 15px; background: #d5f4e6; border-radius: 8px; color: #27ae60;">
					<strong>✅ Ahora puedes ir a:</strong>
					<ul style="margin: 10px 0;">
						<li><a href="/ventas" style="color: #27ae60; font-weight: bold;">📊 Ir a Ventas</a></li>
						<li><a href="/validar" style="color: #27ae60; font-weight: bold;">🔐 Ir a Validar</a></li>
						<li><a href="/admin" style="color: #27ae60; font-weight: bold;">📈 Ir a Admin</a></li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	a {
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
