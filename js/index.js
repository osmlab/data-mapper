// Mapbox Configuration
var mapboxglUtils = require('./mapbox-gl-utils');
var MapboxClient = require('mapbox/lib/services/datasets');
var datasetID = 'cir7dq562000eiflw3vesbh88';
var DATASETS_BASE = 'https://api.mapbox.com/datasets/v1/theplanemad/' + datasetID + '/';
var mapboxAccessDatasetToken = 'sk.eyJ1IjoidGhlcGxhbmVtYWQiLCJhIjoiY2lyN2RobWgyMDAwOGlrbWdkbWp2cWdjNiJ9.AnPKx0Iqk-uzARdoOthoFg';
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

        map.addSource('overlayDataSource', overlayDataSource);
        map.addLayer(overlayData);

        mapboxglUtils.addMapboxLayers(map, ['data-review', 'mapillary', 'toronto', 'osm-navigation']);

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

            var clickedOverlayFeatures = mapboxglUtils.queryLayerFeatures(map, e.point, {
                layers: ['overlayData'],
                radius: 10
            });
            if (clickedOverlayFeatures.length) {
                overlayFeatureForm(clickedOverlayFeatures[0]);

            } else {
                overlayFeatureForm();
            }

            function overlayFeatureForm(feature) {

                var josm_button = mapboxglUtils.createHTML(map, 'open-obj-in-josm-button');

                var formOptions = "<div class='radio-pill pill pad2y clearfix' style='width:350px'><input id='valid' type='radio' name='review' value='valid' checked='checked'><label for='valid' class='col4 button short icon check fill-green'>Valid</label><input id='redundant' type='radio' name='review' value='redundant'><label for='redundant' class='col4 button short icon check fill-mustard'>Redundant</label><input id='invalid' type='radio' name='review' value='invalid'><label for='invalid' class='col4 button icon short check fill-red'>Invalid</label></div>";
                var formReviewer = "<fieldset><label>Reviewed by: <span id='reviewer' style='padding:5px;background-color:#eee'></span></label><input type='text' name='reviewer' placeholder='OSM username'></input></fieldset>"
                var popupHTML = "<h3>" + "Review Data " + josm_button + "</h3><form>" + formOptions + formReviewer + "<a id='save-review' class='button col4' href='#'>Save</a><a id='delete-review' class='button quiet fr col4' href='#' style=''>Delete</a></form>";
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

// Export module
// if (window.mapboxgl) {
//     mapboxgl.dataMapper = dataMapper;
// } else if (typeof module !== 'undefined') {
//     module.exports = dataMapper;
// }
