const timerMap = new Map<number, { id?: number }>();
const now = function () {
    return performance ? performance.now() : + Date.now();
};

const delay = 8;

export default class Timer {
    static setTimeout(callback: () => void, timeout = 0) {
        const start = now();
        const raf: { id?: number } = {};
        timerMap.set(start, raf);
        const loop = () => {
            raf.id = requestAnimationFrame(() => {
                if (!timerMap.get(start)) {
                    return;
                }
                const elapsedTime = now() - start;
                if (elapsedTime + delay >= timeout) {
                    callback();
                    timerMap.delete(start);
                } else {
                    loop();
                }
            });
        };
        loop();
        return start;
    }
    static clearTimeout(timeoutId: number) {
        const raf = timerMap.get(timeoutId);
        if (raf && raf.id) {
            cancelAnimationFrame(raf.id);
        }
        timerMap.delete(timeoutId);
    }

    static setInterval(callback: () => void, ms = 0) {
        const loop = () => {
            return Timer.setTimeout(() => {
                callback();
                loop();
            }, ms);
        };
        return loop();
    }

    static clearInterval(timeoutId: number) {
        Timer.clearTimeout(timeoutId);
    }
}