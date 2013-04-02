// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

function get_location_from_response(response) {
  return response.results[0].geometry.location;
};

// TODO(simon): format/sprintf equivalent?
var geocoding_url_template = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=';
var mission = 'mission, sf';
var marina = 'marina, sf'

var your_location_req = jQuery.get(geocoding_url_template + mission);
var friends_location_req = jQuery.get(geocoding_url_template + marina);



var locations = {};

var explore_url_template = 'https://api.foursquare.com/v2/venues/explore?query=coffee&client_id=XOBCADAGYQQDQMRZGQVX5Y4DF3CVCATJUIJEGB5UXQ2PESZZ&client_secret=4GZ31YY4KRJZXMW0O0DSHNAEY4MH0GJNKA0PUEXC4BACO3LQ&v=20130330';

your_location_req.done(function(your_response) {
  your_location = get_location_from_response(your_response);
  friends_location_req.done(function(friends_response){
    friends_location = get_location_from_response(friends_response);
    explore(your_location, friends_location);
  })
});

function explore(your_location, friends_location) {
  var explore_url = explore_url_template + '&ll=' + your_location.lat + ',' + your_location.lng;
  jQuery.get(explore_url);
};
