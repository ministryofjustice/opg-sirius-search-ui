import { query, queryDeletedCases } from "./lib/api";
import {escapeHTML, formatAddress, statusColour, translateSubtype} from "./lib/format";

const CLASSES = {
  container: "sirius-search",
  list: "sirius-search__list",
  item: "sirius-search__item",
  itemSummary: "sirius-search__item--summary",
  link: "sirius-search__link",
};

function SearchResults($input, $form) {
  if ($input.searchResults) {
    return $input.searchResults.search();
  }

  $input.searchResults = this;

  this.$input = $input;
  this.$form = $form;
  this.config = this.getConfig();

  this.$container = document.createElement("div");
  this.$container.classList.add("govuk-body", CLASSES.container);

  let inputBoundingBox = this.$input.getBoundingClientRect();
  if (this.config.attach) {
    inputBoundingBox = document
      .querySelector(this.config.attach)
      .getBoundingClientRect();
  }

  this.$container.style.width = `${inputBoundingBox.width}px`;

  if (this.config.position === "top") {
    this.$container.style.top = "33px";
  }

  this.$form.style.position = "relative";
  this.$form.appendChild(this.$container);

  this.$input.addEventListener("focus", () => {
    this.open();
  });

  this.$input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      this.close();
    }
  });

  document.addEventListener("click", (e) => {
    if (!$form.contains(e.target)) {
      this.close();
    }
  });

  document.addEventListener("focusin", (e) => {
    if (!$form.contains(e.target)) {
      this.close();
    }
  });

  this.search();
}

SearchResults.prototype.getConfig = function getConfig() {
  return this.$input
    .getAttributeNames()
    .filter((x) => x.substr(0, 27) === "data-sirius-search-preview-")
    .reduce(
      (attrs, x) => ({
        ...attrs,
        [x.substr(27)]: this.$input.getAttribute(x),
      }),
      {}
    );
};

