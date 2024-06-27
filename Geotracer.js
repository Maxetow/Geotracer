// ==UserScript==
// @name         Geotracer (By Maxetow)
// @namespace    https://github.com/Maxetow/Geotracer
// @version      2.0
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
}

let globalPanoID = undefined

var originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
    if (method.toUpperCase() === 'POST' &&
        (url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata') ||
         url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch'))) {

        this.addEventListener('load', function () {
            let interceptedResult = this.responseText
            const pattern = /-?\d+\.\d+,-?\d+\.\d+/g;
            let match = interceptedResult.match(pattern)[0];
            let split = match.split(",")

            let lat = Number.parseFloat(split[0])
            let lng = Number.parseFloat(split[1])

            globalCoordinates.lat = lat
            globalCoordinates.lng = lng
        });
    }
    return originalOpen.apply(this, arguments);
};

function placeMarker(safeMode){
    let {lat,lng} = globalCoordinates

    if (safeMode) {
        const sway = [Math.random() > 0.5, Math.random() > 0.5]
        const multiplier = Math.random() * 4
        const horizontalAmount = Math.random() * multiplier
        const verticalAmount = Math.random() * multiplier
        sway[0] ? lat += verticalAmount : lat -= verticalAmount
        sway[1] ? lng += horizontalAmount : lat -= horizontalAmount
    }

    let element = document.querySelectorAll('[class^="guess-map_canvas__"]')[0]
    if(!element){
        placeMarkerStreaks()
        return
    }
    const keys = Object.keys(element)
    const key = keys.find(key => key.startsWith("__reactFiber$"))
    const props = element[key]
    const x = props.return.return.memoizedProps.map.__e3_.click
    const y = Object.keys(x)[0]

    const z = {
        latLng:{
            lat: () => lat,
            lng: () => lng,
        }
    }

    const xy = x[y]
    const a = Object.keys(x[y])

    for(let i = 0; i < a.length ;i++){
        let q = a[i]
        if (typeof xy[q] === "function"){
            xy[q](z)
        }
    }
}

function placeMarkerStreaks(){
    let {lat,lng} = globalCoordinates
    let element = document.getElementsByClassName("region-map_mapCanvas__R95Ki")[0]
    if(!element){
        return
    }
    const keys = Object.keys(element)
    const key = keys.find(key => key.startsWith("__reactFiber$"))
    const props = element[key]
    const x = props.return.return.memoizedProps.map.__e3_.click
    const y = Object.keys(x)
    const w = "(e.latLng.lat(),e.latLng.lng())}"
    const v = {
        latLng:{
            lat: () => lat,
            lng: () => lng,
        }
    }
    for(let i = 0; i < y.length; i++){
        const curr = Object.keys(x[y[i]])
        let func = curr.find(l => typeof x[y[i]][l] === "function")
        let prop = x[y[i]][func]
        if(prop && prop.toString().slice(5) === w){
            prop(v)
        }
    }
}

function mapsFromCoords() {
    const {lat,lng} = globalCoordinates
    if (!lat || !lng) {
        return;
    }

    if (nativeOpen) {
        const nativeOpenCodeIndex = nativeOpen.toString().indexOf('native code')
        if (nativeOpenCodeIndex === 19 || nativeOpenCodeIndex === 23) {
            nativeOpen(`https://maps.google.com/?output=embed&q=${lat},${lng}&ll=${lat},${lng}&z=5`);
        }
    }
}

let onKeyDown = (e) => {
    if (e.keyCode === 89) {
        e.stopImmediatePropagation();
        placeMarker(true)
    }
    if (e.keyCode === 88) {
        e.stopImmediatePropagation();
        placeMarker(false)
    }
    if (e.keyCode === 67) {
        e.stopImmediatePropagation();
        mapsFromCoords(false)
    }
}

document.addEventListener("keydown", onKeyDown);
