function init() {
  const EVENTS = getAllEventsNames();

  function getAllEventsNames() {
    const events = Array.from(Object.keys(window).filter(key => /^on/.test(key)).map(e => e.slice(2)));
    events.push('hover');
    return events;
  }

  function generateUUID(prefix="") {
    return (prefix ? prefix + "-" : "") + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function main() {
    const elements = document.querySelectorAll('[class*="["]');
    const regularExpressionsComments = [
      /\/\*[\s\S]*?\*\//g,
      /\/\/.*/g
    ];
    for (const element of elements) {
      const matches = element.className.matchAll(regularExpressionsComments[0]);
      for (const match of matches) {
        element.className = element.className.replace(match[0], '').trim();
      }
      const matches2 = element.className.matchAll(regularExpressionsComments[1]);
      for (const match of matches2) {
        element.className = element.className.replace(match[0], '').trim();
      }
    }
    const regularExpressions = [
      /([a-zA-Z0-9\-,]+)-\[([a-zA-Z0-9 .%#,\-()'"\/]+)\]/g,
      /((?:\[[a-zA-Z0-9\-@():>,+ ]+\]:)*)\{\s*?((?:[a-zA-Z\-]+-\[[a-zA-Z0-9,%. \-()/ ]+\]\s*?)+)\}/g
    ];
    for (const element of elements) {
      const matches = element.className.matchAll(regularExpressions[1]);
      const generic = {
        events: undefined,
        media: undefined,
        query: undefined,
        classes: undefined
      }
      for (const match of matches) {
        element.className = element.className.replace(match[0], '').trim();

        const split = match[0].split(']:');
        const entry = { ...generic };
        for (let i = 0; i < split.length; i++) {
          if (i < split.length - 1) {
            split[i] = split[i].trim().slice(1);
          }
          if (split[i].split(',').every(e => EVENTS.includes(e))) { // is events
            entry.events = i
          }
          else if (split[i].startsWith('@media(')) { // is media
            entry.media = i;
          }
          else if (split[i].startsWith('{') && split[i].endsWith('}')) { // is classes
            entry.classes = i;
          }
          else { // else query
            entry.query = i;
          }
        }
        const _entry = Object.entries(entry).sort((a, b) => a[1] - b[1]).filter(e => e[1] !== undefined).map(e => e[0]);

        let uuid;

        const __entry = _entry.join(',')

        if (__entry.includes('query,')) {
          uuid = generateUUID('cijih');
          element.setAttribute('id', uuid);
        }

        if (_entry.join(',') === 'events,query,classes') {
          const events = split[entry.events].split(',');
          let query = split[entry.query].replaceAll(/current\s*,?/g, '#' + uuid + ',');
          const classes = Array.from(split[entry.classes].slice(1, -1).matchAll(regularExpressions[0])).map(e => e.slice(1));
          if (query.startsWith('>')) {
            query = '#' + uuid + query;
          }
          if (query.endsWith(',')) {
            query = query.slice(0, -1);
          }
          const elements = document.querySelectorAll(query);
          element.removeAttribute('id');
          for (const element of elements) {
            for (const event of events) {
              if (event === 'hover') {
                element._style = Object.assign({}, element.style);
                element.addEventListener('mouseover', function () {
                  for (const [property, value] of classes) {
                    element.style.setProperty(property, value);
                  }
                });
                element.addEventListener('mouseout', function () {
                  for (const [property, value] of classes) {
                    element.style.setProperty(property, element._style[property] ?? 'initial');
                  }
                });
              }
              else {
                element.addEventListener(event, function () {
                  for (const [property, value] of classes) {
                    element.style.setProperty(property, value);
                  }
                });
              }
            }
          }

          continue;
        }

        if (_entry.join(',') === 'query,classes') {
          const uuid = generateUUID('cijih');
          element.setAttribute('id',uuid)
          let query = split[entry.query].replaceAll(/current\s*,?/g, '#' + uuid + ',');
          const classes = Array.from(split[entry.classes].slice(1, -1).matchAll(regularExpressions[0])).map(e => e.slice(1));
          if (query.startsWith('>')) {
            query = '#' + uuid + query;
          }
          if (query.endsWith(',')) {
            query = query.slice(0, -1);
          }
          const elements = document.querySelectorAll(query);
          element.removeAttribute('id');
          for (const element of elements) {
            for (const [property, value] of classes) {
              element.style.setProperty(property, value);
            }
          }

          continue;
        }

        if (_entry.join(',') === 'classes') {
          const classes = Array.from(split[entry.classes].slice(1, -1).matchAll(regularExpressions[0])).map(e => e.slice(1));
          for (const [property, value] of classes) {
            element.style.setProperty(property, value);
          }

          continue;
        }
      }

      const matches2 = element.className.matchAll(regularExpressions[0]);
      for (const match of matches2) {
        const [_, property, value] = match;
        element.style.setProperty(property, value);
        element.className = element.className.replace(_, '').trim();
      }
    }

    document.documentElement.setAttribute('aria-busy', 'false');

    const event = new Event('css-in-js-in-html-ready');
    document.dispatchEvent(event);
  }

  main();
}
let observer;
window.addEventListener('css-in-js-in-html-ready', function () {
  if (!observer) {
    observer = new MutationObserver(function (mutationsList) {
      for (const mutation of mutationsList) {
        if (
          (mutation.type === 'childList' && mutation.addedNodes.length > 0) || 
          (mutation.type === 'attributes' && mutation.attributeName === 'class')
        ) {
          init();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    });
  }
});
document.addEventListener('DOMContentLoaded', init);