SearchResults.prototype.search = async function search() {
  const searchTerm = this.$input.value;

  if (searchTerm === "") {
    this.render("");
    return;
  }

  const { results, anyResults, total } = await query(searchTerm);

  const uid = searchTerm.replace(/\D+/g, "");
  if (results.length === 0 && uid.match(/^\d{12}$/)) {
    const cases = await queryDeletedCases(uid);
    const caseItem = cases[0];

    const deletionDate = new Date(caseItem.deletedAt);

    this.render(`
            <ul class="${CLASSES.list}">
              <li class="${CLASSES.item}">
                  <strong>${caseItem.uId}</strong>
                  <p class="${CLASSES.link}">
                      Deleted on ${Intl.DateTimeFormat().format(
                        deletionDate
                      )} because ${caseItem.deletionReason} (was ${
      caseItem.status
    })
                  </p>
                  <dl class="govuk-summary-list govuk-summary-list--no-border govuk-!-margin-bottom-0">
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key govuk-!-padding-top-1 govuk-!-padding-bottom-1">Status:</dt>
                          <strong class="govuk-tag govuk-tag--red">
                            Deleted
                          </strong>
                      </div>
                  </dl>
              </li>
            </ul>
        `);
    return;
  }

  if (results.length === 0) {
    if (anyResults) {
      this.render(`
                <div class="${CLASSES.item}">
                    <p><strong>No donors or clients were found.</strong></p>
                    <p><a class="govuk-link" href="/lpa/frontend/search?term=${escapeHTML(searchTerm)}" target="_self">View all results</a></p>
                </div>
            `);
    } else {
      this.render(`
                <div class="${CLASSES.item}">
                    <p><strong>No cases were found.</strong></p>
                    <p>This could be because:</p>
                    <ul class="govuk-list govuk-list--bullet">
                        <li>the paper LPA hasn’t been scanned yet</li>
                        <li>the name is spelt incorrectly or differently on the paper LPA which means a match can’t be found</li>
                    </ul>

                    <p>For the best search results try searching with the case number.</p>

                    <p>If you don’t have the case number try searching by:</p>
                    <ul class="govuk-list govuk-list--bullet">
                        <li>full name and date of birth, or</li>
                        <li>full name and postcode</li>
                    </ul>
                </div>
            `);
    }
    return;
  }

  this.render(`
        <ul class="${CLASSES.list}">
        ${results
      .map(
        (result) => {
          const caseUrl = result.case.caseType === "DIGITAL_LPA"
            ? `/lpa/frontend/lpa/${result.case.uId}`
            : result.case.caseType.toLowerCase() === "order"
            ? `/supervision/#/clients/${result.id}?order=${result.case.id}`
            : `/lpa/person/${result.id}/${result.case.id}`;

          const caseTypeDisplay = result.case.caseType.toUpperCase() === "DIGITAL_LPA"
            ? "Digital LPA"
            : result.case.caseType.toLowerCase() === "order"
            ? "Order"
            : result.case.caseType;

          return `
              <li class="${CLASSES.item}">
               <a class="govuk-link" href="${caseUrl}">
                  ${escapeHTML(result.firstname)} ${escapeHTML(result.surname)}, ${result.personType}
                </a>
                  <p class="${CLASSES.link}">
                      <a class="govuk-link" href="${caseUrl}">
                        ${result.case.uId}
                      </a>
                  </p>
                  <dl class="govuk-summary-list govuk-summary-list--no-border govuk-!-margin-bottom-0">
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key govuk-!-padding-top-1 govuk-!-padding-bottom-1"><abbr title="Date of birth">DOB:</abbr></dt>
                          <dd class="govuk-summary-list__value govuk-!-padding-top-1 govuk-!-padding-bottom-1">${result.dob}</dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key govuk-!-padding-top-1 govuk-!-padding-bottom-1">Address:</dt>
                          <dd class="govuk-summary-list__value govuk-!-padding-top-1 govuk-!-padding-bottom-1">${
                        result.addresses ? formatAddress(result.addresses[0]) : ""
                      }</dd>
                      </div>
                      ${result.case.status ? `
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key govuk-!-padding-top-1 govuk-!-padding-bottom-1">Status:</dt>
                          <dd class="govuk-summary-list__value govuk-!-padding-top-1 govuk-!-padding-bottom-1">
                            <strong class="govuk-tag govuk-tag--${statusColour(result.case.status)}">
                              ${result.case.status}
                            </strong>
                          </dd>
                      </div>
                      ` : ""}
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key govuk-!-padding-top-1 govuk-!-padding-bottom-1">Type:</dt>
                          <dd class="govuk-summary-list__value govuk-!-padding-top-1 govuk-!-padding-bottom-1">${caseTypeDisplay} - ${translateSubtype(result.case.caseSubtype.toUpperCase())}</dd>
                      </div>
                  </dl>
              </li>
            `;
        }
      )
    .join("")}
        </ul>
        <div class="${CLASSES.item} ${CLASSES.itemSummary}">
            Showing <strong data-id="sirius-search-summary-count">${results.length}</strong> of <strong>${total}</strong> results
            <a class="govuk-link sirius-search__link--view-all" href="/lpa/frontend/search?term=${escapeHTML(searchTerm)}" target="_self">View all</a>
        </div>
    `);

  this.resizeContainer();
};

SearchResults.prototype.render = function render(innerHTML) {
  this.open();

  this.$container.innerHTML = innerHTML;
};

SearchResults.prototype.open = function close() {
  this.$container.hidden = false;
};

SearchResults.prototype.close = function close() {
  this.$container.hidden = true;
};

SearchResults.prototype.resizeContainer = function resizeContainer() {
  let hidden = 0;
  while (this.$container.getBoundingClientRect().bottom > window.innerHeight) {
    const items = Array.from(
      this.$container.querySelectorAll(
        `.${CLASSES.item}:not(.${CLASSES.itemSummary})`
      )
    );

    if (items.length) {
      const $remove = items[items.length - 1];
      $remove.parentElement.removeChild($remove);
      hidden += 1;
    } else {
      break;
    }
  }

  const $total = this.$container.querySelector(
    `.${CLASSES.itemSummary} strong:first-child`
  );
  if ($total instanceof HTMLElement) {
    $total.innerText = (parseInt($total.innerText, 10) - hidden).toString();
  }
};

document.addEventListener("submit", async (e) => {
  const $form = e.target;

  if (!($form instanceof HTMLFormElement)) {
    return;
  }

  const $input = $form.querySelector('[data-module="sirius-search-preview"]');

  if (!($input instanceof HTMLInputElement)) {
    return;
  }

  new SearchResults($input, $form);

  e.preventDefault();
});
