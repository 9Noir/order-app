<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();

const isActive = (path) => route.path === path;

</script>
<template>
    <header class="flex justify-center [&_*]:border [&_*]:p-2 [&_*]:rounded-md gap-2">
        <router-link :class="{ 'bg-gray-200 text-black': isActive('/orders') }" to="/orders">Ordenes</router-link>
        <router-link :class="{ 'bg-gray-200 text-black': isActive('/clients') }" to="/clients">Clientes</router-link>
        <router-link :class="{ 'bg-gray-200 text-black': isActive('/products') }" to="/products">Productos</router-link>
    </header>
</template>
