import type { ethers } from "ethers";
import { toast } from "sonner";

export const handleBatchPayment = async ({
  signer,
  batchPaymentData,
  invoicesCount,
}: {
  signer: ethers.Signer;
  batchPaymentData: any;
  invoicesCount: number;
}) => {
  toast.info("Initiating payment...");

  const isApprovalNeeded =
    batchPaymentData.ERC20ApprovalTransactions.length > 0;

  if (isApprovalNeeded) {
    toast.info("Approval required", {
      description: "Please approve the transaction in your wallet",
    });

    for (const approvalTransaction of batchPaymentData.ERC20ApprovalTransactions) {
      const tx = await signer.sendTransaction(approvalTransaction as any);
      await tx.wait();
    }
  }

  toast.info("Sending batch payment...");
  const tx = await signer.sendTransaction(
    batchPaymentData.batchPaymentTransaction as any,
  );
  await tx.wait();

  toast.success("Batch payment successful", {
    description: `Successfully processed ${invoicesCount} payments`,
  });
};
