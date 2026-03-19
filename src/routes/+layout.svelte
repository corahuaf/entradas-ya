<script>
	import '../app.css';
</script>

<main>
	<slot />
</main>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
		background: #f5f5f5;
	}

	main {
		width: 100%;
		min-height: 100vh;
	}
</style>
