<script lang="ts">
	import StatsCard from '$lib/components/StatsCard.svelte';
	import { formatPrice, formatDateTime } from '$lib/utils';
	import { onMount } from 'svelte';

	export let data;

	// Variables para agregar venta
	let productoSeleccionado = '';
	let montoRecibido: number | string = '';
	let metodo_pago = 'efectivo';
	let mostrando = 'tabla'; // 'tabla' o 'agregar'
	let productos: any[] = [];

	// Variables para filtros
	let filtroProducto = '';
	let filtroMetodo = '';
	let filtroFechaInicio = '';
	let filtroFechaFin = '';
	let busqueda = '';

	// Variables para ordenamiento
	let ordenarPor = 'fecha';
	let ordenAscendente = false;

	// Variables para totales filtrados
	let ventasFiltradas: any[] = [];
	let totalesFiltrados = {
		cantidad: 0,
		total: 0,
		promedio: 0
	};

	// Variables para modal detallado de venta
	let ventaSeleccionada: any = null;
	let mostrarDetalleVenta = false;

	// Variables para modal de confirmación
	let mostrarConfirmacion = false;
	let resultadoVenta: { success: boolean; message: string } | null = null;

	// Test variable
	let testModalOpen = false;

	onMount(async () => {
		console.log('Data recibida en componente:', data);

		// Si los productos vienen en data, usarlos
		if (data.productos && data.productos.length > 0) {
			productos = data.productos;
			console.log('Productos de data:', productos);
		} else {
			// Si no, cargarlos desde la API
			console.log('Cargando productos desde API...');
			try {
				const res = await fetch('/api/productos');
				const result = await res.json();
				if (result.success && result.productos) {
					productos = result.productos;
					console.log('Productos de API:', productos);
				}
			} catch (e) {
				console.error('Error cargando productos:', e);
			}
		}

		aplicarFiltros();
	});

	$: precioProducto = productoSeleccionado
		? Number(productos.find((p: any) => p.id === productoSeleccionado)?.precio || 0)
		: 0;

	$: vuelto =
		montoRecibido && precioProducto ? Math.max(0, Number(montoRecibido) - precioProducto) : 0;

	function aplicarFiltros() {
		let resultado = data.ventas || [];

		// Filtro por producto
		if (filtroProducto) {
			resultado = resultado.filter((v: any) => v.id?.toString() === filtroProducto);
		}

		// Filtro por método de pago
		if (filtroMetodo) {
			resultado = resultado.filter((v: any) => v.metodo_pago === filtroMetodo);
		}

		// Filtro por búsqueda
		if (busqueda) {
			const searchLower = busqueda.toLowerCase();
			resultado = resultado.filter(
				(v: any) =>
					v.producto?.toLowerCase().includes(searchLower) ||
					v.metodo_pago?.toLowerCase().includes(searchLower)
			);
		}

		// Filtro por fecha
		if (filtroFechaInicio) {
			resultado = resultado.filter((v: any) => {
				const fechaVenta = new Date(v.fecha).toISOString().split('T')[0];
				return fechaVenta >= filtroFechaInicio;
			});
		}

		if (filtroFechaFin) {
			resultado = resultado.filter((v: any) => {
				const fechaVenta = new Date(v.fecha).toISOString().split('T')[0];
				return fechaVenta <= filtroFechaFin;
			});
		}

		// Ordenamiento
		resultado = ordenarVentas(resultado);

		ventasFiltradas = resultado;

		// Calcular totales filtrados
		totalesFiltrados = {
			cantidad: ventasFiltradas.length,
			total: ventasFiltradas.reduce((sum: number, v: any) => sum + (v.precio || 0), 0),
			promedio:
				ventasFiltradas.length > 0
					? ventasFiltradas.reduce((sum: number, v: any) => sum + (v.precio || 0), 0) /
						ventasFiltradas.length
					: 0
		};
	}

	function ordenarVentas(ventas: any[]): any[] {
		const resultado = [...ventas];

		resultado.sort((a, b) => {
			let valorA, valorB;

			switch (ordenarPor) {
				case 'producto':
					valorA = a.producto?.toLowerCase() || '';
					valorB = b.producto?.toLowerCase() || '';
					break;
				case 'precio':
					valorA = a.precio || 0;
					valorB = b.precio || 0;
					break;
				case 'metodo':
					valorA = a.metodo_pago?.toLowerCase() || '';
					valorB = b.metodo_pago?.toLowerCase() || '';
					break;
				case 'fecha':
				default:
					valorA = new Date(a.fecha).getTime();
					valorB = new Date(b.fecha).getTime();
			}

			if (typeof valorA === 'string') {
				return ordenAscendente ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA);
			} else {
				return ordenAscendente ? valorA - valorB : valorB - valorA;
			}
		});

		return resultado;
	}

	function cambiarOrdenamiento(campo: string) {
		if (ordenarPor === campo) {
			ordenAscendente = !ordenAscendente;
		} else {
			ordenarPor = campo;
			ordenAscendente = false;
		}
		aplicarFiltros();
	}

	function getIndicadorOrdenamiento(campo: string): string {
		if (ordenarPor !== campo) return '';
		return ordenAscendente ? ' ▲' : ' ▼';
	}

	function limpiarFiltros() {
		filtroProducto = '';
		filtroMetodo = '';
		filtroFechaInicio = '';
		filtroFechaFin = '';
		busqueda = '';
		ordenarPor = 'fecha';
		ordenAscendente = false;
		aplicarFiltros();
	}

	function verDetalleVenta(venta: any) {
		console.log('🖱️ Click en venta:', venta);
		ventaSeleccionada = venta;
		mostrarDetalleVenta = true;
		console.log('✅ mostrarDetalleVenta es now:', mostrarDetalleVenta);
	}

	function cerrarDetalleVenta() {
		mostrarDetalleVenta = false;
		ventaSeleccionada = null;
	}

	function cerrarConfirmacion() {
		const wasSuccess = resultadoVenta?.success;
		mostrarConfirmacion = false;
		resultadoVenta = null;
		// Si fue exitoso, recargar
		if (wasSuccess) {
			location.reload();
		}
	}

	async function agregarVenta() {
		if (!productoSeleccionado || !montoRecibido) {
			resultadoVenta = { success: false, message: 'Seleccione producto e ingrese monto' };
			mostrarConfirmacion = true;
			return;
		}

		const producto = productos.find((p: any) => p.id === productoSeleccionado);

		if (!producto) {
			resultadoVenta = { success: false, message: 'Producto no encontrado' };
			mostrarConfirmacion = true;
			return;
		}

		try {
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
				resultadoVenta = { success: true, message: '✅ ¡Venta registrada exitosamente!' };
				productoSeleccionado = '';
				montoRecibido = '';
				metodo_pago = 'efectivo';
			} else {
				const error = await response.json();
				resultadoVenta = {
					success: false,
					message: error.message || '❌ Error al registrar venta'
				};
			}

			mostrarConfirmacion = true;
		} catch (err: any) {
			resultadoVenta = {
				success: false,
				message: '❌ Error de conexión: ' + err.message
			};
			mostrarConfirmacion = true;
		}
	}
