# Discover the connected contract

## Entry points

| Need                                | Authoritative starting point                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Administrator tools                 | The authenticated InSitu MCP connection's tool list, descriptions, and input schemas                         |
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

`getStorefrontCompany` maps to the public company query. Read its tool description for the return type, then inspect that type and its nested types through GraphQL. The default MCP selection contains scalar fields only: nested company data can be omitted even when supported. If the discovered tool schema exposes `_selection`, supply an explicit GraphQL selection for the needed public branding, contact, links, and settings.

These settings are an allowlisted public projection, not the raw company configuration or a complete feature matrix. Missing fields in a response are not false settings. Other effective behavior appears in the relevant catalog, account, or checkout contracts and server responses. Do not reconstruct hidden settings or enforce legacy settings locally. Company context is neither buyer access nor proof of administrator publication authority.
