
const { expect } = require('@playwright/test');

class FlightSearchPage {
  constructor(page) {
    this.page = page;

    // Airport fields
    this.fromField = page
      .getByRole('button', { name: /Leaving from/i })
      .first();

    this.toField = page
      .getByRole('button', { name: /Going to/i })
      .first();

    // Date field
    this.dateField = page
      .locator('button')
      .filter({ hasText: /Travel dates?/i })
      .first();

    // Search button
    this.searchButton = page
      .locator('button[data-ui-name="button_search_submit"]')
      .first();

    // One-way radio
    this.oneWayRadio = page.locator(
      '#search_type_option_ONEWAY'
    );

    // Use the actual associated label, not a nested label assumption
    this.oneWayLabel = page.locator(
      'label[for="search_type_option_ONEWAY"]'
    ).first();

    // One-way control container
    this.oneWayContainer = page.locator(
      '[data-ui-name="search_type_oneway"]'
    ).first();

    // Calendar navigation
    this.nextMonthButton = page
      .getByRole('button', { name: /Next month/i })
      .first();

    this.prevMonthButton = page
      .getByRole('button', { name: /Previous month/i })
      .first();

    // Airport display names
    this.airportNames = {
      DEL: /Delhi|New Delhi/i,
      BOM: /Mumbai/i,
      BLR: /Bengaluru|Bangalore|Kempegowda/i,
      HYD: /Hyderabad|Rajiv Gandhi/i
    };

    // Booking.com route identifiers
    this.airportRouteIds = {
      DEL: 'DEL.AIRPORT',
      BOM: 'BOM.CITY',
      BLR: 'BLR.AIRPORT',
      HYD: 'HYD.AIRPORT'
    };
  }

  // Open Booking.com flight search page
  async open() {
    const response = await this.page.goto(
      'https://www.booking.com/flights/index.en-gb.html',
      {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      }
    );

    await this.dismissPopups();

    return response;
  }

  // Dismiss cookies and sign-in popups
  async dismissPopups() {
    const selectors = [
      '#onetrust-accept-btn-handler',
      'button[aria-label="Dismiss sign-in info."]',
      '[aria-label="Dismiss sign in information."]'
    ];

    for (const selector of selectors) {
      const button = this.page.locator(selector).first();

      if (await button.isVisible().catch(() => false)) {
        await button.click();
      }
    }
  }

  // Verify flight search page is loaded
  async assertPageLoaded() {
    await expect(this.fromField).toBeVisible({
      timeout: 20000
    });

    await expect(this.toField).toBeVisible({
      timeout: 20000
    });

    await expect(this.dateField).toBeVisible({
      timeout: 20000
    });

    await expect(this.oneWayRadio).toBeAttached({
      timeout: 20000
    });
  }

  // Open page and select one-way journey
  async openReady() {
    await this.open();
    await this.assertPageLoaded();
    await this.selectOneWay();
  }

