---
title: "Spring MVC 1: 요청 처리 흐름"
date: 2026-06-08 09:00:00 +0900
categories: ["Backend/Spring/MVC"]
tags: [Spring, Spring MVC, DispatcherServlet, Tomcat]
summary: "HTTP 요청이 톰캣과 DispatcherServlet을 거쳐 컨트롤러에 도달하는 흐름을 정리했습니다."
excerpt: "HandlerMapping과 HandlerAdapter, HttpMessageConverter가 Spring MVC 요청과 응답을 처리하는 과정을 단계별로 살펴봅니다."
source_url: "https://velog.io/@oxxultus/스프링을-처음부터..-Spring-MVC"
---

## 1) Spring MVC 요청 처리 흐름

#### 클라이언트
1. HTTP 요청 (예: GET /users)
  
#### 톰캣 (Tomcat)
2. HTTP 텍스트 패킷을 자바 표준 서블릿 객체로 변환 (무조건 변환된다)
	- `HttpServletRequest(값 있음)` / `HttpServletResponese(빈 객체)` 로 변환
    
#### 디스패처 서블릿 (DispatcherServlet)
3. 핸들러 매핑 `HandlerMapping`에게 URL 조회 요청
  
#### 핸들러 매핑 (HandlerMapping)
4. `HandlerMapping`은 `HandlerMap`에서 요청 URL을 담당하는 컨트롤러를 찾는다
	- `HandlerMapping`또한 서버가 실행될 때 **IoC 컨테이너**에 의해 자동으로 `Bean`으로 등록된다.
	- `HandlerMapping`은 생성될때 자신을 품고 있는 `ApplicationContext`에게 지금 내부에 등록된 `Bean` 중에서 `@Controller`나 `@RequestMapping` 어노테이션을 가진 컨트롤러 `Bean` 리스트를 뽑는다.
	- `ApplicationContext`로부터 컨트롤러 `Bean` 들을 넘겨받은 `HandlerMapping`은 각 컨트롤러 내부에 적힌 주소(`@GetMapping("/users")` 등)를 분석하여 내부적으로 **키(key)**는 URL주소, **값(value)**은 해당 컨트롤러 `Bean`과 `메서드 객체` 형태로 이루어진 `Map`을 작성합니다.
   	- 만들어진 `Map`이 내부의 `HandlerMap`이라는 테이블 입니다.
 5. 매칭되는 결과가 있으면 해당 컨트롤러 Bean 객체의 참조값을 즉시 꺼내서 `DispatcherServlet`에게 리턴해줍니다
   
#### 디스패처 서블릿 (DispatcherServlet)
6. 핸들러 어댑터에게 이 컨트롤러 실행 요청 (서블릿 객체`HttpServletRequest(값 있음)` / `HttpServletResponese(빈 객체)`도 함께 전달)
  
#### 핸들러 어댑터 (HandlerAdapter)
7. 해당 컨트롤러 `Bean`의 특정 메서드를 직접 호출 (`HttpServletRequest`값을 매개변수에 값을 넣어줌)
   	- 이 컨트롤러 `Bean`은 서버 구동 시점에 이미 **IoC 컨테이너**가 의존성 주입을 끝내둔 객체
    
#### 실제 컨트롤러 Bean (Controller)
8. 비즈니스 로직 수행 후 결과값(데이터 혹은 View 문자열) 반환
  
#### 핸들러 어댑터 (HandlerAdapter)
9. 반환값을 `DispatcherServlet`으로 토스
  
#### 디스패처 서블릿 (DispatcherServlet)
10. 리턴 타입 및 컨트롤러 종류에 따른 [2) 2 참고]
	- `@RestController` -> `HttpMessageConverter` 작동
	- `@Controller` -> `ViewResolver` & **템플릿 엔진 작동** (HTML문자열 생성)
11. 가공한 데이터를 `HttpServletResponese` 객체에 채운다.
12. 데이터가 채워진 기존 `HttpServletResponse` 객체를 톰캣에게 다시 전달
  
#### 톰캣 (Tomcat)
13. `HttpServletResponse` 객체 내부의 내용을 꺼내어서 브라우저가 읽을 수 있는 최종 **HTTP응답 패킷(text)**으로 최종 조립 후 네트워크 선으로 발송
  
#### 클라이언트
14. 수신
  
---

## 2) 핵심 컴포넌트 내부 동작 및 분담 디테일

### 1) HttpServletRequest / HttpServletResponse 변환
- 필수성: 웹 브라우저가 보내는 HTTP 요청은 단순한 텍스트 덩어리이므로 자바 프로그램이 읽을 수 없습니다. 따라서 톰캣단에서 무조건 자바 서블릿 표준 객체로 파싱 및 변환하여 안으로 들여보내야 하기 때문입니다.
- 추상화: 개발자가 컨트롤러에서 HttpServeltRequest를 직접 가로채지 않고 변수 (Long id등)만 적어도 데이터가 바인딩 되는 이유는 핸들러 어댑터가 내부에서 이 객체를 뒤져 매개변수에 값을 자동으로 넣어주기 때문입니다.

### 2) 스프링과 톰캣의 최종 응답 조립
Response 객체는 매번 새로 만드는 것이 아니라 처음에 톰캣이 생성한 빈 바구니 (HttpServletResponse)를 끝까지 사용하면서 각자 역할을 나눠 조립합니다.
- 스프링(디스패처 서블릿)의 역할 -> 내용물 조립:
  - 톰캣이 준 Response 객체라는 자바 바구니 내부에 데이터(Json/ Html)을 알맞게 가공해서 채워 넣는 조립을 합니다.
  - @RestController: MappingJacson2HttpMessageConverter가 자바 객체를 Json 문자열로 변환하여 Response 출력 스트림에 채웁니다.
  - @Controller: ViewResolver가 html파일을 찾고 템플릿 엔진이 동적 데이터를 결합하여 완성한 HTML 문자열을 Response 출력 스트림에 채웁니다.
- 톰캣(Tomcat)의 역할 -> 최종 포장 및 발송:
  - 스프링이 내용물을 채워 돌려준 Response 객체를 받아서 웹 브라우저가 읽을 수 있는 HTTP응답 표준 프로토콜 패킷(텍스트 신호)으로 최종 적으로 변환하여 네트워크로 내보내는 역할을 합니다.

---
