// Prerender - https://prerender.io/documentation. Use local instance of Prerender if possible so that nothing is sent to 3rd party.
window.prerenderReady = false;

// Crowdin in-context localization - https://support.crowdin.com/in-context-localization/
if (window.location.pathname.match(/^\/aa\/.*/)) {
    var _jipt = [];
    _jipt.push(['project', 'citizenos-fe']);

    var crowdinScriptElement = document.createElement('script');
    crowdinScriptElement.src = '//cdn.crowdin.com/jipt/jipt.js';
    crowdinScriptElement.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(crowdinScriptElement);
}

// Open source notice in developer tools
if (/\/\/(www.)?app\.citizenos\.com/.test(window.location.href)) {
    if (/(chrome|firefox)/.test(navigator.userAgent.toLowerCase())) {
        var notified = false;
        window.addEventListener('devtoolschange', function (e) {
            var o = e.detail.open;
            if (o && !notified) {
                if ('function' == typeof console.group) {
                    console.group('We\'re open source. Contribute on Github - https://github.com/citizenos/citizenos-fe!');
                }

                console.log('%c' + '    Found a bug? Need a feature?', 'background-image: url("https://app.citizenos.com/imgs/citizenos_logo_black.png"); background-repeat: no-repeat; background-size: 58px 50px; font-size:30px; line-height: 2; font-weight: bold;');
                console.log('%c' + 'We\'re open source. Contribute on GitHub - https://github.com/citizenos/citizenos-fe', 'font-size:15px; line-height: 2');
                notified = true;

                if ('function' == typeof console.groupEnd) {
                    console.groupEnd();
                }
            }
        });
    }
}
