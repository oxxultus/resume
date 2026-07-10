---
title: "Spring Data JPA (3): 엔티티 매핑 어노테이션"
date: 2026-06-05 21:29:31 +0900
categories: [Backend]
tags: [Spring, JPA, Entity, Mapping]
summary: "JPA 엔티티와 테이블, 기본키, 연관관계를 매핑하는 주요 어노테이션을 정리했습니다."
excerpt: "@Entity와 @Id부터 연관관계, 임베디드 타입과 JSON 컬럼까지 엔티티 설계에 필요한 매핑 규칙을 살펴봅니다."
source_url: "https://velog.io/@oxxultus/스프링을-처음부터..-Spring-Data-JPA-3"
---

---

## 1. 엔티티 정의 및 테이블 매핑 어노테이션

클래스를 데이터베이스 테이블과 매칭하고 기본 구조를 설계할 때 선언하는 어노테이션입니다.

### ① `@Entity`

* **설명:** 해당 클래스가 데이터베이스 테이블과 매핑될 영속성 목적의 **JPA 엔티티 객체**임을 선언합니다. 이 어노테이션이 붙은 클래스는 JPA가 데이터베이스 장부와 대조하며 관리하게 됩니다.
* **백엔드 예시:**

```java
@Entity // JPA 엔티티로 등록하여 테이블 매핑 대상으로 지정합니다.
public class Project {
    // 필드 및 메서드 정의
}

```

---

### ② `@Table`

* **설명:** 엔티티 클래스가 데이터베이스의 정확히 어떤 테이블 명칭과 매핑될지 명시합니다. 생략할 경우 클래스의 이름이 카멜 케이스 규칙에 따라 테이블명으로 자동 변환되지만, 실무에서는 **테이블명 오인 방지 및 고유 제약조건(Unique Constraint)** 설정을 위해 명시적으로 지정합니다.
* **백엔드 예시:**

```java
@Entity
@Table(name = "project", uniqueConstraints = {
    // 특정 컬럼 조합에 고유 제약조건을 걸어 중복 데이터 인입 시 예외가 발생하도록 가드를 칩니다.
    @UniqueConstraint(name = "uk_project_uuid", columnNames = {"project_uuid"})
})
public class Project {
    // ...
}

```

---

## 2. 기본키(Primary Key) 지정 및 생성 전략

테이블의 가장 중요한 식별자인 PK(기본키)를 지정하고, 이 값이 어떻게 발급될지 결정하는 구역입니다.

### ③ `@Id`

* **설명:** 엔티티 클래스의 특정 필드가 테이블의 **기본키(Primary Key)** 역할을 수행함을 선언합니다. 모든 JPA 엔티티는 이 식별자 필드를 필수로 가지고 있어야 영속성 컨텍스트 내에서 관리될 수 있습니다.

### ④ `@GeneratedValue`

* **설명:** 기본키 값을 개발자가 직접 할당하지 않고, **데이터베이스 엔진이나 JPA 시스템이 자동으로 생성**하도록 위임하는 전략을 설정합니다.
* **주요 전략 유형:**
* `GenerationType.IDENTITY`: MySQL, PostgreSQL 등에서 사용하는 방식으로, 데이터베이스의 `AUTO_INCREMENT`나 기본 넘버링 장부에 생성을 위임합니다.
* `GenerationType.SEQUENCE`: 오라클이나 PostgreSQL의 고성능 `SEQUENCE` 객체를 사용하여 값을 가동합니다.


* **백엔드 예시:**

```java
public class Project {
    @Id
    // 데이터베이스 IDENTITY 가동을 통해 로우가 추가될 때 숫자가 자동 순차 증가하도록 처리합니다.
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}

```

---

## 3. 필드 및 컬럼 상세 제어 어노테이션

자바의 필드 변수가 데이터베이스 테이블의 컬럼 속성(길이, Null 여부, 타입 등)과 어떻게 매칭될지 정밀 제어합니다.

### ⑤ `@Column`

