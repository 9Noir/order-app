<script setup>

</script>
<template>
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
                <button class="col-span-3" type="button" @click="removeProduct(draftOrder, productIndex)">🗑</button>
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
</template>
