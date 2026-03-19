<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let ventas: any[] = [];
	let loading = false;
	let error = '';
	let filtro = 'todos';
	let ventaSeleccionada: any = null;
	let mostrarDetalleVenta = false;
	let detalleProductos: any[] = [];
	let cargandoDetalle = false;

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user || !['ADMIN', 'CAJERO'].includes(data.user.rol)) {
			goto('/');
			return;
		}
		user = data.user;
		await loadVentas();
	});

	async function loadVentas() {
		loading = true;
		try {
			const res = await fetch('/api/ventas');
			const data = await res.json();
			if (data.success) {
				ventas = data.ventas;
			}
		} catch (err) {
			error = 'Error al cargar ventas';
		} finally {
			loading = false;
		}
	}

	async function verDetalleVenta(venta: any) {
		ventaSeleccionada = venta;
		mostrarDetalleVenta = true;
		detalleProductos = [];
		cargandoDetalle = true;

		try {
			const res = await fetch(`/api/ventas?ventaId=${venta.id}`);
			const data = await res.json();
			if (data.success) {
				detalleProductos = data.detalles || [];
				if (data.venta) {
					ventaSeleccionada = { ...ventaSeleccionada, ...data.venta };
				}
			}
		} catch (err) {
			error = 'No se pudo cargar el detalle de productos';
		} finally {
			cargandoDetalle = false;
		}
	}

	function cerrarDetalleVenta() {
		mostrarDetalleVenta = false;
		ventaSeleccionada = null;
		detalleProductos = [];
		cargandoDetalle = false;
	}

	function cerrarDetalleDesdeOverlay(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			cerrarDetalleVenta();
		}
	}

	$: totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>📊 HISTORIAL DE VENTAS</h1>

		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		<div class="stats">
			<div class="stat-card">
				<div class="stat-label">Total Ventas</div>
				<div class="stat-value">
					{ventas.length}
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">Monto Total</div>
				<div class="stat-value">
					S/ {totalVentas.toFixed(2)}
				</div>
			</div>
		</div>

		{#if loading}
			<p style="text-align: center; color: #999;">Cargando...</p>
		{:else if ventas.length === 0}
			<p style="text-align: center; color: #999;">No hay ventas registradas</p>
		{:else}
			<div class="ventas-table">
				<table>
					<thead>
						<tr>
							<th>Fecha</th>
							<th>Usuario</th>
							<th>Total</th>
							<th>Método Pago</th>
							<th>Estado</th>
						</tr>
					</thead>
					<tbody>
						{#each ventas as venta (venta.id)}
							<tr class="fila-clickeable" on:click={() => verDetalleVenta(venta)}>
								<td>{new Date(venta.fecha).toLocaleString()}</td>
								<td>{venta.usuario_nombre}</td>
								<td><strong>S/ {parseFloat(venta.total).toFixed(2)}</strong></td>
								<td>{venta.metodo_pago}</td>
								<td><span class="badge">{venta.estado}</span></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if mostrarDetalleVenta && ventaSeleccionada}
			<div class="modal-overlay" on:click={cerrarDetalleDesdeOverlay} role="presentation">
				<article
					class="modal-content"
					role="dialog"
					aria-modal="true"
					aria-labelledby="historial-modal-title"
				>
					<div class="modal-header">
						<h3 id="historial-modal-title">Detalle de venta #{ventaSeleccionada.id}</h3>
						<button class="modal-close" on:click={cerrarDetalleVenta} aria-label="Cerrar">✕</button>
					</div>
					<div class="modal-body">
						<div class="detail-row"><span>ID:</span><strong>{ventaSeleccionada.id}</strong></div>
						<div class="detail-row">
							<span>Fecha:</span>
							<strong>{new Date(ventaSeleccionada.fecha).toLocaleString()}</strong>
						</div>
						<div class="detail-row">
							<span>Usuario:</span>
							<strong>{ventaSeleccionada.usuario_nombre}</strong>
						</div>
						<div class="detail-row">
							<span>Total:</span>
							<strong>S/ {parseFloat(ventaSeleccionada.total).toFixed(2)}</strong>
						</div>
						<div class="detail-row">
							<span>Método:</span>
							<strong>{ventaSeleccionada.metodo_pago}</strong>
						</div>
						<div class="detail-row">
							<span>Estado:</span>
							<strong>{ventaSeleccionada.estado}</strong>
						</div>

						<div class="detail-section">
							<h4>Productos vendidos</h4>
							{#if cargandoDetalle}
								<p class="detalle-loading">Cargando productos...</p>
							{:else if detalleProductos.length === 0}
								<p class="detalle-empty">No hay productos registrados para esta venta.</p>
							{:else}
								<div class="productos-lista">
									{#each detalleProductos as item}
										<div class="producto-row">
											<div class="producto-main">
												<strong>{item.producto_nombre}</strong>
												<span>x{item.cantidad}</span>
											</div>
											<div class="producto-precios">
												<span>S/ {parseFloat(item.precio).toFixed(2)}</span>
												<strong>S/ {parseFloat(item.subtotal).toFixed(2)}</strong>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					<div class="modal-footer">
						<button class="btn-close-modal" on:click={cerrarDetalleVenta}>Cerrar</button>
					</div>
				</article>
			</div>
		{/if}
	</div>
{/if}

<style>
	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #333;
		margin: 20px 0;
	}

	.alert {
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 20px;
	}

	.alert.error {
		background: #fee;
		color: #c33;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
		margin-bottom: 30px;
	}

	.stat-card {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.stat-label {
		font-size: 13px;
		color: #666;
		margin-bottom: 10px;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.stat-value {
		font-size: 28px;
		font-weight: 700;
		color: #333;
	}

	.ventas-table {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f5f5f5;
		border-bottom: 2px solid #ddd;
	}

	th {
		padding: 12px;
		text-align: left;
		font-weight: 700;
		color: #333;
		font-size: 13px;
	}

	td {
		padding: 12px;
		border-bottom: 1px solid #eee;
		font-size: 14px;
	}

	tr:hover {
		background: #f9f9f9;
	}

	.fila-clickeable {
		cursor: pointer;
	}

	.badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 20px;
		background: #00b894;
		color: white;
		font-size: 12px;
		font-weight: 600;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1200;
		padding: 16px;
	}

	.modal-content {
		background: #fff;
		border-radius: 12px;
		max-width: 520px;
		width: 100%;
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 20px;
		border-bottom: 1px solid #ececec;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 20px;
	}

	.modal-close {
		background: transparent;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #6b7280;
	}

	.modal-body {
		padding: 18px 20px;
	}

	.detail-section {
		margin-top: 16px;
	}

	.detail-section h4 {
		margin: 0 0 10px 0;
		font-size: 16px;
		color: #1f2937;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px dashed #e5e7eb;
		gap: 12px;
	}

	.detalle-loading,
	.detalle-empty {
		margin: 0;
		padding: 8px 0;
		color: #6b7280;
	}

	.productos-lista {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.producto-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #f8fafc;
	}

	.producto-main {
		display: flex;
		gap: 8px;
		align-items: center;
		color: #111827;
	}

	.producto-main span {
		color: #6b7280;
		font-size: 13px;
	}

	.producto-precios {
		display: flex;
		gap: 10px;
		align-items: center;
		color: #374151;
	}

	.modal-footer {
		padding: 0 20px 20px;
	}

	.btn-close-modal {
		width: 100%;
		padding: 10px 12px;
		border: none;
		border-radius: 8px;
		background: #334155;
		color: white;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-close-modal:hover {
		background: #1f2937;
	}

	@media (max-width: 768px) {
		table {
			font-size: 12px;
		}

		th,
		td {
			padding: 8px;
		}
	}
</style>
