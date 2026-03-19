<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let ventas: any[] = [];
	let loading = false;
	let error = '';
	let filtro = 'todos';

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
							<tr>
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

	.badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 20px;
		background: #00b894;
		color: white;
		font-size: 12px;
		font-weight: 600;
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
