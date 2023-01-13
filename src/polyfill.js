if (!window.getComputedStyle) {
  window.getComputedStyle = function(e, t) {
      return this.el = e, this.getPropertyValue = function(t) {
          var n = /(\-([a-z]){1})/g;
          return t == "float" && (t = "styleFloat"), n.test(t) && (t = t.replace(n, function() {
              return arguments[2].toUpperCase();
          })), e.currentStyle[t] ? e.currentStyle[t] : null;
      }, this;
  };
}

if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {
      'use strict';
  
      if (this === void 0 || this === null) {
        throw new TypeError();
      }
  
      var n, k,
        t = Object(this),
        len = t.length >>> 0;
      if (len === 0) {
        return -1;
      }
  
      n = len - 1;
      if (arguments.length > 1) {
        n = Number(arguments[1]);
        if (n != n) {
          n = 0;
        }
        else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
  
      for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    };
  }


if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(callback, initial) {
        var accumulator = initial;
        for (var i = 0; i < this.length; i++) {
            if (accumulator !== undefined) {
                accumulator = callback.call(undefined, accumulator, this[i],   i, this);
                continue;
            }
            accumulator = this[i];
        }
        return accumulator;
    }
}

(function(win, doc){
	if(win.addEventListener)return;

	function docHijack(p){var old = doc[p];doc[p] = function(v){return addListen(old(v))}}
	function addEvent(on, fn, self){
		return (self = this).attachEvent('on' + on, function(e){
			var e = e || win.event;
			e.preventDefault  = e.preventDefault  || function(){e.returnValue = false}
			e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true}
			fn.call(self, e);
		});
	}
	function addListen(obj, i){
		if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
		else obj.addEventListener = addEvent;
		return obj;
	}

	addListen([doc, win]);
	if('Element' in win){
        win.Element.prototype.addEventListener = addEvent;
        return;
    }
    
    doc.attachEvent('onreadystatechange', function(){addListen(doc.all)});
    docHijack('getElementsByTagName');
    docHijack('getElementById');
    docHijack('createElement');
    addListen(doc.all);	
})(window, document);

window.matchMedia || (window.matchMedia = function() {
  'use strict';

  var styleMedia = (window.styleMedia || window.media);

  if (!styleMedia) {
      var style       = document.createElement('style'),
          script      = document.getElementsByTagName('script')[0],
          info        = null;

      style.type  = 'text/css';
      style.id    = 'matchmediajs-test';

      if (!script) {
        document.head.appendChild(style);
      } else {
        script.parentNode.insertBefore(style, script);
      }

      info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
          matchMedium: function(media) {
              var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

              if (style.styleSheet) {
                  style.styleSheet.cssText = text;
              } else {
                  style.textContent = text;
              }

              return info.width === '1px';
          }
      };
  }

  return function(media) {
      return {
          matches: styleMedia.matchMedium(media || 'all'),
          media: media || 'all'
      };
  };
}());

if (!document.querySelectorAll) {
  document.querySelectorAll = function (selectors) {
    var style = document.createElement('style'), elements = [], element;
    document.documentElement.firstChild.appendChild(style);
    document._qsa = [];

    style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
    window.scrollBy(0, 0);
    style.parentNode.removeChild(style);

    while (document._qsa.length) {
      element = document._qsa.shift();
      element.style.removeAttribute('x-qsa');
      elements.push(element);
    }
    document._qsa = null;
    return elements;
  };
}

if (!document.querySelector) {
  document.querySelector = function (selectors) {
    var elements = document.querySelectorAll(selectors);
    return (elements.length) ? elements[0] : null;
  };
}

if (!String.prototype.trim) {
  (function() {
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function() {
      return this.replace(rtrim, '');
    };
  })();
}