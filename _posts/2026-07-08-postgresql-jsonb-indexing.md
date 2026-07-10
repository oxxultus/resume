---
title: "PostgreSQL JSONB 인덱스를 비교하며 배운 점"
date: 2026-07-08 09:00:00 +0900
categories: [Database]
tags: [PostgreSQL, JSONB, Index]
summary: "인덱스는 쿼리 형태와 데이터 분포를 확인한 뒤 선택해야 합니다."
excerpt: "JSONB 컬럼을 조회할 때 GIN 인덱스가 어떤 조건에서 효과적인지 실행 계획을 기준으로 정리했습니다."
---

## 문제 상황

유연한 속성을 JSONB로 저장한 뒤 포함 연산자 조회가 늘면서 전체 스캔 비용이 커졌습니다.

## 실행 계획 비교

실제 쿼리에 `EXPLAIN ANALYZE`를 적용해 인덱스 전후의 실행 계획과 읽은 행 수를 비교합니다.

```sql
CREATE INDEX idx_product_attributes
ON product USING GIN (attributes jsonb_path_ops);

EXPLAIN ANALYZE
SELECT * FROM product
WHERE attributes @> '{"color": "purple"}';
```

### 확인한 기준

- 자주 사용하는 연산자가 무엇인지
- 쓰기 비용 증가를 감수할 만큼 조회 빈도가 높은지
- 선택도가 낮아 인덱스 효과가 줄어들지 않는지

## 결론

GIN 인덱스 자체보다 서비스에서 실제로 사용하는 쿼리와 운영 데이터로 검증하는 과정이 더 중요했습니다.
