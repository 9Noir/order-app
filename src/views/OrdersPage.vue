<script setup>
import { ref, reactive, onMounted, computed, toRaw } from 'vue';
import { getAll, generateDailyDraftOrders } from '../services/databaseService';
import OrderCard from '../components/OrderCard.vue';

const defaultProduct = ref(null);
const orders = reactive([]);
const draftOrders = computed(() => orders.filter(order => order.status === 'pending'));
const skippedOrders = computed(() => orders.filter(order => order.status === 'skipped'));
const declinedOrders = computed(() => orders.filter(order => order.status === 'declined'));
const confirmedOrders = computed(() => orders.filter(order => order.status === 'confirmed'));
const deliveredOrders = computed(() => orders.filter(order => order.status === 'delivered'));
const paidOrders = computed(() => orders.filter(order => order.status === 'paid'));
const viewConfirmedOrders = ref(true);

const clients = reactive([]);
const products = reactive([]);
const today = new Date().toISOString().slice(0, 10);
var orderSequence = 1;

onMounted(async () => {
    await loadData()
    await generateAndSetDraftOrders();
});

async function generateAndSetDraftOrders() {
    const drafts = await generateDailyDraftOrders(clients, products);
    orders.length = 0
    drafts.forEach((draft) => orders.push(draft))
    console.log(orders)
    orders.sort((a, b) => a.deliveryAddress.localeCompare(b.deliveryAddress));
}

function generateOrderNumber(prefix = 'ORD') {
    orderSequence++;
    return prefix + '-' + today + '-' + orderSequence;
}

async function loadData() {
    Object.assign(draftOrders, await getAll('draftOrders'));
    Object.assign(orders, await getAll('orders'));
    Object.assign(clients, await getAll('clients'));
    Object.assign(products, (await getAll('products')).filter(product => product.isActive));
}

function addProductToDraftOrder(product, products = []) {
    const newProductToAdd = {
        id: product.id,
        name: product.name,
        quantity: 1,
        price: product.price
    };
    products.push(newProductToAdd);
    return products;
}

async function generateDrafts() {
    await generateAndSetDraftOrders();
}

</script>
<template>
    <div class="grid grid-cols-2 text-center mt-4 text-xs">
        <button @click="viewConfirmedOrders = true" :class="{ 'bg-gray-200 text-black': viewConfirmedOrders }">CONFIRMAR
            ({{ confirmedOrders?.length }})</button>
        <button @click="viewConfirmedOrders = false"
            :class="{ 'bg-gray-200 text-black': !viewConfirmedOrders }">ENCARGAR ({{ draftOrders?.length }})</button>
    </div>
    <section v-if="viewConfirmedOrders">
        <h2>ENTREGAR ({{ confirmedOrders?.length }})</h2>
        <OrderCard :orders="confirmedOrders" :products="products" />
        <h2>COBRAR ({{ deliveredOrders?.length }})</h2>
        <OrderCard :orders="deliveredOrders" :products="products" />
    </section>

    <section v-else class="grid">
        <h2>CONSULTAR ({{ draftOrders?.length }})</h2>
        <button class="bg-gray-300" @click="generateDrafts">Generar Borradores</button>

        <OrderCard :orders="draftOrders" :products="products" />

        <h2>POSPUESTOS ({{ skippedOrders?.length }})</h2>
        <OrderCard :orders="skippedOrders" :products="products" />

        <h2>CANCELADOS ({{ declinedOrders?.length }})</h2>
        <OrderCard :orders="declinedOrders" :products="products" />
    </section>
</template>