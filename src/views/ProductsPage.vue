<script setup>
import { computed, reactive, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../services/db';

const product = reactive({ id: null, nombre: '', precio: '', createdAt: null, active: true });
const products = reactive([]);

const activeProducts = computed(() => products.filter(p => p.active));
const inactiveProducts = computed(() => products.filter(p => !p.active));
const sortedProducts = computed(() => [...activeProducts.value].sort((a, b) => b.createdAt - a.createdAt));

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
    products.length = 0;
    products.push(...await store.getAll());
}


</script>
<template>
    <h2>AGREGAR PRODUCTOS</h2>
    <form class="grid gap-2" @submit.prevent="setProduct">
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

    <h2>PRODUCTOS</h2>
    <section>
        <div class="grid grid-cols-10 opacity-50 text-sm">
            <span class="col-span-2">$</span>
            <span class="col-span-6">Nombre</span>
            <span class="col-span-2 text-center">Acciones</span>
        </div>
        <div class="grid grid-cols-10" v-if="sortedProducts?.length" v-for="product in sortedProducts"
            :key="product.id">
            <span class="col-span-2">{{ product.precio }}</span>
            <span class="col-span-6">{{ product.nombre }}</span>
            <button type="button" @click="editProduct(product)">✎</button>
            <button type="button" @click="product.active = false">╳</button>
        </div>
    </section>

    <h2>INACTIVOS</h2>
    <section>
        <div class="grid grid-cols-10 opacity-50 text-sm">
            <span class="col-span-2">$</span>
            <span class="col-span-6">Nombre</span>
            <span class="col-span-2 text-center">Acciones</span>
        </div>
        <div class="grid grid-cols-10" v-if="inactiveProducts?.length" v-for="product in inactiveProducts"
            :key="product.id">
            <span class="col-span-1">{{ product.precio }}</span>
            <span class="col-span-7">{{ product.nombre }}</span>
            <button type="button" @click="editProduct(product)">✎</button>
            <button type="button" @click="product.active = true">✓</button>
        </div>
    </section>

</template>