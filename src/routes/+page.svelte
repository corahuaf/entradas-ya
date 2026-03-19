<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let loading = true;

	onMount(async () => {
		// Obtener datos del usuario
		const response = await fetch('/api/auth/me');
		const data = await response.json();

		if (data.user) {
			user = data.user;
		} else {
			// Redirigir a login si no hay usuario
			goto('/login');
		}
		loading = false;
	});

	function navigateTo(path: string) {
		goto(path);
	}

	// Menú según rol
	$: menuItems = [
		...(user?.rol === 'CAJERO' || user?.rol === 'ADMIN'
			? [
					{ label: 'CAJA', icon: '💰', path: '/caja', color: '#FF6B6B' },
					{ label: 'HISTORIAL', icon: '📊', path: '/historial', color: '#4ECDC4' }
				]
			: []),
		...(user?.rol === 'CONTROL_ENTRADAS' || user?.rol === 'ADMIN'
			? [
					{ label: 'VALIDAR ENTRADAS', icon: '🎫', path: '/validar', color: '#45B7D1' },
					{ label: 'REPORTES ENTRADAS', icon: '📋', path: '/reportes-entradas', color: '#95E1D3' }
				]
			: []),
		...(user?.rol === 'ADMIN'
			? [
					{ label: 'PRODUCTOS', icon: '📦', path: '/productos', color: '#F8B500' },
					{ label: 'ENTRADAS', icon: '🧾', path: '/entradas', color: '#6C5CE7' },
					{ label: 'EVENTOS', icon: '🎪', path: '/eventos', color: '#A29BFE' },
					{ label: 'USUARIOS', icon: '👥', path: '/usuarios', color: '#FF9FF3' }
				]
			: [])
	];
</script>

{#if loading}
	<div class="loading">Cargando...</div>
{:else if user}
	<Navbar {user} />

	<div class="dashboard">
		<div class="dashboard-header">
			<h1>Bienvenido, {user.nombre}</h1>
			<p>Sistema de Caja y Validación de Entradas</p>
		</div>

		<div class="menu-grid">
			{#each menuItems as item (item.path)}
				<button
					class="menu-btn"
					style="background-color: {item.color}"
					on:click={() => navigateTo(item.path)}
				>
					<div class="icon">{item.icon}</div>
					<div class="label">{item.label}</div>
				</button>
			{/each}
		</div>

		<div class="info-section">
			<p>Rol: <strong>{user.rol}</strong></p>
		</div>
	</div>
{:else}
	<div class="loading">Redirigiendo...</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		background: #f5f5f5;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		font-size: 18px;
		color: #666;
	}

	.dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 30px 20px;
	}

	.dashboard-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.dashboard-header h1 {
		font-size: 32px;
		color: #333;
		margin: 0 0 10px 0;
	}

	.dashboard-header p {
		font-size: 16px;
		color: #666;
		margin: 0;
	}

	.menu-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin-bottom: 40px;
	}

	.menu-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: 20px;
		border: none;
		border-radius: 12px;
		color: white;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.menu-btn:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
	}

	.menu-btn:active {
		transform: translateY(-2px);
	}

	.icon {
		font-size: 48px;
		margin-bottom: 15px;
	}

	.label {
		text-align: center;
		line-height: 1.3;
	}

	.info-section {
		text-align: center;
		padding: 20px;
		background: white;
		border-radius: 8px;
		color: #333;
	}

	/* Responsive para tablet */
	@media (max-width: 768px) {
		.menu-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 15px;
		}

		.menu-btn {
			min-height: 150px;
			padding: 15px;
		}

		.icon {
			font-size: 36px;
			margin-bottom: 10px;
		}

		.label {
			font-size: 13px;
		}

		.dashboard-header h1 {
			font-size: 24px;
		}
	}

	@media (max-width: 480px) {
		.menu-grid {
			grid-template-columns: 1fr;
		}

		.dashboard {
			padding: 15px;
		}
	}
</style>
