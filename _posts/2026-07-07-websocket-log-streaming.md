---
title: "WebSocket 로그 스트리밍 흐름 정리"
date: 2026-07-07 09:00:00 +0900
categories: [Infrastructure]
tags: [WebSocket, Logging, Docker]
summary: "실시간 로그 전달은 연결 수명과 느린 소비자를 함께 고려해야 합니다."
excerpt: "컨테이너 로그를 브라우저로 전달하는 작은 실험을 통해 연결 관리와 백프레셔의 필요성을 정리했습니다."
---

## 구성 흐름

서버가 컨테이너 로그 스트림을 읽고 필요한 메시지만 WebSocket 세션으로 전달하는 구조를 실험했습니다.

### 연결 단계

1. 클라이언트가 로그 대상과 함께 연결합니다.
2. 서버가 읽기 스트림을 구독합니다.
3. 연결이 닫히면 구독과 관련 자원을 해제합니다.

```javascript
socket.addEventListener('message', event => {
  const log = JSON.parse(event.data);
  appendLogLine(log.timestamp, log.message);
});
```

## 느린 소비자 다루기

브라우저가 처리하는 속도보다 로그가 빠르게 생성되면 메모리 사용량이 증가합니다. 버퍼 크기 제한과 샘플링, 오래된 로그 제거 정책이 필요합니다.

## 다음 실험

재연결 시 마지막 이벤트 이후부터 이어받는 방식과 여러 인스턴스에서 세션을 관리하는 방식을 비교할 예정입니다.
