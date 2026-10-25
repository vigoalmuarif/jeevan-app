<template>
    <div class="flex items-center space-x-2">
        <p>{{ row.name }}</p> 
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    row : {
        name: string
    }
}>()

</script>
