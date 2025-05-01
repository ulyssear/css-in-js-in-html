const EVENTS = Object.keys(window).filter(e=>e.substring(0,2)=='on').map(e=>e.substring(2).toLowerCase());

const REGEXES_COMMENTS = [
    /\/\*[\s\S]*?\*\//g,
    /\/\/.*/g
];
const REGEXES = [
    /([a-zA-Z0-9\-,]+)-\[([a-zA-Z0-9 .%#,\-()'"\/:?!]+)\]/g,
    /((?:\[[a-zA-Z0-9\-@():>,+ ]+\]:)*)\{\s*?((?:[a-zA-Z\-]+-\[[a-zA-Z0-9,%. \-()/ :?!'"#]+\]\s*?)+)\}/g
];

function getIndexChildren(element,index=0) {
    if ('HTML' !== element.tagName) {
        return getIndexChildren(element.parentElement,index+1);
    }
    return index;
}

function joinArrays(...arrays) {
    const newArray = [];
    const highestLength = Math.max(...arrays.map(arr => arr.length));
    for (let i = 0; i < highestLength; i++) {
        const newElement = [];
        for (const arr of arrays) {
            newElement.push(arr[i] || null);
        }
        newArray.push(newElement);
    }
    return newArray;
}

function isEvents(string) {
    const events = string.split(',').map(e => e.trim().toLowerCase());
    return events.every(e => EVENTS.includes(e));
}

function getCurrentDOMPath(element) {
    let dompath = '';
    let currentElement = element;
    while (currentElement && currentElement.tagName !== 'HTML') {
        const tagName = currentElement.tagName.toLowerCase();
        const siblingsWithSameTag = Array.from(currentElement.parentNode.children).filter(child => child.tagName === currentElement.tagName);
        const index = siblingsWithSameTag.indexOf(currentElement) + 1;
        dompath = `>${tagName}${index > 1 ? `:nth-of-type(${index})` : ''}` + dompath;
        currentElement = currentElement.parentNode;
        if (currentElement.hasAttribute('data-cijih-current-tag')) {
            dompath = `${currentElement.getAttribute('data-cijih-current-tag')}` + dompath;
            return dompath;
        }
    }
    if (currentElement.tagName === 'HTML') {
        return `html`;
    }
    return xpath.substring(1);
}

function getQueries(string) {
    const queries = [];
    let currentQuery = '';
    let indexBracket = 0;
    for (let i = 0; i < string.length; i++) {
        const char = string[i];
        if (char === '[') {
            indexBracket++;
            currentQuery += char;
        } else if (char === ']') {
            indexBracket--;
            currentQuery += char;
        } else if (char === ',' && indexBracket === 0) {
            queries.push(currentQuery.trim());
            currentQuery = '';
        } else {
            currentQuery += char;
        }
    }
    if (currentQuery) {
        queries.push(currentQuery.trim());
    }
    return queries;
}

function getGroupsBrackets(string,result={
    media: '',
    events: '',
    query: ''
}) {
    const groups = []
    let j = 0;
    for (let i = 0; i < string.length; i++) {
        const char = string[i];
        if (char === '[') {
            j = i + 1;
            while (j < string.length && string[j] !== ']') {
                j++;
            }
            groups.push(string.slice(i, j + 1));
            i = j;
        }
    }
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i].substring(1, groups[i].length - 1);
        if (group.startsWith('@media(')) {
            result.media = group
        } else if (isEvents(group)) {
            result.events = group
        } else {
            result.query = group
        }
    }
    return result;
}

function getStylesFromClasses(classes) {
    const styles = {};
    const matches = classes.matchAll(REGEXES[0]);
    for (const match of matches) {
        const [_, property, value] = match;
        styles[property] = value;
    }
    return styles;
}

window.addEventListener('DOMContentLoaded', function () {
    let elements = document.querySelectorAll('[class]');
    const indexes = Array.from(elements).map(e => getIndexChildren(e));
    elements = Array.from(elements).map((e, i) => [e, indexes[i]]);
    elements = elements.sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i][0];
        
        for (const regex of REGEXES_COMMENTS) {
            element.className = element.className.replace(regex, '');
        }

        const matchesSecondCase = element.className.matchAll(REGEXES[1]);
        
        for (const match of matchesSecondCase) {
            const [_, groupsBrackets, classes] = match;
            const groups = getGroupsBrackets(groupsBrackets);
            const queries = getQueries(groups.query);
            for (let i = 0; i < queries.length; i++) {
                if (queries[i].startsWith('>')) {
                    const currentDOMPath = getCurrentDOMPath(element);
                    element.dataset.cijihCurrentTag = currentDOMPath;
                    queries[i] = currentDOMPath+queries[i];
                }
                if ('current'===queries[i]) {
                    const currentDOMPath = getCurrentDOMPath(element);
                    element.dataset.cijihCurrentTag = currentDOMPath;
                    queries[i] = currentDOMPath;
                }
            }
            if (groups.events) {
                const events = groups.events.split(',').map(e => e.trim().toLowerCase());
                for (const event of events) {
                    element.addEventListener(event, function () {
                        if (queries.length > 0) {
                            for (const query of queries) {
                                const elements = element.querySelectorAll(query);
                                const styles = getStylesFromClasses(classes);
                                for (const [property, value] of Object.entries(styles)) {
                                    elements.forEach(el => el.style.setProperty(property, value));
                                }
                            }
                        }
                        else {
                            const styles = getStylesFromClasses(classes);
                            for (const [property, value] of Object.entries(styles)) {
                                element.style.setProperty(property, value);
                            }
                        }
                    });
                }
            }
            for (const query of queries) {
                const elements = document.querySelectorAll(query);
                const styles = getStylesFromClasses(classes);
                for (const [property, value] of Object.entries(styles)) {
                    elements.forEach(el => el.style.setProperty(property, value));
                }
            }
            const length = match[0].length;
            const spaces = ' '.repeat(length);
            element.className = element.className.replace(match[0], spaces);
        }
        
        const matchesFirstCase = element.className.matchAll(REGEXES[0]);
        const styles = getStylesFromClasses(element.className);
        for (const [property, value] of Object.entries(styles)) {
            element.style.setProperty(property, value);
        }
        for (const match of matchesFirstCase) {
            const length = match[0].length;
            const spaces = ' '.repeat(length);
            element.className = element.className.replace(match[0], spaces);
        }
        element.className = element.className.trim();
    }
    this.document.documentElement.removeAttribute('hidden');
    const elementsWithClasses = document.querySelector('[class]');
    for (const element of elementsWithClasses) {
        // remove all classes if the element has no classes
        if (element.className === '') {
            element.removeAttribute('class');
        }
    }
    const elementsWithData = document.querySelectorAll('[data-cijih-current-tag]');
    for (const element of elementsWithData) {
            element.removeAttribute('data-cijih-current-tag');
    }
});