---
title: "Spring MVC 2: Validation과 전역 예외 처리"
date: 2026-06-07 09:00:00 +0900
categories: ["Backend/Spring/MVC"]
tags: [Spring, Validation, Exception Handling, Interceptor]
summary: "DTO 검증부터 전역 예외 처리, Filter와 Interceptor의 실행 순서를 정리했습니다."
excerpt: "@Valid와 @RestControllerAdvice의 동작 원리, 서블릿 필터와 스프링 인터셉터의 역할을 코드와 함께 살펴봅니다."
source_url: "https://velog.io/@oxxultus/스프링을-처음부터..-Spring-MVC-2"
---

## 1) Validation


### 1. 의존성을 추가

```Groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-validation'
}
```

### 2. 검증할 DTO 코드 작성

```java
package cloud.oxxultus.webmvc.dto;

import jakarta.validation.constraints.*;

public class SignUpRequest {

    @NotBlank(message = "이름은 입력 필수 항목입니다.")
    private String name;

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일은 필수 입력 항목 입니다.")
    private String email;

	// Getter Setter 추가
}

```

#### 설명
검증 어노테이션을 필드 에만 붙히면 됩니다. 스프링의 검증 Validation 기술은 클래스의 필드에 붙은 어노테이션을 기준으로 검사를 수행합니다. 따라서 Getter, Setter 메서드에는 어노테이션을 전부 지워주시는 것이 좋습니다.


### 3. UserController 클래스 작성하기

```java
package cloud.oxxultus.webmvc.controller;


import cloud.oxxultus.webmvc.dto.SignUpRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
public class UserController {

    @PostMapping("/api/signup")
    public String signup(@Valid @RequestBody SignUpRequest request) {

        log.info("컨트롤러 안으로 진입 성공! 이름: {}", request.getName());

        return "회원가입 완료!";
    }
}

```

#### 설명
- `@RestController`: 이 어노테이션이 붙어야 `IoC 컨테이너`가 서버 구동 시점에 해당 클래스를 발견하고 자동을 `new` 해서 `Bean`으로 등록해 줍니다. 동시에 리턴하는 문자열 (`"회원가입 완료!"`)을 HTTP응답 본문에 Body으로 바로 내보내게 해줍니다.
- `@RequestBody`: 클라이언트가 `Json` 형태로 보낸 `HTTP 요청 본문` 데이터를 자바 객체 (`SignUpRequest`)로 변환해서 매개변수에 넣어달라고 **핸들러 어댑터**에게 요청하는 어노테이션입니다.
- `@Valid`: 핸들러 어댑터에게 이 객체 안에 들어있는 `@NotBlank`나 `@Email` 같은 검증 규칙들을 지금 바로 실행해줘 라고 지시하는 스위치 입니다.


### 4. 지금 까지의 실행 과정 요약
클라이언트의 통해 요청이 들어오면 `톰캣`에서 `서블릿 객체(중략Response, 중략Request)`를 만들어서 `디스패처 서블릿`에게 전달해주고 `핸들러 매핑`이 `핸들러 맵`에서 컨트롤러를 찾아서 `디스패처 서블릿`에게 전달해주면 `디스패처 서블릿`은 `핸들러 어뎁터`에게 `서블릿 객체`와 함께 해당 컨트롤러를 실행하라고 명령을 전달하게됩니다. 이후`핸들러 어뎁터`내부에서는 컨트롤러 메서드에 `@RequestBody`를 적어놓으면 `ArgumentResolver` 구현체가 발동하여 전달받은 `서블릿 객체`의 `HttpServletRequest`내의 HTTP바디 텍스트(JSON)를 읽어옵니다. 그리고 `HttpMessageConverter`를 통해 `SignUpRequest` 라는 자바 객체를 `new`해서 값을 채워 넣게 됩니다. 그 다음 `핸들러 어댑터`는 메서드에 붙은 `@Valid` 어노테이션을 확인하고(없으면 넘어감) `SignUpRequest` 객체 필드에 적힌 `@NotBlank`, `@Email` 조건을 검사합니다. 검증 통과 시 완성이된 `SignUpRequest`객체를 컨트롤러 메서드의 매개변수로 전달하며 컨트롤러를 실행합니다. 
> 검증이 실패하면 컨트롤러를 실행하지 않고 `핸들러 어뎁터`에서 예외 `MethodArgumentNotValidException`를 던지게 됩니다.


#### 일반 파라미터 하나만 검증하는 방법 (Spring AOP)
```java
@RestController
@Validated // 클래스 위에 이 어노테이션을 붙여줘야 일반 파라미터 검증이 활성화됩니다!
public class SimpleController {

    @GetMapping("/api/user")
    public String getUser(@NotBlank(message = "ID는 필수입니다.") @RequestParam("id") String id) {
        return "조회 성공: " + id;
    }
}
```
- 동작원리: 클래스 위에 `@Validated`를 붙이면 스프링이 AOP프록시 기술을 사용해서 이 컨트롤러 메서드가 호출되는 시점을 가로챕니다. 그리고 파라미터 값(`id`)가 유효한지 검사합니다.
- 실패 시: `ConstraintViolationException` 발생 (500 Internal Server Error가 기본값이므로 나중에 에러 처리를 따로 해줘야 함)

