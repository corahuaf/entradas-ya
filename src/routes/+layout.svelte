<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import '../app.css';
</script>

<Navbar />

<main class="container">
	<slot />
</main>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}
</style>
