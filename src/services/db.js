import { openDB } from 'idb';

async function dbPromise() {
    return await openDB('order-app-db', 1, {
        upgrade(db) {
            db.createObjectStore('clients', { keyPath: 'id' });
            db.createObjectStore('products', { keyPath: 'id' });
            db.createObjectStore('orders', { keyPath: 'id' });
            db.createObjectStore('draftOrders', { keyPath: 'clientId' });
        },
    });
}
export default dbPromise;