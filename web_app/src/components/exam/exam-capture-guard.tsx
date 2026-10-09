"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SUPPORTED_LOCALES =
  new Set(["ar", "en", "fr", "nl"]);


function withoutLocale(
  pathname: string,
): string {
  const parts =
    pathname
      .split("/")
      .filter(Boolean);

  if (
    parts.length > 0 &&
    SUPPORTED_LOCALES.has(parts[0])
  ) {
    parts.shift();
  }

  return "/" + parts.join("/");
}


export function isProtectedExamPath(
  pathname: string,
): boolean {
  const path =
    withoutLocale(pathname);

  // Main theory/category exam and active simulation.
  if (
    path === "/exam" ||
    /^\/exam\/(?!results(?:\/|$))[^/]+\/?$/.test(
      path,
    )
  ) {
    return true;
  }

  // Exam results/review expose protected question-bank content.
  if (
    /^\/exam\/results(?:\/[^/]+)?\/?$/.test(
      path,
    )
  ) {
    return true;
  }

  // Random practice exam.
  if (
    /^\/practice\/random\/?$/.test(
      path,
    )
  ) {
    return true;
  }

  // Assessment question level.
  if (
    /^\/assessment\/[^/]+\/[^/]+\/?$/.test(
      path,
    )
  ) {
    return true;
  }

  // Traffic-sign practice session.
  if (
    /^\/traffic-signs\/[^/]+\/practice\/?$/.test(
      path,
    )
  ) {
    return true;
  }

  // Numbered traffic-sign exam.
  if (
    /^\/traffic-signs\/[^/]+\/exam\/[^/]+\/?$/.test(
      path,
    )
  ) {
    return true;
  }

  return false;
}


function clearClipboardBestEffort() {
  try {
    void navigator.clipboard
      ?.writeText("")
      .catch(() => undefined);
  } catch {
    // Clipboard access can be unavailable or denied by the browser.
  }
}


