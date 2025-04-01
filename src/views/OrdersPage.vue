<script setup>
import { computed, reactive, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../services/db';

const order = reactive({ id: null, status: '', clientId: '', clientName: '', productId: '', productName: '', quantity: 1, totalAmount: '', notes: '', paymentMethod: '', paymentDate: null, createdAt: null, updatedAt: null, estimatedDeliveryDate: null, deliveryDate: null, isActive: true });
const orders = reactive([]);
const clients = reactive([]);
const products = reactive([]);


onMounted(() => {
    loadData();
    loadOrders();
});

function editOrder(orderData) {
    Object.assign(order, orderData);
}

async function setOrder() {
    const db = await dbPromise();
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');
    const orderData = {
        id: order.id || uuidv4(),
        createdAt: order.createdAt || new Date(),
        updatedAt: new Date(),
    };

    if (order.id) {
        await store.put(orderData);
    } else {
        await store.add(orderData);
    }

    await tx.done;
    resetForm();
    // loadOrders();
}

function resetForm() {
    // product.id = null;
    // product.nombre = '';
    // product.precio = '';
    // product.createdAt = null;
    // product.active = true;
}

async function loadData() {
    const db = await dbPromise();
    Object.assign(clients, await db.transaction('clients', 'readonly').objectStore('clients').getAll());
    Object.assign(products, await db.transaction('products', 'readonly').objectStore('products').getAll());
}

async function loadOrders() {
    const db = await dbPromise();
    Object.assign(orders, await db.transaction('orders', 'readonly').objectStore('orders').getAll());
}


</script>
<template>
    <h2>TOMAR PEDIDOS</h2>
    <section>
        <div v-if="clients?.length" v-for="client in clients" :key="client.id">
            <span class="col-span-1">{{ client.pasillo }}-{{ client.local }}</span>
            <span class="col-span-2">{{ client.nombre }}</span>
            <span class="col-span-3 truncate">{{ products[0].nombre }}</span>
            <div class="grid grid-cols-4 col-span-3">
                <button type="button" @click="order.quantity--">-</button>
                <input class="quantityInput col-span-2 text-center" type="number" v-model="order.quantity" min="1" placeholder="1" required>
                <button type="button" @click="order.quantity++">+</button>
            </div>
            <span class="col-span-1">$ {{ products[0].precio * order.quantity }}</span>
            <div class="grid grid-cols-3 col-span-10 gap-1 text-xs [button]:bg-gray-800">
                <button class="bg-gray-400" type="button" @click="">ENCARGAR</button>
                <button type="button" @click="">CERRADO</button>
                <button type="button" @click="">CANCELAR</button>
            </div>
        </div>
        <div class="text-center italic opacity-50" v-if="clients?.length === 0">No hay clientes. Añade un cliente.</div>
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