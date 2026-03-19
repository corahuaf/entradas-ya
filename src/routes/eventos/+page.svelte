<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let eventos: any[] = [];
	let loading = false;
	let error = '';
	let success = '';
	let showForm = false;
	let formData = { nombre: '', fecha: '', lugar: '' };

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
		loading = true;
		try {
			const res = await fetch('/api/eventos');
			const data = await res.json();
			if (data.success) {
				eventos = data.eventos;
			}
		} catch (err) {
			error = 'Error al cargar eventos';
		} finally {
			loading = false;
		}
	}

	async function guardarEvento() {
		if (!formData.nombre || !formData.fecha || !formData.lugar) {
			error = 'Completa todos los campos';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/eventos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const data = await res.json();
			if (data.success) {
				success = 'Evento creado exitosamente';
				formData = { nombre: '', fecha: '', lugar: '' };
				showForm = false;
				await loadEventos();
			} else {
				error = data.message;
			}
		} catch (err) {
			error = 'Error al guardar evento';
		} finally {
			loading = false;
		}
	}
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>🎪 GESTIÓN DE EVENTOS</h1>

		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		{#if success}
			<div class="alert success">{success}</div>
		{/if}

		<div class="header">
			<button class="btn btn-add" on:click={() => (showForm = !showForm)}> ➕ NUEVO EVENTO </button>
		</div>

		{#if showForm}
			<div class="form-box">
				<h2>Nuevo Evento</h2>
				<div class="form-group">
					<label>Nombre del Evento</label>
					<input bind:value={formData.nombre} placeholder="Ej: Concierto de Rock" />
				</div>
				<div class="form-group">
					<label>Fecha</label>
					<input type="date" bind:value={formData.fecha} />
				</div>
				<div class="form-group">
					<label>Lugar</label>
					<input bind:value={formData.lugar} placeholder="Ej: Estadio Principal" />
				</div>
				<div class="form-buttons">
					<button class="btn btn-save" on:click={guardarEvento} disabled={loading}>
						💾 GUARDAR
					</button>
					<button class="btn btn-cancel" on:click={() => (showForm = false)}> ✕ CANCELAR </button>
				</div>
			</div>
		{/if}

		{#if loading && eventos.length === 0}
			<p style="text-align: center; color: #999;">Cargando...</p>
		{:else if eventos.length === 0}
			<p style="text-align: center; color: #999;">No hay eventos</p>
		{:else}
			<div class="eventos-grid">
				{#each eventos as evento (evento.id)}
					<div class="evento-card">
						<div class="date">
							{new Date(evento.fecha).toLocaleDateString()}
						</div>
						<h3>{evento.nombre}</h3>
						<p>📍 {evento.lugar}</p>
						<span class="badge estado">{evento.estado}</span>
					</div>
				{/each}
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

	h2 {
		color: #333;
		margin-top: 0;
	}

	h3 {
		margin: 10px 0 5px 0;
		color: #333;
	}

	p {
		margin: 5px 0;
		color: #666;
		font-size: 13px;
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
		background: #efe;
		color: #3a3;
	}

	.header {
		margin-bottom: 20px;
	}

	.btn {
		padding: 10px 16px;
		border: none;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.3s;
	}

	.btn-add {
		background: #667eea;
		color: white;
	}

	.btn-add:hover {
		background: #5568d3;
	}

	.form-box {
		background: white;
		padding: 20px;
		border-radius: 8px;
		margin-bottom: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.form-group {
		margin-bottom: 15px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-group label {
		font-weight: 600;
		color: #555;
		font-size: 13px;
	}

	.form-group input {
		padding: 10px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 14px;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
	}

	.form-buttons {
		display: flex;
		gap: 10px;
		margin-top: 15px;
	}

	.btn-save {
		flex: 1;
		background: #00b894;
		color: white;
	}

	.btn-save:hover {
		background: #00a383;
	}

	.btn-cancel {
		flex: 1;
		background: #dfe6e9;
		color: #333;
	}

	.btn-cancel:hover {
		background: #b2bec3;
	}

	.eventos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 15px;
	}

	.evento-card {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-left: 4px solid #667eea;
	}

	.date {
		display: inline-block;
		background: #667eea;
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 10px;
	}

	.badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
	}

	.badge.estado {
		background: #00b894;
		color: white;
	}

	@media (max-width: 768px) {
		.eventos-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
	}
</style>
