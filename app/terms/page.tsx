import type { Metadata } from "next"
import { LegalDoc, LegalSection } from "@/components/legal/legal-doc"

export const metadata: Metadata = {
  title: "Termos de Serviço · Clakete",
  description: "Regras de uso do Clakete.",
}

export default function TermsPage() {
  return (
    <LegalDoc title="Termos" updatedAt="2 de agosto de 2026">
      <LegalSection title="1. Aceite">
        <p>
          Ao criar uma conta ou usar o Clakete, você concorda com estes Termos.
          Se não concordar, não use o serviço.
        </p>
      </LegalSection>

      <LegalSection title="2. O serviço">
        <p>
          O Clakete é uma plataforma para registrar e compartilhar o que você
          assiste (filmes e séries), com perfil, listas, feed e recursos
          relacionados. Alguns recursos podem exigir assinatura paga.
        </p>
      </LegalSection>

      <LegalSection title="3. Conta">
        <p>
          Você é responsável por manter a segurança da conta e pelas ações
          feitas nela. Informe dados verdadeiros na medida do necessário e não
          compartilhe sua senha. Podemos suspender contas que violem estes
          Termos ou a lei.
        </p>
      </LegalSection>

      <LegalSection title="4. Conteúdo do usuário">
        <p>
          Reviews, listas, posts, imagens de perfil e outros conteúdos que você
          publicar continuam seus. Você nos concede licença para hospedar,
          exibir e distribuir esse conteúdo dentro do Clakete para operar o
          produto. Não publique conteúdo ilegal, ofensivo, spam, ou que viole
          direitos de terceiros.
        </p>
      </LegalSection>

      <LegalSection title="5. Conduta">
        <p>É proibido, entre outras coisas:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>assediar, ameaçar ou discriminar outros usuários;</li>
          <li>tentar invadir, scrapear abusivamente ou quebrar o serviço;</li>
          <li>usar o Clakete para fraude, phishing ou atividade ilegal;</li>
          <li>passar-se por outra pessoa ou marca.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Assinaturas">
        <p>
          Planos pagos são cobrados conforme a oferta exibida no momento da
          compra. Renovações, cancelamentos e reembolsos seguem as regras do
          provedor de pagamento e a política apresentada no fluxo de assinatura.
        </p>
      </LegalSection>

      <LegalSection title="7. Propriedade do Clakete">
        <p>
          Marca, interface, código e materiais do Clakete pertencem a nós ou a
          licenciadores. Dados de filmes/séries podem vir de fontes terceiras
          (ex.: TMDB) e permanecem sujeitos aos termos desses provedores.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidade">
        <p>
          Buscamos manter o serviço estável, mas não garantimos disponibilidade
          ininterrupta. Podemos alterar, suspender ou encerrar recursos com
          aviso razoável quando possível.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitação">
        <p>
          Na extensão permitida pela lei, o Clakete é oferecido “como está”, sem
          garantias implícitas, e não respondemos por danos indiretos decorrentes
          do uso do serviço.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações">
        <p>
          Podemos atualizar estes Termos. Mudanças relevantes serão indicadas
          pela data no topo desta página. O uso contínuo após a atualização
          significa aceite da nova versão.
        </p>
      </LegalSection>

      <LegalSection title="11. Contato">
        <p>
          Dúvidas sobre estes Termos: use o e-mail de suporte do Clakete ou os
          canais oficiais do produto.
        </p>
      </LegalSection>
    </LegalDoc>
  )
}
