const utils = require('./utils');
const {COLORS, onBeforeAll, assert} = utils;

describe('Selectors', () => {
    beforeAll(onBeforeAll);

    it('Simple selector with simple class', async () => {
        assert('#example', '[ul]:background-[red]', {});
        const children = await page.$$('#example ul');
        for (const child of children) {
            assert(child, null, {backgroundColor: COLORS.red});
        }
    });
});