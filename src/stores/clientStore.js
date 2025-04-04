import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { getAll, saveObject, deleteObject } from '../services/databaseService'; // Abstracted DB logic (See point 2)

export const useClientStore = defineStore('clients', () => {
    const clients = reactive([]);
    const currentClient = ref(null);
    const sortBy = reactive({ field: 'updatedAt', direction: 1 });
    const isLoading = ref(false);
    const error = ref(null);

    const sortedClients = computed(() => {
        return [...clients]?.sort((a, b) => {
            const valA = a[sortField.value] ?? '';
            const valB = b[sortField.value] ?? '';

            if (sortField.value === 'address' || sortField.value === 'name') {
                return sortDirection.value * String(valA).localeCompare(String(valB));
            }
            else {
                return sortDirection.value * (Number(valA) - Number(valB));
            }
        });
    });

    async function fetchClients() {
        isLoading.value = true;
        error.value = null;
        try {
            clients.value = await databaseService.getAllClients();
            // Maybe sort here or provide a sorted getter
        } catch (err) {
            console.error("Error fetching clients:", err);
            error.value = 'Failed to load clients.';
            clients.value = []; // Ensure it's empty on error
        } finally {
            isLoading.value = false;
        }
    }

    async function addClient(clientData) {
        // isLoading, error handling...
        try {
            const newClient = await databaseService.addClient(clientData);
            clients.value.push(newClient);
            return newClient; // Return result for potential feedback
        } catch (err) { //... }
        }

        async function updateClient(clientData) {
            // isLoading, error handling...
            try {
                const updatedClient = await databaseService.updateClient(clientData);
                const index = clients.value.findIndex(c => c.id === updatedClient.id);
                if (index !== -1) {
                    clients.value[index] = updatedClient;
                }
                return updatedClient;
            } catch (err) { //... }
            }

            async function deleteClient(clientId) {
                // isLoading, error handling...
                try {
                    await databaseService.deleteClient(clientId);
                    clients.value = clients.value.filter(c => c.id !== clientId);
                } catch (err) { //... }
                }

                // Add computed properties (getters) if needed, e.g., for sorting

                return { clients, isLoading, error, fetchClients, addClient, updateClient, deleteClient };
            };
        }
    }
})

