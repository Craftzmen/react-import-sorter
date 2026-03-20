"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categories = void 0;
exports.categories = [
    {
        name: "framework",
        match: /^(react|react-dom|next(\/.*)?|gatsby|vue|nuxt(\/.*)?|svelte|solid-js|@angular\/.*|@remix-run\/.*)$/,
    },
    { name: "third-party", match: /^(?!@\/|\.{1,2}\/)[@a-zA-Z0-9_-]/ },
    { name: "absolute", match: /^@\// },
    { name: "relative", match: /^\.{1,2}\// },
];
