import { openDB } from 'idb';

const dbPromise = await openDB('order-app-db', 1, {
    upgrade(db) {
        db.createObjectStore('clients', { keyPath: 'id' });
        db.createObjectStore('products', { keyPath: 'id' });
        db.createObjectStore('orders', { keyPath: 'id' });
    },
});

export default dbPromise;