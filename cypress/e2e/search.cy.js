const search = (term, fixture) => {
    cy.visit('./cypress/e2e/test.html');

    cy.intercept('/lpa-api/v1/search/persons', { fixture });

    cy.get('input').type(term);
    cy.get('button').click();
};

describe('Search component', () => {
    describe('Search results', () => {
        it('Normalises case-number queries before calling the API', () => {
            cy.visit('./cypress/e2e/test.html');

            cy.intercept('POST', '/lpa-api/v1/search/persons', (req) => {
                const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                expect(body.term).to.eq('7000-2910-9383');

                req.reply({ fixture: 'single.json' });
            }).as('caseLookup');

            cy.get('input').type('7000 2910 9383');
            cy.get('button').click();

            cy.wait('@caseLookup');
        });

        it('Displays basic case information', () => {
            search('Giusto', 'single.json');

            cy.contains('.sirius-search__item', 'Giusto Rita [Donor]').within(() => {
                cy.contains('a', '7000-2910-9383').should('have.attr', 'href', '/lpa/person/75/14');

                cy.contains('dt', 'DOB').next().contains('19/01/1934');
                cy.contains('dt', 'Address').next().contains('9046 Harvey Track, Suite 540, Violaport, Lothian, EQ4 1PR, United Kingdom');
                cy.contains('.sirius-tag', 'HW').should('have.class', 'govuk-tag--grass-green');
                cy.contains('(Pending)');
            });
        });

        it('Expands cases', () => {
            search('Lloyd', 'multiple.json');

            cy.get('.sirius-search__item').filter(':contains("Lloyd Poullard")')
                .eq(0)
                .should('contain.text', '[Donor]')
                .within(() => {
                    cy.contains('a', '7000-2910-2948').should('have.attr', 'href', '/lpa/person/94/315');
                    cy.contains('.sirius-tag', 'HW').should('have.class', 'govuk-tag--grass-green');
                    cy.contains('(Registered)')
                });

            cy.get('.sirius-search__item').filter(':contains("Lloyd Poullard")')
                .eq(1)
                .should('contain.text', '[Donor]')
                .within(() => {
                    cy.contains('a', '7000-2910-1244').should('have.attr', 'href', '/lpa/person/94/219');
                    cy.contains('.sirius-tag', 'PFA').should('have.class', 'govuk-tag--turquoise');
                    cy.contains('(Pending)')
                });
        });

        it('Displays basic case information supervision case', () => {
            search('Antoine Burgundy', 'supervision-case.json');

            cy.get('.sirius-search__item').filter(':contains("Antoine Burgund")')
            .eq(0)
            .should('contain.text', '[Client]')
            .within(() => {
                cy.contains('a', '7000-0000-2597').should('have.attr', 'href', '/supervision/#/clients/72?order=104');
                cy.contains('dt', 'DOB').next().contains('01/01/1980');
                cy.contains('dt', 'Address').next().contains('100 Davids Lane, Struy, Dorset, IV48RG');
                cy.contains('.sirius-search__link a', 'Order/HW 7000-0000-2597');
            });
        });

        it('Formats digital LPA subtypes correctly', () => {
            search('Brroo', 'multiple-digital-lpas.json');

            cy.get('.sirius-search__item').filter(':contains("Abelard Brroo")')
                .eq(0)
                .should('contain.text', '[Donor]')
                .within(() => {
                    cy.contains('a', 'M-QQQQ-EEEE-WWWW').should('have.attr', 'href', '/lpa/frontend/lpa/M-QQQQ-EEEE-WWWW');
                    cy.contains('.sirius-tag', 'PW').should('have.class', 'govuk-tag--grass-green');
                    cy.contains('(Registered)')
                });

            cy.get('.sirius-search__item').filter(':contains("Abelard Brroo")')
                .eq(1)
                .should('contain.text', '[Donor]')
                .within(() => {
                    cy.contains('a', 'M-1111-2222-3333').should('have.attr', 'href', '/lpa/frontend/lpa/M-1111-2222-3333');
                    cy.contains('.sirius-tag', 'PA').should('have.class', 'govuk-tag--turquoise');
                    cy.contains('(Pending)')
                });
        });

        it('Hides cases if they overflow', () => {
            search('Test', 'overflow.json');

            cy.get('.sirius-search__item:contains(Donor)').should('have.length', 3);
        });

        it('Formats status correctly', () => {
            search('Lloyd', 'multiple.json');

            cy.contains('(Registered)')
            cy.contains('(Pending)')
        });

        it('Clears preview after clicking away', () => {
            search('Giusto', 'single.json');

            cy.contains('.sirius-search__item', 'Giusto Rita [Donor]');

            cy.get('#floating-box').click();

            cy.get('.sirius-search').should('have.prop', 'hidden', true);
            cy.get('.sirius-search').find('.sirius-search__item').should('not.exist');

            cy.get('input').focus();

            cy.get('.sirius-search').should('have.prop', 'hidden', true);
            cy.get('.sirius-search').find('.sirius-search__item').should('not.exist');
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
            cy.contains('.govuk-tag', 'Deleted')
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

            cy.contains('.sirius-search__item--summary', 'Showing 1 of 1 cases');
        });

        it('Increases count for multiple results', () => {
            search('Giusto', 'multiple.json');

            cy.contains('.sirius-search__item--summary', 'Showing 2 of 2 cases');
        });

        it('Decreases count when results overflow', () => {
            cy.viewport(320, 720); // small viewport to trigger overflow
            search('Giusto', 'overflow.json');

            cy.contains('.sirius-search__item--summary', 'Showing 2 of 4 cases');
        });

        it('Links to search results page', () => {
            search('Giusto', 'single.json');

            cy.contains('a', 'View all').should('have.attr', 'href', '/lpa/frontend/search?term=Giusto');
        });
    });
});
