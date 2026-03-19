<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let usuarios: any[] = [];
	let loading = false;
	let error = '';

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user || !['ADMIN'].includes(data.user.rol)) {
			goto('/');
			return;
		}
		user = data.user;

		// Para demo, mostrar usuario actual
		usuarios = [user];
	});
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>👥 GESTIÓN DE USUARIOS</h1>

		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		<div class="info-box">
			<p>Los usuarios se crean directamente en la base de datos para este demo.</p>
			<p>
				Roles disponibles: <strong>ADMIN</strong>, <strong>CAJERO</strong>,
				<strong>CONTROL_ENTRADAS</strong>
			</p>
		</div>

		<div class="usuarios-table">
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Nombre</th>
						<th>Email</th>
						<th>Rol</th>
						<th>Estado</th>
					</tr>
				</thead>
				<tbody>
					{#each usuarios as usuario (usuario.id)}
						<tr>
							<td>{usuario.id}</td>
							<td>{usuario.nombre}</td>
							<td>{usuario.email}</td>
							<td><span class="badge role">{usuario.rol}</span></td>
							<td><span class="badge estado">{usuario.estado}</span></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="sql-section">
			<h2>Crear nuevo usuario (SQL)</h2>
			<pre><code
					>INSERT INTO usuarios (nombre, email, password, rol, estado)
VALUES (
  'Nombre Usuario',
  'email@sistema.local',
  '[hash-bcrypt]',
  'CAJERO',
  'ACTIVO'
);</code
				></pre>
		</div>
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

	h2 {
		color: #333;
		margin-top: 0;
	}

	.info-box {
		background: #e8f4f8;
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 20px;
		border-left: 4px solid #667eea;
	}

	.info-box p {
		margin: 5px 0;
		color: #333;
		font-size: 14px;
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

	.usuarios-table {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 30px;
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
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
	}

	.badge.role {
		background: #667eea;
		color: white;
	}

	.badge.estado {
		background: #00b894;
		color: white;
	}

	.sql-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	pre {
		background: #f5f5f5;
		padding: 15px;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 12px;
	}

	code {
		color: #333;
		font-family: 'Monaco', 'Courier New', monospace;
	}
</style>
