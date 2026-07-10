---
title: "Spring MVC 3: Jackson, CORS와 파일 업로드"
date: 2026-06-06 09:00:00 +0900
categories: ["Backend/Spring/MVC"]
tags: [Spring, Spring MVC, Jackson, CORS]
summary: "Spring MVC의 JSON 직렬화, CORS 설정, 파일 업로드와 요청 매개변수 처리를 정리했습니다."
excerpt: "Jackson 어노테이션과 MultipartFile, @RequestParam과 @RequestBody가 요청 처리 과정에서 어떻게 동작하는지 살펴봅니다."
source_url: "https://velog.io/@oxxultus/스프링을-처음부터..-Spring-MVC-3"
---

## 1. 추가 실습 컴포넌트별 핵심 내용 및 코드 요약

### ① JSON 직렬화 제어 (Jackson 라이브러리 활용)

* **목적:** 서버가 자바 객체를 JSON으로 바꿀 때(직렬화), 보안상 민감한 필드를 숨기거나 날짜 포맷을 가독성 있게 제어하기 위함.
* **핵심 동작:** 디스패처 서블릿 단계에서 `HttpMessageConverter(Jackson)`가 객체를 읽을 때 어노테이션 규칙을 적용합니다.
* **핵심 코드 (`UserResponse.java`):**
```java
@JsonIgnore // 클라이언트 응답 JSON에서 이 필드를 완전히 제외(숨김)
private String password;

@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") // 날짜 객체를 예쁜 문자열 포맷으로 변환
private LocalDateTime createdAt;

```



### ② CORS (Cross-Origin Resource Sharing) 설정

* **목적:** 프론트엔드(`localhost:3000`)와 백엔드(`localhost:8080`)의 포트 주소가 달라 브라우저가 요청을 차단하는 보안 문제를 해결하기 위함.
* **핵심 동작:** 디스패처 서블릿이 프론트엔드의 탐색용 요청(Preflight)을 받아 허용 헤더를 주입합니다.
* **핵심 코드 (`WebConfig.java`):**
```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE");
}

```



### ③ 파일 업로드 (MultipartResolver)

* **목적:** 클라이언트가 보낸 바이너리 파일 데이터(`multipart/form-data`)를 서버에서 안전하게 수신하고 저장하기 위함.
* **핵심 동작:** 디스패처 서블릿이 내부의 `MultipartResolver`를 가동하여 바이너리 데이터를 자바의 `MultipartFile` 객체로 변환해 줍니다.
* **핵심 코드 (`UserController.java`):**
```java
@PostMapping("/api/upload")
public String uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
    String originalFilename = file.getOriginalFilename();
    file.transferTo(new File("/Users/oxxultus/develope/upload/" + originalFilename));
    return "업로드 완료";
}

```



---

## 2. @RequestParam vs @RequestBody 작동 원리 비교

두 어노테이션 모두 실행 타이밍은 "인터셉터 문이 열린 후, 핸들러 어댑터가 실제 컨트롤러 메서드를 깨우기 바로 직전"으로 완벽히 동일합니다. 하지만 내부에서 사용하는 도구와 성격이 다릅니다.

| 구분 | `@RequestParam` | `@RequestBody` |
| --- | --- | --- |
| **주요 대상** | URL 쿼리 스트링 (`?id=oxxultus`) 또는 Form 데이터 | HTTP 바디에 실려오는 **JSON 텍스트** |
| **내부 구동 도구** | `RequestParamMethodArgumentResolver` | `RequestResponseBodyMethodProcessor` |
| **메시지 컨버터 사용 여부** | **사용 안 함 ❌** <br>톰캣의 `HttpServletRequest.getParameter()`를 활용해 값을 곧바로 추출 | **사용함 ⭕**<br>`HttpMessageConverter(Jackson)`를 거쳐 무거운 역직렬화 연산 수행 |
| **특징** | 필요한 Key 값만 쏙쏙 뽑아오며, 자바의 기본 타입(int, String 등)으로 자동 형변환(Type Conversion)까지 지원 | JSON 전체 구조를 자바의 하나의 거대한 DTO 객체로 통째로 변환 |

---

## 톰캣부터 컨트롤러까지의 시퀀스

```text
[ 클라이언트의 HTTP 요청 전송 (텍스트 또는 파일 패킷) ]
       │
       ▼
======================= [ 톰캣 (Tomcat) / 서블릿 컨테이너 구역 ] =======================
0. HttpServletRequest / Response 객체 생성 (바이너리/텍스트 데이터 포함)
       │
       ▼
0-1. [ 서블릿 필터 검문 (Filter) ] -> 거대한 보안/인코딩 인프라 검사
       │
       ▼
======================= [ 스프링 (Spring) / IoC 컨테이너 구역 ] =======================
       │
       ▼ [ 디스패처 서블릿 (DispatcherServlet) 입장 ]
       │
1. 핸들러 매핑 조회 -> URL을 처리할 컨트롤러 빈 매칭
2. 핸들러 어댑터 조회 -> 해당 컨트롤러를 실행할 비서(어댑터) 대기
       │
       ▼
3. [ 인터셉터 검문 (Interceptor .preHandle()) ]
   "어댑터에게 실행 명령을 내리기 바로 직전 가로챔 false 반환 시 이후 과정 모두 가동 안 함"
       │
       └─── [ 인터셉터 true 반환 시 (통과) ]
               │
               ▼
4. 핸들러 어댑터에 실행 명령 하달 (.handle() 호출)
   "컨트롤러를 깨우기 위해 매개변수(Parameter)에 바칠 선물 상자들을 준비하자!"
               │
               ├─ case A: 메서드에 @RequestBody가 있는 경우
               │  - HttpMessageConverter(Jackson)를 깨워 JSON 텍스트를 DTO 객체로 역직렬화
               │  - 직후 @Valid 가 있다면 데이터 제약 조건 검증 실행 (실패 시 @RestControllerAdvice로 역류)
               │
               └─ case B: 메서드에 @RequestParam이 있는 경우
                  - 메시지 컨버터 없이, 톰캣의 Request 객체에서 getParameter()로 값 추출
                  - 변수 타입에 맞게 데이터 형변환(Type Conversion) 처리
               │
               ▼
5. [ 실제 컨트롤러 빈 실행 (UserController) ]
   "핸들러 어댑터가 완벽하게 준비해 준 매개변수들을 주입받으며 비즈니스 로직 가동"
               │
               ▼
6. 컨트롤러 응답 반환 및 Jackson 직렬화 제어
   "컨트롤러가 반환한 응답 DTO를 나가는 HttpMessageConverter가 JSON으로 변환할 때,"
   "@JsonIgnore가 붙은 필드는 숨기고, @JsonFormat이 붙은 날짜는 지정된 포맷 문자열로 직렬화하여 채움"
               │
               ▼
======================= [ 톰캣 구역 반환 및 패킷 최종 조립 후 발송 ] =======================

```

---

### 마치며

이로써 요청을 받아들이는 앞단(**필터, 인터셉터**), 데이터를 가공하고 검증하는 중간 비서(**핸들러 어댑터, ArgumentResolver, @Valid**), 그리고 나가는 문을 제어하는 뒷단(**Jackson 직렬화, 예외 처리기**)까지 스프링 웹 구조를 조금 알게되었다.
