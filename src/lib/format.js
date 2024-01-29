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

const statusColourMap = {
  Registered: "green",
  Draft: "purple",
  Perfect: "turquoise",
  Pending: "yellow",
  "Payment Pending": "blue",
  "Reduced Fees Pending": "blue",
  Cancelled: "red",
  Rejected: "red",
  "Return - unpaid": "red",
  Revoked: "red",
  Withdrawn: "red",
  Deleted: "red"
};

export function statusColour(status) {
  return statusColourMap[status] || "grey";
}

export function translateSubtype(subtype) {
  let t
  switch(subtype.toUpperCase()) {
    case "HW":
      t = "Health and welfare"
      break;
    case "PFA":
      t = "Property and finance"
      break;
    case "PA":
      t = "Property affairs"
      break;
    case "PW":
      t = "Personal welfare"
      break;
    default:
      t = subtype
  }

  return t
}
