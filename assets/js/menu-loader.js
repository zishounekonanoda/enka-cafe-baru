// メニューページのローディング画面を閉じる
function showMenuContent() {
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-bar');
    const main = document.querySelector('main');

    if (loaderBar) {
        loaderBar.style.transform = 'scaleX(0.18)';
        requestAnimationFrame(() => {
            loaderBar.style.transform = 'scaleX(0.9)';
        });
    }

    setTimeout(() => {
        if (loaderBar) {
            loaderBar.style.transform = 'scaleX(1)';
        }
        if (loader) {
            loader.classList.add('fade-out');
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 650);
        }
        main?.classList.add('content-visible');
    }, 650);
}

window.addEventListener('load', showMenuContent);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(showMenuContent, 1200);
    });
} else {
    setTimeout(showMenuContent, 1200);
}
