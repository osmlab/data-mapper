# data-mapper
A map tool to help review and add external data into OpenStreetMap

![](https://cloud.githubusercontent.com/assets/126868/16585021/6925a510-42dc-11e6-8754-5cadb2bc3fef.gif)

## Features
- Overlay an open dataset with an OSM basemap
- Custom visualization of map data and basemap
- Links to inspect the map location in JOSM
- Mapillary photo layer

## Customizing for your own project
Every data mapping project needs to have these components:
- A [Mapbox tileset ID](https://www.mapbox.com/api-documentation/#uploads) that contains data to be overlaid onto the map
- A [GL style](https://www.mapbox.com/mapbox-gl-style-spec/) blurb that defines how to visualize this data
- A [Mapbox dataset ID](https://www.mapbox.com/api-documentation/#datasets) to store the data of the review markers

Instructions on how to customize will be updated afetr https://github.com/osmlab/data-mapper/issues/5

## Develop
- Clone the repo and `cd`
- `npm install && npm start`
