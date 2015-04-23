/*
Copyright (c) 2015 Open Learning Global Pty Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.
See the License for the specific language governing permissions and
limitations under the License.

OpenLearning App API, v0.1.0 - openlearning.io

*/
window.OpenLearning = (function() {
	var ol, api, events, callbacks, defaultOrigin, triggerEvent,
		parent, isReady, readyData,
		send, recv, getHeight,
	    getParameter, dataAPI, resourceReadUpdate, resourceLookupExec, genId, init,
	    initRequestFunc, isInitSent, resizeInterval, observer, isObserving, toISOString;

	// default origin to use if no origin parameter is passed to this app
	defaultOrigin = 'https://www.openlearning.com';

	parent = window.parent;
	isReady = false;
	events = {};
	callbacks = {};
	isInitSent = false;
	isObserving = false;

    // called with response data from the parent frame
    // when responding to an initialization message
	init = function(data) {
		ol.theme = data.theme || {};
		ol.page = data.page || {};
		ol.user.data = data.userData || {};
		ol.setup.data = data.setupData || {};
		ol.user.profile = data.profile || {};
		ol.user.group = data.group || null;
		ol.user.activeClass = data.activeClass || null;
		ol.user.timeLoaded = data.timeUserDataLoaded || null;
		ol.setup.timeLoaded = data.timeSetupDataLoaded || null;
		ol.isSizeLocked = false;

		readyData = {
			'theme': ol.theme,
			'user': ol.user,
			'setup': ol.setup
		};

		// enable the window-resizing DOM watcher
		ol.enableWatcher();
		// request a resize (set the window to the correct size)
		ol.resize();
		// fire any read listeners
		triggerEvent('ready', readyData);
	};

	getHeight = function() {
		// calculate the height of the app window
		return document.documentElement.scrollHeight;
	};

	genId = function() {
		// generate a unique ID based on the current time and a random number
		var id, gen;

		gen = function() {
			return new Date().getTime() + '' + Math.floor(Math.random() * 1000000);
		};

		do id = gen(); while (callbacks[id]);

		return id;
	};

	isArray = function(value) {
		return Object.prototype.toString.call(value) === '[object Array]';
	};

	getParameter = function(name, defaultValue) {
		// get a query parameter by name (and an optional default value)
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var results = (new RegExp("[\\?&]" + name + "=([^&#]*)")).exec(location.search);
		return results == null ? (defaultValue || '') : decodeURIComponent(results[1].replace(/\+/g, " "));
	};

	if ('toISOString' in new Date()) {
		toISOString = function(isoString) {
			return new Date(isoString);
		};
	} else {
		toISOString = function(isoString) {
			var d;
			var matches = isoString && isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.(\d{3}))?Z$/);
			if (matches) {
				d = new Date();
				d.setUTCFullYear(matches[1], matches[2] - 1, matches[3]);
				d.setUTCHours(matches[4], matches[5], matches[6], matches[8] || 0);
			} else {
				d = new Date(isoString);
			}
			return d;
		};
	}
	
	// Called to trigger event listeners for a given eventName
	triggerEvent = function(eventName, data) {
		var i, handlers;

		handlers = (events[eventName] || []);

		for (i = 0; i !== handlers.length; ++i) {
			handlers[i](data);
		}

		return ol;
	};

	send = function(method, data, callback) {
		// send RPC message to the host frame
		var message = {
			'method': method,
			'data': data || {},
			'key': ol.apiKey,
			'id': genId()
		};

		if (method !== 'init' && !isReady) {
			throw {
				'name': 'API Not Initialized',
				'message': 'API must be initialized (ready) before methods can be called.'
			};
		}

		if (parent) {
			parent.postMessage(JSON.stringify(message), ol.targetDomain);
		} else {
			ol.log('Unable to send ' + method + ' message. No parent document.');
		}

		if (callback) {
			callbacks[message.id] = callback;
		}
	};

	recv = function(evt) {
		// receive RPC message from host frame
		var i, message, id, result, callback;
		
		if (ol.targetDomain && ol.targetDomain !== "*" && evt.origin !== ol.targetDomain) {
			return;
		}
		
		try {
			message = JSON.parse(evt.data);
		} catch (err) {
			ol.log('Unrecognised message received: ' + evt.data + ' (' + err + ')');
			return;
		}

		if (message.method === 'init') {
			isReady = true;
			init(message.data);
		} else if (message.method === 'response') {
			id = message.id;
			result = message.result;
			callback = callbacks[id];
			callback && callback(result);
			delete callbacks[id];
		} else {
			triggerEvent(message.method, message.data);
		}
	};

	// The OpenLearning function accepts a function to call on ready
	// otherwise it acts as a getter or setter
	ol = function() {
		if (typeof arguments[0] === 'function') {
			if (!isReady) {
				ol.on('ready', arguments[0]);
			} else {
				arguments[0](readyData);
			}
		} else if (arguments[0] === 'string') {
			if ({}.toString.call(ol[arguments[0]]) === '[object Function]') {
				// call the method given by string, e.g.
				// OL('resize', height);
				return ol[arguments[0]].apply(ol, Array.prototype.slice.call(arguments, 1));
			} else if (typeof arguments[1] !== 'undefined') {
				// act as a setter
				ol[arguments[0]] = arguments[1];
				return ol;
			} else {
				// act as a getter
				return ol[arguments[0]];
			}
		}
		return ol;
	};

	// define a Cross-platform indexOf helper function
	if (Array.prototype.indexOf) {
		ol.indexOf = function(arr, what, i) {
			return arr.indexOf(what, i);
		};
	} else {
		ol.indexOf = function(arr, what, i) {
			var len = arr.length;
			i = i || 0;
			while (i < len) {
				if (arr[i] === what) return i;
				++i;
			}
			return -1;
		};
	}

	// Retrieve the API key from the query parameter or the subdomain
	ol.apiKey = getParameter('key', window.location.host.split('.')[0]);

	// Retrieve the targetDomain origin from the query parameter, or use
	// the default origin
	ol.targetDomain = getParameter('origin', defaultOrigin);

	// Register an event listener for a given eventName
	ol.on = function(eventName, handler) {
		events[eventName] = events[eventName] || [];
		events[eventName].push(handler);
		return ol;
	};

	// Deregister an event listener
	ol.off = function(eventName, handler) {
		var handlers, idx;
		
		handlers = (events[eventName] || []);

		if (handler) {
			while ((idx = ol.indexOf(handlers, handler)) !== -1) {
				handlers.splice(idx, 1);
			}
		} else {
			handlers = [];
		}

		events[eventName] = handlers;
		return ol;
	};

	// Trigger a page event
	ol.trigger = function(eventName, data) {
		send('trigger', {
			'eventName': eventName,
			'data': data
		});

		return ol;
	};

	// Called to tell the parent frame to resize
	// the app to a certain height (or calculate the height if not given)
	// also accepts an optional lock parameter. If true, auto-resizing will
	// be disabled until lock is set to false.
	ol.resize = function(height, lock) {
		var wasObserving = isObserving;
		
		if (typeof lock === 'boolean') {
			ol.isSizeLocked = lock;
		}

		if (isObserving) {
			ol.disableWatcher();
		}

		// Set a short delay before determining height
		setTimeout(function() {
			height = height || getHeight();

			send('resize', {
				'height': height
			}, function() {
				if (wasObserving) {
					ol.enableWatcher();
				}
			});
		}, 100);

		return ol;
	};

	// Called to reload an item on the parent-side
	// called with 'self' to reload the app itself.
	ol.refresh = function(what) {
		send('refresh', {
			'what': what || 'self'
		});
		return ol;
	};

	// Attach a file to the current page which situates the app
	ol.attachFile = function(filename, dataURI, overwrite, callback) {
		if (typeof overwrite === 'function') {
			callback = overwrite;
			overwrite = false;
		}

		send('attachFile', {
			'filename': filename,
			'dataURI': dataURI,
			'overwrite': overwrite
		}, callback);
		return ol;
	};

	// Ask the parent frame to pop up a notification bubble
	ol.notify = function(title, message, status) {
		send('notify', {
			'title': title,
			'message': message,
			'status': status || 'default'
		});
		return ol;
	};

	// Get the roles of the current user in this context
	ol.getRoles = function(callback) {
		send('getRoles', {}, callback);
		return ol;
	};

	resourceReadUpdate = function(operation) {
		return function(resource, id, method, args, callback) {
			var data = {
				'operation': operation,
				'resource': resource,
				'id': id
			};

			if (isArray(method)) {
				data['methods'] = method;
				callback = args;
			} else {
				data['method'] = method;
				data['args'] = args;
			}

			send('resource', data, callback);
			return ol;
		};
	};

	resourceLookupExec = function(operation) {
		return function(resource, method, args, callback) {
			var data = {
				'operation': operation,
				'resource': resource,
				'method': method,
				'args': args
			};

			send('resource', data, callback);
			return ol;
		};
	};

	// Resource API
	ol.resource = {
		'read': resourceReadUpdate('read'),
		'update': resourceReadUpdate('update'),
		'lookup': resourceLookupExec('lookup'),
		'execute': resourceLookupExec('execute'),
		'create': function(resource, data, methods, callback) {
			if (!isArray(methods)) {
				callback = methods;
			}

			send('resource', {
				'operation': 'create',
				'resource': resource,
				'data': data,
				'methods': methods
			}, callback);

			return ol;
		},
		'delete': function(resource, id, callback) {
			send('resource', {
				'operation': 'delete',
				'resource': resource,
				'id': id
			}, callback);

			return ol;
		}
	};

	// Set the dirty flag (true if the state is a work-in-progress and
	// hasn't been saved) for the app
	ol.setDirtyFlag = function(flag) {
		send('setDirtyFlag', {
			'dirtyFlag': flag
		});
		return ol;
	};

	// Enable DOM watching to automatically call resize requests
	ol.enableWatcher = function() {
		var MutationObserver;
		MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

		if (isObserving || observer || resizeInterval) {
			return;
		}

		isObserving = true;

		if (MutationObserver) {
			observer = new MutationObserver(function(mutations) {
				var addLoadListener;

				if (ol.isSizeLocked) {
					return;
				}

				addLoadListener = function(element){
					if (element.height === undefined || element.width === undefined || 0 === element.height || 0 === element.width){
						window.addEventListener(element,'load', function imageLoaded() {
							if (!ol.isSizeLocked) {
								ol.resize();
							}
						});
					}
				}

				mutations.forEach(function(mutation) {
					if (mutation.type === 'attributes' && mutation.attributeName === 'src'){
						addLoadListener(mutation.target);
					} else if (mutation.type === 'childList'){
						var images = mutation.target.querySelectorAll('img');
						Array.prototype.forEach.call(images, function(image) {
							addLoadListener(image);
						});
					}
				});
				
				ol.resize();
			});
			
			observer.observe(document.querySelector('body'), {
				attributes: true,
				attributeOldValue: false,
				characterData: true,
				characterDataOldValue: false,
				childList: true,
				subtree: true
			});
		} else {
			resizeInterval = setInterval(function() {
				if (!ol.isSizeLocked) {
					ol.resize();
				}
			}, 200);
		}
	};

	// Disable DOM watching
	ol.disableWatcher = function() {
		if (observer) {
			observer.disconnect();
			observer = null;
			ol.log('Watcher Disabled');
		}
		if (resizeInterval) {
			clearInterval(resizeInterval);
			resizeInterval = null;
			ol.log('Watcher Disabled (Interval)');
		}

		isObserving = false;
	};

	// Build a data API for different data sources
	dataAPI = function(dataSrc, name) {
		var callbackWrapper;

		callbackWrapper = function(callback) {
			return function(result) {
				if (result.success && result.timeLoaded && result.timeLoaded > ol[name].timeLoaded) {
					ol[name].timeLoaded = result.timeLoaded;

					if (result.data) {
						ol[name].data = result.data;
					}
				}
				callback && callback(result);
			};
		};

		return {
			// Merge the given updates with the current state
			// (performs a 3-way merge with the revision at load time,
			//  the latest data, and the new updates)
			merge: function(updates, callback, showModal) {
				send('merge' + dataSrc, {
					updates: updates,
					timeLoaded: ol[name].timeLoaded,
					showModal: showModal
				}, callbackWrapper(callback));
				return ol;
			},

			// Replace old data with the new data, regardless of what
			// changes have been made since load
			replace: function(newData, callback) {
				send('replace' + dataSrc, {
					newData: newData
				}, callbackWrapper(callback));
				return ol;
			},

			// Perform an update operation
			// Operations such as: 'inc', 'push', 'addtoset', 'set'
			//    e.g. to increment 'myField' by 1:
			//    OL.update({'myField': 1}, 'inc', function(result) { ... });
			update: function(updates, operation, callback) {
				send('update' + dataSrc, {
					updates: updates,
					operation: operation
				}, callbackWrapper(callback));
				return ol;
			}
		}
	};

	// create data API for setup data
	ol.setup = dataAPI('SetupData', 'setup');

	// create data API for user data
	ol.user  = dataAPI('UserData', 'user');

	// Called to log an interaction (or multiple interactions)
	// with an app
	ol.user.logInteraction = function(n) {
		n = n || 1;
		send('logInteraction', {
			'inc': n
		});
		return ol;
	};

	// Called to assess a user's app interaction
	ol.user.assess = function(progress, isCorrect, feedback, callback) {
		if (typeof feedback === 'function') {
			callback = feedback;
			feedback = null;
		}

		send('assess', {
			'progress': progress,
			'isCorrect': isCorrect,
			'feedback': feedback
		}, callback);
		return ol;
	};

	// A cross-platform protected debug log function
	ol.log = function() {
		window.console && console.log && console.log.apply(console, arguments);
	};

	// Pad a string to a certain length by prepending characters (default zeros)
	ol.padString = function(number, length, paddingChar) {
		var str = '' + number;

		if (!paddingChar) {
			paddingChar = '0';
		}

		while (str.length < length) {
			str = paddingChar + str;
		}

		return str;
	};

	// A ISO-8601 date formatter
	ol.formatDateTime = function(isoTimestamp, format) {
		var monthNames, dayNames;
		var meridiem, hours, hours24, day, date, month, min, sec, year;
		var timestamp;

		if (!format) {
			format = '%a, %d %b %Y %I:%M%p';
		}

		timestamp = typeof(isoTimestamp) === 'string' ? toISOString(isoTimestamp) : isoTimestamp;

		dayNames   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

		meridiem = "am";
		hours   = timestamp.getHours();
		hours24 = timestamp.getHours();
		day     = timestamp.getDay();
		month   = timestamp.getMonth();
		min     = timestamp.getMinutes();
		year    = timestamp.getFullYear();
		date    = timestamp.getDate();

		if (hours > 11) {
			hours -= 12;
			meridiem = "pm";
		}

		if (hours == 0) {
			hours = 12;
		}

		return format
			.replace(/%a/g, dayNames[day].substring(0, 3))
			.replace(/%A/g, dayNames[day])
			.replace(/%d/g, ol.padString(date, 2))
			.replace(/%D/g, date)
			.replace(/%b/g, monthNames[month].substring(0, 3))
			.replace(/%B/g, monthNames[month])
			.replace(/%Y/g, year)
			.replace(/%I/g, ol.padString(hours, 2))
			.replace(/%H/g, ol.padString(hours24, 2))
			.replace(/%M/g, ol.padString(min, 2))
			.replace(/%S/g, ol.padString(sec, 2))
			.replace(/%p/g, meridiem)
			.replace(/%P/g, meridiem.toUpperCase())
		;
	};
	
	// Cross-platform event listener registration
	ol.addEvent = function(base, evt, delegate) {
		if (base.addEventListener) {
			base.addEventListener(evt, delegate, false);
		} else {
			if (evt === 'DOMContentLoaded') {
				evt = 'readystatechange';
			}
			base.attachEvent('on' + evt, delegate);
		}
	};

	// Start listening for postMessage events
	ol.addEvent(window, 'message', recv);

	// A function called to init the API only once
	initRequestFunc = function() {
		// Only call this function once
		if (!isInitSent) {
			send('init');
			isInitSent = true;
		}
	};

	// If the document's already loaded, call the init method
	if (document.readyState === "complete") {
		initRequestFunc();
	}
	// Listen for document or window loaded and call the init method
	ol.addEvent(document, 'DOMContentLoaded', initRequestFunc);
	ol.addEvent(window, 'load', initRequestFunc);

	return ol;
})();

window.OL = window.OpenLearning;
