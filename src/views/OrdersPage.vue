<script setup>
import { ref, reactive, onMounted, computed, toRaw } from 'vue';
import { getAll, saveObject, deleteObject } from '../services/databaseService';
import ClientsPage from './ClientsPage.vue';

const defaultProduct = ref(null);
const order = reactive({ id: null, orderNumber: '', status: '', clientId: '', clientName: '', deliveryAddress: '', products: null, totalAmount: '', notes: '', paymentMethod: '', paymentDate: null, createdAt: null, updatedAt: null, expectedDeliveryDate: null, deliveryDate: null, isActive: true });
const orders = reactive([]);
const draftOrders = reactive([]);
const skippedOrders = reactive([]);
const declinedOrders = reactive([]);

const clients = reactive([]);
var products = reactive([]);
const today = new Date().toISOString().slice(0, 10);
var orderSequence = 1;

const getTotal = (draftOrder) => computed(() => {
    draftOrder.totalAmount = draftOrder.products.reduce((acc, product) => acc + product.price * product.quantity, 0);
    return draftOrder.totalAmount;
})

const getAvailableProducts = (draftOrder, currentProductId = '') => computed(() => {
    const selectedIds = draftOrder.products.filter(product => product.id !== currentProductId).map(product => product.id);
    return products.filter(product => !selectedIds.includes(product.id));
})

onMounted(async () => {
    await loadData();
});

function selectDefaultProduct(productId) {
    defaultProduct.value = products.find(product => product.id === productId);
    createDraftOrders();
}

async function createDraftOrders() {
    draftOrders.length = 0;
    products?.length && clients.forEach(client => {
        draftOrders.push({
            status: 'pending',
            clientId: client.id,
            clientName: client.name,
            deliveryAddress: client.address,
            products: addProductToDraftOrder(defaultProduct.value, []),
        });
    });
    draftOrders.sort((a, b) => a.deliveryAddress.localeCompare(b.deliveryAddress));
}

function generateOrderNumber(prefix = 'ORD') {
    orderSequence++;
    return prefix + '-' + today + '-' + orderSequence;
}

function removeFromArray(array, orderToSave) {
    const index = array.findIndex(o => o.clientId === orderToSave.clientId);
    array.splice(index, 1);
}

async function setOrder(orderToSave, status) {
    const orderData = { ...toRaw(orderToSave), status };


    if (orderToSave.status === 'pending') {
        removeFromArray(draftOrders, orderToSave);
    } else if (orderToSave.status === 'skipped') {
        removeFromArray(skippedOrders, orderToSave);
    } else if (orderToSave.status === 'declined') {
        removeFromArray(declinedOrders, orderToSave);
    }

    if (status === 'confirmed') {
        //Ordenes confirmadas, se eliminan de los borradores
        await saveObject(orderData, 'orders');
    } else if (status === 'skipped') {
        //Ordenes cambiadas de estado a skip o decline, se eliminan de los borradores
        skippedOrders.push(orderData)
    } else if (status === 'declined') {
        //Ordenes cambiadas de estado a skip o decline, se eliminan de los borradores
        declinedOrders.push(orderData)
    }
}