---

## 2) Global Exception

### 1. RestController 전역 예외 처리기 클래스
```java
package cloud.oxxultus.webmvc.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
// 애플리케이션 전체에서 발생하는 예외를 가로채는 '전역 예외 처리 빈'으로 등록합니다.
@RestControllerAdvice
public class GlobalExceptionHandler {
	
    // @Valid 검증 실패 시 발생하는 'MethodArgumentNotValidException'을 전담 마크합니다.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {

        log.warn("데이터 검증 실패 예외 발생!");

        Map<String, String> errors = new HashMap<>();

       	ex.getBindingResult().getAllErrors().forEach(error -> {
       		// 1. 에러가 난 필드명(예: "name")을 찾아내서 강제 형변환
         	String fieldName = ((FieldError) error).getField();

           	// 2. 개발자가 DTO에 적어둔 'message' 문자열을 추출!! (★ 핵심)
           	String errorMessage = error.getDefaultMessage();

           	// 3. 바구니(Map)에 "name" = "이름은 입력 필수 항목입니다." 형태로 저장
           	errors.put(fieldName, errorMessage);
		});

        return ResponseEntity.badRequest().body(errors);
    }
}

```

#### 설명
- `@RestControllerAdvice`: 이 어노테이션이 붙은 클래스는 스프링 애플리케이션 전체를 확인하고 있다가, 어디선가 예외가 터지게 되어서 `디스패처 서블릿`까지 올라오게 되면 가로치게 됩니다.(Spring AOP의 예시) 
- `@ControllerAdvice`와의 차이: 단순히 반환하는 값이 text나 json 형식이냐의 차이 입니다.
- `@ExceptionHandler(특정예외.class)`: 지정한 예외가 발생했을 때 이 메서드가 실행하여 예외를 처리하게 됩니다. `MethodArgumentNotValidException`를 타겟으로 설정했습니다.

---

## 3. 서블릿 필터 (Filter)와 인터셉터 
```
[클라이언트 요청] 
      │
      ▼
1. 서블릿 필터 (톰캣 소속 문지기)  ➔  "[1. 필터] 요청 가로챔  서블릿 객체 변환 직후"
      │
      ▼
2. 디스패처 서블릿
      │
      ▼
3. 인터셉터 (스프링 소속 문지기)  ➔  " [2. 인터셉터] 컨트롤러 직전 가로챔 핸들러어댑터가 실행 명령하기 직전"
      │
      ▼
4. UserController (실제 컨트롤러)
```

### 1. 서블릿 필터 (Filter)

```java
package cloud.oxxultus.webmvc.filter;

import jakarta.servlet.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class MyWebFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        log.info("[1. 필터 작동] 톰캣 바로 다음(스프링 입구 전)에서 요청을 감지함 ");

        chain.doFilter(request, response);

        log.info("[1. 필터 종료] 모든 처리가 끝나고 톰캣 나가는 중);

    }
}

```

### 2. 인터셉터 (Interceptor)
```java
package cloud.oxxultus.webmvc.filter;


import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
public class MyWebInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception{

        log.info("[2. 인터셉터 작동] 디스패처 서블릿 통과 후, 컨트롤러 직전에서 가로챔");

        return true;
    }
}

```
- Filter와 달리 Interceptor는 스프링 MVC설정 파일에 해당 인터셉터를 어떤 URL 주소에 적용할 것인가를 직접 적어 주어야 작동합니다.WebConfig.java 클래스를 하나 만들고 아래 설정을 작성해 주세요.

#### MVC Config
```java
package cloud.oxxultus.webmvc.config;

import cloud.oxxultus.webmvc.filter.MyWebInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final MyWebInterceptor myWebInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry){
       // "/**"를 적으면 모든 URL 요청에 이 인터셉터를 적용하겠다는 뜻입니다 
       registry.addInterceptor(myWebInterceptor).addPathPatterns("/**");

    }
}
```


### 3. 왜 두번이나 나누어 세울까
서블릿 필터(톰캣 소속): 스프링과 상관없는 크고 전반적인 작업을 수행합니다.
> 전 세계에서 오는 글자가 깨지지 않도록 인코딩을 UTF-8을 강제하거나 웹 어플리케이션 전체에 위험한 해킹 공격 (XSS 등)이 들어오는지 통째로 검문할때 사용합니다.

스프링 인터셉터 (스프링 소속)
> 로그인 세션 체크 사용자 권한 검사 등 스프링 기술(IoC Bean, 서비스 레이어 등)과 밀접하게 연동되는 세밀한 작업을 처리합니다. 인터셉터 안에서는 스프링 Bean을 자유롭게 주입받아 쓸 수 있기 때문에 실무 비즈니스 보안은 대부분 인터셉터나 스프링 시큐리티 (필터 기반이지만 인터셉터 처럼 동작)단에서 처리한다고 합니다.

