<script lang="ts">
	import { onMount } from 'svelte';

	let datos: any = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			// Intenta los endpoints de debug
			const response = await fetch('/api/debug-productos');
			datos = await response.json();
		} catch (e) {
			error = `Error: ${e}`;
		} finally {
			loading = false;
		}
	});
</script>

<div style="padding: 20px; background: #f4f4f9; min-height: 100vh;">
	<h1>Debug Productos</h1>

	{#if loading}
		<p>Cargando...</p>
	{:else if error}
		<div style="background: #fee; padding: 10px; border-radius: 4px; color: #c33;">
			{error}
		</div>
	{:else if datos}
		<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
			<h3>Resumen</h3>
			<p><strong>Total de productos:</strong> {datos.total}</p>
			<p><strong>Activos:</strong> {datos.activos}</p>
		</div>

		{#if datos.totales && datos.totales.length > 0}
			<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
				<h3>Todos los Productos</h3>
				<table style="width: 100%; border-collapse: collapse;">
					<thead>
						<tr style="background: #333; color: white;">
							<th style="padding: 10px; text-align: left;">ID</th>
							<th style="padding: 10px; text-align: left;">Nombre</th>
							<th style="padding: 10px; text-align: left;">Precio</th>
							<th style="padding: 10px; text-align: left;">Activo</th>
						</tr>
					</thead>
					<tbody>
						{#each datos.totales as producto}
							<tr style="border-bottom: 1px solid #ddd;">
								<td style="padding: 10px;">{producto.id}</td>
								<td style="padding: 10px;">{producto.nombre}</td>
								<td style="padding: 10px;">S/. {producto.precio}</td>
								<td style="padding: 10px; color: {producto.activo ? 'green' : 'red'};">
									{producto.activo ? '✓ Sí' : '✗ No'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if datos.productosActivos && datos.productosActivos.length > 0}
			<div style="background: white; padding: 20px; border-radius: 8px;">
				<h3>Productos Activos (listos para venta)</h3>
				<ul>
					{#each datos.productosActivos as producto}
						<li>{producto.nombre} - S/. {producto.precio}</li>
					{/each}
				</ul>
			</div>
		{:else}
			<div style="background: #ffeaa7; padding: 20px; border-radius: 8px; color: #d63031;">
				<strong>⚠️ No hay productos activos</strong>
				<p>Los productos están marcados como inactivos. Voy a activarlos...</p>
			</div>
		{/if}
	{/if}
</div>

<style>
</style>
