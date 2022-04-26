/* global Loader, defaults, Translator */

/* Magic Mirror
 * Main System
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
var MM = (function () {
	var modules = [];

	/* Private Methods */

	/**
	 * Create dom objects for all modules that are configured for a specific position.
	 */
	var createDomObjects = function () {
		var domCreationPromises = [];

		modules.forEach(function (module) {
			if (typeof module.data.position !== "string") {
				return;
			}

			var wrapper = selectWrapper(module.data.position);
			var dom = document.createElement("div");
			dom.id = module.identifier;
			dom.className = module.name;


			if (typeof module.data.classes === "string") {
				dom.className = "module " + dom.className + " " + module.data.classes;
			}

			dom.opacity = 0;
			wrapper.appendChild(dom);

			var moduleHeader = document.createElement("header");
			moduleHeader.innerHTML = module.getHeader();
			moduleHeader.className = "module-header";
			dom.appendChild(moduleHeader);

			if (typeof module.getHeader() === "undefined" || module.getHeader() !== "") {
				moduleHeader.style.display = "none;";
			} else {
				moduleHeader.style.display = "block;";
			}

			var moduleContent = document.createElement("div");
			moduleContent.className = "module-content";
			dom.appendChild(moduleContent);

			var domCreationPromise = updateDom(module, 0);
			domCreationPromises.push(domCreationPromise);
			domCreationPromise
				.then(function () {
					sendNotification("MODULE_DOM_CREATED", null, null, module);
				})
				.catch(Log.error);
		});

		updateWrapperStates();

		Promise.all(domCreationPromises).then(function () {
			sendNotification("DOM_OBJECTS_CREATED");
		});
	};

	/**
	 * Select the wrapper dom object for a specific position.
	 *
	 * @param {string} position The name of the position.
	 *
	 * @returns {HTMLElement} the wrapper element
	 */
	var selectWrapper = function (position) {
		var classes = position.replace("_", " ");
		var parentWrapper = document.getElementsByClassName(classes);
		if (parentWrapper.length > 0) {
			var wrapper = parentWrapper[0].getElementsByClassName("container");
			if (wrapper.length > 0) {
				return wrapper[0];
			}
		}
	};

	/**
	 * Send a notification to all modules.
	 *
	 * @param {string} notification The identifier of the notification.
	 * @param {*} payload The payload of the notification.
	 * @param {Module} sender The module that sent the notification.
	 * @param {Module} [sendTo] The (optional) module to send the notification to.
	 */
	var sendNotification = function (notification, payload, sender, sendTo) {
		for (var m in modules) {
			var module = modules[m];
			if (module !== sender && (!sendTo || module === sendTo)) {
				module.notificationReceived(notification, payload, sender);
			}
		}
	};

	/**
	 * Update the dom for a specific module.
	 *
	 * @param {Module} module The module that needs an update.
	 * @param {number} [speed] The (optional) number of microseconds for the animation.
	 *
	 * @returns {Promise} Resolved when the dom is fully updated.
	 */
	var updateDom = function (module, speed) {
		return new Promise(function (resolve) {
			var newContentPromise = module.getDom();
			var newHeader = module.getHeader();

			if (!(newContentPromise instanceof Promise)) {
				// convert to a promise if not already one to avoid if/else's everywhere
				newContentPromise = Promise.resolve(newContentPromise);
			}

			newContentPromise
				.then(function (newContent) {
					var updatePromise = updateDomWithContent(module, speed, newHeader, newContent);

					updatePromise.then(resolve).catch(Log.error);
				})
				.catch(Log.error);
		});
	};

	/**
	 * Update the dom with the specified content
	 *
	 * @param {Module} module The module that needs an update.
	 * @param {number} [speed] The (optional) number of microseconds for the animation.
	 * @param {string} newHeader The new header that is generated.
	 * @param {HTMLElement} newContent The new content that is generated.
	 *
	 * @returns {Promise} Resolved when the module dom has been updated.
	 */
	var updateDomWithContent = function (module, speed, newHeader, newContent) {
		return new Promise(function (resolve) {
			if (module.hidden || !speed) {
				updateModuleContent(module, newHeader, newContent);
				resolve();
				return;
			}

			if (!moduleNeedsUpdate(module, newHeader, newContent)) {
				resolve();
				return;
			}

			if (!speed) {
				updateModuleContent(module, newHeader, newContent);
				resolve();
				return;
			}

			hideModule(module, speed / 2, function () {
				updateModuleContent(module, newHeader, newContent);
				if (!module.hidden) {
					showModule(module, speed / 2);
				}
				resolve();
			});
		});
	};

	/**
	 * Check if the content has changed.
	 *
	 * @param {Module} module The module to check.
	 * @param {string} newHeader The new header that is generated.
	 * @param {HTMLElement} newContent The new content that is generated.
	 *
	 * @returns {boolean} True if the module need an update, false otherwise
	 */
	var moduleNeedsUpdate = function (module, newHeader, newContent) {
		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper === null) {
			return false;
		}

		var contentWrapper = moduleWrapper.getElementsByClassName("module-content");
		var headerWrapper = moduleWrapper.getElementsByClassName("module-header");

		var headerNeedsUpdate = false;
		var contentNeedsUpdate = false;

		if (headerWrapper.length > 0) {
			headerNeedsUpdate = newHeader !== headerWrapper[0].innerHTML;
		}

		var tempContentWrapper = document.createElement("div");
		tempContentWrapper.appendChild(newContent);
		contentNeedsUpdate = tempContentWrapper.innerHTML !== contentWrapper[0].innerHTML;

		return headerNeedsUpdate || contentNeedsUpdate;
	};

	/**
	 * Update the content of a module on screen.
	 *
	 * @param {Module} module The module to check.
	 * @param {string} newHeader The new header that is generated.
	 * @param {HTMLElement} newContent The new content that is generated.
	 */
	var updateModuleContent = function (module, newHeader, newContent) {
		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper === null) {
			return;
		}
		var headerWrapper = moduleWrapper.getElementsByClassName("module-header");
		var contentWrapper = moduleWrapper.getElementsByClassName("module-content");

		contentWrapper[0].innerHTML = "";
		contentWrapper[0].appendChild(newContent);

		headerWrapper[0].innerHTML = newHeader;
		if (headerWrapper.length > 0 && newHeader) {
			headerWrapper[0].style.display = "block";
		} else {
			headerWrapper[0].style.display = "none";
		}
	};

	/**
	 * Hide the module.
	 *
	 * @param {Module} module The module to hide.
	 * @param {number} speed The speed of the hide animation.
	 * @param {Function} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the hide method.
	 */
	var hideModule = function (module, speed, callback, options) {
		options = options || {};

		// set lockString if set in options.
		if (options.lockString) {
			// Log.log("Has lockstring: " + options.lockString);
			if (module.lockStrings.indexOf(options.lockString) === -1) {
				module.lockStrings.push(options.lockString);
			}
		}

		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			moduleWrapper.style.opacity = 0;

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function () {
				// To not take up any space, we just make the position absolute.
				// since it's fade out anyway, we can see it lay above or
				// below other modules. This works way better than adjusting
				// the .display property.
				moduleWrapper.style.position = "fixed";

				updateWrapperStates();

				if (typeof callback === "function") {
					callback();
				}
			}, speed);
		} else {
			// invoke callback even if no content, issue 1308
			if (typeof callback === "function") {
				callback();
			}
		}
	};

	/**
	 * Show the module.
	 *
	 * @param {Module} module The module to show.
	 * @param {number} speed The speed of the show animation.
	 * @param {Function} callback Called when the animation is done.
	 * @param {object} [options] Optional settings for the show method.
	 */
	var showModule = function (module, speed, callback, options) {
		options = options || {};

		// remove lockString if set in options.
		if (options.lockString) {
			var index = module.lockStrings.indexOf(options.lockString);
			if (index !== -1) {
				module.lockStrings.splice(index, 1);
			}
		}

		// Check if there are no more lockstrings set, or the force option is set.
		// Otherwise cancel show action.
		if (module.lockStrings.length !== 0 && options.force !== true) {
			Log.log("Will not show " + module.name + ". LockStrings active: " + module.lockStrings.join(","));
			if (typeof options.onError === "function") {
				options.onError(new Error("LOCK_STRING_ACTIVE"));
			}
			return;
		}

		module.hidden = false;

		// If forced show, clean current lockstrings.
		if (module.lockStrings.length !== 0 && options.force === true) {
			Log.log("Force show of module: " + module.name);
			module.lockStrings = [];
		}

		var moduleWrapper = document.getElementById(module.identifier);
		if (moduleWrapper !== null) {
			moduleWrapper.style.transition = "opacity " + speed / 1000 + "s";
			// Restore the position. See hideModule() for more info.
			moduleWrapper.style.position = "static";

			updateWrapperStates();

			// Waiting for DOM-changes done in updateWrapperStates before we can start the animation.
			var dummy = moduleWrapper.parentElement.parentElement.offsetHeight;
			moduleWrapper.style.opacity = 1;

			clearTimeout(module.showHideTimer);
			module.showHideTimer = setTimeout(function () {
				if (typeof callback === "function") {
					callback();
				}
			}, speed);
		} else {
			// invoke callback
			if (typeof callback === "function") {
				callback();
			}
		}
	};

	/**
	 * Checks for all positions if it has visible content.
	 * If not, if will hide the position to prevent unwanted margins.
	 * This method should be called by the show and hide methods.
	 *
	 * Example:
	 * If the top_bar only contains the update notification. And no update is available,
	 * the update notification is hidden. The top bar still occupies space making for
	 * an ugly top margin. By using this function, the top bar will be hidden if the
	 * update notification is not visible.
	 */
	var updateWrapperStates = function () {
		var positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];

		positions.forEach(function (position) {

			var wrapper = selectWrapper(position);
			var moduleWrappers = wrapper.getElementsByClassName("module");

			var showWrapper = false;
			Array.prototype.forEach.call(moduleWrappers, function (moduleWrapper) {
				if (moduleWrapper.style.position === "" || moduleWrapper.style.position === "static") {
					showWrapper = true;
				}
			});

			wrapper.style.display = showWrapper ? "block" : "none";
		});
	};

	/**
	 * Loads the core config and combines it with the system defaults.
	 */
	var loadConfig = function () {
		// FIXME: Think about how to pass config around without breaking tests
		/* eslint-disable */
		if (typeof config === "undefined") {
			config = defaults;
			Log.error("Config file is missing! Please create a config file.");
			return;
		}

		config = Object.assign({}, defaults, config);
		/* eslint-enable */
	};

	/**
	 * Adds special selectors on a collection of modules.
	 *
	 * @param {Module[]} modules Array of modules.
	 */
	var setSelectionMethodsForModules = function (modules) {
		/**
		 * Filter modules with the specified classes.
		 *
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 *
		 * @returns {Module[]} Filtered collection of modules.
		 */
		var withClass = function (className) {
			return modulesByClass(className, true);
		};

		/**
		 * Filter modules without the specified classes.
		 *
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 *
		 * @returns {Module[]} Filtered collection of modules.
		 */
		var exceptWithClass = function (className) {
			return modulesByClass(className, false);
		};

		/**
		 * Filters a collection of modules based on classname(s).
		 *
		 * @param {string|string[]} className one or multiple classnames (array or space divided).
		 * @param {boolean} include if the filter should include or exclude the modules with the specific classes.
		 *
		 * @returns {Module[]} Filtered collection of modules.
		 */
		var modulesByClass = function (className, include) {
			var searchClasses = className;
			if (typeof className === "string") {
				searchClasses = className.split(" ");
			}

			var newModules = modules.filter(function (module) {
				var classes = module.data.classes.toLowerCase().split(" ");

				for (var c in searchClasses) {
					var searchClass = searchClasses[c];
					if (classes.indexOf(searchClass.toLowerCase()) !== -1) {
						return include;
					}
				}

				return !include;
			});

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/**
		 * Removes a module instance from the collection.
		 *
		 * @param {object} module The module instance to remove from the collection.
		 * @returns {Module[]} Filtered collection of modules.
		 */
		var exceptModule = function (module) {
			var newModules = modules.filter(function (mod) {
				return mod.identifier !== module.identifier;
			});

			setSelectionMethodsForModules(newModules);
			return newModules;
		};

		/**
		 * Walks thru a collection of modules and executes the callback with the module as an argument.
		 *
		 * @param {Function} callback The function to execute with the module as an argument.
		 */
		var enumerate = function (callback) {
			modules.map(function (module) {
				callback(module);
			});
		};

		if (typeof modules.withClass === "undefined") {
			Object.defineProperty(modules, "withClass", { value: withClass, enumerable: false });
		}
		if (typeof modules.exceptWithClass === "undefined") {
			Object.defineProperty(modules, "exceptWithClass", { value: exceptWithClass, enumerable: false });
		}
		if (typeof modules.exceptModule === "undefined") {
			Object.defineProperty(modules, "exceptModule", { value: exceptModule, enumerable: false });
		}
		if (typeof modules.enumerate === "undefined") {
			Object.defineProperty(modules, "enumerate", { value: enumerate, enumerable: false });
		}
	};

	return {
		/* Public Methods */

		/**
		 * Main init method.
		 */
		init: function () {
			Log.info("Initializing MagicMirror.");
			loadConfig();

			Log.setLogLevel(config.logLevel);

			Translator.loadCoreTranslations(config.language);
			Loader.loadModules();
		},

		/**
		 * Gets called when all modules are started.
		 *
		 * @param {Module[]} moduleObjects All module instances.
		 */
		modulesStarted: function (moduleObjects) {
			modules = [];
			moduleObjects.forEach((module) => modules.push(module));

			Log.info("All modules started!");
			sendNotification("ALL_MODULES_STARTED");

			createDomObjects();
		},

		/**
		 * Send a notification to all modules.
		 *
		 * @param {string} notification The identifier of the notification.
		 * @param {*} payload The payload of the notification.
		 * @param {Module} sender The module that sent the notification.
		 */
		sendNotification: function (notification, payload, sender) {
			if (arguments.length < 3) {
				Log.error("sendNotification: Missing arguments.");
				return;
			}

			if (typeof notification !== "string") {
				Log.error("sendNotification: Notification should be a string.");
				return;
			}

			if (!(sender instanceof Module)) {
				Log.error("sendNotification: Sender should be a module.");
				return;
			}

			// Further implementation is done in the private method.
			sendNotification(notification, payload, sender);
		},

		/**
		 * Update the dom for a specific module.
		 *
		 * @param {Module} module The module that needs an update.
		 * @param {number} [speed] The number of microseconds for the animation.
		 */
		updateDom: function (module, speed) {
			if (!(module instanceof Module)) {
				Log.error("updateDom: Sender should be a module.");
				return;
			}

			if (!module.data.position) {
				Log.warn("module tries to update the DOM without being displayed.");
				return;
			}

			// Further implementation is done in the private method.
			updateDom(module, speed);
		},

		/**
		 * Returns a collection of all modules currently active.
		 *
		 * @returns {Module[]} A collection of all modules currently active.
		 */
		getModules: function () {
			setSelectionMethodsForModules(modules);
			return modules;
		},

		/**
		 * Hide the module.
		 *
		 * @param {Module} module The module to hide.
		 * @param {number} speed The speed of the hide animation.
		 * @param {Function} callback Called when the animation is done.
		 * @param {object} [options] Optional settings for the hide method.
		 */
		hideModule: function (module, speed, callback, options) {
			module.hidden = true;
			hideModule(module, speed, callback, options);
		},

		/**
		 * Show the module.
		 *
		 * @param {Module} module The module to show.
		 * @param {number} speed The speed of the show animation.
		 * @param {Function} callback Called when the animation is done.
		 * @param {object} [options] Optional settings for the show method.
		 */
		showModule: function (module, speed, callback, options) {
			// do not change module.hidden yet, only if we really show it later
			showModule(module, speed, callback, options);
		}
	};
})();

