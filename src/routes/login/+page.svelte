<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let nombre = '';
	let password = '';
	let loading = false;
	let error = '';

	onMount(() => {
		// Si ya hay usuario logueado, redirigir a home
		fetch('/api/auth/me')
			.then((res) => res.json())
			.then((data) => {
				if (data.user) {
					goto('/');
				}
			});
	});

	async function handleLogin() {
		if (!nombre || !password) {
			error = 'Por favor completa todos los campos';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ nombre, password })
			});

			const data = await response.json();

			if (data.success) {
				// Redirigir al dashboard
				goto('/');
			} else {
				error = data.message || 'Error en login';
			}
		} catch (err) {
			error = 'Error de conexión';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div class="login-container">
	<div class="login-box">
		<h1>Sistema de Caja y Entradas</h1>

		<form on:submit|preventDefault={handleLogin}>
			<div class="form-group">
				<label for="nombre">Nombre</label>
				<input
					type="text"
					id="nombre"
					bind:value={nombre}
					placeholder="Administrador"
					on:keydown={handleKeydown}
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="password">Contraseña</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="Ingresa tu contraseña"
					on:keydown={handleKeydown}
					disabled={loading}
				/>
			</div>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<button type="submit" disabled={loading} class="btn-login">
				{loading ? 'Cargando...' : 'INGRESAR'}
			</button>
		</form>

		<div class="info">
			<p><strong>Demo:</strong> Administrador</p>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 20px;
	}

	.login-box {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		padding: 40px;
		width: 100%;
		max-width: 400px;
	}

	h1 {
		text-align: center;
		margin-bottom: 30px;
		color: #333;
		font-size: 24px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	label {
		font-weight: 600;
		color: #555;
		font-size: 14px;
	}

	input {
		padding: 12px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 16px;
		transition: all 0.3s;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input:disabled {
		background-color: #f5f5f5;
		color: #999;
		cursor: not-allowed;
	}

	.error-message {
		background-color: #fee;
		color: #c33;
		padding: 10px;
		border-radius: 6px;
		font-size: 14px;
		text-align: center;
	}

	.btn-login {
		padding: 14px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
		margin-top: 10px;
	}

	.btn-login:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
	}

	.btn-login:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.info {
		margin-top: 30px;
		padding-top: 20px;
		border-top: 1px solid #eee;
		text-align: center;
		font-size: 13px;
		color: #999;
	}

	.info p {
		margin: 5px 0;
	}
</style>
