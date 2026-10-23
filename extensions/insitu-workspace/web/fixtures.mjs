export const fixtures = {
  "portal": {
    "title": "Storefront studio",
    "hostname": "acme.example.com",
    "mode": "improve",
    "changes": [
      "Simpler product categories",
      "A faster reorder experience",
      "Clear case pricing on mobile"
    ],
    "preview": {
      "companyName": "Acme Wholesale",
      "currency": "USD",
      "categories": [
        "Beverages",
        "Snacks",
        "Pantry"
      ],
      "products": [
        {
          "id": "water",
          "name": "Sparkling Water",
          "pack": "12 × 500 ml",
          "price": 18,
          "category": "Beverages"
        },
        {
          "id": "coffee",
          "name": "Cold Brew",
          "pack": "6 × 12 oz",
          "price": 24,
          "category": "Beverages"
        },
        {
          "id": "tea",
          "name": "Lemon Tea",
          "pack": "12 × 500 ml",
          "price": 16,
          "category": "Beverages"
        },
        {
          "id": "snacks",
          "name": "Sea Salt Crackers",
          "pack": "12 × 100 g",
          "price": 22,
          "category": "Snacks"
        }
      ]
    },
    "source": {
      "label": "Sample data — no live account connected",
      "coverage": "complete",
      "asOf": "Oct 22, 2026"
    }
  }
};
