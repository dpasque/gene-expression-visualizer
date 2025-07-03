import type { ApiClient } from "./api-client";

const API_HOST = import.meta.env.VITE_API_HOST;

export const httpServerApiClient: ApiClient = {
  getDevelopmentalMilestones: async () => {
    // @TODO:ENHANCE -- this would be a great place for a localstorage cache
    const response = await fetch(`${API_HOST}/api/v1/developmental-milestones`);

    if (!response.ok) {
      if (response.status < 500) {
        const errorData = await response.json();
        throw new Error(
          `An error occurred while loading developmental milestones: ${
            errorData.error || "Unknown error"
          }`
        );
      } else {
        throw new Error(
          "An unexpected server error occurred while loading developmental milestones."
        );
      }
    }

    return response.json();
  },

  getGeneExpressionData: async (symbol: string) => {
    const queryParams = new URLSearchParams({ symbol: symbol.trim() });
    const response = await fetch(
      `${API_HOST}/api/v1/gene-expression-data?${queryParams.toString()}`
    );

    if (!response.ok) {
      if (response.status < 500) {
        const errorData = await response.json();
        throw new Error(
          `An error occurred while loading gene expression data: ${
            errorData.error || "Unknown error"
          }`
        );
      } else {
        throw new Error(
          "An unexpected server error occurred while loading gene expression data."
        );
      }
    }
    return response.json();
  },

  getGeneDefinitions: async () => {
    // @TODO:ENHANCE -- this would be a great place for a localstorage cache
    const response = await fetch(`${API_HOST}/api/v1/gene-definitions`);

    if (!response.ok) {
      if (response.status < 500) {
        const errorData = await response.json();
        throw new Error(
          `An error occurred while loading gene definitions: ${
            errorData.error || "Unknown error"
          }`
        );
      } else {
        throw new Error(
          "An unexpected server error occurred while loading gene definitions."
        );
      }
    }

    return response.json();
  },
};
