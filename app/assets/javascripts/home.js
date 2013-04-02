// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

var your_location = null;
var friends_location = null;

function get_location_from_response(response) {
  return response.results[0].geometry.location;
};

function set_your_location(response) {
  your_location = get_location_from_response(response);
};

function set_friends_location(response) {
  friends_location = get_location_from_response(response);
};

// TODO(simon): format/sprintf equivalent?
var geocoding_url_template = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=';
var mission = 'mission, sf';
var marina = 'marina, sf'

jQuery.get(geocoding_url_template + mission , set_your_location);
jQuery.get(geocoding_url_template + marina , set_friends_location);
