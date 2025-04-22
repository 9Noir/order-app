<script setup>

const props = defineProps({
    order: {
        type: Object,
        required: true
    }
})


</script>

<template>
    <div :class="props.class" class="confirmed-order-card">
        <div class="grid col-span-2 text-sm my-2">
            <div class="grid grid-cols-10 col-span-10 font-bold uppercase mb-2">
                <span class="col-span-2">{{ props.order.deliveryAddress }}</span>
                <span class="col-span-4">{{ props.order.clientName }}</span>
                <span :class="props.order.status === 'paid' ? 'bg-green-500/50' : 'bg-red-500/50'"
                    class="font-semibold col-span-4 text-center border border-gray-300 text-xs px-2 rounded-full">{{
                        props.order.status === 'paid' ? 'COBRADO' : 'CANCELADO' }}</span>
            </div>

            <div class="grid grid-cols-10 col-span-10 items-center text-center opacity-70"
                v-for="product in props.order.products" :key="product.id">
                <span class="col-span-7 text-right">{{ product.name }}</span>
                <span class="col-span-1">{{ product.quantity }}</span>
                <span class="col-span-2 text-right">{{ product.price }}</span>
            </div>
            <span class="col-span-10 text-right font-bold text-lg">Total: $ {{ props.order.totalAmount }}</span>

        </div>
    </div>
</template>
