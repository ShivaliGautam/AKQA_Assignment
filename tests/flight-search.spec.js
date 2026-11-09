const { test, expect } = require('@playwright/test');
const allure = require('allure-js-commons');
const { FlightSearchPage } = require('../pages/FlightSearchPage');
const {
  getToday, getTomorrow, getDateOffset, displayPattern, airports,
} = require('../test-data/flightData');

const { delhi, mumbai, bengaluru, hyderabad } = airports;

async function safeAllureId(id) {
  if (allure && typeof allure.id === 'function') {
    await allure.id(id);
  }
}
/* Test case :
AUTO_001    Open flight-search page    Verify the page loads successfully.
AUTO_002    DEL to BOM search    Verify the user can select the required route.
AUTO_003    Search using today's date    Verify today's date is selected correctly.
AUTO_004    Search using tomorrow's date    Verify tomorrow's date is selected correctly.
AUTO_005    Change travel date    Verify the updated date is reflected.
AUTO_006    Change departure airport    Verify the updated route is reflected.
AUTO_007    Change destination airport    Verify the updated destination is reflected.*/

test.describe('Booking.com flight search', () => {
  let flightSearch;

  test.beforeEach(async ({ page }) => {
    if (allure && typeof allure.epic === 'function') {
      await allure.epic('Booking.com');
    }
    if (allure && typeof allure.feature === 'function') {
      await allure.feature('Flight search');
    }
    flightSearch = new FlightSearchPage(page);
  });

  async function expectDateShown(iso) {
    await expect
      .poll(() => flightSearch.dateText(), { message: `date ${iso} should be shown` })
      .toMatch(displayPattern(iso));
  }

  test('AUTO_001 - Open flight-search page', async () => {
    await safeAllureId('AUTO_001');
    const response = await flightSearch.open();
    expect(response && response.ok(), `HTTP status: ${response && response.status()}`).toBeTruthy();
    await flightSearch.assertPageLoaded();
  });

  test('AUTO_002 - DEL to BOM search', async () => {
    await safeAllureId('AUTO_002');
    await flightSearch.openReady();
    await flightSearch.selectRoute(delhi, mumbai);
    expect(await flightSearch.fromText()).toContain(delhi);
    expect(await flightSearch.toText()).toContain(mumbai);
  });

  test("AUTO_003 - Search using today's date", async () => {
    await safeAllureId('AUTO_003');
    await flightSearch.openReady();
    await flightSearch.selectRoute(delhi, mumbai);
    const today = getToday();
    await flightSearch.selectDate(today);
    await expectDateShown(today);
  });

  test("AUTO_004 - Search using tomorrow's date", async () => {
    await safeAllureId('AUTO_004');
    await flightSearch.openReady();
    await flightSearch.selectRoute(delhi, mumbai);
    const tomorrow = getTomorrow();
    await flightSearch.selectDate(tomorrow);
    await expectDateShown(tomorrow);
  });

  test('AUTO_005 - Change travel date', async () => {
    await safeAllureId('AUTO_005');
    await flightSearch.openReady();
    await flightSearch.selectRoute(delhi, mumbai);

    const first = getTomorrow();
    const second = getDateOffset(10);
    await flightSearch.selectDate(first);
    await expectDateShown(first);

    await flightSearch.selectDate(second);
    await expectDateShown(second);
    expect(await flightSearch.dateText()).not.toMatch(displayPattern(first));
  });

  test('AUTO_006 - Change departure airport', async () => {
    await safeAllureId('AUTO_006');
    await flightSearch.openReady();
    await flightSearch.selectRoute(delhi, mumbai);
    await flightSearch.setFrom(bengaluru);
    expect(await flightSearch.fromText()).toContain(bengaluru);
    expect(await flightSearch.fromText()).not.toContain(delhi);
    expect(await flightSearch.toText()).toContain(mumbai);
  });

  test('AUTO_007 - Change destination airport', async () => {
    await safeAllureId('AUTO_007');
    await flightSearch.openReady();
    await flightSearch.selectRoute(delhi, mumbai);
    await flightSearch.setTo(hyderabad);
    expect(await flightSearch.toText()).toContain(hyderabad);
    expect(await flightSearch.toText()).not.toContain(mumbai);
    expect(await flightSearch.fromText()).toContain(delhi);
  });

  for (const [label, getIso] of [['today', getToday], ['tomorrow', getTomorrow]]) {
    test(`DEL to BOM search is submitted for ${label}`, async () => {
      const iso = getIso();
      await flightSearch.searchDelToBomForDate(iso);
      await flightSearch.assertSearchSubmitted(iso);
    });
  }
});
