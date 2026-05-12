export type KeyStoreState = {
  file: File | null;
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
};

export type EnvironmentVariable = {
  id: string;
  key: string;
  value: string;
};
