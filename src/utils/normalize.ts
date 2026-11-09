/**
 * Normaliza o texto removendo acentos, convertendo para minúsculas e removendo espaços extras.
 * Usado para os campos `nome_normalizado` em `marcas_catalogo` e `produtos_catalogo`.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
