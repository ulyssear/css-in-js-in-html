const utils = require('./utils');
const {COLORS, onBeforeAll, onBeforeEach, assert} = utils;

module.exports = describe('Selectors', () => {
    beforeAll(async () => {
        await onBeforeAll();
    });

    beforeEach(async () => {
        await onBeforeEach();
    });

    it('Simple selector with simple class', async () => {
        await assert('#example-second', '[ul]:background-[red]', {});
        const children = await page.$$('#example-second ul');
        for (const child of children) {
            await assert(child, null, {backgroundColor: COLORS.red});
        }
    });

    it('Simple selector with multiple classes', async () => {
        await assert('#example-second', '[ul]:background-[red] color-[white]', {});
        const children = await page.$$('#example-second ul');
        for (const child of children) {
            await assert(child, null, {
                backgroundColor: COLORS.red,
                color: COLORS.white
            });
        }
    });

    it('Selector ">" with simple class', async () => {
        await assert('#example-second', '[> ul]:display-[flex]', {});
        const children = await page.$$('#example-second > ul');
        for (const child of children) {
            await assert(child, null, {display: 'flex'});
        }
    });

    it('Selector ">" with multiple classes', async () => {
        await assert('#example-second', '[> ul]:{display-[flex] flex-direction-[row]}', {});
        const children = await page.$$('#example-second > ul');
        for (const child of children) {
            await assert(child, null, {
                display: 'flex',
                flexDirection: 'row'
            });
        }
    });

    it('Selector "+" with simple class', async () => {
        await assert('#example', '[+ div]:justify-content-[space-between]', {});
        const element = await page.$('#example + div');
        await assert(element, null, {justifyContent: 'space-between'});
    });

    it('Selector "+" with multiple classes', async () => {
        await assert('#example', '[+ div]:{justify-content-[space-between] align-items-[center]}', {});
        const element = await page.$('#example + div');
        await assert(element, null, {
            justifyContent: 'space-between',
            alignItems: 'center'
        });
    });

    it('Selector "~" with simple class', async () => {
        await assert('#example', '[~ div]:align-items-[center]', {});
        const children = await page.$$('#example ~ div');
        for (const child of children) {
            await assert(child, null, {alignItems: 'center'});
        }
    });

    it('Selector "~" with multiple classes', async () => {
        await assert('#example', '[~ div]:{align-items-[center] flex-direction-[row]}', {});
        const children = await page.$$('#example ~ div');
        for (const child of children) {
            await assert(child, null, {
                alignItems: 'center',
                flexDirection: 'row'
            });
        }
    });
    
    // TODO: Tests for @lookout selector

});