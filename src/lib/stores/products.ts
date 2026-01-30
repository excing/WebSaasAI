import { writable, get } from 'svelte/store';
import type { ProductsResult } from '$lib/types/product';

const _products = writable<ProductsResult | null>(null);
const _loaded = writable(false);
const _loading = writable(false);

let inFlight: Promise<ProductsResult | null> | null = null;

export const productsData = { subscribe: _products.subscribe };
export const productsLoaded = { subscribe: _loaded.subscribe };
export const productsLoading = { subscribe: _loading.subscribe };

export function setProducts(data: ProductsResult) {
    _products.set(data);
    _loaded.set(true);
}

export function resetProducts() {
    _products.set(null);
    _loaded.set(false);
    _loading.set(false);
    inFlight = null;
}

export async function refreshProducts(): Promise<ProductsResult> {
    _loading.set(true);
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as ProductsResult;
        setProducts(data);
        return data;
    } catch (err) {
        console.error('Failed to load products:', err);
        const fallback: ProductsResult = {
            products: [],
            error: 'Failed to load products'
        };
        setProducts(fallback);
        return fallback;
    } finally {
        _loading.set(false);
    }
}

export async function ensureProductsLoaded(): Promise<ProductsResult | null> {
    if (get(_loaded)) return get(_products);
    if (inFlight) return inFlight;
    inFlight = refreshProducts().finally(() => {
        inFlight = null;
    });
    return inFlight;
}
