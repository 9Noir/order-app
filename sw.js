if(!self.define){let e,i={};const n=(n,r)=>(n=new URL(n+".js",r).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(r,o)=>{const s=e||("document"in self?document.currentScript.src:"")||location.href;if(i[s])return;let c={};const a=e=>n(e,s),d={module:{uri:s},exports:c,require:a};i[s]=Promise.all(r.map((e=>d[e]||a(e)))).then((e=>(o(...e),c)))}}define(["./workbox-5ffe50d4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-CQ1hBUS-.js",revision:null},{url:"assets/index-TLuFeDer.css",revision:null},{url:"img/android-chrome-192x192.png",revision:"af884a4b42f562c7b01e19a7dcb60baa"},{url:"img/android-chrome-512x512.png",revision:"600e0a355247a20c2fc31384b4d71c83"},{url:"img/apple-touch-icon.png",revision:"920a1d077df0f9b4c8504dec65795795"},{url:"img/favicon-16x16.png",revision:"4721b4000d66ad7ef0658647b89d4c8b"},{url:"img/favicon-32x32.png",revision:"fb3fa9e600a4cc6cb5ca1c24648aad58"},{url:"img/favicon.ico",revision:"b65718062eab1efa05c17d0a7b4fa903"},{url:"index.html",revision:"3c878981081a0604fa34033c0404d042"},{url:"manifest.json",revision:"5fbabd0a4eab3dafbc42c3973899e442"},{url:"registerSW.js",revision:"7ba79371873fa54771a64882a3f32f6c"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
