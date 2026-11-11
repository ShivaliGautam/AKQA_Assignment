
const { test, expect } = require('@playwright/test');
const allure = require('allure-js-commons');

const { FlightSearchPage } = require('../pages/FlightSearchPage');

const {
  getToday,
  getTomorrow,
  getDateOffset,
  displayPattern,
  airports
} = require('../test-data/flightData');

const {
  delhi,
  mumbai,
  bengaluru,
  hyderabad
} = airports;

async function safeAllureId(id) {
  if (allure && typeof allure.id === 'function') {
    await allure.id(id);
  }
}

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

  async function expectDateShown(isoDate) {
    await expect.poll(
      () => flightSearch.dateText(),
      {
        message: `Expected selected date ${isoDate}`
      }
    ).toMatch(displayPattern(isoDate));
  }

  // AUTO_001
  test('AUTO_001 - Open flight-search page', async () => {
    await safeAllureId('AUTO_001');

    const response = await flightSearch.open();

    expect(
      response && response.ok(),
      `Expected successful page response. HTTP status: ${
        response ? response.status() : 'No response'
      }`
    ).toBeTruthy();

    await flightSearch.assertPageLoaded();
  });

  // AUTO_002
  test('AUTO_002 - DEL to BOM search for today', async () => {
    await safeAllureId('AUTO_002');

    const today = getToday();

    await flightSearch.searchDelToBomForDate(today);

    await flightSearch.assertSearchSubmitted(today);
  });

  // AUTO_003
  test('AUTO_003 - DEL to BOM search for tomorrow', async () => {
    await safeAllureId('AUTO_003');

    const tomorrow = getTomorrow();

    await flightSearch.searchDelToBomForDate(tomorrow);

    await flightSearch.assertSearchSubmitted(tomorrow);
  });

  // AUTO_004 - TC_011
 test('AUTO_004 - Change travel date', async () => {
  await safeAllureId('AUTO_004');

  await flightSearch.openReady();

  await flightSearch.selectRoute(delhi, mumbai);

  console.log(
    'One-way selected:',
    await flightSearch.oneWayRadio.isChecked()
  );

  console.log(
    'Initial date:',
    await flightSearch.dateText()
  );

  const firstDate = getTomorrow();
  const updatedDate = getDateOffset(10);

  await flightSearch.selectDate(firstDate);

  console.log(
    'After first date selection:',
    await flightSearch.dateText()
  );

  await flightSearch.selectDate(updatedDate);

  console.log(
    'After second date selection:',
    await flightSearch.dateText()
  );
});
  // AUTO_005 - TC_012 and TC_013
 
// AUTO_005 - TC_012 and TC_013
test('AUTO_005 - Change departure and destination airports', async () => {
  await safeAllureId('AUTO_005');

  const searchDate = getTomorrow();

  await flightSearch.openReady();

  // Select initial DEL to BOM route
  await flightSearch.selectRoute(delhi, mumbai);

  // Change departure airport from DEL to BLR
  await flightSearch.setFrom(bengaluru);

  // Verify actual visible airport names
  await expect.poll(
    () => flightSearch.fromText()
  ).toMatch(flightSearch.airportNames.BLR);

  await expect.poll(
    () => flightSearch.toText()
  ).toMatch(flightSearch.airportNames.BOM);

  // Change destination airport from BOM to HYD
  await flightSearch.setTo(hyderabad);

  // Verify updated departure and destination
  await expect.poll(
    () => flightSearch.fromText()
  ).toMatch(flightSearch.airportNames.BLR);

  await expect.poll(
    () => flightSearch.toText()
  ).toMatch(flightSearch.airportNames.HYD);

  // Select travel date and submit search
  await flightSearch.selectDate(searchDate);

  await flightSearch.submit();

  // Verify actual results URL
  await flightSearch.assertSearchSubmitted(
    searchDate,
    bengaluru,
    hyderabad
  );
  });

  // AUTO_006
  test('AUTO_006 - Verify search results match route and date', async () => {
    await safeAllureId('AUTO_006');
    const searchDate = getToday();
    await flightSearch.searchDelToBomForDate(searchDate);

    await flightSearch.assertSearchSubmitted(searchDate);
  });

  // AUTO_007 - TC_007
test('AUTO_007 - Empty destination defaults to Anywhere search', async ({ page }) => {
  const flightSearchPage = new FlightSearchPage(page);

  await flightSearchPage.openReady();
  await flightSearchPage.setFrom('DEL');
  await flightSearchPage.assertMissingDestinationValidation();
});

  // AUTO_008 - TC_005
test('AUTO_008 - Same departure and destination is rejected', async ({ page }) => {
  const flightSearchPage = new FlightSearchPage(page);

  await flightSearchPage.openReady();
  await flightSearchPage.setFrom('DEL');
  await flightSearchPage.setTo('DEL');
  await flightSearchPage.assertSameAirportValidation();
});
});
