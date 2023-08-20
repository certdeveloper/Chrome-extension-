let currentUrl = "";
let currentFetchCnt = 0;
const RESULT_LIMIT = "resultLimit";
const RESULT_OFFSET = "resultOffset";
const DOWNLOAD_FILE = "propstream.csv";
const PROPSTREAM_STORAGE_KEY = "propstream";
const CSV_HEADER = 'Address,City,State,Zip Code';
const FETCH_UNIT = 100;
let  fetchedData = [];
let isDownloading = false;

var s = document.createElement('script');
s.src = chrome.runtime.getURL('propstream/inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

chrome.runtime.onMessage.addListener(message => {
    if (message === 'extract_propstream') {
        const activeElements = document.querySelectorAll('a[class$="activeItem"]');
        if (activeElements.length > 0 && activeElements[0].href.indexOf('search') < 0) {
            return;
        }
        
        if (!isDownloading) {
            fetchData();
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
    
    if (currentUrl.length < 1) {
        toastr.warning("Nothing to extract", "", {"positionClass":"toast-bottom-right"});
        return;
    }
    currentUrl = document.location.origin + currentUrl;
    if (!isDownloading) {
        toastr.info("Download Started", "Downloading Data", {"positionClass":"toast-bottom-right"});
    }
    isDownloading = true;
    const url = getFetchUrl(currentFetchCnt * FETCH_UNIT + 1);
    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then((jsonResponse) => {
            const responseData = jsonResponse.map(item => [item.address.streetAddress, item.address.cityName, item.address.stateCode, item.address.zip].join(','));
            fetchedData.push(...responseData);
            if (jsonResponse.length < FETCH_UNIT) {
                currentFetchCnt = 0;
                const fetchedCnt = fetchedData.length;
                toastr.success(fetchedCnt + " data was extracted", "Completed", {"positionClass":"toast-bottom-right"});
                
                fetchedData = [...new Set(fetchedData)];
                chrome.storage.local.get([PROPSTREAM_STORAGE_KEY]).then((storedData) => {
                    if (Object.keys(storedData).findIndex(key => key == "propstream") > -1) {
                        const storedPropData = storedData.propstream;
                        fetchedData = fetchedData.filter(fetchedItem => storedPropData.findIndex(storedItem => storedItem == fetchedItem) < 0);
                        totalData = [...storedPropData, ...fetchedData];
                    } else {
                        totalData = [...fetchedData];
                    }
                    
                    chrome.storage.local.set({ propstream: totalData }).then(() => {
                        console.log("Now total data count is " + totalData.length);
                    });
                    const downloadCnt = fetchedData.length;
                    if (downloadCnt < 1) {
                        toastr.success("All data is duplicated", "Nothing to download", {"positionClass":"toast-bottom-right"});
                    } else {
                        toastr.success(downloadCnt + " data downloaded, " + (fetchedCnt - downloadCnt) + " data removed due to duplicate", "Downloaded", {"positionClass":"toast-bottom-right"});
                        downloadCSV();
                        fetchedData = [];
                    }
                    isDownloading = false;
                });
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

function getFetchUrl(resultOffset) {
    const url = new URL(currentUrl);
    url.searchParams.set(RESULT_OFFSET, resultOffset);
    url.searchParams.set(RESULT_LIMIT, FETCH_UNIT);
    return url.toString();
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