let currentUrl = "";
let currentFetchCnt = 0;
const RESULT_LIMIT = "iDisplayLength";
const RESULT_OFFSET = "iDisplayStart";
const DOWNLOAD_FILE = "mojo.csv";
const MOJO_STORAGE_KEY = "mojo";
const CSV_HEADER = 'First Name,Address,Email,Phone #,Address';
const FETCH_UNIT = 100;
let  fetchedData = [];
let isDownloading = false;
let postData = [];

var s = document.createElement('script');
s.src = chrome.runtime.getURL('mojo/inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

chrome.runtime.onMessage.addListener(message => {
    if (message === 'extract_mojo') {
        if (frames[0].frames[0].document.querySelectorAll('div[class^="ContactTable_tableContainer"]').length < 1) {
            return;
        }
        
        if (!isDownloading) {
            try {
                postData = JSON.parse(document.getElementById('current_url').getAttribute('data-post'));
                fetchData();
            } catch {
                toastr.warning("Please choose correct page", "Failed", {"positionClass":"toast-bottom-right"});
            }
        }
    }
});

function fetchData() {
    const urlElement = document.getElementById('current_url');
    if (!urlElement) {
        toastr.warning("Please Wait while page will be loaded.", "", {"positionClass":"toast-bottom-right"});
        return;
    }
    currentUrl = urlElement.value;
    
    if (currentUrl.length < 1 || !postData) {
        toastr.warning("Nothing to extract", "", {"positionClass":"toast-bottom-right"});
        return;
    }
    currentUrl = document.location.origin + currentUrl;
    if (!isDownloading) {
        toastr.info("Download Started", "Downloading Data", {"positionClass":"toast-bottom-right"});
    }
    isDownloading = true;
    postData[RESULT_OFFSET] = currentFetchCnt * FETCH_UNIT;
    fetch(currentUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    }).then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then((jsonResponse) => {
            const aaData = jsonResponse.aaData;
            const responseData = aaData.map(item => {
                const names = item[2] ? item[2].split(" ") : [];
                const firstName = names.length > 0 ? names[0] : "";
                const lastName = names.length > 1 ? names[names.length - 1] : "";
                return [firstName, lastName, item[8], item[7], item[3]].join(',');
            });
            fetchedData.push(...responseData);
            if (aaData.length < FETCH_UNIT) {
                currentFetchCnt = 0;
                const fetchedCnt = fetchedData.length;
                toastr.success(fetchedCnt + " data was extracted", "Completed", {"positionClass":"toast-bottom-right"});
                
                fetchedData = [...new Set(fetchedData)];
                const downloadCnt = fetchedData.length;
                if (downloadCnt < 1) {
                    toastr.success("Nothing to download", "", {"positionClass":"toast-bottom-right"});
                } else {
                    toastr.success(downloadCnt + " data downloaded, " + (fetchedCnt - downloadCnt) + " data removed due to duplicate", "Downloaded", {"positionClass":"toast-bottom-right"});
                    downloadCSV();
                    fetchedData = [];
                }
                isDownloading = false;
            } else {
                toastr.info(fetchedData.length + " data was extracted", "Extracting Data", {"positionClass":"toast-bottom-right"});
                currentFetchCnt++;
                fetchData();
            }
        })
        .catch((error) => {
            currentFetchCnt = 0;
            fetchedData = [];
            isDownloading = false;
            toastr.error("Can't fetch data from server.", "Error in Fetch Data", {"positionClass":"toast-bottom-right"});
        });   
}

function downloadCSV() {
    if (fetchedData.length < 1) {
        return;
    }

    const csvContent = generateCSV();

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', DOWNLOAD_FILE);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

function generateCSV() {
    let csv = [CSV_HEADER, ...fetchedData].join('\n');
    return csv;
}