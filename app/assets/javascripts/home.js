// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

var map;

function get_location_from_response(response) {
  return response.results[0].geometry.location;
};

// TODO(simon): format/sprintf equivalent?
var geocoding_url_template = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=';
var explore_url_template = 'https://api.foursquare.com/v2/venues/explore?query=coffee&client_id=XOBCADAGYQQDQMRZGQVX5Y4DF3CVCATJUIJEGB5UXQ2PESZZ&client_secret=4GZ31YY4KRJZXMW0O0DSHNAEY4MH0GJNKA0PUEXC4BACO3LQ&v=20130330';

function explore(your_location, friends_location) {
  var explore_url = explore_url_template + '&ll=' + your_location.lat + ',' + your_location.lng;
  jQuery.get(explore_url);
};

$(document).ready(initialize);

function initialize() {
  // TODO: replace center with calculated center
  var mapOptions = {
    center: new google.maps.LatLng(37.777499,-122.418594),
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  map = new google.maps.Map(document.getElementById("map-canvas"),
      mapOptions);
}

function place_location_markers(you, friend) {
  var you_marker = new google.maps.Marker({
    position: new google.maps.LatLng(you.lat, you.lng),
    map: map,
    title: 'You'
  });
  
  var friend_marker = new google.maps.Marker({
    position: new google.maps.LatLng(friend.lat, friend.lng),
    map: map,
    title: 'Your friend'
  });
  
}

$("#go").click(function() {
  var your_location = $("#addy1").val();
  var friend_location = $("#addy2").val();

  var your_location_req = $.get(geocoding_url_template + your_location);
  var friends_location_req = $.get(geocoding_url_template + friend_location);

  var locations = {};

  your_location_req.done(function(your_response) {
    your_location = get_location_from_response(your_response);
    friends_location_req.done(function(friends_response){
      friends_location = get_location_from_response(friends_response);
      place_location_markers(your_location, friends_location);
      explore(your_location, friends_location);
    })
  });
});

$("#addy2").keyup(function(event){
  if(event.which == 13) {
    $("#go").click();
  }
});
