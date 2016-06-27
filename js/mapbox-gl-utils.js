// Utility functions to work with Mapbox GL JS maps
// Requires mapbox-gl.js and jquery
// - Toggle visibility of a layer


// Toggle visibility of a layer
function toggle(id) {
    var currentState = map.getLayoutProperty(id, 'visibility');
    var nextState = currentState === 'none' ? 'visible' : 'none';
    map.setLayoutProperty(id, 'visibility', nextState);
}

// Hide all except one layer from a group
function showOnlyLayers(toggleLayers, showLayerItem) {
    for (var layerItem in toggleLayers) {
        for (var layer in toggleLayers[layerItem].layers) {
            if (showLayerItem == layerItem)
                map.setLayoutProperty(toggleLayers[layerItem].layers[layer], 'visibility', 'visible');
            else
                map.setLayoutProperty(toggleLayers[layerItem].layers[layer], 'visibility', 'none');
        }
    }
    // Highlight menu items
    $('.toggles a').removeClass('active');
    $('#' + showLayerItem).addClass('active');
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

// Parse the toggleFilters to build the compound filter arrays
function parseToggleFilters() {
    for (var filterItem in toggleFilters) {

        var parsedFilter = new Array();
        parsedFilter.push(toggleFilters[filterItem]['filter-mode']);

        for (var value in toggleFilters[filterItem]['filter-values']) {
            var filter = new Array();
            filter.push(toggleFilters[filterItem]['filter-compare'][0], toggleFilters[filterItem]['filter-compare'][1], toggleFilters[filterItem]['filter-values'][value]);
            parsedFilter.push(filter);
        }

        toggleFilters[filterItem]['filter'] = parsedFilter;
    }
}

// Merge two GL layer filters into one
function mergeLayerFilters(existingFilter, mergeFilter) {
    var newFilter = new Array();

    // If the layer has a simple single filter
    if (existingFilter[0] == '==') {
        newFilter.push("all", existingFilter, mergeFilter)
    }

    return newFilter;
}

// Return a square bbox of pixel coordinates from a given x,y point
function pixelPointToSquare(point, width) {
    var pointToSquare = [
        [point.x - width / 2, point.y - width / 2],
        [point.x + width / 2, point.y + width / 25]
    ];
    return pointToSquare;
}


//
// OpenStreetMap Utilities
//

// Return features near a paoint from a set of map layers
function queryLayerFeatures(map, point, opts) {

    var queryResults = map.queryRenderedFeatures(pixelPointToSquare(point, opts.radius), {
        layers: opts.layers
    });

    return queryResults;

}

//Open map location in JOSM
function openInJOSM(map, opts) {
    var bounds = map.getBounds();
    var top = bounds.getNorth();
    var bottom = bounds.getSouth();
    var left = bounds.getWest();
    var right = bounds.getEast();
    // var josmUrl = 'https://127.0.0.1:8112/load_and_zoom?left='+left+'&right='+right+'&top='+top+'&bottom='+bottom;
    var josmUrl = 'http://127.0.0.1:8111/load_and_zoom?left=' + left + '&right=' + right + '&top=' + top + '&bottom=' + bottom;
    $.ajax(josmUrl, function() {});
}


function createHTML(map, type, opts) {
    var HTML, url, obj_type;
    if ('open-obj-in-josm-button') {
        if (opts){
        node_ids = ',n' + opts.select_node_ids[0] + ',n' + opts.select_node_ids[1];
        url = 'http://127.0.0.1:8111/load_object?new_layer=true&objects=' + opts.obj_type + opts.obj_id + node_ids + '&relation_members=true';
      } else {
        var bounds = map.getBounds();
        var top = bounds.getNorth();
        var bottom = bounds.getSouth();
        var left = bounds.getWest();
        var right = bounds.getEast();
        url = 'http://127.0.0.1:8111/load_and_zoom?left=' + left + '&right=' + right + '&top=' + top + '&bottom=' + bottom;
      }
    }
    HTML = '<a class="button short" target="_blank" href=' + url + '>Open in JOSM</a>';
    return HTML;
}

// Configure layer names for base map for proper layer positioning
var mapboxLayerIDs = {
    "water": "water",
    "label": "poi-scalerank3",
    "roads": "tunnel-street-low"
}

// Configure filters for some layers
var mapillaryRestrictionsFilter = ["in", "value", "regulatory--no-left-turn--us", "regulatory--no-right-turn--us", "regulatory--no-straight-through--us", "regulatory--no-u-turn--us", "regulatory--no-left-or-u-turn--us", "regulatory--no-left-turn--ca", "regulatory--no-right-turn--ca", "regulatory--no-straight-through--ca", "regulatory--no-u-turn--ca", "regulatory--no-left-or-u-turn--ca"]

// Configure common data layers
// "template-name": {
//   "groups": [{
//     "name": "group-name",
//     "source": {},
//     "layers": [{
//       "name": "layer-name",
//     }]
//   }]
// },

var mapboxLayers = {
  "osm-navigation": {
    "groups": [{
      "name": "turn-restrictions",
      "source": {
          type: 'vector',
          url: 'mapbox://planemad.turnrestrictions'
      },
      "layers": [{
          "id": "noturn",
          "type": "line",
          "source-layer": "turnrestrictions",
          "minzoom": 13,
          "interactive": true,
          "layout": {
              "visibility": "visible",
              "line-cap": "round"
          },
          "paint": {
              "line-color": "hsl(10, 96%, 53%)",
              "line-width": 1
          }
      },{
          "id": "noturn from",
          "type": "line",
          "source-layer": "turnrestrictions",
          "interactive": true,
          "filter": [
              "==",
              "relations_role",
              "from"
          ],
          "layout": {
              "visibility": "visible",
              "line-cap": "round"
          },
          "paint": {
              "line-color": "hsl(0, 51%, 77%)",
              "line-opacity": 0.55,
              "line-width": 4
          }
      },{
          "id": "noturn via",
          "type": "circle",
          "source-layer": "turnrestrictions",
          "interactive": true,
          "filter": [
              "all",
              [
                  "==",
                  "$type",
                  "Point"
              ],
              [
                  "==",
                  "relations_role",
                  "via"
              ]
          ],
          "layout": {
              "visibility": "visible"
          },
          "paint": {
              "circle-color": "hsl(10, 96%, 53%)",
              "circle-radius": 3
          }
      }]
    }]
  },
    "toronto": {
        "groups": [{
            "name": "centreline",
            "source": {
                type: 'vector',
                url: 'mapbox://planemad.dgman5ok'
            },
            "layers": [{
                "id": "toronto-intersection-centreline",
                "type": "line",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-intersection-centreline",
                "minzoom": 15,
                "interactive": true,
                "layout": {
                    "visibility": "visible",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "hsl(307, 100%, 84%)",
                    "line-width": 1,
                    "line-opacity": 1
                }
            }]
        }, {
            "name": "restrictions",
            "source": {
                type: 'vector',
                url: 'mapbox://planemad.cymhxqyx'
            },
            "layers": [{
                "id": "toronto-turn-restrictions copy",
                "type": "circle",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "layout": {
                    "visibility": "visible"
                },
                "paint": {
                    "circle-color": "hsl(0, 0%, 25%)",
                    "circle-radius": 4,
                    "circle-opacity": {
                        "base": 1,
                        "stops": [
                            [
                                14,
                                1
                            ],
                            [
                                19,
                                0
                            ]
                        ]
                    }
                }
            }, {
                "id": "toronto-turn-restrictions type left",
                "type": "circle",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "filter": [
                    "==",
                    "TURN_DIR_C",
                    "LEFT"
                ],
                "layout": {},
                "paint": {
                    "circle-color": "hsl(0, 100%, 49%)",
                    "circle-radius": 3,
                    "circle-opacity": 0.8
                }
            }, {
                "id": "toronto-turn-restrictions type right",
                "type": "circle",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "filter": [
                    "==",
                    "TURN_DIR_C",
                    "RIGHT"
                ],
                "layout": {},
                "paint": {
                    "circle-color": "hsl(43, 100%, 50%)",
                    "circle-radius": 3,
                    "circle-opacity": 0.8
                }
            }, {
                "id": "toronto-turn-restrictions type straight",
                "type": "circle",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "filter": [
                    "==",
                    "TURN_DIR_C",
                    "STRAIGHT"
                ],
                "layout": {},
                "paint": {
                    "circle-color": "hsl(98, 100%, 51%)",
                    "circle-radius": 3,
                    "circle-opacity": 0.8
                }
            }, {
                "id": "toronto-turn-restrictions",
                "type": "line",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "layout": {
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "hsl(0, 100%, 50%)",
                    "line-width": 2
                }
            }, {
                "id": "toronto-turn-restrictions no-left",
                "type": "line",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "filter": [
                    "==",
                    "TURN_DIR_C",
                    "LEFT"
                ],
                "layout": {
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "hsl(0, 100%, 49%)",
                    "line-width": 2
                }
            }, {
                "id": "toronto-turn-restrictions no-right",
                "type": "line",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "filter": [
                    "==",
                    "TURN_DIR_C",
                    "RIGHT"
                ],
                "layout": {
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "hsl(43, 100%, 50%)",
                    "line-width": 2
                }
            }, {
                "id": "toronto-turn-restrictions no-straight",
                "type": "line",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "filter": [
                    "==",
                    "TURN_DIR_C",
                    "STRAIGHT"
                ],
                "layout": {
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "hsl(98, 100%, 51%)",
                    "line-width": 2
                }
            }, {
                "id": "toronto-turn-restrictions label",
                "type": "symbol",
                "metadata": {
                    "mapbox:group": "1466615567526.5813"
                },
                "source": "composite",
                "source-layer": "toronto-no-other-turns",
                "interactive": true,
                "layout": {
                    "text-size": 12,
                    "text-allow-overlap": false,
                    "icon-image": "triangle-15",
                    "text-ignore-placement": false,
                    "symbol-spacing": 2,
                    "text-font": [
                        "Clan Offc Pro Medium",
                        "Arial Unicode MS Regular"
                    ],
                    "icon-rotate": -269,
                    "icon-allow-overlap": false,
                    "symbol-placement": "line",
                    "text-justify": "center",
                    "text-offset": [
                        0, -0.5
                    ],
                    "icon-optional": false,
                    "text-rotation-alignment": "map",
                    "icon-size": 0.6,
                    "text-anchor": "bottom",
                    "text-field": "NO {TURN_DIR_C}"
                },
                "paint": {
                    "text-color": "hsl(0, 1%, 40%)",
                    "text-halo-color": "hsl(0, 0%, 100%)",
                    "text-halo-width": 2
                }
            }]
        }]
    },
    "mapillary": {
        "groups": [{
            "name": "traffic-signs",
            "source": {
                "type": "vector",
                "tiles": [
                    // "https://crossorigin.me/http://mapillary-vector.mapillary.io/tiles/{z}/{x}/{y}.mapbox?ors=key,l,package,value,validated,image_key,user,score,obj,rect",
                    "http://mapillary-vector.mapillary.io/tiles/{z}/{x}/{y}.mapbox?ors=key,l,package,value,validated,image_key,user,score,obj,rect",
                ],
                "minzoon": 14,
                "maxzoom": 18
            },
            "layers": [{
                "name": "circle",
                "type": "circle",
                'source-layer': 'ors',
                "paint": {
                    "circle-radius": 2,
                    "circle-color": "grey"
                }
            }, {
                "name": "turn-restriction",
                "type": "circle",
                'source-layer': 'ors',
                "paint": {
                    "circle-radius": 4,
                    "circle-color": "#05d107"
                },
                "filter": mapillaryRestrictionsFilter
            }, {
                "name": "turn-restriction-label",
                "type": "symbol",
                "source-layer": "ors",
                "layout": {
                    "text-field": "{value}",
                    "text-size": 8,
                    "text-offset": [0, 2]
                },
                "paint": {
                    "text-color": "black",
                    "text-halo-color": "white",
                    "text-halo-width": 1
                }
            }]
        }, {
            "name": "coverage",
            "source": {
                "type": "vector",
                "tiles": [
                    "https://d2munx5tg0hw47.cloudfront.net/tiles/{z}/{x}/{y}.mapbox"
                ],
                "minzoom": 2,
                "maxzoom": 16
            },
            "layers": [{
                "name": "line",
                "type": "line",
                "source-layer": "mapillary-sequences",
                "paint": {
                    "line-color": 'grey',
                    "line-width": 1,
                    "line-opacity": 0.3
                }
            }]
        }]
    }
}

// Add commonly used data layers and styles to a Mapbox map
function addMapboxLayers(map, layers) {

    for (var i in layers) {
        if (layers[i] in mapboxLayers) {

            // Add the defined source and layers for each group
            var groupName = layers[i];

            for (var j in mapboxLayers[layers[i]].groups) {

                // Add the group source
                var sourceName = groupName + ' ' + mapboxLayers[layers[i]].groups[j].name;
                map.addSource(sourceName, mapboxLayers[layers[i]].groups[j].source);

                // Add the group style layers
                for (var k in mapboxLayers[layers[i]].groups[j].layers) {

                    // Generate unique layer ID and source
                    if ("name" in mapboxLayers[layers[i]].groups[j].layers[k]) {
                        mapboxLayers[layers[i]].groups[j].layers[k]["id"] = sourceName + ' ' + mapboxLayers[layers[i]].groups[j].layers[k].name;
                        delete mapboxLayers[layers[i]].groups[j].layers[k]["name"];
                    }
                    mapboxLayers[layers[i]].groups[j].layers[k]["source"] = sourceName;

                    map.addLayer(mapboxLayers[layers[i]].groups[j].layers[k]);

                }
            }
        }
    }

}
