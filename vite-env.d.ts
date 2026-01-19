
interface ImportMetaEnv {
    readonly VITE_CLOUDFLARE_R2_API: string;
    readonly VITE_CLOUDFLARE_R2_TOKEN: string;
    readonly VITE_CLOUDFLARE_ACCOUNT_ID: string;
    readonly VITE_CLOUDFLARE_R2_BUCKET: string;    

    // Add other env variables here
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}