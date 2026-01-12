---
description: "檢查依賴套件安全漏洞"
---

# 安全檢查

請執行以下安全檢查：

## 執行步驟

### 1. 檢查 npm audit

```bash
pnpm audit --audit-level=moderate
```

### 2. 檢查過時套件

```bash
pnpm outdated
```

## 輸出格式

```
# 安全檢查結果

## 漏洞摘要
- Critical: [N]
- High: [N]
- Moderate: [N]

## 過時套件
- 需要更新：[列表]

## 建議操作
- [具體修復指令]
```
