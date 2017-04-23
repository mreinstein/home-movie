(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

const upsocket = require('upsocket')


const up = upsocket()

up.subscribe('message', function(data) {
  console.log('recvd message!:', data)
})

up.connect('ws://media-server:8002')


async function getVideoList() {
  const response = await fetch('/videos')
  const result = await response.json()
  console.log('result:', result)
  return result
}

async function renderVideoList() {
  const videos = await getVideoList()
  for(let i=0; i < videos.length; i++) {
    const a = document.createElement('a')
    a.href = '#'
    a.innerText = videos[i]
    a.addEventListener('click', function(ev) {
      ev.preventDefault()
      const mediaUrl = `http://192.168.42.74:8000/videos/${videos[i]}`
      console.log('playing', mediaUrl)
      up.send(JSON.stringify({ type: 'PLAY', mediaUrl }))
    })

    const p = document.createElement('p')
    p.appendChild(a)
    document.body.appendChild(p)
  }
}

renderVideoList()

},{"upsocket":6}],2:[function(require,module,exports){
'use strict';

var nextTick = require('next-tick');
var removeItems = require('remove-array-items');

// very simple publish/subcribe system
module.exports = function pubsub() {
  var _listeners = {};

  // TODO: implement a once(topic, handler) ?

  var publish = function publish(topic) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    // execute these in the next process tick rather than synchronously. this
    // enables subscribing to topics after publishing and not missing events
    // that are published before subscribing in the same event loop
    nextTick(function () {
      if (!_listeners[topic]) return;
      for (var i = 0; i < _listeners[topic].length; i++) {
        var _listeners$topic;

        (_listeners$topic = _listeners[topic])[i].apply(_listeners$topic, args);
      }
    });
  };

  var subscribe = function subscribe(topic, handler) {
    if (!_listeners[topic]) _listeners[topic] = [];

    // if a function is registered for a topic more than once, likely a bug
    if (_alreadySubscribed(topic, handler)) {
      console.warn('double adding handler for topic:', topic, ' handler:', handler, 'perhaps this is a bug?');
    }

    _listeners[topic].push(handler);
  };

  var unsubscribe = function unsubscribe(topic, handler) {
    if (_listeners[topic]) {
      for (var i = 0; i < _listeners[topic].length; i++) {
        if (_listeners[topic][i] === handler) {
          removeItems(_listeners[topic], i, 1);
          return;
        }
      }
    }
  };

  var _alreadySubscribed = function _alreadySubscribed(topic, handler) {
    if (!_listeners[topic]) return false;

    for (var i = 0; i < _listeners[topic].length; i++) {
      if (_listeners[topic][i] === handler) {
        return true;
      }
    }

    return false;
  };

  return Object.freeze({ publish: publish, subscribe: subscribe, unsubscribe: unsubscribe });
};

},{"next-tick":3,"remove-array-items":5}],3:[function(require,module,exports){
(function (process){
'use strict';

var callable, byObserver;

callable = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

byObserver = function (Observer) {
	var node = document.createTextNode(''), queue, currentQueue, i = 0;
	new Observer(function () {
		var callback;
		if (!queue) {
			if (!currentQueue) return;
			queue = currentQueue;
		} else if (currentQueue) {
			queue = currentQueue.concat(queue);
		}
		currentQueue = queue;
		queue = null;
		if (typeof currentQueue === 'function') {
			callback = currentQueue;
			currentQueue = null;
			callback();
			return;
		}
		node.data = (i = ++i % 2); // Invoke other batch, to handle leftover callbacks in case of crash
		while (currentQueue) {
			callback = currentQueue.shift();
			if (!currentQueue.length) currentQueue = null;
			callback();
		}
	}).observe(node, { characterData: true });
	return function (fn) {
		callable(fn);
		if (queue) {
			if (typeof queue === 'function') queue = [queue, fn];
			else queue.push(fn);
			return;
		}
		queue = fn;
		node.data = (i = ++i % 2);
	};
};

module.exports = (function () {
	// Node.js
	if ((typeof process === 'object') && process && (typeof process.nextTick === 'function')) {
		return process.nextTick;
	}

	// MutationObserver
	if ((typeof document === 'object') && document) {
		if (typeof MutationObserver === 'function') return byObserver(MutationObserver);
		if (typeof WebKitMutationObserver === 'function') return byObserver(WebKitMutationObserver);
	}

	// W3C Draft
	// http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
	if (typeof setImmediate === 'function') {
		return function (cb) { setImmediate(callable(cb)); };
	}

	// Wide available standard
	if ((typeof setTimeout === 'function') || (typeof setTimeout === 'object')) {
		return function (cb) { setTimeout(callable(cb), 0); };
	}

	return null;
}());

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
'use strict'

/**
 * Remove a range of items from an array
 *
 * @function removeItems
 * @param {Array<*>} arr The target array
 * @param {number} startIdx The index to begin removing from (inclusive)
 * @param {number} removeCount How many items to remove
 */
module.exports = function removeItems(arr, startIdx, removeCount)
{
  var i, length = arr.length

  if (startIdx >= length || removeCount === 0) {
    return
  }

  removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount)

  var len = length - removeCount

  for (i = startIdx; i < len; ++i) {
    arr[i] = arr[i + removeCount]
  }

  arr.length = len
}

},{}],6:[function(require,module,exports){
'use strict';

var WebSocket = require('ws');
var backoff = require('./lib/fibonacci-backoff');
var pubsub = require('ev-pubsub');

module.exports = function upsocket() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _pubsub = pubsub(),
      publish = _pubsub.publish,
      subscribe = _pubsub.subscribe,
      unsubscribe = _pubsub.unsubscribe;

  var _buffer = [];
  var _preamble = options.preamble;
  var _buffering = options.buffer === false ? false : true;
  var fibonacciBackoff = backoff({ initialDelay: 100, maxDelay: 8000 });

  var socket = void 0,
      _sending = void 0;
  var _timeout = undefined;
  var _shouldReconnect = true;

  // close the underlying socket, and disable automatic reconnection
  // buffered data will not be sent in some cases.
  var close = function close() {
    _shouldReconnect = false;
    _buffer.length = 0;
    if (socket && socket.readyState === socket.OPEN) {
      socket.close();
    }
  };

  var connect = function connect(url) {
    socket = url instanceof WebSocket ? url : new WebSocket(url);

    socket.onopen = function () {
      if (_preamble && (!_buffer.length || _buffer[0] !== _preamble)) {
        _buffer.unshift(_preamble);
      }

      publish('open');
      fibonacciBackoff.reset();
      _drainBuffer();
    };

    socket.onclose = function (evt) {
      publish('close');
      if (!_shouldReconnect) {
        return;
      }

      // try to reconnect in ever-increasing time intervals using fibonacci sequence
      var delayTime = fibonacciBackoff.next();
      setTimeout(function () {
        connect(socket.url);
      }, delayTime);
    };

    socket.onerror = function (err) {
      // ignore connection refused messages because this module handles
      // auto-reconnects, so it's not considered an error
      if (err.code && err.code !== 'ECONNREFUSED') {
        publish('error', err);
      }
    };

    socket.onmessage = function (message) {
      publish('message', message.data);
    };
  };

  var send = function send(message) {
    _buffer.push(message);
    if (_timeout === undefined) {
      _timeout = setTimeout(_drainBuffer, 0);
    }
  };

  // send the complete contents of the buffer
  var _drainBuffer = function _drainBuffer() {
    if (!socket || socket.readyState !== socket.OPEN) {
      _clearTimeout();

      if (_buffering === false) {
        // if we're not buffering messages while disconnected, discard contents
        _buffer.length = 0;
      }

      return;
    }

    if (!_buffer.length) {
      _clearTimeout();
      return;
    }

    if (!_sending) {
      _sending = true;
      socket.send(_buffer[0]);
    } else if (socket.bufferedAmount === 0) {
      // current message finished sending, send the next one
      _buffer.shift();
      _sending = false;
    }

    _timeout = setTimeout(_drainBuffer, 0);
  };

  var _clearTimeout = function _clearTimeout() {
    if (_timeout !== undefined) {
      clearTimeout(_timeout);
      _timeout = undefined;
    }
  };

  return Object.freeze({ close: close, connect: connect, send: send, publish: publish, subscribe: subscribe, unsubscribe: unsubscribe });
};

},{"./lib/fibonacci-backoff":7,"ev-pubsub":2,"ws":8}],7:[function(require,module,exports){
'use strict';

module.exports = function fibonacciBackoff() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var backoffDelay = void 0,
      nextBackoffDelay = void 0;
  var initialDelay = options.initialDelay || 100;
  var maxDelay = options.maxDelay || 10000;
  var randomisationFactor = options.randomisationFactor || 0;

  var next = function next() {
    var nextDelay = Math.min(nextBackoffDelay, maxDelay);

    nextBackoffDelay += backoffDelay;

    backoffDelay = nextDelay;

    var randomisationMultiple = 1 + Math.random() * randomisationFactor;
    var randomizedDelay = Math.round(backoffDelay * randomisationMultiple);

    return randomizedDelay;
  };

  var reset = function reset() {
    backoffDelay = 0;
    nextBackoffDelay = initialDelay;
  };

  reset();

  return Object.freeze({ next: next, reset: reset });
};

},{}],8:[function(require,module,exports){
(function (global){
'use strict';

// replace the ws module with the Browser's WebSocket implementation
// when in the browser environment

module.exports = global.WebSocket;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
