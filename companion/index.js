import * as messaging from "messaging";

function fetchTimes() {
    fetch('https://apis.maryknize.com/dis/api/mk')
        .then(function (response) {
            response.json()
                .then(function (data) {
                    var times = JSON.stringify(data);
                    returnTimeData(times);
                })
        }).catch(function (err) {
            console.log(err);
        })
}

function returnTimeData(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        // Send a command to the device
        messaging.peerSocket.send(data);
    } else {
        console.log("Error: Connection is not open");
    }
}

messaging.peerSocket.onmessage = function(evt) {
    console.log(evt.data.command);
    if (evt.data && evt.data.command == "ridetimes") {
        console.log("fetch times");
        fetchTimes();
    }
}

messaging.peerSocket.onerror = function(err) {
    // Handle any errors
    console.log("Connection error: " + err.code + " - " + err.message);
}