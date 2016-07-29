// Configure the source layer that you want to use to add to the target
// Reference: The reference data source used to compare data
// Validation: The validation style layer used to compare with the source
var project = {
    name: 'Toronto Turn Restrictions',
    map: {
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',
        center: [-79.38, 43.65],
        zoom: 16
    },
    accessToken: 'pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ',
    mapping: {
        source: {
            layer: 'toronto',
            layer_url: 'http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=c61136899e02b210VgnVCM1000003dd60f89RCRD&vgnextchannel=7807e03bb8d1e310VgnVCM10000071d60f89RCRD',
            attribution: 'Contains information licensed under the Open Government Licence – Toronto',
            attribution_url: 'http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=4a37e03bb8d1e310VgnVCM10000071d60f89RCRD',
            published_date: '01-03-2016'
        },
        target: {
            layer: 'osm-navigation'
        },
        status: {
            layer: 'data-review',
            dataset: {
                user: 'theplanemad',
                accessToken: 'sk.eyJ1IjoidGhlcGxhbmVtYWQiLCJhIjoiY2lyN2RobWgyMDAwOGlrbWdkbWp2cWdjNiJ9.AnPKx0Iqk-uzARdoOthoFg',
                mapid: 'cir7dq562000eiflw3vesbh88'
            }
        }
    }
}

// Export module
module.exports = project;
