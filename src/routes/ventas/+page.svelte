<script lang="ts">
	import StatsCard from '$lib/components/StatsCard.svelte';
	import { formatPrice, formatDateTime } from '$lib/utils';

	export let data;

	let productoSeleccionado = '';
	let montoRecibido: number | string = '';
	let metodo_pago = 'efectivo';
	let mostrando = 'tabla'; // 'tabla' o 'agregar'

	$: precioProducto = productoSeleccionado 
		? Number(
				data.productos.find((p: any) => p.id === productoSeleccionado)?.precio || 0
			)
		: 0;

	$: vuelto = montoRecibido && precioProducto 
		? Math.max(0, Number(montoRecibido) - precioProducto)
		: 0;

	async function agregarVenta() {
		if (!productoSeleccionado || !montoRecibido) {
			alert('Seleccione producto e ingrese monto');
			return;
		}

		const producto = data.productos.find((p: any) => p.id === productoSeleccionado);

		if (!producto) {
			alert('Producto no encontrado');
			return;
		}

		const response = await fetch('/ventas', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				entrada_id: null,
				producto_id: productoSeleccionado,
				producto: producto.nombre,
				precio: precioProducto,
				monto_recibido: parseFloat(String(montoRecibido)),
				vuelto: vuelto,
				metodo_pago
			})
		});

		if (response.ok) {
			productoSeleccionado = '';
			montoRecibido = '';
			metodo_pago = 'efectivo';
			mostrando = 'tabla';
			// Recargar datos
			location.reload();
		} else {
			alert('Error al registrar venta');
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
						<th>Monto Recibido</th>
						<th>Vuelto</th>
						<th>Método de Pago</th>
						<th>Fecha</th>
					</tr>
				</thead>
				<tbody>
					{#each data.ventas as venta (venta.id)}
						<tr>
							<td>{venta.producto}</td>
							<td>{formatPrice(venta.precio)}</td>
							<td>{venta.monto_recibido ? formatPrice(venta.monto_recibido) : '-'}</td>
							<td>{venta.vuelto ? formatPrice(venta.vuelto) : '-'}</td>
							<td style="text-transform: capitalize;">{venta.metodo_pago}</td>
							<td>{formatDateTime(venta.fecha)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="form-container">
			<div class="form-group">
				<label for="producto">Producto</label>
				<select id="producto" bind:value={productoSeleccionado}>
					<option value="">-- Seleccionar Producto --</option>
					{#each data.productos as producto}
						<option value={producto.id}>
							{producto.nombre} - {formatPrice(producto.precio)}
						</option>
					{/each}
				</select>
			</div>

			{#if precioProducto > 0}
				<div class="precio-display">
					<p>Precio: <strong>{formatPrice(precioProducto)}</strong></p>
				</div>

				<div class="form-group">
					<label for="monto">Monto Recibido (S/.)</label>
					<input
						id="monto"
						bind:value={montoRecibido}
						type="number"
						placeholder="0.00"
						step="0.01"
						min="0"
					/>
				</div>

				{#if montoRecibido}
					<div class="vuelto-display">
						<p>Vuelto: <strong style="color: #2ecc71; font-size: 1.3em">{formatPrice(vuelto)}</strong></p>
					</div>
				{/if}

				<div class="form-group">
					<label for="metodo">Método de Pago</label>
					<select id="metodo" bind:value={metodo_pago}>
						<option value="efectivo">Efectivo</option>
						<option value="tarjeta">Tarjeta</option>
						<option value="transferencia">Transferencia</option>
						<option value="otro">Otro</option>
					</select>
				</div>

				<button class="btn btn-success" onclick={agregarVenta}>Registrar Venta</button>
			{:else}
				<p style="color: #999;">Selecciona un producto para continuar</p>
			{/if}
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
		width: 100%;
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
		max-width: 450px;
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

	input,
	select {
		width: 100%;
		padding: 12px;
		border: 1px solid #bdc3c7;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}

	.precio-display {
		background-color: #ecf0f1;
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 20px;
		color: #2c3e50;
	}

	.vuelto-display {
		background-color: #d5f4e6;
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 20px;
		color: #27ae60;
		text-align: center;
	}
</style>
