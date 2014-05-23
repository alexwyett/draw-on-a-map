/**
 * Object used for map searching
 * 
 * @param string elemId  Target Element ID you wish to be the map
 * @param array  options Array of options
 * 
 * @type object
 */
function MapSearch()
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
        activeListeners = [],
        markersArray = [],
        map;
    
    /**
     * Listeners array setter
     *
     * @param {string} Listener
     *
     * @access private
     */
    this.addListener = function(listener) {
        activeListeners.push(listener);
    };
       
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
     * Mouse down listener
     *
     * @access public
     */
    this.addMouseDownListener = function() {};
    this.addMouseMoveListener = function() {};
    this.addMouseUpListener = function() {};
    this.addIdleListener = function() {};
    this.addZoomChangeListener = function() {};
    this.onDragChange = function() {};
    
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
        };
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
        this.setMap(
            new google.maps.Map(
                elem,
                options
            )
        );

        return this.getMap();
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
     * Return if listener is active or not
     * 
     * @param {string} listener Listener string
     * 
     * @returns {Boolean}
     */
    this.containsListener = function(listener) {
        return this.contains(activeListeners, listener);
    };
    
    /**
     * Return the controls of the map
     * 
     * @returns {Array}
     */
    this.getControls = function() {
        return controls;
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
     * Return the map
     * 
     * @returns {MapSearch.map}
     */
    this.getMap = function() {
        return map;
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
     * Turn dragable state on/off
     *
     * @param boolean draggable
     *
     * @access private
     */
    this.toggleDragMode = function(draggable) {
        // Add draw controls if not in drag mode
        if(!draggable) {
            this.removeListener('zoom_changed');
            this.removeListener('idle');
            this.addMouseDownListener();
            this.addMouseUpListener();
        } else {
            this.removeListener('mousemove');
            this.removeListener('mousedown');
            this.removeListener('mouseup');
            this.addIdleListener();
            this.addZoomChangeListener();
        }
        
        // Draggable change event
        this.onDragChange(draggable);
           
        // Set draggable state on map
        this.getMap().setOptions({
            draggable: draggable
        });
    };
       
    /**
     * Remove a specific listener
     * 
     * @param {string} listener
     * 
     * @access private
     */
    this.removeListener = function(listener) {
        google.maps.event.clearListeners(this.getMap(), listener);
        if (this.containsListener(listener)) {
            activeListeners.splice(listener, 1);
        }
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
    };
    
    /**
     * Set the google map
     * 
     * @param {google.map} gMap Object
     * 
     * @returns {null}
     */
    this.setMap = function(gMap) {
        map = gMap;
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
    var points = [];
   
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
            plugin.toggleDragMode(true);
            
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
            plugin.getMap().setCenter(center);
            plugin.getMap().setZoom(zoom);
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
        return plugin.getMap().draggable;
    };
    
    /**
     * Draggable change event
     * 
     * @param {boolean} draggable
     * 
     * @returns {void}
     */
    this.onDragChange = function(draggable) {
        if(!draggable) {
            this.getControls()['Drag'].controlUI.innerHTML = 'Drag';
        } else {
            this.getControls()['Drag'].controlUI.innerHTML = 'Draw';
        }
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
       
    /**
     * Mouse down listener
     *
     * @access public
     */
    this.addMouseDownListener = function() {
        // Add mouse down event handler
        if (plugin.containsListener('mousedown') === false) {
            google.maps.event.addListener(plugin.getMap(), 'mousedown', function(event) {

                // Unset any previous lines
                _clearOverlays();
                points = [];
                bounds = new google.maps.LatLngBounds();

                // Record the fact that the line is being drawn
                plugin.setActiveMode();

                // Place a marker at the start point
                _placeMarker(event.latLng);
                
                // Add the mouse move listener
                plugin.addMouseMoveListener();
            });
            plugin.addListener('mousedown');
        }
    };

    /**
     * Mouse move listener
     *
     * @access public
     */
    this.addMouseMoveListener = function() {
        if (plugin.containsListener('mousemove') === false) {
            google.maps.event.addListener(plugin.getMap(), 'mousemove', function(event) {
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
            plugin.addListener('mousemove');
        }
    };

    /**
     * Mouse up listener
     *
     * @access public
     */
    this.addMouseUpListener = function() {
        // Add mouse up event handler
        google.maps.event.addListener(plugin.getMap(), 'mouseup', function() {

            // Record the fact that the line is no longer being drawn
            plugin.unSetActiveMode();

            // Remove mouse move listener
            plugin.removeListener('mousemove');

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
            plugin.toggleDragMode(true);
           
            // Save the map state
            _saveMapState();
        });
    };
       
    /**
     * Map Idle listener
     *
     * @access public
     */
    this.addIdleListener = function() {
        // Add draggable event listener
        if (plugin.containsListener('idle') === false) {
            google.maps.event.addListener(plugin.getMap(), 'idle', function() {
                _saveMapState();
                plugin.onIdle();
                plugin.addListener('idle');
            });
        }
    };
    
    /**
     * Zoom Changed listener
     *
     * @access public
     */
    this.addZoomChangeListener = function() {
        // Add zoom change event listener
        if (plugin.containsListener('zoom_changed') === false) {
            google.maps.event.addListener(plugin.getMap(), 'zoom_changed', function() {
                // Call zoomStart for custom functions
                plugin.onZoom();
                
                // Unset active mode
                if (plugin.isActive()) {
                    plugin.unSetActiveMode();
                }
                
                plugin.addListener('zoom_changed');
            });
        }
    };
   
    // --------------------------- Private Methods -------------------------- //    

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
        plugin.createMap(
            plugin.elem, 
            plugin.options.mapOptions
        );
   
        // Add reset control
        plugin.createControl('Reset', function() {
            plugin.resetMap();
        });
       
        // Add Drag function in
        plugin.createControl('Drag', function() {
            plugin.toggleDragMode(!plugin.isDraggable());
        });
       
        // Add in controls to map
        plugin.setControls(plugin.getMap());
       
        // Turn off dragable state on first load
        plugin.toggleDragMode(draggable);
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
        trace.setMap(plugin.getMap());
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
                console.log('Unable to persist! Local Storage is not available.');
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
     * This function reloads the url to persist the map state
     * 
     * @access private
     */
    function _saveMapState() {
        if (plugin.persistMap === true) {
            if (typeof Storage !== 'undefined' && typeof JSON !== 'undefined') {
                var mapPoints = JSON.stringify(points);
                window.localStorage.setItem('DrawOnAMap:Points', mapPoints);
                window.localStorage.setItem('DrawOnAMap:zoom', plugin.getMap().getZoom());
                window.localStorage.setItem('DrawOnAMap:center:x', plugin.getMap().getCenter().lng());
                window.localStorage.setItem('DrawOnAMap:center:y', plugin.getMap().getCenter().lat());
            } else {
                console.log('Unable to persist! Local Storage is not available.');
            }
        }
        
        // Call save state function
        plugin.onSaveState();
    }
}

/**
 * Draw a Rectange on a Map Google Maps Javascript library.
 *
 * Script should be initialised like this:
 *   
 * var doam = new DrawOnAMap(targetElementId);
 *
 */
function DrawRectangleOnAMap(elemId, options)
{
    /**
     * Plugin reference
     * 
     * @access private
     */
    var plugin = this,
        rect = null,
        mousemove = null,
        prevPos = null,
        prevWidth = 0;

    /**
     * Defaults
     *
     * @access private
     */
    var defaults = {
        strokeColor: '#FF0000',
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.2
    };
   
    /**
     * Class objects
     *
     * @access public
     */
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
        
        // Get the element
        var elem = document.getElementById(elemId);
        
        // Test for element
        if (elem === null) {
           throw new Error('Unable to find element with id of: ' + elemId);
        }
       
        // Set element
        plugin.elem = elem;
        
        // Merge map defaults with line defaults
        defaults.mapOptions = plugin.getDefaultMapOptions();
        
        // Initialise public options
        plugin.options = plugin.extend({}, defaults, options);
        
        // Create a new map
        plugin.createMap(elem, plugin.options.mapOptions);
        
        // Set drawing mode
        plugin.toggleDragMode(false);
        
        // Call empty loader function if provided
        if (typeof callback === 'function') {
            callback();
        }
    };
    
    /**
     * Return the rectangle object
     * 
     * @returns {google.maps.Rectangle|null}
     */
    this.getRectangle = function() {
        return rect;
    };
       
    /**
     * Mouse down listener - creates a rectangle area.
     *
     * @access public
     */
    this.addMouseDownListener = function(e) {
        plugin.addMouseMoveListener();
        google.maps.event.addListener(plugin.getMap(), 'mousedown', function(e) {
            if (rect !== null) {
                rect.setMap(null);
            }
            rect = new google.maps.Rectangle();
            rect.setCenter(e.latLng, 0, 0);
            rect.setMap(plugin.getMap());
            prevPos = e.latLng;
            mousemove = true;
        });
    };
       
    /**
     * Mouse down listener - creates a rectangle area.
     *
     * @access public
     */
    this.addMouseMoveListener = function(e) {
        google.maps.event.addListener(plugin.getMap(), 'mousemove', function(e) {
            if (rect !== null && mousemove === true) {
                
                var bounds;
                var diff = prevPos.lat() - e.latLng.lat();
                
                if (rect.getBounds().getSouthWest().A < e.latLng.A && diff >= 0) {
                    bounds = new google.maps.LatLngBounds(
                        rect.getBounds().getSouthWest(),
                        e.latLng
                    );
                } else {
                    bounds = new google.maps.LatLngBounds(
                        e.latLng,
                        rect.getBounds().getNorthEast()
                    );
                }

                rect.setOptions({
                    bounds: bounds,
                    clickable: false,
                    editable: false
                });
            }
        });
    };
       
    /**
     * Mouse down listener - creates a rectangle area.
     *
     * @access public
     */
    this.addMouseUpListener = function(e) {
        google.maps.event.addListener(plugin.getMap(), 'mouseup', function() {
            mousemove = false;
        });
    };
    
    /**
     * Set the center of a rectangle
     * 
     * @param {google.maps.LatLng} latLng
     * @param {integer} height
     * @param {integer} width
     * 
     * @returns {google.maps.Rectangle}
     */
    google.maps.Rectangle.prototype.setCenter = function(latLng, height, width) {
        var lat = latLng.lat();
        var lng = latLng.lng();
        var bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng((lat - (height / 2)), lng  - (width / 2)),
            new google.maps.LatLng((lat + (height / 2)), lng  + (width / 2))
        );
        this.setOptions({bounds: bounds});
    }
    
    /**
     * Calc distance between two points
     * 
     * @param {google.maps.LatLng} latLng1
     * @param {google.maps.LatLng} latLng2
     * 
     * @returns {Number}
     */
    this.calcDistance = function (latLng1, latLng2) {
        var R = 6371; // km (change this constant to get miles)
        var dLat = (latLng2.lat() - latLng1.lat()) * Math.PI / 180;
        var dLon = (latLng2.lng() - latLng1.lng()) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(latLng1.lat() * Math.PI / 180 ) * Math.cos(latLng2.lat() * Math.PI / 180 ) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        if (d>1) return Math.round(d);
        else if (d<=1) return Math.round(d*1000);
        return d;
    }
}

/**
 * Inherit Map Search Functions
 */
DrawOnAMap.prototype = new MapSearch();
DrawRectangleOnAMap.prototype = new MapSearch();