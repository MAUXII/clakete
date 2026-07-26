# Clakete iOS (front only)

App **SwiftUI** com UI mock (sem Supabase / API ainda). Estrutura no estilo Plotwist: Views + Services, sem ViewModels.

```
apps/ios/Clakete/
├── project.yml              # XcodeGen
├── generate-xcodeproj.sh
├── README.md                # este arquivo
└── Clakete/                 # sources
    ├── ClaketeApp.swift
    ├── App/RootView.swift
    ├── Theme/
    ├── Localization/
    ├── Services/SessionStore.swift
    ├── Models/MockModels.swift
    ├── Components/
    └── Views/               # Auth, Onboarding, Home, Catalog, Details, Lists, Profile, Search, Paywall
```

## Como testar

### Mac cloud (sem Mac próprio) — caminho recomendado

Serve pra rodar o Simulator e, depois, TestFlight. Exemplos: [MacinCloud](https://www.macincloud.com/), [MacStadium](https://www.macstadium.com/), AWS EC2 Mac.

#### 1) Escolher o plano
- Prefira **pay-as-you-go / hourly** (não mensal) na primeira vez
- Máquina com **Xcode já instalado** (plano “Xcode server” / similar) economiza tempo
- Precisa: desktop remoto (RDP/VNC) ou browser do próprio serviço

#### 2) Entrar no Mac remoto
1. Crie a conta no site → escolha servidor → **Connect**
2. Login com o user/senha que eles mandam
3. Abra o **Terminal**

#### 3) Pegar o código
Se o repo estiver no GitHub:

```bash
cd ~
git clone https://github.com/SEU_USER/clakete.git
cd clakete/apps/ios/Clakete
```

(Se ainda não subiu o `apps/ios`, faça `git push` do Windows antes.)

Sem GitHub: zipa a pasta `apps/ios/Clakete` no Windows, sobe pro Drive/Dropbox, baixa no Mac cloud.

#### 4) Ferramentas
```bash
# Homebrew (se não tiver)
 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install xcodegen
```

Abra o **Xcode** uma vez → aceite a license → deixe instalar componentes.

#### 5) Gerar projeto e rodar
```bash
cd ~/clakete/apps/ios/Clakete   # ajuste o path
chmod +x generate-xcodeproj.sh
./generate-xcodeproj.sh
```

No Xcode:
1. Em cima: destino **iPhone 16** (ou qualquer Simulator)
2. **⌘R** (Product → Run)
3. Espera o Simulator abrir o Clakete

#### 6) Economia
- Pare / desconecte o servidor quando parar — cobrança é por hora ligada
- Não precisa deixar ligado pra “pensar” no código: edita no Windows, sobe git, liga Mac só pra ⌘R

#### 7) (Opcional) TestFlight no seu iPhone
1. Conta [Apple Developer](https://developer.apple.com/) (US$99/ano)
2. No Xcode: Signing → seu Team
3. Product → Archive → Distribute → App Store Connect → TestFlight
4. No iPhone: app **TestFlight** → instala o build

Mais detalhes genéricos abaixo (XcodeGen / projeto manual).

### Importante (Windows)

Neste PC dá para **editar** o código; para **rodar** o app SwiftUI:

1. **Mac cloud** (acima), ou Mac físico emprestado
2. (Futuro) Expo — outro stack, se quiser testar sem Mac no dia a dia

### No Mac (passo a passo)

1. Instale **Xcode 15+** (App Store) e abra uma vez pra aceitar a license.
2. (Recomendado) Instale [XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
brew install xcodegen
```

3. Gere o projeto e abra:

```bash
cd apps/ios/Clakete
chmod +x generate-xcodeproj.sh
./generate-xcodeproj.sh
```

Ou manualmente:

```bash
cd apps/ios/Clakete
xcodegen generate
open Clakete.xcodeproj
```

4. No Xcode: escolha um **Simulator** (ex.: iPhone 16) → ⌘R (Run).

### Alternativa sem XcodeGen

1. Xcode → **File → New → Project → iOS App** (SwiftUI, Swift).
2. Product Name: `Clakete`, bundle `app.clakete.ios`, iOS 17+.
3. Apague o `ContentView` gerado.
4. Arraste a pasta `Clakete/` (sources) pro navigator (Copy items se precisar; target Membership: Clakete).
5. Delete o `ClaketeApp` duplicado se o Xcode tiver criado outro.
6. ⌘R.

### Fluxo pra clicar no app (mock)

| Tela | O que fazer |
|------|-------------|
| Onboarding | Continuar → nome/região/idioma → Continuar (entra como guest) |
| Login | E-mail qualquer + Entrar, **ou** “Continuar como convidado” |
| Home | Feed mock + rails Em cartaz / Em breve |
| Discover | Filmes / Séries (grid TMDB imagens) |
| Busca | Digite `Clube`, `Batman`, `Nolan`… |
| Detalhe | Toque num poster → log / like / watchlist (só UI) |
| Listas | Suas / Públicas |
| Perfil | Trocar idioma (pt/en/es), Paywall Shining mock, Sair |

Reset do estado mock (volta pro onboarding):

```bash
# No Simulator: Device → Erase All Content and Settings
# Ou no app: Profile → Sair → (se guest) volta pro login; apague app e reinstale pra limpar UserDefaults
```

### Previews no Xcode

Abra um `*View.swift` → Canvas (⌥⌘↩) → Resume. Alguns need `#Preview` (RootView já tem).

### Próximo passo (backend)

Quando for ligar API: `SessionStore` → Supabase Auth; `MockCatalogService` → `URLSession` nas rotas `/api/movies`, `/api/series`, feed Supabase. Checklist completo: [`docs/ios-todo.md`](../../../docs/ios-todo.md).

---

*Front gerado 15 Jul 2026 — dados locais + posters TMDB públicos.*
