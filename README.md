
# promo-flag-service

```text
promo-flag-service/
├── .github/
│   └── workflows/
│       └── ci.yml
├── terraform/
│   ├── main.tf
│   └── variables.tf
├── scripts/
│   ├── dev.sh
│   └── seed.ts
├── config/
│   ├── default.ts
│   ├── development.ts
│   └── production.ts
├── src/
│   ├── domain/
│   │   ├── types.ts
│   │   └── evaluator.ts
│   ├── graphql/
│   │   ├── schema.graphql
│   │   └── resolvers.ts
│   ├── infra/
│   │   ├── db.ts
│   │   ├── pubsub.ts
│   │   └── metrics.ts
│   ├── shared/
│   │   ├── logger.ts
│   │   └── errors.ts
│   ├── app.ts
│   └── index.ts
├── tests/
│   ├── evaluator.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
└── README.md
```
