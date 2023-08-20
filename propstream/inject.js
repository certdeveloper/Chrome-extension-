(function() {
    XMLHttpRequest.prototype._originalOpen = XMLHttpRequest.prototype.open;
    let currentUrlElement = document.createElement('input');
    currentUrlElement.id = 'current_url';
    currentUrlElement.type = 'hidden';
    document.body.append(currentUrlElement);

    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        const VALID_FETCH_PATH = ["eqbackend/resource/auth/ps4/listing", "v2/rest/contacts/table-data"];
        let isValid = false;
        VALID_FETCH_PATH.forEach(path => {
            if (url.indexOf(path) > -1) {
                isValid = true;
            }
        });
        if (isValid) {
            document.getElementById('current_url').value = url;
        }
        this._originalOpen(method, url, async, user, password);
    }
})();
