---
title: "Spring MVC (4): 주요 어노테이션 정리"
date: 2026-06-02 12:56:46 +0900
categories: [Backend]
tags: [Spring, Spring MVC, REST API, Validation]
summary: "Spring MVC에서 요청 데이터 처리와 검증에 사용하는 주요 어노테이션을 정리했습니다."
excerpt: "@PathVariable, @RequestParam, @RequestBody부터 Validation과 전역 처리까지 REST API 구현에 필요한 어노테이션을 살펴봅니다."
source_url: "https://velog.io/@oxxultus/asd-2az96pzu"
---

## 1. 컨트롤러 선언 및 응답 형식

클라이언트(리액트/Axios)가 요청을 보냈을 때 백엔드가 어떤 형태로 응답을 뱉어줄지 결정하는 최외곽 관문입니다.

* **`@Controller` (전통적인 MVC 웹)**
* **설명:** 메서드가 `String`을 반환하면 뷰 리졸버(`ViewResolver`)가 HTML 파일(Thymeleaf, JSP 등)을 찾아 화면 자체를 브라우저에 렌더링합니다.


* **`@RestController` (Modern REST API)**
* **설명:** `@Controller` + `@ResponseBody`가 결합된 형태입니다.
* **특징:** 객체나 데이터 리스트를 반환하면 스프링 내부의 `HttpMessageConverter`가 작동하여 자바 객체를 **JSON 형태로 구워서 Axios에게 직렬화(Serialization) 응답**을 보냅니다.



---

## 2. 요청 데이터 추출 및 프론트엔드(Axios) 매핑 구조

클라이언트가 데이터를 어떤 형태로 포장해서 쏘느냐에 따라 백엔드 어노테이션이 칼같이 매칭되어 마중 나가야 합니다.

### ① `@PathVariable` (경로 변수 식별자)

* **물리적 위치:** URL 경로(Path)의 한 조각 자체를 변수로 파냅니다.
* **비즈니스 의미:** 특정 자원(Resource)을 **단건 지정하여 식별**할 때 사용합니다. (자원의 주민등록번호 역할)
* **추천 HTTP 메서드:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE` 전체 다 활약
* **Axios & 스프링 조합 예제:**
* *프론트:* `axios.get('/api/v1/projects/7')` / `axios.delete('/api/v1/projects/7')`
* *백엔드:*
```java
@GetMapping("/projects/{projectId}")
public ResponseEntity<ProjectResponse> getProject(@PathVariable("projectId") Long id) {
    return ResponseEntity.ok(response);
}

```





### ② `@RequestParam` (쿼리 파라미터 또는 폼 키-벨류)

* **물리적 위치:** URL 뒤에 매달려 오는 `?key=value` 형태의 데이터, 혹은 HTML `<form>` 바디 데이터입니다.
* **비즈니스 의미:** 목록 조회 시 **필터링, 검색, 페이징, 정렬 조건**을 걸거나 생성/수정 시 제어 옵션(안전핀)을 넘길 때 씁니다.
* **추천 HTTP 메서드:** `GET`(필터링), `POST/PUT/PATCH`(제어 옵션 매개변수 전송)
* **Axios & 스프링 조합 예제:**
* *프론트 (필터링):* `axios.get('/api/v1/projects', { params: { framework: 'react', page: 1 } })`
* *프론트 (POST 제어 플래그):* `axios.post('/api/v1/projects/7/fork?force=true')`
* *백엔드:*
```java
@GetMapping("/projects")
public ResponseEntity<List<ProjectResponse>> getProjects(
        @RequestParam("framework") String fw,
        @RequestParam(value = "page", defaultValue = "0") int page
) {
    return ResponseEntity.ok(list);
}

