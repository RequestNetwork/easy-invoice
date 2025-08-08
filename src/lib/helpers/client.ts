export const generateInvoiceNumber = (invoiceCount: string) => {
  const now = new Date();
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    timeZone: userTimeZone,
  });

  const [{ value: month }, , { value: year }] = formatter.formatToParts(now);

  return `${year}${month}-${invoiceCount}`;
};
