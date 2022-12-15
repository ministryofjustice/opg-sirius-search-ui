function getXsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

  return match ? decodeURIComponent(match[1]) : "";
}

const defaultFetchOptions = {
  credentials: "include",
  mode: "cors",
  headers: {
    Accept: "application/json",
    "X-XSRF-TOKEN": getXsrfToken(),
  },
};

export async function queryDeletedCases(uid) {
  const response = await fetch(
    `/lpa-api/v1/deleted-cases?uid=${uid}`,
    defaultFetchOptions
  );

  return response.json();
}

export async function query(term) {
  const response = await fetch("/lpa-api/v1/search/persons", {
    ...defaultFetchOptions,
    body: JSON.stringify({ term, personTypes: ["Donor", "Client"] }),
    method: "POST",
  });

  const { results, total, aggregations } = await response.json();

  const splitResults = results.reduce((agg, result) => {
    result.cases.forEach((caseitem) => {
      agg.push({ ...result, case: caseitem });
    });

    total.count += result.cases.length - 1;

    return agg;
  }, []);

  return {
    results: splitResults,
    total: total.count,
    anyResults: aggregations && "personType" in aggregations,
  };
}