```





### ③ `@ModelAttribute` (폼 데이터 객체화 바인딩)

* **물리적 위치:** `@RequestParam`으로 들어오는 다량의 쿼리 스트링이나 Form Key-Value 데이터들입니다.
* **비즈니스 의미:** 여러 개의 파라미터를 한 대접에 받아서 **자바 객체(DTO)로 변환**하거나, **파일 업로드를 포함한 전통적인 Form 전송**을 처리할 때 씁니다.
* **동작 원리:** 기본 생성자와 Setter(또는 주입 생성자)를 호출하며 값을 자동 매핑(바인딩)합니다.
* **추천 HTTP 메서드:** `GET`(다중 조건 복잡 검색), `POST`(FormData 기반 이미지/파일 업로드)
* **Axios & 스프링 조합 예제:**
* *프론트 (파일 업로드 FormData):*
```javascript
const formData = new FormData();
formData.append("projectName", "VeloAPI");
formData.append("zipFile", fileObject); // 바이너리 파일
axios.post('/api/v1/projects/upload', formData);

```


* *백엔드:*
```java
@PostMapping("/projects/upload")
public ResponseEntity<String> uploadProject(@ModelAttribute ProjectUploadDto dto) {
    log.info("프로젝트명: {}, 파일명: {}", dto.getProjectName(), dto.getZipFile().getOriginalFilename());
    return ResponseEntity.ok("Success");
}

```





### ④ `@RequestBody` (JSON 본문 객체화 역직렬화)

* **물리적 위치:** HTTP 요청 본문(Body)에 숨겨진 순수 Raw 바이트 스트림 데이터입니다.
* **비즈니스 의미:** 구조화된 객체 형태를 가진 **복잡한 자원을 생성하거나 대형 수정 데이터**를 통째로 넘길 때 씁니다.
* **동작 원리:** 파라미터 장부를 보지 않고, 핸들러 어댑터가 `HttpMessageConverter(Jackson)`를 구동시켜 본문의 JSON 문자열을 자바 객체(DTO)로 변환(**역직렬화, Deserialization**)합니다. (DTO에 `@NoArgsConstructor`와 `@Getter` 필수!)
* **추천 HTTP 메서드:** 오직 Body가 존재하는 `POST`, `PUT`, `PATCH`의 전유물
* **Axios & 스프링 조합 예제:**
* *프론트:* `axios.post('/api/v1/projects', { name: 'Aeranghae', framework: 'react' })` -> `Content-Type: application/json`
* *백엔드:*
```java
@PostMapping("/projects")
public ResponseEntity<Void> createProject(@RequestBody ProjectCreateDto dto) {
    return ResponseEntity.ok().build();
}

```


### ⑤ `@RequestHeader` (HTTP 헤더 값 추출)

* **물리적 위치:** HTTP 요청 패킷의 Header 구역입니다.
* **비즈니스 의미:** 인증 토큰(`Authorization`), 플랫폼 종류(`X-Client-Type`) 등 메타데이터를 콕 집어 낚아챕니다.
* **Axios & 스프링 조합 예제:**
* *프론트:* `axios.get('/api/v1/projects', { headers: { 'X-Velo-Client-Type': 'Desktop-Electron' } })`
* *백엔드:*
```java
@GetMapping("/projects")
public ResponseEntity<Void> checkHeader(@RequestHeader("X-Velo-Client-Type") String clientType) {
    log.info("인입 플랫폼: {}", clientType); // ➔ "Desktop-Electron"
    return ResponseEntity.ok().build();
}

```





### ⑥ `@CookieValue` (HTTP 쿠키 값 추출)

* **물리적 위치:** HTTP 요청 패킷의 Cookie 헤더 구역입니다.
* **비즈니스 의미:** 브라우저 쿠키 저장소에 보안 플래그로 박혀있는 `refreshToken` 등을 수동 파싱 없이 즉시 변수에 바인딩합니다.
* **Axios & 스프링 조합 예제:**
* *프론트:* 쿠키 전송 허용 활성화 `axios.post('/api/auth/refresh', {}, { withCredentials: true })`
* *백엔드:*
```java
@PostMapping("/auth/refresh")
public ResponseEntity<String> rotateToken(@CookieValue(value = "refreshToken", required = false) String refreshToken) {
    return ResponseEntity.ok("New Access Token");
}

