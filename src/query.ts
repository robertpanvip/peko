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

export function replaceQuery<T extends AnyObject = AnyObject>(
  values: T,
  href: string = window.location.href,
  filter: (val: T) => T = (val) => val
) {
  const query = getQuery(href);
  const mergedQuery = filter({ ...query, ...values });
  const searchParams = new URLSearchParams();

  // 遍历 mergedQuery 处理数组形式
  Object.entries(mergedQuery).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v)); // 处理数组，添加多个相同键
    } else if (value !== undefined && value !== null) {
      searchParams.set(key, value as string); // 普通值的处理
    }
  });

  const baseHref = href.replace(getSearchParams(href).toString(), "");
  let updatedHref = searchParams.toString() ? `${baseHref}?${searchParams.toString()}` : baseHref;

  if (updatedHref.endsWith("?")) {
    updatedHref = updatedHref.slice(0, -1);
  }

  if (href === window.location.href) {
    window.history.replaceState(window.history.state, "title", updatedHref);
  }

  return updatedHref;
}

export function removeQuery<T extends AnyObject<string> = AnyObject<string>>(
  key: string,
  href: string = window.location.href
) {
  return replaceQuery({ [key]: "" }, href, (val) => {
    delete val[key];
    return { ...val };
  });
}


