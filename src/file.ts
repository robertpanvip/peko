import {AnyObject, ProgressHandler} from "./interface.ts";

function _read<T>(
    blob: Blob,
    method: "readAsDataURL" | "readAsText" | "readAsArrayBuffer",
    encoding?: string,
    onProgress?: ProgressHandler
) {
    return new Promise<T>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = (event.loaded / event.total) * 100;
                onProgress(progress, event);
            }
        };
        reader[method](blob, encoding);
        reader.onload = () => {
            resolve(reader.result as T);
        }
        reader.onerror = () => {
            reject(reader.error)
        }
    })
}

export function readAsText(blob: Blob, encoding?: string, onProgress?: ProgressHandler) {
    return _read<string>(blob, "readAsText", encoding, onProgress)
}

export function readAsDataURL(blob: Blob, encoding?: string, onProgress?: ProgressHandler) {
    return _read<string>(blob, "readAsDataURL", encoding, onProgress)
}

export function readAsArrayBuffer(blob: Blob, encoding?: string, onProgress?: ProgressHandler) {
    return _read<ArrayBuffer>(blob, "readAsArrayBuffer", encoding, onProgress)
}

export function downloadByBlob(blob: Blob, filename: string) {
    // 创建临时的 <a> 元素
    const link = document.createElement('a');

    // 为 Blob 创建一个 URL
    const url = URL.createObjectURL(blob);

    // 设置下载文件的链接
    link.href = url;
    // 设置下载的文件名
    link.download = filename;

    // 将 <a> 元素添加到 DOM 并点击它以触发下载
    document.body.appendChild(link);
    link.click();

    // 点击之后移除 <a> 元素
    document.body.removeChild(link);

    // 释放 Blob URL
    URL.revokeObjectURL(url);
}


// 主函数
export const downloadBigFile = async (
    url: string,
    data: AnyObject = {},
    method: "get" | "post" = "get"
) => {
    const token = sessionStorage.getItem("token")
    const tokenName = sessionStorage.getItem("tokenName") || "x-token-id";
    data = {
        [tokenName]: token,
        ...data,
    };

// 通用 DOM 创建函数，创建指定标签并设置属性
    const createElement = <T extends keyof HTMLElementTagNameMap>(
        tagName: T,
        attributes: AnyObject<string>,
        children?: AnyObject<string>
    ) => {
        const element = document.createElement<T>(tagName);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        if (children) {
            // 组装表单数据
            Object.entries(children).forEach(([key, value]) => {
                if (value !== undefined) {
                    const input = createElement("input", {
                        type: "hidden",
                        name: key,
                        value: String(value),
                    });
                    element.appendChild(input);
                }
            });
        }
        return element;
    };
    const HIDDEN_STYLE = "display: none;"
    // 创建 iframe 的函数
    const createHiddenIframe = (id: string) => createElement("iframe", {
        id,
        name: id,
        style: HIDDEN_STYLE, // 隐藏 iframe
    });

// 创建 form 的函数
    const createHiddenForm = (
        id: string,
        url: string,
        method: string,
        data: AnyObject,
        target: string
    ) => createElement("form",
        {
            id,
            method,
            action: url,
            target,
            style: HIDDEN_STYLE, // 隐藏 form
        },
        data);

// 清理 DOM 元素
    const cleanUp = (iframe: HTMLIFrameElement, form: HTMLFormElement) => {
        iframe && document.body.removeChild(iframe);
        form && document.body.removeChild(form);
    };
    const iframeId = `down-file-post-iframe`;

    const formId = `down-file-post-form`;

    // 清理已有的 iframe 和 form
    [`#${iframeId}`, `#${formId}`].forEach(selector => {
        const elem = document.querySelector(selector);
        elem && document.body.removeChild(elem);
    });

    // 创建 iframe 和 form
    const iframe = createHiddenIframe(iframeId);
    const form = createHiddenForm(formId, url, method, data, iframe.name);

    // 处理 iframe 加载与错误
    iframe.onload = () => cleanUp(iframe, form);
    iframe.onerror = () => {
        cleanUp(iframe, form);
        console.error("下载出错了");
    };
    // 添加到文档并提交表单
    const fragment = document.createDocumentFragment();
    fragment.appendChild(iframe);
    fragment.appendChild(form);
    document.body.appendChild(fragment);
    form.submit();
// 使用 fetch 进行请求
    const fetchRequest = async (
        url: string,
        method: "get" | "post",
        data?: AnyObject
    ) => {

        const headers: HeadersInit = {
            "Content-Type": "application/x-www-form-urlencoded",
        };

        const options: RequestInit = {
            method,
            headers,
        };

        if (method.toLowerCase() === "post" && data) {
            options.body = new URLSearchParams({[tokenName]: token, ...data}).toString();
        } else if (method.toLowerCase() === "get" && data) {
            url += "?" + new URLSearchParams({[tokenName]: token, ...data}).toString();
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error("网络响应错误");
        }
        return response;
    };
    // 使用 fetch 请求来验证是否有错误
    try {
        await fetchRequest(url, method, data);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            cleanUp(iframe, form);
        }
    }
};



