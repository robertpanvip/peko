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

/**将字符串的首字母大写。*/
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function shortUUID() {
    const timestamp = Date.now().toString(36); // 当前时间戳转为 base36
    const random = Math.random().toString(36).substring(2, 8); // 生成随机字符串
    return timestamp + random; // 合并两者
}


