<script setup>
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import dbPromise from './services/db';

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

// Agregar o actualizar un cliente
const addClient = async () => {
  const db = await dbPromise;
  const tx = db.transaction('clients', 'readwrite');
  const store = tx.objectStore('clients');
  const client = {
    createdAt: createdAt?.value || new Date(),
    id: id?.value || uuidv4(),
    nombre: nombre.value,
    pasillo: pasillo.value.toUpperCase() || '#',
    local: local.value || 0,
  };

  if (isModeAdd.value) {
    await store.add(client);
    clients.value.push(client);
    sortClients(currentSortField.value);
  } else {
    await store.put(client);
    const index = clients.value.findIndex(c => c.id === client.id);
    if (index !== -1) {
      clients.value[index] = client;
      sortClients(currentSortField.value);
    }
  }
  await tx.complete;

  // Limpiar formulario
  nombre.value = '';
  pasillo.value = '';
  local.value = '';
  id.value = null;
  createdAt.value = null;
  isModeAdd.value = true;
};

// Cargar clientes inicialmente
const loadClients = async () => {
  const db = await dbPromise;
  const tx = db.transaction('clients', 'readonly');
  const store = tx.objectStore('clients');
  const clientsdb = await store.getAll();
  clients.value = clientsdb;
  sortClients('createdAt');
};

// Preparar formulario para edición
const editClient = (client) => {
  isModeAdd.value = false;
  nombre.value = client.nombre;
  pasillo.value = client.pasillo;
  local.value = client.local;
  id.value = client.id;
  createdAt.value = client.createdAt;
};

// Eliminar un cliente
const deleteClient = async (client) => {
  const db = await dbPromise;
  const tx = db.transaction('clients', 'readwrite');
  const store = tx.objectStore('clients');
  await store.delete(client.id);
  await tx.complete;
  clients.value = clients.value.filter(c => c.id !== client.id);
};

// Ordenar clientes
const sortClients = (field) => {
  if (field !== currentSortField.value) {
    sortDirection.value = 1;
    currentSortField.value = field;
  } else {
    sortDirection.value *= -1;
  }
  clients.value.sort((a, b) => {
    if (a[field] < b[field]) return -sortDirection.value;
    if (a[field] > b[field]) return sortDirection.value;
    return 0;
  });
};

// Cargar clientes al iniciar
loadClients();
</script>

<template>
  <h2 class="text-2xl font-bold text-center">
    {{ isModeAdd ? 'AGREGAR CLIENTE' : 'EDITAR CLIENTE' }}
  </h2>
  <form @submit.prevent="addClient" class="flex flex-col gap-2 p-2 border rounded">
    <input type="text" v-model="nombre" placeholder="Nombre" required class="border p-2 rounded" />
    <input type="text" v-model="pasillo" placeholder="Pasillo" class="border p-2 rounded" />
    <input type="number" v-model="local" placeholder="Local" class="border p-2 rounded" />
    <button type="submit"
      class="btn disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      :disabled="!nombre">
      {{ isModeAdd ? 'Agregar' : 'Guardar Cambios' }}
    </button>
    <button v-if="!isModeAdd" type="button" @click="isModeAdd = true"
      class="btn bg-gray-200 p-2 rounded hover:bg-gray-300">
      Cancelar
    </button>
  </form>

  <div class="container mx-auto mt-4">
    <h2 class="text-2xl font-bold text-center">CLIENTES ({{ clients.length }})</h2>
    <div class="flex justify-between items-center my-2">
      <h4 class="text-lg font-light">Ordenar por:</h4>
      <div class="flex text-sm gap-2">
        <button @click="sortClients('createdAt')" type="button">
          Fecha
        </button>
        <button @click="sortClients('nombre')" type="button">
          Nombre
        </button>
        <button @click="sortClients('pasillo')" type="button">
          Pasillo
        </button>
        <button @click="sortClients('local')" type="button">
          Local
        </button>
      </div>
    </div>
    <div class="flex flex-col gap-2 p-2 border rounded">
      <div class="grid gap-1 grid-cols-12 items-center" v-for="client in clients" :key="client.id">
        <span class="col-span-1">{{ client.pasillo }}</span>
        <span class="col-span-1">{{ client.local }}</span>
        <span class="col-span-8">{{ client.nombre }}</span>
        <button type="button" @click="editClient(client)"
          class="text-xs col-span-1 bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600">
          E
        </button>
        <button type="button" @click="deleteClient(client)"
          class="text-xs col-span-1 bg-red-500 text-white p-1 rounded hover:bg-red-600">
          X
        </button>
      </div>
    </div>
  </div>
</template>
