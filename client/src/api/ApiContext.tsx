import { createContext, useContext } from "react";
import type { ApiClient } from "./api-client";

export const ApiContext = createContext<ApiClient | null>(null);
export const ApiProvider = ApiContext.Provider;
export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error(
      "Api client not found in ApiContext. This call must be wrapped in an ApiProvider with a valid api client."
    );
  }
  return context;
};