</script>

<div class="ventas-page">
	<h1>📊 Registro de Ventas</h1>

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
			on:click={() => (mostrando = mostrando === 'tabla' ? 'agregar' : 'tabla')}
		>
			{mostrando === 'tabla' ? '✏️ + Nueva Venta' : '📊 Ver Historial'}
		</button>
		<button
			class="btn btn-secondary"
			style="margin-left: 10px;"
			on:click={() => {
				testModalOpen = true;
				console.log('🧪 Test modal button clicked');
			}}
		>
			🧪 Test Modal
		</button>
	</div>

	{#if mostrando === 'tabla'}
		<!-- SECCIÓN DE FILTROS -->
		<div class="filtros-section">
			<h3>🔍 Filtros de Búsqueda</h3>
			<div class="filtros-grid">
				<div class="filtro-group">
					<label for="busqueda">Buscar</label>
					<input
						id="busqueda"
						type="text"
						placeholder="Buscar por producto..."
						bind:value={busqueda}
						on:input={aplicarFiltros}
					/>
				</div>

				<div class="filtro-group">
					<label for="filtro-producto">Producto</label>
					<select bind:value={filtroProducto} on:change={aplicarFiltros}>
						<option value="">-- Todos los productos --</option>
						{#each productos as producto}
							<option value={producto.id}>{producto.nombre}</option>
						{/each}
					</select>
				</div>

				<div class="filtro-group">
					<label for="filtro-metodo">Método de Pago</label>
					<select bind:value={filtroMetodo} on:change={aplicarFiltros}>
						<option value="">-- Todos los métodos --</option>
						<option value="efectivo">Efectivo</option>
						<option value="tarjeta">Tarjeta</option>
						<option value="transferencia">Transferencia</option>
						<option value="otro">Otro</option>
					</select>
				</div>

				<div class="filtro-group">
					<label for="fecha-inicio">Fecha Inicio</label>
					<input
						id="fecha-inicio"
						type="date"
						bind:value={filtroFechaInicio}
						on:change={aplicarFiltros}
					/>
				</div>

				<div class="filtro-group">
					<label for="fecha-fin">Fecha Fin</label>
					<input
						id="fecha-fin"
						type="date"
						bind:value={filtroFechaFin}
						on:change={aplicarFiltros}
					/>
				</div>

				<div class="filtro-group btn-group">
					<button class="btn btn-secondary" on:click={limpiarFiltros}>Limpiar Filtros</button>
				</div>
			</div>
		</div>

		<!-- TOTALES FILTRADOS -->
		<div class="totales-filtrados">
			<div class="total-card">
				<div class="total-label">Ventas encontradas</div>
				<div class="total-value">{totalesFiltrados.cantidad}</div>
			</div>
			<div class="total-card">
				<div class="total-label">Total Recaudado</div>
				<div class="total-value">{formatPrice(totalesFiltrados.total)}</div>
			</div>
			<div class="total-card">
				<div class="total-label">Promedio Filtrado</div>
				<div class="total-value">{formatPrice(totalesFiltrados.promedio)}</div>
			</div>
		</div>

		<!-- TABLA DE VENTAS FILTRADAS -->
		{#if ventasFiltradas.length > 0}
			<div class="tabla-container">
				<table>
					<thead>
						<tr>
							<th on:click={() => cambiarOrdenamiento('producto')} class="sortable">
								Producto{getIndicadorOrdenamiento('producto')}
							</th>
							<th on:click={() => cambiarOrdenamiento('precio')} class="sortable">
								Precio{getIndicadorOrdenamiento('precio')}
							</th>
							<th>Monto Recibido</th>
							<th>Vuelto</th>
							<th on:click={() => cambiarOrdenamiento('metodo')} class="sortable">
								Método de Pago{getIndicadorOrdenamiento('metodo')}
							</th>
							<th on:click={() => cambiarOrdenamiento('fecha')} class="sortable">
								Fecha{getIndicadorOrdenamiento('fecha')}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each ventasFiltradas as venta (venta.id)}
							<tr
								role="button"
								tabindex="0"
								on:click={() => verDetalleVenta(venta)}
								on:keydown={(e) => e.key === 'Enter' && verDetalleVenta(venta)}
								class="fila-clickeable"
							>
								<td><strong>{venta.producto}</strong></td>
								<td>{formatPrice(venta.precio)}</td>
								<td>{venta.monto_recibido ? formatPrice(venta.monto_recibido) : '-'}</td>
								<td>{venta.vuelto ? formatPrice(venta.vuelto) : '-'}</td>
								<td><span class="badge badge-{venta.metodo_pago}">{venta.metodo_pago}</span></td>
								<td>{formatDateTime(venta.fecha)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="sin-datos">
				<p>❌ No se encontraron ventas con los filtros aplicados</p>
			</div>
		{/if}
	{:else}
		<!-- FORMULARIO PARA AGREGAR VENTA -->
		<div class="form-container">
			<h2>Registrar Nueva Venta</h2>
			<div class="form-group">
				<label for="producto">Producto</label>
				<select id="producto" bind:value={productoSeleccionado}>
					<option value="">-- Seleccionar Producto --</option>
					{#each productos as producto}
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
						<p>
							Vuelto: <strong style="color: #2ecc71; font-size: 1.3em">{formatPrice(vuelto)}</strong
							>
						</p>
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

				<button class="btn btn-success" on:click={agregarVenta}>💾 Registrar Venta</button>
			{:else}
				<p style="color: #999;">Selecciona un producto para continuar</p>
			{/if}
		</div>
	{/if}
</div>

<!-- MODAL: DETALLES DE VENTA -->
{#if mostrarDetalleVenta && ventaSeleccionada}
	<div class="modal-overlay" on:click={cerrarDetalleVenta} role="presentation">
		<article class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
			<div class="modal-header">
				<h3 id="modal-titulo">Detalles de Venta</h3>
				<button class="modal-close" on:click={cerrarDetalleVenta} aria-label="Cerrar modal"
					>✕</button
				>
			</div>
			<div class="modal-body">
				<div class="detail-row">
					<span class="detail-label">Producto:</span>
					<span class="detail-value">{ventaSeleccionada.nombre_producto}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Precio:</span>
					<span class="detail-value">{formatPrice(ventaSeleccionada.precio)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Monto Recibido:</span>
					<span class="detail-value">{formatPrice(ventaSeleccionada.monto_recibido)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Vuelto:</span>
					<span class="detail-value" style="color: #2ecc71; font-weight: bold;">
						{formatPrice(ventaSeleccionada.vuelto)}
					</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Método de Pago:</span>
					<span class="detail-value">
						<span class="badge badge-{ventaSeleccionada.metodo_pago}">
							{ventaSeleccionada.metodo_pago}
						</span>
					</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Fecha:</span>
					<span class="detail-value">{formatDateTime(ventaSeleccionada.fecha)}</span>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={cerrarDetalleVenta}>Cerrar</button>
			</div>
		</article>
	</div>
{/if}

<!-- MODAL: CONFIRMACIÓN DE RESULTADO -->
{#if mostrarConfirmacion && resultadoVenta}
	<div class="modal-overlay confirmation-modal" on:click={cerrarConfirmacion} role="presentation">
		<article
			class="modal-content result-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="result-titulo"
		>
			<div class="modal-body">
				<div
					class="result-icon"
					class:success={resultadoVenta.success}
					class:error={!resultadoVenta.success}
				>
					{resultadoVenta.success ? '✓' : '✕'}
				</div>
				<h3
					id="result-titulo"
					class:success-text={resultadoVenta.success}
					class:error-text={!resultadoVenta.success}
				>
					{resultadoVenta.success ? 'Venta Registrada' : 'Error'}
				</h3>
				<p class="result-message">{resultadoVenta.message}</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={cerrarConfirmacion}>
					{resultadoVenta.success ? 'Aceptar' : 'Reintentar'}
				</button>
			</div>
		</article>
	</div>
{/if}

<!-- MODAL: TEST -->
{#if testModalOpen}
	<div
		class="modal-overlay"
		on:click={() => {
			testModalOpen = false;
			console.log('🧪 Test modal closed');
		}}
		role="presentation"
	>
		<article class="modal-content" role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>🧪 Test Modal - ¡Los modales SÍ funcionan!</h3>
				<button class="modal-close" on:click={() => (testModalOpen = false)} aria-label="Cerrar"
					>✕</button
				>
			</div>
			<div class="modal-body">
				<p>
					Si ves este modal, significa que el sistema de modales está funcionando correctamente.
				</p>
				<p>
					Si NO ves este modal después de hacer clic en "Test Modal", entonces hay un problema con
					la renderización.
				</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={() => (testModalOpen = false)}>Cerrar</button>
			</div>
		</article>
	</div>
{/if}

<style>
	.ventas-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #2c3e50;
		margin-bottom: 30px;
	}

	h2 {
		color: #2c3e50;
		margin-bottom: 20px;
	}

	h3 {
		color: #34495e;
		margin-bottom: 15px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin: 30px 0;
	}

	.controls {
		margin: 20px 0;
		text-align: center;
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
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.btn-success {
		background-color: #2ecc71;
		color: white;
		width: 100%;
		padding: 15px;
		font-size: 1.1rem;
	}

	.btn-success:hover {
		background-color: #27ae60;
		transform: translateY(-2px);
	}

	.btn-secondary {
		background-color: #95a5a6;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #7f8c8d;
	}

	/* FILTROS SECTION */
	.filtros-section {
		background: white;
		border-radius: 8px;
		padding: 25px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-bottom: 25px;
	}

	.filtros-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
	}

	.filtro-group {
		display: flex;
		flex-direction: column;
	}

	.filtro-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: bold;
		color: #2c3e50;
		font-size: 0.9rem;
	}

	.filtro-group input,
	.filtro-group select {
		padding: 10px;
		border: 1px solid #bdc3c7;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.filtro-group input:focus,
	.filtro-group select:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}

	.btn-group {
		display: flex;
		align-items: flex-end;
	}

	.btn-group button {
		width: 100%;
		height: 100%;
	}

	/* TOTALES FILTRADOS */
	.totales-filtrados {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
		margin-bottom: 25px;
	}

	.total-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 20px;
		border-radius: 8px;
		text-align: center;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.total-card:nth-child(2) {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.total-card:nth-child(3) {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}

	.total-label {
		font-size: 0.9rem;
		opacity: 0.9;
		margin-bottom: 8px;
	}

	.total-value {
		font-size: 1.8rem;
		font-weight: bold;
	}

	/* TABLA DE VENTAS */
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
		border-bottom: 2px solid #34495e;
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.2s ease;
	}

	th.sortable:hover {
		background-color: #34495e;
	}

	td {
		padding: 12px 15px;
		border-bottom: 1px solid #ecf0f1;
	}

	tbody tr {
		transition: background-color 0.2s ease;
	}

	tbody tr:hover {
		background-color: #ecf0f1;
	}

	.fila-clickeable {
		cursor: pointer;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	/* BADGES */
	.badge {
		display: inline-block;
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: bold;
		text-transform: uppercase;
	}

	.badge-efectivo {
		background-color: #2ecc71;
		color: white;
	}

	.badge-tarjeta {
		background-color: #3498db;
		color: white;
	}

	.badge-transferencia {
		background-color: #f39c12;
		color: white;
	}

	.badge-otro {
		background-color: #95a5a6;
		color: white;
	}

	/* FORM CONTAINER */
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
		box-sizing: border-box;
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
		text-align: center;
	}

	.vuelto-display {
		background-color: #d5f4e6;
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 20px;
		color: #27ae60;
		text-align: center;
	}

	.sin-datos {
		background: #fee;
		color: #c33;
		padding: 30px;
		border-radius: 8px;
		text-align: center;
		margin-top: 20px;
		font-size: 1.1rem;
		border-left: 4px solid #c33;
	}

	/* MODAL STYLES */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		width: 90%;
		animation: slideUp 0.3s ease;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #ecf0f1;
	}

	.modal-header h3 {
		margin: 0;
		color: #2c3e50;
		font-size: 1.5rem;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #7f8c8d;
		padding: 0;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background-color: #ecf0f1;
		color: #2c3e50;
	}

	.modal-body {
		padding: 20px;
		max-height: 60vh;
		overflow-y: auto;
	}

	.modal-footer {
		padding: 15px 20px;
		border-top: 1px solid #ecf0f1;
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 0;
		border-bottom: 1px solid #f5f5f5;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		font-weight: bold;
		color: #34495e;
		min-width: 150px;
	}

	.detail-value {
		text-align: right;
		color: #2c3e50;
	}

	/* RESULT MODAL SPECIFIC STYLES */
	.result-modal {
		max-width: 400px;
		text-align: center;
	}

	.result-modal .modal-body {
		padding: 40px 20px;
	}

	.result-icon {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		margin: 0 auto 20px;
		font-weight: bold;
	}

	.result-icon.success {
		background-color: #d4edda;
		color: #28a745;
	}

	.result-icon.error {
		background-color: #f8d7da;
		color: #dc3545;
	}

	.success-text {
		color: #28a745;
	}

	.error-text {
		color: #dc3545;
	}

	.result-message {
		color: #666;
		font-size: 1rem;
		margin: 15px 0;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(30px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.filtros-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		table {
			font-size: 0.85rem;
		}

		td,
		th {
			padding: 8px 10px;
		}
	}
</style>
