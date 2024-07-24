//获取url查询参数
import {AnyObject} from "./interface";

export function getQuery<T extends AnyObject<string> = AnyObject<string>>(href: string = window.location.href) {
  const searchParams = new URL(href.replace("#", "")).searchParams;
  const entries = new URLSearchParams(searchParams).entries();
  return Object.fromEntries(entries) as T;
}
