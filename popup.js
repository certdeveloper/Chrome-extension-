const PROPSTREAM_URL = "https://app.propstream.com";
const MOJO_URL = "https://app301.mojosells.com/main";
const CSV_HEADER = 'Address,City,State,Zip Code';
const PROPSTREAM_STORAGE_KEY = "propstream";
const DOWNLOAD_FILE  = "master_propstream.csv";

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("btn-extract-propstream").addEventListener("click", () => {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            var activeTab = tabs[0];
            if (activeTab.url.indexOf(PROPSTREAM_URL) < 0) {
                toastr.warning("You have to be in Propstream.com")
                return;
            }
            chrome.tabs.sendMessage(activeTab.id, 'extract_propstream');
        });
    });
    
    document.getElementById("btn-extract-mojo").addEventListener("click", () => {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            var activeTab = tabs[0];
            if (activeTab.url.indexOf(MOJO_URL) < 0) {
                toastr.warning("You have to be in mojosells.com")
                return;
            }
            chrome.tabs.sendMessage(activeTab.id, 'extract_mojo');
        });
    });
    
    document.getElementById("btn-extract-master").addEventListener("click", () => {
        chrome.storage.local.get([PROPSTREAM_STORAGE_KEY]).then((storedData) => {
            if (Object.keys(storedData).findIndex(key => key == "propstream") > -1) {
                const storedPropData = storedData.propstream;
                downloadCSV(storedPropData);
                toastr.success(storedPropData.length + "data was downloaded.");
            } else {
                toastr.warning("You don't have any searched data.");
            }
        });
    });
});

function downloadCSV(storedPropData) {
    if (storedPropData.length < 1) {
        return;
    }

    const csvContent = generateCSV(storedPropData);

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', DOWNLOAD_FILE);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

function generateCSV(data) {
    let csv = [CSV_HEADER, ...data].join('\n');
    return csv;
}