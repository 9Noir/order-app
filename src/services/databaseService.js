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
            status: newObjectData.status || 'pending', // Default to 'pending'
            paymentMethod: newObjectData.paymentMethod || null,
            amountPaid: newObjectData.amountPaid || null,
            

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
    
    if(storeName === 'orders'){
        const { store: orderStore, tx: orderTx } = await getStore(storeName, 'readwrite');
        const today = new Date().toISOString().slice(0, 10);
        const todayStart = new Date(today).getTime();
        const todayEnd = todayStart + (24 * 60 * 60 * 1000);

        const range = IDBKeyRange.bound(todayStart, todayEnd, false, true);
        const existingOrdersToday = await orderStore.getAll();
        const orderNumberToday = existingOrdersToday.length + 1;
        const formattedOrderNumber = `ORD-${today}-${orderNumberToday.toString().padStart(6, '0')}`;
        objectData.orderNumber = formattedOrderNumber;
        const objectToAdd = normalizeObject(objectData, storeName);
        await orderStore.add(objectToAdd);
        await orderTx.done;
        return objectToAdd;
    } else {

    const { store, tx } = await getStore(storeName, 'readwrite');
    const objectToAdd = normalizeObject(objectData, storeName);
    await store.add(objectToAdd);
    await tx.done;
    return objectToAdd;
    }

    
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

export async function updateOrderStatus(orderId, status, paymentMethod = null, amountPaid = null) {
    const db = await dbPromise();
    const tx = db.transaction(['orders', 'products', 'clients'], 'readwrite');
    const orderStore = tx.objectStore('orders');
    const productStore = tx.objectStore('products');
    const clientStore = tx.objectStore('clients');
    const order = await orderStore.get(orderId);

    if (!order) throw new Error(`Order with ID ${orderId} not found`);

    order.status = status;
    if (status === 'delivered') {
        order.paymentMethod = paymentMethod;
        order.amountPaid = amountPaid;
    } else if (status === 'paid') {
        
        order.paymentMethod = paymentMethod;
        const client = await clientStore.get(order.clientId);        
        if (!client) throw new Error(`Client with ID ${order.clientId} not found`);
        client.totalOrders = (client.totalOrders || 0) + 1
        client.totalSpent = (client.totalSpent || 0) + order.amountPaid
        await clientStore.put(client)
        
        for (const productInfo of order.products) {
            const product = await productStore.get(productInfo.id);
            if (!product) throw new Error(`Product with ID ${productInfo.id} not found.`);
            product.orderCount = (product.orderCount || 0) + productInfo.quantity;
            await productStore.put(product);
        }

        if (!order.paymentMethod) {
            order.paymentMethod = paymentMethod
        }        
    }    
    await store.put(order);
    await tx.done;
    return order;
}

export async function cancelOrder(orderId) {
    return await updateOrderStatus(orderId, 'cancelled');
}

export async function generateDailyDraftOrders(clients, products) {
    const today = new Date().toISOString().slice(0, 10);
    const db = await dbPromise();
    const { store, tx } = await getStore('draftOrders', 'readwrite');    
    const existingDrafts = await store.getAll();

    if (existingDrafts.length === 0) {
        console.log('No existing drafts found. Creating new ones.');
    } else {
        const firstDraft = existingDrafts[0];
        const draftCreationDate = new Date(firstDraft.createdAt).toISOString().slice(0, 10);
        if (draftCreationDate === today) {
            console.log('Drafts already exist for today. Returning existing drafts.');
            return existingDrafts;
        } else {
            console.log('Existing drafts are outdated. Deleting old drafts and creating new ones.');
            for (const draft of existingDrafts) {
                await store.delete(draft.id);
                const { store: orderStore, tx: orderTx } = await getStore('orders', 'readwrite');
                await orderStore.delete(draft.id);
                await orderTx.done;

            }
        }
    }
    const draftOrders = [];
    for (const client of clients) {
        for (const product of products) {
            const newDraftOrder = {
                id: uuidv4(),
                clientId: client.id,
                clientName: client.name,
                deliveryAddress: client.address,
                products: [{
                    id: product.id,
                    name: product.name,
                    quantity: 1,
                    price: product.price
                }],
                status: 'pending',
                createdAt: new Date()
            }
            const { store: orderStore, tx: orderTx } = await getStore('orders', 'readwrite');
            await orderStore.add(newDraftOrder);
            await orderTx.done;
            await store.add(newDraftOrder);           
            draftOrders.push(newDraftOrder);
        }
    }
    await tx.done;
    return draftOrders;
}
export default {
    getAll,
    addObject,
    updateObject,
    deleteObject,
    saveObject,
    updateOrderStatus,
    cancelOrder,
    generateDailyDraftOrders
};