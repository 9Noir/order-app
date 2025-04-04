import dbPromise from './db'; // Your existing db connection setup
import { v4 as uuidv4 } from 'uuid';


function normalizeObject(objectData, storeName) {
    const newObjectData = { ...objectData, id: objectData.id || uuidv4(), createdAt: objectData.createdAt || new Date(), updatedAt: new Date() };

    if (storeName === 'clients') {
        return newObjectData;
    }

    if (storeName === 'products') {
        return {
            ...newObjectData,
            name: newObjectData.name.trim(),
            price: newObjectData.price || 0,
        };
    }

    if (storeName === 'orders') {
        return {
            ...newObjectData,
            status: newObjectData.status || 'confirmed',
        }
    }
}


async function getStore(storeName, mode = 'readonly') {
    const db = await dbPromise();
    const tx = await db.transaction(storeName, mode);
    return { store: tx.objectStore(storeName), tx }
}

export async function saveObject(objectData, storeName) {
    if (objectData.id) {
        return await updateObject(objectData, storeName);
    } else {
        return await addObject(objectData, storeName);
    }
}

export async function addObject(objectData, storeName) {
    const { store, tx } = await getStore(storeName, 'readwrite');
    const objectToAdd = normalizeObject(objectData, storeName);
    await store.add(objectToAdd);
    await tx.done;
    return objectToAdd;
}

export async function getAll(storeName) {
    const { store } = await getStore(storeName);
    return await store.getAll();
};

export async function updateObject(objectData, storeName) {
    const { store, tx } = await getStore(storeName, 'readwrite');
    const objectToUpdate = normalizeObject(objectData, storeName);
    await store.put(objectToUpdate);
    await tx.done;
    return objectToUpdate;
}

export async function deleteObject(objectId, storeName) {
    const { store, tx } = await getStore(storeName, 'readwrite');
    await store.delete(objectId);
    await tx.done;
}

export default {
    getAll,
    addObject,
    updateObject,
    deleteObject,
    saveObject
};