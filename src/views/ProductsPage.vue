<script setup>
import { computed, reactive, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../services/db';

const product = reactive({ id: null, nombre: '', precio: '', createdAt: null, isActive: true });
const products = reactive([]);

const activeProducts = computed(() => products.filter(p => p.isActive));
const inactiveProducts = computed(() => products.filter(p => !p.isActive));
const sortedProducts = computed(() => [...activeProducts.value].sort((a, b) => b.updatedAt - a.updatedAt));

onMounted(() => {
    loadProducts();
});

function editProduct(productData) {
    Object.assign(product, productData);
}

async function setProduct(productToSave = product, isActive = true) {
    const db = await dbPromise();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const productData = {
        id: productToSave.id || uuidv4(),
        nombre: productToSave.nombre.trim() || 'Producto',
        precio: productToSave.precio || 0,
        createdAt: productToSave.createdAt || new Date(),
        updatedAt: new Date(),
        isActive: isActive
    };

    if (productToSave.id) {
        await store.put(productData);
        Object.assign(products.find(p => p.id === productData.id), productData);
    } else {
        await store.add(productData);
        products.push(productData);

    }

    await tx.done;
    resetForm();
}

function resetForm() {
    product.id = null;
    product.nombre = '';
    product.precio = '';
    product.createdAt = null;
    product.isActive = true;
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
    <form @submit.prevent="setProduct()">
        <input type="text" v-model="product.nombre" placeholder="Nombre" required>
        <input type="number" v-model="product.precio" placeholder="Precio" required>
        <div class="grid gap-2 mt-2">
            <button type="submit" :disabled="!product.nombre.trim()">
                {{ !product.id ? 'Agregar' : 'Guardar Cambios' }}
            </button>
            <button class="bg-gray-800" v-if="product.id" type="button" @click="resetForm">
                Cancelar Edición
            </button>
        </div>

    </form>

    <h2>PRODUCTOS</h2>
    <section>
        <div>
            <span class="col-span-2">$</span>
            <span class="col-span-6">Nombre</span>
            <span class="col-span-2 text-center">Acciones</span>
        </div>
        <div v-if="sortedProducts?.length" v-for="product in sortedProducts" :key="product.id">
            <span class="col-span-2">{{ product.precio }}</span>
            <span class="col-span-6">{{ product.nombre }}</span>
            <button type="button" @click="editProduct(product)">✎</button>
            <button type="button" @click="setProduct(product, false)">╳</button>
        </div>
    </section>

    <h2>INACTIVOS</h2>
    <section>
        <div>
            <span class="col-span-2">$</span>
            <span class="col-span-6">Nombre</span>
            <span class="col-span-2 text-center">Acciones</span>
        </div>
        <div class="" v-if="inactiveProducts?.length" v-for="product in inactiveProducts" :key="product.id">
            <span class="col-span-2">{{ product.precio }}</span>
            <span class="col-span-6">{{ product.nombre }}</span>
            <button type="button" @click="editProduct(product)">✎</button>
            <button type="button" @click="setProduct(product, true)">✓</button>
        </div>
    </section>

</template>