<script lang="ts">
	export let label: string = 'Total';
	export let value: string | number = '0';
	export let color: string = '#3498db';
</script>

<div class="card" style="border-top: 4px solid {color}">
	<span class="label">{label}</span>
	<span class="value">{value}</span>
</div>

<style>
	.card {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		text-align: center;
		min-width: 150px;
	}
	.label {
		font-size: 0.8rem;
		color: #666;
		text-transform: uppercase;
		margin-bottom: 5px;
	}
	.value {
		font-size: 1.5rem;
		font-weight: bold;
		color: #333;
	}
</style>
