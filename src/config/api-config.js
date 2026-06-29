// src/config/api-config.js
// URL base da API — altere aqui para trocar de ambiente sem tocar em outros arquivos

const API_BASE_URL =
  typeof window !== 'undefined' && window.API_BASE_URL
    ? window.API_BASE_URL          // injetado por um servidor/build (opcional)
    : 'http://localhost:3000';     // padrão local

export const API_URL = API_BASE_URL;
