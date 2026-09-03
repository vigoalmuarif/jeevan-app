<template>
    <div class="flex items-center space-x-2">
        <p>{{ row.name }}</p> <Badge variant="success" v-if="row.is_main">
            Main
        </Badge>
    </div>
</template>

<script setup lang="ts">
import Badge from '@/components/ui/badge/Badge.vue';


const props = defineProps<{
    row : {
        name: string
        is_main: boolean
    }
}>()

</script>
