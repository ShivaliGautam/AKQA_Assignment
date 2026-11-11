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
| AUTO_002 | DEL to BOM search | Route can be selected using the real Booking.com airport autocomplete |
| AUTO_003 | Today's date | Today (IST) is shown in the selected date field |
| AUTO_004 | Tomorrow's date | Tomorrow (IST) is shown in the selected date field |
| AUTO_005 | Change travel date | The selected date is updated correctly and month navigation works |
| AUTO_006 | Change departure airport | DEL is replaced by a different airport while destination remains stable |
| AUTO_007 | Change destination airport | BOM is replaced by a different airport while origin remains stable |
| TC_005 | Same-airport validation | Selecting the same airport for departure and destination is rejected or flagged as invalid |
| TC_007 | Missing-destination validation | Submitting when destination is empty is blocked with an error |

The automation validates the selected route and booking date against the live page content after the search is submitted, instead of relying on stored JavaScript state or URL-only checks.

## Troubleshooting
Booking.com is a live third-party site; its DOM, consent dialogs and bot checks change.
If a locator fails, run `npm run codegen`, copy the new selector into the constructor of
`pages/FlightSearchPage.js`, or open the trace:
`npx playwright show-trace test-results/<test-folder>/trace.zip`
