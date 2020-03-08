(function () {

    //create map in leaflet and tie it to the div called 'theMap'
    var map = L.map('theMap').setView([44.650627, -63.597140], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // define two bus icons
    var bigBusIcon = L.icon({
        iconUrl: 'bluebus.png',
        iconSize: [20] // size of the icon
    });

    var smallBusIcon = L.icon({
        iconUrl: 'bluebus.png',
        iconSize: [10] // size of the icon
    });

    // convery the JSON to GeoJSON
    const getGeoJson = (myJson) => {
        return myJson.map((bus) => {
            let buses = {
                type: "Point",
                routeNum: bus.vehicle.trip.routeId,
                bearing: bus.vehicle.position.bearing,
                coordinates: [bus.vehicle.position.longitude, bus.vehicle.position.latitude],
                speed: bus.vehicle.position.speed
            };
            if (typeof (buses.speed) === "undefined") {
                buses.speed = 0;
            };
            return buses;
        });
    };

    // define a layer group so that the buses aren't duplicated
    let busLayer = L.layerGroup().addTo(map);

    // main function to fetch data and filter json
    const mapBuses = function () {
        // fetch the bus data, backup API below
        fetch("https://hrmbuses.herokuapp.com/")
        //fetch("https://hrmbuses.azurewebsites.net")
            .then(function (response) {
                return response.json();
            })
            .then(function (myJson) {
                // filter json for bus routes 1-10
                let routeFilter = myJson.entity.filter(entity => parseInt(entity.vehicle.trip.routeId) <= 10);
                //console.log(routeFilter);
                // clear the layer group
                busLayer.clearLayers();

                L.geoJSON(getGeoJson(routeFilter), {
                    onEachFeature: function (feature) {
                        let longitude = feature.coordinates[0];
                        let latitude = feature.coordinates[1];
                        // add condition to chose icon based on zoom
                        let currentZoom = map.getZoom();
                        let myIcon = currentZoom > 14 ? bigBusIcon : smallBusIcon;
                        // use myIcon variable in marker creation
                        let marker = L.marker([latitude, longitude], { icon: myIcon, rotationAngle: feature.bearing })
                            .bindPopup(
                                `Bus Route: ${feature.routeNum}<br/>Speed: ${Math.round(feature.speed)} km/hr`
                            ).addTo(busLayer);

                        // set icon size based on zoom (although it resets every 7 seconds)
                        map.on('zoomend', function () {
                            let currentZoom = map.getZoom();
                            if (currentZoom >= 14) {
                                marker.setIcon(bigBusIcon);
                            }
                            else {
                                marker.setIcon(smallBusIcon);
                            }
                        });
                    }
                });
            });
        // refresh every 7 seconds    
        setTimeout(mapBuses, 7000);
    };
    // call the function to run everything
    mapBuses();
})();