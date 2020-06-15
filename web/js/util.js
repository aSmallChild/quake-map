export default class Util {
    static close(element) {
        element.parentNode.removeChild(element);
    }

    static shrinkOut(element) {
        element.classList.add('shrink_out');
        setTimeout(() => {
            element.style.display = 'none';
            element.classList.remove('shrink_out');
        }, 100);
    }

    static shrinkIn(element) {
        element.classList.add('shrink_in');
        element.style.display = '';
        setTimeout(() => element.classList.remove('shrink_in'), 100);
    }

    static getDateTimeString(date) {
        date = date ? date : new Date();
        return (new Date(date - date.getTimezoneOffset() * 60000)).toISOString().split('.')[0].replace('T', ' ');
    }

    static loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onerror = reject;
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
}