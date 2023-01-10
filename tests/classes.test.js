const utils = require('./utils');
const {COLORS, onBeforeAll, onBeforeEach, assert} = utils;

module.exports = describe('Classes', () => {
    beforeAll(async () => {
        await onBeforeAll();
    });

    beforeEach(async () => {
        // await onBeforeEach();
    });
    
    it('Simple class', async () => {
        await assert('#example', 'background-[red]', {backgroundColor: COLORS.red});
    });

    it('Multiple classes', async () => {
        await assert('#example', '{background-[red] color-[white]}', {
            backgroundColor: COLORS.red,
            color: COLORS.white
        });
    });
});