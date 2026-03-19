<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	let user: any = null;
	let codigo = '';
	let entrada: any = null;
	let loading = false;
	let error = '';
	let success = '';
	let cameraActive = false;
	let cameraError = '';
	let qrScanner: Html5Qrcode | null = null;

	onMount(async () => {
		// Validar sesión
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user || !['ADMIN', 'CONTROL_ENTRADAS'].includes(data.user.rol)) {
			goto('/');
			return;
		}
		user = data.user;
	});

	async function buscarEntrada() {
		if (!codigo.trim()) {
			error = 'Por favor ingresa un código';
			return;
		}

		loading = true;
		error = '';
		entrada = null;

		try {
			const res = await fetch(`/api/entradas/${codigo}`);
			const data = await res.json();

			if (data.success) {
				entrada = data.entrada;
			} else {
				error = data.message || 'Entrada no encontrada';
			}
		} catch (err) {
			error = 'Error al buscar entrada';
		} finally {
			loading = false;
		}
	}

	async function validarEntrada() {
		if (!entrada) return;

		loading = true;
		error = '';

		try {
			const res = await fetch(`/api/entradas/${entrada.codigo_qr}`, {
				method: 'PUT'
			});
			const data = await res.json();

			if (data.success) {
				success = data.message;
				entrada = data.entrada;
				codigo = '';
				setTimeout(() => {
					entrada = null;
					success = '';
				}, 3000);
			} else {
				error = data.message || 'Error al validar entrada';
			}
		} catch (err) {
			error = 'Error al validar entrada';
		} finally {
			loading = false;
		}
	}

	function limpiar() {
		codigo = '';
		entrada = null;
		error = '';
		success = '';
	}

	async function startCamera() {
		if (!browser) return;
		cameraError = '';

		try {
			cameraActive = true;
			await tick();
			if (!document.getElementById('qr-reader')) {
				throw new Error('qr-reader not found');
			}
			if (!qrScanner) {
				qrScanner = new Html5Qrcode('qr-reader');
			}
			await qrScanner.start(
				{ facingMode: 'environment' },
				{ fps: 10, qrbox: { width: 220, height: 220 } },
				async (decodedText) => {
					if (decodedText && decodedText !== codigo) {
						codigo = decodedText;
						await buscarEntrada();
					}
				},
				() => undefined
			);
			cameraActive = true;
		} catch (err) {
			cameraError = 'No se pudo acceder a la camara. Verifica permisos y HTTPS.';
			cameraActive = false;
		}
	}

	async function stopCamera() {
		if (qrScanner && cameraActive) {
			try {
				await qrScanner.stop();
				await qrScanner.clear();
			} catch {
				// ignore stop errors
			}
		}
		cameraActive = false;
	}

	async function toggleCamera() {
		if (cameraActive) {
			await stopCamera();
		} else {
			await startCamera();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			buscarEntrada();
		}
	}

	onDestroy(() => {
		stopCamera();
	});
</script>