```





### ⑦ `@RequestPart` (Multipart 파일 + JSON 독립 격리 분리 수신)

* **물리적 위치:** HTTP Body (`multipart/form-data`) 내부의 독립된 개별 파트 구역입니다.
* **비즈니스 의미:** REST API 표준 수신 규격으로, **바이너리 파일 구역과 구조화된 JSON 데이터 구역을 완벽하게 분리해서 동시에 수신**할 때 씁니다. (Jackson 역직렬화가 해당 구역에만 따로 가동됨)
* **Axios & 스프링 조합 예제:**
* *프론트:*
```javascript
const formData = new FormData();
formData.append("sourceCodeZip", fileObject); // 파일 파트
formData.append("projectInfo", new Blob([JSON.stringify({ name: "Velo" })], { type: "application/json" })); // JSON 파트
axios.post('/api/v1/projects/index', formData);

```


* *백엔드:*
```java
@PostMapping(value = "/projects/index", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<Void> indexProject(
        @RequestPart("sourceCodeZip") MultipartFile file,
        @RequestPart("projectInfo") ProjectCreateDto dto // JSON 파트만 쏙 빼서 역직렬화!
) {
    return ResponseEntity.ok().build();
}

```



### ⑧ `@MatrixVariable` (세미콜론 기반 다중 파라미터 추출)

* **물리적 위치:** URL 경로(Path) 조각 내부에 세미콜론(`;`)으로 결합된 키-벨류 구역입니다.
* **비즈니스 의미:** URI 경로 안에 복잡한 매트릭스 속성을 가두어 파싱할 때 씁니다.
* **예제 URI 및 백엔드:** `/api/v1/infra/servers;vendor=oxxultus;os=linux/metrics`
```java
@GetMapping("/infra/{infraType}/metrics")
public ResponseEntity<Void> getInfraMetrics(
        @PathVariable String infraType, // ➔ "servers"
        @MatrixVariable String vendor,  // ➔ "oxxultus"
        @MatrixVariable String os       // ➔ "linux"
) { return ResponseEntity.ok().build(); }

```


### ⑨ `@SessionAttribute` (서블릿 세션 정보 참조)

* **물리적 위치:** 서버 내부 메모리 (`HttpSession` 내장 장부)
* **비즈니스 의미:** 로그인 유저 정보 등 서버 세션에 보관 중인 객체를 참조합니다.
* **백엔드 예시:**

```java
@GetMapping("/dashboard")
public String showDashboard(@SessionAttribute(name = "LOGIN_USER", required = false) UserSessionDto loginUser) {
    return "Welcome " + loginUser.getName();
}
```


### ⑩ `@RestControllerAdvice` / `@ControllerAdvice` (전역 처리)

* **설명:** 모든 컨트롤러에서 비즈니스 로직을 수행하다가 터진 예외(Exception)를 전역에서 잡아 일관된 응답으로 전송하는 공통 처리기
* **백엔드 예시:**

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ProjectNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleProjectNotFound(ProjectNotFoundException e) {
        return new ErrorResponse("PROJECT_ERR_001", e.getMessage());
    }
}

```



### ⑪ `@InitBinder` (컨트롤러 데이터 전처리 가드)

* **설명:** 특정 컨트롤러로 데이터가 인입되어 객체에 바인딩되기 직전, 문자열의 공백을 제거(`Trim`)하거나 포맷을 강제 변환하는 세탁기 역할을 수행합니다.
* **백엔드 예시:**
```java
@InitBinder
public void initBinder(WebDataBinder binder) {
    // 클라이언트가 "  react  "라고 파라미터를 보내도 바인딩 직전에 "react"로 공백 강제 자르기
    binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));
}

```



### ⑫ `@CrossOrigin` (CORS 보안 임시 개방)

* **설명:** 시스템 전역 보안 정책 외에, 특정 컨트롤러나 메서드에 한해서만 특정 외부 도메인의 브라우저/리액트 호출 통행증을 개방해 줍니다.특정 컨트롤러나 메서드에만 특정 도메인의 프론트엔드가 접근할 수 있도록 CORS(Cross-Origin Resource Sharing) 방어벽을 부분적으로 허용해 주는 기능입니다.
* **백엔드 예시:**
```java
@RestController
@RequestMapping("/api/v1/public-status")
// SecurityConfig 전역 설정 외에, 이 컨트롤러만 특정 외부 도메인에 접근 허용
@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
public class PublicStatusController {

    @GetMapping
    public String getStatus() { return "UP"; }
}
```

## 3. 데이터 검증(Validation)

### ⑬ `@Valid` (자카르타 표준 검증 스위치)

* **설명:** 자바 표준(Jakarta Bean Validation) 유효성 검증 사양을 활성화합니다. 컨트롤러 메서드의 DTO 매개변수 앞에 지정하며, DTO 내부 필드에 선언된 유효성 검사 규칙(`@NotBlank`, `@Min` 등)을 검증 엔진이 평가하도록 만듭니다. **검증 조건에 위배될 경우 `MethodArgumentNotValidException` 예외가 발생**하며, 전역 관제탑(`@RestControllerAdvice`)으로 수거되어 처리됩니다.
* **백엔드 예시:**

```java
@PostMapping("/projects")
public ResponseEntity<Void> createProject(
        // @Valid를 지정해야 DTO 내부 필드의 유효성 검사가 진행되고 실패 시 예외를 던집니다.
        @Valid @RequestBody ProjectCreateDto dto 
) {
    return ResponseEntity.ok().build();
}

```

---

### ⑭ `@Validated` (스프링 전용 그룹 검증 및 파라미터 검증)

* **설명:** 스프링 프레임워크가 제공하는 확장 검증 기능입니다. 요구사항에 따라 검증 조건을 다르게 그룹화하여 선택 적용해야 할 때(**Group Validation**) 사용하거나, 컨트롤러 클래스 레벨에 선언하여 `@PathVariable`이나 `@RequestParam` 변수 자체에 대한 유효성 검사를 수행할 때 사용합니다. **검증 실패 시 `ConstraintViolationException` 예외가 발생**합니다.
* **백엔드 예시:**

```java
@RestController
@RequestMapping("/api/v1/projects")
@Validated // 클래스 상단에 선언하여 단일 파라미터 직접 검증 및 예외 발생 활성화
public class ProjectController {

    @GetMapping("/{id}")
    public ResponseEntity<Void> getProject(
            // URL 경로 변수 값이 1 미만일 경우 검증 예외가 발생합니다.
            @PathVariable("id") @Min(value = 1, message = "ID는 1 이상이어야 합니다.") Long id
    ) {
        return ResponseEntity.ok().build();
    }
}

```

---

### ⑮ `@NotBlank` (문자열 필수 값 검증 및 예외 처리)

* **설명:** 대상 문자열이 `null`이거나, 빈 문자열(`""`), 혹은 스페이스바 공백(`" "`)으로만 이루어져 있는지 검사합니다. 세 가지 조건 중 하나라도 해당하면 **검증 오류 예외를 발생**시킵니다. 데이터 누락 방지가 필요한 모든 문자열(`String`) 데이터 검증의 표준 규격입니다.
* **백엔드 DTO 예시:**

```java
public class ProjectCreateDto {
    // null, "", " " 인입 시 유효성 검증 예외 발생 및 지정된 에러 메시지 반환
    @NotBlank(message = "프로젝트 명칭은 필수 공정입니다. 공백일 수 없습니다.")
    private String name;
}

```

---

### ⑯ `@NotNull` (참조 객체 및 숫자형 Null 방어)

* **설명:** 대상 데이터의 값이 `null` 상태인지를 검사하여 **`null`일 경우 예외를 발생**시킵니다. 빈 문자열(`""`)이나 공백(`" "`)은 문자열이 아닌 숫자형이나 객체 타입에서 의미가 없으므로, 주로 `Long`, `Integer` 같은 **숫자형 Wrapper 타입이나 내부 참조 DTO 객체의 누락을 방어**할 때 사용합니다.
* **백엔드 DTO 예시:**

```java
public class ProjectCreateDto {
    // primitive 타입(int)이 아닌 Wrapper 타입(Long) 필드가 null로 유입되면 예외를 던집니다.
    @NotNull(message = "소유자 ID 명시는 필수입니다.")
    private Long userId;
}

```

---

### ⑰ `@NotEmpty` (컬렉션 공백 및 크기 검증)

* **설명:** 대상 데이터가 `null` 상태이거나, 요소의 개수가 0인 빈 상태인지를 검사하여 **조건 위배 시 예외를 발생**시킵니다. 문자열의 경우 공백(`" "`)은 정상 통과되므로, 주로 **`List`나 `Map` 같은 컬렉션 구조의 장부가 비어 있는 상태로 들어오는 것을 방어**할 때 사용합니다.
* **백엔드 DTO 예시:**

```java
public class ProjectCreateDto {
    // 최소 한 개 이상의 파일 경로 데이터가 배열로 인입되지 않으면 검증 예외가 발생합니다.
    @NotEmpty(message = "색인 대상 파일 노드 목록이 비어있습니다.")
    private List<String> filePaths;
}

```

---

### ⑱ `@Size` (범위 및 길이 초과 예외 제어) 

* **설명:** 문자열의 길이나 `List` 같은 컬렉션의 요소 개수가 지정된 임계치 범위(`min`, `max`) 내에 존재하는지 검사합니다. 설정된 **길이 한계선을 벗어나면 유효성 검증 예외를 발생**시키며, 이는 데이터베이스 테이블 명세상의 자원 오버플로우를 사전에 차단하는 역할을 합니다.
* **백엔드 DTO 예시:**

```java
public class ProjectCreateDto {
    @NotBlank
    // 2자 미만이거나 30자를 초과하는 문자열 인입 시 예외 발생
    @Size(min = 2, max = 30, message = "설명 문구는 2자 이상 30자 이하로 제한됩니다.")
    private String description;
}

```

---

### ⑲ `@Min` / `@Max` (숫자형 범위 한계선 검증)

* **설명:** 숫자형 데이터(`int`, `long` 등)가 가질 수 있는 최솟값(`min`)과 최댓값(`max`) 범위를 검증합니다. 비즈니스 로직상 허용 범위를 넘어서는 **음수 값이나 비정상적인 대형 수치가 주입될 경우 즉시 예외를 발생**시킵니다.
* **백엔드 DTO 예시:**

```java
public class ProjectCreateDto {
    // 1 미만이거나 100을 초과하는 수치 입력 시 검증 예외 발생
    @Min(value = 1, message = "최소 1명 이상의 개발 팀원이 소속되어야 합니다.")
    @Max(value = 100, message = "한 프로젝트의 최대 팀원은 100명을 초과할 수 없습니다.")
    private int teamSize;
}

```

---

### ⑳ `@Email` (이메일 정규 규격 검사 및 예외 처리)

* **설명:** 대상 문자열 데이터가 표준 이메일 형식(아이디`@`도메인 구역 구조) 조건에 일치하는지 내부 검증 엔진을 통해 검사합니다. 올바르지 않은 **형식 혼동 데이터 인입 시 검증 오류 예외를 발생**시킵니다.
* **백엔드 DTO 예시:**

```java
public class UserJoinDto {
    @NotBlank
    // 이메일 정규식 포맷 미준수 시 유효성 검증 예외 발생
    @Email(message = "알림 수신용 이메일 형식이 올바르지 않습니다.")
    private String notificationEmail;
}

```

---

### ㉑ `@Pattern` (커스텀 정규표현식 일치 검증)

* **설명:** 개발자가 직접 지정한 커스텀 정규표현식(`regexp`) 규칙과 문자열 데이터를 대조하여 검증합니다. 통신 패킷에 담긴 문자열 데이터가 패턴과 **불일치할 경우 즉시 예외를 발생**시키며, 비밀번호 패턴 제약, 전화번호 포맷, 가드 문자열 검증 등에 사용됩니다.
* **백엔드 DTO 예시:**

```java
public class UserJoinDto {
    @NotBlank
    // 대시(-) 정규식 포맷과 불일치하는 가짜 연락처 데이터 인입 시 즉각 예외 발생
    @Pattern(regexp = "^010-\\d{3,4}-\\d{4}$", message = "비상 연락처 형식을 맞춰주세요. (예: 010-1234-5678)")
    private String contactNumber;
}

```

---

## 핸들러 어댑터 타임라인

클라이언트의 요청이 들어오면, 스프링 MVC 내부 관제탑은 한 치의 오차도 없이 아래 순서대로 공정을 가동합니다.

1. 디스패처 서블릿(DispatcherServlet)이 톰캣의 요청 패킷을 낚아챕니다.
2. 핸들러 매핑(HandlerMapping)이 요청 URI를 분석하여 가야 할 목적지 컨트롤러 메서드를 정확히 식별합니다.
3. 전방 가드인 인터셉터(Interceptor)의 `preHandle()`이 켜지며 공통 사전 필터링(인증 등)을 수행합니다.
4. **인터셉터 통과 직후, 핸들러 어댑터(HandlerAdapter)가 실행됩니다.**
5. 핸들러 어댑터는 실제 컨트롤러를 실행하기 직전, 내부의 **`ArgumentResolver`**을 실행 시킵니다.
* `@PathVariable`, `@MatrixVariable`을 보면 URL 경로 레일에서 값을 분리해 옵니다.
* `@RequestParam`, `@RequestHeader`, `@CookieValue`를 보면 톰캣의 파라미터, 헤더, 쿠키 장부에서 값을 매핑합니다.
* `@ModelAttribute`를 보면 DTO 객체를 생성해 Setter나 생성자로 주입을 시킵니다.
* `@RequestBody` 또는 `@RequestPart`를 만나면 `HttpMessageConverter(Jackson)`에게 **"JSON 데이터니까 자바 객체로 구조화(역직렬화)"** 하고 명령


6. 모든 데이터의 정제 및 객체화 작업이 종료되어 끝나서 데이터가 바인딩 되면, 핸들러 어댑터가 마침내 **실제 컨트롤러 메서드를 (Invoke)하며 명령과 완벽한 자바 객체 매개변수들을 함께 전달**합니다.
7. 로직 수행 중 에러가 격발되면 디스패처 서블릿에서 처리기인 `@RestControllerAdvice`가 파편을 수거해 안전한 JSON 응답으로 복구합니다.

---

## 정리

| 프론트엔드 데이터 모양 | Content-Type 헤더 규칙 | Axios 전송 양식 예시 | 백엔드 추천 어노테이션 | 내부 구동 인프라 핵심 무기 |
| --- | --- | --- | --- | --- |
| **`/users/7`** | 없음 (Path 레일) | `axios.get('/users/7')` | **`@PathVariable`** | PathPathVariableResolver |
| **`;vendor=velo;os=linux`** | 없음 (Matrix 레일) | URL 경로 내에 직접 하드코딩 결합 | **`@MatrixVariable`** | MatrixVariableMethodArgumentResolver |
| **`?role=dev`** | 없음 (Query String) | `axios.get('/users', { params: { role: 'dev' } })` | **`@RequestParam`** | RequestParamMethodArgumentResolver |
| **`Headers: { Token }`** | 임의 지정 | `axios.get('/url', { headers: { Key: Val } })` | **`@RequestHeader`** | RequestHeaderMethodArgumentResolver |
| **`Cookies: { Key }`** | 쿠키 자동 탑재 헤더 | `{ withCredentials: true }` 설정 탑재 | **`@CookieValue`** | ServletCookieValueResolver |
| **`name=velo&age=20`** | `application/x-www-form-urlencoded` | Form 태그 전송 또는 FormData 객체 전송 | **`@ModelAttribute`** | ModelAttributeMethodProcessor (Setter 주입) |
| **`{"name":"velo"}`** | **`application/json`** | `axios.post('/users', { name: 'velo' })` | **`@RequestBody`** | **HttpMessageConverter (Jackson 역직렬화 가동)** |
| **`File + JSON 분리`** | **`multipart/form-data`** | FormData 객체 내부 각 파트 명칭 지정 전송 | **`@RequestPart`** | **RequestPartMethodArgumentResolver + Converter** |

---

