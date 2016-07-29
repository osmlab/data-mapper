// Project Settings
var map = require('./map');
var mapboxglUtils = require('./mapbox-gl-utils');


var MapboxClient = require('mapbox/lib/services/datasets');
var datasetID = 'cipxubqqz0081hwks1vwhiir2';
var DATASETS_BASE = 'https://api.mapbox.com/datasets/v1/planemad/' + datasetID + '/';
var mapboxAccessDatasetToken = 'sk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiY2lvdHNnd2xmMDBjb3VvbThmaXlsbnd5dCJ9.7Ui7o2K3U6flUzDGvYNZJw';
var mapbox = new MapboxClient(mapboxAccessDatasetToken);


var reviewer;
var _tmp = {};


// Layer for review markers
var overlayDataSource = new mapboxgl.GeoJSONSource();

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

        mapboxglUtils.getOverlayFeatures();

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

});
