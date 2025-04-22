import dbPromise from './db'; // Your existing db connection setup
import { v4 as uuidv4 } from 'uuid';

export async function generateOrderNumber(prefix = 'ORD') {
    const { store, tx } = await getStore('appMetadata', 'readwrite');
    const secuenceData = await store.get('orderSequence');
    const today = new Date().toISOString().slice(0, 10);
    let nextNumber = 1

    if (secuenceData && secuenceData.lastDate === today) {
        nextNumber = secuenceData.lastNumber + 1;
    }

    await store.put({ id: 'orderSequence', lastDate: today, lastNumber: nextNumber });
    await tx.done;
    console.log(prefix + '-' + today.replace(/-/g, '') + '-' + String(nextNumber).padStart(4, '0'));
    return prefix + '-' + today.replace(/-/g, '') + '-' + String(nextNumber).padStart(4, '0');
}

async function normalizeObject(objectData, storeName) {
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
            status: newObjectData.status || 'confirmed'
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
    const objectToAdd = await normalizeObject(objectData, storeName);
    console.log(objectToAdd);
    await store.add(objectToAdd);
    await tx.done;
    return objectToAdd;
}

export async function addAllObjects(objectsData, storeName) {
    const { store, tx } = await getStore(storeName, 'readwrite');
    objectsData.forEach(async (object) => {
        await store.add(object);
    });
    await tx.done;
    return objectsData;
}

export async function getAll(storeName) {
    const { store } = await getStore(storeName);
    return await store.getAll();
};

export async function updateObject(objectData, storeName) {
    const { store, tx } = await getStore(storeName, 'readwrite');
    const objectToUpdate = await normalizeObject(objectData, storeName);
    await store.put(objectToUpdate);
    await tx.done;
    return objectToUpdate;
}

export async function deleteObject(objectId, storeName) {
    const { store, tx } = await getStore(storeName, 'readwrite');
    await store.delete(objectId);
    await tx.done;
}

export async function deleteAllObjects(storeName) {
    const { store, tx } = await getStore(storeName, 'readwrite');
    await store.clear();
    await tx.done;
}

export async function addDraftOrder(draftOrder) {
    const { store, tx } = await getStore('draftOrders', 'readwrite');
    await store.add(draftOrder);
    await tx.done;
    return draftOrder;
}

export async function updateDraftOrder(draftOrder) {
    const { store, tx } = await getStore('draftOrders', 'readwrite');
    await store.put(draftOrder);
    await tx.done;
    return draftOrder;
}


export default {
    getAll,
    addObject,
    updateObject,
    deleteObject,
    saveObject
};