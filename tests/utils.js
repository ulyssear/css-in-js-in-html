const path = require('path')

// async function getComputedStyle(element, pseudoElement = null) {
//     return page.evaluate((element, pseudoElement) => {
//         const style = window.getComputedStyle(element, pseudoElement);
//         return JSON.parse(JSON.stringify(style));
//     }, element, pseudoElement);
// }

const COLORS = {
    red: 'rgb(255, 0, 0)',
    green: 'rgb(0, 128, 0)',
    blue: 'rgb(0, 0, 255)',
    white: 'rgb(255, 255, 255)',
    black: 'rgb(0, 0, 0)'
};

async function onBeforeAll () {
    const url = 'file://' + path.join(__dirname, 'index.html');
    
    await page.goto(url);
    await page.addScriptTag({ path: path.join(__dirname, '..', 'build', 'index.min.js') });

    await page.addScriptTag({
        content: `CSS_IN_JS_IN_HTML.init(document, null);`
    });
}

async function assert(element, classes, styles = {}) {
    if ('string' !== typeof element) {
        return assert_element(element, classes, styles);
    }

    const selector = element;

    const computedStyle = await page.evaluate( async (selector, classes) => {
        const element = document.querySelector(selector);
        element.className = classes;
        await Promise.resolve(setTimeout(() => {}, 1000));
        const computedStyle = await getComputedStyle(element);
        return JSON.parse(JSON.stringify(computedStyle));
    }, selector, classes);

    for (const style in styles) {
        expect(computedStyle[style]).toBe(styles[style]);
    }
}

async function assert_element(element, styles, classes = null) {
    const computedStyle = await page.evaluate( async (element, classes) => {
        if (classes) {
            element.className = classes;
            await Promise.resolve(setTimeout(() => {}, 1000));
        }
        const computedStyle = await getComputedStyle(element);
        return JSON.parse(JSON.stringify(computedStyle));
    }, element, classes);

    for (const style in styles) {
        expect(computedStyle[style]).toBe(styles[style]);
    }
}


module.exports = {
    COLORS,
    // getComputedStyle,
    onBeforeAll,
    assert
};