// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import {defineConfig, loadEnv} from 'vite'
import {VitePWA} from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'
import {resolve} from "path";

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');
    console.log('Vite config mode', mode);
    console.log('Vite config loaded with env:', JSON.stringify(env));

    return {
        base: './',
        test: {
            globals: true,
            environment: 'happy-dom',
            reporters: ['default', 'junit'],
            outputFile: {
                junit: './reports/junit-report.xml'
            },
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
            },
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
                '@test': resolve(__dirname, 'test')
            }
        },
        plugins: [
            vue({
                template: {
                    compilerOptions: {
                        isCustomElement: (tag) => tag.startsWith('ui5-'),
                    },
                },
            }),
            VitePWA({
                registerType: 'autoUpdate',
                useCredentials: true,
                includeAssets: ['*.png'],
                manifest: {
                    name: 'E-Mobility Driver',
                    short_name: 'EV Driver',
                    description: 'Driver Application for E-Mobility',
                    theme_color: '#ffffff',
                    orientation: "portrait",
                    icons: [
                        {
                            src: 'favicon-196.png',
                            sizes: '196x196',
                            type: 'image/png'
                        },
                        {
                            src: 'apple-icon-180.png',
                            sizes: '180x180',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: 'manifest-icon-192.maskable.png',
                            sizes: '192x192',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: 'manifest-icon-192.maskable.png',
                            sizes: '192x192',
                            type: 'image/png',
                            purpose: 'maskable'
                        },
                        {
                            src: 'manifest-icon-512.maskable.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: 'manifest-icon-512.maskable.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable'
                        }
                    ],
                    screenshots: [
                        {
                            src: './screenshots/wide-home.png',
                            sizes: '1918x966',
                            type: 'image/png',
                            form_factor: 'wide',
                            label: 'Wide Home Screen'
                        },
                        {
                            src: './screenshots/wide-stations.png',
                            sizes: '1918x966',
                            type: 'image/png',
                            form_factor: 'wide',
                            label: 'Wide Stations Screen'
                        },
                        {
                            src: './screenshots/mobile-home.png',
                            sizes: '992X1884',
                            type: 'image/png',
                            label: 'Mobile Home Screen'
                        },
                        {
                            src: './screenshots/mobile-stations.png',
                            sizes: '992X1884',
                            type: 'image/png',
                            label: 'Mobile Stations Screen'
                        }
                    ]
                },
                devOptions: {
                    enabled: true
                },
                workbox: {
                    maximumFileSizeToCacheInBytes: 5000000,
                    skipWaiting: true,
                    clientsClaim: true,
                    cleanupOutdatedCaches: true,
                    globPatterns: ['**/*.{css,ico,png,svg,js}'],
                    runtimeCaching: [
                        {
                            urlPattern: ({ request }) => request.destination === '' || request.destination === 'document',
                            handler: 'NetworkOnly',
                        },
                        {
                            urlPattern: ({ request }) => request.destination === 'style' || request.destination === 'script' ||
                                request.destination === 'worker' || request.destination === 'manifest',
                            handler: 'StaleWhileRevalidate',
                            options: {
                                cacheName: 'assets-resources',
                                expiration: {
                                    maxEntries: 50,
                                    maxAgeSeconds: 10 * 24 * 60 * 60, // 10 days
                                },
                            },
                        },
                        {
                            urlPattern: ({ request }) => request.destination === 'image' || request.destination === 'font',
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'images',
                                expiration: {
                                    maxEntries: 50,
                                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                                },
                            },
                        }
                    ],
                    navigateFallback: null,
                    navigateFallbackDenylist: [
                        /user-api/,
                        /odata/,
                    ]
                }
            })
        ],
        build: {
            sourcemap: true,
            minify: false
        }
    }
});
