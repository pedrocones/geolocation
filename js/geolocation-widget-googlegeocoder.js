/**
 * @file
 *   Javascript for the Google geocoder widget.
 */
(function($, Drupal, drupalSettings) {
  "use strict";

  // Ensure and add shortcut to the geolocation object.
  var geolocation = Drupal.geolocation = Drupal.geolocation || {};

  Drupal.behaviors.geolocationGooglemaps = {
    attach: function(context, settings) {
      // Ensure itterables.
      settings.geolocation = settings.geolocation || {
        widget_maps: []
      };
      // Make sure the lazy loader is available.
      if (typeof geolocation.load_google === 'function') {
        // First load the library from google.
        geolocation.load_google(function() {
          // This won't fire until window load.
          initialize(settings.geolocation.widget_maps);
        });
      }
    }
  };

  /**
   * Adds the click listeners to the map.
   * @param map
   */
  geolocation.add_click_listener = function(map) {
    // Used for a single click timeout.
    var singleClick;
    // Add the click listener.
    google.maps.event.addListener(map.google_map, 'click', function(e) {
      // Create 500ms timeout to wait for double click.
      singleClick = setTimeout(function() {
        geolocation.codeLatLng(e.latLng, map, 'marker');
        geolocation.setMapMarker(e.latLng, map);
      }, 500);
    });
    // Add a doubleclick listener.
    google.maps.event.addListener(map.google_map, 'dblclick', function(e) {
      clearTimeout(singleClick);
    });
  };

  /**
   * Runs after the google maps api is available
   *
   * @param maps
   */
  function initialize(maps) {
    // Process drupalSettings for every Google map present on the current page.
    $.each(maps, function(widget_id, map) {

      // Get the container object.
      map.container = document.getElementById(map.id);

      if ($(map.container).length >= 1 && !$(map.container).hasClass('geolocation-processed') && typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
        // Add any missing settings.
        map.settings = $.extend(geolocation.default_settings(), map.settings);

        // Set the lat / lng from HTML5 GetPosition if not already set.
        if (map.lat === 0 || map.lng === 0) {

          if (navigator.geolocation) {

            // Get the geolocation from the browser.
            navigator.geolocation.getCurrentPosition(

              // Success handler for getCurrentPosition()
              function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                var accuracy = position.coords.accuracy;

                // Set the values of hidden form inputs.
                $(".geolocation-hidden-lat").val(lat);
                $(".geolocation-hidden-lng").val(lng);

                // Set the marker on the position.
                map.marker = new google.maps.Marker({
                  position: {
                    lat,
                    lng
                  },
                  map: map.google_map,
                  title: Drupal.t('Your current position')
                });
                // Draw a radius circle around position
                var circle = new google.maps.Circle({
                  center: {
                    lat,
                    lng
                  },
                  radius: accuracy,
                  map: map.google_map,
                  fillColor: '#4285F4',
                  fillOpacity: 0.2,
                  strokeColor: '#4285F4',
                  strokeOpacity: 0.5,
                });

                //set the zoom level to the circle's size
                map.google_map.fitBounds(circle.getBounds());

                // Remove the circle if user readjusts the position manually
                google.maps.event.addListener(map.google_map, 'click', function(e) {
                  circle.setMap(null);
                });
              },

              // Error handler for getCurrentPosition()
              function(error) {

                // Alert with error message.
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    alert(Drupal.t('No location data found. Reason: PERMISSION_DENIED.'));
                    break;
                  case error.POSITION_UNAVAILABLE:
                    alert(Drupal.t('No location data found. Reason: POSITION_UNAVAILABLE.'));
                    break;
                  case error.TIMEOUT:
                    alert(Drupal.t('No location data found. Reason: TIMEOUT.'));
                    break;
                  default:
                    alert(Drupal.t('No location data found. Reason: Unknown error.'));
                    break;
                }
              },
              // Options for getCurrentPosition()
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 6000
              }
            );

          }

          map.lat = $('.geolocation-hidden-lat.for-' + map.id).attr('value');
          map.lng = $('.geolocation-hidden-lng.for-' + map.id).attr('value');
        }

        // Add the map by ID with settings.
        geolocation.add_map(map);

        // Add the geocoder to the map.
        geolocation.add_geocoder(map);

        // Add the click responders for setting the value.
        geolocation.add_click_listener(map);

        // Set the already processed flag.
        $(map.container).addClass('geolocation-processed');
      }
    });
  }

})(jQuery, Drupal, drupalSettings);
