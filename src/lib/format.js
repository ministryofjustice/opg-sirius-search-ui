export function escapeHTML(str) {
  const p = document.createElement("p");
  p.appendChild(document.createTextNode(str));
  return p.innerHTML;
}

export function formatAddress(address) {
  let lines = address.addressLines || [];
  const addressDetails = ["town", "county", "postcode", "country"];

  const formattedAddress = Object.values(lines).filter(
    (line) => line.length > 1
  );

  addressDetails.forEach((line) => {
    const addressLine = address[line];
    if (addressLine && addressLine.length > 1) {
      formattedAddress.push(addressLine);
    }
  });

  return formattedAddress.map(escapeHTML).join(", ");
}

const caseSubtypeFormatMap = {
  "HW": {type: "HW", colour: "grass-green"},
  "PFA": {type: "PFA", colour: "turquoise"},
  "PERSONAL-WELFARE": {type: "PW", colour: "grass-green"},
  "PROPERTY-AND-AFFAIRS": {type: "PA", colour: "turquoise"},
};

export function formatCaseType(caseType, caseSubtype) {

  const caseTypeUpper = caseType.toUpperCase();
  const caseSubtypeUpper = caseSubtype ? caseSubtype.toUpperCase() : "";

  switch(caseTypeUpper) {
    case "EPA":
      return {type: "EPA", colour: "brown"}
    case "ORDER":
      return {type: `Order/${caseSubtypeUpper}`, colour: null}
    case "DIGITAL_LPA":
    case "LPA":
      return caseSubtypeFormatMap[caseSubtype.toUpperCase()] ?? {type: `${caseTypeUpper}/${caseSubtypeUpper}`, colour: null};
  }
  return {type: `${caseTypeUpper}/${caseSubtypeUpper}`, colour: null}
}
