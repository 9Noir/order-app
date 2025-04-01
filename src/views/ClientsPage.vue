<script setup>
import { ref, onMounted } from 'vue'; // Importar onMounted
import { v4 as uuidv4 } from 'uuid';
import dbPromise from '../services/db'; // Asumiendo que db.js está en services

const isVibrateInNavigator = 'vibrate' in navigator;
// Variables reactivas
const id = ref(null);
const createdAt = ref(null);
const nombre = ref('');
const pasillo = ref('');
const local = ref('');
const clients = ref([]);
const isModeAdd = ref(true);
const currentSortField = ref('createdAt');
const sortDirection = ref(1);
const isLoading = ref(false); // Para estado de carga
const errorMessage = ref(''); // Para mensajes de error
const successMessage = ref(''); // Para mensajes de éxito

// Mostrar mensaje temporal
const showMessage = (msg, type = 'success', duration = 3000) => {
    if (type === 'success') successMessage.value = msg;
    else errorMessage.value = msg;
    setTimeout(() => {
        successMessage.value = '';
        errorMessage.value = '';
    }, duration);
};

// Agregar o actualizar un cliente
const addClient = async () => {
    errorMessage.value = ''; // Limpiar errores previos
    try {
        const db = await dbPromise(); // Call dbPromise as a function
        const tx = db.transaction('clients', 'readwrite');
        const store = tx.objectStore('clients');
        const client = {
            createdAt: createdAt?.value || new Date(),
            id: id?.value || uuidv4(),
            nombre: nombre.value.trim(), // Quitar espacios extra
            pasillo: pasillo.value.trim().toUpperCase() || '#',
            local: local.value || 0,
        };

        if (!client.nombre) {
            errorMessage.value = 'El nombre es obligatorio.';
            return;
        }

        if (isModeAdd.value) {
            await store.add(client);
            clients.value.push(client); // Añadir al array reactivo
            showMessage(`Cliente "${client.nombre}" agregado.`);
        } else {
            await store.put(client); // put actualiza o inserta
            const index = clients.value.findIndex(c => c.id === client.id);
            if (index !== -1) {
                clients.value[index] = client; // Actualizar en el array reactivo
            } else {
                // Si no se encontró (raro en modo edición), añadirlo
                clients.value.push(client);
            }
            showMessage(`Cliente "${client.nombre}" actualizado.`);
        }

        // Es importante esperar a que la transacción se complete
        await tx.complete;
        sortClients(currentSortField.value); // Reordenar después de añadir/editar

        // Limpiar formulario
        resetForm();

    } catch (error) {
        console.error('Error al guardar cliente:', error);
        errorMessage.value = `Error al guardar: ${error.message || 'Error desconocido'}`;
        // Opcional: Si falla la transacción, recargar desde DB para asegurar consistencia
        // loadClients();
    }

    isVibrateInNavigator && navigator.vibrate([50, 50, 50])
};

// Cargar clientes inicialmente
const loadClients = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    try {
        const db = await dbPromise(); // Call dbPromise as a function
        // No necesitas transacción explícita para getAll en modo readonly con idb
        const clientsdb = await db.getAll('clients');
        clients.value = clientsdb;
        sortClients(currentSortField.value || 'createdAt'); // Ordenar al cargar
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        errorMessage.value = `Error al cargar datos: ${error.message || 'Error desconocido'}`;
        clients.value = []; // Dejar lista vacía en caso de error
    } finally {
        isLoading.value = false;
    }
};

// Preparar formulario para edición
const editClient = (client) => {
    isModeAdd.value = false;
    nombre.value = client.nombre;
    pasillo.value = client.pasillo;
    local.value = client.local;
    id.value = client.id;
    createdAt.value = client.createdAt;
    successMessage.value = ''; // Limpiar mensajes
    errorMessage.value = '';
    // Opcional: Scroll al formulario
    // document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
};

// Resetear el formulario
const resetForm = () => {
    nombre.value = '';
    pasillo.value = '';
    local.value = '';
    id.value = null;
    createdAt.value = null;
    isModeAdd.value = true;
    // successMessage.value = ''; // No limpiar éxito aquí, se limpia con timeout
    errorMessage.value = '';
};


// Eliminar un cliente
const deleteClient = async (clientToDelete) => {
    // Confirmación antes de borrar
    if (!confirm(`¿Seguro que quieres eliminar a "${clientToDelete.nombre}"?`)) {
        return;
    }

    errorMessage.value = '';
    try {
        const db = await dbPromise(); // Call dbPromise as a function
        const tx = db.transaction('clients', 'readwrite');
        const store = tx.objectStore('clients');
        await store.delete(clientToDelete.id);
        await tx.complete; // Esperar a que la transacción termine

        // Actualizar UI quitando el cliente
        clients.value = clients.value.filter(c => c.id !== clientToDelete.id);
        showMessage(`Cliente "${clientToDelete.nombre}" eliminado.`);

        // Si estabas editando el cliente que borraste, resetea el form
        if (!isModeAdd.value && id.value === clientToDelete.id) {
            resetForm();
        }

    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        errorMessage.value = `Error al eliminar: ${error.message || 'Error desconocido'}`;
    }
};

