/* ----------------------------------------------------------------------------------- */
/* Created and maintained by the Delaware Valley Regional Planning Commission--------- */
/* Author(s): Christopher Pollard, Robert Beatty, Michael Ruane, Jesse Strangfield --- */
/* Date Updated: July 2017 ----------------------------------------------------------- */
/* Version: 2.0.1 Beta --------------------------------------------------------------- */ 
/* ----------------------------------------------------------------------------------- */


//Extend L.GeoJSON -- add setOptions method
L.GeoJSON = L.GeoJSON.extend({
    setOptions: function(opts) {
        //save original json data
        this._data = this._data || this.toGeoJSON();
        //destory layer group
        this.clearLayers();
        L.setOptions(this, opts);
        //recreate layer group
        this.addData(this._data);
    },
    //return polygon layers that contain the given point
    identify: function(latlng) {
        var geopoint = {
                type: 'Point',
                coordinates: [latlng.lng, latlng.lat]
            },
            features = new L.FeatureGroup();
        this.eachLayer(function(layer) {
            if (gju.pointInPolygon(geopoint, layer.feature.geometry)) {
                features.addLayer(layer);
            }
        }); 
        return features;

    }
});


var map;
var mapLayers = [];
var identifyLayers = [2017, 2015, 2012, 2010, 2007, 2005, 2004, 2003, 2002];
var layer_ids = [];
var searchLayers = [];


// Initialize Document Ready
 $(document).ready(function(){       
 
    // Modal controls //

        // Open on page load //
        $('#about-modal').modal();    
        
        // Open on click
        $("#about-modal-open").on('click', function(){
            $('#about-modal').modal('show'); return false;
        });

        $("#how-modal-open").on('click', function(){
            $('#how-modal').modal('show'); return false;
        });



    // Build tooltip //

    $('.legend-button').hover(function(){
        $(this).tooltip("toggle");
    });

    $('#report-link').hover(function(){
        $(this).next().tooltip("toggle");
    });



    //Layer Control Modifications //

    $('input:checkbox[name="layerTCDI"]').on('change', function() {    
        var layers = []; 
        $('input:checkbox[name="layerTCDI"]').each(function() {

            // Remove all overlay layers//

            hideLayer($(this).attr('id'));
            if ($('#' + $(this).attr('id')).is(':checked')) {

                // Add checked layers to array //

                showLayer($(this).attr('id'));
                layers.push(parseInt($(this).attr('id')));
                if ($(this).next().hasClass("legend-button-not-toggled")) {
                    $(this).next().removeClass("legend-button-not-toggled").addClass("legend-button-toggled");
                    var oldimg = $(this).next().attr('src');                    
                    $(this).next().attr('src', oldimg.replace('gray', 'dark')); 
                }
                else{
                    $(this).next().addClass("legend-button-toggled");
                }
            }



            // Switch legend images based on checkbox status//

            else{
                if ($(this).next().hasClass("legend-button-toggled")) {
                    $(this).next().removeClass("legend-button-toggled").addClass("legend-button-not-toggled");
                    var oldimg = $(this).next().attr('src');
                    $(this).next().attr('src', oldimg.replace('dark', 'gray'));
                }
                else{
                    $(this).next().addClass("legend-button-not-toggled");
                    var oldimg = $(this).next().attr('src');                    
                    $(this).next().attr('src', oldimg.replace('dark', 'gray'));                    
                }
            }
        });
        identifyLayers = layers;
    });



    // Sidebar toggle //

    $("#sidebar-toggle").click(function(){
        $('#map').toggleClass('col-sm-7 col-lg-8 col-sm-12 col-lg-12');
        var sidebarCheck = $('#sidebar').css("display");
        if (sidebarCheck == "block"){
            $('#sidebar').css("display", "none");
            map.addLayer(CartoDB_Positron);
        }
        else {
            $('#sidebar').css("display", "block");
        };
        map.invalidateSize();
        return false;
    });

    $




// End Document Ready //
});



// Populate new Layer groups

