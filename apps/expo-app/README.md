# Clakete — Expo (front mock)

Mesmo fluxo do app SwiftUI, em **Expo / React Native** — dá pra testar **no Windows** (web ou Expo Go no Android).

Sem glass UI: fundo sólido `#09090B` + accent `#FF0048`.

## Como testar (Windows)

### Opção A — navegador (mais fácil)

```bash
cd apps/expo-app
npm install
npm run web
```

Abre o browser (Expo Web). Não precisa de celular.

### Opção B — celular Android (Expo Go)

1. Instale **Expo Go** na Play Store  
2. No PC:

```bash
cd apps/expo-app
npm start
```

3. Mesma Wi‑Fi do PC → escaneia o QR code no terminal  
   (ou `npm run android` se tiver emulador)

### Opção C — iPhone com Expo Go

Dá pra instalar Expo Go na App Store e escanear o QR **se** o projeto for compatível com a versão do Expo Go do telefone. Build nativo iOS (ipa) ainda precisa de Mac/EAS — mas o **Expo Go** cobre o mock UI.

## Fluxo no app

1. Onboarding → Continuar → nome/região/idioma  
2. Home feed · Discover · Lists · Profile · Search  
3. Toque num poster → detalhe · log/like (só UI)  
4. Perfil → idioma · Shining mock · Sair  

## Pastas

```
src/
  theme.ts
  i18n.ts
  session.tsx
  data/mock.ts
  components/
  screens/
  navigation/
```

Backend (Supabase / API Next) = próximo passo. O Swift em `apps/ios` fica como referência nativa.