  // Select and verify one-way journey
  async selectOneWay() {
    await expect(this.oneWayRadio).toBeAttached({
      timeout: 15000
    });

    await expect(this.oneWayRadio).toBeEnabled({
      timeout: 15000
    });

    // Return immediately if already selected
    if (await this.oneWayRadio.isChecked()) {
      console.log('One-way is already selected.');
      return;
    }

    await expect(this.oneWayLabel).toBeVisible({
      timeout: 15000
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(
        `Selecting One-way journey. Attempt: ${attempt}`
      );

      // First interact with the visible label
      await this.oneWayLabel.click();

      try {
        await expect(this.oneWayRadio).toBeChecked({
          timeout: 5000
        });

        console.log('One-way selected through label.');
        return;
      } catch (error) {
        console.log(
          'Label click did not select One-way. Trying radio fallback.'
        );
      }

      // Fallback: check the radio directly
      if (!(await this.oneWayRadio.isChecked())) {
        await this.oneWayRadio.check({
          force: true,
          timeout: 10000
        });
      }

      try {
        await expect(this.oneWayRadio).toBeChecked({
          timeout: 5000
        });

        console.log('One-way selected successfully.');
        return;
      } catch (error) {
        console.log(
          `One-way state was not retained on attempt ${attempt}.`
        );
      }
    }

    // Final state verification
    const checked = await this.oneWayRadio.isChecked();

    if (!checked) {
      const radioDetails = await this.oneWayRadio.evaluate(
        element => ({
          checked: element.checked,
          disabled: element.disabled,
          outerHTML: element.outerHTML
        })
      );

      throw new Error(
        `Unable to select One-way journey. Radio details: ${JSON.stringify(radioDetails)}`
      );
    }

    console.log('One-way selected:', checked);
  }

  // Select airport using actual autocomplete suggestion
  async setAirport(field, code) {
    const expectedAirport = this.airportNames[code];

    if (!expectedAirport) {
      throw new Error(
        `Airport display name is not configured for ${code}`
      );
    }

    await field.click();

    const input = this.page.locator(
      'input[data-ui-name="input_text_autocomplete"]:visible'
    );

    await expect(input).toBeVisible({
      timeout: 15000
    });

    await input.press('Control+A');
    await input.press('Backspace');
    await input.fill(code);

    const suggestions = this.page.locator(
      '#flights-searchbox_suggestions'
    );

    await expect(suggestions).toBeVisible({
      timeout: 15000
    });

    const airportOption = suggestions.getByText(
      new RegExp(`\\b${code}\\b`, 'i')
    ).first();

    await expect(airportOption).toBeVisible({
      timeout: 15000
    });

    await airportOption.click();

    await expect(field).toContainText(expectedAirport, {
      timeout: 15000
    });
  }

  async setFrom(code) {
    await this.setAirport(this.fromField, code);
  }

  async setTo(code) {
    await this.setAirport(this.toField, code);
  }

  // Select and verify complete route
  async selectRoute(from, to) {
    await this.setFrom(from);
    await this.setTo(to);

    await expect(this.fromField).toContainText(
      this.airportNames[from]
    );

    await expect(this.toField).toContainText(
      this.airportNames[to]
    );
  }

  // Return actual visible departure field text
  async fromText() {
    return (await this.fromField.innerText()).trim();
  }

  // Return actual visible destination field text
  async toText() {
    return (await this.toField.innerText()).trim();
  }

  // Extract airport code from visible field text
  getAirportCode(fieldText) {
    const match = fieldText.match(/\b([A-Z]{3})\b/);

    if (!match) {
      throw new Error(
        `Could not extract airport code from: ${fieldText}`
      );
    }

    return match[1];
  }

  // Log actual browser state
  async logSearchState(label) {
    console.log(`\n========== ${label} ==========`);

    console.log('Current URL:', this.page.url());
    console.log('Departure:', await this.fromText());
    console.log('Destination:', await this.toText());
    console.log('Page title:', await this.page.title());

    console.log('==============================\n');
  }

  // Select or change travel date
  async selectDate(isoDate) {
    await this.selectOneWay();

    await this.dateField.click();

    const [year, month, day] = isoDate.split('-').map(Number);

    const monthLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      timeZone: 'UTC'
    }).format(
      new Date(Date.UTC(year, month - 1, day))
    );

    const dateCell = this.page
      .locator(`[data-date="${isoDate}"]:visible`)
      .first();

    // Navigate calendar to required date
    let dateFound = false;

    for (let i = 0; i < 12; i++) {
      if (await dateCell.isVisible().catch(() => false)) {
        dateFound = true;
        break;
      }

      const calendarDates = this.page.locator(
        '[data-date]:visible'
      );

      const firstVisibleDate = calendarDates.first();

      await expect(firstVisibleDate).toBeVisible({
        timeout: 10000
      });

      const firstDate = await firstVisibleDate.getAttribute(
        'data-date'
      );

      if (!firstDate) {
        throw new Error(
          'Could not determine the visible calendar date.'
        );
      }

      if (isoDate > firstDate) {
        await expect(this.nextMonthButton).toBeVisible();
        await this.nextMonthButton.click();
      } else {
        await expect(this.prevMonthButton).toBeVisible();
        await this.prevMonthButton.click();
      }
    }

    if (
      !dateFound &&
      !(await dateCell.isVisible().catch(() => false))
    ) {
      throw new Error(
        `Could not find ${isoDate} in the Booking.com calendar.`
      );
    }

    await expect(dateCell).toBeVisible({
      timeout: 20000
    });

    await dateCell.click();

