// Mapbox Configuration
var MapboxClient = require('mapbox/lib/services/datasets');
var datasetID = 'cipxubqqz0081hwks1vwhiir2';
var DATASETS_BASE = 'https://api.mapbox.com/datasets/v1/planemad/' + datasetID + '/';
var mapboxAccessDatasetToken = 'sk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiY2lvdHNnd2xmMDBjb3VvbThmaXlsbnd5dCJ9.7Ui7o2K3U6flUzDGvYNZJw';
var styleID = 'mapbox/light-v9';
mapboxgl.accessToken = 'pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ';
var mapbox = new MapboxClient(mapboxAccessDatasetToken);

// var mapLayers = require('map-layers');
var reviewer;
var _tmp = {};


var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/' + styleID,
    center: [-79.38, 43.65], // starting position
    zoom: 16, // starting zoom
    hash: true,
    attributionControl: false
});

var geolocate = map.addControl(new mapboxgl.Geolocate({
    position: 'bottom-right'
}));
map.addControl(new mapboxgl.Navigation());


// Layer for review markers
var overlayDataSource = new mapboxgl.GeoJSONSource({
    data: {}
});

var overlayData = {
    'id': 'overlayData',
    'type': 'circle',
    'source': 'overlayDataSource',
    'interactive': true,
    'layout': {
        visibility: 'visible'
    },
    'paint': {
        'circle-radius': 15,
        'circle-color': '#5deb5e',
        'circle-blur': .9
    }
};

// Map ready
map.on('style.load', function(e) {
    init();


    function init() {

        addGeolocationMarker();

        map.addSource('overlayDataSource', overlayDataSource);
        map.addLayer(overlayData);

        addMapboxLayers(map, ['data-review', 'mapillary','toronto']);

        getOverlayFeatures();

        map.on('click', function(e) {

            // Add review marker
            var newOverlayFeature = {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "coordinates": [

                    ],
                    "type": "Point"
                },

            };

            var clickedOverlayFeatures = queryLayerFeatures(map, e.point, {
                layers: ['overlayData'],
                radius: 10
            });
            if (clickedOverlayFeatures.length) {
                overlayFeatureForm(clickedOverlayFeatures[0]);

            } else {
                overlayFeatureForm();
            }

            function overlayFeatureForm(feature) {
                var formOptions = "<div class='radio-pill pill pad2y clearfix' style='width:350px'><input id='valid' type='radio' name='review' value='valid' checked='checked'><label for='valid' class='col4 button short icon check fill-green'>Valid</label><input id='redundant' type='radio' name='review' value='redundant'><label for='redundant' class='col4 button short icon check fill-mustard'>Redundant</label><input id='invalid' type='radio' name='review' value='invalid'><label for='invalid' class='col4 button icon short check fill-red'>Invalid</label></div>";
                var formReviewer = "<fieldset><label>Reviewed by: <span id='reviewer' style='padding:5px;background-color:#eee'></span></label><input type='text' name='reviewer' placeholder='OSM username'></input></fieldset>"
                var popupHTML = "<h3>" + "Review Data" + "</h3><form>" + formOptions + formReviewer + "<a id='save-review' class='button col4' href='#'>Save</a><a id='delete-review' class='button quiet fr col4' href='#' style=''>Delete</a></form>";
                var popup = new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(popupHTML)
                    .addTo(map);

                // Show existing status if available
                if (feature) {
                    $("input[name=review][value=" + feature.properties["status"] + "]").prop('checked', true);
                    $("#reviewer").html(feature.properties["reviewed_by"]);
                    newOverlayFeature = feature;
                    newOverlayFeature["id"] = feature.properties["id"];
                    console.log("Existing feature", feature);
                } else {
                    newOverlayFeature.properties["name"] = "restriction";
                    newOverlayFeature.geometry.coordinates = e.lngLat.toArray();
                }

                // Set reviewer name if previously saved
                if (reviewer) {
                    $("input[name=reviewer]").val(reviewer);
                }

                // Update dataset with feature status on clicking save
                document.getElementById("save-review").onclick = function() {
                    newOverlayFeature.properties["status"] = $("input[name=review]:checked").val();
                    reviewer = $("input[name=reviewer]").val();
                    newOverlayFeature.properties["reviewed_by"] = reviewer;
                    popup.remove();
                    mapbox.insertFeature(newOverlayFeature, datasetID, function(err, response) {
                        console.log(response);
                        overlayFeatureCollection.features = overlayFeatureCollection.features.concat(response);
                        overlayDataSource.setData(overlayFeatureCollection);
                    });
                };
                // Delete feature on clicking delete
                document.getElementById("delete-review").onclick = function() {
                    popup.remove();
                    mapbox.deleteFeature(newOverlayFeature["id"], datasetID, function(err, response) {
                        console.log(response);
                    });
                };
            }

        });

    }


    // Get data from a Mapbox dataset
    var overlayFeatureCollection = {
        'type': 'FeatureCollection',
        'features': []
    };

    function getOverlayFeatures(startID) {

        var url = DATASETS_BASE + 'features';
        var params = {
            'access_token': mapboxAccessDatasetToken
        };

        // Begin with the last feature of previous request
        if (startID) {
            params.start = startID;
        }

        $.getJSON(url, params, function(data) {

            console.log(data);

            if (data.features.length) {
                data.features.forEach(function(feature) {
                    // Add dataset feature id as a property
                    feature.properties.id = feature.id;
                });
                overlayFeatureCollection.features = overlayFeatureCollection.features.concat(data.features);
                var lastFeatureID = data.features[data.features.length - 1].id;
                getOverlayFeatures(lastFeatureID);
                overlayDataSource.setData(overlayFeatureCollection);
            }
            overlayDataSource.setData(overlayFeatureCollection);
        });
    }

});

// Toggle visibility of a layer
function toggle(id) {
    var currentState = map.getLayoutProperty(id, 'visibility');
    var nextState = currentState === 'none' ? 'visible' : 'none';
    map.setLayoutProperty(id, 'visibility', nextState);
}

// Toggle a set of filters for a set of layers
function toggleLayerFilters(layerItems, filterItem) {

    for (var i in layerItems) {
        for (var j in toggleLayers[layerItems[i]].layers) {

            var existingFilter = map.getFilter(toggleLayers[layerItems[i]].layers[j]);

            // Construct and add the filters if none exist for the layers
            if (typeof existingFilter == 'undefined') {
                map.setFilter(toggleLayers[layerItems[i]].layers[j], toggleFilters[filterItem].filter);
            } else {
                // Not implemented
                var newFilter = mergeLayerFilters(existingFilter, toggleFilters[filterItem].filter);
                map.setFilter(toggleLayers[layerItems[i]].layers[j], newFilter);
                // console.log(newFilter);
            }

        }
    }
}

function addGeolocationMarker() {
    map.addSource('single-point', {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    });

    map.addLayer({
        "id": "point",
        "source": "single-point",
        "type": "circle",
        "paint": {
            "circle-radius": 10,
            "circle-color": "#007cbf"
        }
    });

    // Listen for the `geocoder.input` event that is triggered when a user
    // makes a selection and add a marker that matches the result.
    geolocate.on('geolocate', function(ev) {
        console.log(e);
    });

    map.on('geolocate', function(e) {
        console.log(e);
    });
}