{#if user}
	<Navbar {user} />

	<div class="validacion-container">
		<div class="validacion-content">
			<h1>VALIDACIÓN DE ENTRADAS</h1>

			<div class="validacion-layout">
				<!-- Panel de búsqueda -->
				<div class="busqueda-section">
					<div class="input-group">
						<input
							type="text"
							bind:value={codigo}
							placeholder="📍 Escanea o ingresa código QR"
							on:keydown={handleKeydown}
							disabled={loading}
							class="codigo-input"
						/>
						<button class="btn btn-buscar" on:click={buscarEntrada} disabled={loading}>
							{loading ? '⏳' : '🔍'} BUSCAR
						</button>
					</div>

					<button class="btn btn-camera" on:click={toggleCamera}>
						📷 {cameraActive ? 'Cerrar cámara' : 'Abrir cámara'}
					</button>

					{#if cameraActive}
						<div class="camera-placeholder">
							<div id="qr-reader" class="qr-reader"></div>
							<p style="font-size: 12px; color: #999;">Coloca el QR frente a la cámara</p>
						</div>
					{/if}

					{#if cameraError}
						<div class="alert error">⚠️ {cameraError}</div>
					{/if}
				</div>

				<!-- Panel de información -->
				<div class="info-section">
					{#if error}
						<div class="alert error">
							⚠️ {error}
						</div>
					{/if}

					{#if success}
						<div class="alert success">
							✅ {success}
						</div>
					{/if}

					{#if entrada}
						<div class="entrada-card">
							<div class="card-header">
								<h2>Entrada #{entrada.id}</h2>
							</div>

							<div class="card-body">
								<div class="info-row">
									<span class="label">Código QR:</span>
									<span class="value">{entrada.codigo_qr}</span>
								</div>

								<div class="info-row">
									<span class="label">Cliente:</span>
									<span class="value">{entrada.nombre_cliente}</span>
								</div>

								<div class="info-row">
									<span class="label">Evento:</span>
									<span class="value">{entrada.evento_nombre}</span>
								</div>

								<div class="info-row">
									<span class="label">Estado:</span>
									<span class="value estado" class:validado={entrada.estado === 'VALIDADO'}>
										{entrada.estado}
									</span>
								</div>

								<div class="info-row">
									<span class="label">Fecha Compra:</span>
									<span class="value">{new Date(entrada.fecha_compra).toLocaleDateString()}</span>
								</div>

								{#if entrada.fecha_validacion}
									<div class="info-row">
										<span class="label">Validado:</span>
										<span class="value">{new Date(entrada.fecha_validacion).toLocaleString()}</span>
									</div>
								{/if}
							</div>

							<div class="card-footer">
								{#if entrada.estado === 'DISPONIBLE'}
									<button class="btn btn-validar" on:click={validarEntrada} disabled={loading}>
										✓ VALIDAR ENTRADA
									</button>
								{:else if entrada.estado === 'VALIDADO'}
									<button class="btn btn-validado" disabled> ✓ ENTRADA YA UTILIZADA </button>
								{:else}
									<button class="btn btn-anulado" disabled> ✗ ENTRADA ANULADA </button>
								{/if}

								<button class="btn btn-limpiar" on:click={limpiar}> NUEVA BÚSQUEDA </button>
							</div>
						</div>
					{:else if !error}
						<div class="placeholder">
							<p style="font-size: 48px;">🎫</p>
							<p>Ingresa o escanea un código de entrada</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
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

	.validacion-container {
		width: 100%;
		background: #f5f5f5;
	}

	.validacion-content {
		max-width: 1000px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #333;
		margin: 20px 0;
		font-size: 28px;
	}

	.validacion-layout {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 20px;
	}

	.busqueda-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.input-group {
		display: flex;
		gap: 10px;
	}

	.codigo-input {
		flex: 1;
		padding: 14px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 16px;
		font-weight: 600;
	}

	.codigo-input:focus {
		outline: none;
		border-color: #45b7d1;
	}

	.codigo-input:disabled {
		background: #f5f5f5;
		color: #999;
	}

	.btn {
		padding: 12px 20px;
		border: none;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
		font-size: 14px;
	}

	.btn-buscar {
		background: #45b7d1;
		color: white;
	}

	.btn-buscar:hover:not(:disabled) {
		background: #3a98b8;
	}

	.btn-camera {
		background: #667eea;
		color: white;
	}

	.btn-camera:hover {
		background: #5568d3;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.camera-placeholder {
		background: #f0f0f0;
		border: 2px dashed #ddd;
		border-radius: 6px;
		padding: 30px;
		text-align: center;
		color: #666;
	}

	.qr-reader {
		width: 100%;
		max-width: 280px;
		margin: 0 auto 10px auto;
	}

	.qr-reader video {
		width: 100% !important;
		height: auto !important;
		border-radius: 6px;
	}

	.info-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.alert {
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 15px;
		font-size: 15px;
		text-align: center;
	}

	.alert.error {
		background: #fee;
		color: #c33;
	}

	.alert.success {
		background: #efe;
		color: #3a3;
	}

	.entrada-card {
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
	}

	.card-header {
		background: linear-gradient(135deg, #45b7d1 0%, #3a98b8 100%);
		color: white;
		padding: 15px;
		border-bottom: 3px solid #2a7f9a;
	}

	.card-header h2 {
		margin: 0;
		font-size: 20px;
	}

	.card-body {
		padding: 20px;
	}

	.info-row {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 15px;
		padding: 10px 0;
		border-bottom: 1px solid #f0f0f0;
		align-items: center;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 700;
		color: #555;
		font-size: 13px;
	}

	.value {
		color: #333;
		font-size: 15px;
	}

	.value.estado {
		display: inline-block;
		padding: 6px 12px;
		border-radius: 20px;
		background: #ffeaa7;
		color: #d63031;
		font-weight: 600;
		font-size: 13px;
	}

	.value.estado.validado {
		background: #00b894;
		color: white;
	}

	.card-footer {
		padding: 15px;
		background: #f9f9f9;
		border-top: 1px solid #e0e0e0;
		display: flex;
		gap: 10px;
	}

	.btn-validar {
		flex: 1;
		background: #00b894;
		color: white;
		font-size: 15px;
	}

	.btn-validar:hover:not(:disabled) {
		background: #00a383;
	}

	.btn-validado {
		flex: 1;
		background: #95e1d3;
		color: white;
	}

	.btn-anulado {
		flex: 1;
		background: #ff7675;
		color: white;
	}

	.btn-limpiar {
		flex: 1;
		background: #dfe6e9;
		color: #333;
	}

	.btn-limpiar:hover {
		background: #b2bec3;
	}

	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: #999;
		font-size: 16px;
	}

	@media (max-width: 768px) {
		.validacion-layout {
			grid-template-columns: 1fr;
		}

		.input-group {
			flex-direction: column;
		}

		.btn-buscar {
			width: 100%;
		}

		.info-row {
			grid-template-columns: 100px 1fr;
		}
	}
</style>
