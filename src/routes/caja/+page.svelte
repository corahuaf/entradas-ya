<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let productos: any[] = [];
	let carrito: any[] = [];
	let ventasRecientes: any[] = [];
	let busqueda = '';
	let metodoPago = 'EFECTIVO';
	let loading = false;
	let loadingVentas = false;
	let anulandoVentaId: number | null = null;
	let error = '';
	let success = '';
	let mostrarConfirmacion = false;
	let resultadoVenta: { success: boolean; message: string } | null = null;
	let searchInput: HTMLInputElement | null = null;

	onMount(() => {
		const onGlobalKeydown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key === 'Enter' && carrito.length > 0 && !loading) {
				event.preventDefault();
				registrarVenta();
			}
		};

		window.addEventListener('keydown', onGlobalKeydown);

		void (async () => {
			// Validar sesión
			const res = await fetch('/api/auth/me');
			const data = await res.json();
			if (!data.user) {
				goto('/login');
				return;
			}
			user = data.user;

			// Cargar datos iniciales de caja
			await Promise.all([loadProductos(), loadVentasRecientes()]);
			searchInput?.focus();
		})();

		return () => {
			window.removeEventListener('keydown', onGlobalKeydown);
		};
	});

	async function loadProductos() {
		try {
			const res = await fetch('/api/productos');
			const data = await res.json();
			if (data.success) {
				productos = data.productos.map((p: any) => ({
					...p,
					precio: Number(p.precio),
					stock: Number(p.stock)
				}));
			}
		} catch (err) {
			error = 'Error al cargar productos';
		}
	}

	async function loadVentasRecientes() {
		loadingVentas = true;
		try {
			const res = await fetch('/api/ventas?limit=8');
			const data = await res.json();
			if (data.success) {
				ventasRecientes = data.ventas;
			}
		} catch (err) {
			error = 'Error al cargar ventas recientes';
		} finally {
			loadingVentas = false;
		}
	}

	function agregarAlCarrito(producto: any) {
		const existe = carrito.find((p) => p.id === producto.id);
		const cantidadActual = existe ? Number(existe.cantidad) : 0;

		if (cantidadActual >= Number(producto.stock)) {
			error = `Stock insuficiente para ${producto.nombre}`;
			return;
		}

		if (existe) {
			existe.cantidad += 1;
			existe.subtotal = existe.cantidad * Number(existe.precio);
			carrito = carrito; // trigger reactivity
		} else {
			carrito = [
				...carrito,
				{
					...producto,
					precio: Number(producto.precio),
					cantidad: 1,
					subtotal: Number(producto.precio)
				}
			];
		}
	}

	function cambiarCantidad(index: number, cantidad: number) {
		const stockDisponible = Number(carrito[index].stock);
		if (cantidad <= 0) {
			carrito.splice(index, 1);
			carrito = carrito;
		} else if (cantidad > stockDisponible) {
			carrito[index].cantidad = stockDisponible;
			carrito[index].subtotal = stockDisponible * carrito[index].precio;
			error = `Máximo disponible: ${stockDisponible}`;
			carrito = carrito;
		} else {
			carrito[index].cantidad = cantidad;
			carrito[index].subtotal = cantidad * carrito[index].precio;
			carrito = carrito;
		}
	}

	function eliminarDelCarrito(index: number) {
		carrito.splice(index, 1);
		carrito = carrito;
	}

	function onCantidadChange(index: number, event: Event) {
		const target = event.currentTarget as HTMLInputElement | null;
		const value = target ? parseInt(target.value) || 1 : 1;
		cambiarCantidad(index, value);
	}

	function limpiarCarrito() {
		carrito = [];
		busqueda = '';
		error = '';
		success = '';
		searchInput?.focus();
	}

	function onBusquedaKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') {
			return;
		}

		event.preventDefault();
		if (filteredProductos.length > 0) {
			agregarAlCarrito(filteredProductos[0]);
		}
	}

	function cerrarConfirmacion() {
		mostrarConfirmacion = false;
		resultadoVenta = null;
	}

	function cerrarConfirmacionDesdeOverlay(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			cerrarConfirmacion();
		}
	}

	$: total = carrito.reduce((sum, item) => sum + item.subtotal, 0);
	$: totalItems = carrito.reduce((sum, item) => sum + Number(item.cantidad), 0);
	$: filteredProductos = productos.filter((p) =>
		p.nombre.toLowerCase().includes(busqueda.toLowerCase())
	);

	async function registrarVenta() {
		if (carrito.length === 0) {
			error = 'El carrito está vacío';
			resultadoVenta = { success: false, message: 'El carrito está vacío' };
			mostrarConfirmacion = true;
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await fetch('/api/ventas', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					total: total,
					metodo_pago: metodoPago,
					items: carrito
				})
			});

			const data = await res.json();
			if (data.success) {
				success = 'Venta registrada exitosamente';
				resultadoVenta = {
					success: true,
					message: data.message || 'Venta registrada exitosamente'
				};
				limpiarCarrito();
				await Promise.all([loadProductos(), loadVentasRecientes()]);
			} else {
				error = data.message || 'Error al registrar venta';
				resultadoVenta = {
					success: false,
					message: data.message || 'Error al registrar venta'
				};
			}
		} catch (err) {
			error = 'Error al registrar venta';
			resultadoVenta = { success: false, message: 'Error al registrar venta' };
		} finally {
			if (resultadoVenta) {
				mostrarConfirmacion = true;
			}
			loading = false;
		}
	}

	async function anularVenta(ventaId: number) {
		if (anulandoVentaId !== null) {
			return;
		}

		const confirmado = window.confirm(
			`¿Confirmas anular la venta #${ventaId}? Se repondrá el stock automáticamente.`
		);

		if (!confirmado) {
			return;
		}

		error = '';
		success = '';
		anulandoVentaId = ventaId;

		try {
			const res = await fetch('/api/ventas', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ventaId })
			});

			const data = await res.json();
			if (data.success) {
				success = data.message || 'Venta anulada correctamente';
				await Promise.all([loadProductos(), loadVentasRecientes()]);
			} else {
				error = data.message || 'No se pudo anular la venta';
			}
		} catch (err) {
			error = 'Error al anular la venta';
		} finally {
			anulandoVentaId = null;
		}
	}
