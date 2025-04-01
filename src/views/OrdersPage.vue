<script setup>
import { computed, reactive, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../services/db';

const order = reactive({ id: null, status: '', client_id: '', client_name: '', product_name: '', total_amount: '', notes: '', payment_method: '', payment_date: null, created_at: null, updated_at: null, is_active: true });
const orders = reactive([]);
const clients = reactive([]);
const products = reactive([]);

onMounted(() => {
    loadData();
    loadOrders();
});

function editOrder(orderData) {
    order.id = orderData.id;
    order.status = orderData.status;
    order.client_id = orderData.client_id;
    order.client_name = orderData.client_name;
    order.product_name = orderData.product_name;
    order.total_amount = orderData.total_amount;
    order.notes = orderData.notes;
}

async function setOrder() {
    const db = await dbPromise();
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');
    const orderData = {
        id: order.id || uuidv4(),
        status: order.status || 'Pendiente',
        client_id: order.client_id || '',
        client_name: order.client_name || '',
        product_name: order.product_name || '',
        total_amount: order.total_amount || 0,
        notes: order.notes || '',
        payment_method: order.payment_method || '',
        payment_date: order.payment_date || null,
        created_at: order.created_at || new Date(),
        updated_at: new Date(),
        is_active: order.is_active
    };

    if (order.id) {
        await store.put(orderData);
    } else {
        await store.add(orderData);
    }

    await tx.oncomplete;
    resetForm();
    loadOrders();
}

function resetForm() {
    product.id = null;
    product.nombre = '';
    product.precio = '';
    product.createdAt = null;
    product.active = true;
}
async function loadData() {
    const db = await dbPromise();
    const tx = db.transaction('clients', 'readonly');
    const store = tx.objectStore('clients');
    const tx2 = db.transaction('products', 'readonly');
    const store2 = tx2.objectStore('products');
    clients.length = 0;
    clients.push(...await store.getAll());
    products.length = 0;
    products.push(...await store2.getAll());
}

async function loadOrders() {
    const db = await dbPromise();
    const tx = db.transaction('orders', 'readonly');
    const store = tx.objectStore('orders');
    orders.length = 0;
    orders.push(...await store.getAll());
}


</script>
<template>
    <h2>TOMAR PEDIDOS</h2>
    <section>
        <div v-if="clients?.length" v-for="client in clients" :key="client.id">
            <span>{{ client.pasillo }}-{{ client.local }}</span>
            <span>{{ client.name }}</span>
        </div>
    </section>
    <!--     <form class="grid gap-2" @submit.prevent="setOrder">
        <input type="text" v-model="order.status" placeholder="Status" required>
        <input type="text" v-model="order.client_id" placeholder="Client ID" required>
        <input type="text" v-model="order.client_name" placeholder="Client Name" required>
        <input type="text" v-model="order.product_name" placeholder="Product Name" required>
        <input type="number" v-model="order.total_amount" placeholder="Total Amount" required>
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

    <h2>PEDIDOS</h2>
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
    </section> -->

</template>