export function escapeHTML(str) {
  const p = document.createElement("p");
  p.appendChild(document.createTextNode(str));
  return p.innerHTML;
}

export function formatAddress(address) {
  let lines = address.addressLines || [];
  const formattedAddress = [];
  const addressDetails = ["town", "county", "postcode", "country"];

  // if address lines is sparsely populated, server-side returns an keyed object
  if (typeof lines === "object") {
    lines = Object.keys(lines).map((key) => lines[key]);
  }

  lines.forEach((line) => {
    if (line.length > 1) {
      formattedAddress.push(line);
    }
  });
  addressDetails.forEach((line) => {
    const addressLine = address[line];
    if (addressLine && addressLine.length > 1) {
      formattedAddress.push(addressLine);
    }
  });

  return formattedAddress.map(escapeHTML).join(", ");
}

export function formatStatus(status) {
  let tag = "grey";

  switch (status.toLowerCase()) {
    case "registed":
      tag = "green";
      break;
    case "perfect":
      tag = "turquoise";
      break;
    case "pending":
      tag = "blue";
      break;
    case "payment pending":
    case "reduced fees pending":
      tag = "purple";
      break;
    case "cancelled":
    case "deleted":
    case "rejected":
    case "return - unpaid":
    case "revoked":
    case "withdrawn":
      tag = "red";
      break;
    default:
      tag = "grey";
  }
  if (status.toLowerCase() === "registered") tag = "green";
  if (status.toLowerCase() === "deleted") tag = "red";

  return `<strong class="govuk-tag govuk-tag--${tag}">${status}</strong>`;
}
