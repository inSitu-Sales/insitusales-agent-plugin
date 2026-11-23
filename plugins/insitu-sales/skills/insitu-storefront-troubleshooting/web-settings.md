# Manual B2B settings changes

Use the company's existing inSitu web app and its signed-in administrator account. Labels can vary by language and release. Do not invent a company-specific URL, append an authentication token, or request the user's password. These are administrator routes, not buyer-storefront routes.

| Symptom or setting | Verified web location and control |
| --- | --- |
| `PORTAL_HIDE_SHIPADDRESS` | B2B portal → General, the Hide shipping address control. When selected, addresses are hidden. |
| `PORTAL_DISABLE_NEW_SHIPPING_ADDRESS` | B2B portal → General: the control that prevents users from entering new shipping addresses. This is distinct from hiding saved addresses. |
| `PORTAL_ENABLE_SHIPPING_DATE` | B2B portal → Shipping Info: Allow customers to request a specific delivery date. |
| `PORTAL_BLOCK_NEXT_DAYS_DELIVERY_DATE` | B2B portal → Shipping Info: Block the next X number of days. This numeric control depends on delivery-date selection being enabled. |
| `PORTAL_VALIDATE_CUSTOMER_DELIVERY_TIME` | B2B portal → Shipping Info: the control for validating the customer's delivery time when selecting a delivery date. Customer-specific weekday rules are separate data. |

The verified app-relative routes are `/b2bportal/general` and `/b2bportal/shipping_methods`. Prefer menu navigation in the user's existing web session. These paths are not permission to construct a new hostname or switch accounts.

For other settings, use the description and the available web settings search. If a matching control is not visible, ask the company's administrator to locate the exact setting name in the relevant configuration section. Do not invent a menu path or assume an absent control means the value is off.

State the intended business effect and relevant dependency before suggesting a value. For example, reducing a three-day lead time changes delivery policy; first establish that the company wants to accept earlier deliveries. The agent has no setting-edit operation. After the user saves a change, reread the value through the MCP and verify the original behavior when possible.
