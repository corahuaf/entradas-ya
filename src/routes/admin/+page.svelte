<script lang="ts">
	import StatsCard from '$lib/components/StatsCard.svelte';
	import { formatPrice } from '$lib/utils';
	export let data; // Datos que vienen de +page.server.js
</script>

<h1>Resumen del Evento</h1>

<div class="stats-grid">
	<StatsCard label="Asistentes en local" value={data.totalAsistentes} color="#2ecc71" />
	<StatsCard label="Bebidas Vendidas" value={data.totalVentas} color="#f1c40f" />
	<StatsCard label="Recaudación Total" value={formatPrice(data.recaudado)} color="#3498db" />
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
	}
</style>
