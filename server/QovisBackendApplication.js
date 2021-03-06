const express = require('express');
const app = express()
const port = 3000
const SIX_HOURS = 6 * 3600 * 1000;
const BackendRKIFetcher = require("./fetcher/BackendRKIFetcher.js");
const SessionManager = require("./web/SessionManager.js");

async function prepareData() {
    BackendRKIFetcher.storedData = [];
    await BackendRKIFetcher.getAllLandkreiseAsObjects();
    console.log(BackendRKIFetcher.storedData);
}

prepareData();

setInterval(prepareData, SIX_HOURS);

app.get('/', SessionManager.asyncMiddleware(async (req, res, next) => {
    console.log(BackendRKIFetcher.storedData);
    res.send('hi');
}));

app.get('/hotspots', SessionManager.asyncMiddleware(async (req, res, next) => {
    console.log(BackendRKIFetcher.findHotspots());
    res.send(JSON.stringify(BackendRKIFetcher.findHotspots()));
}));

app.get('/safest', SessionManager.asyncMiddleware(async (req, res, next) => {
    console.log(BackendRKIFetcher.findSafestAreas());
    res.send(JSON.stringify(BackendRKIFetcher.findSafestAreas()));
}));

app.get('*', (req, res) => {
    res.send("Error: This is not a valid hook for this API!");
});

app.listen(port, () => console.log(`${__filename} accessible from port ${port}!`));