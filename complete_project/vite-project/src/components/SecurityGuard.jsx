import { useEffect } from "react";

export default function SecurityGuard({ children }) {
  useEffect(() => {
    // 1. Add print-prevention CSS dynamically
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body {
          display: none !important;
        }
      }
      /* Prevent text selection */
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(style);

    // 2. Handle Screen Blur (loses focus e.g. switching tabs, opening snipping tools, etc.)
    const handleBlur = () => {
      let overlay = document.getElementById("security-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "security-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.backgroundColor = "#020817";
        overlay.style.zIndex = "9999999";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.color = "#22d3ee";
        overlay.style.fontFamily = "system-ui, sans-serif";
        overlay.style.fontSize = "22px";
        overlay.style.fontWeight = "bold";
        overlay.style.padding = "20px";
        overlay.style.textAlign = "center";
        
        // Add a nice shield icon & description
        overlay.innerHTML = `
          <div style="font-size: 60px; margin-bottom: 20px; color: #ef4444;">🛡️</div>
          <div>Security Screen Active</div>
          <div style="font-size: 14px; color: #94a3b8; font-weight: normal; margin-top: 10px;">
            Content is protected. Screenshots and screen recordings are disabled.
          </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.filter = "blur(10px)";
      }
    };

    const handleFocus = () => {
      const overlay = document.getElementById("security-overlay");
      if (overlay) {
        overlay.remove();
      }
      document.body.style.filter = "none";
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // 3. Block keyboard shortcuts (DevTools, Print, Save, etc.)
    const handleKeyDown = (e) => {
      // Clear clipboard on PrintScreen
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
      }

      // Block Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        return false;
      }

      // Block F12 (Inspect)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I / J / C (DevTools Inspect)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")
      ) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        return false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 4. Block context menu (Right-click)
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);

    // 5. Block copy / cut / paste
    const handleCopyCutPaste = (e) => {
      e.preventDefault();
    };
    window.addEventListener("copy", handleCopyCutPaste);
    window.addEventListener("cut", handleCopyCutPaste);
    window.addEventListener("paste", handleCopyCutPaste);

    // Clean up event listeners on unmount
    return () => {
      style.remove();
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopyCutPaste);
      window.removeEventListener("cut", handleCopyCutPaste);
      window.removeEventListener("paste", handleCopyCutPaste);
      const overlay = document.getElementById("security-overlay");
      if (overlay) overlay.remove();
      document.body.style.filter = "none";
    };
  }, []);

  return <>{children}</>;
}
