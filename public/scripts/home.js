// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.
$(document).ready(function() {

var map;
var bounds;
var max_results = 10;
var markers = [];
var cur_icon;

function get_location_from_response(response) {
  return response.results[0].geometry.location;
}

// TODO(simon): format/sprintf equivalent?
var geocoding_url_template = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=';
var explore_url_template = 'https://api.foursquare.com/v2/venues/explore?client_id=XOBCADAGYQQDQMRZGQVX5Y4DF3CVCATJUIJEGB5UXQ2PESZZ&client_secret=4GZ31YY4KRJZXMW0O0DSHNAEY4MH0GJNKA0PUEXC4BACO3LQ&v=20130330&limit=' + max_results;

function updateURI(location1, location2) {
  var parameters = {
    'location1': location1,
    'location2': location2
  };
  location.hash = 'location1=' + encodeURIComponent(location1) + "&location2=" + encodeURIComponent(location2);
}

function parseURI() {
    var hash = location.hash;
    var parameters = {};
    if (hash) {
      var split_hash = hash.substring(1, hash.length).split('&');
      jQuery.each(split_hash, function (index, item) {
          var split_item = item.split('=');
           var key = decodeURIComponent(split_item[0]);
           var value = decodeURIComponent(split_item[1]);
           parameters[key] = value;
      });
    }
    return parameters;
}

// From http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
function deg2rad(deg) {
  return deg * (Math.PI/180);
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
  var location = [];
  location.lat = (location1.lat + location2.lat) / 2;
  location.lng = (location1.lng + location2.lng) / 2;
  return location;
}


function add_to_map(name, location, icon_url, venue_id) {
  var latlng = new google.maps.LatLng(location.lat, location.lng);
  var marker = new google.maps.Marker({
    position: latlng,
    map: map,
    title: name,
    icon: icon_url,
    zIndex: 1
  });
  
  if (venue_id) {
    markers.push(marker);
    google.maps.event.addListener(marker, 'mouseover', function () {
      cur_icon = this.getIcon();
      this.setOptions({zIndex:10, icon:'images/icon_star_32.png'});
      $('#' + venue_id).addClass('highlight');
    });
    google.maps.event.addListener(marker, 'mouseout', function () {
      this.setOptions({zIndex:1, icon:cur_icon});
      $('#' + venue_id).removeClass('highlight');
    });
  }
  
  bounds.extend(latlng);
  map.fitBounds(bounds);
}

function add_to_list(item) {
  var venue_url = "https://foursquare.com/v/" + item.venue.id;
  list_item = '<h5><a href="' + venue_url + '" target="new">' + item.venue.name + '</a></h5>';
  list_item += item.venue.location.address;
  list_item += " <span class='small'>(" + item.venue.location.crossStreet + ")</span>";
  list_item += " <a href=\"sms:?body=Let's meet here! " + venue_url + "\"><img src=\"images/sms_icon.png\" height=24 width=24/></a> ";
  $('#venue-list').append('<li id="' + item.venue.id + '">' + list_item + '</li>');
}

function add_explore_result_to_map(index, item) {
  var venue = item.venue;
  var name = venue.name;
  var location = venue.location;
  var icon_url = venue.categories[0].icon.prefix + 'bg_32' + venue.categories[0].icon.suffix;
  add_to_map(name, location, icon_url, venue.id);
  add_to_list(item);
}

function explore(center, location1, location2, type) {
  var radius = suggested_radius(location1, location2);
  var explore_url = explore_url_template + '&ll=' + center.lat + ',' + center.lng + '&radius=' + radius + '&query=' + type;

  var jqxhr = $.getJSON(explore_url, function(response) {
    if(response.response.warning) {
      $('#messages').text(response.response.warning.text);
    }
    jQuery.each(response.response.groups[0].items, add_explore_result_to_map);
  })
  .fail(function(response) {
    if (typeof response.responseText == 'string') error_response = $.parseJSON(response.responseText);
    $('#messages').text(error_response.meta.errorDetail);
  });
}

function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(37.777499,-122.418594),
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  bounds = new google.maps.LatLngBounds();
  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  
  $('#venue-list').empty();
  $('#messages').text('');
}

function place_location_markers(you, friend) {
  add_to_map('You', you, 'http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png');
  add_to_map('Your friend', friend, 'http://www.google.com/intl/en_us/mapfiles/ms/micons/yellow-dot.png');
}

function go(type) {
  $("#pre-submit").hide();
  $("#post-submit").show();
  initialize();

  var locationstr1 = $("#addy1").val();
  var locationstr2 = $("#addy2").val();
  updateURI(locationstr1, locationstr2);
  
  var location1_req = $.getJSON(geocoding_url_template + locationstr1);
  var location2_req = $.getJSON(geocoding_url_template + locationstr2);

  location1_req.done(function(your_response) {
    var location1 = get_location_from_response(your_response);
    location2_req.done(function(friends_response){
      var location2 = get_location_from_response(friends_response);
      var center = middle_point(location1, location2);
      place_location_markers(location1, location2);
      explore(center, location1, location2, type);
    });
  });

}

$(document).on('mouseenter', 'li', function() {
  var index = $('li').index($(this));
  cur_icon = markers[index].getIcon();
  markers[index].setZIndex(10);
  markers[index].setIcon('images/icon_star_32.png');
});
$(document).on('mouseleave', 'li', function() {
  var index = $('li').index($(this));
  markers[index].setZIndex(1);
  markers[index].setIcon(cur_icon);
});

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
});

var params = parseURI();
var location1 = params['location1'];
if (location1) {
  $("#addy1").val(location1);
}
var location2 = params['location2'];
if (location2) {
  $("#addy2").val(location2);
}

});