// Ordenar clientes
const sortClients = (field) => {
    // Si no hay clientes, no hacer nada
    if (!clients.value || clients.value.length === 0) return;

    if (field !== currentSortField.value) {
        sortDirection.value = 1; // Ascendente por defecto al cambiar campo
        currentSortField.value = field;
    } else {
        sortDirection.value *= -1; // Invertir dirección si es el mismo campo
    }

    // Copia para no mutar y reasignar para reactividad (aunque sort muta in-place)
    clients.value.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        // Manejo específico para tipos (ej: case-insensitive para strings)
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        // Manejo de '#' o valores nulos/undefined para pasillo/local si es necesario
        if (field === 'pasillo') {
            if (valA === '#') valA = ''; // O un valor muy bajo/alto
            if (valB === '#') valB = '';
        }
        if (field === 'local') {
            valA = Number(valA) || 0; // Convertir a número, default 0
            valB = Number(valB) || 0;
        }

        if (valA < valB) return -sortDirection.value;
        if (valA > valB) return sortDirection.value;
        return 0; // Son iguales según este campo
    });
};

// Cargar clientes al montar el componente
onMounted(() => {
    loadClients();
});
</script>

<template>
    <!-- Mensajes de Estado -->
    <div v-if="successMessage" class="my-2 p-2 border border-green-400 text-green-700 rounded">
        {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="my-2 p-2 border border-red-400 text-red-700 rounded">
        {{ errorMessage }}
    </div>

    <h2>
        {{ isModeAdd ? 'AGREGAR CLIENTE' : `EDITAR CLIENTE` }}
    </h2>
    <form @submit.prevent="addClient">
        <input type="text" v-model="nombre" placeholder="Nombre *" required />
        <input type="text" v-model="pasillo" placeholder="Pasillo" />
        <input type="number" v-model="local" placeholder="Local" />
        <div class="grid gap-2 mt-2">
            <button type="submit" :disabled="!nombre.trim() || isLoading">
                <span v-if="!isLoading">{{ isModeAdd ? 'Agregar' : 'Guardar Cambios' }}</span>
                <span v-else>Guardando...</span>
            </button>
            <button class="bg-gray-800" v-if="!isModeAdd" type="button" @click="resetForm" :disabled="isLoading">
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

        <div v-if="!isLoading && clients.length > 0">
            <div class="flex justify-between items-center my-2">
                <h4 class="text-sm font-semibold opacity-50 truncate break-words">Ordenar:</h4>
                <div class="flex text-xs gap-2">
                    <button @click="sortClients('createdAt')" type="button"
                        :class="{ 'font-extrabold': currentSortField === 'createdAt' }">
                        Fecha {{ currentSortField === 'createdAt' ? (sortDirection === 1 ? '▲' : '▼') : '' }}
                    </button>
                    <button @click="sortClients('nombre')" type="button"
                        :class="{ 'font-extrabold': currentSortField === 'nombre' }">
                        Nombre {{ currentSortField === 'nombre' ? (sortDirection === 1 ? '▲' : '▼') : '' }}
                    </button>
                    <button @click="sortClients('pasillo')" type="button"
                        :class="{ 'fontex': currentSortField === 'pasillo' }">
                        Pasillo {{ currentSortField === 'pasillo' ? (sortDirection === 1 ? '▲' : '▼') : '' }}
                    </button>
                    <button @click="sortClients('local')" type="button"
                        :class="{ 'fontex': currentSortField === 'local' }">
                        Local {{ currentSortField === 'local' ? (sortDirection === 1 ? '▲' : '▼') : '' }}
                    </button>
                </div>
            </div>

            <section>
                <div>
                    <span class="col-span-1">Pas.</span>
                    <span class="col-span-1">Loc.</span>
                    <span class="col-span-6">Nombre</span>
                    <span class="col-span-2 text-center">Acciones</span>
                </div>
                <!-- Lista de Clientes -->
                <div v-for="client in clients" :key="client.id">
                    <span class="col-span-1">{{ client.pasillo }}</span>
                    <span class="col-span-1">{{ client.local }}</span>
                    <span class="col-span-6 break-words">{{ client.nombre }}</span>
                    <button type="button" @click="editClient(client)" aria-label="Editar cliente" class=""
                        :disabled="isLoading">
                        E
                    </button>
                    <button type="button" @click="deleteClient(client)" aria-label="Eliminar cliente" class=""
                        :disabled="isLoading">
                        X
                    </button>
                </div>
            </section>

        </div>
    </div>
</template>