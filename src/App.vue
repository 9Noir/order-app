<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from './layouts/DefaultLayout.vue';

const route = useRoute();
const layoutComponent = computed(() => {
    return route.meta.layout || DefaultLayout;
});
</script>

<template>
    <component :is="layoutComponent">
        <router-view />
    </component>
</template>