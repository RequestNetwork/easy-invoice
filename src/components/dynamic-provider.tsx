"use client";
import {
  useDynamicContext,
  useExternalAuth,
} from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";

export const DynamicGoogleAuthHandler = ({
  idToken,
  googleSub,
}: {
  idToken: string | null | undefined;
  googleSub: string | null | undefined;
}) => {
  const { user } = useDynamicContext();
  const { signInWithExternalJwt } = useExternalAuth();

  useEffect(() => {
    if (!idToken || !googleSub) {
      return;
    }

    // If user is already authenticated, don't try to authenticate again
    if (user) {
      console.debug("User profile : ", JSON.stringify(user, null, 2));

      return;
    }

    // Perform silent authentication
    const authenticateUser = async () => {
      try {
        const userProfile = await signInWithExternalJwt({
          externalUserId: googleSub as string,
          externalJwt: idToken as string,
        });

        console.debug("User profile : ", JSON.stringify(userProfile, null, 2));
      } catch (error) {
        console.error("Dynamic authentication error:", error);
      }
    };

    authenticateUser();
  }, [idToken, googleSub, user, signInWithExternalJwt]);

  return null;
};
