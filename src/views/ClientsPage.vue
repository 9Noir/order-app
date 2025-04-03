<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { getAll, saveObject, deleteObject } from '../services/databaseService';

const isVibrateInNavigator = 'vibrate' in navigator;
const client = reactive({});
const clients = reactive([]);
const local = ref(0);
const pasillo = ref('');
const sortField = ref('createdAt');
const sortDirection = ref(1);
const sortClients = computed(() => {
    // Crear una copia del array antes de ordenar
    return [...clients]?.sort((a, b) => {
        // Obtener valores con fallback a valores vacíos
        const valA = a[sortField.value] ?? '';
        const valB = b[sortField.value] ?? '';

        // Ordenar strings
        if (sortField.value === 'address' || sortField.value === 'name') {
            return sortDirection.value * String(valA).localeCompare(String(valB));
        }
        // Ordenar números
        else {
            return sortDirection.value * (Number(valA) - Number(valB));
        }
    });
});
const isLoading = ref(false); // Para estado de carga
const errorMessage = ref(''); // Para mensajes de error
const successMessage = ref(''); // Para mensajes de éxito

const showMessage = (msg, type = 'success', duration = 3000) => {
    if (type === 'success') successMessage.value = msg;
    else errorMessage.value = msg;
    setTimeout(() => {
        successMessage.value = '';
        errorMessage.value = '';
    }, duration);
};

async function setClient(clientToSave = client, isActive = true) {
    clientToSave.address = client.address || `${pasillo.value}-${local.value}`.toUpperCase();
    clientToSave.isActive = isActive;
    const clientData = await saveObject(clientToSave, 'clients');

    if (clientToSave.id) {
        Object.assign(clients.find(c => c.id === clientData.id), clientData);
    } else {
        clients.push(clientData);
    }
    resetForm();
}

async function loadClients() {
    clients.length = 0;
    clients.push(...await getAll('clients'));
}

function editClient(clientData) {
    Object.assign(client, clientData);
    if (client.locationType === 'mall') addressToMall(client.address);
    successMessage.value = ''; // Limpiar mensajes
    errorMessage.value = '';
    document.querySelector('h2').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    client.id = null;
    client.name = '';
    client.phone = '';
    client.locationType = 'mall';
    client.address = '';
    client.createdAt = null;
    client.updatedAt = null;
    client.isActive = true;
    client.totalAmount = 0;
    client.totalOrders = 0;
    client.isActive = true;
    pasillo.value = '';
    local.value = '';
    // successMessage.value = ''; // No limpiar éxito aquí, se limpia con timeout
    errorMessage.value = '';
    document.querySelector('input[autofocus]')?.focus();
}

async function deleteClient(clientId) {
    deleteObject(clientId, 'clients');
    clients.splice(clients.findIndex(c => c.id === clientId), 1);
}

onMounted(async () => {
    await loadClients();
    resetForm();
});

function addressToMall(address) {
    [pasillo.value, local.value] = address.split('-');
} 
</script>

<template>
    <!-- Mensajes de Estado -->
    <!-- <div v-if="successMessage" class="my-2 p-2 border border-green-400 text-green-700 rounded">
        {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="my-2 p-2 border border-red-400 text-red-700 rounded">
        {{ errorMessage }}
    </div> -->

    <h2>
        {{ client.id ? 'EDITAR CLIENTE' : 'AGREGAR CLIENTE' }}
    </h2>
    <form v-if="'name' in client" @submit.prevent="setClient()">
        <input class="capitalize" type="text" v-model="client.name" autofocus placeholder="Nombre" required />
        <select @change="client.locationType = $event.target.value" v-model="client.locationType">
            <option value="mall">COOPERGUAY</option>
            <option value="home">CASA</option>
            <option value="other">OTRO</option>
        </select>
        <input v-if="client.locationType !== 'mall'" type="text" v-model="client.address" placeholder="Direccion" />
        <input v-if="client.locationType === 'mall'" type="text" v-model="pasillo" placeholder="Pasillo" />
        <input v-if="client.locationType === 'mall'" type="number" v-model="local" placeholder="Local" />
        <div class="grid gap-2 mt-2">
            <button type="submit" :disabled="!client.name.trim()">
                <span>{{ !client.id ? 'Agregar' : 'Guardar Cambios' }}</span>
            </button>
            <button v-if="client.id" class="bg-gray-800" type="button" @click="resetForm">
                Cancelar Edición
            </button>
        </div>
    </form>

    <div class="mt-8">
        <h2>LISTA DE CLIENTES ({{ clients.length }})</h2>

        <div v-if="isLoading" class="text-center">Cargando clientes...</div>

        <h3 v-if="!isLoading && clients.length === 0">
            No hay clientes registrados. ¡Agrega el primero!
        </h3>

        <div v-if="sortClients.length > 0">
            <div class="flex justify-end items-center my-2">
                <h4 class="text-sm font-semibold opacity-50 truncate break-words pr-2">Ordenar por:</h4>
                <select class="" v-model="sortField">
                    <option value="name">Nombre</option>
                    <option value="address">Ubicacion</option>
                    <option value="totalOrders">Ordenes</option>
                    <option value="totalAmount">Total</option>
                    <option value="locationType">Tipo de Ubi.</option>
                    <option value="createdAt">Fecha</option>
                </select>
                <button class="!flex-0 border-none" @click="sortDirection = -sortDirection">
                    {{ sortDirection === 1 ? '▲' : '▼' }}
                </button>
            </div>

            <section>
                <div>
                    <span class="col-span-2">Ubicacion</span>
                    <span class="col-span-6">Nombre</span>
                    <span class="col-span-2 text-center">Acciones</span>
                </div>
                <div v-for="client in sortClients" :key="client.id">
                    <span class="col-span-2">{{ client.address }}</span>
                    <span class="col-span-6 capitalize break-words">{{ client.name }}</span>
                    <button type="button" @click="editClient(client)" aria-label="Editar cliente" class=""
                        :disabled="isLoading">
                        E
                    </button>
                    <button type="button" @click="deleteClient(client.id)" aria-label="Eliminar cliente" class=""
                        :disabled="isLoading">
                        X
                    </button>
                </div>
            </section>

        </div>
    </div>
</template>