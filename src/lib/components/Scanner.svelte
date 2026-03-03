<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Html5QrcodeScanner } from 'html5-qrcode';

	const dispatch = createEventDispatcher();
	let scanner: InstanceType<typeof Html5QrcodeScanner> | undefined;

	onMount(() => {
		// Configuración del escáner
		scanner = new Html5QrcodeScanner(
			'qr-reader',
			{
				fps: 10,
				qrbox: { width: 250, height: 250 },
				aspectRatio: 1.0
			},
			false
		);

		scanner.render(
			(decodedText: string) => {
				// Enviamos el ID encontrado al componente padre
				dispatch('scan', { result: decodedText });
			},
			() => {
				// Errores de escaneo ignorados para fluidez
			}
		);

		return () => {
			if (scanner) {
				scanner.clear();
			}
		};
	});
</script>

<div class="scanner-wrapper">
	<div id="qr-reader"></div>
</div>

<style>
	.scanner-wrapper {
		width: 100%;
		max-width: 450px;
		margin: 0 auto;
		border: 4px solid #222;
		border-radius: 12px;
		overflow: hidden;
	}
	:global(#qr-reader__dashboard_section_csr button) {
		background: #333 !important;
		color: white !important;
		border-radius: 4px;
		padding: 8px 12px;
		border: none;
		cursor: pointer;
	}
</style>
