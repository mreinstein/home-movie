(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

const upsocket = require('upsocket')


const up = upsocket()

up.subscribe('message', function(data) {
  console.log('recvd message!:', data)
})

up.connect('ws://movies-cast.local:8002')

async function getVideoList() {
  const response = await fetch('/videos')
  return response.json()
}

async function renderVideoList() {
  const videos = await getVideoList()
  for(let i=0; i < videos.length; i++) {
    const a = document.createElement('a')
    a.href = '#'
    a.innerText = videos[i]
    a.addEventListener('click', function(ev) {
      ev.preventDefault()
      const mediaUrl = `http://movies.local:8000/videos/${videos[i]}`
      console.log('playing', mediaUrl)
      up.send(JSON.stringify({ type: 'PLAY', mediaUrl }))
    })

    const p = document.createElement('p')
    p.appendChild(a)
    document.body.appendChild(p)
  }
}

renderVideoList()

},{"upsocket":5}],2:[function(require,module,exports){
'use strict'

const nextTick    = require('next-tick-2')
const removeItems = require('remove-array-items')


// very simple publish/subcribe system
module.exports = function pubsub() {
  const _listeners = {}

  // TODO: implement a once(topic, handler) ?

  let publish = function(topic, ...args) {
    // execute these in the next process tick rather than synchronously. this
    // enables subscribing to topics after publishing and not missing events
    // that are published before subscribing in the same event loop
    nextTick(function() {
      if(!_listeners[topic]) return
      for(let i=0; i < _listeners[topic].length; i++) {
        _listeners[topic][i](...args)
      }
    })
  }

  let subscribe = function(topic, handler) {
    if (!_listeners[topic]) _listeners[topic] = []

    // if a function is registered for a topic more than once, likely a bug
    if(_alreadySubscribed(topic, handler)) {
      console.warn('double adding handler for topic:', topic, ' handler:', handler, 'perhaps this is a bug?')
    }

    _listeners[topic].push(handler)
  }

  let unsubscribe = function(topic, handler) {
    if (_listeners[topic]) {
      for(let i=0; i < _listeners[topic].length; i++) {
        if (_listeners[topic][i] === handler) {
          removeItems(_listeners[topic], i, 1)
          return
        }
      }
    }
  }

  let _alreadySubscribed = function(topic, handler) {
    if (!_listeners[topic]) return false

    for(let i=0; i < _listeners[topic].length; i++) {
      if (_listeners[topic][i] === handler)
      {
        return true
      }
    }

    return false
  }

  return Object.freeze({ publish, subscribe, unsubscribe })
}

},{"next-tick-2":3,"remove-array-items":4}],3:[function(require,module,exports){
'use strict'

var ensureCallable = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function")
	return fn
}

var byObserver = function (Observer) {
	var node = document.createTextNode(''), queue, currentQueue, i = 0
	new Observer(function () {
		var callback
		if (!queue) {
			if (!currentQueue) return
			queue = currentQueue
		} else if (currentQueue) {
			queue = currentQueue.concat(queue)
		}
		currentQueue = queue
		queue = undefined
		if (typeof currentQueue === 'function') {
			callback = currentQueue
			currentQueue = undefined
			callback()
			return
		}
		node.data = (i = ++i % 2) // Invoke other batch, to handle leftover callbacks in case of crash
		while (currentQueue) {
			callback = currentQueue.shift()
			if (!currentQueue.length) currentQueue = undefined
			callback()
		}
	}).observe(node, { characterData: true })
	return function (fn) {
		ensureCallable(fn)
		if (queue) {
			if (typeof queue === 'function') queue = [queue, fn]
			else queue.push(fn)
			return
		}
		queue = fn
		node.data = (i = ++i % 2)
	}
}

module.exports = (function () {
	// MutationObserver
	if ((typeof document === 'object') && document) {
		if (typeof MutationObserver === 'function') return byObserver(MutationObserver)
		if (typeof WebKitMutationObserver === 'function') return byObserver(WebKitMutationObserver)
	}

	// W3C Draft
	// http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
	if (typeof setImmediate === 'function') {
		return function (cb) { setImmediate(ensureCallable(cb)) }
	}

	// Wide available standard
	if ((typeof setTimeout === 'function') || (typeof setTimeout === 'object')) {
		return function (cb) { setTimeout(ensureCallable(cb), 0) }
	}
}())

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict'

const WebSocket = require('ws')
const backoff   = require('./lib/fibonacci-backoff')
const pubsub    = require('ev-pubsub')


module.exports = function upsocket(options={}) {
  const { publish, subscribe, unsubscribe } = pubsub()
  const _buffer = []
  const _preamble = options.preamble
  const _buffering = (options.buffer === false) ? false : true
  const fibonacciBackoff = backoff({ initialDelay: 100, maxDelay: 8000 })

  let socket, _sending
  let _timeout = undefined
  let _shouldReconnect = true

  // close the underlying socket, and disable automatic reconnection
  // buffered data will not be sent in some cases.
  let close = function() {
    _shouldReconnect = false
    _buffer.length = 0
    if (socket && socket.readyState === socket.OPEN) {
      socket.close()
    }
  }

  let connect = function(url) {
    socket = (url instanceof WebSocket) ? url : new WebSocket(url)

    socket.onopen = function() {
      if (_preamble && (!_buffer.length || _buffer[0] !== _preamble)) {
        _buffer.unshift(_preamble)
      }

      publish('open')
      fibonacciBackoff.reset()
      _drainBuffer()
    }

    socket.onclose = function(evt) {
      publish('close')
      if (!_shouldReconnect) {
        return
      }

      // try to reconnect in ever-increasing time intervals using fibonacci sequence
      const delayTime = fibonacciBackoff.next()
      setTimeout(function() { connect(socket.url) }, delayTime)
    }

    socket.onerror = function(err) {
      // ignore connection refused messages because this module handles
      // auto-reconnects, so it's not considered an error
      if (err.code && err.code !== 'ECONNREFUSED') {
        publish('error', err)
      }
    }

    socket.onmessage = function(message) {
      publish('message', message.data)
    }
  }

  let send = function(message) {
    _buffer.push(message)
    if (_timeout === undefined) {
      _timeout = setTimeout(_drainBuffer, 0)
    }
  }

  // send the complete contents of the buffer
  let _drainBuffer = function() {
    if (!socket || socket.readyState !== socket.OPEN) {
      _clearTimeout()

      if (_buffering === false) {
        // if we're not buffering messages while disconnected, discard contents
        _buffer.length = 0
      }

      return
    }

    if(!_buffer.length) {
      _clearTimeout()
      return
    }

    if (!_sending) {
      _sending = true
      socket.send(_buffer[0])

    } else if (socket.bufferedAmount === 0) {
      // current message finished sending, send the next one
      _buffer.shift()
      _sending = false
    }

    _timeout = setTimeout(_drainBuffer, 0)
  }

  let _clearTimeout = function() {
    if (_timeout !== undefined) {
      clearTimeout(_timeout)
      _timeout = undefined
    }
  }

  return Object.freeze({ close, connect, send, publish, subscribe, unsubscribe })
}

},{"./lib/fibonacci-backoff":6,"ev-pubsub":2,"ws":7}],6:[function(require,module,exports){
'use strict'

module.exports = function fibonacciBackoff(options={}) {
  let backoffDelay, nextBackoffDelay
  const initialDelay = options.initialDelay || 100
  const maxDelay = options.maxDelay || 10000
  const randomisationFactor = options.randomisationFactor || 0

  let next = function() {
    const nextDelay = Math.min(nextBackoffDelay, maxDelay)

    nextBackoffDelay += backoffDelay

    backoffDelay = nextDelay

    const randomisationMultiple = 1 + Math.random() * randomisationFactor
    const randomizedDelay = Math.round(backoffDelay * randomisationMultiple)

    return randomizedDelay
  }

  let reset = function() {
    backoffDelay = 0
    nextBackoffDelay = initialDelay
  }

  reset()

  return Object.freeze({ next, reset })
}

},{}],7:[function(require,module,exports){
(function (global){
'use strict'

// replace the ws module with the Browser's WebSocket implementation
// when in the browser environment
module.exports = global.WebSocket

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
