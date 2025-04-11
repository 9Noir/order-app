<script setup>
import { toRaw } from 'vue';
import { saveObject } from '../services/databaseService';

const props = defineProps({
    order: {
        type: Object,
        required: true
    }
})

async function setOrder(orderToSave, status) {
    orderToSave.status = status;
    await saveObject(toRaw(orderToSave), 'orders')
}
</script>

<template>
    <div :class="props.class" class="confirmed-order-card">
        <div class="grid col-span-2 text-sm my-2">
            <div class="grid grid-cols-10 col-span-10 font-bold uppercase">
                <span class="col-span-2">{{ props.order.deliveryAddress }}</span>
                <span class="col-span-7">{{ props.order.clientName }}</span>
                <button class="col-span-1 font-medium text-xs !p-0 !rounded-full"
                    @click="setOrder(props.order, 'canceled')">X</button>
            </div>

            <div class="grid grid-cols-3 col-span-10 items-center text-center opacity-70"
                v-for="product in props.order.products" :key="product.id">
                <div class="grid grid-cols-10 col-span-2 text-right">
                    <span class="col-span-8">{{ product.name }}</span>
                    <span class="col-span-2 ">{{ product.quantity }}</span>
                </div>
                <span>{{ product.price }}</span>
            </div>
        </div>
    </div>
</template>
