<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';
	import QRCode from 'qrcode';
	import { jsPDF } from 'jspdf';

	let user: any = null;
	let eventos: any[] = [];
	let loading = false;
	let error = '';
	let success = '';

	let eventoId = '';
	let nombreCliente = '';
	let entrada: any = null;
	let qrDataUrl = '';

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user || !['ADMIN'].includes(data.user.rol)) {
			goto('/');
			return;
		}
		user = data.user;
		await loadEventos();
	});

	async function loadEventos() {
		try {
			const res = await fetch('/api/eventos');
			const data = await res.json();
			if (data.success) {
				eventos = data.eventos;
			}
		} catch (err) {
			error = 'Error al cargar eventos';
		}
	}

	async function crearEntrada() {
		error = '';
		success = '';
		entrada = null;
		qrDataUrl = '';

		if (!eventoId || !nombreCliente.trim()) {
			error = 'Selecciona un evento e ingresa el nombre del cliente';
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/entradas', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					evento_id: parseInt(eventoId),
					nombre_cliente: nombreCliente.trim()
				})
			});

			const data = await res.json();
			if (data.success) {
				entrada = data.entrada;
				success = 'Entrada creada. Descarga el PDF.';
				qrDataUrl = await QRCode.toDataURL(entrada.codigo_qr, {
					width: 220,
					margin: 1
				});
			} else {
				error = data.message || 'Error al crear entrada';
			}
		} catch (err) {
			error = 'Error al crear entrada';
		} finally {
			loading = false;
		}
	}

	function descargarPDF() {
		if (!entrada || !qrDataUrl) return;

		const evento = eventos.find((e) => String(e.id) === String(entrada.evento_id));
		const doc = new jsPDF({ unit: 'mm', format: 'a6' });
		const width = 105;
		const height = 148;

		// Background
		doc.setFillColor(245, 245, 245);
		doc.rect(0, 0, width, height, 'F');

		// Header band
		doc.setFillColor(20, 20, 20);
		doc.rect(0, 0, width, 18, 'F');
		doc.setTextColor(255, 255, 255);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(14);
		doc.text('CONCIERTO - ENTRADA', 8, 12);

		// Event title
		doc.setTextColor(20, 20, 20);
		doc.setFontSize(16);
		doc.text(evento ? evento.nombre : 'EVENTO', 8, 32);

		// Divider
		doc.setDrawColor(200, 200, 200);
		doc.setLineWidth(0.2);
		doc.line(8, 36, width - 8, 36);

		// Details left column
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		doc.text('CLIENTE', 8, 44);
		doc.setFont('helvetica', 'bold');
		doc.text(entrada.nombre_cliente, 8, 50);

		doc.setFont('helvetica', 'normal');
		doc.text('FECHA', 8, 60);
		doc.setFont('helvetica', 'bold');
		if (evento?.fecha) {
			doc.text(new Date(evento.fecha).toLocaleDateString(), 8, 66);
		} else {
			doc.text('POR CONFIRMAR', 8, 66);
		}

		doc.setFont('helvetica', 'normal');
		doc.text('LUGAR', 8, 76);
		doc.setFont('helvetica', 'bold');
		doc.text(evento?.lugar || 'POR CONFIRMAR', 8, 82);

		doc.setFont('helvetica', 'normal');
		doc.text('CODIGO', 8, 92);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(9);
		doc.text(entrada.codigo_qr, 8, 98);

		// QR right column
		doc.setDrawColor(20, 20, 20);
		doc.rect(62, 40, 35, 35);
		doc.addImage(qrDataUrl, 'PNG', 63, 41, 33, 33);

		// Perforation line
		doc.setDrawColor(180, 180, 180);
		(doc as any).setLineDash([1, 1], 0);
		doc.line(8, 110, width - 8, 110);
		(doc as any).setLineDash([], 0);

		// Footer
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		doc.text('Presenta este ticket en puerta', 8, 120);
		doc.text('Pre-entrada virtual - valida con QR', 8, 126);

		doc.save(`entrada-${entrada.codigo_qr}.pdf`);
	}
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>🎫 CREAR ENTRADA</h1>

		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		{#if success}
			<div class="alert success">{success}</div>
		{/if}

		<div class="form-box">
			<div class="form-group">
				<label for="evento-select">Evento</label>
				<select id="evento-select" bind:value={eventoId}>
					<option value="" disabled>Selecciona un evento</option>
					{#each eventos as evento (evento.id)}
						<option value={evento.id}>{evento.nombre}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="cliente-input">Nombre del cliente</label>
				<input
					id="cliente-input"
					placeholder="Nombre completo"
					bind:value={nombreCliente}
					maxlength="100"
				/>
			</div>

			<div class="form-buttons">
				<button class="btn btn-save" on:click={crearEntrada} disabled={loading}>
					{loading ? 'Creando...' : 'Crear Entrada'}
				</button>
			</div>
		</div>

		{#if entrada}
			<div class="preview">
				<h2>Pre-entrada</h2>
				<div class="preview-card">
					<div class="preview-info">
						<p><strong>Cliente:</strong> {entrada.nombre_cliente}</p>
						<p><strong>Codigo:</strong> {entrada.codigo_qr}</p>
					</div>
					{#if qrDataUrl}
						<img src={qrDataUrl} alt="QR" />
					{/if}
				</div>
				<button class="btn btn-download" on:click={descargarPDF}>Descargar PDF</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #333;
		margin: 20px 0;
	}

	.alert {
		padding: 12px;
		border-radius: 6px;
		margin-bottom: 15px;
	}

	.alert.error {
		background: #fee;
		color: #c33;
	}

	.alert.success {
		background: #efe;
		color: #2e7d32;
	}

	.form-box {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.form-group {
		margin-bottom: 15px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		font-weight: 600;
		color: #555;
		font-size: 13px;
	}

	input,
	select {
		padding: 10px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 14px;
	}

	.form-buttons {
		display: flex;
		justify-content: flex-end;
	}

	.btn {
		padding: 10px 16px;
		border: none;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-save {
		background: #667eea;
		color: white;
	}

	.preview {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.preview-card {
		display: flex;
		gap: 20px;
		align-items: center;
		justify-content: space-between;
		margin: 12px 0 16px;
		padding: 12px;
		border: 1px dashed #ccc;
		border-radius: 6px;
	}

	.preview-card img {
		width: 120px;
		height: 120px;
	}

	.btn-download {
		background: #2d3436;
		color: white;
	}
</style>
