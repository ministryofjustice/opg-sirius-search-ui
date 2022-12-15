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

            cy.contains('.sirius-search__item', 'Giusto Rita [Donor]').within(() => {
                cy.contains('a', '7000-2910-9383 LPA/HW').should('have.attr', 'href', '/lpa/person/75/14');

                cy.contains('dt', 'DOB').next().contains('19/01/1934');
                cy.contains('dt', 'Address').next().contains('9046 Harvey Track, Suite 540, Violaport, Lothian, EQ4 1PR, United Kingdom');
                cy.contains('dt', 'Status').next().contains('Pending');
            });
        });

        it('Expands cases', () => {
            search('Lloyd', 'multiple.json');

            cy.get('.sirius-search__item:contains(Lloyd Poullard [Donor])')
                .eq(0)
                .within(() => {
                    cy.contains('a', '7000-2910-2948 LPA/HW').should('have.attr', 'href', '/lpa/person/94/315');
                    cy.contains('dt', 'Status').next().contains('Registered');
                });

            cy.get('.sirius-search__item:contains(Lloyd Poullard [Donor])')
                .eq(1)
                .within(() => {
                    cy.contains('a', '7000-2910-1244 LPA/PFA').should('have.attr', 'href', '/lpa/person/94/219');
                    cy.contains('dt', 'Status').next().contains('Pending');
                });
        });

        it('Hides cases if they overflow', () => {
            search('Test', 'overflow.json');

            cy.get('.sirius-search__item:contains([Donor])').should('have.length', 3);
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

        it('Links to search results page', () => {
            search('Giusto', 'none.json');

            cy.contains('.sirius-search__item--summary', 'View all').should("have.attr", "href").should("contain", "/lpa/frontend/search?term=Giusto");
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
    });

    describe('Attachment', () => {
        it('Attaches to input by default', () => {
            search('Giusto', 'single.json');

            cy.get('input').then(($input) => {
                const inputBox = $input[0].getBoundingClientRect();
                cy.get('.sirius-search').then(($container) => {
                    const containerBox = $container[0].getBoundingClientRect();

                    expect(containerBox.left).equal(inputBox.left);
                    expect(containerBox.top).equal(inputBox.bottom);
                    expect(containerBox.right).equal(inputBox.right);
                });
            });
        });

        it('Attaches to custom element if asked', () => {
            cy.visit('./cypress/e2e/test.html');

            cy.intercept('/lpa-api/v1/search/persons', { fixture: 'single.json' });

            // Overwrite attachment
            cy.get('input').then(($input) => {
                $input[0].setAttribute('data-sirius-search-preview-attach', '#floating-box');
            });
            cy.get('input').type('search');
            cy.get('button').click();

            // Check position
            cy.get('#floating-box').then(($input) => {
                const inputBox = $input[0].getBoundingClientRect();
                cy.get('.sirius-search').then(($container) => {
                    const containerBox = $container[0].getBoundingClientRect();

                    expect(containerBox.left).equal(inputBox.left);
                    expect(containerBox.top).equal(inputBox.bottom);
                    expect(containerBox.right).equal(inputBox.right);
                });
            });
        });
    });
});
