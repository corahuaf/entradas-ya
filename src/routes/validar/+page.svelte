<script lang="ts">
	import Scanner from '$lib/components/Scanner.svelte';
	let statusMessage = 'Esperando escaneo...';
	let statusColor = '#333';

	async function handleScan(event: CustomEvent<{ result: string }>) {
		const qrId = event.detail.result;
		statusMessage = 'Validando...';

		const response = await fetch('/api/validar', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ qr_id: qrId })
		});

		const data = await response.json();
		statusMessage = data.message;
		statusColor = data.success ? '#2ecc71' : '#e74c3c';
	}
</script>

<div class="validator-page">
	<h1>Control de Acceso</h1>
	<Scanner on:scan={handleScan} />
	<div class="result" style="background-color: {statusColor}">
		{statusMessage}
	</div>
</div>

<style>
	.validator-page {
		text-align: center;
	}
	.result {
		margin-top: 20px;
		padding: 20px;
		color: white;
		font-weight: bold;
		border-radius: 8px;
		font-size: 1.2rem;
	}
</style>