export function ExamCaptureGuard() {
  const pathname =
    usePathname() || "/";

  const active =
    isProtectedExamPath(
      pathname,
    );

  useEffect(() => {
    if (!active) {
      document.body.removeAttribute(
        "data-rv-exam-protected",
      );

      document.body.removeAttribute(
        "data-rv-exam-shielded",
      );

      return;
    }

    document.body.setAttribute(
      "data-rv-exam-protected",
      "true",
    );

    let releaseTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    const clearReleaseTimer = () => {
      if (!releaseTimer) {
        return;
      }

      clearTimeout(
        releaseTimer,
      );

      releaseTimer =
        undefined;
    };


    const showShield = () => {
      clearReleaseTimer();

      // Synchronous DOM attribute:
      // CSS protection activates immediately without waiting
      // for a React re-render.
      document.body.setAttribute(
        "data-rv-exam-shielded",
        "true",
      );
    };


    const releaseShield = (
      delay = 400,
    ) => {
      clearReleaseTimer();

      releaseTimer =
        setTimeout(() => {
          if (
            document.visibilityState ===
              "visible" &&
            document.hasFocus()
          ) {
            document.body.removeAttribute(
              "data-rv-exam-shielded",
            );
          }
        }, delay);
    };


    const onVisibilityChange = () => {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        showShield();
        return;
      }

      releaseShield();
    };


    const onBlur = () => {
      showShield();
    };


    const onFocus = () => {
      releaseShield();
    };


    const onBeforePrint = () => {
      showShield();
    };


    const onAfterPrint = () => {
      releaseShield();
    };


    const blockContentAction = (
      event: Event,
    ) => {
      event.preventDefault();
    };


    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      const key =
        event.key.toLowerCase();

      const modifier =
        event.ctrlKey ||
        event.metaKey;

      const devToolsShortcut =
        modifier &&
        event.shiftKey &&
        ["i", "j", "c"].includes(
          key,
        );

      const blockedModifierShortcut =
        modifier &&
        ["c", "x", "p", "s", "u"].includes(
          key,
        );


      if (
        event.key === "PrintScreen"
      ) {
        event.preventDefault();

        showShield();
        clearClipboardBestEffort();
        releaseShield(1600);

        return;
      }


      if (
        event.key === "F12" ||
        devToolsShortcut ||
        blockedModifierShortcut
      ) {
        event.preventDefault();

        if (
          key === "p" ||
          event.key === "F12" ||
          devToolsShortcut
        ) {
          showShield();
          releaseShield(1200);
        }
      }
    };


    const onKeyUp = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key !== "PrintScreen"
      ) {
        return;
      }

      event.preventDefault();

      showShield();
      clearClipboardBestEffort();
      releaseShield(1600);
    };


    document.addEventListener(
      "visibilitychange",
      onVisibilityChange,
    );

    document.addEventListener(
      "copy",
      blockContentAction,
      true,
    );

    document.addEventListener(
      "cut",
      blockContentAction,
      true,
    );

    document.addEventListener(
      "contextmenu",
      blockContentAction,
      true,
    );

    document.addEventListener(
      "dragstart",
      blockContentAction,
      true,
    );

    document.addEventListener(
      "selectstart",
      blockContentAction,
      true,
    );

    window.addEventListener(
      "blur",
      onBlur,
    );

    window.addEventListener(
      "focus",
      onFocus,
    );

    window.addEventListener(
      "beforeprint",
      onBeforePrint,
    );

    window.addEventListener(
      "afterprint",
      onAfterPrint,
    );

    window.addEventListener(
      "keydown",
      onKeyDown,
      true,
    );

    window.addEventListener(
      "keyup",
      onKeyUp,
      true,
    );


    return () => {
      clearReleaseTimer();

      document.body.removeAttribute(
        "data-rv-exam-protected",
      );

      document.body.removeAttribute(
        "data-rv-exam-shielded",
      );

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      );

      document.removeEventListener(
        "copy",
        blockContentAction,
        true,
      );

      document.removeEventListener(
        "cut",
        blockContentAction,
        true,
      );

      document.removeEventListener(
        "contextmenu",
        blockContentAction,
        true,
      );

      document.removeEventListener(
        "dragstart",
        blockContentAction,
        true,
      );

      document.removeEventListener(
        "selectstart",
        blockContentAction,
        true,
      );

      window.removeEventListener(
        "blur",
        onBlur,
      );

      window.removeEventListener(
        "focus",
        onFocus,
      );

      window.removeEventListener(
        "beforeprint",
        onBeforePrint,
      );

      window.removeEventListener(
        "afterprint",
        onAfterPrint,
      );

      window.removeEventListener(
        "keydown",
        onKeyDown,
        true,
      );

      window.removeEventListener(
        "keyup",
        onKeyUp,
        true,
      );
    };
  }, [
    active,
  ]);


  if (!active) {
    return null;
  }


  return (
    <>
      <style>{`
        body[data-rv-exam-protected="true"],
        body[data-rv-exam-protected="true"] * {
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }


        /*
         * The blur activates through a body attribute synchronously
         * when the browser loses focus. This is intentionally not
         * dependent on React rendering.
         */
        body[data-rv-exam-shielded="true"]
          > *:not(.rv-exam-capture-layer):not(style) {
          filter: blur(32px) !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }


        .rv-exam-capture-shield {
          display: none;
        }


        body[data-rv-exam-shielded="true"]
          .rv-exam-capture-shield {
          display: flex;
        }


        .rv-exam-guard-copy {
          display: none;
        }

        html[lang^="ar"] .rv-exam-guard-copy-ar {
          display: block;
        }

        html[lang^="fr"] .rv-exam-guard-copy-fr {
          display: block;
        }

        html[lang^="nl"] .rv-exam-guard-copy-nl {
          display: block;
        }

        html[lang^="en"] .rv-exam-guard-copy-en {
          display: block;
        }

        html:not([lang^="ar"]):not([lang^="fr"]):not([lang^="nl"]):not([lang^="en"])
          .rv-exam-guard-copy-en {
          display: block;
        }


        @media print {
          body[data-rv-exam-protected="true"]
            > *:not(.rv-exam-capture-layer):not(style) {
            display: none !important;
          }

          body[data-rv-exam-protected="true"]
            .rv-exam-capture-watermark {
            display: none !important;
          }

          body[data-rv-exam-protected="true"]
            .rv-exam-capture-shield {
            display: flex !important;
            position: fixed !important;
            inset: 0 !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>


      <div
        aria-hidden="true"
        className="rv-exam-capture-layer rv-exam-capture-watermark pointer-events-none fixed inset-0 z-[2147483000] overflow-hidden"
        data-testid="exam-capture-watermark"
      >
        <div className="grid h-full w-full grid-cols-2 grid-rows-5 opacity-[0.055] sm:grid-cols-3">
          {Array.from(
            { length: 15 },
          ).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-center overflow-hidden px-2"
            >
              <span className="-rotate-[24deg] whitespace-nowrap text-[10px] font-black tracking-[0.18em] text-foreground sm:text-xs">
                RIJVIA.BE • EXAM
              </span>
            </div>
          ))}
        </div>
      </div>


      <div
        className="rv-exam-capture-layer rv-exam-capture-shield pointer-events-auto fixed inset-0 z-[2147483647] items-center justify-center bg-background px-6"
        data-testid="exam-capture-shield"
        role="alert"
        aria-live="assertive"
      >
        <div className="mx-auto max-w-lg text-center">

          <div className="text-2xl font-black text-foreground">
            Rijvia
          </div>


          <div
            dir="rtl"
            className="rv-exam-guard-copy rv-exam-guard-copy-ar"
          >
            <h2 className="mt-5 text-xl font-black text-foreground sm:text-2xl">
              محتوى الامتحان محمي
            </h2>

            <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
              تم إخفاء السؤال مؤقتًا لحماية محتوى الامتحان. ارجع إلى نافذة الامتحان للمتابعة.
            </p>
          </div>


          <div
            dir="ltr"
            className="rv-exam-guard-copy rv-exam-guard-copy-en"
          >
            <h2 className="mt-5 text-xl font-black text-foreground sm:text-2xl">
              Exam content protected
            </h2>

            <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
              The question was temporarily hidden to protect exam content. Return to the exam window to continue.
            </p>
          </div>


          <div
            dir="ltr"
            className="rv-exam-guard-copy rv-exam-guard-copy-fr"
          >
            <h2 className="mt-5 text-xl font-black text-foreground sm:text-2xl">
              Contenu d’examen protégé
            </h2>

            <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
              La question a été temporairement masquée pour protéger le contenu de l’examen. Revenez à la fenêtre de l’examen pour continuer.
            </p>
          </div>


          <div
            dir="ltr"
            className="rv-exam-guard-copy rv-exam-guard-copy-nl"
          >
            <h2 className="mt-5 text-xl font-black text-foreground sm:text-2xl">
              Exameninhoud beschermd
            </h2>

            <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
              De vraag is tijdelijk verborgen om de exameninhoud te beschermen. Ga terug naar het examenvenster om verder te gaan.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}