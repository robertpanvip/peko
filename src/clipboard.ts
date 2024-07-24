class Clipboard {
    async writeText(text: string) {
        const textarea = document.createElement('textarea');
        textarea.style.width = "0px";
        textarea.style.height = "0px";
        textarea.style.opacity = '0';
        const focus = document.activeElement as HTMLInputElement;
        try {
            document.body.appendChild(textarea);
            textarea.innerHTML = text;
            textarea.focus()
            textarea.select();
            const res = document.execCommand('copy');
            if (!res) {
                throw new Error('Cannot copy')
            }
        } finally {
            textarea.blur();
            if (focus) {
                focus.focus?.();
            }
            textarea.remove();
        }
    }
}

export default Clipboard