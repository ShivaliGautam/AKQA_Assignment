# AKQA Flight Search Automation

JavaScript + Playwright Test + Page Object Model + Allure for the Booking.com flight search page.

```
pages/FlightSearchPage.js     locators and actions (POM)
tests/flight-search.spec.js   AUTO_001 to AUTO_007 + submit-flow tests
test-data/flightData.js       airport codes, IST date helpers
```

## Setup (Windows PowerShell)
```powershell
npm install
npx playwright install chromium
```

## Run
```powershell
npm test
npm run test:headed
npx playwright test -g "AUTO_003"    # one scenario
npm run test:ui
npm run report                       # Playwright HTML report
npm run allure:generate; npm run allure:open
```

## Scenarios
| ID | Scenario | What is verified |
|----|----------|------------------|
| AUTO_001 | Open flight-search page | Page loads (HTTP ok) and the form is visible |
| AUTO_002 | DEL to BOM search | Route can be selected |
| AUTO_003 | Today's date | Today (IST) shown in the date field |
| AUTO_004 | Tomorrow's date | Tomorrow (IST) shown in the date field |
| AUTO_005 | Change travel date | New date replaces the old one |
| AUTO_006 | Change departure airport | DEL becomes BLR, destination unchanged |
| AUTO_007 | Change destination airport | BOM becomes HYD, origin unchanged |

Two extra tests from the starter submit the DEL to BOM search for today and tomorrow and
assert the results URL carries the route and date. Flight availability is never asserted.

## Troubleshooting
Booking.com is a live third-party site; its DOM, consent dialogs and bot checks change.
If a locator fails, run `npm run codegen`, copy the new selector into the constructor of
`pages/FlightSearchPage.js`, or open the trace:
`npx playwright show-trace test-results/<test-folder>/trace.zip`
