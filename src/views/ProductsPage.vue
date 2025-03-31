<script setup>
import { computed, reactive, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../services/db';

const product = reactive({ id: null, nombre: '', precio: '', createdAt: null, active: true });
const activeProducts = computed(() => []);
const inactiveProducts = computed(() => []);
const sortedProducts = computed(() => []);

onMounted(() => {
    loadProducts();
});

function editProduct(productData) {
    product.id = productData.id;
    product.nombre = productData.nombre;
    product.precio = productData.precio;
    product.createdAt = productData.createdAt;
    product.active = productData.active;
}

async function setProduct() {
    const db = await dbPromise();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const productData = {
        id: product.id || uuidv4(),
        nombre: product.nombre.trim() || 'Nombre',
        precio: product.precio || 0,
        createdAt: product.createdAt || new Date(),
        updatedAt: new Date(),
        active: product.active
    };

    if (product.id) {
        await store.put(productData);
    } else {
        await store.add(productData);
    }

    await tx.oncomplete;
    resetForm();
    loadProducts();
}

function resetForm() {
    product.id = null;
    product.nombre = '';
    product.precio = '';
    product.createdAt = null;
    product.active = true;
}

async function loadProducts() {
    const db = await dbPromise();
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const productsData = await store.getAll();
    activeProducts.value = computed(() => productsData.filter(p => p.active));
    sortedProducts.value = computed(() => activeProducts.value.sort((a, b) => b.createdAt - a.createdAt));
    inactiveProducts.value = computed(() => productsData.filter(p => !p.active));
}


</script>
<template v-if="product.nombre">
    <h1>PRODUCTOS</h1>
    <h2>AGREGAR PRODUCTOS</h2>
    <form class="grid" @submit.prevent="setProduct">
        <input type="text" v-model="product.nombre" placeholder="Nombre" required>
        <input type="number" v-model="product.precio" placeholder="Precio" required>
        <div class="grid gap-2 mt-2">
            <button type="submit" class="disabled:opacity-60 disabled:cursor-not-allowed "
                :disabled="!product.nombre.trim()">
                {{ !product.id ? 'Agregar' : 'Guardar Cambios' }}
            </button>
            <button class="bg-gray-800" v-if="product.id" type="button" @click="resetForm">
                Cancelar Edición
            </button>
        </div>

    </form>
    <h2>LISTA DE PRODUCTOS</h2>
    <div>
        <div v-if="sortedProducts?.length" v-for="product in sortedProducts" :key="product.id">
            <span>{{ product.precio }}</span>
            <span>{{ product.nombre }}</span>
            <button type="button" @click="editProduct(product)">Editar</button>
            <button type="button" @click="product.active = false">Eliminar</button>
        </div>
    </div>
    <h2>LISTA DE PRODUCTOS INACTIVOS</h2>
    <div>
        <div v-if="inactiveProducts?.length" v-for="product in inactiveProducts" :key="product.id">
            <span>{{ product.precio }}</span>
            <span>{{ product.nombre }}</span>
            <button type="button" @click="editProduct(product)">Editar</button>
            <button type="button" @click="product.active = false">Eliminar</button>
        </div>
    </div>

</template>