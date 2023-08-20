const checkFrameTimer = setInterval(checkFrameReady, 500);

function checkFrameReady() {
    if (frames.length > 0 && frames[0].frames.length > 0 && frames[0].frames[0].document.body) {
        initHook();
        clearInterval(checkFrameTimer);
    }
}

let isValidUrl = false;

function initHook() {
    frames[0].frames[0].XMLHttpRequest.prototype._originalOpen = XMLHttpRequest.prototype.open;
    let currentUrlElement = document.createElement('input');
    currentUrlElement.id = 'current_url';
    currentUrlElement.type = 'hidden';
    document.body.append(currentUrlElement);
    document.getElementById('current_url').setAttribute('data-post', '[]');

    frames[0].frames[0].XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        const VALID_FETCH_PATH = "v2/rest/contacts/table-data";
        isValidUrl = (url.indexOf(VALID_FETCH_PATH) > -1);
        if (isValidUrl) {
            document.getElementById('current_url').value = url;
        }
        this._originalOpen(method, url, async, user, password);
    }

    frames[0].frames[0].XMLHttpRequest.prototype._originalSend = XMLHttpRequest.prototype.send;
    frames[0].frames[0].XMLHttpRequest.prototype.send = function(data) {
        if (isValidUrl && data) {
            document.getElementById('current_url').setAttribute('data-post', data);
        }
        this._originalSend(data);
    }

};
