// Type declarations for Supabase specific interfaces

// Storage client extensions
export interface StorageClient {
  from: (bucket: string) => StorageBucket;
}

export interface StorageBucket {
  upload: (
    path: string,
    data: Buffer | File | Blob,
    options?: {
      contentType?: string;
      upsert?: boolean;
    }
  ) => Promise<{
    data: unknown;
    error: Error | null;
  }>;
  getPublicUrl: (path: string) => {
    data: {
      publicUrl: string;
    };
  };
}
