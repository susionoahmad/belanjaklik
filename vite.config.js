var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [
            vue(),
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'maskable-icon-512.png'],
                manifest: {
                    name: 'Personal Shopping Assistant - BelanjaKlik',
                    short_name: 'BelanjaKlik',
                    description: 'Asisten Belanja Pribadi Serba Ada - Alfamind Store',
                    theme_color: '#e11d48',
                    background_color: '#ffffff',
                    display: 'standalone',
                    orientation: 'portrait',
                    scope: '/',
                    start_url: '/',
                    categories: ['shopping', 'lifestyle', 'business'],
                    icons: [
                        {
                            src: '/icon-192.png',
                            sizes: '192x192',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: '/icon-512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: '/maskable-icon-512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable'
                        },
                        {
                            src: '/apple-touch-icon.png',
                            sizes: '180x180',
                            type: 'image/png'
                        }
                    ]
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'unsplash-images',
                                expiration: {
                                    maxEntries: 60,
                                    maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        },
                        {
                            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                            handler: 'NetworkFirst',
                            options: {
                                cacheName: 'supabase-api-cache',
                                expiration: {
                                    maxEntries: 100,
                                    maxAgeSeconds: 24 * 60 * 60 // 24 hours
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        }
                    ]
                }
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src')
            }
        },
        ssgOptions: {
            script: 'async',
            formatting: 'minify',
            dirStyle: 'nested',
            onPageRendered: function (_route, renderedHTML, appCtx) {
                return __awaiter(this, void 0, void 0, function () {
                    var renderSSRHead, headPayload, html;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!appCtx.head) return [3 /*break*/, 3];
                                return [4 /*yield*/, import('@unhead/vue/server')];
                            case 1:
                                renderSSRHead = (_a.sent()).renderSSRHead;
                                return [4 /*yield*/, renderSSRHead(appCtx.head)];
                            case 2:
                                headPayload = _a.sent();
                                html = renderedHTML;
                                if (headPayload.headTags) {
                                    html = html.replace('</head>', "".concat(headPayload.headTags, "\n</head>"));
                                }
                                if (headPayload.htmlAttrs) {
                                    html = html.replace('<html', "<html ".concat(headPayload.htmlAttrs));
                                }
                                if (headPayload.bodyAttrs) {
                                    html = html.replace('<body', "<body ".concat(headPayload.bodyAttrs));
                                }
                                return [2 /*return*/, html];
                            case 3: return [2 /*return*/, renderedHTML];
                        }
                    });
                });
            },
            includedRoutes: function (paths, _routes) {
                return __awaiter(this, void 0, void 0, function () {
                    var staticPaths, url, key, createClient, supabase, _a, data, error, productRoutes, finalRoutes, e_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                staticPaths = paths.filter(function (p) { return !p.includes(':'); });
                                url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
                                key = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
                                console.log('[SSG] VITE_SUPABASE_URL:', url ? 'OK' : 'KOSONG');
                                console.log('[SSG] VITE_SUPABASE_ANON_KEY:', key ? 'OK' : 'KOSONG');
                                if (!url || !key || url.includes('placeholder')) {
                                    console.warn('[SSG] Supabase URL/Key belum diset atau bernilai placeholder. Hanya merender rute statis.');
                                    return [2 /*return*/, staticPaths];
                                }
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 4, , 5]);
                                return [4 /*yield*/, import('@supabase/supabase-js')];
                            case 2:
                                createClient = (_b.sent()).createClient;
                                supabase = createClient(url, key);
                                return [4 /*yield*/, supabase
                                        .from('affiliate_products')
                                        .select('slug')
                                        .eq('is_active', true)];
                            case 3:
                                _a = _b.sent(), data = _a.data, error = _a.error;
                                if (error) {
                                    console.error('[SSG] Supabase Error Detail:', JSON.stringify(error, null, 2));
                                    return [2 /*return*/, staticPaths];
                                }
                                if (!data) {
                                    console.warn('[SSG] Supabase query mengembalikan data null/undefined.');
                                    return [2 /*return*/, staticPaths];
                                }
                                productRoutes = data
                                    .filter(function (item) { return Boolean(item.slug); })
                                    .map(function (item) { return "/produk/".concat(item.slug); });
                                finalRoutes = __spreadArray(__spreadArray([], staticPaths, true), productRoutes, true);
                                console.log("[SSG] Hasil Query: Berhasil mengambil ".concat(data.length, " baris, ").concat(productRoutes.length, " slug unik valid untuk di-render statis."));
                                console.log('[SSG] Full Array includedRoutes:', JSON.stringify(finalRoutes, null, 2));
                                return [2 /*return*/, finalRoutes];
                            case 4:
                                e_1 = _b.sent();
                                console.error('[SSG] Exception Error saat mengambil rute SSG:', e_1);
                                return [2 /*return*/, staticPaths];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            }
        }
    };
});
