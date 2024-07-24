import type {PointLike} from "./interface";
export default class Point {
    x: number;
    y: number;

    constructor(x: number, y: number);
    constructor(pointLike: PointLike);
    constructor(xOrPointLike: number | PointLike, y?: number) {
        if (typeof xOrPointLike === 'number') {
            this.x = xOrPointLike;
            this.y = y ?? 0;
        } else {
            this.x = xOrPointLike.x;
            this.y = xOrPointLike.y;
        }
    }

    // 移动点
    move(dx: number, dy: number): Point {
        this.x += dx;
        this.y += dy;
        return this;
    }

    // 加法操作
    add(other: PointLike): Point {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    // 减法操作
    subtract(other: PointLike): Point {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    // 计算两个点之间的距离
    distanceTo(other: PointLike): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 判断两个点是否相等
    equals(other: PointLike): boolean {
        return this.x === other.x && this.y === other.y;
    }

    // 克隆点
    clone(): Point {
        return new Point(this.x, this.y);
    }

    // 计算点到原点的距离
    distanceToOrigin(): number {
        return this.distanceTo(new Point(0, 0));
    }

    // 格式化输出点坐标
    toString(): string {
        return `(${this.x}, ${this.y})`;
    }

    // 静态方法：计算两个点之间的距离
    static distance(p1: PointLike, p2: PointLike): number {
        return new Point(p1).distanceTo(p2);
    }

    // 静态方法：创建一个点数组
    static createPoints(...coords: number[]): Point[] {
        if (coords.length % 2 !== 0) {
            throw new Error("Invalid coordinates");
        }
        const points: Point[] = [];
        for (let i = 0; i < coords.length; i += 2) {
            points.push(new Point(coords[i], coords[i + 1]));
        }
        return points;
    }
}