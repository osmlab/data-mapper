var mapLayers = require('map-layers.js');
var MapboxClient = require('mapbox/lib/services/datasets');
var dataset = 'cip0lqsk4001s7nlwogm8rzeo';
var DATASETS_BASE = 'https://api.mapbox.com/datasets/v1/planemad/' + dataset + '/';
var mapboxAccessDatasetToken = 'sk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiY2lvdHNnd2xmMDBjb3VvbThmaXlsbnd5dCJ9.7Ui7o2K3U6flUzDGvYNZJw';
var mapbox = new MapboxClient(mapboxAccessDatasetToken);

var reviewer;
var _tmp = {};

mapboxgl.accessToken = 'pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ';
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/planemad/cipqsuf2g000ldmnobna12vam', //stylesheet location
    center: [77.64, 12.98], // starting position
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
                }
            };

            var clickedOverlayFeatures = map.queryRenderedFeatures([
                [e.point.x - 5, e.point.y - 5],
                [e.point.x + 5, e.point.y + 5]
            ], {
                layers: ['overlayData']
            });
            if (clickedOverlayFeatures.length) {
                overlayFeatureForm(clickedOverlayFeatures[0]);

            } else {
                overlayFeatureForm();
            }

            function overlayFeatureForm(feature) {
                var formOptions = "<div class='radio-pill pill pad1y clearfix'><input id='valid' type='radio' name='review' value='tree' checked='checked'><label for='tree' class='short button icon check fill-green'>tree</label><input id='sapling' type='radio' name='review' value='sapling'><label for='sapling' class='short button icon check fill-red'>sapling</label></div>";
                var formReviewer = "<fieldset><label>Contributed by: <span id='reviewer' style='padding:5px;background-color:#eee'></span></label><input type='text' name='reviewer' placeholder='name'></input></fieldset>"
                var popupHTML = "<form>" + formOptions + formReviewer + "<a id='updateOverlayFeature' class='button col4' href='#'>Save</a><a id='deleteOverlayFeature' class='button quiet fr col4' href='#' style=''>Delete</a></form>";
                var popup = new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(popupHTML)
                    .addTo(map);

                // Show existing status if available
                if (feature) {
                    $("input[name=review][value=" + feature.properties["natural"] + "]").prop('checked', true);
                    $("#reviewer").html(feature.properties["contributed_by"]);
                    newOverlayFeature = feature;
                    newOverlayFeature["id"] = feature.properties["id"];
                    console.log(feature);
                } else {
                    newOverlayFeature.geometry.coordinates = e.lngLat.toArray();
                }

                // Set reviewer name if previously saved
                if (reviewer) {
                    $("input[name=reviewer]").val(reviewer);
                }

                // Update dataset with feature status on clicking save
                document.getElementById("updateOverlayFeature").onclick = function() {
                    newOverlayFeature.properties["natural"] = $("input[name=review]:checked").val();
                    reviewer = $("input[name=reviewer]").val();
                    newOverlayFeature.properties["contributed_by"] = reviewer;
                    popup.remove();
                    mapbox.insertFeature(newOverlayFeature, dataset, function(err, response) {
                        console.log(response);
                        overlayFeatureCollection.features = overlayFeatureCollection.features.concat(response);
                        overlayDataSource.setData(overlayFeatureCollection);
                    });
                };
                // Delete feature on clicking delete
                document.getElementById("deleteOverlayFeature").onclick = function() {
                    popup.remove();
                    mapbox.deleteFeature(newOverlayFeature["id"], dataset, function(err, response) {
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
