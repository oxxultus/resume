---
title: "Spring Data Redis 1: 캐시 추상화와 RedisTemplate"
date: 2026-06-01 09:00:00 +0900
categories: ["Backend/Spring/Data"]
tags: [Spring, Redis, Cache, RedisTemplate]
summary: "Spring Cache 추상화와 Redis Repository, RedisTemplate의 사용 방식을 정리했습니다."
excerpt: "@Cacheable 기반 고수준 캐시부터 @RedisHash와 RedisTemplate을 활용한 데이터 처리 방식을 비교합니다."
source_url: "https://velog.io/@oxxultus/ㅁㄴ"
---

---

## 1. 스프링 내장 캐시 추상화 어노테이션 (AOP 프록시 기반)

레디스 저수준 코드를 한 줄도 짜지 않고, 서비스 레이어 메서드 상단에 어노테이션을 작성해서 캐싱을 적용합니다.. 내부적으로 스프링 AOP 프록시가 가동되어 데이터를 가로챕니다.

### ① `@Cacheable` (캐시 장부 조회 및 자동 저장)

* **설명:** 메서드 실행 전 레디스 캐시를 먼저 스캔합니다. 데이터가 **있으면 메서드를 실행하지 않고 즉시 캐시 응답**을 밀어주며, 데이터가 **없으면 실제 DB 조회를 수행한 뒤 그 결과를 레디스에 저장**합니다.
* **백엔드 서비스 예시:**

```java
// 결과가 'project_store::7'이라는 키로 레디스에 구워져 다음 요청부터 DB 조인을 원천 차단합니다.
@Cacheable(value = "project_store", key = "#projectId")
public ProjectResponse getProjectDetails(Long projectId) {
    return projectRepository.findById(projectId)
            .map(ProjectResponse::from)
            .orElseThrow(() -> new ProjectNotFoundException("자원이 존재하지 않습니다."));
}

```

### ② `@CachePut` (캐시 장부 무조건 최신화)

* **설명:** 캐시 존재 여부를 따지지 않고 **메서드를 무조건 끝까지 실행한 뒤, 그 최신 결과물을 레디스 캐시 장부에 덮어쓰기(Update)** 합니다. 정보 수정 비즈니스에 필수 결합됩니다.
* **백엔드 서비스 예시:**

```java
// 프로젝트 수정 시 기존 캐시 장부('project_store::7')를 최신 데이터로 리폼하여 정합성을 맞춥니다.
@CachePut(value = "project_store", key = "#projectId")
public ProjectResponse updateProjectInfo(Long projectId, ProjectUpdateDto dto) {
    Project project = projectRepository.findById(projectId).orElseThrow();
    project.update(dto);
    return ProjectResponse.from(project);
}

```

### ③ `@CacheEvict` (캐시 장부 즉시 파괴)

* **설명:** 데이터가 완전히 삭제되었을 때 **레디스에 박혀있던 해당 캐시 데이터를 즉시 소멸(DEL)** 시킵니다. 유령 데이터가 남아 프론트엔드에 가짜 응답을 내리는 보안 사고를 방어합니다.
* **백엔드 서비스 예시:**

```java
// 프로젝트 삭제 즉시 레디스 장부에서도 흔적을 지워 유령 데이터 조회를 차단합니다.
@CacheEvict(value = "project_store", key = "#projectId")
public void deleteProject(Long projectId) {
    projectRepository.deleteById(projectId);
}

```

---

## 2. 고수준 아키텍처 어노테이션 (`@RedisHash` Repository 방식)

자바 객체(DTO) 통째로 레디스의 `Hash` 데이터 구조에 맵핑하여 집어넣고 빼올 때 사용합니다. **JPA 문법만 빌렸을 뿐, 영속성 컨텍스트(1차 캐시, 쓰기 지연, 더티 체킹)가 전혀 구동되지 않으므로 수정 시 수동 `save()`가 필수**입니다.

### ④ `@RedisHash` (레디스 엔티티 선언)

* **설명:** 해당 클래스를 레디스의 **Hash 구조**로 매핑할 엔티티 객체로 선언하고 고유 접두사(Prefix)를 지정합니다.

### ⑤ `@Id` (식별 Key 변환점)

* **설명:** 레디스 엔티티의 고유 식별 필드를 지정합니다. 접두사와 합쳐져 최종 물리 Key(`user_session:토큰값`)를 형성합니다.

### ⑥ `@TimeToLive` (동적 소멸 타임아웃)

* **설명:** 비즈니스 상황에 따라 **만료 시간(TTL)을 초(Seconds) 단위로 동적 제어**할 수 있게 꽂아주는 안전핀입니다. 지정된 시간이 지나면 레디스 메모리에서 자동 예외 소멸됩니다.
* **백엔드 DTO 및 서비스 종합 예시:**

