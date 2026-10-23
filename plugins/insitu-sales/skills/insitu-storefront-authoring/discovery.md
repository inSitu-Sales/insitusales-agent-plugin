# Discover the connected contract

## Entry points

| Need                                | Authoritative starting point                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Administrator tools                 | The authenticated inSitu MCP connection's tool list, descriptions, and input schemas                         |
| Production buyer GraphQL            | https://api.insitusales.com/api/v1/b2b-ecommerce/graphql                                                     |
| Default editable source             | https://storage.googleapis.com/insitusalesfront-skin-templates/templates/default/source.tar.gz               |
| Runtime, transport, and composition | The downloaded template's README, configuration examples, package scripts, shared client, and tests          |
| Publication transport               | Bundled `scripts/upload-storefront.js`; invoke through Node.js and read its usage before preparing a release |

For an explicitly selected staging or local environment, obtain its endpoint from the operator; do not derive it from a company hostname or silently switch to production. The MCP address is not the buyer GraphQL endpoint. Never forward administrator OAuth credentials to buyer commerce.

## Follow the schema, not a frozen operation list

Send a JSON POST containing this introspection query to the selected GraphQL endpoint. Production supports anonymous schema discovery; introspection executes no commerce operations.

```graphql
query DiscoverStorefront {
  __schema {
    queryType {
      name
      fields(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
    }
    mutationType {
      name
      fields(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
    }
  }
}
```

Then use `__type(name: ...)` for the discovered roots and relevant returned/input types. Read field and argument descriptions, `defaultValue`, enum values, and deprecations; follow `type`/`ofType` through list and non-null wrappers to their named types. Inspect nested fields before constructing a selection. Query only what the requested experience needs; new operations are discovered here without updating this guide.

A field in the schema is not permission to call it. Establish public versus buyer authorization and side effects from descriptions and the maintained client. A GraphQL query can persist state; do not run cart reads or mutations as discovery probes. If introspection fails, request the deployed schema or authoritative documentation for that environment, not an obsolete API fallback.

## Company context and settings

`getStorefrontCompany` is an administrative operation, not the public company query. Call it without identity arguments: the backend resolves the current authorized company, including companies with no registered portal. Its default response includes nested contact, links, settings, and supported access defaults along with branding, the registered URL when available, and configuration issues when supported by the connected schema. Use the discovered `_selection` schema to request a smaller result when useful. The public company query remains a separate hostname-based buyer contract. Neither registration nor authoring context proves that a release is published.

Returned settings are a supported projection, not the raw company configuration or a complete feature matrix. Missing fields in a response are not false settings. Other effective behavior appears in the relevant catalog, account, or checkout contracts and server responses. Do not reconstruct hidden settings or enforce legacy settings locally. Company context is neither buyer access nor proof of administrator publication authority.

An absent portal or alias can return null `hostname`, `alias`, and `storefrontUrl` with actionable configuration issues. Use the company data for authoring without inventing a buyer hostname. Currency may also be null with an issue. A public hostname-based query is appropriate only after registration exists; it is not a fallback for failed administrator discovery. Domain registration and publication are separate authorized operations, never side effects of reading company context. Preserve precise service error messages and stable error codes when reporting failures; a connection failure and an account-status rejection need different troubleshooting.
