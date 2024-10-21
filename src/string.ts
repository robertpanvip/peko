export function toKebabCase(str: string): string {
  return str
    // 在大写字母前添加一个空格
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // 将所有大写字母转为小写字母
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:[_-\s]+(.)|^(.))/g, (match, group1, group2) => {
      const firstChar = group1 || group2;
      return firstChar ? firstChar.toUpperCase() : '';
    })
    .replace(/^./, match => match.toLowerCase());
}


export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

