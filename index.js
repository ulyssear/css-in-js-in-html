const regexes = {
  events: /(\[[\w\-,]+\])/,
  selectors: /((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\])/,
  "group-classes": /(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/,
  classes:
    /((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/,
  media: /\[@media\((.*)\)\]/,
};

const regexes_2 = {
  "media,events,selectors,group-classes":
    /(\[@media\((.*)\)\]):(\[[\w\-,]+\]):((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  "media,events,selectors,classes":
    /(\[@media\((.*)\)\]):(\[[\w\-,]+\]):((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,
  "media,events,group-classes":
    /(\[@media\((.*)\)\]):(\[[\w\-,]+\]):(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  "media,events,classes":
    /(\[@media\((.*)\)\]):((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,
  "media,selectors,group-classes":
    /(\[@media\((.*)\)\]):((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  "media,selectors,classes":
    /(\[@media\((.*)\)\]):((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,
  "media,group-classes":
    /(\[@media\((.*)\)\]):(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  "media,classes":
    /(\[@media\((.*)\)\]):((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,

  "events,selectors,group-classes":
    /(\[[\w\-,]+\]):((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  "events,selectors,classes":
    /(\[[\w\-,]+\]):((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,
  "events,group-classes":
    /(\[[\w\-,]+\]):(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  "events,classes":
    /(\[[\w\-,]+\]):((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,
  "selectors,group-classes":
    /((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  "selectors,classes":
    /((?<!-)\[[\w\d\s\-\[\]*@,.#^>~+'"=*:,\(\)]+\]):((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,
  "group-classes": /(\{[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\.\*\'\"%=\+]+\})/gi,
  classes:
    /((?:[\w\d\-]+-\[[\/\'\"\n\r\s\w\d\#\(\)\{\}\.\-,%=\+]+\])(?! *[a-zA-Z0-9]+\[))/gi,
};

const regexes_comments = {
  inline: /\/\/[^\n\r]*/g,
  block: /\/\*[\n\r\s\w\d\-\[\]\/\#\(\)\{\},\'\"%= ]+\*\//g,
};

function retrieve_regex(name) {
  if (regexes[name] === undefined) {
    throw new Error(`Regex ${name} not found`);
  }

  return regexes[name].source;
}

function retrieve_regexes(names) {
  return (
    regexes_2[names] ||
    new RegExp(names.split(",").map(retrieve_regex).join(":"), "gi")
  );
}

function retrieve_selector(element) {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const nth_child = element.parentNode
    ? `:nth-child(${
        Array.from(element.parentNode.children).indexOf(element) + 1
      })`
    : "";
  return `${tag}${id}${nth_child}`;
}

function retrieve_groups(_class) {
  const groups = [];

  const regexes_to_check = [
    "events,selectors,group-classes",
    "events,selectors,classes",
    "events,group-classes",
    "events,classes",
    "selectors,group-classes",
    "selectors,classes",
    "group-classes",
    "classes",
  ];

  _class = _class.replace(/[\n\t]/g, " ");

  for (let i = 0; i < regexes_to_check.length; i++) {
    const regexes = retrieve_regexes(regexes_to_check[i]);

    if (!regexes.test(_class)) continue;

    const number_parts = _class.match(regexes);

    if (!number_parts) continue;

    for (let j = 0; j < number_parts.length; j++) {
      const current_number_parts = number_parts[j].trim();

      const current_groups = current_number_parts
        .split(regexes)
        .filter(Boolean);

      try {
        if (
          "[" === current_groups[0][0] &&
          "]" === current_groups[1][current_groups[1].length - 1] &&
          "[" !== current_groups[1][0]
        ) {
          current_groups[0] += current_groups[1];
          current_groups.splice(1, 1);
        }
      } catch (e) {}

      const entry = {};

      const keys = regexes_to_check[i].split(",");
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        entry[key] = current_groups[k];
      }

      if (entry.media) {
      }

      let not_valid = true;

      if (entry.events) {
        const events = (function (events) {
          if (events[0] === "[" && events[events.length - 1] === "]") {
            events = events.slice(1, -1);
          }
          return events.split(",");
        })(entry.events);
        for (let k = 0; k < events.length; k++) {
          const event = events[k];
          if (check_if_match_event(event)) {
            not_valid = false;
            break;
          }
        }
      }

      if (entry.selectors || (entry.events && not_valid)) {
        if (entry.events && not_valid) {
          entry.selectors = entry.events;
          delete entry.events;
        }
        entry.selectors = (function (selectors) {
          if (selectors[0] === "[" && selectors[selectors.length - 1] === "]") {
            selectors = selectors.slice(1, -1);
          }
          const regex_split = /,(?![^\[\()]*[\]\)])/g;
          return selectors.split(regex_split);
        })(entry.selectors);
      }

      if (entry["group-classes"]) {
        entry.styles = retrieve_styles(entry["group-classes"]);
        delete entry["group-classes"];
      }

      if (entry.classes) {
        entry.styles = { ...entry.styles, ...retrieve_styles(entry.classes) };
        delete entry.classes;
      }

      if (
        Object.keys(entry)
          .filter((key) => key !== "source")
          .every((key) => !entry[key])
      ) {
        continue;
      }

      _class = _class.replace(current_number_parts, "");
      entry.source = current_number_parts;

      groups.push(entry);
    }
  }

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    for (let j = i + 1; j < groups.length; j++) {
      const group2 = groups[j];
      if (
        group.selectors === group2.selectors &&
        group.events === group2.events
      ) {
        group.styles = { ...group.styles, ...group2.styles };
        group.source += " " + group2.source;
        groups.splice(j, 1);
        j--;
      }
    }
  }

  return groups;
}

function retrieve_styles(classes) {
  const styles = {};

  if (Array.isArray(classes)) classes = classes.join(" ");

  classes = classes.replace(/\{|\}/g, "").trim();

  classes = classes.split(/(?<!\[[^\]]*)\s(?![^\[]*\])/g);

  for (let i = 0; i < classes.length; i++) {
    try {
      const [property, value] = classes[i].split("-[");
      styles[property] = value.replace("]", "");
    } catch (e) {
      console.error("class", classes[i], "is not a valid class");
    }
  }

  return styles;
}

const events = [
  ...new Set(
    [
      ...Object.getOwnPropertyNames(document),
      ...Object.getOwnPropertyNames(
        Object.getPrototypeOf(Object.getPrototypeOf(document))
      ),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(window)),
    ].filter(
      (k) =>
        k.startsWith("on") &&
        (document[k] == null || typeof document[k] == "function")
    )
  ),
].map((k) => k.substring(2));

function check_if_match_event(name) {
  return name.split(",").some((event) => events.includes(event));
}

function apply() {
  const elements = Array.from(
    document.querySelectorAll(":not(template)[class]")
  );

  if (document.documentElement.getAttribute("class")) {
    elements.push(document.documentElement);
  }

  let cursor_class;

  for (let i = 0; i < elements.length; i++) {
    cursor_class = elements[i].getAttribute("class");

    if (!cursor_class) {
      elements[i].removeAttribute("class");
      continue;
    }

    cursor_class = cursor_class.replace(/[\n\t]/g, " ").trim();
    cursor_class = cursor_class.replace(/\s+/g, " ");

    for (let regex_comment in regexes_comments) {
      cursor_class = cursor_class.replace(regexes_comments[regex_comment], "");
    }

    const groups = retrieve_groups(cursor_class);

    for (let j = 0; j < groups.length; j++) {
      const { media, styles, selectors, events, source } = {
        media: "",
        styles: {},
        selectors: [],
        events: [],
        source: "",
        ...groups[j],
      };

      cursor_class = cursor_class.replace(source, "").trim();

      if (media.length) {
      }

      if (events.length) {
        for (let s = 0; s < selectors.length; s++) {
          append_event({
            element: elements[i],
            selector: selectors[s],
            event: events,
            styles,
            media,
          });
        }
      }

      if (selectors.length) {
        if (Object.keys(styles).length) {
          for (let k = 0; k < selectors.length; k++) {
            const elements_from_selector = get_elements_from_selector(
              elements[i],
              selectors[k]
            );
            for (let l = 0; l < elements_from_selector.length; l++) {
              for (let property in styles) {
                elements_from_selector[l].style.setProperty(
                  property,
                  styles[property]
                );
              }
            }
          }
        }

        continue;
      } else if (Object.keys(styles).length) {
        for (let property in styles) {
          elements[i].style.setProperty(property, styles[property]);
        }
        continue;
      }
    }

    if (cursor_class) elements[i].className = cursor_class;
    else elements[i].removeAttribute("class");
  }
}

function get_elements_from_selector(element, selector) {
  const elements = [];
  if (">" === selector[0]) {
    selector = get_element_selector(element) + selector;
    elements.push(...element.parentNode.querySelectorAll(selector));
  } else {
    if ("current" === selector) {
      elements.push(element);
    } else {
      elements.push(...element.querySelectorAll(selector));
    }
  }
  return elements;
}

function append_event({ element, selector, media, event, styles }) {
  if (event[0] === "[") {
    event = event.replace("[", "").replace("]", "").split(",");
  }
  if (!element.style_events) {
    element.style_events = {};
  }
  if (!element.style_events[selector]) element.style_events[selector] = {};

  for (let i = 0; i < event.length; i++) {
    const elements_from_selector = get_elements_from_selector(
      element,
      selector
    );
    for (let j = 0; j < elements_from_selector.length; j++) {
      if (!elements_from_selector[j].style_events) {
        elements_from_selector[j].style_events = {};
      }
      if (!elements_from_selector[j].style_events[event[i]])
        elements_from_selector[j].style_events[event[i]] = {};
      if (!elements_from_selector[j].style_events[event[i]][media])
        elements_from_selector[j].style_events[event[i]][media] = {};
      for (let property in styles) {
        elements_from_selector[j].style_events[event[i]][media][property] =
          styles[property];
      }
      elements_from_selector[j].addEventListener(event[i], (event) =>
        _listener(event)
      );
    }
  }

  function _listener(event) {
    const { target } = event;
    if (!target.style_events) return;
    const { style_events } = target;
    const styles = style_events[event.type];
    for (let media in styles) {
      if (media === "null" || media === "") {
        _apply_styles(target, styles[media]);
      } else {
        const media_query = window.matchMedia(media);
        if (media_query.matches) {
          _apply_styles(target, styles[media]);
        }
      }
    }
  }

  function _apply_styles(element, styles) {
    for (let property in styles) {
      element.style.setProperty(property, styles[property]);
    }
  }
}

function get_element_selector(element) {
  const { id, tagName } = element;
  if (["HTML", "BODY"].includes(tagName)) return tagName;
  if (id) return `#${id}`;
  else {
    const parent = element.parentElement;
    const children = parent.children;
    const index = Array.prototype.indexOf.call(children, element);
    return `${get_element_selector(parent)} > ${tagName}:nth-child(${
      index + 1
    })`;
  }
}

function run() {
  apply();

  const body = document.documentElement;
  const observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      switch (mutation.type) {
        case "attributes":
          if ("class" === mutation.attributeName) {
            apply();
          }
          break;
        case "childList":
          if (mutation.addedNodes.length) {
            apply();
          }
          break;
        default:
          break;
      }
    }
  });
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  const fonts = document.fonts;
  if (fonts) {
    const fonts_loaded = fonts.ready;
    if (fonts_loaded) {
      fonts_loaded.then(disable_busy);
    }
  } else {
    disable_busy();
  }

  function disable_busy() {
    document.documentElement.setAttribute("aria-busy", "false");
  }
}

document.addEventListener("DOMContentLoaded", () => run());
