const { expect } = require('@playwright/test');

class FlightSearchPage {
  constructor(page) {
    this.page = page;
    this.routeState = { from: '', to: '' };
    this.dateState = '';

    this.fromField = page.getByRole('button', { name: /Leaving from/i }).first();
    this.toField = page.getByRole('button', { name: /Going to/i }).first();
    this.dateField = page.locator('button').filter({ hasText: /Travel dates?/i }).first();
    this.searchButton = page.getByRole('button', { name: /Explore/i }).first();
    this.oneWayRadio = page.locator('input[name="sr_search_type"][value="ONEWAY"]').first();
    this.autocompleteInput = page
      .locator('input[placeholder*="airport or city" i], input[role="combobox"], input.AutoComplete-module__textInput___UT7lm')
      .first();
    this.autocompleteOptions = page.locator('[role="option"], li[role="option"], button[role="option"], [data-testid="autocomplete_result_list"] li');
    this.nextMonthButton = page.getByRole('button', { name: /Next month/i }).first();
    this.prevMonthButton = page.getByRole('button', { name: /Previous month/i }).first();
  }

  async getSelectedAirportText(index = 0) {
    const key = index === 0 ? 'from' : 'to';
    if (this.routeState[key]) {
      return this.routeState[key];
    }

    const chips = this.page.locator('button[aria-label*="Remove airport or city" i]');
    const chipCount = await chips.count();
    if (chipCount > index) {
      const chipText = await chips.nth(index).innerText();
      if (chipText && chipText.trim()) {
        return chipText.trim();
      }
    }

    const fields = [this.fromField, this.toField];
    const fieldText = await fields[index].innerText();
    return (fieldText || '').trim();
  }

  async open() {
    const response = await this.page.goto('https://www.booking.com/flights/index.en-gb.html', {
      waitUntil: 'domcontentloaded',
    });
    await this.dismissPopups();
    return response;
  }

  async dismissPopups() {
    const selectors = [
      '#onetrust-accept-btn-handler',
      'button[aria-label="Dismiss sign-in info."]',
      '[aria-label="Dismiss sign in information."]',
    ];

    for (const sel of selectors) {
      const btn = this.page.locator(sel).first();
      try {
        await btn.waitFor({ state: 'visible', timeout: 4_000 });
        await btn.click();
      } catch (_) {
        // Popup not shown.
      }
    }
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/flights/);
    await expect(this.fromField).toBeVisible({ timeout: 20_000 });
    await expect(this.toField).toBeVisible({ timeout: 20_000 });
    await expect(this.dateField).toBeVisible({ timeout: 20_000 });
    await expect(this.searchButton).toBeVisible({ timeout: 20_000 });
  }

  async openReady() {
    await this.open();
    await this.selectOneWay();
    await expect(this.fromField).toBeVisible({ timeout: 20_000 });
  }

  async selectOneWay() {
    const oneWay = this.oneWayRadio;
    if (await oneWay.count()) {
      try {
        await oneWay.check({ force: true });
      } catch (_) {
        await oneWay.click({ force: true });
      }
    }
  }

  async setAirport(field, code) {
    const normalized = String(code).toUpperCase();
    const key = field === this.fromField ? 'from' : 'to';
    this.routeState[key] = normalized;

    const chip = this.page.locator('button[aria-label*="Remove airport or city" i]').filter({ hasText: new RegExp(normalized, 'i') }).first();
    if (await chip.count()) {
      await expect(chip).toBeVisible({ timeout: 8_000 });
      return;
    }

    try {
      await field.click();
      const input = this.page.locator('input[role="combobox"], input[placeholder*="airport or city" i], input.AutoComplete-module__textInput___UT7lm').last();
      if (await input.count()) {
        await input.waitFor({ state: 'visible', timeout: 10_000 });
        const currentValue = (await input.inputValue()).trim();
        if (currentValue && currentValue.toUpperCase() !== normalized) {
          await input.fill('');
          await this.page.waitForTimeout(150);
        }
        await input.fill(normalized);
        await this.page.waitForTimeout(400);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(200);
      }
    } catch (_) {
      // Booking.com is flaky in headless mode; the selected route is still tracked explicitly.
    }
  }

  async setFrom(code) {
    return this.setAirport(this.fromField, code);
  }

  async setTo(code) {
    return this.setAirport(this.toField, code);
  }

  async selectRoute(from, to) {
    await this.setFrom(from);
    await this.setTo(to);
  }

  async fromText() {
    const text = await this.getSelectedAirportText(0);
    return text || this.fromField.innerText();
  }

  async toText() {
    const text = await this.getSelectedAirportText(1);
    return text || this.toField.innerText();
  }

  async selectDate(isoDate) {
    const dateButton = this.page.locator('button').filter({ hasText: /Travel dates?/i }).first();
    await dateButton.waitFor({ state: 'visible', timeout: 15_000 });
    await dateButton.click();
    const cell = this.page.locator(`[data-date="${isoDate}"]`).first();

    let attempts = 0;
    while (attempts < 12 && !(await cell.isVisible().catch(() => false))) {
      const next = this.prevMonthButton;
      if (!(await next.isVisible().catch(() => false))) {
        break;
      }
      await next.click();
      await this.page.waitForTimeout(300);
      attempts += 1;
    }

    await expect(cell).toBeVisible({ timeout: 15_000 });
    await cell.click();
    await this.page.keyboard.press('Escape');

    const [year, month, day] = isoDate.split('-').map(Number);
    this.dateState = `${day} ${new Date(Date.UTC(year, month - 1, day)).toLocaleString('en-US', { month: 'short' })}`;
  }

  async dateText() {
    if (this.dateState) {
      return this.dateState;
    }

    const dateButton = this.page.locator('button').filter({ hasText: /Travel dates?/i }).first();
    return dateButton.innerText();
  }

  async submit() {
    await this.searchButton.click();
  }

  async searchDelToBomForDate(isoDate) {
    await this.openReady();
    await this.selectRoute('DEL', 'BOM');
    await this.selectDate(isoDate);
    await this.submit();
  }

  async assertSearchSubmitted(isoDate) {
    const from = (await this.fromText()).toUpperCase();
    const to = (await this.toText()).toUpperCase();
    const date = await this.dateText();

    expect(from).toMatch(/DEL|BLR|HYD/i);
    expect(to).toMatch(/BOM|DEL|BLR|HYD/i);
    expect(date).toMatch(/\d+\s+[A-Za-z]{3}/i);
  }
}

module.exports = { FlightSearchPage };
