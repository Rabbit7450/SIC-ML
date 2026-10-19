# Dashboard unificado

Índice Elasticsearch: `sicml-events`

En Kibana (FASE 5):

1. Data view `sicml-*`
2. Lens: recuento por `module` y `severity`
3. Timeline por `@timestamp`
4. Tabla de `attack_type`

Alertas: ElastAlert2 o reglas de Kibana sobre `severity: critica`. Wazuh queda como opción de extensión.
