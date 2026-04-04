<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';

	let user: any = null;
	let productos: any[] = [];
	let loading = false;
	let error = '';
	let success = '';
	let showForm = false;
	let editingId: number | null = null;
	let formData = { nombre: '', precio: '', stock: '' };
	let editData = { nombre: '', precio: '', stock: '', estado: 'ACTIVO' };

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user || !['ADMIN'].includes(data.user.rol)) {
			goto('/');
			return;
		}
		user = data.user;
		await loadProductos();
	});

	async function loadProductos() {
		loading = true;
		try {
			const res = await fetch('/api/productos');
			const data = await res.json();
			if (data.success) {
				productos = data.productos;
			}
		} catch (err) {
			error = 'Error al cargar productos';
		} finally {
			loading = false;
		}
	}

	async function guardarProducto() {
		if (!formData.nombre || !formData.precio || !formData.stock) {
			error = 'Completa todos los campos';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/productos', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: formData.nombre,
					precio: parseFloat(formData.precio),
					stock: parseInt(formData.stock)
				})
			});

			const data = await res.json();
			if (data.success) {
				success = 'Producto creado exitosamente';
				formData = { nombre: '', precio: '', stock: '' };
				showForm = false;
				await loadProductos();
			} else {
				error = data.message;
			}
		} catch (err) {
			error = 'Error al guardar producto';
		} finally {
			loading = false;
		}
	}

	function iniciarEdicion(producto: any) {
		editingId = producto.id;
		editData = {
			nombre: producto.nombre,
			precio: String(producto.precio),
			stock: String(producto.stock),
			estado: producto.estado
		};
		error = '';
		success = '';
	}

	function cancelarEdicion() {
		editingId = null;
	}

	async function guardarEdicion(id: number) {
		if (!editData.nombre || !editData.precio || !editData.stock) {
			error = 'Completa todos los campos de edición';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/productos', {
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id,
					nombre: editData.nombre,
					precio: parseFloat(editData.precio),
					stock: parseInt(editData.stock),
					estado: editData.estado
				})
			});

			const data = await res.json();
			if (data.success) {
				success = 'Producto actualizado exitosamente';
				editingId = null;
				await loadProductos();
			} else {
				error = data.message || 'Error al actualizar producto';
			}
		} catch (err) {
			error = 'Error al actualizar producto';
		} finally {
			loading = false;
		}
	}

	async function eliminarProducto(id: number, nombre: string) {
		const confirmado = confirm(`¿Eliminar producto ${nombre}?`);
		if (!confirmado) return;

		loading = true;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/productos', {
				method: 'DELETE',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			const data = await res.json();
			if (data.success) {
				success = data.message || 'Producto eliminado exitosamente';
				if (editingId === id) editingId = null;
				await loadProductos();
			} else {
				error = data.message || 'Error al eliminar producto';
			}
		} catch (err) {
			error = 'Error al eliminar producto';
		} finally {
			loading = false;
		}
	}
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>📦 GESTIÓN DE PRODUCTOS</h1>

		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		{#if success}
			<div class="alert success">{success}</div>
		{/if}

		<div class="header">
			<button class="btn btn-add" on:click={() => (showForm = !showForm)}>
				➕ AGREGAR PRODUCTO
			</button>
		</div>

		{#if showForm}
			<div class="form-box">
				<h2>Nuevo Producto</h2>
				<div class="form-group">
					<label>Nombre</label>
					<input bind:value={formData.nombre} placeholder="Nombre del producto" />
				</div>
				<div class="form-group">
					<label>Precio (S/)</label>
					<input type="number" step="0.01" bind:value={formData.precio} placeholder="0.00" />
				</div>
				<div class="form-group">
					<label>Stock</label>
					<input type="number" bind:value={formData.stock} placeholder="0" />
				</div>
				<div class="form-buttons">
					<button class="btn btn-save" on:click={guardarProducto} disabled={loading}>
						💾 GUARDAR
					</button>
					<button class="btn btn-cancel" on:click={() => (showForm = false)}> ✕ CANCELAR </button>
				</div>
			</div>
		{/if}

		{#if loading && productos.length === 0}
			<p style="text-align: center; color: #999;">Cargando...</p>
		{:else if productos.length === 0}
			<p style="text-align: center; color: #999;">No hay productos</p>
		{:else}
			<div class="productos-table">
				<table>
					<thead>
						<tr>
							<th>Nombre</th>
							<th>Precio</th>
							<th>Stock</th>
							<th>Estado</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{#each productos as producto (producto.id)}
							<tr>
								{#if editingId === producto.id}
									<td>
										<input class="inline-input" bind:value={editData.nombre} maxlength="150" />
									</td>
									<td>
										<input
											class="inline-input"
											type="number"
											step="0.01"
											bind:value={editData.precio}
										/>
									</td>
									<td>
										<input class="inline-input" type="number" bind:value={editData.stock} />
									</td>
									<td>
										<select class="inline-input" bind:value={editData.estado}>
											<option value="ACTIVO">ACTIVO</option>
											<option value="INACTIVO">INACTIVO</option>
										</select>
									</td>
									<td>
										<div class="acciones">
											<button
												class="btn btn-mini btn-save"
												on:click={() => guardarEdicion(producto.id)}
												disabled={loading}>Guardar</button
											>
											<button
												class="btn btn-mini btn-cancel"
												on:click={cancelarEdicion}
												disabled={loading}>Cancelar</button
											>
										</div>
									</td>
								{:else}
									<td>{producto.nombre}</td>
									<td>S/ {parseFloat(producto.precio).toFixed(2)}</td>
									<td>
										<span class="stock" class:bajo={producto.stock < 10}>
											{producto.stock}
										</span>
									</td>
									<td>
										<span class="badge estado">{producto.estado}</span>
									</td>
									<td>
										<div class="acciones">
											<button
												class="btn btn-mini btn-edit"
												on:click={() => iniciarEdicion(producto)}
												disabled={loading}>Editar</button
											>
											<button
												class="btn btn-mini btn-delete"
												on:click={() => eliminarProducto(producto.id, producto.nombre)}
												disabled={loading}>Eliminar</button
											>
										</div>
									</td>
								{/if}
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

	h2 {
		color: #333;
		margin-top: 0;
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

	.btn-mini {
		padding: 6px 10px;
		font-size: 12px;
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

	.productos-table {
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

	.stock {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 20px;
		background: #00b894;
		color: white;
		font-weight: 600;
		font-size: 12px;
	}

	.stock.bajo {
		background: #e74c3c;
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

	.acciones {
		display: flex;
		gap: 8px;
	}

	.inline-input {
		width: 100%;
		padding: 8px;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.btn-edit {
		background: #0984e3;
		color: #fff;
	}

	.btn-delete {
		background: #d63031;
		color: #fff;
	}
</style>
