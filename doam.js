/**
 * Object used for map searching
 * 
 * @param string elemId  Target Element ID you wish to be the map
 * @param array  options Array of options
 * 
 * @type object
 */
function MapSearch(elemId)
{
    /**
     * Default google map options
     * 
     * @type object
     */
    var defaultMapOptions = {
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
    };
    
    /**
     * Marker array
     *
     * @access private
     */
    var controls = [], 
        markersArray = [];
       
    /**
     * Markers array setter
     *
     * @param object marker
     *
     * @access private
     */
    this.addMarker = function(marker) {
        markersArray.push(marker);
    };
    
    /**
     * Clear the markers array
     * 
     * @returns void
     */
    this.clearMarkers = function() {
        if (this.markersArray && this.markersArray.length > 0) {
            for (i in this.markersArray) {
                markersArray[i].setMap(null);
            }
            markersArray = [];
        }
    };
    
    /**
     * Return the default map options
     * 
     * @returns object
     */
    this.getDefaultMapOptions = function() {
        return defaultMapOptions;
    };
    
    /**
     * Return the markers array
     * 
     * @returns {MapSearch.markersArray|Array}
     */
    this.getMarkers = function() {
        return markersArray;
    };
    
    /**
     * Extend the options of the class
     * 
     * @access public
     *
     * @return array
     */
    this.extend = function() {
        for(var i=1; i<arguments.length; i++) {
            for(var key in arguments[i]) {
                if(arguments[i].hasOwnProperty(key)) {
                    arguments[0][key] = arguments[i][key];
                }
            }
        }
        return arguments[0];
    };
    
    /**
     * Array contains function
     *
     * @param Array  a   comparison array
     * @param Object obj comparison object
     *
     * @access public
     */
    this.contains = function(a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i] === obj) {
                return true;
            }
        }
        return false;
    };
    
    /**
     * Generic map constructor
     * 
     * @param {Object} elem    Target Element
     * @param {Object} options Map options
     * 
     * @returns {google.map}
     */
    this.createMap = function(elem, options) {
        return new google.maps.Map(
           elem,
           options
        );
    };
    
    /**
     * Function to create a custom map control
     *
     * @param string   label Control Label
     * @param function func  Control callback function
     *
     * @access public
     */
    this.createControl = function(label, func) {
        
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
    
    this.getControls = function() {
        return controls;
    }
    
    


    /**
     * The the controls on a google map.
     *
     * @param {google.map} map Google Map object
     *
     * @access public
     */
    this.setControls = function(map) {
        
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
        
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
            container
        );
    }
}

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
        fillOpacity: 0.2
    };
   
    /**
     * Class arrays
     *
     * @access private
     */
    var activeListeners = [], 
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
    
    /**
     * Option to save the map state using local storage and reload on page 
     * refresh.
     * 
     * @type Boolean
     */
    this.persistMap = false;
    
    // --------------------------- Public  Methods -------------------------- //
   
    /**
     * Class constructor
     *
     * @param function callback Callback function
     *
     * @access public
     */    
    this.init = function(callback) {
        
        // Merge map defaults with line defaults
        defaults.mapOptions = plugin.getDefaultMapOptions();
        
        // Initialise public options
        plugin.options = plugin.extend({}, defaults, options);
       
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
        
        // Create a new map
        _createMap(false);
        
        // Look for local storage
        if (Object.keys(getparams).length == 4) {
                
            // Get map params from url
            var zoom = parseInt(getparams.zoom);
            var center = new google.maps.LatLng(
                getparams.centerY, 
                getparams.centerX
            );
                
            // Set draggable mode on map
            _toggleDragMode(true);
            
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
        }
        
        // Call empty loader function if provided
        if (typeof callback === 'function') {
            callback();
        }
    };

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
    };

    /**
     * Get the draggable state
     *
     * @access public
     */
    this.isDraggable = function() {
        return plugin.map.draggable;
    };

    /**
     * Return the map object
     *
     * @access public
     */
    this.getMap = function() {
        return this.map;
    };

    /**
     * @access public
     */
    this.getActiveListeners = function() {
        return activeListeners;
    };
       
    /**
     * Set the draggable set
     *
     * @access public
     */
    this.setActiveMode = function() {
        beingDragged = true;
    };
   
    /**
     * Unset the draggable set
     *
     * @access public
     */
    this.unSetActiveMode = function() {
        beingDragged = false;
    };
   
    /**
     * Get the draggable state
     *
     * @access public
     */
    this.isActive = function() {
       return beingDragged;
    };

    /**
     * Return the points array
     *
     * @access public
     */
    this.getPoints = function() {
        return points;
    };

    /**
     * Return the map bounds
     *
     * @access public
     */
    this.getBounds = function() {
        return bounds;
    };

    /**
     * Empty functions which can be overriden.
     *
     * @access public
     */
    this.onComplete = function() {};
    this.onReset = function() {};
    this.onDraw = function() {};
    this.onSaveState = function() {};
    this.onZoom = function() {};
    this.onIdle = function() {};

    /**
     * Method used to check if a point is inside the drawn area
     *
     * @param LatLng point Google latlng object
     *
     * @access public
     */
    this.containsPoint = function(point) {
        return google.maps.geometry.poly.containsLocation(point, trace);
    };
   
    // --------------------------- Private Methods -------------------------- //
       
    /**
     * Drag end listener
     *
     * @access private
     */
    function _addIdleListener() {
        // Add draggable event listener
        if (plugin.contains(activeListeners, 'idle') === false) {
            google.maps.event.addListener(plugin.map, 'idle', function() {
                 _saveMapState();
                 plugin.onIdle();
            });
            activeListeners.push('idle');
        }
    }
       
    /**
     * Mouse down listener
     *
     * @access private
     */
    function _addMouseDownListener() {   
        // Add mouse down event handler
        if (plugin.contains(activeListeners, 'mousedown') === false) {
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
        if (plugin.contains(activeListeners, 'mousemove') === false) {
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
        if (plugin.contains(activeListeners, 'zoom_changed') === false) {
            google.maps.event.addListener(plugin.map, 'zoom_changed', function() {
                // Call zoomStart for custom functions
                plugin.onZoom();
                
                // Unset active mode
                if (plugin.isActive()) {
                    plugin.unSetActiveMode();
                }
                
                // Saving zoom level is handled by the idle listener
            });
            activeListeners.push('zoom_changed');
        }
    }

    /**
     * Clears all overlays from the map
     *
     * @access private
     */
    function _clearOverlays() {
        plugin.clearMarkers();
        if (trace) {
            trace.setMap(null);
            trace = null;
        }
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
        plugin.map = plugin.createMap(
            plugin.elem, 
            plugin.options.mapOptions
        );
   
        // Add reset control
        plugin.createControl('Reset', function() {
            plugin.resetMap();
        });
       
        // Add Drag function in
        plugin.createControl('Drag', function() {
            _toggleDragMode(!plugin.isDraggable());
        });
       
        // Add in controls to map
        plugin.setControls(plugin.map);
       
        // Turn off dragable state on first load
        _toggleDragMode(draggable);
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

        plugin.addMarker(trace);
        trace.setMap(plugin.map);
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
        if (plugin.contains(activeListeners, listener)) {
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
            _removeListener('idle');
            _addMouseDownListener();
            _addMouseUpListener();
            plugin.getControls()['Drag'].controlUI.innerHTML = 'Drag';
        } else {
            _removeListener('mousemove');
            _removeListener('mousedown');
            _removeListener('mouseup');
            _addZoomChangedListener();
            _addIdleListener();
            plugin.getControls()['Drag'].controlUI.innerHTML = 'Draw';
        }
           
        // Set draggable state on map
        plugin.map.setOptions({
            draggable: draggable
        });
    }
}


/**
 * Inherit Map Search Functions
 */
DrawOnAMap.prototype = new MapSearch();