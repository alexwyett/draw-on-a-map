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
        strokeColor: '#FF0000',
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        mapOptions: {
            center:             new google.maps.LatLng(55.55, -2.06),
            zoom:               6,
            panControl:         false,
            zoomControl:        true,
            mapTypeControl:     false,
            scaleControl:       false,
            streetViewControl:  false,
            overviewMapControl: false,
            rotateControl:      false,
            mapTypeId:          google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi',
                    'stylers': [
                        {
                            visibility: 'off'
                        }
                    ]
                }
            ]
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
        trace = null,
        bounds = new google.maps.LatLngBounds();
   
    /**
     * Class boolean variables
     *
     * @access private
     */
    var beingDragged = false;
   
    /**
     * Class objects
     *
     * @access public
     */
    this.options = {}, 
    this.elem = {};
    
    // --------------------------- Public  Methods -------------------------- //
   
    /**
     * Class constructor
     *
     * @param function callback Callback function
     *
     * @access public
     */    
    this.init = function(callback) {
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

        // Attempt to load the map state from storage
        var getparams = _getLocalStorage();

        if (Object.keys(getparams).length == 4) {
                
            // Get map params from url
            var zoom = parseInt(getparams.zoom);
            var center = new google.maps.LatLng(
                getparams.centerY, 
                getparams.centerX
            );
                
            // Create new map and set draggable mode
            _createMap(true);
            
            // Loop through map points and add to map
            var mapPoints = JSON.parse(getparams.points);
            if (mapPoints.length > 0) {
                for(var i = 0; i < mapPoints.length; i++) {
                    _placeMarker(
                        new google.maps.LatLng(
                            mapPoints[i].k,
                            mapPoints[i].A
                        )
                    );
                }
                    
                // Add first marker and redraw map
                _placeMarker(
                    points[0]
                );
            }
            
            // Set map zoom and center
            plugin.map.setCenter(center);
            plugin.map.setZoom(zoom);
        } else {
            // Create a new map
            _createMap(false);
        }
        
        // Call empty loader function if provided
        if (typeof callback === 'function') {
            callback();
        }
    }

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

        // Clear the local storage
        window.localStorage.removeItem('DrawOnAMap:Points');
        window.localStorage.removeItem('DrawOnAMap:zoom');
        window.localStorage.removeItem('DrawOnAMap:center:x');
        window.localStorage.removeItem('DrawOnAMap:center:y');

        bounds = new google.maps.LatLngBounds();
        points = [];
        trace = null;

        // Call empty reset function
        this.onReset();
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
     * @access public
     */
    this.getActiveListeners = function() {
        return activeListeners;
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

    /**
     * Return the points array
     *
     * @access public
     */
    this.getPoints = function() {
        return points;
    }

    /**
     * Return the map bounds
     *
     * @access public
     */
    this.getBounds = function() {
        return bounds;
    }

    /**
     * Empty functions which can be overriden.
     *
     * @access public
     */
    this.onComplete = function() {}
    this.onReset = function() {}
    this.onDraw = function() {}
    this.onSaveState = function() {}

    /**
     * Method used to check if a point is inside the drawn area
     *
     * @access public
     */
    this.containsPoint = function(point) {
        return google.maps.geometry.poly.containsLocation(point, trace);
    }
   
    // --------------------------- Private Methods -------------------------- //
       
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
        if (_contains(activeListeners, 'mousedown') === false) {
            google.maps.event.addListener(plugin.map, 'mousedown', function(event) {

                // Unset any previous lines
                _clearOverlays();
                points = [];
                bounds = new google.maps.LatLngBounds();

                // Record the fact that the line is being drawn
                plugin.setActiveMode();

                // Place a marker at the start point
                _placeMarker(event.latLng);
                
                // Add the mouse move listener
                _addMouseMoveListener();
            
            });
            activeListeners.push('mousedown');
        }
   }

    /**
     * Mouse move listener
     *
     * @access private
     */
    function _addMouseMoveListener() {
        if (_contains(activeListeners, 'mousemove') === false) {
            google.maps.event.addListener(plugin.map, 'mousemove', function(event) {
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

            // Remove mouse move listener
            _removeListener('mousemove');

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
        
        // Set CSS styles for the DIV containing the control
        // Setting padding to 5 px will offset the control
        // from the edge of the map
        var container = document.createElement('div');
        container.index = 1;
        container.className = 'dysMapControlContainer';
        
        // Add in controls to map
        for(i in controls) {
            // Setup the click event listeners
            google.maps.event.addDomListener(
                controls[i].control,
                'click',
                controls[i].func
            );
    
            container.appendChild(controls[i].control);
        }
           
        plugin.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
            container
        );
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
        
        // Create container div
        var controlDiv = document.createElement('div');
        controlDiv.className = 'dysMapControl';

        // Set CSS for the control border
        var controlUI = document.createElement('a');
        controlUI.className = 'dysMapControlInner';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior
        var controlText = document.createElement('span');
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

        // Call empty draw function
        plugin.onDraw();

        // Draw the line/polygon
        if (points[0] == points[points.length-1] && points.length > 2) {
            // The trace has been completed, so display a polygon
            trace = new google.maps.Polygon({
                path: points,
                strokeColor: plugin.options.strokeColor,
                fillColor: plugin.options.fillColor,
                fillOpacity: plugin.options.fillOpacity,
                strokeWeight: plugin.options.strokeWeight,
                clickable: false // This needs to be false, otherwise the line
                                 // consumes the 'mouseup' event if the mouse is
                                 // over the line when the mouse button is released
            });

            // Call the complete function
            plugin.onComplete();
        } else {
            // The trace hasn't been completed yet, so display a line
            trace = new google.maps.Polyline({
                path: points,
                strokeColor: plugin.options.strokeColor,
                strokeWeight: plugin.options.strokeWeight,
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
     * Get all of the get parameters from local storage
     *
     * @access private
     */
    function _getLocalStorage() {
        var vars = {};
        if (plugin.persistMap === true) {
            if (typeof Storage !== 'undefined') {
                if (window.localStorage.getItem('DrawOnAMap:Points') !== null) {
                    vars.points = window.localStorage.getItem('DrawOnAMap:Points');
                    vars.zoom = window.localStorage.getItem('DrawOnAMap:zoom');
                    vars.centerX = window.localStorage.getItem('DrawOnAMap:center:x');
                    vars.centerY = window.localStorage.getItem('DrawOnAMap:center:y');
                }
            } else {
                throw new Error(
                    'Unable to persist! Local Storage is not available.'
                );
            }
        }
        return vars;
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
        bounds.extend(location);
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
            if (typeof Storage !== 'undefined' && typeof JSON !== 'undefined') {
                var mapPoints = JSON.stringify(points);
                window.localStorage.setItem('DrawOnAMap:Points', mapPoints);
                window.localStorage.setItem('DrawOnAMap:zoom', plugin.map.getZoom());
                window.localStorage.setItem('DrawOnAMap:center:x', plugin.map.getCenter().lng());
                window.localStorage.setItem('DrawOnAMap:center:y', plugin.map.getCenter().lat());
            } else {
                throw new Error(
                    'Unable to persist! Local Storage is not available.'
                );
            }
        }
        
        // Call save state function
        plugin.onSaveState();
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
}
