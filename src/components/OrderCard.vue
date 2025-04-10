<script setup>
import { computed, ref } from 'vue';
import { updateOrderStatus, cancelOrder as cancelOrderDb } from '../services/databaseService';
// import { saveOrder } from '../services/databaseService';

const props = defineProps({
    orders: {
        type: Array,
        required: true
    },
    products: {
        type: Array,
        required: true
    }
})

const paymentMethod = ref('');
const amountPaid = ref(0);
const showPaymentModal = ref(false);

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



async function handleDelivered(order) {
    if (order.status === 'confirmed') {
        showPaymentModal.value = true;
        paymentMethod.value = ''
        amountPaid.value = order.totalAmount;
        order.idToUpdate = order.id;
        order.amountPaid = order.totalAmount;
    }
}

async function confirmPayment(order) {
    await updateOrderStatus(order.id, 'paid', paymentMethod.value || order.paymentMethod, amountPaid.value);
}

async function closePaymentModal(order) {
    showPaymentModal.value = false;
    await updateOrderStatus(order.id, 'delivered', paymentMethod.value, amountPaid.value);
}

async function cancelOrder(order) {
    await cancelOrderDb(order.id);
    order.status = 'cancelled'
}
async function setOrderStatus(orderToSave, status) {
    await updateOrderStatus(orderToSave.id, status);
    orderToSave.status = status
}
async function changeAmountPaid(order) {
    if (amountPaid.value > order.totalAmount) {
        amountPaid.value = order.totalAmount
    }
}


</script>
<template>
    <div @click="getTotal(order)" class="bg-white/20 p-2 rounded-lg" v-if="orders?.length" v-for="order in props.orders"
        :key="order.id">
        <span class="col-span-10 capitalize font-bold bg-gray-700 p-2">{{ order.deliveryAddress }} {{
            order.clientName
        }}</span>

        <dialog v-if="showPaymentModal" class="modal" open>
            <div class="modal-box">
                <h3 class="font-bold text-lg">Cobrar</h3>
                <label>Metodo de pago:</label>
                <select class="text-center w-full" name="" id="" v-model="paymentMethod">
                    <option value="">Selecciona un metodo de pago</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                </select>

                <label for="">Monto:</label>
                <input type="number" class="text-center w-full" v-model.number="amountPaid" min="0"
                    @change="changeAmountPaid(order)">

                <div class="modal-action">
                    <button class="btn" type="button" @click="closePaymentModal(order)">Confirmar</button>
                </div>
            </div>
        </dialog>

        <div v-if="order.status === 'confirmed'" class="grid grid-cols-2 col-span-10 gap-1 text-xs">
            <button class="bg-gray-500" type="button" @click="handleDelivered(order)" :disabled="order.status !== 'confirmed'">ENTREGADO</button>
            <button type="button" @click="cancelOrder(order)">CANCELAR ORDEN</button>
        </div>

        <div v-if="order.status === 'delivered'" class="grid grid-cols-2 col-span-10 gap-1 text-xs">
            <button class="bg-gray-500" type="button" @click="confirmPayment(order)" :disabled="order.status !== 'delivered'">CONFIRMAR PAGO</button>
            <button type="button" @click="cancelOrder(order)">CANCELAR ORDEN</button>
        </div>

        <div v-if="order.status !== 'delivered' && order.status !== 'confirmed' " class="grid col-span-10" v-for="(product, productIndex) in order.products" :key="product.id + order.id">
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
        <div :class="order.status === 'pending' ? 'grid grid-cols-3' : 'grid grid-cols-2'"
            class="col-span-10 gap-1 text-xs" v-if="order.status !== 'delivered' && order.status !== 'confirmed'">
            <button class="bg-gray-500" type="button" @click="setOrderStatus(order, 'confirmed')">CONFIRMAR</button>
            <button v-if="order.status !== 'skipped'" type="button"
                @click="setOrderStatus(order, 'skipped')">POSPONER</button>
            <button v-if="order.status !== 'declined'" type="button"
                @click="setOrderStatus(order, 'declined')">CANCELAR</button>
        </div>
    </div>
</template>
<style scoped>
</style>
