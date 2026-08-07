<script lang="ts">
	// Port dari renderTextWithLinks di page.tsx — URL otomatis jadi link
	let { text }: { text: string } = $props();

	let words = $derived(text ? text.split(' ') : []);
</script>

{#if text}
	{#each words as word, index (index)}
		{#if word.startsWith('http://') || word.startsWith('https://')}
			<span
				><a
					href={word}
					target="_blank"
					rel="noopener noreferrer"
					style="color: var(--link-blue); text-decoration: underline; word-break: break-all"
					>{word}</a
				>{index < words.length - 1 ? ' ' : ''}</span
			>
		{:else}
			<span>{word}{index < words.length - 1 ? ' ' : ''}</span>
		{/if}
	{/each}
{/if}
