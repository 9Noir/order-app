<script setup>
import { computed, toRaw } from 'vue';
import { saveObject, updateDraftOrder, deleteObject } from '../services/databaseService';

const props = defineProps({
    draftOrders: {
        type: Array,
        required: false
    },
    products: {
        type: Array,
        required: true
    },
    confirmedOrders: {
        type: Array,
        required: false
    }
})

function getTotal(order) {
    order.totalAmount = order.products.reduce((acc, product) => acc + product.price * product.quantity, 0);
    console.log(order.totalAmount)
    return order.totalAmount;
}

function updateProductOfDraftOrder(product, productId, order = null) {
    console.log(product)
    const productToUpdate = props.products.find(p => p.id === productId);
    if (productToUpdate) {
        product.id = productToUpdate.id
        product.name = productToUpdate.name;
        product.price = productToUpdate.price;
        product.quantity = 1;
    }
    order && getTotal(order)
}


const getAvailableProducts = (order, currentProductId = '') => computed(() => {
    const selectedIds = order.products?.filter(product => product.id !== currentProductId).map(product => product.id);
    return props.products.filter(product => !selectedIds?.includes(product.id));
})

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

function removeProductOfDraftOrder(draftOrder, productIndex) {
    draftOrder.products.splice(productIndex, 1);
    getAvailableProducts(draftOrder);
}

function addProduct(order) {
    const availableProducts = getAvailableProducts(order).value;
    if (availableProducts.length > 0) addProductToDraftOrder(availableProducts[0], order.products);
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

async function updateDraft(draftOrder, status) {
    draftOrder.status = status;
    await updateDraftOrder(toRaw(draftOrder));
}

async function setOrder(orderToSave, status) {
    orderToSave.status = status;
    await saveObject(toRaw(orderToSave), 'orders')

    if (orderToSave.status === 'confirmed') {
        props.confirmedOrders.push(orderToSave)
        await deleteObject(orderToSave.clientId, 'draftOrders')
        props.draftOrders.splice(props.draftOrders.indexOf(orderToSave), 1);
    }
}

const orders = computed(() => {
    console.log(Boolean(props.draftOrders?.length))
    return props.draftOrders?.length ? props.draftOrders : props.confirmedOrders
})
</script>
<template>
    <div @click="getTotal(order)" class="bg-white/20 p-2 rounded-lg" v-if="orders?.length" v-for="order in orders"
        :key="order.id">
        <span class="col-span-10 capitalize font-bold bg-gray-700 p-2">{{ order.deliveryAddress }} {{
            order.clientName
        }}</span>
        <div class="grid col-span-10" v-for="(product, productIndex) in order.products" :key="product.id + order.id">
            <div class="grid items-center grid-cols-10 col-span-10">
                <select v-if="product.id" class="text-center py-2 uppercase truncate col-span-8"
                    @change="updateProductOfDraftOrder(product, $event.target.value, order)" name="" id="">
                    <option v-for="productAvailable in getAvailableProducts(order, product.id).value"
                        :key="productAvailable.id + order.id" :value="productAvailable.id"
                        :selected="productAvailable.id === product.id">{{
                            productAvailable.name }}
                    </option>
                </select>
                <span class="col-span-2 text-center">$ {{ product.price * product.quantity }}</span>
            </div>
            <div class="grid items-center grid-cols-10 col-span-10">
                <button class="col-span-2" type="button"
                    @click="decreaseProductQuantity(product, order, productIndex)">-</button>
                <input class="quantityInput col-span-3 text-center" type="number" v-model="product.quantity" min="1"
                    placeholder="1" required>
                <button class="col-span-2" type="button" @click="increaseProductQuantity(product)">+</button>
                <button class="col-span-3" type="button"
                    @click="removeProductOfDraftOrder(order, productIndex)">🗑</button>
            </div>
        </div>
        <button class="col-span-10" v-if="getAvailableProducts(order).value.length > 0" type="button"
            @click="addProduct(order)">AGREGAR
            PRODUCTO</button>
        <h2 class="!mt-0 py-2 col-span-10">TOTAL: $ {{ order.totalAmount }}</h2>
        <div v-if="draftOrders?.length" :class="order.status === 'pending' ? 'grid grid-cols-3' : 'grid grid-cols-2'"
            class="col-span-10 gap-1 text-xs">
            <button class="bg-gray-500" type="button" @click="setOrder(order, 'confirmed')">CONFIRMAR</button>
            <button v-if="order.status !== 'skipped'" type="button"
                @click="updateDraft(order, 'skipped')">POSPONER</button>
            <button v-if="order.status !== 'declined'" type="button"
                @click="updateDraft(order, 'declined')">CANCELAR</button>
        </div>

        <div class="grid grid-cols-3 col-span-10 !text-xs" v-if="order.status === 'confirmed'">
            <button @click="setOrder(order, 'delivered')">ENTREGAR</button>
            <button @click="setOrder(order, 'paid')">ENTREGAR Y COBRAR</button>
            <button @click="setOrder(order, 'canceled')">CANCELAR</button>
            <select name="paymentMethod" id="paymentMethod">
                <option value="cash">EFECTIVO</option>
                <option value="transfer">TRANSFERENCIA</option>
                <option value="other">OTRO</option>
            </select>
        </div>
        <div class="grid grid-cols-2 col-span-10 !text-xs" v-if="order.status === 'delivered'">
            <button @click="setOrder(order, 'paid')">COBRAR</button>
            <select name="paymentMethod" id="paymentMethod">
                <option value="cash">EFECTIVO</option>
                <option value="transfer">TRANSFERENCIA</option>
                <option value="other">OTRO</option>
            </select>
        </div>
    </div>


</template>
