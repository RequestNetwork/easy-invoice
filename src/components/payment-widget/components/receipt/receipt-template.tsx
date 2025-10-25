import type { FC } from "react";
import {
  formatCryptoAmount,
  formatUSDAmount,
  formatReceiptDate,
  type ReceiptData,
} from "../../utils/receipt";
// a module.css file doesn't work with html2pdf.js
import "./styles.css";

export const ReceiptPDFTemplate: FC<{ receipt: ReceiptData }> = ({
  receipt,
}) => {
  return (
    <div className="receipt-container">
      <div className="receipt-header">
        <div className="company-info">
          <h1 className="company-name">{receipt.company.name}</h1>
          <div className="company-details">
            {receipt.company.address && (
              <>
                <div>{receipt.company.address.street}</div>
                <div>
                  {receipt.company.address.city},{" "}
                  {receipt.company.address.state}{" "}
                  {receipt.company.address.postalCode}{" "}
                  {receipt.company.address.country}
                </div>
              </>
            )}
            {receipt.company.email && <div>{receipt.company.email}</div>}
            {receipt.company.taxId && (
              <div>Tax ID: {receipt.company.taxId}</div>
            )}
          </div>
        </div>

        <div className="receipt-title-section">
          <h2 className="receipt-title">REC</h2>
          <div className="receipt-number">
            #{receipt.metadata.receiptNumber}
          </div>
          <div className="receipt-date">
            {formatReceiptDate(receipt.metadata.issueDate)}
          </div>
        </div>
      </div>

      <div className="party-info-section">
        <div className="info-box">
          <h3 className="info-header">FROM</h3>
          <div className="party-name">{receipt.company.name}</div>
          <div className="wallet-address">{receipt.company.walletAddress}</div>
          <div className="address-info">
            {receipt.company.address && (
              <>
                <div>{receipt.company.address.street}</div>
                <div>
                  {receipt.company.address.city},{" "}
                  {receipt.company.address.state}{" "}
                  {receipt.company.address.postalCode}{" "}
                  {receipt.company.address.country}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="info-box">
          <h3 className="info-header">TO</h3>
          <div className="party-name">
            {[receipt.buyer.firstName, receipt.buyer.lastName]
              .filter(Boolean)
              .join(" ") || "Customer"}
          </div>
          <div className="wallet-address">{receipt.buyer.walletAddress}</div>
          {receipt.buyer.email && (
            <div className="email">{receipt.buyer.email}</div>
          )}
          {receipt.buyer.address && (
            <div className="address-info">
              <div>{receipt.buyer.address.street}</div>
              <div>
                {receipt.buyer.address.city}, {receipt.buyer.address.state}{" "}
                {receipt.buyer.address.postalCode}{" "}
                {receipt.buyer.address.country}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="payment-info">
        <div>
          <strong>Payment Method:</strong>{" "}
          <span>{`${receipt.payment.currency} on ${receipt.payment.chain}`}</span>
        </div>
        {receipt.payment.transactionHash && (
          <div className="transaction-hash">
            <strong>Transaction:</strong> {receipt.payment.transactionHash}
          </div>
        )}
      </div>

      <table className="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="center">Qty</th>
            <th className="right">Unit Price</th>
            <th className="center">Disc%</th>
            <th className="center">Tax%</th>
            <th className="right">Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, index) => (
            <tr
              key={item.id}
              className={index % 2 === 0 ? "row-even" : "row-odd"}
            >
              <td>{item.description}</td>
              <td className="center">{item.quantity}</td>
              <td className="right">
                {formatCryptoAmount(
                  item.unitPrice.toString(),
                  item.currency || receipt.payment.currency,
                )}
              </td>
              <td className="center">{item.discount || 0}%</td>
              <td className="center">{item.tax || 0}%</td>
              <td className="right amount">
                {formatCryptoAmount(
                  item.total.toString(),
                  item.currency || receipt.payment.currency,
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals-section">
        <div className="totals-box">
          {receipt.totals.totalDiscount.length > 0 && (
            <div className="total-line">
              <span>Discount:</span>
              <span className="total-amount">
                -
                {formatCryptoAmount(
                  receipt.totals.totalDiscount.toString(),
                  receipt.payment.currency,
                )}
              </span>
            </div>
          )}

          {receipt.totals.totalTax.length > 0 && (
            <div className="total-line">
              <span>Tax:</span>
              <span className="total-amount">
                {formatCryptoAmount(
                  receipt.totals.totalTax.toString(),
                  receipt.payment.currency,
                )}
              </span>
            </div>
          )}

          <div className="total-line subtotal">
            <span>Subtotal:</span>
            <span className="total-amount">
              {formatCryptoAmount(
                receipt.payment.amount,
                receipt.payment.currency,
              )}
            </span>
          </div>

          <div className="total-line final">
            <span>TOTAL (USD):</span>
            <span className="total-amount">
              {formatUSDAmount(receipt.totals.totalUSD)}
            </span>
          </div>
        </div>
      </div>

      {receipt.metadata.notes && (
        <div className="notes-section">
          <strong>Notes:</strong> {receipt.metadata.notes}
        </div>
      )}
    </div>
  );
};
