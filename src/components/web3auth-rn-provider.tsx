"use client";

import type { Session } from "@/server/db/schema";
import type { ReactNode } from "react";

export const Web3AuthRNProvider = ({
  children,
  // session,
}: {
  children: ReactNode;
  session: Session | null;
}) => {
  // const { web3Auth, isConnected, isInitialized } = useWeb3Auth();
  // const { connectTo, loading: isLoadingConnector } = useWeb3AuthConnect();
  // useLayoutEffect(() => {
  //   console.debug("Web3Auth : ", web3Auth?.status, isInitialized);

  //   if (!session?.idToken || !web3Auth || !isInitialized || isLoadingConnector)
  //     return;

  //   // (async () => {
  //   //   try {
  //   //     if (!isConnected) {
  //   //       await connectTo(WALLET_CONNECTORS.AUTH, {
  //   //         authConnectionId: "google-id-verifier",
  //   //         authConnection: AUTH_CONNECTION.GOOGLE,
  //   //       });
  //   //     }
  //   //   } catch (err) {
  //   //     console.error("Web3Auth connection error:", err);
  //   //   }
  //   // })();
  // }, [
  //   session,
  //   web3Auth,
  //   isConnected,
  //   isInitialized,
  //   connectTo,
  //   isLoadingConnector,
  // ]);

  return <>{children}</>;
};
