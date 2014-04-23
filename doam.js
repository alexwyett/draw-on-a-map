/**
 * Draw On a Map Google Maps Javascript library.
 *
 * Script should be initialised like this:
 *   
 * var doam = new DrawOnAMap(targetElementId);
 *
 */
function DrawOnAMap(elemId, options)
{
    /**
     * Plugin reference
     * 
     * @access private
     */
    var plugin = this;

    /**
     * Defaults
     *
     * @access private
     */
    var defaults = {
        distanceBetweenMarkers: 1000,
        lineColor: '#FF0000',
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        mapOptions: {
            center:             new google.maps.LatLng(52.689, 1.44),
            zoom:               10,
            panControl:         false,
            zoomControl:        true,
            mapTypeControl:     false,
            scaleControl:       false,
            streetViewControl:  false,
            overviewMapControl: false,
            rotateControl:      false,
            mapTypeId:          google.maps.MapTypeId.ROADMAP
        }
    };
   
    /**
     * Class arrays
     *
     * @access private
     */
    var controls = [], 
        activeListeners = [], 
        markersArray = [], 
        points = [];
   
    /**
     * Class references
     *
     * @access private
     */
    var lastMarker = null, 
        trace = null;
   
    /**
     * Class boolean variables
     *
     * @access private
     */
    var beingDragged = false;

    /**
     * Set to true if the drawn area is to be persisted on page reload
     * 
     * @access public
     */
    var persistMap = false;
   
    /**
     * Class objects
     *
     * @access public
     */
    this.options = {}, 
    this.elem = {};
        
	/**
     * Base64 allowed characters
     *
     * @access private
     */
	var _allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    
    // --------------------------- Public  Methods -------------------------- //

    /**
     * Resets the map
     *
     * @access public
     */
    this.resetMap = function() {
       // Create new map and enable drawmode
       _createMap(false);
       
       // Remove the overlay data from memory
       _clearOverlays();
       
       // Get the base url of the page
       var baseurl = _getBaseUrl();
       
       // Store the map position in the URL
       document.location = baseurl + '#';
    }

    /**
     * Get the draggable state
     *
     * @access public
     */
    this.isDraggable = function() {
        return plugin.map.draggable;
    }

    /**
     * Return the map object
     *
     * @access public
     */
    this.getMap = function() {
        return this.map;
    }
       
    /**
     * Set the draggable set
     *
     * @access public
     */
    this.setActiveMode = function() {
        beingDragged = true;
    }
   
    /**
     * Unset the draggable set
     *
     * @access public
     */
    this.unSetActiveMode = function() {
        beingDragged = false;
    }
   
    /**
     * Get the draggable state
     *
     * @access public
     */
    this.isActive = function() {
       return beingDragged;
    }
   
    // --------------------------- Private Methods -------------------------- //
   
    /**
     * Class constructor
     *
     * @access private
     */    
    function _construct() {
        // Initialise public options
        plugin.options = _extend({}, defaults, options);
       
        // Get the element
        var elem = document.getElementById(elemId);
        
        // Test for element
        if (elem === null) {
           throw new Error('Unable to find element with id of: ' + elemId);
        }
       
        // Set element
        plugin.elem = elem;

        // Attempt to load the map state from the URL
        var getparams = _getUrlVars();
        if (getparams.length == 4) {
                
            // Create new map and set draggable mode
            _createMap(true);
                
            // Get map params from url
            var zoom = parseInt(getparams['zoom']);
            var center = new google.maps.LatLng(
                getparams['centerY'], 
                getparams['centerX']
            );
                
            var points_string = _decode(getparams['points']);
            var points_array = points_string.split(';');
            for(var i = 0; i < points_array.length; i++) {
                var coords = points_array[i].split(',');
                var lat = coords[0];
                var lng = coords[1];
                _placeMarker(
                    new google.maps.LatLng(
                        lat, 
                        lng
                    )
                );
            }
                
            // Add first marker and redraw map
            _placeMarker(points[0]);
            
            // Set map zoom and center
            plugin.map.setCenter(center);
            plugin.map.setZoom(zoom);
        } else {
            // Create a new map
            _createMap(false);
        }
    }
       
    /**
     * Drag end listener
     *
     * @access private
     */
    function _addDragEndListener() {   
        // Add draggable event listener
        if (_contains(activeListeners, 'dragend') === false) {
            google.maps.event.addListener(plugin.map, 'dragend', function() {
                 _saveMapState();
            });
            activeListeners.push('dragend');
        }
    }
       
    /**
     * Mouse down listener
     *
     * @access private
     */
    function _addMouseDownListener() {   
        // Add mouse down event handler
        google.maps.event.addListener(plugin.map, 'mousedown', function(event) {

            // Unset any previous lines
            _clearOverlays();
            points = [];

            // Record the fact that the line is being drawn
            plugin.setActiveMode();

            // Place a marker at the start point
            _placeMarker(event.latLng);
        
        });
   }

    /**
     * Mouse move listener
     *
     * @access private
     */
    function _addMouseMoveListener() {
        if (_contains(activeListeners, 'mousemove') === false) {
	       	google.maps.event.addListener(plugin.map, 'mousemove', function(event) {
		        // Check that the mouse is being dragged, otherwise the
		        // mouse is just passing over the map
		        if (plugin.isActive()) {

		            // Calculate the distance between the previous marker
		            // and the co-ordinates currentlly underneath the mouse
		            var distance = google.maps.geometry.spherical.computeDistanceBetween(
		                event.latLng,
		                lastMarker
		            );

		            // If the distance is greater than the threshold
		            // amount, drop a new marker
		            if (distance > plugin.options.distanceBetweenMarkers) {
		                _placeMarker(event.latLng);
		            }
		        }
		    });
            activeListeners.push('mousemove');
        }
    }
       
       
    /**
     * Mouse up listener
     *
     * @access private
     */
    function _addMouseUpListener() {
        // Add mouse up event handler
        google.maps.event.addListener(plugin.map, 'mouseup', function() {

            // Record the fact that the line is no longer being drawn
            plugin.unSetActiveMode();

            // Save map state to url
            _saveMapState();

            // Add the start point to the array of points - in order to
            // close up the polygon
            _placeMarker(points[0]);

            // If there are fewer than 3 points, we can't dray a line,
            // so reset the line
            if(points.length < 4) {
                _clearOverlays();
                points = [];
                throw new Error(
                    'To draw hold down the left mouse button and ' +
                    'draw your search area by dragging the ' +
                    'cursor/mouse. Do not just click, instead ' +
                    'hold the left button down.'
                );
            }
           
            // Turn off draw mode and turn on drag mode
            _toggleDragMode(true);
           
            // Save the map state
            _saveMapState();
        });
    }

	/**
	 * Zoom changed listener
     *
     * @access private
	 */
	function _addZoomChangedListener() {
	    // Add zoom change event listener
	    if (_contains(activeListeners, 'zoom_changed') === false) {
		    google.maps.event.addListener(plugin.map, 'zoom_changed', function() {
		        if (plugin.isActive()) {
		            plugin.unSetActiveMode();
		        }
		        _saveMapState();
		    });
		    activeListeners.push('zoom_changed');
	    }
	}


    /**
     * Clear and add in map controls
     *
     * @access private
     */
    function _addControls() {
        // Add in controls to map
        for(i in controls) {
            // Setup the click event listeners
            google.maps.event.addDomListener(
                controls[i].controlUI,
                'click',
                controls[i].func
            );
           
            plugin.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
                controls[i].control
            );
        }
    }
       
    /**
     * Markers array setter
     *
     * @param object marker
     *
     * @access private
     */
    function _addToMarkersArray(marker) {
        markersArray.push(marker);
    }

    /**
     * Clears all overlays from the map
     *
     * @access private
     */
    function _clearOverlays() {
        if (this.markersArray) {
            for (i in this.markersArray) {
                markersArray[i].setMap(null);
            }
            markersArray = [];
        }
        if (trace) {
            trace.setMap(null);
            trace = null;
        }
    }
   
    /**
     * Array contains function
     *
     * @param Array  a   comparison array
     * @param Object obj comparison object
     *
     * @access private
     */
    function _contains(a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i] === obj) {
                return true;
            }
        }
        return false;
    }
   
   /**
    * Create the map object
    *
    * @param boolean draggable Toggle Dragable State
    *
    * @access private
    */
   function _createMap(draggable) {
        // Create new google map with provided options
        plugin.map = new google.maps.Map(
           plugin.elem,
           plugin.options.mapOptions
        );
   
        // Add reset control
        _createControl('Reset', function() {
            plugin.resetMap();
        });
       
        // Add Drag function in
        _createControl('Drag', function() {
            _toggleDragMode(!plugin.isDraggable());
        });
       
        // Add in controls to map
        _addControls();
       
        // Turn off dragable state on first load
        _toggleDragMode(draggable);
    }
    
    /**
     * Function to create a custom map control
     *
     * @param string   label
     * @param function func
     *
     * @access private
     */
    function _createControl(label, func) {
        // Set CSS styles for the DIV containing the control
        // Setting padding to 5 px will offset the control
        // from the edge of the map
        var controlDiv = document.createElement('div');
        controlDiv.index = 1;
        controlDiv.className = 'dysMapControl';

        // Set CSS for the control border
        var controlUI = document.createElement('div');
        controlUI.style.cursor = 'pointer';
        controlUI.style.textAlign = 'center';
        controlUI.className = 'dysMapControlInner';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior
        var controlText = document.createElement('div');
        controlText.innerHTML = label;
        controlText.className = 'dysMapControlLabel';
        controlUI.appendChild(controlText);
       
        // Add to array
        controls[label] = {
            control: controlDiv,
            controlUI: controlUI,
            func: func
        }
    }

    /**
     * Add a line onto the map
     *
     * @access private
     */
    function _drawLine() {
        // Remove any previous lines
        _clearOverlays();

        // Draw the line/polygon
        if (points[0] == points[points.length-1] && points.length > 2) {
            // The trace has been completed, so display a polygon
            trace = new google.maps.Polygon({
                path: points,
                strokeColor: plugin.options.lineColor,
                fillColor: plugin.options.fillColor,
                fillOpacity: plugin.options.fillOpacity,
                strokeWeight: 2,
                clickable: false // This needs to be false, otherwise the line
                                 // consumes the 'mouseup' event if the mouse is
                                 // over the line when the mouse button is released
            });
        } else {
            // The trace hasn't been completed yet, so display a line
            trace = new google.maps.Polyline({
                path: points,
                strokeColor: plugin.options.lineColor,
                strokeWeight: 2,
                clickable: false // This needs to be false, otherwise the line
                                 // consumes the 'mouseup' event if the mouse is
                                 // over the line when the mouse button is released
            });
        }

        _addToMarkersArray(trace);
        trace.setMap(plugin.map);
    }

    /**
     * Extend the options of the class
     *
     * @return array
     */
    function _extend() {
        for(var i=1; i<arguments.length; i++) {
            for(var key in arguments[i]) {
                if(arguments[i].hasOwnProperty(key)) {
                    arguments[0][key] = arguments[i][key];
                }
            }
        }
        return arguments[0];
    }

    /**
     * Get the base url of the page
     * 
     * @access private
     */
    function _getBaseUrl() {
        return document.location.toString().substr(
            0,
            document.location.toString().indexOf('#')
        );
    }

    /**
     * Return a comma separated string of the marker points
     *
     * @access private
     */
    function _getPointsAsString() {
        var searchstring = ''
        for (i in points) {
            if (points[i].lat() != 'NaN' || points[i].lng() != 'NaN') {
                var lat = Number(points[i].lat()).toFixed(4);
                var lng = Number(points[i].lng()).toFixed(4);
                searchstring += lat
                    + ',' + lng + ';';
            }
        }
            
        // Remove last comma
        searchstring = searchstring.substring(
            0, 
            searchstring.length - 1
        );
            
        return searchstring;
    }

    /**
     * Get all of the get parameters from the url
     *
     * @access private
     */
    function _getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }

    /**
     * Get a single get parameter from a url
     *
     * @param string name
     *
     * @access private
     */
    function _getUrlVar(name) {
        return getUrlVars()[name];
    }

	/**
     * Base64 encode function
     * 
     * @param string input
     * 
     * @access private
     */
	function _encode(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = _utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            _allowedChars.charAt(enc1) + _allowedChars.charAt(enc2) +
            _allowedChars.charAt(enc3) + _allowedChars.charAt(enc4);
        }

        return output;
	}
 
	/**
     * Base64 decode function
     * 
     * @param string input
     * 
     * @access private
     */
	function _decode(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
        while (i < input.length) {
            enc1 = _allowedChars.indexOf(input.charAt(i++));
            enc2 = _allowedChars.indexOf(input.charAt(i++));
            enc3 = _allowedChars.indexOf(input.charAt(i++));
            enc4 = _allowedChars.indexOf(input.charAt(i++));
                
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = _utf8_decode(output);
        return output;
	}

    /**
     * private method for UTF-8 encoding
     *
     * @param string string
     *
     * @access private
     */
    function _utf8_encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }


    /**
     * Private method for UTF-8 decoding
     *
     * @param string utftext
     *
     * @access private
     */
    function _utf8_decode(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while ( i < utftext.length ) {
            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }


    /**
     * Add a marker into the global points array
     *
     * @param LatLng location
     * 
     * @access private
     */
    function _placeMarker(location) {
        lastMarker = location;
        points.push(location);
        _drawLine();
    }
       
    /**
     * Remove a specific listener
     * 
     * @access private
     */
    function _removeListener(listener) {
        google.maps.event.clearListeners(plugin.map, listener);
        if (_contains(activeListeners, listener)) {
            activeListeners.splice(listener, 1);
        }
    }
   
    /**
     * This function reloads the url to persist the map state
     * 
     * @access private
     */
    function _saveMapState() {
        if (plugin.persistMap === true) {
            // Get the base url of the page
            var baseurl = _getBaseUrl();
           
            // Start creating the string for the url hashbang
            var pointsString = _getPointsAsString();

            // Base64 encode the points
            pointsString = _encode(pointsString).replace('/=/g', '%3D');
           
            // Store the map position in the URL
            document.location = baseurl + '#?zoom=' + plugin.map.getZoom() +
                '&centerX=' + plugin.map.getCenter().lng() + '&centerY=' +
                plugin.map.getCenter().lat() + '&points=' + pointsString;
        }
    }

   
   /**
    * Turn dragable state on/off
    *
    * @param boolean draggable
    *
    * @access private
    */
    function _toggleDragMode(draggable) {
        // Add draw controls if not in drag mode
        if(!draggable) {
            _removeListener('zoom_changed');
            _removeListener('drag_end');
            _addMouseMoveListener();
            _addMouseDownListener();
            _addMouseUpListener();
            controls['Drag'].controlUI.innerHTML = 'Drag';
        } else {
            _removeListener('mousemove');
            _removeListener('mousedown');
            _removeListener('mouseup');
            _addZoomChangedListener();
            _addDragEndListener();
            controls['Drag'].controlUI.innerHTML = 'Draw';
        }
           
        // Set draggable state on map
        plugin.map.setOptions({
            draggable: draggable
        });
    }
   
    // Call constructor
    _construct();
}
