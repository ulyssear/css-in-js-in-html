const utils = require('./utils');
const {COLORS, onBeforeAll, assert} = utils;

describe('Classes', () => {
    beforeAll(onBeforeAll);

    it('Simple class', async () => {
        await assert('#example', 'background-[red]', {backgroundColor: COLORS.red});
    });

    it('Multiple classes', async () => {
        await assert('#example', 'background-[red] color-[white]', {
            backgroundColor: COLORS.red,
            color: COLORS.white
        });
    });
});