    // Verify selected date in actual UI field
    await expect(this.dateField).toContainText(
      new RegExp(`${day}\\s+${monthLabel}`, 'i'),
      { timeout: 15000 }
    );

    await this.page.keyboard.press('Escape');

    console.log(
      'Selected travel date:',
      await this.dateText()
    );
  }

  // Return actual visible date field text
  async dateText() {
    return (await this.dateField.innerText()).trim();
  }

  // Submit flight search
  async submit() {
    await expect(this.searchButton).toBeVisible({
      timeout: 15000
    });

    await expect(this.searchButton).toBeEnabled({
      timeout: 15000
    });

    await this.searchButton.click();
  }

  // Complete DEL to BOM search
  async searchDelToBomForDate(isoDate) {
    await this.openReady();

    await this.selectRoute('DEL', 'BOM');

    // Restore One-way after airport selection
    await this.selectOneWay();

    await this.selectDate(isoDate);

    await this.submit();
  }

  // Validate actual flight search results URL
  async assertSearchSubmitted(
    isoDate,
    from = 'DEL',
    to = 'BOM'
  ) {
    const fromRoute = this.airportRouteIds[from];
    const toRoute = this.airportRouteIds[to];

    if (!fromRoute || !toRoute) {
      throw new Error(
        `Route identifiers are not configured for ${from} to ${to}.`
      );
    }

    const expectedPath =
      `/flights/${fromRoute}-${toRoute}/`;

    await expect.poll(
      () => this.page.url(),
      {
        message:
          'Booking.com should navigate to the flight results page',
        timeout: 30000
      }
    ).toContain(expectedPath);

    const currentUrl = new URL(this.page.url());

    expect(currentUrl.pathname).toContain(expectedPath);

    expect(
      currentUrl.searchParams.get('from')
    ).toBe(fromRoute);

    expect(
      currentUrl.searchParams.get('to')
    ).toBe(toRoute);

    expect(
      currentUrl.searchParams.get('depart')
    ).toBe(isoDate);

    expect(
      currentUrl.searchParams.get('type')
    ).toBe('ONEWAY');
  }

  // AUTO_008 - Verify same departure and destination is rejected
  async assertSameAirportValidation() {
    await this.logSearchState(
      'AUTO_008 - Before clicking Explore'
    );

    const departure = this.getAirportCode(
      await this.fromText()
    );

    const destination = this.getAirportCode(
      await this.toText()
    );

    console.log('Departure airport code:', departure);
    console.log('Destination airport code:', destination);

    expect(departure).toBe(destination);

    await this.submit();

    const validationMessage =
      "Origin and destination can't be the same";

    await expect(this.page.locator('body')).toContainText(
      validationMessage,
      { timeout: 10000 }
    );

    await this.logSearchState(
      'AUTO_008 - After clicking Explore'
    );

    const currentUrl = new URL(this.page.url());

    expect(currentUrl.pathname).toBe(
      '/flights/index.en-gb.html'
    );

    await expect(this.page.locator('body')).toContainText(
      validationMessage
    );

    expect(
      this.getAirportCode(await this.fromText())
    ).toBe(departure);

    expect(
      this.getAirportCode(await this.toText())
    ).toBe(destination);

    console.log(
      'AUTO_008 PASSED: Same airport validation displayed successfully.'
    );
  }

  // AUTO_007 - Verify empty destination defaults to Anywhere
  async assertMissingDestinationValidation() {
    await this.logSearchState(
      'AUTO_007 - Before clicking Explore'
    );

    await expect(this.toField).toContainText(/Going to/i);

    await this.submit();

    await expect.poll(
      () => this.page.url(),
      {
        message: 'Booking.com should navigate to Anywhere results',
        timeout: 30000
      }
    ).toContain('/fly-anywhere/');

    await this.logSearchState(
      'AUTO_007 - After clicking Explore'
    );

    const currentUrl = new URL(this.page.url());

    console.log('Final URL:', currentUrl.href);

    console.log(
      'Destination query:',
      currentUrl.searchParams.get('to')
    );

    expect(currentUrl.pathname).toContain('/fly-anywhere/');
    expect(currentUrl.searchParams.get('to')).toBe('Anywhere');

    await expect(this.page).toHaveTitle(/Anywhere/i);
  }
}

module.exports = { FlightSearchPage };
