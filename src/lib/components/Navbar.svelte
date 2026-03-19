<script lang="ts">
	import { goto } from '$app/navigation';

	export let user: any = null;

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}
</script>

<nav class="navbar">
	<div class="container">
		<div class="logo">
			<h2>Sistema de Caja</h2>
		</div>

		{#if user}
			<div class="user-info">
				<span class="user-name">{user.nombre}</span>
				<span class="user-role">{user.rol}</span>
				<button on:click={handleLogout} class="btn-logout">Cerrar sesión</button>
			</div>
		{/if}
	</div>
</nav>

<style>
	.navbar {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 15px 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo h2 {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.user-name {
		font-weight: 600;
		font-size: 14px;
	}

	.user-role {
		background: rgba(255, 255, 255, 0.2);
		padding: 4px 10px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
	}

	.btn-logout {
		background: rgba(255, 255, 255, 0.3);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.5);
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.btn-logout:hover {
		background: rgba(255, 255, 255, 0.5);
	}
</style>
