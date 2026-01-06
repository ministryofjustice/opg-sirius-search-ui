const search = (term, fixture) => {
    cy.visit('./cypress/e2e/test.html');

    cy.intercept('/lpa-api/v1/search/persons', { fixture });

    cy.get('input').type(term);
    cy.get('button').click();
};

describe('Search component', () => {
    describe('Search results', () => {
        it('Displays basic case information', () => {
            search('Giusto', 'single.json');

            cy.contains('.sirius-search__item', 'Giusto Rita, Donor').within(() => {
                cy.contains('a', '7000-2910-9383').should('have.attr', 'href', '/lpa/person/75/14');

                cy.contains('dt', 'DOB').next().contains('19/01/1934');
                cy.contains('dt', 'Address').next().contains('9046 Harvey Track, Suite 540, Violaport, Lothian, EQ4 1PR, United Kingdom');
                cy.contains('dt', 'Status').next().contains('Pending');
                cy.contains('dt', 'Type').next().contains('LPA - Health and welfare');
            });
        });

        it('Expands cases', () => {
            search('Lloyd', 'multiple.json');

            cy.get('.sirius-search__item:contains(Lloyd Poullard, Donor)')
                .eq(0)
                .within(() => {
                    cy.contains('a', '7000-2910-2948').should('have.attr', 'href', '/lpa/person/94/315');
                    cy.contains('dt', 'Status').next().contains('Registered');
                    cy.contains('dt', 'Type').next().contains('LPA - Health and welfare');
                });

            cy.get('.sirius-search__item:contains(Lloyd Poullard, Donor)')
                .eq(1)
                .within(() => {
                    cy.contains('a', '7000-2910-1244').should('have.attr', 'href', '/lpa/person/94/219');
                    cy.contains('dt', 'Status').next().contains('Pending');
                    cy.contains('dt', 'Type').next().contains('LPA - Property and finance');
                });
        });

        it('Displays basic case information', () => {
          search('Antoine Burgundy', 'supervision-case.json');

          cy.contains('.sirius-search__item', 'Antoine Burgundy, Client').within(() => {
            cy.contains('a', '7000-0000-2597').should('have.attr', 'href', '/supervision/#/clients/72?order=104');

            cy.contains('dt', 'DOB').next().contains('01/01/1980');
            cy.contains('dt', 'Address').next().contains('100 Davids Lane, Struy, Dorset, IV48RG');
            cy.contains('dt', 'Type').next().contains('Order - Health and welfare');
          });
        });

        it('Formats digital LPA subtypes correctly', () => {
            search('Brroo', 'multiple-digital-lpas.json');

            cy.get('.sirius-search__item:contains(Abelard Brroo, Donor)')
                .eq(0)
                .within(() => {
                    cy.contains('a', 'M-QQQQ-EEEE-WWWW').should('have.attr', 'href', '/lpa/frontend/lpa/M-QQQQ-EEEE-WWWW');
                    cy.contains('dt', 'Status').next().contains('Registered');
                    cy.contains('dt', 'Type').next().contains('Digital LPA - Personal welfare');
                });

            cy.get('.sirius-search__item:contains(Abelard Brroo, Donor)')
                .eq(1)
                .within(() => {
                    cy.contains('a', 'M-1111-2222-3333').should('have.attr', 'href', '/lpa/frontend/lpa/M-1111-2222-3333');
                    cy.contains('dt', 'Status').next().contains('Pending');
                    cy.contains('dt', 'Type').next().contains('Digital LPA - Property and affairs');
                });
        });

        it('Hides cases if they overflow', () => {
            search('Test', 'overflow.json');

            cy.get('.sirius-search__item:contains(Donor)').should('have.length', 3);
        });

        it('Formats status correctly', () => {
            search('Lloyd', 'multiple.json');

            cy.contains('.govuk-tag', 'Registered').should('have.class', 'govuk-tag--green');
            cy.contains('.govuk-tag', 'Pending').should('have.class', 'govuk-tag--blue');
        });
    });

    describe('No results', () => {
        it('Shows explanation message', () => {
            search('Giusto', 'none.json');

            cy.contains('.sirius-search__item', 'No cases were found.');
        });

        it('Searches for deleted cases if UID searched for', () => {
            cy.intercept(
                '/lpa-api/v1/deleted-cases?uid=700000021994',
                '[{"uId":"7000-0002-1994","deletedAt":"2022-03-01","deletionReason":"LPA was not paid for after 12 months","status":"Payment Pending"}]'
            );

            search('7000-0002-1994', 'none.json');

            const date = Intl.DateTimeFormat().format(new Date('2022-03-01'));
            cy.contains('.sirius-search__item', `Deleted on ${date} because LPA was not paid for after 12 months (was Payment Pending)`);
            cy.contains('.govuk-tag', 'Deleted').should('have.class', 'govuk-tag--red');
        });

        it('Falls back to standard no results when no deleted cases are found', () => {
            cy.intercept('/lpa-api/v1/deleted-cases?uid=700000021994', '[]');

            search('7000-0002-1994', 'none.json');

            cy.contains('.sirius-search__item', 'No cases were found.');
        });
    });

    describe('Summary', () => {
        it('Displays count for single results', () => {
            search('Giusto', 'single.json');

            cy.contains('.sirius-search__item--summary', 'Showing 1 of 3 results');
        });

        it('Increases count for multiple results', () => {
            search('Giusto', 'multiple.json');

            cy.contains('.sirius-search__item--summary', 'Showing 2 of 2 results');
        });

        it('Decreases count when results overflow', () => {
            search('Giusto', 'overflow.json');

            cy.contains('.sirius-search__item--summary', 'Showing 3 of 4 results');
        });

        it('Links to search results page', () => {
            search('Giusto', 'single.json');

            cy.contains('a', 'View all').should('have.attr', 'href', '/lpa/frontend/search?term=Giusto');
        });
    });
});
