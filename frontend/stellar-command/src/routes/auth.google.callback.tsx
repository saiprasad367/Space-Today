/**
 * Google OAuth Callback Page
 *
 * This page is opened inside the popup window by Google after the user
 * authorizes. It extracts the code from the URL, posts it to the opener
 * window, and closes itself.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/google/callback")({
  head: () => ({ meta: [{ title: "Authenticating…" }] }),
  component: GoogleCallback,
});

function GoogleCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    // Send the auth code back to the parent window using BroadcastChannel (COOP-proof)
    const channel = new BroadcastChannel("google_oauth_channel");
    channel.postMessage({ code, error });
    channel.close();

    // Fallback: PostMessage to opener if it's not blocked/null
    if (window.opener) {
      window.opener.postMessage(
        { type: "google_oauth_callback", code, error },
        window.location.origin,
      );
    }

    // Close the popup after a tiny delay to allow the message to deliver
    setTimeout(() => {
      window.close();
    }, 100);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0a0a",
        color: "#888",
        fontFamily: "monospace",
        fontSize: 13,
        letterSpacing: "0.1em",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        style={{ animation: "spin 1s linear infinite" }}
      >
        <circle cx="12" cy="12" r="10" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      AUTHENTICATING WITH GOOGLE…
    </div>
  );
}
