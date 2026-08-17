export type KeyStoreState = {
  file: File | null;
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
};

export type EnvironmentVariable = {
  id: string;
  apiId?: number;
  key: string;
  value: string;
  type?: string;
  path?: string;
  isBase64?: boolean;
  projectId?: number;
};
