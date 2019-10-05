import document from "document";
import * as messaging from "messaging";
import clock from "clock";
import { preferences } from "user-settings";
import {apiFetch} from "@fitbit/sdk-cli/lib/api/baseAPI";

let rideList = document.getElementById("my-list");
let clockText = document.getElementById("clock");
let lastRefreshed = document.getElementById("lastrefreshed");
lastRefreshed.text = "Last updated: ";

const getTime = (today) => {
    let hours = today.getHours();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    let mins = zeroPad(today.getMinutes());
    return `${hours}:${mins} ${ampm}`;
};

messaging.peerSocket.onmessage = function(evt) {
    console.log(evt);
    if (evt.data && evt.data.command == "ridetimes") {
        console.log("fetch times");
        fetchTimes();
    }
}

messaging.peerSocket.onerror = function(err) {
    // Handle any errors
    console.log("Connection error: " + err.code + " - " + err.message);
}

function fetchRideTimes() {
    console.log('Fetch ride times');
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log("Messaging open");
        // Send a command to the companion
        messaging.peerSocket.send({
            command: 'ridetimes'
        });
    }
}

function processRideData(data) {
    rideList.length = 0;
    rideList.redraw();
    var rideTimes = JSON.parse(data);
    var keys = Object.keys(rideTimes);
    rideList.delegate = {
        getTileInfo: function(index) {
            var name = keys[index].length > 20 ? keys[index].substring(0, 19) + '...' : keys[index];
            return {
                type: "my-pool",
                value: name,
                times: rideTimes[keys[index]] === null ? '--' : rideTimes[keys[index]],
                index: index
            };
        },
        configureTile: function(tile, info) {
            if (info.type == "my-pool") {
                tile.getElementById("text").text = info.value;
                tile.getElementById("time").text = info.times;
            }
        }
    };
    rideList.length = keys.length;
    rideList.redraw();
    lastRefreshed.text = "Last updated: " + getTime(new Date());
}

// Listen for the onopen event
messaging.peerSocket.onopen = () => {
    // Fetch weather when the connection opens
    fetchRideTimes();
};

// Listen for messages from the companion
messaging.peerSocket.onmessage = (evt) => {
    if (evt.data) {
        rideList.length = Object.keys(JSON.parse(evt.data)).length;
        processRideData(evt.data);
    }
};

// Listen for the onerror event
messaging.peerSocket.onerror = (err) => {
    // Handle any errors
    console.log("Connection error: " + err.code + " - " + err.message);
};

//setInterval(fetchRideTimes, 5 * 1000 * 60);

let refreshbutton = document.getElementById("refresh");
refreshbutton.onactivate = () => {
    fetchRideTimes();
};

const zeroPad = (i) => {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
};

clock.granularity = "minutes";
clock.ontick = (evt) => {
    clockText.text = getTime(evt.date);
};