* **설명:** 자바 필드를 테이블의 특정 컬럼과 일치시킵니다. 데이터의 길이 제한(`length`), 필수 값 여부(`nullable`), 컬럼명 변경(`name`) 등의 상세한 DB 스펙 제어를 담당하며, 규칙에 위배된 값이 채워질 경우 데이터베이스 레이어 진입 전후로 예외가 발생합니다.
* **백엔드 예시:**

```java
public class Project {
    // 컬럼명 강제 지정, 길이 50자 제한, 데이터 누락(null) 시 예외 발생 조건 가드
    @Column(name = "project_name", length = 50, nullable = false)
    private String name;
}

```

---

### ⑥ `@Enumerated`

* **설명:** 자바의 상수가 모여있는 **`Enum` 타입을 테이블 컬럼에 저장**할 때 씁니다. 기본값인 `EnumType.ORDINAL`을 쓰면 Enum의 순서 숫자(0, 1, 2)가 저장되어 상수가 중간에 추가될 때 장부가 완전히 합선되므로, 실무에서는 **무조건 `EnumType.STRING`을 사용하여 상수의 문자열 이름 자체를 저장**해야 합니다.
* **백엔드 예시:**

```java
public class Project {
    // Enum 상수의 영문 이름(예: "RUNNING", "SUCCESS") 자체를 DB에 문자열로 안전하게 기록합니다.
    @Enumerated(EnumType.STRING)
    @Column(name = "project_status", nullable = false)
    private ProjectStatus status; 
}

```

---

### ⑦ `@Lob`

* **설명:** 일반적인 문자열 길이 한계선(`VARCHAR`)을 넘어서는 대용량 텍스트(예: 장문의 소스코드, 로그 파일 등 CLOB)나 바이너리 데이터(이미지, 파일 등 BLOB)를 데이터베이스에 밀어 넣을 때 사용합니다.
* **백엔드 예시:**

```java
public class Project {
    @Lob
    @Column(name = "source_code_content")
    private String sourceCode; // 매우 긴 텍스트 데이터 보관 시 용량 한계 에러를 예방합니다.
}

```

---

## 4. 연관관계 매핑 어노테이션 (테이블 조인 가드)

객체의 참조 관계와 관계형 데이터베이스의 외래키(Foreign Key) 조인 구조를 일치시키는 가장 중요한 핵심 구역입니다. JPA가 백그라운드에서 쿼리를 난사하는 **N+1 지뢰**를 피하기 위해 정밀한 Fetch 전략 설정이 필수적입니다.

### ⑧ `@ManyToOne` (다대일 관계 지지대)

* **설명:** 다른 엔티티와 **N : 1(다대일)** 관계임을 증명합니다. (예: 여러 개의 프로젝트는 한 명의 유저에게 소속됨). 실무에서는 자식 테이블 연관 쿼리가 폭탄처럼 터지는 것을 방지하기 위해 **무조건 지연 로딩(`FetchType.LAZY`) 전략을 명시**해야 합니다.
* **백엔드 예시:**

```java
public class Project {
    // 지연 로딩 전략을 심어두어, project.getUser()를 호출해 참조하기 전까지 무의미한 조인 쿼리 발생을 예방합니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_project_user"))
    private User user;
}

```

---

### ⑨ `@OneToMany` (일대다 역방향 참조 관계)

* **설명:** 다른 엔티티와 **1 : N(일대다)** 참조 관계임을 증명합니다. 주로 연관관계의 주인이 아닌 반대편에서 양방향 매핑을 열어둘 때 사용하며, 외래키가 생성되지 않도록 반드시 `mappedBy` 속성으로 주인의 필드명을 선언해 주어야 장부가 꼬이지 않습니다.
* **백엔드 예시:**

```java
public class User {
    // 주인이 아닌 거울일 뿐이므로 mappedBy로 선언하고, 유저 삭제 시 자식 프로젝트도 동반 예외 없이 
    // 함께 삭제되도록 영속성 전이(CascadeType.REMOVE) 및 고아 객체 제거(orphanRemoval) 가드를 칩니다.
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Project> projects = new ArrayList<>();
}

```

