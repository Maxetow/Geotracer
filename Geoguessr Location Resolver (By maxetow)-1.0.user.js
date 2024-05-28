// ==UserScript==
// @name         Geoguessr Location Resolver (By maxetow)
// @namespace    https://github.com/Maxetow/Geoguessr_location
// @version      1.9
// @description  Features: press y to score 5000 Points | press c to open in Google Maps (Ctrl + c to close image) | Alt + x to open settings and customize key bindings
// @author       Maxetow
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        none
// @homepageURL  https://github.com/Maxetow/Geoguessr_location
// @supportURL   https://github.com/Maxetow/Geoguessr_location
// @updateURL    https://raw.githubusercontent.com/Maxetow/Geoguessr_location/main/Geoguessr%20Location%20Resolver%20(By%20maxetow)-1.0.user.js
// ==/UserScript==

// We (Maxetow or any person associated with this script) decline all responsibility in case of ban or misuse of this script
// Part of script comes from 0x978
// https://github.com/0x978/GeoGuessr_Resolver
let globalCoordinates = {
    lat: 0,
    lng: 0
};

// Default key bindings and settings
let keyBindings = {
    placeMarker: 'y',
    openMap: 'c',
    openSettings: 'x'
};

let settings = {
    showCoordinates: false
};

// Load key bindings and settings from localStorage
function loadSettings() {
    const savedBindings = JSON.parse(localStorage.getItem('keyBindings'));
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    if (savedBindings) {
        keyBindings = savedBindings;
    }
    if (savedSettings) {
        settings = savedSettings;
    }
}

// Intercepting API call to Google Street view
var originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
    if (method.toUpperCase() === 'POST' &&
        (url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata') ||
            url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch'))) {

        this.addEventListener('load', function () {
            let interceptedResult = this.responseText;
            const pattern = /-?\d+\.\d+,-?\d+\.\d+/g;
            let match = interceptedResult.match(pattern)[0];
            let split = match.split(",");

            let lat = Number.parseFloat(split[0]);
            let lng = Number.parseFloat(split[1]);

            globalCoordinates.lat = lat;
            globalCoordinates.lng = lng;

            if (settings.showCoordinates) {
                showCoordinatesOnScreen();
            }
        });
    }
    // Call the original open function
    return originalOpen.apply(this, arguments);
};

// Function to place marker
function placeMarker() {
    let {lat, lng} = globalCoordinates;

    let element = document.querySelectorAll('[class^="guess-map_canvas__"]')[0];
    if (!element) {
        return;
    }
    const keys = Object.keys(element);
    const key = keys.find(key => key.startsWith("__reactFiber$"));
    const props = element[key];
    const x = props.return.return.memoizedProps.map.__e3_.click;
    const y = Object.keys(x)[0];

    const z = {
        latLng: {
            lat: () => lat,
            lng: () => lng,
        }
    };

    const xy = x[y];
    const a = Object.keys(x[y]);

    for (let i = 0; i < a.length ; i++) {
        let q = a[i];
        if (typeof xy[q] === "function") {
            xy[q](z);
        }
    }
}

// Function to embed location in Google Maps within the main window
function mapsFromCoords() {
    const {lat, lng} = globalCoordinates;
    if (!lat || !lng) {
        return;
    }

    const mapUrl = `https://maps.google.com/?output=embed&q=${lat},${lng}&ll=${lat},${lng}&z=5`;

    // Create an iframe element and set its attributes
    let iframe = document.createElement('iframe');
    iframe.setAttribute('id', 'googleMapsIframe');
    iframe.setAttribute('src', mapUrl);
    iframe.setAttribute('width', '300'); // Adjust width as needed
    iframe.setAttribute('height', '300'); // Adjust height as needed
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('style', 'position:fixed;top:10px;right:10px;width:300px;height:300px;z-index:9999;opacity:0.5;');

    // Append the iframe to the body of the document
    document.body.appendChild(iframe);
}

// Function to close the embedded Google Maps iframe
function closeMaps() {
    let iframe = document.getElementById('googleMapsIframe');
    if (iframe) {
        iframe.parentNode.removeChild(iframe);
    }
}

// Function to show coordinates on screen
function showCoordinatesOnScreen() {
    let coordDiv = document.getElementById('coordinatesDiv');
    if (!coordDiv) {
        coordDiv = document.createElement('div');
        coordDiv.setAttribute('id', 'coordinatesDiv');
        coordDiv.setAttribute('style', 'position:fixed;bottom:10px;left:10px;background:black;color:white;padding:10px;border-radius:5px;opacity:0.8;z-index:9999;');
        document.body.appendChild(coordDiv);
    }
    coordDiv.innerHTML = `Latitude: ${globalCoordinates.lat}<br>Longitude: ${globalCoordinates.lng}`;
}

