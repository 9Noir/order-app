import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import ClientsPage from '../views/ClientsPage.vue';
import ProductsPage from '../views/ProductsPage.vue';
import OrdersPage from '../views/OrdersPage.vue';

const routes = [
    { path: '/clients', component: ClientsPage, name: 'clients', meta: { layout: DefaultLayout } },
    { path: '/products', component: ProductsPage, name: 'products', meta: { layout: DefaultLayout } },
    { path: '/orders', component: OrdersPage, name: 'orders', meta: { layout: DefaultLayout } },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;