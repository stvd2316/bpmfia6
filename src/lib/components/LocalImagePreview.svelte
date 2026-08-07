<script lang="ts">
	// KOMPONEN AMAN UNTUK PREVIEW FILE LOKAL
	// (port dari LocalImagePreview di page.tsx)
	let { file }: { file: File } = $props();

	let previewUrl = $state('');

	$effect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		previewUrl = url;
		return () => {
			URL.revokeObjectURL(url);
		};
	});
</script>

{#if !previewUrl}
	<div class="pdf-icon">Loading...</div>
{:else if file.type === 'application/pdf'}
	<div class="pdf-icon">PDF</div>
{:else}
	<img src={previewUrl} alt="Preview File" />
{/if}