// Function to hide coordinates from screen
function hideCoordinatesFromScreen() {
    let coordDiv = document.getElementById('coordinatesDiv');
    if (coordDiv) {
        coordDiv.parentNode.removeChild(coordDiv);
    }
}
// Function to open settings UI
function openSettings() {
    let settingsDiv = document.getElementById('settingsDiv');
    if (!settingsDiv) {
        settingsDiv = document.createElement('div');
        settingsDiv.setAttribute('id', 'settingsDiv');
        settingsDiv.setAttribute('style', `
            position:fixed;
            top:50px;
            right:50px;
            width:300px;
            height:350px;
            background:rgba(0, 0, 0, 0.8);
            color:white;
            z-index:9999;
            padding:20px;
            border:1px solid black;
            border-radius:15px;
            `);
        settingsDiv.innerHTML = `
            <h3 style="margin-top: 0;">Settings</h3>
            <label for="placeMarkerKey">Place Marker Key:</label><br>
            <input type="text" id="placeMarkerKey" value="${keyBindings.placeMarker}" maxlength="1" style="background: white; color: black; width: 100%;"><br><br>
            <label for="openMapKey">Open Map Key:</label><br>
            <input type="text" id="openMapKey" value="${keyBindings.openMap}" maxlength="1" style="background: white; color: black; width: 100%;"><br><br>
            <label for="openSettingsKey">Open Settings Key:</label><br>
            <input type="text" id="openSettingsKey" value="${keyBindings.openSettings}" maxlength="1" style="background: white; color: black; width: 100%;"><br><br>
            <label for="showCoordinatesToggle">Show Coordinates:</label><br>
            <input type="checkbox" id="showCoordinatesToggle" ${settings.showCoordinates ? 'checked' : ''} style="width: auto;"><br><br>
            <button id="saveSettingsBtn" style="background: gray; color: white; border: none; border-radius: 5px; padding: 5px 10px; margin-right: 10px;">Save</button>
            <button id="reloadBtn" style="background: gray; color: white; border: none; border-radius: 5px; padding: 5px 10px;">Reload</button>
            <button id="closeSettingsBtn" style="background: gray; color: white; border: none; border-radius: 5px; padding: 5px 10px;">Close</button>
        `;
        document.body.appendChild(settingsDiv);

        // Add event listener to close button
        document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);

        // Add event listener to save button
        document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

        // Add event listener to reload button
        document.getElementById('reloadBtn').addEventListener('click', reloadPage);

        // Add hover effect to buttons
        const buttons = settingsDiv.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = 'darkgray';
            });
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = 'gray';
            });
        });
    } else {
        settingsDiv.style.display = 'block';
    }
}

// Function to reload the page
function reloadPage() {
    location.reload();
}

// Function to close settings UI
function closeSettings() {
    let settingsDiv = document.getElementById('settingsDiv');
    if (settingsDiv) {
        settingsDiv.style.display = 'none';
    }
}

// Function to save settings
function saveSettings() {
    keyBindings.placeMarker = document.getElementById('placeMarkerKey').value;
    keyBindings.openMap = document.getElementById('openMapKey').value;
    keyBindings.openSettings = document.getElementById('openSettingsKey').value;
    settings.showCoordinates = document.getElementById('showCoordinatesToggle').checked;

    // Save settings to localStorage
    localStorage.setItem('keyBindings', JSON.stringify(keyBindings));
    localStorage.setItem('settings', JSON.stringify(settings));

    alert('Settings saved!');
}


// Event listener for key bindings
let onKeyDown = (e) => {
    if (e.key === keyBindings.placeMarker) {
        e.stopImmediatePropagation();
        placeMarker(); // Exact location for 5000 points
    }
    if (e.key === keyBindings.openMap) {
        e.stopImmediatePropagation();
        if (e.ctrlKey) {
            closeMaps();
        } else {
            mapsFromCoords();
        }
    }
    if (e.key === keyBindings.openSettings && e.altKey) {
        e.stopImmediatePropagation();
        openSettings();
    }
};

// Load settings when the script runs
loadSettings();

// Add keydown event listener
document.addEventListener("keydown", onKeyDown);
