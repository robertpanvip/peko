/**精简URL中的 多个/// 为一个/ */
export function normalizeSlashes(url: string) {
  return url.replace(/(?<!:)\/{2,}/g, "/");
} 
