document.addEventListener("readystatechange", () => {
  if (document.readyState === "loading") {
    return;
  }
  if (document.readyState === "interactive") {
    const elements = Array.from(
      document.querySelectorAll("*:not(head,head *)[class]")
    );
    const { parentElement: html } = document.body;
    if (0 < html.className.length) elements.push(html);
    requestAnimationFrame(() => {
      html.setAttribute("aria-busy", "true");
      applyEntries(elements);
      html.setAttribute("aria-busy", "false");
    });
    return;
  }
  if (document.readyState === "complete") {
    let timeout, timeoutObserver;
    const { parentElement: html } = document.body;

    const observer = new MutationObserver(function (mutations) {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
      if (timeoutObserver) clearTimeout(timeoutObserver);

      if (html.getAttribute("aria-busy") === "true") {
        timeoutObserver = setTimeout(function () {
          observer.observe(html, { attributes: true });
        }, 100);
        return;
      }

      timeout = setTimeout(() => {
        let elements_to_apply = [];
        for (let m = 0; m < mutations.length; m++) {
          const mutation = mutations[m];
          const { type } = mutation;
          let elements = [];
          try {
            if (
              type === "attributes" &&
              (mutation.attributeName === "class" ||
                /^(aria-)/.test(mutation.attributeName))
            ) {
              elements.push(mutation.target);
            } else if (type === "childList" && mutation.addedNodes.length > 0) {
              for (let i = 0; i < mutation.addedNodes.length; i++) {
                const node = mutation.addedNodes[i];
                if (node.nodeType === 1 && elements.indexOf(node) === -1) {
                  elements.push(node);
                }
              }
            }
          } catch (e) {
            console.error(e);
          } finally {
            for (let i = 0; i < elements.length; i++) {
              const parents = all_parents(elements[i]);
              for (let j = 0; j < parents.length; j++) {
                const parent = parents[j];
                if (!elements.includes(parent)) elements.push(parent);
              }
            }
          }

          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (!elements_to_apply.includes(element))
              elements_to_apply.push(element);
          }
        }
        if (0 < elements_to_apply.length) {
          requestAnimationFrame(() => {
            html.setAttribute("aria-busy", "true");
            applyEntries(elements_to_apply, true);
            html.setAttribute("aria-busy", "false");
          });
        }
      }, 0);

      timeoutObserver = setTimeout(() => {
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      }, 0);
    });

    timeoutObserver = setTimeout(() => {
      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }, 0);
    return;
  }
  /**
   * Récupère tous les parents d'un élément, soit de body au parent de l'élément.
   * @param {HTMLElement} element L'élément dont on veut les parents.
   * @returns {HTMLElement[]} Les parents de l'élément.
   */
  function all_parents(element) {
    let parents = [];
    while (element.parentElement) {
      parents.push(element.parentElement);
      element = element.parentElement;
    }
    return parents;
  }
  /**
   * Applique les classes à l'ensemble des éléments.
   * @param {HTMLElement[]} elements Les éléments dont on veut appliquer les classes.
   * @param {boolean} [checks_mode=false] Mode vérification
   */
  function applyEntries(elements, checks_mode = false) {
    for (
      let index_element = 0;
      index_element < elements.length;
      index_element++
    ) {
      const element = elements[index_element];
  
      let { className } = element;
      let isSvg = false;
  
      if (className instanceof SVGAnimatedString) {
        className = className.baseVal;
        isSvg = true;
      }
  
      if ("string" !== typeof className) continue;
  
      className = className.trim();
  
      if (!((element.__styles__ ?? []) || className.length === 0)) continue;
  
      let groups = [[]],
        groups_originals = [[]];
      let [current_char, current_group, current_class] = ["", 0, 0];
      let [current_index, limit] = [-1, className.length + 1];
      let [braces_opened, parenthesis_opened, brackets_opened] = [0, 0, 0];
      let original_class = "";
  
      while (--limit) {
        current_char = className[++current_index] ?? "";
  
        if (current_char === "{") braces_opened++;
        if (current_char === "(") parenthesis_opened++;
        if (current_char === "[") brackets_opened++;
  
        if (current_char === "}") braces_opened--;
        if (current_char === ")") parenthesis_opened--;
        if (current_char === "]") brackets_opened--;
  
        if (
          ":" === current_char &&
          0 === brackets_opened + parenthesis_opened + braces_opened
        ) {
          original_class += ":";
          current_group++;
          continue;
        }
  
        if (
          [" ", "\n"].includes(current_char) &&
          0 === brackets_opened + parenthesis_opened + braces_opened
        ) {
          if (0 < original_class.trim().length)
            groups_originals[current_class] = original_class.trim();
          original_class = "";
          current_class++;
          groups[current_class] = [];
          current_group = 0;
          continue;
        }
  
        original_class += current_char;
        groups[current_class][current_group] =
          (groups[current_class][current_group] ?? "") + current_char;
      }
  
      groups_originals[++current_class] = original_class;
      groups_originals = groups_originals.filter((group) => group.length > 0);
  
      for (
        let index_group = 0;
        index_group < groups_originals.length;
        index_group++
      ) {
        const group = groups_originals[index_group];
        if (group.includes("[") && group.includes("]")) {
          if (isSvg) {
            element.style.setProperty(
              kebabToCamel(group.replace(/[\[\]]/g, "")),
              "1"
            );
            element.className.baseVal = element.className.baseVal.replace(
              group,
              ""
            );
            continue;
          }
          element.className = element.className.replace(group, "").trim();
        }
      }
  
      if (
        1 > element.className.length ||
        (isSvg && 1 > element.className.baseVal.length)
      ) {
        element.removeAttribute("class");
      }
  
      for (let index_group = 0; index_group < groups.length; index_group++) {
        const group = groups[index_group];
        let [event, selector, classes] = ["|default|", "|default|", []];
  
        if (!group) continue;
        if (group.length === 0) continue;
  
        if (3 === group.length) {
          [event, selector, classes] = group;
        }
  
        if (2 === group.length) {
          if ("[" === group[0][0]) [selector, classes] = group;
          else [event, classes] = group;
        }
  
        if (1 === group.length) {
          [classes] = group;
        }
  
        [current_char, current_class] = ["", 0];
        [current_index, limit] = [-1, classes.length + 1];
        [braces_opened, parenthesis_opened, brackets_opened] = [0, 0, 0];
  
        let group_classes = [];
  
        while (--limit) {
          current_char = classes[++current_index] ?? "";
  
          if (current_char === "{") braces_opened++;
          if (current_char === "(") parenthesis_opened++;
          if (current_char === "[") brackets_opened++;
  
          if (current_char === "}") braces_opened--;
          if (current_char === ")") parenthesis_opened--;
          if (current_char === "]") brackets_opened--;
  
          if ("{" === current_char && 0 === current_index) continue;
          if ("}" === current_char && classes.length - 1 === current_index)
            continue;
  
          if (
            1 === braces_opened &&
            0 === parenthesis_opened + brackets_opened &&
            " " === current_char
          ) {
            current_class++;
            continue;
          }
  
          group_classes[current_class] =
            (group_classes[current_class] ?? "") + current_char;
        }
  
        classes = group_classes.filter(Boolean);
  
        let [current_event, group_events] = [0, []];
        [current_char, current_index, limit] = ["", -1, event.length + 1];
        [braces_opened, parenthesis_opened, brackets_opened] = [0, 0, 0];
  
        while (--limit) {
          current_char = event[++current_index] ?? "";
          if (current_char === "{") braces_opened++;
          if (current_char === "(") parenthesis_opened++;
          if (current_char === "[") brackets_opened++;
  
          if (current_char === "}") braces_opened--;
          if (current_char === ")") parenthesis_opened--;
          if (current_char === "]") brackets_opened--;
  
          if ("{" === current_char && 0 === current_index) continue;
          if ("}" === current_char && event.length - 1 === current_index)
            continue;
  
          if (
            1 === braces_opened &&
            0 === parenthesis_opened + brackets_opened &&
            " " === current_char
          ) {
            current_event++;
            continue;
          }
  
          if (
            1 === braces_opened &&
            0 === parenthesis_opened + brackets_opened &&
            "," === current_char
          ) {
            current_event++;
            continue;
          }
  
          group_events[current_event] =
            (group_events[current_event] ?? "") + current_char;
        }
  
        events = group_events;
  
        try {
          applyEntry(element, selector, events, classes);
        } catch (error) {
          console.error(error);
        }
      }
  
      if (!element.__styles__ || !checks_mode) continue;
  
      for (
        let index_style = 0;
        index_style < element.__styles__.length;
        index_style++
      ) {
        const { selector, events, classes } = element.__styles__[index_style];
        if (!selector || !events || !classes) continue;
        try {
          applyEntry(element, selector, events, classes, true);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
  function applyEntry(element, selector, events, classes, checks_mode = false) {
    if (!checks_mode) {
      if (!element.__styles__) element.__styles__ = [];
  
      const index = element.__styles__.findIndex((entry) => {
        return (
          entry.selector === selector && entry.events.join("") === events.join("")
        );
      });
  
      if (0 > index) {
        element.__styles__.push({ selector, events, classes });
      } else {
        for (let index_class = 0; index_class < classes.length; index_class++) {
          const class_name = classes[index_class];
          if (!element.__styles__[index].classes.includes(class_name)) {
            element.__styles__[index].classes.push(class_name);
          }
        }
      }
    }
  
    let elements_queried = query_selector(element, selector);
  
    for (
      let _index_element = 0;
      _index_element < elements_queried.length;
      _index_element++
    ) {
      const current_element = elements_queried[_index_element];
      if (!current_element) continue;
  
      for (let index_event = 0; index_event < events.length; index_event++) {
        const current_event = events[index_event];
        if (!current_event) continue;
  
        if ("|default|" === current_event) {
          if (!current_element._style_default) {
            current_element._style_default = {};
          }
  
          for (let index_class = 0; index_class < classes.length; index_class++) {
            let current_class = classes[index_class];
            if (!current_class) continue;
            const index_content = current_class.indexOf("[");
            if (index_content === -1) continue;
  
            let property = current_class.substring(0, index_content - 1).trim();
            const value = current_class
              .substring(index_content + 1, current_class.length - 1)
              .trim();
  
            property = kebabToCamel(property);
  
            if (value !== current_element._style_default[property]) {
              current_element._style_default[property] = value;
            }
  
            if (
              current_element.style.hasOwnProperty(property) &&
              current_element.style[property] !== value
            ) {
              if ("transition" === property) {
                setTimeout(() => {
                  current_element.style[property] = value;
                }, 10);
                continue;
              }
              current_element.style[property] = value;
            }
          }
          continue;
        }
  
        if (
          !current_element[`_style_${current_event}`] &&
          "|default|" !== current_event
        ) {
          current_element[`_style_${current_event}`] = {};
        }
  
        let will_changes = [];
  
        for (let index_class = 0; index_class < classes.length; index_class++) {
          let current_class = classes[index_class];
          if (!current_class) continue;
          const index_content = current_class.indexOf("[");
          if (index_content === -1) continue;
  
          let property = current_class.substring(0, index_content - 1).trim();
          const value = current_class
            .substring(index_content + 1, current_class.length - 1)
            .trim();
  
          property = kebabToCamel(property);
  
          if ("|default|" === current_event) {
            if (value !== current_element._style_default[property]) {
              current_element._style_default[property] = value;
            }
            continue;
          }
  
          if (value !== current_element[`_style_${current_event}`][property]) {
            current_element[`_style_${current_event}`][property] = value;
            will_changes.push(property);
          }
        }
  
        if (will_changes.length) {
          will_changes = will_changes.join(", ");
          current_element._style_default.willChange = will_changes;
          current_element.style.willChange = will_changes;
        }
  
        function onEvent() {
          const styles = Object.entries(
            current_element[`_style_${current_event}`]
          );
          for (let index_style = 0; index_style < styles.length; index_style++) {
            current_style = styles[index_style];
            if (!current_style) continue;
            let [property, value] = current_style;
            if (current_element.style.hasOwnProperty(property)) {
              if ("default" === value) {
                value = current_element._style_default[property] ?? "";
              }
              if (value !== current_element.style[property]) {
                if ("transition" === property) {
                  setTimeout(() => {
                    current_element.style[property] = value;
                  }, 10);
                  continue;
                }
                current_element.style[property] = value;
              }
            }
          }
        }
  
        current_element.removeEventListener(current_event, () => onEvent());
        current_element.addEventListener(current_event, () => onEvent());
      }
    }
  }
  function get_element_selector(element) {
    let selector = "";
    let parents = all_parents(element);
    parents = [element, ...parents];
    for (let index = parents.length - 1; index >= 0; index--) {
      const parent = parents[index];
      let { tagName: parent_selector } = parent;
      if (parent.id) {
        parent_selector = `#${parent.id}`;
      } else {
        if (!parent.parentElement) continue;
        const children = Array.from(parent.parentElement.children).filter((e) => {
          return e.tagName === parent.tagName;
        });
        const index_parent = children.indexOf(parent);
        if (children.length > 1)
          parent_selector += `:nth-of-type(${index_parent + 1})`;
      }
      selector = `${selector}>${parent_selector}`;
    }
    selector = selector.substring(1);
    return selector;
  }
  function kebabToCamel(kebab) {
    return kebab.replace(/-([a-z])/g, function (g) {
      return g[1].toUpperCase();
    });
  }
  function query_selector(element, selector) {
    selector = selector.trim();
  
    if ("|default|" === selector) return [element];
  
    if ("[" === selector[0] && "]" === selector[selector.length - 1]) {
      selector = selector.substring(1, selector.length - 1).trim();
    }
  
    selector = selector.replace(/@element/g, get_element_selector(element));
  
    let elements_queried = [];
  
    if (">" === selector[0]) {
      selector = selector.substring(1).trim();
      elements_queried = Array.from(element.querySelectorAll(selector)).filter(
        (_element) => {
          return Array.from(element.children).includes(_element);
        }
      );
    } else if ("+" === selector[0]) {
      selector = selector.substring(1).trim();
      const { nextElementSibling } = element;
      if (nextElementSibling.matches(selector)) {
        elements_queried.push(element.nextElementSibling);
      }
    } else if ("~" === selector[0]) {
      selector = selector.substring(1).trim();
  
      let currentElement,
        limit = 100;
  
      while (--limit) {
        currentElement = (currentElement ?? element).nextElementSibling;
        if (!currentElement) break;
        if (currentElement.matches(selector)) {
          elements_queried.push(currentElement);
        }
      }
    } else if (selector.includes("@lookout")) {
      let [selector_lookout, selector_elements] = selector
        .split("@lookout")
        .map((e) => e.trim());
      let canLookout = false;
  
      if (selector_lookout[0] === "[") {
        let [
          ,
          selector_lookout_attribute,
          selector_lookout_operator,
          selector_lookout_value,
        ] = selector_lookout
          .substring(1, selector_lookout.length - 1)
          .match(/^(.*?)\s*(=|\^|\$|\*|\|)\s*(.*?)$/)
          .map((e) => e.trim());
  
        if (
          !selector_lookout_attribute ||
          !selector_lookout_operator ||
          !selector_lookout_value
        ) {
          console.error(`Invalid lookout selector: ${selector_lookout}`);
          return [];
        }
  
        if (
          "'" === selector_lookout_value[0] &&
          "'" === selector_lookout_value[selector_lookout_value.length - 1]
        ) {
          selector_lookout_value = selector_lookout_value.substring(
            1,
            selector_lookout_value.length - 1
          );
        }
  
        switch (selector_lookout_operator) {
          case "=":
            canLookout =
              element.getAttribute(selector_lookout_attribute) ===
              selector_lookout_value;
            break;
          case "^=":
            canLookout = element
              .getAttribute(selector_lookout_attribute)
              .startsWith(selector_lookout_value);
            break;
          case "$=":
            canLookout = element
              .getAttribute(selector_lookout_attribute)
              .endsWith(selector_lookout_value);
            break;
          case "*=":
            canLookout = element
              .getAttribute(selector_lookout_attribute)
              .includes(selector_lookout_value);
            break;
          case "!=":
            canLookout =
              element.getAttribute(selector_lookout_attribute) !==
              selector_lookout_value;
            break;
          default:
            console.error(`Invalid lookout selector: ${selector_lookout}`);
        }
      } else {
        let elements_lookout = query_selector(element, selector_lookout);
        if (elements_lookout.length > 0) {
          canLookout = true;
        }
      }
  
      if (canLookout) {
        elements_queried = query_selector(document.body, selector_elements);
      }
    } else if (selector.includes(":has")) {
      let [selector_before, selector_after] = selector.split(":has");
      selector_after = selector_after
        .substring(1, selector_after.length - 1)
        .trim();
      let elements_before = query_selector(element, selector_before);
      for (let e = 0; e < elements_before.length; e++) {
        let elements_after = query_selector(elements_before[e], selector_after);
        for (let ea = 0; ea < elements_after.length; ea++) {
          const { parentElement } = elements_after[ea];
          if (!elements_queried.includes(parentElement))
            elements_queried.push(parentElement);
        }
      }
    } else {
      elements_queried.push(...Array.from(element.querySelectorAll(selector)));
    }
  
    return elements_queried;
  }
});