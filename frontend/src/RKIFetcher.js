// TODO: Add visual output!

class RKIFetcher {

    static api = "https://opendata.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0.geojson";
    city;
    data = null;
    landkreisPictureQuery;
    queryResultRenderer;
    static incidency;
    static totalCases;
    static totalDeaths;
    static survivalRate;
    static storedData = [];
    cards = document.querySelectorAll(".card");

    constructor(city) {
        if(city) {
            this.city = city;
        }
        document.querySelector("#landkreis").addEventListener("click", function(e) {
            e.target.value = "";
            e.target.click();
        })
        this.landkreisPictureQuery = new LandkreisPictureQuery(city);
        this.cards.forEach(card => card.style.display = "none");
        this.queryResultRenderer = new QueryResultRenderer(document.querySelector("#RKITarget"));
        this.queryResultRenderer.hideRenderTarget();
    }



    async getAllLandkreise() {
        const landkreise = [];
        await fetch(RKIFetcher.api).then(res => res.json()).then(json => json.features.forEach(feature => landkreise.push(feature.properties.GEN)));

        return landkreise;
    }

    static calculateIncidency() {
        RKIFetcher.incidency = Number.parseInt((RKIFetcher.storedData.map(landkreis => landkreis.properties.cases7_per_100k).reduce((a,b) => a+b) / RKIFetcher.storedData.length) * 10) / 10
    }

    async findNeighbourDistricts(data_) {
        console.log(this.data);
        if(!this.data) {
            await this.getInformation();
        }

        if(data_.properties.GEN == "Düsseldorf") {
            RKIFetcher.storedData.forEach(feature => {
                if(feature.properties.GEN == "Mettmann") {
                    data_ = feature;
                }
            })
        }

        return RKIFetcher
                .storedData
                .sort(function(a,b) { return Math.abs(a.properties.OBJECTID - data_.properties.OBJECTID) - Math.abs(b.properties.OBJECTID - data_.properties.OBJECTID)})
                .slice(1, 6);
    }

    
    static async getAllLandkreiseAsObjects() {
        if(RKIFetcher.storedData.length < 1) {
            await fetch(RKIFetcher.api)
                .then(res => res.json())
                .then(json => json.features.forEach(feature => this.storedData.push(feature)));
        }

        RKIFetcher.calculateIncidency();
        RKIFetcher.totalCases = RKIFetcher.calculateTotalCases();
        RKIFetcher.totalDeaths = RKIFetcher.calculateTotalDeaths();
        RKIFetcher.survivalRate = RKIFetcher.calculateAverageSurvivalRate();
    }

    async getInformation() {
        await fetch(RKIFetcher.api).then(res => res.json()).then(json => json.features.forEach(feature => {
          if(feature.properties.GEN == this.city) {
            this.data = feature;
            console.log(this.data);
            window.location.href = window.location.href.split("?")[0] + "?share=" + RKIFetcher.landkreisToURL(feature.properties.GEN);
          }
        }))
    }

    static landkreisToURL(landkreis) {
        let result = "";
        for(let i = 0; i < landkreis.length; i++) {
          result += "#" + landkreis.charCodeAt(i);
        }
      
        return result;
    }

    static findHotspots() {
        return RKIFetcher.storedData.sort(function(a,b) { return b.properties.cases7_per_100k - a.properties.cases7_per_100k }).slice(0,5);
    }

    static calculateTotalCases() {
        return RKIFetcher.storedData.map(landkreis => landkreis.properties.cases).reduce((a,b) => a+b)
    }

    static calculateTotalDeaths() {
        return RKIFetcher.storedData.map(landkreis => landkreis.properties.deaths).reduce((a,b) => a+b)
    }

    static calculateAverageSurvivalRate() {
        return Number.parseInt((RKIFetcher.storedData.map(landkreis => (Number.parseInt((landkreis.properties.death_rate) * 100) / 100)).reduce((a,b) => a+b) / RKIFetcher.storedData.length) * 10) / 10
    }

    static findSafestAreas() {
        return RKIFetcher.storedData.sort(function(a,b) { return a.properties.cases7_per_100k - b.properties.cases7_per_100k }).slice(0,5);
    }

    static URLToLandkreis(landkreis) {
        let result = "";
        for(let i = 1; i < landkreis.split("#").length; i++) {
          result += String.fromCharCode(landkreis.split("#")[i]);
        }
      
      return result;
    }

    async displayResult() {
        if(!this.data) await this.getInformation();
        const imageData = await LandkreisPictureQuery.requestPictureFromAPI(this.landkreisPictureQuery);

        this.queryResultRenderer.render(imageData, this.city, this.data.properties);
        this.queryResultRenderer.showRenderTarget();

        this.queryResultRenderer.updateNeighbours(await this.findNeighbourDistricts(this.data));
        dialog.modal('hide');
        //this.queryResultRenderer.updateHotSpots(RKIFetcher.findHotspots());
        //this.queryResultRenderer.updateSafest(RKIFetcher.findSafestAreas());
    }

    static transformParameterToLandkreis() {
        return window.location.href
                .split("?")[1]
                .replace("share=", "")
                .split("&")[0]
                .replace("#1", "ä")
                .replace("#2", "Ä")
                .replace("#3", "ö")
                .replace("#4", "Ö")
                .replace("#5", "ü")
                .replace("#6", "Ü")
                .replace("#7", " ")
                .replace("#8", "-");
    }

    static createRKIFetcherForLandkreis(landkreis) {
        return new RKIFetcher(landkreis);
    }

    getAPIUrl() {
        return RKIFetcher.api;
    }
}

let landkreise = [];

RKIFetcher.getAllLandkreiseAsObjects();

async function waitForLandkreise() {
    landkreise = await new RKIFetcher().getAllLandkreise();
    console.log(landkreise);

    /*landkreise.forEach(landkreis => {
        document.querySelector("#landkreise").insertAdjacentHTML("beforeend", "<option value=\"" + landkreis + "\">");
    })*/
        
    /*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
    autocomplete(document.getElementById("landkreis"), landkreise);

    QueryResultRenderer.updateHotSpots(RKIFetcher.findHotspots());
    QueryResultRenderer.updateSafest(RKIFetcher.findSafestAreas());

    QueryResultRenderer.showCountryStatistics();

    dialog.modal('hide'); 
}
