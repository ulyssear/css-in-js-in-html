document.addEventListener("readystatechange", () => {
  if (document.readyState === "loading") {
    return;
  }
  if (document.readyState === "interactive") {
    // on recupere les elements qui ont l'attribut class et qui ne correspondent pas aux éléments cachés par le navigateur,
    // soit la balise head et ses éléments fils.
    const elements = Array.from(
      document.querySelectorAll("*:not(head,head *)[class]")
    );
    // on recupere l'élément html
    const { parentElement: html } = document.body;
    // si l'élément html a des classes dans l'attribut class, on l'ajoute dans les éléments à mettre à jour.
    if (0 < html.className.length) elements.push(html);
    requestAnimationFrame(() => {
      // si l'élément html n'a pas de valeur aria-busy défini sur 'true', on défini la valeur de cet attribut sur 'true'.
      if ("true" !== html.getAttribute("aria-busy")) {
        html.setAttribute("aria-busy", "true");
      }
      // on commence l'application des classes sur les éléments.
      applyEntries(elements);
      // on défini la valeur de l'attribut aria-busy de l'élement html sur 'false'.
      html.setAttribute("aria-busy", "false");
    });
    return;
  }
  if (document.readyState === "complete") {
    // on initialise les timeouts
    let timeout, timeoutObserver, timeoutResize;
    // on recupere l'élément html
    const { parentElement: html } = document.body;
    // on lance l'observateur
    const observer = new MutationObserver(function (mutations) {
      // on deconnecte l'observateur précédent
      observer.disconnect();
      // on nettoie les précédents timeouts
      if (timeout) clearTimeout(timeout);
      if (timeoutObserver) clearTimeout(timeoutObserver);
      if (timeoutResize) clearTimeout(timeoutResize);

      // si l'élément html a sa value aria-busy sur 'true'...
      if (html.getAttribute("aria-busy") === "true") {
        // on lance avec un retard de 100 millisecondes l'observateur sur l'élément html
        timeoutObserver = setTimeout(function () {
          observer.observe(html, { attributes: true });
        }, 100);
        return;
      }

      // on lance l'application des styles à travers un timeout à 0 millisecondes,
      // dont il n'est pas possible d'avoir deux execution du timeout à un instant donné
      // (possible avec le nettoyage des timeouts faite précédement)
      timeout = setTimeout(() => {
        let elements_to_apply = [];
        for (let m = 0; m < mutations.length; m++) {
          const mutation = mutations[m];
          const { type } = mutation;
          let elements = [];
          try {
            // si la modification concerne l'attribut class de l'élément courant (ou une valeur aria-* ou data-*)...
            if (
              type === "attributes" &&
              (mutation.attributeName === "class" ||
                /^(aria-)/.test(mutation.attributeName) ||
                /^(data-)/.test(mutation.attributeName))
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
      observer.observe(html, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }, 0);

    window.addEventListener("resize", () => {
      if (timeoutResize) clearTimeout(timeoutResize);
      timeoutResize = setTimeout(() => {
        const elements = Array.from(
          document.querySelectorAll("*:not(head,head *)")
        );
        if (0 < html.className.length) elements.push(html);
        applyEntries(elements, true);
      }, 0);
    });
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
        let [mediaQuery, event, selector, classes] = ["|default|", "|default|", "|default|", []];

        if (!group) continue;
        if (group.length === 0) continue;

        if (4 === group.length) {
          [mediaQuery, event, selector, classes] = group;
          mediaQuery = group[0].substring(8, group[0].length - 2);
        }

        if (3 === group.length) {
          if (group[0].substring(1, 7) === "@media") {
            if ("[" === group[1][0]) {
              [mediaQuery, selector, classes] = group
            }
            else {
              [mediaQuery, event, classes] = group
            }
            mediaQuery = group[0].substring(8, group[0].length - 2);
          }
          else {
            [event, selector, classes] = group;
          }
        }

        if (2 === group.length) {
          if (group[0].substring(1, 7) === "@media") {
            [mediaQuery, classes] = group;
            mediaQuery = group[0].substring(8, group[0].length - 2);
          }
          else {
            if ("[" === group[0][0]) [selector, classes] = group;
            else [event, classes] = group;
          }
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
          applyEntry(element, mediaQuery, selector, events, classes);
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
        const { mediaQuery, selector, events, classes } = element.__styles__[index_style];
        if (!mediaQuery || !selector || !events || !classes) continue;
        try {
          applyEntry(element, mediaQuery, selector, events, classes, true);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
  function applyEntry(element, mediaQuery, selector, events, classes, checks_mode = false) {
    // Si le check mode est activé, la propriété __styles__ ne sera pas mis à jour,
    // seules une consultation et une application des styles seront effectuées.

    mediaQuery = mediaQuery.replace(/var\(\s*--[^\)]+\s*\)/g, (match) => {
      const variable = match.substring(4, match.length - 1);
      return getComputedStyle(document.documentElement).getPropertyValue(variable);
    });

    let mediaQueryCondition = '|default|' === mediaQuery ? true : window.matchMedia(mediaQuery).matches;

    if (!checks_mode) {
      if (!element.__styles__) element.__styles__ = [];

      // on cherche l'index du styles ayant le selecteur, les evenements, ainsi que le media query définis au préalable
      const index = element.__styles__.findIndex((entry) => {
        return (
          entry.selector === selector
          && entry.events.join("") === events.join("")
          && entry.mediaQuery === mediaQuery
        );
      });

      if (0 > index) {
        // Si l'index n'existe pas, on ajoute le style avec le selecteur et les evenements
        element.__styles__.push({ mediaQuery, selector, events, classes });
      } else {
        // Si l'index existe, on ajoute les classes à la liste des classes du style ayant le selecteur et les evenements définis au préalable
        for (let index_class = 0; index_class < classes.length; index_class++) {
          const class_name = classes[index_class];
          if (!element.__styles__[index].classes.includes(class_name)) {
            element.__styles__[index].classes.push(class_name);
          }
        }
      }
    }

    // on recupere les éléments respectant le selecteur
    let elements_queried = query_selector(element, selector);

    // Pour chaque elements...
    for (
      let _index_element = 0;
      _index_element < elements_queried.length;
      _index_element++
    ) {
      const current_element = elements_queried[_index_element];
      if (!current_element) continue;

      // Pour chaque evenements...
      for (let index_event = 0; index_event < events.length; index_event++) {
        const current_event = events[index_event];
        if (!current_event) continue;

        // Si c'est l'evenement par defaut (soit sans evenement)...
        if ("|default|" === current_event) {
          // si les styles par défaut n'ont pas encore été définis...
          if (!current_element._style_default) {
            // on l'initialise
            current_element._style_default = {};
          }

          // Pour chaque classes...
          for (
            let index_class = 0;
            index_class < classes.length;
            index_class++
          ) {
            let current_class = classes[index_class];
            if (!current_class) continue;

            // on recupere la position du contenu de la classe/propriété
            const index_content = current_class.indexOf("[");
            // si ce n'est pas une classe avec une valeur,
            // on passe à la classe suivante
            if (index_content === -1) continue;

            // on recupere la propriété et sa valeur
            let property = current_class.substring(0, index_content - 1).trim();
            const value = current_class
              .substring(index_content + 1, current_class.length - 1)
              .trim();

            let isVariable = true;

            // si la propriété n'est pas une variable css...
            if (!property.startsWith("--")) {
              isVariable = false;
              // on convertit la propriété de "kebab case", soit "une-propriete" en "camel case", soit "unePropriete".
              property = kebabToCamel(property);
            }

            // si la valeur ne correspond à celuid défini dans les styles, on le déclare
            if (value !== current_element._style_default[property]) {
              current_element._style_default[property] = value;
            }

            if (
              isVariable &&
              value !== current_element.style.getPropertyValue(property)
            ) {
              if (mediaQueryCondition) current_element.style.setProperty(property, value);
            }

            // si la propriété css existe et dont la valeur n'a pas encore été assigné à la propriété...
            if (
              !isVariable &&
              current_element.style.hasOwnProperty(property) &&
              current_element.style[property] !== value
            ) {
              // si la propriété est transition...
              if ("transition" === property) {
                // on applique la valeur à la propriété avec un peu de retard (10 millisecondes)
                setTimeout(() => {
                  if (mediaQueryCondition) current_element.style[property] = value;
                }, 10);
                continue;
              }
              // sinon on applique la valeur à la propriété
              if (mediaQueryCondition) current_element.style[property] = value;
            }
          }
          continue;
        }

        // Si c'est un evenement et que ce dernier n'a pas été ajouté dans les styles de l'élément...
        if (
          !current_element[`_style_${current_event}`] &&
          "|default|" !== current_event
        ) {
          // on l'initialise
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
          for (
            let index_style = 0;
            index_style < styles.length;
            index_style++
          ) {
            current_style = styles[index_style];
            if (!current_style) continue;
            let [property, value] = current_style;
            let isVariable = property.startsWith("--");
            if (
              isVariable &&
              value !== current_element.style.getPropertyValue(property)
            ) {
              if (mediaQueryCondition) current_element.style.setProperty(property, value);
            }
            if (current_element.style.hasOwnProperty(property)) {
              if ("default" === value) {
                value = current_element._style_default[property] ?? "";
              }
              if (value !== current_element.style[property]) {
                if ("transition" === property) {
                  if (mediaQueryCondition) setTimeout(() => {
                    current_element.style[property] = value;
                  }, 10);
                  continue;
                }
                if (mediaQueryCondition) current_element.style[property] = value;
              }
            }
          }
        }

        if (mediaQueryCondition) {
          current_element.removeEventListener(current_event, () => onEvent());
          current_element.addEventListener(current_event, () => onEvent());
        }
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
        const children = Array.from(parent.parentElement.children).filter(
          (e) => {
            return e.tagName === parent.tagName;
          }
        );
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
