<nav class="navbar">
	<div class="logo">SISTEMA EVENTO</div>
	<div class="links">
		<a href="/" data-sveltekit-reload>Dashboard</a>
		<a href="/validar" data-sveltekit-reload>Validar Entrada</a>
		<a href="/ventas" data-sveltekit-reload>Barra/Bebidas</a>
	</div>
</nav>

<style>
	.navbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #1a1a1a;
		color: white;
		padding: 1rem 2rem;
		margin-bottom: 2rem;
	}
	.logo {
		font-weight: bold;
		font-size: 1.2rem;
	}
	.links a {
		color: #ccc;
		text-decoration: none;
		margin-left: 15px;
		font-size: 0.9rem;
	}
	.links a:hover {
		color: white;
	}
</style>