### 4. 실행 순서 그래프
```
[ 클라이언트의 HTTP 요청 전송 (텍스트 패킷) ]
       │
       ▼
======================= [ 톰캣 (Tomcat) / 서블릿 컨테이너 구역 ] =======================
0.  HttpServletRequest / Response 객체 생성
   "텍스트 패킷을 자바에서 다룰 수 있는 서블릿 객체 두 개로 변환해!"
       │
       ▼
0-1.  [ 서블릿 필터 검문 (Filter .doFilter()) ]
     "톰캣 바로 다음, 스프링 입구(디스패처 서블릿)에 닿기도 전에 거대한 보안/인코딩 검사!"
     - chain.doFilter() 호출 시 ➔ 다음 단계(스프링 구역)로 통과!
     - 거부 시 ➔ 톰캣 단에서 즉시 응답 종료 (스프링 구역은 구경도 못 함)
       │
       ▼
======================= [ 스프링 (Spring) / IoC 컨테이너 구역 ] =======================
       │
       ▼ [ 디스패처 서블릿 (DispatcherServlet) 입장 ]
       │
1. 핸들러 매핑 조회 (HandlerMapping)
   "이 URL(예: /api/signup)을 처리할 컨트롤러(핸들러)를 찾아줘"
       │
       ▼
2. 핸들러 어댑터 조회 (HandlerAdapter)
   "해당 컨트롤러를 실행할 수 있는 전용 어댑터를 대기시켜"
       │
       ▼
3.  [ 인터셉터 검문 (Interceptor .preHandle()) ]
   "핸들러 매핑과 어댑터 조회까지 끝내고, 실제 어댑터에게 실행 명령 내리기 직전 가로챔!"
       │
       ├─── [ 인터셉터가 false를 반환 시 ] ──➔  즉시 중단 (입구 컷)
       │                                        "이후 과정(어댑터 구동, 객체 변환, 검증, 컨트롤러) 시작조차 안 함"
       │
       └─── [ 인터셉터가 true를 반환 시 ] (통과)
               │
               ▼
4. 핸들러 어댑터에 실행 명령 하달 (.handle() 호출)
   "인터셉터 문도 열렸으니, 이제 컨트롤러를 실행하기 위한 전용 도구들을 가동해!"
               │
               ├─ HttpMessageConverter 작동 (Jackson)
               │  "Request 객체 내부의 JSON 텍스트를 읽어서 자바 객체(SignUpRequest DTO)로 변환(역직렬화)해"
               │
               └─ 데이터 검증 실행 (@Valid)
                  "변환 완료된 객체 필드의 @NotBlank, @Email 등의 제약 조건을 전수조사해"
                  "※ 만약 실패하면? 컨트롤러 안 가고 즉시 예외 터트려서 @RestControllerAdvice로 역류!"
               │
               ▼
5. [ 실제 컨트롤러 빈 실행 (UserController.signup()) ]
   "검증까지 완벽 통과한 깨끗한 DTO 객체를 매개변수에 주입하며 진짜 비즈니스 로직 메서드를 깨워!"
```



### 5. 지금 까지의 실행 과정 요약
>클라이언트의 통해 요청이 들어오면 톰캣에서 서블릿 객체(HttpServletResponse, HttpServletRequest)를 만들게 되고, 이때 스프링 입구 직전인 서블릿 필터(Filter)가 가로채어 인코딩이나 보안 검사를 처리합니다. 

>이후 필터를 통과하면 디스패처 서블릿에게 요청이 전달되고, 핸들러 매핑이 핸들러 맵에서 컨트롤러를 찾아 디스패처 서블릿에게 리턴합니다. 디스패처 서블릿은 해당 컨트롤러를 실행할 수 있는 핸들러 어댑터를 조회합니다. 

>이후 핸들러 어댑터에게 실제 실행 명령을 내리기 직전, 스프링 소속 문지기인 인터셉터(Interceptor)가 개입하여 preHandle()을 통해 진입 여부(true/false)를 검문합니다.

>인터셉터를 무사히 통과(true)하면, 디스패처 서블릿은 핸들러 어댑터에게 실제 실행 명령(.handle())을 전달하게 됩니다. 이후 핸들러 어댑터 내부에서는 컨트롤러 메서드에 @RequestBody를 확인하고 ArgumentResolver 구현체를 발동시켜 전달받은 HttpServletRequest 내의 HTTP 바디 텍스트(JSON)를 읽어옵니다. 그리고 HttpMessageConverter를 통해 SignUpRequest라는 자바 객체를 new해서 값을 채워 넣는 역직렬화를 수행합니다.

>그 다음 핸들러 어댑터는 메서드에 붙은 @Valid 어노테이션을 확인하고 SignUpRequest 객체 필드에 적힌 @NotBlank, @Email 제약 조건을 검사합니다. 

>검증 실패 시 컨트롤러로 가지 않고 예외(MethodArgumentNotValidException)를 던져 디스패처 서블릿을 거쳐 @RestControllerAdvice로 전달시키며, 검증 통과 시에만 완성이 된 SignUpRequest 객체를 매개변수로 전달하며 실제 컨트롤러 빈을 실행합니다.


---
