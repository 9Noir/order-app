<script setup>
import { computed, reactive, onMounted } from 'vue';
import { getAll, saveObject, deleteObject } from '../services/databaseService';

const product = reactive({});
const products = reactive([]);

const activeProducts = computed(() => products.filter(p => p.isActive));
const inactiveProducts = computed(() => products.filter(p => !p.isActive));
const sortedProducts = computed(() => [...activeProducts.value].sort((a, b) => b.updatedAt - a.updatedAt));

onMounted(() => {
    loadProducts();
    resetForm();
});

function editProduct(productData) {
    Object.assign(product, productData);
}

async function setProduct(productToSave = product, isActive = true) {
    Object.assign(productToSave, { isActive });
    const productData = await saveObject(productToSave, 'products');

    if (productToSave.id) {
        Object.assign(products.find(p => p.id === productData.id), productData);
    } else {
        products.push(productData);
    }
    resetForm();
}

function deleteProduct(productId) {
    deleteObject(productId, 'products');
    products.splice(products.findIndex(p => p.id === productId), 1);
}

function resetForm() {
    product.id = null;
    product.name = '';
    product.price = '';
    product.createdAt = null;
    product.isActive = true;
}

async function loadProducts() {
    products.length = 0;
    products.push(...await getAll('products'));
}
</script>
<template>
    <h2>AGREGAR PRODUCTOS</h2>
    <form v-if="'name' in product" @submit.prevent="setProduct()">
        <input type="text" v-model="product.name" placeholder="Nombre" required>
        <input type="number" v-model="product.price" placeholder="Precio" required>
        <div class="grid gap-2 mt-2">
            <button type="submit" :disabled="!product.name.trim()">
                {{ !product.id ? 'Agregar' : 'Guardar Cambios' }}
            </button>
            <button class="bg-gray-800" v-if="product.id" type="button" @click="resetForm">
                Cancelar Edición
            </button>
        </div>

    </form>

    <h2>PRODUCTOS</h2>
    <h3 v-if="!sortedProducts?.length">No hay productos activos</h3>
    <section v-if="sortedProducts?.length">
        <div>
            <span class="col-span-2">$</span>
            <span class="col-span-6">Nombre</span>
            <span class="col-span-2 text-center">Acciones</span>
        </div>
        <div v-if="sortedProducts?.length" v-for="product in sortedProducts" :key="product.id">
            <span class="col-span-2">{{ product.price }}</span>
            <span class="col-span-3 truncate">{{ product.name }}</span>
            <div class="grid grid-cols-3 col-span-5">
                <button type="button" @click="editProduct(product)">✎</button>
                <button type="button" @click="setProduct(product, false)">╳</button>
                <button type="button" @click="deleteProduct(product.id)">╳</button>
            </div>

        </div>
    </section>

    <h2>INACTIVOS</h2>
    <h3 v-if="!inactiveProducts?.length">No hay productos inactivos</h3>
    <section v-if="inactiveProducts?.length">
        <div>
            <span class="col-span-2">$</span>
            <span class="col-span-4">Nombre</span>
            <span class="col-span-2 text-center">Acciones</span>
        </div>
        <div class="" v-if="inactiveProducts?.length" v-for="product in inactiveProducts" :key="product.id">
            <span class="col-span-2">{{ product.price }}</span>
            <span class="col-span-3 truncate">{{ product.name }}</span>
            <div class="grid grid-cols-3 col-span-5">
                <button type="button" @click="editProduct(product)">✎</button>
                <button type="button" @click="setProduct(product, true)">✓</button>
                <button type="button" @click="deleteProduct(product.id)">╳</button>
            </div>

        </div>
    </section>

</template>