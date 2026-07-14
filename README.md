# ReadyRoad Front-End

ReadyRoad contains two independent client applications:

- `web_app`: Next.js web application.
- `mobile_app`: Flutter mobile application.

## Run The Web App

```powershell
cd web_app
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Web Checks

Run these commands from `web_app`:

```powershell
npm test -- --runInBand
npx tsc --noEmit
npm run lint
npm run build
npx playwright test
```

The web application expects the ReadyRoad backend API configuration described in `web_app/.env.example`.
