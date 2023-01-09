const path = require('path');

async function getComputedStyle(element, pseudoElement = null) {
    return page.evaluate((element, pseudoElement) => {
        const style = window.getComputedStyle(element, pseudoElement);
        return JSON.parse(JSON.stringify(style));
    }, element, pseudoElement);
}

async function getClasses(element) {
    return page.evaluate((element) => element.className, element);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const COLORS = {
    red: 'rgb(255, 0, 0)',
    green: 'rgb(0, 128, 0)',
    blue: 'rgb(0, 0, 255)',
};

const EXAMPLES = {
    first: '.example',
    second: '.example:nth-of-type(2)'
}

describe('CSS-in-JS-in-HTML process', () => {

    beforeAll(async () => {
        const url = 'file://' + path.join(__dirname, 'index.html');
        
        await page.goto(url);
        await page.addScriptTag({ path: path.join(__dirname, '..', 'build', 'index.min.js') });

        await page.addScriptTag({
            content: `CSS_IN_JS_IN_HTML.init(document, null);`
        });
    });

    describe('Classes only', () => {
        it('class "background-[red]" should be "background" as "red"', async () => {            
            const element = await page.evaluate( async () => {
                const element = document.querySelector('#example');
                element.className = 'background-[red]';
                await Promise.resolve(setTimeout(() => {}, 1000));
                return JSON.parse(JSON.stringify(getComputedStyle(element)));
            });
            expect(element.backgroundColor).toBe(COLORS.red);
        });

        it('class "background-[green] color-[blue]" should be "background" as "green" and "color" as "blue"', async () => {
            const element = await page.evaluate( async () => {
                const element = document.querySelector('#example');
                element.className = 'background-[green] color-[blue]';
                await Promise.resolve(setTimeout(() => {}, 1000));
                return JSON.parse(JSON.stringify(getComputedStyle(element)));
            });
            expect(element.backgroundColor).toBe(COLORS.green);
            expect(element.color).toBe(COLORS.blue);
        });
    });

    describe('Selectors + Classes', () => {
        it('class "[ul]:display-[flex]" should be "display" as "flex" for every "ul" element in child tree', async () => {
            const is_every_ul_flex = await page.evaluate( async () => {
                const element = document.querySelector('#example-second');
                element.className = '[ul]:display-[flex]';
                await Promise.resolve(setTimeout(() => {}, 1000));
                const every_ul = element.querySelectorAll('ul');
                const check_every_ul = Array.from(every_ul).every((ul) => {
                    return ul.style.display === 'flex';
                });
                return check_every_ul;
            });
            expect(is_every_ul_flex).toBe(true);
        });
    });
});