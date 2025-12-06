export function close(element) {
    element.parentNode.removeChild(element);
}

export function shrinkOut(element) {
    element.classList.add('shrink_out');
    setTimeout(() => {
        element.style.display = 'none';
        element.classList.remove('shrink_out');
    }, 100);
}

export function shrinkIn(element) {
    element.classList.add('shrink_in');
    element.style.display = '';
    setTimeout(() => element.classList.remove('shrink_in'), 100);
}

export function getDateTimeString(date) {
    date = date ? date : new Date();
    return (new Date(date - date.getTimezoneOffset() * 60000)).toISOString().split('.')[0].replace('T', ' ');
}

export function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onerror = reject;
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

export function loadStyle(url) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.onerror = reject;
        link.onload = resolve;
        document.head.appendChild(link);
    });
}