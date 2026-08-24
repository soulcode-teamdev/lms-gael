# Tratamento de sessão expirada (`relogar: true`) — Front-end

Documento para o back-end conferir se o contrato ficou correto.

## Contrato acordado

O front trata como **sessão expirada** **toda** resposta que atenda às duas
condições ao mesmo tempo:

1. Status HTTP **`401 Unauthorized`**
2. Corpo JSON contendo **`{ "relogar": true }`**

Exemplo de resposta esperada do back-end:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "relogar": true,
  "message": "Sua sessão expirou. Faça login novamente."
}
```

- O campo **`relogar: true`** é o gatilho. Sem ele, o 401 é tratado como um
  erro comum (ex.: senha errada no login), **sem** logout/redirect.
- O campo **`message`** é **opcional**. Se enviado, é exibido na tela de login;
  se ausente, o front usa o texto padrão `"Sua sessão expirou. Faça login novamente."`.

## O que o front faz ao detectar `401 + relogar:true`

1. **Limpa o token/sessão** salvos (`user`, `profile`, `token` em `localStorage` e `sessionStorage`).
2. **Guarda a mensagem** para exibir um aviso na tela de login.
3. **Redireciona** para `/login` (a menos que já esteja no login).
4. Protegido contra múltiplos 401 simultâneos (só redireciona uma vez).

## Onde ficou implementado (global, não só na Fase II)

O tratamento é **global**, via interceptors de resposta do axios, aplicado a
todas as instâncias da aplicação:

| Arquivo | Papel |
|---|---|
| `src/shared/api/sessionExpired.ts` | Fonte única: `isSessionExpiredError()` (detecção `401 + relogar:true`) e `handleSessionExpired()` (limpa sessão + redireciona). |
| `src/shared/api/api.ts` | API principal (inclui os endpoints da Fase II `/gael/inscricoes/fase2/*`). |
| `src/shared/api/apiTutor.ts` | API do tutor. |
| `src/shared/api/apiConteudo.ts` | API de conteúdo. |

Trecho central (`sessionExpired.ts`):

```ts
export const isSessionExpiredError = (error: unknown): boolean => {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (response?.status !== 401) return false;
  const data = response?.data as { relogar?: boolean } | undefined;
  return data?.relogar === true;
};
```

Uso em cada interceptor de resposta:

```ts
if (isSessionExpiredError(error)) {
  handleSessionExpired(error?.response?.data?.message);
}
return Promise.reject(error);
```

## Pontos de atenção para o back-end

- Enviar `relogar: true` **apenas** quando a sessão realmente expirou/foi
  invalidada (token expirado, revogado, logout no servidor, troca de senha).
- **Não** enviar `relogar: true` em 401 de credenciais inválidas no login,
  senão o usuário será redirecionado em loop.
- O corpo precisa ser **JSON** (para o front ler `response.data.relogar`).
- `message` é opcional, mas recomendado para um aviso mais claro ao usuário.

## Como testar rapidamente

Fazer qualquer endpoint autenticado responder:

```
401 + { "relogar": true, "message": "..." }
```

Esperado no front: token limpo → redirect para `/login` → aviso exibido na tela de login.
