// src/utils/stringUtils.ts

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas.
 * Útil para comparações de strings que devem ignorar diferenças de acentuação e caixa.
 * @param str A string a ser normalizada.
 * @returns A string normalizada.
 */
export const normalizeString = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