// Add polyfill for Object.assign.
if (typeof Object.assign !== "function") {
	(function () {
		Object.assign = function (target) {
			"use strict";
			if (target === undefined || target === null) {
				throw new TypeError("Cannot convert undefined or null to object");
			}
			var output = Object(target);
			for (var index = 1; index < arguments.length; index++) {
				var source = arguments[index];
				if (source !== undefined && source !== null) {
					for (var nextKey in source) {
						if (source.hasOwnProperty(nextKey)) {
							output[nextKey] = source[nextKey];
						}
					}
				}
			}
			return output;
		};
	})();
}

MM.init();




$(function() {
	$.fn.setFlexGrid = function(options) {
		var defaults = { // default options for grid
			cols: 6, // starting amount of columns across a grid
			rows: 6, // starting amount of rows in a grid
			fixedGrid: false, // determines whether the grid can be resized or not (adding more rows)
			defaultHeight: 3, // amount of rows a widget will span upon creation
			defaultWidth: 3, // amount of columns a widget will span upon creation
			minHeight: 3, // minimum number of rows a widget can span ~ should be <= defaultHeight
			maxHeight: null, // if set to numeric value: maximum number of rows a widget can span
			minWidth: 3, // minimum number of columns a widget can span ~ should be <= defaultWidth
			maxWidth: null, // if set to numeric value: maximum number of columns a widget can span
			rowHeight: 1, // value times column width
			nested: true, // if true, widgets will allow nested widget to be dropped into them
			showGridlines: true, // if true, show gridlines on initialization
			animate: true, // determines wether or not the widgets should be animated
			nextAxis: 'y', // determines which axis the widget should find an open column. When X: widget will go to the first open column. When Y: widget will go to the first row that has an open column of x.
			resizeHandles: 'n', // determines resize handles (n, e, s, w, ne, se, sw, nw, all) ~ default is "se"
			checkRevert: false // if widget cannot be dropped in pos (going to revert) because of minWidth / minHeight, placeholder will turn red
		};
		options = $.extend(defaults, options);

		var zoneInner = $(this);
		// var zoneInner = zone.find('.flexgrid-grid');

		// maintain a reference to the existing function
		var old_width = $.fn.width;
		// ...before overwriting the jQuery extension point
		$.fn.width = function(type, value) {

			// original behavior - use function.apply to preserve context
			var ret = old_width.apply(this, arguments);

			// stuff I will be extending that doesn't change the way .width() works

			if ($.type(type) == 'string' && type != undefined && type != null && type != '') {
				var item = $(this);
				switch(type) {
					case 'minWidth':
						if (value != undefined) { // set min-width
							item.css('min-width', value);
						} else { // get min-width
							return parseInt(item.css('min-width'));
						}
						break;
					case 'maxWidth':
						if (value != undefined) { // set max-width
							item.css('max-width', value);
						} else { // get max-width
							return parseInt(item.css('max-width'));
						}
						break;
				}
			}

			// preserve return value (probably the jQuery object...)
			return ret;
		};

		// maintain a reference to the existing function
		var old_height = $.fn.height;
		// ...before overwriting the jQuery extension point
		$.fn.height = function(type, value) {
			// original behavior - use function.apply to preserve context
			var ret = old_height.apply(this, arguments);

			// stuff I will be extending that doesn't change the way .height() works

			if ($.type(type) == 'string' && type != undefined && type != null && type != '') {
				var item = $(this);
				switch(type) {
					case 'minHeight':
						if (value != undefined) { // set min-height
							item.css('min-height', value);
						} else { // get min-height
							return parseInt(item.css('min-height'));
						}
						break;
					case 'maxHeight':
						if (value != undefined) { // set max-height
							item.css('max-height', value);
						} else { // get max-height
							return parseInt(item.css('max-height'));
						}
						break;
				}
			}

			// preserve return value (probably the jQuery object...)
			return ret;
		};

		// setup variables to be used in calculations in multiple functions
		$.fn.resetVars = function() {

			// reset variables since we perfected the zone-inner width / height
			var zoneInner = $(this); // we will need to reintialize this variable in every function where the following variables are used
			var zone = zoneInner.closest('.flexgrid-container');
			var zoneWidth = zoneInner.outerWidth();
			var zoneHeight = zoneInner.outerHeight();
			var colWidth = Math.floor(zoneWidth / options.cols); // width of each column
			var rowHeight = Math.floor(zoneHeight / options.rows); // height of each row

			var res = { zone: zone, zW: zoneWidth, zH: zoneHeight, cW: colWidth, rH: rowHeight };
			return res;
		}
		var re = zoneInner.resetVars(); // reset zone variables

		// CREATE COLS
		$.fn.buildGrid = function() { // create rows of columns

			var zoneInner = $(this);
			var re = zoneInner.resetVars(); // reset zone variables
			var colAmount = options.cols; // number of columns in each row
			var rowAmount = options.rows; // number of rows in a zone
			var gridlines = options.showGridlines ? 'fg-gridlines' : '';

			for (var y = 0; y < rowAmount; y++) {
				for (var x = 0; x < colAmount; x++) {
					zoneInner.append('<div class="fg-enabled-col fg-col '+gridlines+'" data-fg-eq="'+x+'" data-fg-row="'+y+'" style="min-width: '+ re.cW +'px; min-height: '+ re.rH +'px; top:'+(re.rH * y)+'px; left: '+(re.cW * x)+'px; "></div>');
					var appended = zoneInner.find('.fg-col[data-fg-row="'+y+'"][data-fg-eq="'+x+'"]');
					var i = zoneInner.find('.fg-col').index(appended);
					appended.attr('data-fg-index', i);
				}
			}
			var lastCol = zoneInner.find('.fg-col').last();
			var rowCount = parseInt(lastCol.attr('data-fg-row'));

			zoneInner.css({ // reset the zone-inner width / height to perfect it.
				'height': (rowCount + 1) * re.rH,
				'width': (re.cW * options.cols)
			});
			re.zone.css({ // reset the zone width / height to perfect it.
				'height': (rowCount + 1) * re.rH + 55, // add some pixels to allow space for the zone-helper
				'width': (re.cW * options.cols) + 15 // add a little bezzel
			});
			enableSortable();
		}

		var re = zoneInner.resetVars(); // reset zone variables

		// set data attributes to find position of widget
		$.fn.setData = function() {


			var widget = $(this);
			var zoneInner = widget.closest('.flexgrid-grid');
			var zoneCol = widget.closest('.fg-col');
			var wigW = Math.floor(widget.width()); // widget width
			var wigH = Math.floor(widget.height()); // widget height

			var re = zoneInner.resetVars(); // reset zone variables

			var data_minWidth = parseFloat(Math.round(widget.width('minWidth') / re.cW));
			var data_minHeight = parseFloat(Math.round(widget.height('minHeight') / re.rH));
			var data_width = parseFloat(Math.round(wigW / re.cW)) < data_minWidth ? data_minWidth : parseFloat(Math.round(wigW / re.cW)); // number of columns a widget spans
			var data_height = parseFloat(Math.round(wigH / re.rH)) < data_minHeight ? data_minHeight : parseFloat(Math.round(wigH / re.rH)); // number of rows a widget spans
			var data_maxWidth = parseFloat(Math.round(widget.width('maxWidth') / re.cW));
			var data_maxHeight = parseFloat(Math.round(widget.height('maxHeight') / re.rH));
			var data_y = zoneCol.attr('data-fg-row'); // row the widget starts on ~ 0 indexed
			var data_x = zoneInner.find('.fg-col[data-fg-row="'+data_y+'"]').index(widget.closest('.fg-col[data-fg-row="'+data_y+'"]')); // column # the widget starts on ~ 0 indexed
			widget.attr({ 'data-fg-width': data_width, 'data-fg-height': data_height, 'data-fg-x': data_x, 'data-fg-y': data_y, 'data-fg-minwidth': data_minWidth, 'data-fg-minheight': data_minHeight, 'data-fg-maxwidth': data_maxWidth, 'data-fg-maxheight': data_maxHeight }); // set these new attributes
		}

		$.fn.setOption = function(option, val) {
			var widget = $(this);
			var grid = widget.closest('.flexgrid-grid');
			var re = grid.resetVars(); // reset zone variables

			var toggle;
			switch(option) {
				case 'height':
					toggle = 'data-fg-height';
					widget.css('height', val * re.rH);
					break;
				case 'width':
					toggle = 'data-fg-width';
					widget.css('width', val * re.cW);
					break;
				case 'minHeight':
					toggle = 'data-fg-minheight';
					widget.css('min-height', val * re.rH);
					break;
				case 'minWidth':
					toggle = 'data-fg-minwidth';
					widget.css('min-width', val * re.cW);
					break;
				case 'maxHeight':
					toggle = 'data-fg-maxheight';
					widget.css('max-height', val * re.rH);
					break;
				case 'maxWidth':
					toggle = 'data-fg-maxwidth';
					widget.css('max-width', val * re.cW);
					break;
				case 'x':
					toggle = 'data-fg-x';
					var y = widget.attr('data-fg-y');
					var col = grid.find('.fg-col[data-fg-eq="'+val+'"][data-fg-row="'+y+'"]');
					widget.detach();
					col.append(widget);
					break;
				case 'y':
					toggle = 'data-fg-y';
					var x = widget.attr('data-fg-x');
					var col = grid.find('.fg-col[data-fg-eq="'+x+'"][data-fg-row="'+val+'"]');
					widget.detach();
					col.append(widget);
					break;
			}
			widget.attr(toggle, val);
			widget.setData();
		}

		// enable or disable columns depending on the function parameter...
		$.fn.modCols = function(modifier) {
			var zoneCol = $(this);
			var zoneInner = zoneCol.closest('.flexgrid-grid');
			var widget = zoneCol.find('.fg-widget');
			if (modifier == 'disable') widget.setData();

			var rowStart = parseInt(zoneCol.attr('data-fg-row')); // row the widget starts on
			var rowEnd = rowStart + parseInt(widget.attr('data-fg-height')); // row the widget ends on

			var colStart = parseInt(zoneCol.attr('data-fg-eq')); // col the widget starts on
			var colEnd = colStart + parseInt(widget.attr('data-fg-width')); // col the widget ends on

			for (var r = rowStart; r < rowEnd; r++) {
				for (var c = colStart; c < colEnd; c++) {
					var self = zoneInner.find('.fg-col[data-fg-row="'+r+'"][data-fg-eq="'+c+'"]');
					if (modifier == 'enable') { self.addClass('fg-enabled-col').removeClass('fg-disabled-col'); }
					if (modifier == 'disable') { self.removeClass('fg-enabled-col').addClass('fg-disabled-col'); }
				}
			}
		}

		$.fn.zoneOverflow = function() {
			var col = $(this);
			var widget = col.find('.fg-widget');
			var zoneInner = col.closest('.flexgrid-grid');
			var ogParent = widget.data('ogParent'); // original parent column
			var re = zoneInner.resetVars(); // reset zone variables
			var res = {obj: col};

			widget.setData();
			var data_x = parseInt(widget.attr('data-fg-x'));
			var data_y = parseInt(widget.attr('data-fg-y'));
			var data_width = parseInt(widget.attr('data-fg-width'));
			var data_height = parseInt(widget.attr('data-fg-height'));
			var xCon = data_width + data_x > options.cols;
			var yCon = parseInt(col.attr('data-fg-row')) + data_height > parseInt(zoneInner.find('.fg-col').last().attr('data-fg-row')) + 1;
			var dif = ((data_width + data_x) - options.cols) * re.cW;

			if ($(ogParent).length > 0) { // if we dropped widget we should have an 'ogParent'
				if ((options.cols - data_x) * re.cW < widget.width('minWidth')) { // if overflowing zone on x-axis
					var de = col.find('.fg-widget').detach();
					$(ogParent).append(de);
					res = {obj: $(ogParent)};
				} else if (xCon) { // if widget is overflowing zone on x-axis but is not at min-width
					widget.css('width', widget.width() - dif);
				}
				res = {obj: col};
			} else if ($(ogParent).length <= 0) { // if we added new widget
				var goHere = col;
				while (xCon) { // detach the widget and append to the next open fg-enabled-col until it no longer overflows the zone width
					var de = goHere.find('.fg-widget').detach();
					goHere = goHere.nextAll('.fg-enabled-col').first();
					if (goHere.length == 0 || goHere == undefined || goHere == null) {
						zoneInner.createRow();
						goHere = zoneInner.find('.fg-widget').last().closest('.fg-col').nextAll('.fg-enabled-col').first();
					}
					goHere.append(de);
					de.setData(); // reset widget attributes

					// reset position parameters to be used in next if statement / loop ...
					data_x = parseInt(widget.attr('data-fg-x'));
					data_y = parseInt(widget.attr('data-fg-y'));
					data_width = parseInt(widget.attr('data-fg-width'));
					data_height = parseInt(widget.attr('data-fg-height'));
					yCon = yCon = parseInt(goHere.attr('data-fg-row')) + data_height > parseInt(zoneInner.find('.fg-col').last().attr('data-fg-row')) + 1;
					xCon = data_width + data_x > options.cols;

					if (!xCon) {
						break;
					}
				}
				col = goHere; // reset col so it can be used in the next if statment...
				res = {obj: col};
			}
			if (yCon) { // if widget is overflowing zone height but is not at min-height
				moreHeight(col); // add more rows...
			}

			data_x = parseInt(col.attr('data-fg-eq'));
			data_y = parseInt(col.attr('data-fg-row'));

			// tried to only target siblings that shared columns, but was much slower....
			var sibs = col.siblings('.fg-col');
			for (var a = 0; a < sibs.length; a++) {
				var colSib = sibs.eq(a);
				if (colSib.find('.fg-widget').length > 0) {
					var dc = dropCollision(colSib, col);
					col = dc.obj;
					sibs = col.siblings('.fg-col');
				}
			}
			res = {obj: col};

			return res;
		}

		// pass in parameters such as: x, y, width, height to position and size the widget
		$.fn.addWidget = function(params) {

			console.log('options: ', options);
			var zoneInner = $(this);
			var re = zoneInner.resetVars(); // reset zone variables
			var goHere;
			var width, height, minWidth, minHeight, maxWidth, maxHeight, nextAxis;

			// if no parameters are passed, use the default value. else check if the parameter has a value, if so use that value, else use default value
			var noParams = params == undefined || params == null ? true : false;
			width = noParams ? options.defaultWidth * re.cW : (params.width != undefined || params.width != null) ? params.width * re.cW : options.defaultWidth * re.cW;
			height = noParams ? options.defaultHeight * re.rH : (params.height != undefined || params.height != null) ? params.height * re.rH : options.defaultHeight * re.rH;
			minWidth = noParams ? options.minWidth * re.cW : (params.minWidth != undefined || params.minWidth != null) ? params.minWidth * re.cW : options.minWidth * re.cW;
			minHeight = noParams ? options.minHeight * re.rH : (params.minHeight != undefined || params.minHeight != null) ? params.minHeight * re.rH : options.minHeight * re.rH;
			maxWidth = noParams ? options.maxWidth * re.cW : (params.maxWidth != undefined || params.maxWidth != null) ? params.maxWidth * re.cW : options.maxWidth * re.cW;
			maxWidth = (maxWidth == 0) ? 'unset' : maxWidth;
			maxHeight = noParams ? options.maxHeight * re.rH : (params.maxHeight != undefined || params.maxHeight != null) ? params.maxHeight * re.rH : options.maxHeight * re.rH;
			maxHeight = (maxHeight == 0) ? 'unset' : maxHeight;
			nextAxis = noParams ? options.nextAxis : (params.nextAxis != undefined || params.nextAxis != null) ? params.nextAxis : options.nextAxis;

			var amountNeeded = ((options.rowHeight * re.rH) * options.defaultHeight) / re.rH;
			amountNeeded = options.rowHeight > 1 ?  amountNeeded : options.defaultHeight;
			if ( zoneInner.find('.fg-enabled-col').length < 1 ) {
				for (l = 0; l < amountNeeded; l++) {
					zoneInner.createRow();
				}
			}

			// if we aren't given parameters or positions, then go to the first open column.
			if (noParams || (params.y === undefined || params.y === null || params.y === '') || (params.x === undefined || params.x === null || params.x === '')) {
				var findNext = findNextColumn('x', zoneInner, params.x, params.y);
				goHere = findNext.goHere;
			} else {
				var findNext = findNextColumn(nextAxis, zoneInner, params.x, params.y);
				goHere = findNext.goHere;
			}

			if (goHere.length == 0) console.error('Parent column does not exist.');

			var nested = options.nested == true ? $('<div class="fg-nested-container"></div>') : $('');
			var widget = noParams ? $('<div class="fg-widget"><i class="fa fa-times fg-remove-widget" title="remove this widget."></i><div class="fg-widget-inner fg-widget-handle"><div class="zone-txt text-center"></div></div></div>') : params.widget === undefined || params.widget === null ? $('<div class="fg-widget"><i class="fa fa-times remove-widget" title="remove this widget"></i><div class="fg-widget-inner fg-widget-handle"><div class="zone-txt text-center"></div></div></div>') : params.widget;
			widget.find('.fg-widget-inner').append(nested);

			widget.css({ // set widget style options
				'width': width,
				'min-width': width,
				'max-width': width,
				'height': height,
				'min-height': height,
				'max-height': height
			});

			goHere.append(widget); // append the widget
			widget.setData(); // reset the widget attributes

			// DETECT ZONE OVERFLOW
			var zo = goHere.zoneOverflow();
			goHere = zo.obj;
			sibs = goHere.siblings('.fg-col');

			options.animate ? widget.animateWidget() : null;
			widget.setData();
			goHere.modCols('disable'); // disable overlapped columns

			resize(widget);
			enableSortable();
		}

		function findNextColumn(axis, zoneInner, x, y) {

			var goHere;
			switch(axis) {
				case 'x':
					zoneInner.find('.fg-col').each(function() {
						goHere = $(this);
						if ( !goHere.hasClass('fg-disabled-col') && goHere.find('.fg-widget').length == 0 ) {
							goHere = $(this);
							return false; // break when we find an open column
						}
					});
					break;
				case 'y':
					if (x === undefined || x === null || x === '') { // if we still aren't passed an x
						findNextColumn('x', zoneInner);
					}
					goHere = zoneInner.find('.fg-col[data-fg-row="'+y+'"][data-fg-eq="'+x+'"]');
					while (goHere.hasClass('fg-disabled-col')) {
						y++;
						goHere = zoneInner.find('.fg-col[data-fg-row="'+y+'"][data-fg-eq="'+x+'"]');

						if (!goHere.hasClass('fg-disabled-col')) {
							break;
						}
					}
					if (goHere.length == 0) {
						var rowCount = zoneInner.find('.fg-col').last().attr('data-fg-row');
						zoneInner.addRow(y - rowCount); // add as many rows as needed for placing the widget...
						goHere = zoneInner.find('.fg-col[data-fg-row="'+y+'"][data-fg-eq="'+x+'"]');
						goHere = goHere.hasClass('fg-disabled-col') ? goHere.nextAll('.fg-enabled-col[data-fg-row="'+ (y) +'"][data-fg-eq="'+x+'"]').first() : goHere;
					}
					break;
			}

			var result = res = {goHere: goHere};
			return result;
		}

		$.fn.removeWidget = function(widget) {
			var zoneCol = widget.closest('.fg-col');
			zoneCol.modCols('enable');
			var originalContainer = widget.data('originalContainer') != undefined || widget.data('originalContainer') != null ? widget.data('originalContainer') : zoneCol;
			if (!originalContainer.hasClass('fg-col')) { // if the widget came from a different container
				var de = widget.detach();
				originalContainer.append(de);
				de.css({'width':widget.data('ogWidth'), 'height':widget.data('ogHeight'), 'min-width':'', 'min-height':'', 'max-width':'', 'max-height':''});
			} else {
				widget.remove();
			}
			zoneCol.sortable('refresh');
		}

		$.fn.createRow = function() { // add a row to the grid ~ used internally

			var zoneInner = $(this);
			var re = zoneInner.resetVars(); // reset zone variables

			var lastCol = zoneInner.find('.fg-col').last(); // last column in zone
			var appendHere = lastCol[0].offsetTop + re.rH; // new row position
			var rowCount = parseInt(lastCol.attr('data-fg-row')) + 1; // number of rows found within zone
			var colAmount = options.cols; // number of columns spanning a row

			var gridlines = options.showGridlines ? 'fg-gridlines' : ''; // is show gridlines checked?
			for (var i = 0; i < colAmount; i++) {

				zoneInner.append('<div class="fg-enabled-col fg-col ui-sortable '+gridlines+'" data-fg-eq="'+i+'" data-fg-row="'+ rowCount +'" style="min-width: '+re.cW+'px; min-height: '+re.rH+'px; top:'+appendHere+'px; left: '+(re.cW * i)+'px; "></div>');
				var blah = zoneInner.find('.fg-col[data-fg-row="'+ rowCount +'"][data-fg-eq="'+i+'"]');
				var n = zoneInner.find('.fg-col').index(blah);
				blah.attr('data-fg-index', n);
			}
			lastCol =  zoneInner.find('.fg-col').last(); // reset since we added rows
			rowCount = parseInt(lastCol.attr('data-fg-row')) + 1; // reset since we added rows
			zoneInner.height(rowCount * re.rH); // reset since we added rows
			re.zone.height( zoneInner.height() + 50 ); // reset since we added rows
			enableSortable();
		}
		$.fn.addRow = function(val) { // add specified number of rows outside of plugin...
			var zoneInner = $(this);
			val = val === undefined || val === null ? 1 : val;
			for (var i = 0; i < val; i++) {
				zoneInner.createRow();
			}
		}


		$.fn.addRowHere = function(goHere, rowsNeeded) { // rows will be appended after specified columns row
			let zoneInner = $(this);
			let re = zoneInner.resetVars(); // reset zone variables

			let appendHere = goHere[0].offsetTop + re.rH; // new row position
			let rowCount = parseInt(goHere.attr('data-fg-row')) + 1; // number of rows found within zone
			var colAmount = options.cols; // number of columns spanning a row

			var gridlines = options.showGridlines ? 'fg-gridlines' : ''; // is show gridlines checked?
			for (la = 0; la < rowsNeeded; la++) {

				for (var i = 0; i < colAmount; i++) {
					zoneInner.append('<div class="fg-enabled-col fg-col ui-sortable '+gridlines+'" data-fg-eq="'+i+'" data-fg-row="'+rowCount+'" style="min-width: '+re.cW+'px; min-height: '+re.rH+'px; top:'+appendHere+'px; left: '+(re.cW * i)+'px;"></div>');
					var blah = zoneInner.find('.fg-col[data-fg-row="'+(rowCount + 1)+'"][data-fg-eq="'+i+'"]');
					var n = zoneInner.find('.fg-col').index(blah);
					blah.attr('data-fg-index', n);
				}
				appendHere = goHere[0].offsetTop + (re.rH * (la + 2));
				rowCount = rowCount + 1;
			}
			// reset since we added rows
			lastCol =  zoneInner.find('.fg-col').last(); // reset since we added rows
			rowCount = parseInt(lastCol.attr('data-fg-row')) + 1; // reset since we added rows
			zoneInner.height(rowCount * re.rH); // reset since we added rows
			re.zone.height( zoneInner.height() + 50 ); // reset since we added rows
			enableSortable();
		}


		$.fn.removeThisRow = function() { // remove a row from the grid
			var zoneInner = $(this);
			var re = zoneInner.resetVars(); // reset zone variables

			var zoneCol = zoneInner.find('.fg-col');
			var rowCount = parseInt(zoneInner.find('.fg-col').last().attr('data-fg-row')) + 1; // number of rows found in the zone

			if (zoneCol.length > options.cols * options.rows) {
				zoneInner.find('.fg-col[data-fg-row="'+(rowCount - 1)+'"]').remove();
				rowCount = parseInt(zoneInner.find('.fg-col').last().attr('data-fg-row')) + 1;
				zoneInner.css({ 'height': rowCount * re.rH });
				re.zone.css({ 'height': rowCount * re.rH + 55 });
			}

			// check if any widgets are overflowing the zone after we remove rows
			var wigs = zoneInner.find('.fg-widget');
			for (var i = 0; i < wigs.length; i++) {
				var widget = wigs.eq(i);
				var zoneCol = widget.closest('.fg-col');
				widget.setData();
				var data_y = parseInt(widget.attr('data-fg-y'));
				var data_height = parseInt(widget.attr('data-fg-height'));
				var yCon = data_height + data_y > rowCount;
				var dif = ((data_height + data_y) - rowCount) * re.rH;

				// if (yCon) { // if widget is overflowing zone, resize it down to fit
				// 	widget.height(widget.height() - dif);
				// 	widget.setData();
				// }
				if (yCon) {
					moreHeight(widget.closest('.fg-col'));
					widget.setData();
					zoneCol.modCols('disable');
				}
				// if (yCon && widget.height() == options.minHeight * re.rH) { // if we resized down but the widget is as short as it can get, don't remove rows
				// 	moreHeight(widget.closest('.fg-col'));
				// }
			}
			rowCount = parseInt(zoneInner.find('.fg-col').last().attr('data-fg-row')) + 1;
			re.zone.css({ 'height': rowCount * re.rH + 55 });
		}
		$.fn.removeRow = function(val) { // remove specified number of rows outside of plugin...
			var zoneInner = $(this);
			val = val === undefined || val === null ? 1 : val;
			for (var i = 0; i < val; i++) {
				zoneInner.removeThisRow();
			}
		}

		function enableSortable() {

			$('.fg-col').sortable({
				items: '.fg-widget',
				connectWith: '.fg-enabled-col',
				handle: '.fg-widget-handle',
				cursor: 'move',
				placeholder: 'fg-widget-placeholder',
				tolerance: 'intersect',
				start: function(event, ui) {

					var zoneCol = $(this);
					var zoneInner = zoneCol.closest('.flexgrid-grid')
					var sibs = zoneCol.siblings('.fg-col');
					// Getter
					var placeholder = $( ".selector" ).sortable( "option", "placeholder" );
					console.log(placeholder)

					var widget = zoneCol.find('.fg-widget');
					zoneCol.modCols('enable'); // enable overlapped columns

					var wig = $(this).find('.fg-widget-inner'); // set the placeholder's height and width equal to this widget.
					var wigW = wig[0].offsetWidth;
					var wigH = wig[0].offsetHeight;
					zoneInner.find('.fg-widget-placeholder').css({
						'width': wigW,
						'height': wigH
					});

					// set data so we can see if it changes on stop
					ui.item.data({
						'ogIndex': ui.item.closest('.fg-col').index($(this)), // original index value of the widget
						'ogParent': ui.item.closest('.fg-col') // original parent column of the widget
					});
				},
				over: function(event, ui) {

					// refresh sortable columns only when we are dragging over them
					// previously called in sortable start and that caused a lot of lag with multiple widgets...
					var zoneCol = $(this);
					zoneCol.sortable('refresh');

					var sibs = zoneCol.siblings('.fg-col');
					var widget = ui.item;

					// this is for widgets coming from outside of a grid...
					if (!widget.data('sortableItem').bindings.hasClass('.fg-col')) {
						var originalContainer = widget.data('sortableItem').bindings;
						var ogWidth = widget.data('sortableItem').helperProportions.width;
						var ogHeight = widget.data('sortableItem').helperProportions.height;
						$(this).find('.ui-sortable-placeholder').addClass('fg-widget-placeholder');
						// var minWidth = ui.item.attr('data-fg-minwidth') != options.minWidth ? ui.item.attr('data-fg-minwidth') : options.minWidth * re.cW;
						// var minHeight = ui.item.attr('data-fg-minheight') != options.minHeight ? ui.item.attr('data-fg-minheight') : options.minHeight * re.rH;
						// $(this).find('.ui-sortable-placeholder').css({ 'width': (Math.ceil((ogWidth / re.cW)) * re.cW) - 10, 'height': (Math.ceil((ogHeight / re.rH)) * re.rH) - 10, 'min-width': minWidth - 10, 'min-height':minHeight - 10, 'max-width': options.maxWidth != null && options.maxWidth != undefined ? options.maxWidth * re.cW - 10 : 'unset', 'max-height': options.maxWidth != null && options.maxWidth != undefined ? options.maxWidth * re.cW - 10 : 'unset', 'visibility': 'visible', 'position':'absolute' });
						// ui.item.css({ 'width': Math.ceil((ogWidth / re.cW)) * re.cW, 'height': Math.ceil((ogHeight / re.rH)) * re.rH, 'min-width': minWidth, 'min-height': minHeight, 'max-width': options.maxWidth != null && options.maxWidth != undefined ? options.maxWidth * re.cW : 'unset', 'max-height': options.maxWidth != null && options.maxWidth != undefined ? options.maxWidth * re.cW : 'unset' });
					}

					if (options.checkRevert) {
						// check if widget can be dropped here or if it will revert to it's original position
						widget.checkCollision('sort', sibs); // check for collision
					}
				},
				receive: function(event, ui) {

					var zoneCol = $(this);
					var zoneInner = zoneCol.closest('.flexgrid-grid');
					var re = zoneInner.resetVars();
					var sibs = zoneCol.siblings('.fg-col');
					var zone = zoneCol.closest('.flexgrid-container');

					ui.item.setData(); // reset here so that zoneOverflow can use the attributes

					if (!ui.item.data('sortableItem').bindings.hasClass('fg-col')) {

						var originalContainer = ui.item.data('sortableItem').bindings;
						var ogWidth = ui.item.data('sortableItem').helperProportions.width;
						var ogHeight = ui.item.data('sortableItem').helperProportions.height;
						ui.item.data({
							'originalContainer': originalContainer,
							'ogWidth': ogWidth,
							'ogHeight': ogHeight
						}); // set the original container data
						ui.item.css({
							'width': Math.ceil((ogWidth / re.cW)) * re.cW,
							'height': Math.ceil((ogHeight / re.rH)) * re.rH,
							'minWidth': options.minWidth * re.cW,
							'minHeight': options.minHeight * re.rH,
							'maxWidth': options.maxWidth != null && options.maxWidth != undefined ? options.maxWidth * re.cW : 'unset',
							'maxHeight': options.maxWidth != null && options.maxWidth != undefined ? options.maxWidth * re.cW : 'unset'
						});
					}

					var zo = zoneCol.zoneOverflow(); // check if the widget is overflowing the zone
					zoneCol = zo.obj;
					sibs = zoneCol.siblings('.fg-col');

					zoneCol.modCols('disable');

					ui.item.setData(); // reset widget attributes
					options.animate ? ui.item.animateWidget() : null;
					resize(ui.item);
				},
				stop: function(event, ui) {

					var zoneCol = $(this);
					var widget = zoneCol.find('.fg-widget');
					var sibs = zoneCol.siblings('.fg-col');
					var ogParent = ui.item.data('ogParent');

					var zo = zoneCol.zoneOverflow(); // check if the widget is overflowing the zone
					zoneCol = zo.obj;
					sibs = zoneCol.siblings('.fg-col');

					zoneCol.modCols('disable'); // disable overlapped columns

					// ui.item.setData(); // set data attributes
					options.animate ? ui.item.animateWidget() : null;
					resize(ui.item);

					// detect if the item position has changed so that we can remind the user to save...
					if (ui.item.closest('.fg-col').index(zoneCol) != ui.item.data('ogIndex')) {
						console.log('position has changed');
					}
				}
			});
		} enableSortable();

		var re = zoneInner.resetVars(); // reset zone variables
		// Resize function
		function resize(widget) {

			widget.resizable({
				grid: [re.cW, (options.rowHeight > 1 ? options.rowHeight * re.cW : re.cW)],
				handles: options.resizeHandles,
				containment: zoneInner,
				start: function(event, ui) {
					console.log(ui, event);
					var widget = ui.element;
					var zoneCol = widget.closest('.fg-col');
					var sibs = zoneCol.siblings('.fg-col');
					zoneCol.modCols('enable'); // enable overlapped columns

					for (var i = 0; i < sibs.length; i++) {
						var colSib = sibs.eq(i);

						if (colSib.children('.fg-widget').length > 0 && (colSib.offset().left == zoneCol.offset().left + zoneCol.width() || colSib.offset().top == zoneCol.offset().top + zoneCol.height()) ) {
							zoneCol.checkCollision('resize', colSib); // check for collision when resizing
						}
					}

					ui.element.data({
						'ogSize': { width: ui.element[0].offsetWidth, height: ui.element[0].offsetHeight }, // find the original size of item so we can later detect if it has changed.
						'ogParent': ui.element.closest('.fg-col') // original parent column of the widget
					});
				},
				resize: function(event, ui) {
					// DETECT COLLISION

					var widget = ui.element;
					var zoneCol = widget.parent();
					var sibs = zoneCol.siblings('.fg-col');
					// so that we can continue to resize once there is no collision
					ui.element.resizable("option", "maxHeight", null);
					ui.element.resizable("option", "maxWidth", null);

					for (var i = 0; i < sibs.length; i++) {
						var colSib = sibs.eq(i);
						if (colSib.children('.fg-widget').length > 0 && (colSib.offset().left == zoneCol.offset().left + zoneCol.width() || colSib.offset().top == zoneCol.offset().top + zoneCol.height()) ) {
							zoneCol.checkCollision('resize', colSib); // check for collision when resizing
						}
					}
					widget.setData(); // reset widget attributes
				},
				stop: function(event, ui) {
					var widget = ui.element;
					var zoneCol = widget.closest('.fg-col');
					var sibs = zoneCol.siblings('.fg-col');

					for (var i = 0; i < sibs.length; i++) {
						var colSib = sibs.eq(i);
						if (colSib.find('.fg-widget').length > 0) {
							zoneCol.checkCollision('resize', colSib); // check for collision when resizing
							dropCollision(colSib, zoneCol); // check for collision on stop, just in case...
						}
					}
					widget.setData(); // reset widget attributes
					zoneCol.modCols('disable'); // disable overlapped columns
					options.animate ? widget.animateWidget() : null;

					// reset max height and width
					widget.resizable( "option", "maxHeight", null );
					widget.resizable( "option", "maxWidth", null );

					// detect if the item size has changed so that we can remind the user to save...
					if (widget[0].offsetWidth != widget.data('ogSize').width || widget[0].offsetHeight != widget.data('ogSize').height) {
						console.log('Size has changed.');
					}
				}
			});
		}

		$.fn.checkCollision = function(type, colSib) {
			var el = $(this);

			var x1 = el[0].offsetLeft; // widget left position
			var y1 = el[0].offsetTop; // widget top position
			var b1 = y1 + el[0].offsetHeight; // widget bottom position
			var r1 = x1 + el[0].offsetWidth; // widget right position

			var x2 = colSib[0].offsetLeft; // collided widget left position
			var y2 = colSib[0].offsetTop; // collided widget top position
			var b2 = y2 + colSib[0].offsetHeight; // collided widget bottom position
			var r2 = x2 + colSib[0].offsetWidth; // collided widget right position

			// detect when a widget has collided with another during resize, then prevent resizing through that widget...
			if (type == 'resize') {
				// X-AXIS
				if ( (r1 == x2 && y1 == y2 || r1 == x2 && b1 == b2)
					|| (y2 < y1 && b2 > b1 && r2 > r1)
					|| (y1 < y2 && b1 > b2 && r2 > r1)
					|| (y2 < b1 && b2 > b1 && r1 == x2)
					|| (y1 < b2 && b1 >= b2 && y1 >= y2 && r1 >= x2 && x1 < x2))
				{
					$('.ui-resizable-resizing').resizable('option', 'maxWidth', (x2 - x1));
				}
				// Y-AXIS
				if ( (b1 == y2 && x1 == x2 || b1 == y2 && r1 == r2)
					|| (x1 < x2 && r1 > r2 && b1 == y2)
					|| (x2 < x1 && r2 > r1 && b1 == y2)
					|| (r2 > r1 && x2 < r1 && b1 == y2)
					|| (r1 > r2 && x1 < r2 && b1 == y2) )
				{
					$('.ui-resizable-resizing').resizable('option', 'maxHeight', (y2 - y1));
				}
			} else if (type == 'sort') {
				var widget = el;
				var placeholder = widget.data().sortableItem.placeholder;
				placeholder.removeClass('danger-placeholder');
				var zoneCol = placeholder.parent();
				var zoneInner = zoneCol.closest('.flexgrid-grid');
				var re = zoneInner.resetVars(); // reset zone variables

				var width = parseInt(widget.attr('data-fg-width'));
				var height = parseInt(widget.attr('data-fg-height'));

				var minWidth = parseInt(widget.attr('data-fg-minwidth'));
				var minHeight = parseInt(widget.attr('data-fg-minheight'));

				var rowStart = parseInt(zoneCol.attr('data-fg-row'));
				var rowEnd = rowStart + minHeight - 1;

				var colStart = parseInt(zoneCol.attr('data-fg-eq'));
				var colEnd = colStart + minWidth - 1;

				var danger = [];

				for (var i = 0; i < colSib.length; i++) {
					var item = colSib.eq(i);
					if (item.hasClass('fg-disabled-col')
						&& (item.attr('data-fg-eq') >= colStart && item.attr('data-fg-eq') <= colEnd)
						&& (item.attr('data-fg-row') >= rowStart && item.attr('data-fg-row') <= rowEnd)
					) {
						danger.push('');
					}
				}

				if ((options.cols - colStart) * re.cW < widget.width('minWidth')) {
					danger.push('');
				}

				if (danger.length) {
					placeholder.addClass('danger-placeholder');
				}

			}

		};

		// check for collision when dropping a widget, if it overlaps another widget.
		function dropCollision(colSib, col) {
			var widget = col.find('.fg-widget');
			var zoneInner = col.closest('.flexgrid-grid');
			var re = zoneInner.resetVars(); // reset zone variables

			var ogParent = widget.data('ogParent'); // original parent column
			res = {obj: col};

			// column postions
			var x1 = col.offset().left;
			var y1 = col.offset().top;
			var b1 = y1 + col.height();
			var r1 = x1 + col.width();

			// current sibling column positions
			var x2 = colSib.offset().left;
			var y2 = colSib.offset().top;
			var b2 = y2 + colSib.height();
			var r2 = x2 + colSib.width();

			// if the column is colliding with the sibling column at any position
			var con = (r1 > x2 && x1 < x2 && y1 < y2 && b1 > y2) || (r1 > x2 && x1 < x2 && y1 == y2 && b1 == b2) || (r1 > x2 && x1 < x2 && y1 <= y2 && b1 >= b2) || (r1 > x2 && x1 < x2 && y1 >= y2 && b1 <= b2) || (r1 > x2 && x1 < x2 && y1 < b2 && b1 > b2) || (x1 < r2 && r1 > r2 && y1 < y2 && b1 > y2) || (x1 >= x2 && r1 <= r2 && y1 < y2 && b1 > y2);
			// if the columns x-axis is colliding with the sibling columns x-axis
			var xCon = (y1 <= y2 && x1 < x2 && r1 > x2 && b1 > y2) || (y1 < y2 && b1 > b2 && x1 < x2 && r1 > x2) || (b1 >= b2 && y1 < b2 && x1 < x2 && r1 > x2) || (y1 > y2 && b1 < b2 && x1 < x2 && r1 > x2) || (y1 == y1 && b1 == b2 && x1 < x2 && r1 > x2);
			// if the columns y-axis is colliding with the sibling columns y-axis
			var yCon = (x1 < r2 && r1 > r2 && y1 < y2 && b1 > y2) || (x1 >= x2 && r1 <= r2 && y1 < y2 && b1 > y2) || (x1 <= x2 && r1 >= r2 && y1 < y2 && b1 > y2) || (r1 > x2 && x1 < x2 && y1 < y2 && b1 > y2);

			if ($(ogParent).length > 0) { // if we dragged from another column
				if (xCon && yCon) { // if both the x-axis and y-axis have collision
					var xConVal = x2 - x1;
					var yConVal = y2 - y1;
					if (xConVal > yConVal) { // find which axis has more collision and resize for that one
						xCollision();
					} else {
						yCollision();
					}
				} else if (xCon) { // if only x-axis collision, resize for x-axis
					xCollision();
				} else if (yCon) { // if only y-axis collision, resize for y-axis
					yCollision();
				}

				function xCollision() { // x-axis collision
					var saveWidth = widget.width(); // save the width
					widget.width(x2 - x1);
					if (x2 - x1 < widget.width('minWidth')) { // if new width is less than the minWidth ~
						var de = widget.detach();
						de.width(saveWidth); // ~ resize back to saveWidth
						$(ogParent).append(de); // ~ and revert to ogParent
					}
				}
				function yCollision() { // y-axis collision
					var saveHeight = widget.height(); // save the height
					widget.height(y2 - y1);
					if (y2 - y1 < widget.height('minHeight')) { // if new height is less than the minHeight ~
						var de = widget.detach();
						de.height(saveHeight); // ~ resize back to saveHeight
						$(ogParent).append(de); // ~ and revert to ogParent
					}
				}
			} else if ($(ogParent).length <= 0) { // if we added a new widget
				var goHere = col;
				while (con) { // detach the widget and append to the next open fg-enabled-col until there is no collision
					var de = goHere.find('.fg-widget').detach();
					goHere = goHere.nextAll('.fg-enabled-col').first();
					if (goHere.length == 0 || goHere == undefined || goHere == null) {
						zoneInner.createRow();
						goHere = zoneInner.find('.fg-widget').last().closest('.fg-col').nextAll('.fg-enabled-col').first();
					}
					goHere.append(de);
					de.setData();

					// check for zone overflow, if true head the widget will head for the next column and check for collision again
					var zo = goHere.zoneOverflow();
					goHere = zo.obj;

					// reset position parameters
					x1 = goHere.offset().left;
					y1 = goHere.offset().top;
					b1 = y1 + goHere.height();
					r1 = x1 + goHere.width();

					// reset condition, otherwise the position variables will still be attached to "el" rather than "goHere"
					con = (r1 > x2 && x1 < x2 && y1 < y2 && b1 > y2) || (r1 > x2 && x1 < x2 && y1 == y2 && b1 == b2) || (r1 > x2 && x1 < x2 && y1 <= y2 && b1 >= b2) || (r1 > x2 && x1 < x2 && y1 >= y2 && b1 <= b2) || (r1 > x2 && x1 < x2 && y1 < b2 && b1 > b2) || (x1 < r2 && r1 > r2 && y1 < y2 && b1 > y2) || (x1 >= x2 && r1 <= r2 && y1 < y2 && b1 > y2);

					if (!con) {
						break;
					}
				}
				res = {obj: goHere};
			}
			return res;
		}

		function moreHeight(el) { // when a widget is appended but it overflows the zone height, append more rows until the height + the data-fg-row == the last rows 'data-fg-row'
			var zoneInner = el.closest('.flexgrid-grid');
			var widget = el.find('.fg-widget');
			var row_and_height = parseInt(el.attr('data-fg-row')) + parseInt(widget.attr('data-fg-height'));
			var last_row_num = parseInt(zoneInner.find('.fg-col').last().attr('data-fg-row'));
			if (row_and_height != last_row_num) {
				var amountNeeded = (row_and_height - last_row_num) - 1;
				for (n = 0; n < amountNeeded; n++) {
					zoneInner.createRow();
				}
			}
			widget.setData();
			widget.modCols('disable');
		}

		$.fn.animateWidget = function() {
			var widget = $(this).find('.fg-widget-inner');
			widget.queue('fx', function(next) {
				$(this).addClass('animate');
				next();
			});
			widget.delay(400).queue('fx', function(next) {
				$(this).removeClass('animate');
				next();
			});
		}

		$.fn.clearGrid = function() {
			var zoneInner = $(this);
			var widgets = zoneInner.find('.fg-widget');
			for (var i = 0; i < widgets.length; i++) {
				var widget = widgets.eq(i);
				var originalContainer = widget.data('originalContainer') != undefined || widget.data('originalContainer') != null ? widget.data('originalContainer') : widget.closest('.fg-col');
				if (!originalContainer.hasClass('fg-col')) { // if the widget came from a different container
					var de = widget.detach();
					originalContainer.append(de);
					de.css({'width':widget.data('ogWidth'), 'height':widget.data('ogHeight'), 'min-width':'', 'min-height':'', 'max-width':'', 'max-height':''});
				} else { // if the widget was appended by `.addWidget()`
					widget.remove();
				}
			}
			zoneInner.html('');
			zoneInner.buildGrid();
		}

		$.fn.getOption = function(option) {
			var res = option === undefined || option === null ? options : options[option];
			return res;
		}
		$.fn.toggleGridlines = function() {
			var zoneInner = $(this);
			options.showGridlines = !options.showGridlines;
			if (!options.showGridlines) {
				$('.fg-gridlines').removeClass('fg-gridlines');
			} else {
				zoneInner.find('.fg-col').addClass('fg-gridlines');
			}
		}

		$.fn.saveGrid = function() {
			var zoneInner = $(this);
			var array = [
				{
					cols: options.cols,
					rows: options.rows,
					widgets: []
				}
			];
			var widgets = zoneInner.find('.fg-widget');
			$(widgets).each(function() {
				var widget = $(this);
				array[0]['widgets'].push({
					data_x: widget.attr('data-fg-x'),
					data_y: widget.attr('data-fg-y'),
					data_width: widget.attr('data-fg-width'),
					data_height: widget.attr('data-fg-height'),
					data_minWidth: widget.attr('data-fg-minwidth'),
					data_minHeight: widget.attr('data-fg-minheight'),
					data_maxWidth: widget.attr('data-fg-maxwidth'),
					data_maxHeight: widget.attr('data-fg-maxheight'),
					innerHtml: widget.find('.fg-widget-inner').html()
				});
			});
			return array;
		}

		// end
	}

	var zone = $('.flexgrid-container');
	var zoneInner = zone.find('.flexgrid-grid');
	zoneInner.setFlexGrid({
		cols: 22,
		rows: 22,
		defaultHeight: 1,
		defaultWidth: 1,
		minWidth: 1,
		minHeight: 1,
	});
	// console.log(zoneInner.getOption());
	zoneInner.buildGrid();

	$(document).on('click', '.add-row', function() {
		zoneInner.addRow();
	});
	$(document).on('click', '.remove-row', function() {
		zoneInner.removeRow();
	});
	$(document).on('click', '.fg-add-widget', function() {
		// widget.find('.fg-widget-inner').css('background', options.background != null ? options.background[Math.floor(Math.random() * options.background.length)] : '');
		var widget = $('<div class="fg-widget"><div class="fg-widget-inner fg-widget-handle"></div></div>');
		zoneInner.addWidget({widget:widget});
	});

	var widget = $('<div class="fg-widget"><div class="fg-widget-inner fg-widget-handle"></div></div>');
	// for(var i = 0; i < 100; i++) {
	// 	zoneInner.addWidget({widget:widget});
	// }

	$(document).on('click', '.fg-remove-widget', function() {
		var widget = $(this).closest('.fg-widget');
		zoneInner.removeWidget(widget);
	});
	$(document).on('click', '.togglegridlines', function() {
		zoneInner.toggleGridlines();
	});
	$(document).on('click', '.clear-flexgrid', function() {
		zoneInner.clearGrid();
	});
	$(document).on('click', '.save-flexgrid', function() {
		var grid = zoneInner.saveGrid();
		var widgets = grid[0]['widgets'];
		console.log(widgets);
		console.log(grid);
	});

	// add an array of widgets
	var widgets = [
		{
			width: 6,
			height: 2,
			x: 8,
			y: 0,
			container:'<div class="region top bar">\n' +
				'\t\t<div class="container"></div>\n' +
				'  </div>',
		},
		{
			width: 5,
			height: 1,
			x: 0,
			y: 8,
			container:'<div class="region top left"><div class="container"></div></div>',
		},
		{
			width: 14,
			height: 6,
			x: 4,
			y: 2,
			container:'<div class="region top center"><div class="container"></div></div>',
		},
		{
			width: 6,
			height: 4,
			x: 16,
			y: 8,
			container:'<div class="region top right"><div class="container"></div></div>',
		},
		{
			width: 3,
			height: 1,
			x: 9,
			y: 19,
			container: '<div class="region bottom center"><div class="container"></div></div>',
		},
		{
			width: 8,
			height: 4,
			x: 14,
			y: 18,
			container: '<div class="region bottom right"><div class="container"></div></div>',
		},
	];

	for (var i = 0; i < widgets.length; i++) {

		var x = widgets[i].x;
		var y = widgets[i].y;
		var width = widgets[i].width;
		var minWidth = widgets[i].minWidth;
		var maxWidth = widgets[i].maxWidth;
		var height = widgets[i].height;
		var minHeight = widgets[i].minHeight;
		var maxHeight = widgets[i].maxHeight;
		var containerClass = widgets[i].container;
		// var inner = widgets[i].inner ? widgets[i].inner : '';



		var widget = $('<div class="fg-widget custom-widget"><div class="fg-widget-inner fg-widget-handle">'+containerClass+'</div></div>');
		zoneInner.addWidget({
			widget: widget,
			x:x, y:y,
			width:width, height:height,
			minWidth:minWidth, minHeight: minHeight,
			maxWidth:maxWidth, maxHeight: maxHeight
		});
	}

	$(document).on('resizestop', '.custom-widget', function() {
		var text = $(this).find('.inner-icon');
		var width = $(this).attr('data-fg-width');
		var height = $(this).attr('data-fg-height');
		text.text(width+'x'+height);
	});

	$('.widget-holder').sortable({
		connectWith: '.fg-enabled-col', // connect to the grid columns
		items: '.fg-widget', // make sure the only sortable items are the widgets
		handle: '.fg-widget-handle', // include sortable handle
		helper: 'clone',
		appendTo: 'body'
	});


	// nested stuff - not done
	$('.nested-holder').sortable({
		connectWith: '.fg-nested-container',
		items: '.nested-widget',
		placeholder: 'nested-placeholder',
		handle: '.nested-widget-inner',
		zIndex: 9999,
		start: function(event, ui) {
			if ( ui.item.hasClass('cloner') ) {
				clone = ui.item.clone();
				return clone;
			}
		},
		stop: function(event, ui) {
			if ( ui.item.parent().hasClass('nested-holder') ) {
				ui.item.css({'width':'100px', 'height':'100px', 'min-width':'100px', 'min-height':'100px', 'position':'relative !important'});
			}
			if (ui.item.hasClass('cloner') && ! ui.item.parent('.nested-holder').length ) {
				$(this).append(clone);
			}
		}
	});

	$('.fg-nested-container').sortable({
		items: '.nested-widget',
		handle: '.nested-widget-inner',
		placeholder: 'nested-placeholder',
		connectWith: '.fg-nested-container'
	});

});


