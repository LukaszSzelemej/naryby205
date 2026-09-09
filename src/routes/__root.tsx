import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SplashOverlay } from "@/components/Splash";
import appCss from "../styles.css?url";

const APP_NAME = "Atlas wędkarski";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Łowiska województw zachodniopomorskiego i lubuskiego. Mapa, zezwolenia, dziennik i niezbędnik wędkarza.",
      },
      { name: "theme-color", content: "#080c10" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=139" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png?v=139" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=139" },
      { rel: "preload", href: "/brand/logo-karp-circle.png", as: "image" },
      { rel: "preload", href: "/brand/fish-pin.png?v=origami", as: "image" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
    ],
  }),
  component: () => (
    <html lang="pl" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <SplashOverlay />
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
