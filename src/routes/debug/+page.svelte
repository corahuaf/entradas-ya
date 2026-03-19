<script lang="ts">
	import { onMount } from 'svelte';

	let datos: any = null;
	let loading = true;
	let error = '';
	let activating = false;

	async function checkProductos() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/productos');
			const result = await response.json();
			datos = result;
		} catch (e) {
			error = `Error: ${e}`;
		} finally {
			loading = false;
		}
	}

	async function activarProductos() {
		activating = true;
		try {
			const response = await fetch('/api/activate-productos', { method: 'POST' });
			const result = await response.json();
			if (result.success) {
				await checkProductos();
				error = '✅ Productos activados correctamente';
			} else {
				error = `Error: ${result.message}`;
			}
		} catch (e) {
			error = `Error: ${e}`;
		} finally {
			activating = false;
		}
	}

	onMount(() => {
		checkProductos();
	});
</script>

<div style="padding: 20px; background: #f4f4f9; min-height: 100vh;">
	<div style="max-width: 900px; margin: 0 auto;">
		<h1>🔧 Debug Productos</h1>

		<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
			<button
				onclick={checkProductos}
				disabled={loading}
				style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;"
			>
				{loading ? 'Cargando...' : '🔄 Actualizar'}
			</button>

			<button
				onclick={activarProductos}
				disabled={activating}
				style="margin-left: 10px; padding: 10px 20px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;"
			>
				{activating ? 'Activando...' : '✅ Activar Productos'}
			</button>
		</div>

		{#if error}
			<div style="background: {error.includes('✅') ? '#d5f4e6' : '#fee'}; padding: 15px; border-radius: 4px; color: {error.includes('✅') ? '#27ae60' : '#c33'}; margin-bottom: 20px;">
				{error}
			</div>
		{/if}

		{#if loading}
			<div style="background: white; padding: 20px; border-radius: 8px;">
				<p>Cargando productos...</p>
			</div>
		{:else if datos}
			<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
				<h3>📊 Resumen</h3>
				<p><strong>Total de productos:</strong> {datos.total || 0}</p>
				<p><strong>Productos activos:</strong> {datos.activos || 0}</p>
				{#if !datos.activos || datos.activos === 0}
					<p style="color: red;">⚠️ No hay productos activos. Haz click en "Activar Productos"</p>
				{/if}
			</div>

			{#if datos.totales && datos.totales.length > 0}
				<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
					<h3>📋 Todos los Productos</h3>
					<div style="overflow-x: auto;">
						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr style="background: #333; color: white;">
									<th style="padding: 12px; text-align: left;">Nombre</th>
									<th style="padding: 12px; text-align: right;">Precio</th>
									<th style="padding: 12px; text-align: center;">Activo</th>
								</tr>
							</thead>
							<tbody>
								{#each datos.totales as producto}
									<tr style="border-bottom: 1px solid #ddd; background: {producto.activo ? '#f0fff4' : '#fff0f0'};">
										<td style="padding: 12px;">{producto.nombre}</td>
										<td style="padding: 12px; text-align: right;">S/. {Number(producto.precio).toFixed(2)}</td>
										<td style="padding: 12px; text-align: center; color: {producto.activo ? 'green' : 'red'}; font-weight: bold;">
											{producto.activo ? '✓ Sí' : '✗ No'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			{#if datos.productosActivos && datos.productosActivos.length > 0}
				<div style="background: #d5f4e6; padding: 20px; border-radius: 8px; color: #27ae60;">
					<h3>✅ Productos Listos para Venta</h3>
					<ul>
						{#each datos.productosActivos as producto}
							<li>{producto.nombre} - <strong>S/. {Number(producto.precio).toFixed(2)}</strong></li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
