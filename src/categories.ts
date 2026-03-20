export type ImportCategory = {
  name: "framework" | "third-party" | "absolute" | "relative";
  match: RegExp;
};

export const categories: ImportCategory[] = [
  {
    name: "framework",
    match: /^(react|react-dom|next(\/.*)?|gatsby|vue|nuxt(\/.*)?|svelte|solid-js|@angular\/.*|@remix-run\/.*)$/,
  },
  { name: "third-party", match: /^(?!@\/|\.{1,2}\/)[@a-zA-Z0-9_-]/ },
  { name: "absolute", match: /^@\// },
  { name: "relative", match: /^\.{1,2}\// },
];