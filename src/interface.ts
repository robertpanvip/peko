export type AnyObject<V = any> = Record<PropertyKey, V>;
export interface PointLike {
    x: number;
    y: number;
}
export type ProgressHandler =(progress: number, e: ProgressEvent) => void