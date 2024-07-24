export default class Defer<T> {
    promise: Promise<T>;

    resolve: (value: (PromiseLike<T> | T)) => void;

    reject: (reason?: unknown) => void;


    constructor() {
        let resolve: (value: (PromiseLike<T> | T)) => void;
        let reject: (reason?: unknown) => void;
        this.promise = new Promise<T>((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });
        this.resolve = resolve!;
        this.reject = reject!;
    }
}