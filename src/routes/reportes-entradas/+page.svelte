<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let reporteType = 'entradas-validadas';
	let datos: any[] = [];
	let loading = false;
	let error = '';

	// Para vista de entradas completa
	let todasEntradas: any[] = [];
	let detalleEntrada: any = null;
	let mostrarDetalle = false;
	let busquedaEntradas = '';
	let filtroEstadoEntrada = '';
	let filtroEventoEntrada = '';
	let eventos: any[] = [];

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user) {
			goto('/');
			return;
		}
		user = data.user;
		await loadReporte();
	});

	async function loadReporte() {
		loading = true;
		error = '';
		try {
			const res = await fetch(`/api/reportes?tipo=${reporteType}`);
			const data = await res.json();
			if (data.success) {
				datos = data.datos;
			} else {
				error = 'Error al cargar reporte';
			}
		} catch (err) {
			error = 'Error de conexión';
		} finally {
			loading = false;
		}
	}

	async function loadTodasEntradas() {
		loading = true;
		error = '';
		try {
			const res = await fetch(`/api/entradas?limit=1000`);
			const data = await res.json();
			if (data.success) {
				todasEntradas = data.entradas || [];
				// Extraer eventos únicos para filtro
				const eventosSet = new Set(todasEntradas.map((e) => e.evento_nombre));
				eventos = Array.from(eventosSet).map((e) => ({ nombre: e }));
			} else {
				error = 'Error al cargar entradas';
			}
		} catch (err) {
			error = 'Error de conexión';
		} finally {
			loading = false;
		}
	}

	async function changeReporte(type: string) {
		if (type === 'todas-entradas') {
			await loadTodasEntradas();
		}
		reporteType = type;
		if (type !== 'todas-entradas') {
			await loadReporte();
		}
	}

	function verDetalleEntrada(entrada: any) {
		detalleEntrada = entrada;
		mostrarDetalle = true;
	}

	function cerrarDetalle() {
		mostrarDetalle = false;
		detalleEntrada = null;
	}

	$: entradasFiltradas = todasEntradas.filter((entrada) => {
		const matchBusqueda =
			!busquedaEntradas ||
			entrada.nombre_cliente?.toLowerCase().includes(busquedaEntradas.toLowerCase()) ||
			entrada.codigo_qr?.toLowerCase().includes(busquedaEntradas.toLowerCase());

		const matchEstado = !filtroEstadoEntrada || entrada.estado === filtroEstadoEntrada;

		const matchEvento = !filtroEventoEntrada || entrada.evento_nombre === filtroEventoEntrada;

		return matchBusqueda && matchEstado && matchEvento;
	});

	function getEstadoBadge(estado: string) {
		switch (estado) {
			case 'VALIDADO':
				return { emoji: '✅', color: '#27ae60' };
			case 'DISPONIBLE':
				return { emoji: '🎫', color: '#3498db' };
			case 'ANULADO':
				return { emoji: '❌', color: '#e74c3c' };
			default:
				return { emoji: '❓', color: '#95a5a6' };
		}
	}

	function formatDate(dateString: string) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('es-PE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>📋 REPORTES DE ENTRADAS</h1>

		<div class="tabs">
			<button
				class={reporteType === 'entradas-validadas' ? 'active' : ''}
				on:click={() => changeReporte('entradas-validadas')}
			>
				✅ Entradas Validadas
			</button>
			<button
				class={reporteType === 'entradas-disponibles' ? 'active' : ''}
				on:click={() => changeReporte('entradas-disponibles')}
			>
				🎫 Entradas Disponibles
			</button>
			<button
				class={reporteType === 'todas-entradas' ? 'active' : ''}
				on:click={() => changeReporte('todas-entradas')}
			>
				📊 Todas las Entradas
			</button>
			<button
				class={reporteType === 'ventas-dia' ? 'active' : ''}
				on:click={() => changeReporte('ventas-dia')}
			>
				💰 Ventas del Día
			</button>
			<button
				class={reporteType === 'productos-vendidos' ? 'active' : ''}
				on:click={() => changeReporte('productos-vendidos')}
			>
				📦 Productos Vendidos
			</button>
		</div>

		{#if error}
			<div class="alert error">⚠️ {error}</div>
		{/if}

		{#if loading}
			<p style="text-align: center; color: #999; padding: 30px;">⏳ Cargando...</p>
		{:else if reporteType === 'todas-entradas'}
			<!-- VISTA DETALLADA DE ENTRADAS -->
			<div class="entradas-detail-section">
				<div class="filtros-entradas">
					<input
						type="text"
						placeholder="🔍 Buscar por nombre o código QR..."
						bind:value={busquedaEntradas}
						class="search-input"
					/>
					<select bind:value={filtroEstadoEntrada} class="filter-select">
						<option value="">-- Todos los estados --</option>
						<option value="DISPONIBLE">🎫 Disponible</option>
						<option value="VALIDADO">✅ Validado</option>
						<option value="ANULADO">❌ Anulado</option>
					</select>
					<select bind:value={filtroEventoEntrada} class="filter-select">
						<option value="">-- Todos los eventos --</option>
						{#each eventos as evento}
							<option value={evento.nombre}>{evento.nombre}</option>
						{/each}
					</select>
				</div>

				{#if entradasFiltradas.length === 0}
					<p style="text-align: center; color: #999; padding: 30px;">
						ℹ️ No se encontraron entradas
					</p>
				{:else}
					<div class="entradas-list">
						<div class="list-header">
							<div class="header-info">
								Se encontraron {entradasFiltradas.length} entra{entradasFiltradas.length === 1
									? 'da'
									: 'das'}
							</div>
						</div>
						{#each entradasFiltradas as entrada (entrada.id)}
							<button
								type="button"
								class="entrada-card"
								on:click={() => verDetalleEntrada(entrada)}
								on:keydown={(e) => e.key === 'Enter' && verDetalleEntrada(entrada)}
							>
								<div class="entrada-header">
									<div
										class="estado-badge"
										style="background-color: {getEstadoBadge(entrada.estado).color}"
									>
										{getEstadoBadge(entrada.estado).emoji}
										{entrada.estado}
									</div>
									<div class="cliente-info">
										<div class="cliente-nombre">👤 {entrada.nombre_cliente}</div>
										<div class="cliente-evento">{entrada.evento_nombre}</div>
									</div>
								</div>
								<div class="entrada-footer">
									<div class="codigo-qr">QR: {entrada.codigo_qr}</div>
									<div class="fecha-compra">📅 {formatDate(entrada.fecha_compra)}</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{:else if datos.length === 0}
			<p style="text-align: center; color: #999; padding: 30px;">ℹ️ Sin datos</p>
		{:else}
			<div class="data-grid">
				{#each datos as item (item.id || item.nombre || item.evento)}
					<div class="data-card">
						{#if reporteType === 'entradas-validadas'}
							<div class="card-title">✅ {item.evento}</div>
							<div class="card-value">{item.cantidad_validadas}</div>
							<div class="card-subtitle">Entradas validadas</div>
						{:else if reporteType === 'entradas-disponibles'}
							<div class="card-title">🎫 {item.evento}</div>
							<div class="card-value">{item.disponibles} / {item.total}</div>
							<div class="card-subtitle">Disponibles</div>
						{:else if reporteType === 'ventas-dia'}
							<div class="card-title">{item.usuario}</div>
							<div class="card-value">S/ {parseFloat(item.total).toFixed(2)}</div>
							<div class="card-subtitle">{item.cantidad_ventas} ventas</div>
						{:else if reporteType === 'productos-vendidos'}
							<div class="card-title">{item.nombre}</div>
							<div class="card-value">{item.cantidad_vendida}</div>
							<div class="card-subtitle">S/ {parseFloat(item.total_vendido).toFixed(2)}</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- MODAL DE DETALLES -->
	{#if mostrarDetalle && detalleEntrada}
		<div class="modal-overlay" on:click={cerrarDetalle} role="presentation">
			<article class="modal-content" role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>📋 Detalles de Entrada</h2>
					<button class="close-btn" on:click={cerrarDetalle}>✕</button>
				</div>
				<div class="modal-body">
					<div class="detail-section">
						<h3>Información del Cliente</h3>
						<div class="detail-row">
							<span class="detail-label">👤 Nombre:</span>
							<span class="detail-value">{detalleEntrada.nombre_cliente}</span>
						</div>
					</div>

					<div class="detail-section">
						<h3>Información de la Entrada</h3>
						<div class="detail-row">
							<span class="detail-label">🎫 Código QR:</span>
							<span class="detail-value code">{detalleEntrada.codigo_qr}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">🎭 Evento:</span>
							<span class="detail-value">{detalleEntrada.evento_nombre}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">📊 Estado:</span>
							<span
								class="detail-value"
								style="background-color: {getEstadoBadge(detalleEntrada.estado)
									.color}; color: white; padding: 6px 12px; border-radius: 20px; display: inline-block; font-weight: bold;"
							>
								{getEstadoBadge(detalleEntrada.estado).emoji}
								{detalleEntrada.estado}
							</span>
						</div>
					</div>

					<div class="detail-section">
						<h3>Fechas</h3>
						<div class="detail-row">
							<span class="detail-label">📅 Fecha de Compra:</span>
							<span class="detail-value">{formatDate(detalleEntrada.fecha_compra)}</span>
						</div>
						{#if detalleEntrada.fecha_validacion}
							<div class="detail-row">
								<span class="detail-label">✅ Fecha de Validación:</span>
								<span class="detail-value">{formatDate(detalleEntrada.fecha_validacion)}</span>
							</div>
						{/if}
					</div>

					{#if detalleEntrada.usuario_validador}
						<div class="detail-section">
							<h3>Validación</h3>
							<div class="detail-row">
								<span class="detail-label">👨‍💼 Validado por:</span>
								<span class="detail-value">{detalleEntrada.usuario_validador}</span>
							</div>
						</div>
					{/if}
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={cerrarDetalle}>Cerrar</button>
				</div>
			</article>
		</div>
	{/if}
{/if}

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #2c3e50;
		margin: 20px 0 30px 0;
	}

	h2 {
		color: #2c3e50;
		margin-bottom: 20px;
	}

	h3 {
		color: #34495e;
		margin-bottom: 15px;
		border-bottom: 2px solid #ecf0f1;
		padding-bottom: 10px;
	}

	.tabs {
		display: flex;
		gap: 10px;
		margin-bottom: 30px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.tabs button {
		padding: 12px 16px;
		background: white;
		border: 2px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		transition: all 0.3s;
	}

	.tabs button:hover {
		border-color: #667eea;
		color: #667eea;
	}

	.tabs button.active {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.alert {
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 20px;
		border-left: 4px solid #e74c3c;
		background: #fee;
		color: #c33;
	}

	.alert.error {
		background: #fee;
		color: #c33;
	}

	/* GRID VIEW */
	.data-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 20px;
	}

	.data-card {
		background: white;
		padding: 25px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
		border-top: 4px solid #667eea;
		transition: all 0.3s ease;
	}

	.data-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.card-title {
		font-size: 13px;
		color: #666;
		margin-bottom: 10px;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 600;
	}

	.card-value {
		font-size: 32px;
		font-weight: 700;
		color: #333;
		margin-bottom: 10px;
	}

	.card-subtitle {
		font-size: 12px;
		color: #999;
	}

	/* ENTRADAS DETAIL SECTION */
	.entradas-detail-section {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.filtros-entradas {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
		padding: 20px;
		border-bottom: 1px solid #ecf0f1;
	}

	.search-input,
	.filter-select {
		padding: 12px;
		border: 1px solid #bdc3c7;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
	}

	.search-input:focus,
	.filter-select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.entradas-list {
		max-height: 800px;
		overflow-y: auto;
	}

	.list-header {
		padding: 15px 20px;
		background: #f8f9fa;
		border-bottom: 1px solid #ecf0f1;
		font-weight: 600;
		color: #667eea;
	}

	.header-info {
		font-size: 14px;
		color: #666;
	}

	.entrada-card {
		padding: 20px;
		border-bottom: 1px solid #ecf0f1;
		cursor: pointer;
		transition: all 0.2s ease;
		background: white;
		border: none;
		text-align: left;
		width: 100%;
	}

	.entrada-card:hover {
		background: #f8f9fa;
		border-left: 4px solid #667eea;
		padding-left: 24px;
	}

	.entrada-header {
		display: flex;
		align-items: center;
		gap: 15px;
		margin-bottom: 12px;
	}

	.estado-badge {
		display: inline-block;
		padding: 8px 12px;
		border-radius: 20px;
		color: white;
		font-weight: bold;
		font-size: 12px;
		white-space: nowrap;
	}

	.cliente-info {
		flex: 1;
	}

	.cliente-nombre {
		font-weight: bold;
		color: #2c3e50;
		font-size: 16px;
	}

	.cliente-evento {
		font-size: 13px;
		color: #7f8c8d;
		margin-top: 4px;
	}

	.entrada-footer {
		display: flex;
		gap: 30px;
		font-size: 12px;
		color: #95a5a6;
	}

	.codigo-qr {
		font-family: 'Courier New', monospace;
		background: #ecf0f1;
		padding: 4px 8px;
		border-radius: 4px;
	}

	/* MODAL */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25px;
		border-bottom: 1px solid #ecf0f1;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.modal-header h2 {
		margin: 0;
		color: white;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: white;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.2s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-body {
		padding: 25px;
	}

	.detail-section {
		margin-bottom: 25px;
	}

	.detail-section:last-child {
		margin-bottom: 0;
	}

	.detail-row {
		display: grid;
		grid-template-columns: 150px 1fr;
		gap: 15px;
		padding: 12px 0;
		border-bottom: 1px solid #ecf0f1;
		align-items: center;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		font-weight: bold;
		color: #2c3e50;
		font-size: 14px;
	}

	.detail-value {
		color: #34495e;
		font-size: 14px;
		word-break: break-word;
	}

	.detail-value.code {
		font-family: 'Courier New', monospace;
		background: #ecf0f1;
		padding: 8px;
		border-radius: 4px;
		display: inline-block;
	}

	.modal-footer {
		padding: 20px 25px;
		border-top: 1px solid #ecf0f1;
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.btn {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
		transition: all 0.3s ease;
	}

	.btn-secondary {
		background: #667eea;
		color: white;
	}

	.btn-secondary:hover {
		background: #5568d3;
	}

	@media (max-width: 768px) {
		.tabs {
			flex-direction: column;
		}

		.tabs button {
			width: 100%;
		}

		.filtros-entradas {
			grid-template-columns: 1fr;
		}

		.data-grid {
			grid-template-columns: 1fr;
		}

		.detail-row {
			grid-template-columns: 1fr;
		}

		.detail-label {
			font-size: 12px;
		}

		.entrada-footer {
			flex-direction: column;
			gap: 8px;
		}

		.modal-content {
			max-width: 100%;
			border-radius: 8px;
		}
	}
</style>
