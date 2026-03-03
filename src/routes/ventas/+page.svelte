<script lang="ts">
	import StatsCard from '$lib/components/StatsCard.svelte';
	import { formatPrice, formatDateTime } from '$lib/utils';

	export let data;

	let nuevoProducto = '';
	let nuevoPrecio = '';
	let mostrando = 'tabla'; // 'tabla' o 'agregar'

	async function agregarVenta() {
		if (!nuevoProducto || !nuevoPrecio) {
			alert('Ingrese producto y precio');
			return;
		}

		const response = await fetch('/ventas', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				entrada_id: null,
				producto: nuevoProducto,
				precio: parseFloat(nuevoPrecio)
			})
		});

		if (response.ok) {
			nuevoProducto = '';
			nuevoPrecio = '';
			mostrando = 'tabla';
			// Recargar datos
			location.reload();
		}
	}
</script>

<div class="ventas-page">
	<h1>Registro de Ventas</h1>

	<div class="stats-grid">
		<StatsCard label="Ventas Totales" value={data.totales.cantidad_ventas || 0} color="#2ecc71" />
		<StatsCard
			label="Recaudación Total"
			value={formatPrice(data.totales.recaudacion_total || 0)}
			color="#3498db"
		/>
		<StatsCard
			label="Promedio por Venta"
			value={formatPrice(data.totales.promedio || 0)}
			color="#f1c40f"
		/>
	</div>

	<div class="controls">
		<button
			class="btn btn-primary"
			onclick={() => (mostrando = mostrando === 'tabla' ? 'agregar' : 'tabla')}
		>
			{mostrando === 'tabla' ? '+ Nueva Venta' : 'Ver Tabla'}
		</button>
	</div>

	{#if mostrando === 'tabla'}
		<div class="tabla-container">
			<table>
				<thead>
					<tr>
						<th>Producto</th>
						<th>Precio</th>
						<th>Fecha</th>
						<th>Asistente</th>
					</tr>
				</thead>
				<tbody>
					{#each data.ventas as venta (venta.id)}
						<tr>
							<td>{venta.producto}</td>
							<td>{formatPrice(venta.precio)}</td>
							<td>{formatDateTime(venta.fecha)}</td>
							<td>{venta.nombre_asistente || 'No asignado'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="form-container">
			<div class="form-group">
				<label for="producto">Producto</label>
				<input
					id="producto"
					bind:value={nuevoProducto}
					type="text"
					placeholder="Nombre del producto"
				/>
			</div>
			<div class="form-group">
				<label for="precio">Precio (S/.)</label>
				<input id="precio" bind:value={nuevoPrecio} type="number" placeholder="0.00" step="0.01" />
			</div>
			<button class="btn btn-success" onclick={agregarVenta}>Registrar Venta</button>
		</div>
	{/if}
</div>

<style>
	.ventas-page {
		text-align: center;
		max-width: 1200px;
		margin: 0 auto;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin: 30px 0;
	}

	.controls {
		margin: 20px 0;
	}

	.btn {
		padding: 12px 24px;
		font-size: 1rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
		transition: all 0.3s ease;
	}

	.btn-primary {
		background-color: #3498db;
		color: white;
	}

	.btn-primary:hover {
		background-color: #2980b9;
		transform: translateY(-2px);
	}

	.btn-success {
		background-color: #2ecc71;
		color: white;
	}

	.btn-success:hover {
		background-color: #27ae60;
		transform: translateY(-2px);
	}

	.tabla-container {
		background: white;
		border-radius: 8px;
		padding: 20px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
		margin-top: 20px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background-color: #2c3e50;
		color: white;
	}

	th {
		padding: 15px;
		text-align: left;
		font-weight: bold;
	}

	td {
		padding: 12px 15px;
		border-bottom: 1px solid #ecf0f1;
	}

	tbody tr:hover {
		background-color: #ecf0f1;
	}

	.form-container {
		background: white;
		border-radius: 8px;
		padding: 30px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-width: 400px;
		margin: 20px auto;
	}

	.form-group {
		margin-bottom: 20px;
		text-align: left;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-weight: bold;
		color: #2c3e50;
	}

	input {
		width: 100%;
		padding: 12px;
		border: 1px solid #bdc3c7;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
	}

	input:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}
</style>
