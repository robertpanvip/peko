import Deferred from "@/util/Deferred";

export type Config = {
  onOpen: (ev: Event) => void;
  onMessage: (data: ArrayBuffer | string) => void;
  onError: (ev: Event) => void;
  onClose: (ev: CloseEvent) => void;
};

class Socket {
  private readonly url: string;

  private readonly config: Partial<Config>;

  socket!: WebSocket;

  defer: Deferred<void> = new Deferred();

  private timer: NodeJS.Timeout | undefined;

  private try: number = Date.now();

  private tryTimer: NodeJS.Timeout | undefined;

  private disposed: boolean = false;

  constructor(url: string, config: Partial<Config> = {}) {
    this.defer = new Deferred<void>();
    this.config = config;
    this.url = url;
    this.initSocket();
  }

  initSocket = () => {
    const socket = new WebSocket(this.url);
    socket.binaryType = "arraybuffer";
    this.socket = socket;
    socket.addEventListener("open", this.onOpen);

    socket.addEventListener("message", this.onMessage);

    socket.addEventListener("error", this.onError);

    socket.addEventListener("close", this.onClose);
  };

  get readyState() {
    return this.socket.readyState;
  }

  checkOpenSocket = (): boolean => {
    switch (this.readyState) {
      case WebSocket.OPEN:
        return true;
      case WebSocket.CONNECTING:
        throw new Error("cannot send msg before socket was open");
      case WebSocket.CLOSING:
        console.warn("cannot send msg socket is closing");
        return false;
      case WebSocket.CLOSED:
        throw new Error("cannot send msg socket is closed");
      default:
        throw new Error("Unexpected socket state");
    }
  };

  //心跳连接 防止连接断掉
  private ping() {
    this.timer = setTimeout(() => {
      this.sendData({ type: "PING", data: "" });
      this.ping();
    }, 1000 * 30);
  }

  /**连接成功*/
  private onOpen = (ev: Event) => {
    this.defer.resolve();
    this.ping();
    this.config.onOpen?.(ev);
  };

  /**接受消息*/
  private onMessage = (ev: MessageEvent<ArrayBuffer | string>) => {
    const data = ev.data;
    this.config.onMessage?.(data);
  };

  /**出错*/
  private onError = (ev: Event) => {
    console.log('onerror')
    this.close();
    this.config.onError?.(ev);
  };

  /**关闭*/
  private onClose = (ev: CloseEvent) => {
    this.close();
    this.config.onClose?.(ev);
    if (!this.disposed) {
      //关闭后尝试重新连接
      if (Date.now() - this.try < 1000) {
        this.tryTimer = setTimeout(this.initSocket, 3000);
      } else {
        this.initSocket();
      }
      this.try = Date.now();
    }
  };

  private close() {
    const socket = this.socket;
    socket.removeEventListener("open", this.onOpen);
    socket.removeEventListener("message", this.onMessage);

    socket.removeEventListener("error", this.onError);

    socket.removeEventListener("close", this.onClose);
    this.timer && clearTimeout(this.timer);
    this.socket.close();
    this.defer.reject();
  }

  dispose() {
    this.close();
    this.disposed = true;
    this.tryTimer && clearTimeout(this.tryTimer);
  }

  sendData(data: object) {
    this.defer.promise.then(() => {
      this.socket.send(JSON.stringify(data));
    });
  }

  send(data: string) {
    try {
      if (!this.checkOpenSocket()) {
        return;
      }
      this.sendData({ type: "CLIENT", data });
    } catch (e) {
      console.error(e);
    }
  }
}

export default Socket;
