<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../services/db';

const order = reactive({ id: null, orderNumber: '', status: '', clientId: '', clientName: '', location: '', items: null, totalAmount: '', notes: '', paymentMethod: '', paymentDate: null, createdAt: null, updatedAt: null, expectedDeliveryDate: null, deliveryDate: null, isActive: true });
const orders = reactive([]);
const draftOrders = reactive([]);
const clients = reactive([]);
var products = reactive([]);
const defaultProduct = ref(null);
const today = new Date().toISOString().slice(0, 10);
var orderSequence = 1;

const getTotal = (draftOrder) => computed(() => {
    return draftOrder.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
})

const getAvailableProducts = (draftOrder, currentItemId = '') => computed(() => {
    const selectedIds = draftOrder.items.filter(item => item.id !== currentItemId).map(item => item.id);
    console.log(draftOrder.items);
    return products.filter(product => !selectedIds.includes(product.id));
})

onMounted(async () => {
    await loadData();
    await createDraftOrders();
});

function addItem(product, items = []) {
    const newItem = {
        id: product.id,
        name: product.nombre,
        quantity: 1,
        price: product.precio
    };
    items.push(newItem);
    return items;
}

async function createDraftOrders() {
    products?.length && clients.forEach(client => {
        draftOrders.push({
            id: client.id,
            clientName: client.nombre,
            location: client.pasillo + '-' + client.local,
            items: addItem(products[0], []),
            availableProducts: products
        });
    });
    draftOrders.sort((a, b) => a.location.localeCompare(b.location));
}
function editOrder(orderData) {
    Object.assign(order, orderData);
}

function generateOrderNumber(prefix = 'ORD') {
    orderSequence++;
    return prefix + '-' + today + '-' + orderSequence;
}

async function setOrder() {
    const db = await dbPromise();
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');
    const orderData = {
        id: order.id || uuidv4(),
        orderNumber: order.orderNumber || generateOrderNumber(),
        createdAt: order.createdAt || new Date(),
        updatedAt: new Date(),
    };

    if (order.id) {
        await store.put(orderData);
    } else {
        await store.add(orderData);
    }
    await tx.done;
    // loadOrders();
}

async function loadData() {
    const db = await dbPromise();
    Object.assign(orders, await db.transaction('orders', 'readonly').objectStore('orders').getAll());
    Object.assign(clients, await db.transaction('clients', 'readonly').objectStore('clients').getAll());
    Object.assign(products, await db.transaction('products', 'readonly').objectStore('products').getAll());
    products = products.filter(product => product.isActive);
}

function addProduct(draftOrder) {
    const availableProducts = getAvailableProducts(draftOrder).value;
    if (availableProducts.length > 0) addItem(availableProducts[0], draftOrder.items);
}

function removeProduct(draftOrder, productIndex) {
    draftOrder.items.splice(productIndex, 1);
    getAvailableProducts(draftOrder);
}

function updateItem(item, productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        item.id = product.id
        item.name = product.nombre;
        item.price = product.precio;
        item.quantity = 1;
    }
}



</script>
<template>
    <h2>TOMAR PEDIDOS</h2>
    <h3 class="text-center italic p-2" v-if="clients?.length === 0">No hay clientes. Añade un cliente primero.</h3>
    <h3 class="text-center italic p-2" v-if="products?.length === 0">No hay productos. Añade un producto primero.</h3>

    <section class="space-y-4">
        <div class="bg-white/20 p-2 rounded-lg" v-if="draftOrders?.length && products?.length"
            v-for="draftOrder in draftOrders" :key="draftOrder.id">
            <span class="col-span-10 font-bold bg-gray-700 p-2">{{ draftOrder.location }} {{ draftOrder.clientName
                }}</span>
            <div class="grid col-span-10" v-for="(item, productIndex) in draftOrder.items" :key="item.id">
                <div class="grid items-center grid-cols-10 col-span-10">
                    <select v-if="item.id" class="text-center py-2 uppercase truncate col-span-8"
                        @change="updateItem(item, $event.target.value)" name="" id="" v-model="item.id">
                        <option v-for="product in getAvailableProducts(draftOrder, item.id).value" :key="product.id"
                            :value="product.id">{{
                                product.nombre }}
                        </option>
                    </select>
                    <span class="col-span-2 text-center">$ {{ item.price * item.quantity }}</span>
                </div>


                <div class="grid items-center grid-cols-10 col-span-10">
                    <button class="col-span-2" type="button" @click="item.quantity--">-</button>
                    <input class="quantityInput col-span-3 text-center" type="number" v-model="item.quantity" min="1"
                        placeholder="1" required>
                    <button class="col-span-2" type="button" @click="item.quantity++">+</button>
                    <button class="col-span-3" type="button"
                        @click="removeProduct(draftOrder, productIndex)">🗑</button>
                </div>
            </div>
            <button class="col-span-10" v-if="products.length > 1" type="button" @click="addProduct(draftOrder)">AGREGAR
                PRODUCTO</button>


            <h2 class="!mt-0 py-2 col-span-10">TOTAL: $ {{ getTotal(draftOrder).value }}</h2>
            <div class="grid grid-cols-3 col-span-10 gap-1 text-xs">
                <button class="bg-gray-500" type="button" @click="">ENCARGAR</button>
                <button type="button" @click="">CERRADO</button>
                <button type="button" @click="">CANCELAR</button>
            </div>
        </div>
    </section>

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