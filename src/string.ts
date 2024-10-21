export function toKebabCase(str: string): string {
  return str
    // 在大写字母前添加一个空格
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // 将所有大写字母转为小写字母
    .toLowerCase();
}

export function fromKebabCase(input: string): string {
  return input.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}