```java
@Getter
@RedisHash(value = "user_session") // Prefix 설정
public class UserSession {
    @Id
    private String token; // user_session:token-abc 형태로 저장됨
    private String username;
    
    @TimeToLive
    private Long ttlSeconds; // 동적 만료 시간 핀
    
    public UserSession(String token, String username, Long ttlSeconds) {
        this.token = token;
        this.username = username;
        this.ttlSeconds = ttlSeconds;
    }
}

// 서비스 레이어 가동 (더티체킹이 없으므로 수동 재저장 필수 가드 증명)
public void upgradeSession(String token) {
    UserSession session = userSessionRepository.findById(token).orElseThrow();
    session.changeName("oxxultus (ADMIN)");
    
    // 수동으로 다시 save()를 때려 소켓을 저장해야 레디스 데이터가 최종 갱신됩니다!
    userSessionRepository.save(session);
}

```

---

## 3. 저수준 아키텍처 메서드 (`RedisTemplate` 공장 직영 방식)

레디스가 제공하는 고성능 5대 원시 데이터 구조 명령어를 자바 코드로 제어하는 기능입니다. **실시간 검색어 순위, 선착순 이벤트 큐, 중복 요청 분산 락(Lock)을 구현할 때의 사용할 수 있는 기능**입니다.

### ⑦ `opsForValue()` ➔ **String 구조 (단일 키-밸류 / 분산 락)**

* **실전 비즈니스:** `template.opsForValue().set("lock_key", "locked", 5, TimeUnit.SECONDS);` ➔ API 중복 요청 차단용 5초짜리 타임아웃 분산 락 가동.

### ⑧ `opsForZSet()` ➔ **Sorted Set 구조 (실시간 가중치 랭킹 리더보드)**

* **실전 비즈니스:** 사용자가 AI 검색 키워드를 입력할 때마다 가중치 점수를 누적 연산하고 상위 등수를 광속 추출합니다.

```java
// 'ai_search_ranking' 이라는 대장부 내의 키워드 점수를 원자적으로 1.0점 가산
redisTemplate.opsForZSet().incrementScore("ai_search_ranking", "React", 1.0);

// 점수가 가장 높은 놈 기준 내림차순으로 0등부터 2등까지 TOP 3 키워드 리스트 전격 수거
Set<String> topKeywords = redisTemplate.opsForZSet().reverseRange("ai_search_ranking", 0, 2);

```

### ⑨ `opsForList()` ➔ **List 구조 (선입선출 MQ / 선착순 대기열)**

* **실전 비즈니스:** 양방향 링크드 리스트 소켓 연산으로 트래픽 대기열 큐를 구성합니다.
* `template.opsForList().rightPush("coupon_queue", "user_uuid_1");` ➔ 대기열 오른쪽 끝에 유저 인입.
* `String user = template.opsForList().leftPop("coupon_queue");` ➔ 왼쪽 끝에서 먼저 온 유저 탈출시키며 장부 소멸.

---

## 4. 정리

| 카테고리 | 핵심 도구 (어노테이션/메서드) | 데이터 인입/추출 타이밍 | 물리적 구동 특징 및 실무 적용 사례 |
| --- | --- | --- | --- |
| 추상화 캐시<br>|<br>(AOP 프록시) | **`@Cacheable`**<br><br>**`@CachePut`**<br><br>**`@CacheEvict`** | 비즈니스 메서드 실행 전후 가로채기 | 레디스 전용 소스코드를 한 줄도 짜지 않고 **메서드 결과물 자체를 초고속 자동 캐싱/파괴**할 때 사용. (DB 조인 부하 차단 전용 요새) |
| 고수준<br><br>(Repository) | **`@RedisHash`**<br><br>**`@Id`**<br><br>**`@TimeToLive`** | `repository.save()` 호출 시 즉시 | 자바 DTO 객체를 레디스 내장 `Hash` 포맷 통째로 구워 보관할 때 사용. **영속성 컨텍스트 캐시 가드가 전혀 없으므로 수정 시 수동 save 필수.** (유저 로그인 세션 토큰 유지 장부) |
| 저수준<br><br>(Template) | **`opsForValue()`**<br><br>**`opsForHash()`**<br><br>**`opsForZSet()`**<br><br>**`opsForList()`** | 코드 라인이 실행되는 그 즉시 톰캣 소켓 | 레디스 고유의 5대 데이터 구조 명령어를 완전히 장악하여 미세 정밀 제어할 때 사용. **수동 설정을 통해 스프링 `@Transactional` 무결성 롤백 범위에 포섭 가능.** (**실시간인기 검색어 랭킹**, 동시성 분산 락 제어) |

---
