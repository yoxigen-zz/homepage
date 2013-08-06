chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        width: screen.availWidth,
        height: screen.availHeight,
        left: 0,
        top: 0
    });
});