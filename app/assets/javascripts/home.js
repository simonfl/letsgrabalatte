// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

var map;
var bounds;
var max_results = 10;

function get_location_from_response(response) {
  return response.results[0].geometry.location;
};

// TODO(simon): format/sprintf equivalent?
var geocoding_url_template = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=';
var explore_url_template = 'https://api.foursquare.com/v2/venues/explore?client_id=XOBCADAGYQQDQMRZGQVX5Y4DF3CVCATJUIJEGB5UXQ2PESZZ&client_secret=4GZ31YY4KRJZXMW0O0DSHNAEY4MH0GJNKA0PUEXC4BACO3LQ&v=20130330&limit=' + max_results;

// From http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
function deg2rad(deg) {
  return deg * (Math.PI/180)
}
function distance_between_locations_in_m(location1, location2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(location2.lat - location1.lat);
  var dLon = deg2rad(location2.lng-location1.lng); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(location1.lat)) * Math.cos(deg2rad(location2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = (R * c) * 1000; // Distance in m
  return d;
}

function suggested_radius(location1, location2) {
  return distance_between_locations_in_m(location1, location2) / 3;
}

function middle_point(location1, location2) {
  var location = []
  location.lat = (location1.lat + location2.lat) / 2;
  location.lng = (location1.lng + location2.lng) / 2;
  return location;
};


function add_to_map(name, location) {
  var latlng = new google.maps.LatLng(location.lat, location.lng)
  new google.maps.Marker({
    position: latlng,
    map: map,
    title: name,
    animation: google.maps.Animation.DROP
  });
  bounds.extend(latlng);
  map.fitBounds(bounds);
};

function add_explore_result_to_map(index, item) {
  var venue = item.venue;
  var name = venue.name;
  var location = venue.location;
  add_to_map(name, location);
};

function explore(center, your_location, friends_location, type) {
  var radius = suggested_radius(your_location, friends_location);
  var explore_url = explore_url_template + '&ll=' + center.lat + ',' + center.lng + '&radius=' + radius + '&query=' + type;

  jQuery.get(explore_url, function(response) {
    if (typeof response == 'string') response = $.parseJSON(response);
    jQuery.each(response.response.groups[0].items, add_explore_result_to_map);
  });
};

function initialize() {
  // TODO: replace center with calculated center
  var mapOptions = {
    center: new google.maps.LatLng(37.777499,-122.418594),
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  bounds = new google.maps.LatLngBounds();
  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}

function place_location_markers(you, friend) {
  add_to_map('You', you);
  add_to_map('Your friend', friend);
}

function go(type) {
  $("#pre-submit").hide();
  $("#post-submit").show();
  initialize();
  var your_location = $("#addy1").val();
  var friend_location = $("#addy2").val();

  var your_location_req = $.get(geocoding_url_template + your_location);
  var friends_location_req = $.get(geocoding_url_template + friend_location);

  your_location_req.done(function(your_response) {
    if (typeof your_response == "string") your_response = $.parseJSON(your_response);
    your_location = get_location_from_response(your_response);
    friends_location_req.done(function(friends_response){
      if (typeof friends_response == 'string') friends_response = $.parseJSON(friends_response);
      friends_location = get_location_from_response(friends_response);
      var center = middle_point(your_location, friends_location);
      place_location_markers(your_location, friends_location);
      explore(center, your_location, friends_location, type);
    })
  });

}

$("#gocoffee").click(function() {
  go("coffee");
});

$("#gobeer").click(function() {
  go("drinks");
});


$("#addy2").keyup(function(event){
  if(event.which == 13) {
    $("#go").click();
  }
});

$("#again").click(function(){
  $("#pre-submit").show();
  $("#post-submit").hide();
})