</script>

{#if user}
	<Navbar {user} />

	<div class="caja-container">
		<div class="caja-content">
			<h1>CAJA - VENTA DE PRODUCTOS</h1>
			<p class="help-text">Atajos: Enter agrega el primer resultado | Ctrl+Enter cobra rápido</p>

			<div class="caja-layout">
				<!-- Productos -->
				<div class="productos-section">
					<h2>Productos</h2>
					<div class="search-box">
						<input
							type="text"
							placeholder="🔍 Buscar producto y presiona Enter..."
							bind:value={busqueda}
							bind:this={searchInput}
							on:keydown={onBusquedaKeydown}
						/>
					</div>

					<div class="productos-grid">
						{#each filteredProductos as producto (producto.id)}
							<button
								class="producto-btn"
								on:click={() => agregarAlCarrito(producto)}
								disabled={producto.stock === 0}
							>
								<div class="product-name">{producto.nombre}</div>
								<div class="product-price">S/ {Number(producto.precio).toFixed(2)}</div>
								<div class="product-stock">Stock: {producto.stock}</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Carrito -->
				<div class="carrito-section">
					<h2>CARRITO</h2>

					<div class="carrito-items">
						{#each carrito as item, index (index)}
							<div class="carrito-item">
								<div class="item-info">
									<div class="item-name">{item.nombre}</div>
									<div class="item-price">S/ {item.precio.toFixed(2)}</div>
								</div>

								<div class="item-controls">
									<button
										class="qty-btn"
										on:click={() => cambiarCantidad(index, item.cantidad - 1)}
									>
										−
									</button>
									<input
										type="number"
										min="1"
										value={item.cantidad}
										on:change={(e) => onCantidadChange(index, e)}
									/>
									<button
										class="qty-btn"
										on:click={() => cambiarCantidad(index, item.cantidad + 1)}
									>
										+
									</button>
								</div>

								<div class="item-subtotal">
									S/ {item.subtotal.toFixed(2)}
								</div>

								<button class="btn-delete" on:click={() => eliminarDelCarrito(index)}> 🗑️ </button>
							</div>
						{/each}

						{#if carrito.length === 0}
							<div class="carrito-vacio">
								<p>Carrito vacío</p>
								<p style="font-size: 48px;">🛒</p>
							</div>
						{/if}
					</div>

					<!-- Resumen -->
					<div class="resumen">
						<div class="resumen-row">
							<span>Items:</span>
							<span>{totalItems}</span>
						</div>
						<div class="resumen-row total">
							<span>TOTAL:</span>
							<span>S/ {total.toFixed(2)}</span>
						</div>

						<div class="metodo-pago">
							<label for="metodo-pago">Método de Pago:</label>
							<select id="metodo-pago" bind:value={metodoPago}>
								<option value="EFECTIVO">💵 EFECTIVO</option>
								<option value="YAPE">📱 YAPE</option>
								<option value="PLIN">📱 PLIN</option>
								<option value="TARJETA">💳 TARJETA</option>
							</select>
						</div>

						{#if error}
							<div class="alert error">{error}</div>
						{/if}

						{#if success}
							<div class="alert success">{success}</div>
						{/if}

						<div class="button-group">
							<button
								class="btn btn-cobrar"
								on:click={registrarVenta}
								disabled={carrito.length === 0 || loading}
							>
								{loading ? 'PROCESANDO...' : '💰 COBRAR (Ctrl+Enter)'}
							</button>
							<button
								class="btn btn-limpiar"
								on:click={limpiarCarrito}
								disabled={carrito.length === 0}
							>
								🧹 LIMPIAR
							</button>
						</div>
					</div>

					<div class="ventas-recientes">
						<div class="ventas-recientes-header">
							<h3>Ventas Recientes</h3>
							<button class="btn-refresh" on:click={loadVentasRecientes} disabled={loadingVentas}>
								{loadingVentas ? 'Actualizando...' : 'Actualizar'}
							</button>
						</div>

						{#if ventasRecientes.length === 0}
							<p class="ventas-empty">No hay ventas recientes.</p>
						{:else}
							<div class="ventas-lista">
								{#each ventasRecientes as venta (venta.id)}
									<div class="venta-item">
										<div class="venta-info">
											<strong>#{venta.id}</strong>
											<span>{new Date(venta.fecha).toLocaleString()}</span>
											<span>S/ {parseFloat(venta.total).toFixed(2)} - {venta.metodo_pago}</span>
										</div>
										<div class="venta-actions">
											<span class="estado-badge" class:cancelada={venta.estado === 'CANCELADA'}>
												{venta.estado}
											</span>
											{#if venta.estado === 'COMPLETADA'}
												<button
													class="btn-anular"
													on:click={() => anularVenta(Number(venta.id))}
													disabled={anulandoVentaId === Number(venta.id)}
												>
													{anulandoVentaId === Number(venta.id) ? 'Anulando...' : 'Anular'}
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if mostrarConfirmacion && resultadoVenta}
		<div class="modal-overlay" on:click={cerrarConfirmacionDesdeOverlay} role="presentation">
			<article
				class="modal-content result-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-resultado-titulo"
			>
				<div class="modal-body">
					<div
						class="result-icon"
						class:success-icon={resultadoVenta.success}
						class:error-icon={!resultadoVenta.success}
					>
						{resultadoVenta.success ? '✓' : '✕'}
					</div>
					<h3
						id="modal-resultado-titulo"
						class:success-text={resultadoVenta.success}
						class:error-text={!resultadoVenta.success}
					>
						{resultadoVenta.success ? 'Venta Registrada' : 'No se pudo registrar'}
					</h3>
					<p class="result-message">{resultadoVenta.message}</p>
				</div>
				<div class="modal-footer">
					<button class="btn btn-modal" on:click={cerrarConfirmacion}>Aceptar</button>
				</div>
			</article>
		</div>
	{/if}
{:else}
	<div class="loading">Cargando...</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f5f5f5;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		font-size: 18px;
	}

	.caja-container {
		width: 100%;
		background: #f5f5f5;
	}

	.caja-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #333;
		margin: 20px 0;
		font-size: 28px;
	}

	.help-text {
		text-align: center;
		margin: -8px 0 20px;
		font-size: 13px;
		color: #5f6c7b;
	}

	h2 {
		color: #555;
		border-bottom: 3px solid #ff6b6b;
		padding-bottom: 10px;
		margin: 0 0 15px 0;
	}

	.caja-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 20px;
	}

	.productos-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.search-box {
		margin-bottom: 20px;
	}

	.search-box input {
		width: 100%;
		padding: 12px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 16px;
	}

	.search-box input:focus {
		outline: none;
		border-color: #ff6b6b;
	}

	.productos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 12px;
	}

	.producto-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 140px;
		padding: 12px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		font-weight: 600;
	}

	.producto-btn:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
	}

	.producto-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.product-name {
		font-size: 13px;
		margin-bottom: 8px;
		text-align: center;
		line-height: 1.2;
	}

	.product-price {
		font-size: 18px;
		font-weight: 700;
		margin-bottom: 4px;
	}

	.product-stock {
		font-size: 11px;
		opacity: 0.9;
	}

	.carrito-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.carrito-items {
		flex: 1;
		max-height: 400px;
		overflow-y: auto;
		margin: 15px 0;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 10px;
	}

	.carrito-vacio {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		color: #999;
		font-size: 14px;
	}

	.carrito-item {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
		padding: 10px;
		background: #f9f9f9;
		border-radius: 6px;
		margin-bottom: 8px;
		align-items: center;
	}

	.item-info {
		grid-column: 1 / -1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.item-name {
		font-weight: 600;
		color: #333;
		font-size: 14px;
	}

	.item-price {
		font-size: 12px;
		color: #666;
	}

	.item-controls {
		display: flex;
		gap: 4px;
		grid-column: 1;
	}

	.qty-btn {
		padding: 4px 8px;
		border: 1px solid #ddd;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 600;
		font-size: 14px;
	}

	.item-controls input {
		width: 40px;
		text-align: center;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 4px;
		font-weight: 600;
	}

	.item-subtotal {
		font-weight: 700;
		color: #ff6b6b;
		font-size: 14px;
		text-align: right;
	}

	.btn-delete {
		background: none;
		border: none;
		color: #ff6b6b;
		cursor: pointer;
		font-size: 16px;
		padding: 0 4px;
	}

	.resumen {
		border-top: 2px solid #e0e0e0;
		padding-top: 15px;
	}

	.resumen-row {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		font-size: 14px;
	}

	.resumen-row.total {
		font-size: 20px;
		font-weight: 700;
		color: #ff6b6b;
		padding: 12px 0;
		border-bottom: 2px solid #e0e0e0;
	}

	.metodo-pago {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 12px 0;
	}

	.metodo-pago label {
		font-weight: 600;
		font-size: 13px;
		color: #555;
	}

	.metodo-pago select {
		padding: 8px;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		font-size: 14px;
	}

	.alert {
		padding: 10px;
		border-radius: 4px;
		margin: 10px 0;
		font-size: 13px;
		text-align: center;
	}

	.alert.error {
		background: #fee;
		color: #c33;
	}

	.alert.success {
		background: #efe;
		color: #3c3;
	}

	.button-group {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	.ventas-recientes {
		border-top: 2px dashed #e7e7e7;
		padding-top: 14px;
	}

	.ventas-recientes-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}

	.ventas-recientes h3 {
		margin: 0;
		font-size: 15px;
		color: #334155;
	}

	.btn-refresh {
		border: 1px solid #cbd5e1;
		background: #fff;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.ventas-empty {
		margin: 0;
		color: #8a8f98;
		font-size: 13px;
	}

	.ventas-lista {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 220px;
		overflow-y: auto;
	}

	.venta-item {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 10px;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		background: #fafbfd;
	}

	.venta-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 12px;
		color: #445268;
	}

	.venta-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
	}

	.estado-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 700;
		color: #0f766e;
		background: #ccfbf1;
	}

	.estado-badge.cancelada {
		background: #ffe2e2;
		color: #9f1239;
	}

	.btn-anular {
		border: none;
		background: #ef4444;
		color: #fff;
		font-size: 12px;
		font-weight: 700;
		padding: 6px 10px;
		border-radius: 6px;
		cursor: pointer;
	}

	.btn-anular:disabled,
	.btn-refresh:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn {
		flex: 1;
		padding: 12px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
	}

	.btn-cobrar {
		background: #28a745;
		color: white;
	}

	.btn-cobrar:hover:not(:disabled) {
		background: #20c997;
	}

	.btn-limpiar {
		background: #6c757d;
		color: white;
	}

	.btn-limpiar:hover:not(:disabled) {
		background: #5a6268;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
		max-width: 420px;
		width: 100%;
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
	}

	.result-modal {
		text-align: center;
	}

	.modal-body {
		padding: 24px 20px 10px;
	}

	.result-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 12px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32px;
		font-weight: 700;
	}

	.success-icon {
		background: #eafaf1;
		color: #2ecc71;
	}

	.error-icon {
		background: #feeeee;
		color: #e74c3c;
	}

	.success-text {
		color: #1f9d57;
	}

	.error-text {
		color: #c0392b;
	}

	.result-message {
		color: #4b5563;
		margin-top: 8px;
	}

	.modal-footer {
		padding: 0 20px 20px;
	}

	.btn-modal {
		background: #34495e;
		color: #fff;
		width: 100%;
	}

	.btn-modal:hover {
		background: #2c3e50;
	}

	@media (max-width: 1024px) {
		.caja-layout {
			grid-template-columns: 1fr;
		}

		.productos-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.productos-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.producto-btn {
			min-height: 110px;
			font-size: 12px;
		}

		.product-name {
			font-size: 11px;
		}

		.product-price {
			font-size: 16px;
		}
	}
</style>
