import { openDB } from 'idb';

async function dbPromise() {
    return await openDB('order-app-db', 1, {
        upgrade(db) {
            db.createObjectStore('clients', { keyPath: 'id' });
            db.createObjectStore('products', { keyPath: 'id' });            
            const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
            orderStore.createIndex('status', 'status');

            db.createObjectStore('draftOrders', { keyPath: 'id' });         
        },
        
        
        // versionchange(e){
        //     console.log(e);
        // },
        // blocking(e){
        //     console.log(e);
        // }
    });
}
export default dbPromise;