async function loadData() {
    Object.assign(draftOrders, await getAll('draftOrders'));
    Object.assign(clients, await getAll('clients'));
    Object.assign(products, (await getAll('products')).filter(product => product.isActive));
    // products = products.filter(product => product.isActive);
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

function addProduct(draftOrder) {
    const availableProducts = getAvailableProducts(draftOrder).value;
    if (availableProducts.length > 0) addProductToDraftOrder(availableProducts[0], draftOrder.products);
}

function removeProductOfDraftOrder(draftOrder, productIndex) {
    draftOrder.products.splice(productIndex, 1);
    getAvailableProducts(draftOrder);
}

function updateProductOfDraftOrder(product, productId) {
    const productToUpdate = products.find(p => p.id === productId);
    if (productToUpdate) {
        product.id = productToUpdate.id
        product.name = productToUpdate.name;
        product.price = productToUpdate.price;
        product.quantity = 1;
    }
}

function increaseProductQuantity(product) {
    product.quantity++;
}

// function quantityOnChange(product, draftOrder, productIndex) {
//     if (product.quantity > 1) product.quantity--;
//     else removeProductOfDraftOrder(draftOrder, productIndex);
// }

function decreaseProductQuantity(product, draftOrder, productIndex) {
    if (product.quantity > 1) product.quantity--;
    else removeProductOfDraftOrder(draftOrder, productIndex);
}

</script>
<template>
    <h2>TOMAR PEDIDOS</h2>
    <select v-if="!defaultProduct && products?.length" class="mx-auto mt-4 text-center"
        @change="selectDefaultProduct($event.target.value)">
        <option value="">Selecciona un producto</option>
        <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
    </select>

    <h3 class="text-center italic p-2" v-if="clients?.length === 0">No hay clientes. Añade un cliente primero.</h3>
    <h3 class="text-center italic p-2" v-if="products?.length === 0">No hay productos. Añade un producto primero.</h3>

    <section v-if="defaultProduct" class="space-y-4">
        <div class="bg-white/20 p-2 rounded-lg" v-if="draftOrders?.length && products?.length"
            v-for="draftOrder in draftOrders" :key="draftOrder.id">
            <span class="col-span-10 capitalize font-bold bg-gray-700 p-2">{{ draftOrder.deliveryAddress }} {{
                draftOrder.clientName
                }}</span>
            <div class="grid col-span-10" v-for="(product, productIndex) in draftOrder.products"
                :key="product.id + draftOrder.id">
                <div class="grid items-center grid-cols-10 col-span-10">
                    <select v-if="product.id" class="text-center py-2 uppercase truncate col-span-8"
                        @change="updateProductOfDraftOrder(product, $event.target.value)" name="" id="">
                        <option v-for="product in getAvailableProducts(draftOrder, product.id).value"
                            :key="product.id + draftOrder.id" :value="product.id">{{
                                product.name }}
                        </option>
                    </select>
                    <span class="col-span-2 text-center">$ {{ product.price * product.quantity }}</span>
                </div>
                <div class="grid items-center grid-cols-10 col-span-10">
                    <button class="col-span-2" type="button"
                        @click="decreaseProductQuantity(product, draftOrder, productIndex)">-</button>
                    <input class="quantityInput col-span-3 text-center" type="number" v-model="product.quantity" min="1"
                        placeholder="1" required>
                    <button class="col-span-2" type="button" @click="increaseProductQuantity(product)">+</button>
                    <button class="col-span-3" type="button"
                        @click="removeProductOfDraftOrder(draftOrder, productIndex)">🗑</button>
                </div>
            </div>
            <button class="col-span-10" v-if="getAvailableProducts(draftOrder).value.length > 0" type="button"
                @click="addProduct(draftOrder)">AGREGAR
                PRODUCTO</button>
            <h2 class="!mt-0 py-2 col-span-10">TOTAL: $ {{ getTotal(draftOrder).value }}</h2>
            <div class="grid grid-cols-3 col-span-10 gap-1 text-xs">
                <button class="bg-gray-500" type="button" @click="setOrder(draftOrder, 'confirmed')">CONFIRMAR</button>
                <button type="button" @click="setOrder(draftOrder, 'skipped')">POSPONER</button>
                <button type="button" @click="setOrder(draftOrder, 'declined')">CANCELAR</button>
            </div>
        </div>
    </section>

    <h2>POSPUESTOS</h2>
    <section v-if="defaultProduct" class="space-y-4">
        <div class="bg-white/20 p-2 rounded-lg" v-if="skippedOrders?.length && products?.length"
            v-for="skippedOrder in skippedOrders" :key="skippedOrder.id">
            <span class="col-span-10 capitalize font-bold bg-gray-700 p-2">{{ skippedOrder.deliveryAddress }} {{
                skippedOrder.clientName
                }}</span>
            <div class="grid col-span-10" v-for="(product, productIndex) in skippedOrder.products"
                :key="product.id + skippedOrder.id">
                <div class="grid items-center grid-cols-10 col-span-10">
                    <select v-if="product.id" class="text-center py-2 uppercase truncate col-span-8"
                        @change="updateProductOfDraftOrder(product, $event.target.value)" name="" id="">
                        <option v-for="product in getAvailableProducts(skippedOrder, product.id).value"
                            :key="product.id + skippedOrder.id" :value="product.id">{{
                                product.name }}
                        </option>
                    </select>
                    <span class="col-span-2 text-center">$ {{ product.price * product.quantity }}</span>
                </div>
                <div class="grid items-center grid-cols-10 col-span-10">
                    <button class="col-span-2" type="button"
                        @click="decreaseProductQuantity(product, skippedOrder, productIndex)">-</button>
                    <input class="quantityInput col-span-3 text-center" type="number" v-model="product.quantity" min="1"
                        placeholder="1" required>
                    <button class="col-span-2" type="button" @click="increaseProductQuantity(product)">+</button>
                    <button class="col-span-3" type="button"
                        @click="removeProductOfDraftOrder(skippedOrder, productIndex)">🗑</button>
                </div>
            </div>
            <button class="col-span-10" v-if="getAvailableProducts(skippedOrder).value.length > 0" type="button"
                @click="addProduct(skippedOrder)">AGREGAR
                PRODUCTO</button>
            <h2 class="!mt-0 py-2 col-span-10">TOTAL: $ {{ getTotal(skippedOrder).value }}</h2>
            <div class="grid grid-cols-3 col-span-10 gap-1 text-xs">
                <button class="bg-gray-500" type="button"
                    @click="setOrder(skippedOrder, 'confirmed')">CONFIRMAR</button>
                <button type="button" @click="setOrder(skippedOrder, 'declined')">CANCELAR</button>
            </div>
        </div>
    </section>

    <h2>CANCELADOS</h2>
    <section v-if="defaultProduct" class="space-y-4">
        <div class="bg-white/20 p-2 rounded-lg" v-if="declinedOrders?.length && products?.length"
            v-for="declinedOrder in declinedOrders" :key="declinedOrder.id">
            <span class="col-span-10 capitalize font-bold bg-gray-700 p-2">{{ declinedOrder.deliveryAddress }} {{
                declinedOrder.clientName
                }}</span>
            <div class="grid col-span-10" v-for="(product, productIndex) in declinedOrder.products"
                :key="product.id + declinedOrder.id">
                <div class="grid items-center grid-cols-10 col-span-10">
                    <select v-if="product.id" class="text-center py-2 uppercase truncate col-span-8"
                        @change="updateProductOfDraftOrder(product, $event.target.value)" name="" id="">
                        <option v-for="product in getAvailableProducts(declinedOrder, product.id).value"
                            :key="product.id + declinedOrder.id" :value="product.id">{{
                                product.name }}
                        </option>
                    </select>
                    <span class="col-span-2 text-center">$ {{ product.price * product.quantity }}</span>
                </div>
                <div class="grid items-center grid-cols-10 col-span-10">
                    <button class="col-span-2" type="button"
                        @click="decreaseProductQuantity(product, declinedOrder, productIndex)">-</button>
                    <input class="quantityInput col-span-3 text-center" type="number" v-model="product.quantity" min="1"
                        placeholder="1" required>
                    <button class="col-span-2" type="button" @click="increaseProductQuantity(product)">+</button>
                    <button class="col-span-3" type="button"
                        @click="removeProductOfDraftOrder(declinedOrder, productIndex)">🗑</button>
                </div>
            </div>
            <button class="col-span-10" v-if="getAvailableProducts(declinedOrder).value.length > 0" type="button"
                @click="addProduct(declinedOrder)">AGREGAR
                PRODUCTO</button>
            <h2 class="!mt-0 py-2 col-span-10">TOTAL: $ {{ getTotal(declinedOrder).value }}</h2>
            <div class="grid grid-cols-3 col-span-10 gap-1 text-xs">
                <button class="bg-gray-500" type="button"
                    @click="setOrder(declinedOrder, 'confirmed')">CONFIRMAR</button>
                <button type="button" @click="setOrder(declinedOrder, 'skipped')">POSPONER</button>
            </div>
        </div>
    </section>

</template>