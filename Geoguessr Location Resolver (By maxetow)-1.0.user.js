// ==UserScript==
// @name         Geoguessr Location Resolver (By maxetow)
// @namespace    https://github.com/Maxetow/Geoguessr_location
// @version      1.1
// @description  Features: press y to score 5000 Points | press x to score randomly between 4500 and 5000 points | press c to open in Google Maps (v to close image)
// @author       Maxetow
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        none
// @homepageURL  https://github.com/Maxetow/Geoguessr_location
// @supportURL https://github.com/Maxetow/Geoguessr_location
// @updateURL	  https://raw.githubusercontent.com/Maxetow/Geoguessr_location/main/Geoguessr Location Resolver (By maxetow)-1.0.user.js
// ==/UserScript==

// We (Maxetow or any person assiated with this script) decline all responsability in case of ban or missuse of this script
// Part of script comes from 0x978
// https://github.com/0x978/GeoGuessr_Resolver
let globalCoordinates = {
    lat: 0,
    lng: 0
};

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
        });
    }
    // Call the original open function
    return originalOpen.apply(this, arguments);
};

// Function to place marker
function placeMarker(safeMode) {
    let {lat, lng} = globalCoordinates;

    if (safeMode) {
        const sway = [Math.random() > 0.5, Math.random() > 0.5];
        const multiplier = Math.random() * 4;
        const horizontalAmount = Math.random() * multiplier;
        const verticalAmount = Math.random() * multiplier;
        sway[0] ? lat += verticalAmount : lat -= verticalAmount;
        sway[1] ? lng += horizontalAmount : lat -= horizontalAmount;
    }

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

// end of script from 0x978
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

// Event listener for key bindings
let onKeyDown = (e) => {
    if (e.key === 'y') {
        e.stopImmediatePropagation();
        placeMarker(true);
    }
    if (e.key === 'x') {
        e.stopImmediatePropagation();
        placeMarker(false);
    }
    if (e.key === 'c') {
        e.stopImmediatePropagation();
        mapsFromCoords();
    }
    if (e.key === 'v') {
        e.stopImmediatePropagation();
        closeMaps();
    }
};

document.addEventListener("keydown", onKeyDown);

// Function to close the embedded Google Maps iframe

function closeMaps() {
    let iframe = document.getElementById('googleMapsIframe');
    if (iframe) {
        iframe.parentNode.removeChild(iframe);
    }
}