function onEachFeature(feature, featureLayer) {
    var lg = mapLayers[feature.properties.YR];
    if (lg === undefined) {
        lg = new L.layerGroup();
        lg.addTo(map);
        mapLayers[feature.properties.YR] = lg;
    }
    featureLayer.on({
        click: TCDIID,
        mouseover: hover,
        mouseout: resetHighlight,
        dblclick: zoomToFeature
    });

    //add the feature to the layer
    lg.addLayer(featureLayer);
    searchLayers.push({
        name: feature.properties.PROJECTNAM,
        source: "TCDI",
        id: L.stamp(featureLayer),
        bounds: featureLayer.getBounds(),
        year: feature.properties.YR
    });
}


function hover(e) {
    var layer = e.target;
    var props = layer.feature.properties;
    layer.setStyle({
        weight: 3
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
};


function resetHighlight(e) {
    var layer = e.target;
    //return layer to back of map
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToBack();
    }
    TCDI.resetStyle(e.target);
    layer.setStyle({
        weight: 1.51
    });
}
function showLayer(id) {
    var lg = mapLayers[id];
    map.addLayer(lg);
    
}

function hideLayer(id) {
    var lg = mapLayers[id];
    map.removeLayer(lg);

}



var map;
map = L.map("map", {
    minZoom: 9,
    zoomControl: true,
});

// Basemap Layers

var Mapbox_dark = L.tileLayer.provider('MapBox.crvanpollard.hghkafl4')

var Mapbox_Imagery = L.tileLayer(
    'https://api.mapbox.com/styles/v1/crvanpollard/cimpi6q3l00geahm71yhzxjek/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY3J2YW5wb2xsYXJkIiwiYSI6Ii00ZklVS28ifQ.Ht4KwAM3ZUjo1dT2Erskgg', {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

var CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

// set view to leeds, and add layer. method chaining, yumm.
map.addLayer(CartoDB_Positron);

// TCDI layers for all years
var TCDI = L.geoJson(null, {
    style: function(feature) {
        switch (feature.properties.YR) {
                    case 2002: 
                        return {
                            color: "#CB181D",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true 
                        };
                    case 2003:
                        return {
                            color: "#F46D43",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                    case 2004:
                        return {
                            color: "#82C2EA",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                    case 2005:
                        return {
                            color: "#87BB40",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                    case 2007:
                        return {
                            color: "#CF128A",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                    case 2010:
                        return {
                            color: "#B53E98",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                    case 2012:
                        return {
                            color: "#0061A6",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                    case 2015:
                        return {
                            color: "#DFC27D",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                    case 2017:
                        return {
                            color: "#1A9641",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: .55,
                            clickable: true
                        };
                }
        clickable: true   
    },
    onEachFeature: onEachFeature
});

$.getJSON("data/tcdi_master.geojson", function(data) {
    TCDI.addData(data);
});

var DVRPC = L.geoJson(null, {
    style: {
        stroke: true,
        fillColor: 'none',
        color: '#282828',
        weight: 3,
        fill: true,
        opacity: 1,
        fillOpacity: 0.70,
        clickable: false
    },
    onEachFeature: function(feature, layer) {}
});
$.getJSON("data/CountyDVRPC.js", function(data) {
    DVRPC.addData(data);
}).complete(function() {
    map.fitBounds(DVRPC.getBounds());
});

(DVRPC).addTo(map);
(DVRPC).bringToFront(map);
(TCDI).addTo(map);



var baseLayers = {
    "Streets (Dark)": Mapbox_dark,
    "Streets (Grey)": CartoDB_Positron,
    "Satellite": Mapbox_Imagery
};

var layerControl = L.control.layers(baseLayers).addTo(map);

var viewCenter = new L.Control.ViewCenter();
map.addControl(viewCenter);

var scaleControl = L.control.scale({
    position: 'bottomright'
});

// create an empty layer group to store the results and add it to the map
var results = new L.LayerGroup().addTo(map);

// var searchControl = new L.esri.Controls.Geosearch().addTo(map);


// // listen for the results event and add every result to the map
// searchControl.on("results", function(data) {
//     results.clearLayers();
//     for (var i = data.results.length - 1; i >= 0; i--) {
//         results.addLayer(L.circleMarker(data.results[i].latlng));
//     }
// });

//Action on feature selections////////////
function zoomToPoint(e) {
    var layer = e.target;
    var latLng = layer.getLatLng();
    map.setView(latLng, 15);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}





// --------------------- //
// Layer Click Functions //
// --------------------- //

    // Sidebar Build //

    function createView(layer) {
        var props = layer.feature.properties;
        var amt = (parseInt(props.AMOUNT)/1000).toFixed(0)
        if (props.WEBLINK ==='na'){ 
            var wblink = (props.TITLE);}
        else { 
            var wblink = '<a class="titleTooltip" href="'+(props.WEBLINK)+'" target="_blank" data-toggle="tooltip" data-placement="top" data-trigger="hover" data-title="Click to view report">'+ (props.TITLE) +'<i class="glyphicon glyphicon-folder-open" style="padding: 5px 10px; font-size: 12px;"></i></a>'
                ;}
     

        if (props.YR === 2002){ var bancolor = '#CB181D';}
        else if (props.YR === 2003){
            var bancolor = '#F46D43';
        }
        else if (props.YR === 2004){
            var bancolor = '#82C2EA';
        }
        else if (props.YR === 2005){
            var bancolor = '#87BB40';
        }
        else if (props.YR === 2007){
            var bancolor = '#CF128A';
        }
        else if (props.YR === 2010){
            var bancolor = '#B53E98';
        }
        else if (props.YR === 2012){
            var bancolor = '#0061A6';
        }    
        else if (props.YR === 2015){
            var bancolor = '#DFC27D';
        }
        else {
            var bancolor ='#1A9641';
        }



        if (props.PROJ_DESC2 === undefined){ 
            var pd2 = '';
        }
        else { 
            var pd2 = (props.PROJ_DESC2) ;
        }

        if (props.PROJ_DESC3 === undefined ){ 
            var pd3 = '';}
        else { 
            var pd3 = (props.PROJ_DESC3) ;}



        if (props.GEOGRAPHY === 'County'){
            var muni = "<span style='font-style: normal;'>Countywide:</span> "+(props.CO_NAME)+" County, "+(props.STATE);
        }
        else if (props.GEOGRAPHY === 'Multi-Municipal'){
            var muni = "Multiple Municipalities";
        }
        else {
            var muni = (props.MUN_NAME)+", "+(props.STATE);
        }
     

        var info = '<div class="projectinfo"><h4 id="titlepr" style="background-color:' + bancolor+';">'
        + '<p id="label-year">'+(props.YR)+'</p>' 
        + '<span id="report-link">' + wblink+'</span><p id="muni-label">' + muni +'</p></div></h4>'
        + '<div class="row" style="margin-bottom:5px;"><div class="col-sm-4">'
        + '<p id="money">$'+ amt + "k</p><p id='money2'>Awarded</p></div>"
        + "<div class='col-sm-8' id='desc'><p><b>Description: </b>"+(props.PROJ_DESC)+pd2+pd3+"</div>"
        + "</div></div>"; 

         // Apend built HTML to sidebar
        $('#infosidebar').append(info);
        $('#legend-tab a[href="#Results"]').tab('show');
        length++;
        var sidebarCheck = $('#sidebar').css("display")
        if (sidebarCheck == "none"){
            $('#sidebar').css("display", "block");
            $('#map').toggleClass("col-sm-12 col-lg-12 col-lg-8 col-sm-7");
            $('.leaflet-map-pane').css('transform', 'translate3d(0px, 0px,0px)');
            map.invalidateSize();
            return false;
        }
    }

    // Search to make sure layer is visible //

    function yearSearch(key, array){
        for (var i=0; i < array.length; i++){
            if (array[i] === key.feature.properties.YR){
                createView(key);
            }
        }
    }

    // Trigger this function on layer click //

    function TCDIID(e) {
        $('#click_help').hide();
        $('#infosidebar').html('');
        var layers = TCDI.identify(e.latlng);
        var layerArray = [];
        layers.eachLayer(function(f) {
            layerArray.push(f);
        })
        var sorted = layerArray.sort(function(a,b){return b.feature.properties.YR-a.feature.properties.YR});
        sorted.forEach(function(f){
            yearSearch(f, identifyLayers);
        });
    }




//----------------------------------- //
// ------ Search Functionality ------ //
//----------------------------------- //


    // Toggle Searchbar on icon click //

    $("#search-open").on('click', function(){
        var searchChk = $('#search-container').css("display");
        if (searchChk == 'none'){
            $("#search-container").css("display", "block");
        }
        else{
            $("#search-container").css("display", "none");
        }
    });

    // Activate search when cursor is in search container //

    $("#searchbox").click(function(){
        $(this).select();
    });

    // Search functions //

    $(document).one("ajaxStop", function () {
        map.fitBounds(DVRPC.getBounds());
        $("#loading").hide();

        var projectBH = new Bloodhound({
            name: "TCDI",
            datumTokenizer: function (d) {
                return Bloodhound.tokenizers.whitespace(d.name);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: searchLayers,
            limit: 10
        });
        
         projectBH.initialize();
        
         // instantiate the typeahead UI
        $("#searchbox").typeahead({
            minLength: 2,
            highlight: true,
            hint: false
        }, {
            name: "TCDI",
            displayKey: "name",
            source: projectBH.ttAdapter(),
        }).on("typeahead:select", function (obj, datum) {
            if (datum.source === "TCDI") {
                map.fitBounds(datum.bounds);
                (map._layers[datum.id]).bringToFront(map);
                (map._layers[datum.id]).setStyle({
                    weight: 3,
                    color: "#f9e372",
                    fillOpacity: 1
                });
                $('#infosidebar').html('');
                createView(map._layers[datum.id]);
            }
            if ($(".navbar-collapse").height() > 50) {
                $(".navbar-collapse").collapse("hide");
            }
        }).on("typeahead:opened", function () {
            $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
            $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
        }).on("typeahead:closed", function () {
            $(".navbar-collapse.in").css("max-height", "");
            $(".navbar-collapse.in").css("height", "");
        });
        $(".twitter-typeahead").css("position", "static");
        $(".twitter-typeahead").css("display", "block");
    });



//------------------------------------------- //
// ------ Opacity Slider Functionality ------ //
//------------------------------------------- //

    // Opacity Slider sourced from lizardtechblog | github.com/lizardtechblog

    var opacitySlider = new L.Control.opacitySlider();
    map.addControl(opacitySlider);
    opacitySlider.setOpacityLayer(TCDI);
    TCDI.setStyle({
        fillOpacity: 0.6
    });


    // Prevent map dragging when slider is active //

    $('#slide').on('mouseover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        map.dragging.disable();
    });

    $('#slide').on('mouseout', function() {
        map.dragging.enable();
    });

    $('#slide').slider({
        reversed: false
    }).on('slide', function(e) {
        e.preventDefault();
        e.stopPropagation();
        map.dragging.disable();
        var sliderVal = e.value;
        TCDI.setStyle({
            fillOpacity: sliderVal / 100
        });
    });

    $('#slide').slider({
        reversed: false
    }).on('slideStop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        map.dragging.enable();
    });







// Placeholder hack for IE
if (navigator.appName == "Microsoft Internet Explorer") {
    $("input").each(function() {
        if ($(this).val() == "" && $(this).attr("placeholder") != "") {
            $(this).val($(this).attr("placeholder"));
            $(this).focus(function() {
                if ($(this).val() == $(this).attr("placeholder")) $(this).val("");
            });
            $(this).blur(function() {
                if ($(this).val() == "") $(this).val($(this).attr("placeholder"));
            });
        }
    });
}