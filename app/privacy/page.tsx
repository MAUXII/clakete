import type { Metadata } from "next"
import { LegalDoc, LegalSection } from "@/components/legal/legal-doc"

export const metadata: Metadata = {
  title: "Política de Privacidade · Clakete",
  description: "Como o Clakete coleta, usa e protege seus dados.",
}

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacidade" updatedAt="2 de agosto de 2026">
      <LegalSection title="1. Quem somos">
        <p>
          O Clakete é um diário social de filmes e séries. Esta política descreve
          quais dados tratamos quando você usa o site e o app.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <p>Podemos tratar:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Conta: e-mail, nome de usuário, nome de exibição e bio.</li>
          <li>
            Perfil: avatar, banner, preferências (idioma, região, tema) e links
            públicos que você adicionar.
          </li>
          <li>
            Atividade: filmes/séries assistidos, notas, reviews, listas,
            watchlist e interações no feed (curtidas, comentários).
          </li>
          <li>
            Login social: se entrar com Google, recebemos identificadores básicos
            autorizados por você (ex.: e-mail e foto de perfil).
          </li>
          <li>
            Técnicos: logs de acesso, tipo de dispositivo/navegador e dados
            necessários para segurança e funcionamento do serviço.
          </li>
          <li>
            Pagamentos: se assinar um plano pago, cobrança e status são
            processados pelo provedor de pagamento (ex.: Stripe). Não armazenamos
            o número completo do cartão.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para que usamos">
        <p>Usamos os dados para:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>criar e manter sua conta;</li>
          <li>mostrar seu perfil e atividade (conforme suas configurações);</li>
          <li>personalizar a experiência (idioma, região, recomendações);</li>
          <li>operar feed, notificações e recursos sociais;</li>
          <li>processar assinaturas e suporte;</li>
          <li>prevenir abuso, fraude e violações dos Termos.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Com quem compartilhamos">
        <p>
          Não vendemos seus dados. Podemos compartilhar com provedores que nos
          ajudam a operar o Clakete (hospedagem, autenticação, armazenamento,
          analytics básicos e pagamento), apenas o necessário para o serviço.
          Conteúdo público do seu perfil pode ser visto por outros usuários.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies e sessões">
        <p>
          Usamos cookies/armazenamento local para manter você logado, lembrar
          preferências e garantir segurança da sessão.
        </p>
      </LegalSection>

      <LegalSection title="6. Retenção e exclusão">
        <p>
          Mantemos os dados enquanto sua conta existir ou enquanto forem
          necessários para o serviço e obrigações legais. Você pode pedir
          exclusão da conta/dados pelo suporte ou pelos canais indicados no
          produto.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos">
        <p>
          Conforme a legislação aplicável (incluindo a LGPD no Brasil), você
          pode solicitar acesso, correção, portabilidade ou exclusão dos seus
          dados, além de informações sobre o tratamento.
        </p>
      </LegalSection>

      <LegalSection title="8. Contato">
        <p>
          Dúvidas sobre privacidade: use o e-mail de suporte do Clakete ou os
          canais oficiais do produto.
        </p>
      </LegalSection>
    </LegalDoc>
  )
}
