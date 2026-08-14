# Egern Rules

Personal Egern rule sets.

## Gemini

Raw rule-set URL:

```text
https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini.yaml
```

Egern configuration example:

```yaml
rules:
  - rule_set:
      match: "https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini.yaml"
      policy: Proxy
      update_interval: 86400
```

## Loon

Remote rule URL:

```text
https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini-Loon.list
```

Loon configuration example:

```ini
[Rule]
RULE-SET,https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini-Loon.list,Proxy
```

## WhatsApp for Loon

Remote rule URL:

```text
https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp-Loon.list
```

Loon configuration example:

```ini
[Rule]
RULE-SET,https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp-Loon.list,Proxy
```

## WhatsApp for Egern

Remote rule URL:

```text
https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp.yaml
```

Egern configuration example:

```yaml
rules:
  - rule_set:
      match: "https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp.yaml"
      policy: Proxy
      update_interval: 86400
```
