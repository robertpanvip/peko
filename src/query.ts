import { AnyObject } from "./interface";

export function getQuery<T extends AnyObject<string | string[]> = AnyObject<string | string[]>>(href: string = window.location.href) {
  const searchParams = new URL(href.replace("#", "")).searchParams;
  const entries = new URLSearchParams(searchParams).entries();
  
  const queryObject = {} as AnyObject<string | string[]>;
  
  for (const [key, value] of entries) {
    // 如果值包含逗号，则将其解析为数组，否则保留为字符串
    queryObject[key] = value.includes(",") ? value.split(",") : value;
  }

  return queryObject as T;
}