---

## 5. 최신 영속 사양: 단일 테이블 내장형 및 고성능 JSON 컬럼

엔티티 내부의 복잡한 컬럼 구조를 효율적으로 격리하거나, 고성능 컬럼으로 결합하는 최신 기술 명세입니다.

### ⑩ `@Embedded` / `@Embeddable` (값 객체 단일 결합)

* **설명:** 여러 필드가 모여 하나의 의미를 가지는 공통 덩어리를 분리하여 자바 객체로 재사용하면서도, 데이터베이스 테이블 상에서는 **별도 테이블 분리 없이 단일 테이블 내에 컬럼으로 이쁘게 펼쳐서 보관**할 때 씁니다.
* **백엔드 예시:**

```java
@Embeddable // 1. 공통으로 묶일 값 객체 대장에 선언합니다.
public class StorageMeta {
    private long totalSize;
    private int fileCount;
}

@Entity
public class Project {
    @Embedded // 2. 엔티티 내부 필드에 내장형 데이터로 결합합니다. 테이블 컬럼에 그대로 박힙니다.
    private StorageMeta storageMeta;
}

```

---

### ⑪ `@JdbcTypeCode(SqlTypes.JSON)` (최신 하이버네이트 JSONB 컬럼 주입)

* **설명:** 자바의 객체 리스트 구조를 PostgreSQL 등의 고성능 **`JSONB` 단일 컬럼 내부로 문자열 압축 영속화**시킬 때 사용합니다. 예전의 복잡한 별도 자식 테이블 조인 연산 없이 단 한 줄의 `UPDATE/SELECT` 단일 로우 처리로 쿼리 병목 예외를 완벽히 소멸시킵니다.
* **백엔드 예시:**

```java
@Entity
public class Project {
    // 복잡한 하위 파일 트리 리스트 구조를 자식 테이블 분리 오버헤드 없이 
    // PostgreSQL 고성능 jsonb 단일 컬럼 구조 내부로 매핑 및 영속화 처리를 마감합니다.
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "file_nodes", columnDefinition = "jsonb")
    private List<ProjectNode> fileNodes = new ArrayList<>();
}

```

---

## 6. 엔티티 데이터 인입 및 라이프사이클 타임라인 요약 대장

스프링 데이터 JPA가 가동될 때 각 데이터베이스 어노테이션들의 상태 변화와 예외 방어 타이밍은 다음과 같습니다.

1. **`EntityManagerFactory` 로딩 시점:** `@Entity`, `@Table`, `@Column` 등의 스펙을 읽어와서 데이터베이스 데이터 명세(스키마 DDL)의 무결성을 점검합니다.
2. **`save()` 메서드 호출 시점 (비영속 ➔ 영속):** `@Id` 필드를 검사하고 `@GeneratedValue` 전략에 맞춰 즉시 번호를 발급(IDENTITY는 DB 인서트 후 발급)하여 영속성 컨텍스트 1차 캐시 장부에 엔티티를 등록합니다.
3. **트랜잭션 커밋 및 `flush()` 시점 (DB 반영):** 엔티티의 필드 값을 최종 스캔합니다.
* `@Column(nullable = false)` 가드를 위반하여 null이 들어있거나 `@Size` 스펙을 초과하면 **데이터 주입 예외를 발생**시키며 쿼리 저장을 중단합니다.
* `@Enumerated(EnumType.STRING)` 규칙에 따라 상수의 이름 텍스트 정보가 문자열로 변환됩니다.
* `@JdbcTypeCode(SqlTypes.JSON)` 규칙에 따라 내부 자바 객체 리스트가 단일 JSON 포맷 문자열로 압축 변환됩니다.

4. **최종 쿼리 저장 시점:** `@ManyToOne(fetch = FetchType.LAZY)` 장부가 걸려있는 객체들은 프록시 가짜 객체로 채워두어 추가 쿼리 지뢰(N+1) 발생을 완전히 소멸시킨 채 가볍게 트랜잭션 마감을 수행합니다.

