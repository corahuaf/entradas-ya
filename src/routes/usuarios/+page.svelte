<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let usuarios: any[] = [];
	let loading = false;
	let saving = false;
	let updatingId: number | null = null;
	let error = '';
	let success = '';

	let form = {
		nombre: '',
		email: '',
		password: '',
		rol: 'CAJERO'
	};

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user || !['ADMIN'].includes(data.user.rol)) {
			goto('/');
			return;
		}
		user = data.user;
		await loadUsuarios();
	});

	async function loadUsuarios() {
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/usuarios');
			const data = await res.json();

			if (data.success) {
				usuarios = data.usuarios;
			} else {
				error = data.message || 'No se pudo cargar usuarios';
			}
		} catch (err) {
			error = 'Error al cargar usuarios';
		} finally {
			loading = false;
		}
	}

	async function crearUsuario() {
		if (!form.nombre.trim() || !form.email.trim() || !form.password || !form.rol) {
			error = 'Completa todos los campos';
			return;
		}

		saving = true;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/usuarios', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			});

			const data = await res.json();
			if (data.success) {
				success = data.message || 'Usuario creado';
				form = { nombre: '', email: '', password: '', rol: 'CAJERO' };
				await loadUsuarios();
			} else {
				error = data.message || 'No se pudo crear el usuario';
			}
		} catch (err) {
			error = 'Error al crear usuario';
		} finally {
			saving = false;
		}
	}

	async function cambiarEstadoUsuario(usuario: any) {
		if (updatingId !== null) {
			return;
		}

		const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
		const accion = nuevoEstado === 'INACTIVO' ? 'anular' : 'reactivar';
		const confirmado = window.confirm(`¿Deseas ${accion} al usuario ${usuario.nombre}?`);
		if (!confirmado) {
			return;
		}

		updatingId = Number(usuario.id);
		error = '';
		success = '';

		try {
			const res = await fetch('/api/usuarios', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id: usuario.id, estado: nuevoEstado })
			});

			const data = await res.json();
			if (data.success) {
				success = data.message || 'Usuario actualizado';
				await loadUsuarios();
			} else {
				error = data.message || 'No se pudo actualizar usuario';
			}
		} catch (err) {
			error = 'Error al actualizar usuario';
		} finally {
			updatingId = null;
		}
	}
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>👥 GESTIÓN DE USUARIOS</h1>

		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		{#if success}
			<div class="alert success">{success}</div>
		{/if}

		<div class="create-card">
			<h2>Agregar usuario</h2>
			<div class="form-grid">
				<input type="text" placeholder="Nombre" bind:value={form.nombre} />
				<input type="email" placeholder="Email" bind:value={form.email} />
				<input type="password" placeholder="Contraseña" bind:value={form.password} />
				<select bind:value={form.rol}>
					<option value="CAJERO">CAJERO</option>
					<option value="CONTROL_ENTRADAS">CONTROL_ENTRADAS</option>
					<option value="ADMIN">ADMIN</option>
				</select>
			</div>
			<div class="actions-row">
				<button class="btn btn-create" on:click={crearUsuario} disabled={saving}>
					{saving ? 'Guardando...' : 'Agregar Usuario'}
				</button>
				<button class="btn btn-refresh" on:click={loadUsuarios} disabled={loading}>
					{loading ? 'Actualizando...' : 'Actualizar Lista'}
				</button>
			</div>
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
						<th>Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr>
							<td colspan="6" class="empty-row">Cargando usuarios...</td>
						</tr>
					{:else if usuarios.length === 0}
						<tr>
							<td colspan="6" class="empty-row">No hay usuarios registrados</td>
						</tr>
					{:else}
						{#each usuarios as usuario (usuario.id)}
							<tr>
								<td>{usuario.id}</td>
								<td>{usuario.nombre}</td>
								<td>{usuario.email}</td>
								<td><span class="badge role">{usuario.rol}</span></td>
								<td>
									<span class="badge estado" class:inactivo={usuario.estado === 'INACTIVO'}
										>{usuario.estado}</span
									>
								</td>
								<td>
									<button
										class="btn-toggle"
										on:click={() => cambiarEstadoUsuario(usuario)}
										disabled={updatingId === Number(usuario.id)}
									>
										{#if updatingId === Number(usuario.id)}
											Procesando...
										{:else if usuario.estado === 'ACTIVO'}
											Anular
										{:else}
											Reactivar
										{/if}
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
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

	.create-card {
		background: #ffffff;
		padding: 20px;
		border-radius: 6px;
		margin-bottom: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	.form-grid input,
	.form-grid select {
		padding: 10px;
		border: 1px solid #d7dce3;
		border-radius: 6px;
		font-size: 14px;
	}

	.actions-row {
		display: flex;
		gap: 10px;
		margin-top: 12px;
	}

	.btn {
		padding: 10px 14px;
		border-radius: 6px;
		border: none;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-create {
		background: #2563eb;
		color: #fff;
	}

	.btn-refresh {
		background: #475569;
		color: #fff;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	.alert.success {
		background: #eafaf1;
		color: #0f8a4a;
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

	.badge.estado.inactivo {
		background: #ef4444;
	}

	.empty-row {
		text-align: center;
		color: #64748b;
	}

	.btn-toggle {
		padding: 7px 10px;
		border: none;
		border-radius: 6px;
		background: #0f766e;
		color: #fff;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-toggle:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 900px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		table {
			font-size: 12px;
		}
	}
</style>
