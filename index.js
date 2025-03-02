function init() {
  const EVENTS = getAllEventsNames();

  function getAllEventsNames() {
    const events = Array.from(Object.keys(window).filter(key => /^on/.test(key)).map(e => e.slice(2)));
    events.push('hover');
    return events;
  }

  function getFullPathToElement(element) {
    const path = [];
    while (element.tagName !== 'HTML') {
      let selector = element.tagName;
      if (element.id) {
        selector += '#' + element.id;
        path.unshift(selector);
        break;
      } else {
        let sib = element, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.tagName === element.tagName) nth++;
        }
        if (nth != 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      element = element.parentElement;
    }
    path.unshift('HTML');
    return path.join('>');
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
      /((?:\[[a-zA-Z0-9\-@():>, ]+\]:)*)\{\s*?((?:[a-zA-Z\-]+-\[[a-zA-Z0-9,%. \-()/ ]+\]\s*?)+)\}/g
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

        if (_entry.join(',') === 'events,query,classes') {
          const events = split[entry.events].split(',');
          const query = split[entry.query].replaceAll(/current\s*,?/g, getFullPathToElement(element) + ',');
          const classes = Array.from(split[entry.classes].slice(1, -1).matchAll(regularExpressions[0])).map(e => e.slice(1));
          const elements = document.querySelectorAll(query);
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
          let query = split[entry.query].replaceAll(/current\s*,?/g, getFullPathToElement(element) + ',');
          const classes = Array.from(split[entry.classes].slice(1, -1).matchAll(regularExpressions[0])).map(e => e.slice(1));
          if (query.startsWith('>')) {
            query = getFullPathToElement(element) + query;
          }
          if (query.endsWith(',')) {
            query = query.slice(0, -1);
          }
          const elements = document.querySelectorAll(query);
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
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('css-in-js-in-html-ready', function () {
  const observer = new MutationObserver(init);
  observer.observe(document, { attributes: true, childList: true, subtree: true });
} );