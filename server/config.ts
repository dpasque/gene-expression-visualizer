export const APP_CONFIG = {
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
  NODE_ENV: process.env.NODE_ENV || "development",
  API_PORT: process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000,
};
