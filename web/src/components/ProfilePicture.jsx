/**
 * @file ProfilePicture.jsx
 * @description A robust profile picture component that handles image loading,
 * Base64 fallbacks, and renders initials if no image is available.
 *
 * @dependencies
 * - react: For state, effect hooks, and forwardRef.
 * - Nav.style: Styled components for the avatar wrapper and image.
 *
 * @exports ProfilePicture (default)
 * @interconnections Used in Nav.jsx and various profile/dashboard views.
 */

import { ProfilePicture as StyledProfilePicture } from "./Nav/Nav.style";
import { useState, useEffect, forwardRef } from "react";

const ProfilePicture = forwardRef(
  ({ user, style, shadow = true, ...props }, ref) => {
    if (!user) return null;

    /**
     * Logic to derive user initials from their full name.
     */
    const initials = ((fullname) => {
      if (!fullname || fullname.length === 0) return "?";
      if (fullname.length > 2) {
        return fullname[0] + fullname[fullname.length - 1];
      } else {
        return fullname.join("");
      }
    })((user.fullname || "").split(" ").map((word) => word[0]));

    const [imgSrc, setImgSrc] = useState(user.profileImageData || null);

    /**
     * Effect to determine the best available image source.
     * Prioritizes local Base64 data (profileImageData) over the external URL (profilePicture).
     */
    useEffect(() => {
      if (user.profileImageData) {
        setImgSrc(user.profileImageData);
        return;
      }

      if (user.profilePicture) {
        let active = true;
        const fetchImage = async () => {
          try {
            const response = await fetch(user.profilePicture, {
              referrerPolicy: "no-referrer",
            });
            if (!response.ok) throw new Error("Failed to load image");
            const blob = await response.blob();
            if (active) {
              setImgSrc(URL.createObjectURL(blob));
            }
          } catch (error) {
            console.warn(
              "Failed to fetch profile picture manually, falling back to direct URL",
              error,
            );
            if (active) setImgSrc(user.profilePicture);
          }
        };
        fetchImage();
        return () => {
          active = false;
        };
      }
    }, [user.profileImageData, user.profilePicture]);

    return (
      <StyledProfilePicture.Wrapper
        ref={ref}
        style={{ cursor: "pointer", ...style }}
        $shadow={shadow}
        {...props}
      >
        <StyledProfilePicture.Icon
          src={imgSrc || user.profilePicture}
          referrerPolicy="no-referrer"
        />
        <StyledProfilePicture.Fallback delayMs={600}>
          {initials}
        </StyledProfilePicture.Fallback>
      </StyledProfilePicture.Wrapper>
    );
  },
);

ProfilePicture.displayName = "ProfilePicture";

export default ProfilePicture;
