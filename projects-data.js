/**
 * ==========================================================================
 * Yeongjin.Dev - 포트폴리오 프로젝트 데이터 파일 (Projects Data)
 * ==========================================================================
 * 
 * [ 가이드라인: 프로젝트를 직접 추가, 수정하는 방법 ]
 * 
 * 1. 데이터 수정: 아래 'projectData' 객체의 속성 값(title, tagline, techStack 등)을 수정하면
 *    웹사이트 메인 화면, 상세 모달창, PDF 다운로드 문서에 실시간으로 자동 반영됩니다.
 * 
 * 2. 신규 프로젝트 추가:
 *    - 아래 'projectData'에 새로운 키값(예: 'my_new_project')으로 객체를 추가합니다.
 *    - 웹페이지와 PDF 다운로드 시 프로젝트 노출 순서는 'projectData'에 정의된 순서대로 표시됩니다.
 * 
 * 3. 썸네일(thumbnail) 및 아키텍처(architecture) 이미지 연결 방법:
 *    - SVG 코드 사용 (가장 권장):
 *      `<svg ...>...</svg>` 형태의 SVG 문자열을 따옴표(` `) 안에 그대로 넣습니다.
 *      PDF 다운로드 시 화질 저하 없이 가장 선명하게 저장되며, 로컬 파일 실행 시에도 보안 제약(CORS)이 없습니다.
 *    
 *    - 일반 이미지 경로 사용:
 *      `"images/my-project.png"` 처럼 로컬 이미지 파일 경로를 적어줍니다.
 *      ※ 주의: index.html 파일을 웹서버 없이 브라우저에서 직접 더블클릭으로 열었을 경우(file:// 프로토콜),
 *        브라우저 보안 제약으로 인해 PDF를 다운로드할 때 로컬 이미지가 하얗게 안 보일 수 있습니다.
 *        웹서버(Live Server 등)를 띄워 실행하거나 아래 Base64 인코딩 방식을 사용하면 안전하게 작동합니다.
 *    
 *    - Base64 데이터 URI 사용:
 *      `"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."` 형태의 인코딩된 문자열을 입력합니다.
 *      보안 제약 없이 로컬 다운로드 시에도 정상적으로 PDF에 이미지가 포함됩니다.
 */

const projectData = {
    velo: {
        title: "Velo (Team: 애랑해)",
        githubLink: "https://github.com/aeranghae/velo-main-api",
        tagline: "AI 기반 코드 자동 생성 플랫폼",
        category: "team", // "team" (팀 프로젝트) 또는 "personal" (개인 프로젝트)
        period: "2025.11 - 2026.01 (4인 프로젝트)",
        role: "백엔드 메인 API 개발, 디스크 I/O 성능 최적화, WebSocket 로그 스트리밍 버퍼 트러블슈팅",
        techStack: ["Java & Spring Boot", "Spring Web MVC", "Spring Data JPA", "Spring Data Redis", "PostgreSQL (JSONB)", "Docker & Kubernetes", "WebSocket"],
        description: "사용자가 자연어로 소프트웨어 요구사항을 작성하면 AI 에이전트가 격리된 가상 샌드박스 내부에서 Gradle 빌드, 쉘 명령어 실행을 수행해 코드를 자동으로 완성하는 웹 애플리케이션 플랫폼입니다. 이 서비스에서 핵심 API 레이어를 개발하고 대용량 로그 스트리밍 중 일어나는 브레이크포인트 이슈 및 실시간 파일 IO 병목을 진단하고 해결했습니다.",
        
        // 메인 화면 카드 썸네일 (SVG 코드 혹은 이미지 경로 가능)
        thumbnail: `
        <div class="code-art">
            <pre><code><span class="c-keyword">@Service</span>
<span class="c-keyword">public class</span> <span class="c-class">VeloAiService</span> {
  <span class="c-keyword">@Cacheable</span>(value = <span class="c-str">"codeCache"</span>)
  <span class="c-keyword">public</span> Code generateCode(Prompt p) {
    <span class="c-comment">// LLM & Spring Boot Core API</span>
  }
}</code></pre>
        </div>
        `,
        
        achievements: [
            "디렉토리 전수 스캔 시, Files.walk 디스크 I/O 병목 발견 및 PostgreSQL JSONB 인덱싱 캐싱 적용으로 조회 성능 0.0001초 미만 개선",
            "AI 에이전트 실시간 Gradle 빌드 로그 스트리밍 시, 웹소켓 Idle Timeout 및 stdout 버퍼 오버플로우 문제 해결로 무유실 스트리밍 안정화",
            "Redis 캐시 레이어 도입을 통한 데이터베이스 조회 부하 30% 감소 및 서버 응답 속도 최적화",
            "Docker 컨테이너 및 Kubernetes L4 Load Balancing 연동을 통한 분산 트래픽 분산과 가상 환경 격리성 보장"
        ],
        troubleshooting: [
            {
                title: "1. [I/O Optimization] Files.walk 전수 스캔 병목 개선을 위한 메타데이터 캐싱 전략",
                problem: "사용자가 저장소 내 프로젝트의 파일 트리와 실시간 용량을 조회할 때마다 API 응답 속도가 점진적으로 저하되는 성능 저하 우려 발견.",
                cause: "사용자 요청이 들어올 때마다 자바의 Files.walk API를 사용해 파일 시스템(NFS)의 실제 물리 디렉토리를 바닥부터 끝까지 전수 스캔하도록 설계되어 있었습니다. 프로젝트 내 파일 개수와 볼륨이 늘어날수록 디스크 I/O 병목이 심해져 서버 전체의 쓰루풋(Throughput)을 떨어트리는 구조적 결함이 있었습니다.",
                action: "조회 시마다 디스크를 긁어오던 무거운 동기화 방식을 전면 폐기했습니다. 대신 AI 자율 코딩 공정이 최종적으로 완수(COMPLETED 또는 FAILED)되는 시점에 단 한 번 파일 트리와 용량을 일괄 색인(indexProjectFiles)하여 DB(PostgreSQL JSONB 컬럼)에 장부 형태로 기록하도록 아키텍처를 변경했습니다.",
                result: "물리 디스크 접근 횟수를 0번으로 줄이고, 사용자 조회 요청 시 JPA 영속성 레이어 및 Redis 캐시 레이어에서 메타데이터를 0.0001초 만에 즉시 서빙하도록 성능을 극대화했습니다. 무조건적인 실시간 조회보다 시스템 부하를 고려한 '장부 기반 색인 및 캐싱 아키텍처'의 필요성을 학습했습니다."
            },
            {
                title: "2. [Performance] 웹소켓 세션 타임아웃 및 대용량 로그 스트리밍 버퍼 초과 현상 최적화",
                problem: "AI 에이전트가 격리 샌드박스 내부에서 코드를 생성하고 Gradle 빌드 및 쉘 명령어를 실행하는 과정에서, 실시간 로그 스트리밍 도중 웹소켓 연결이 중간에 끊기거나 특정 대용량 로그 구간에서 데이터가 잘리는 현상이 발생함.",
                cause: "스프링 웹소켓의 기본 세션 유지 타임아웃(Idle Timeout) 설정이 너무 짧아, AI 엔진의 빌드 연산이 길어질 때 무동작 상태로 오인되어 커넥션이 강제 종료되었습니다. 또한, Gradle 빌드 시 쏟아져 나오는 방대한 표준 출력(stdout) 로그의 데이터 체급이 스프링 웹소켓 컨테이너의 기본 텍스트 버퍼 임계치를 초과하여 세션 오버플로우 예외가 격발된 것이 원인이었습니다.",
                action: "ServletServerContainerFactoryBean 설정을 커스텀 정의하여 스프링 웹소켓의 인프라 한계를 직접 확장했습니다. AI 장기 연산 환경을 고려해 세션 및 비동기 송신 타임아웃을 5분(300,000ms)으로 상향 조정하고, 대용량 로그 수신 시 데이터 유실을 막기 위해 텍스트 및 바이너리 메시지 버퍼 크기를 10MB로 대폭 확충했습니다.",
                result: "네트워크 병목이나 인프라 제약 없이 AI 자율 공정 전체 프로세스의 대용량 빌드 로그를 100% 무결하게 실시간으로 스트리밍하는 데 성공했습니다. 네트워크 세션 관리와 메모리 버퍼 임계치 설계의 중요성을 깨달았습니다."
            },
            {
                title: "3. [Architecture] 웹소켓 세션 맵 참조로 인한 스프링 빈 순환 참조(Circular Dependency) 해결",
                problem: "웹소켓을 통해 LLM 서버와 실시간으로 연동되어 작업이 진행 중인 프로젝트는 도중에 삭제되지 않도록 방지하는 검증 기능을 구현하고자 했습니다. 이를 위해 웹소켓 세션이 등록될 때 프로젝트 식별자를 Key로 하는 상태 관리 Map에 저장하고, 프로젝트 삭제 서비스에서 해당 Map을 참조하여 검증하려 했으나, 스프링 애플리케이션 구동 시 Application Context 의존성 주입 단계에서 순환 참조(Circular Dependency) 에러가 발생하며 기동이 실패하는 현상이 발생했습니다.",
                cause: "웹소켓 세션 라이프사이클을 관리하는 서비스(빈)와 프로젝트의 CRUD를 담당하는 서비스(빈)가 서로의 검증 및 상태 관리를 위해 상호 간을 직접 참조하게 되면서 양방향 의존 관계가 형성되었기 때문입니다. 이로 인해 스프링 컨테이너가 빈 초기화 단계에서 생성 우선순위를 결정하지 못해 순환 의존성 고리에 빠지게 되었습니다.",
                action: "서비스 컴포넌트 간의 직접적인 강결합을 끊기 위해 스프링의 이벤트 리스너(ApplicationEventPublisher 및 @EventListener) 구조를 도입했습니다. 웹소켓 등록/해제에 따른 세션 상태 변화나 삭제 검증 요청을 직접적인 빈 참조가 아닌 비동기/동기 이벤트 발행 형태로 위임함으로써 컴포넌트 간의 논리적 결합도를 낮추고 의존성 연결 고리를 분리했습니다.",
                result: "빈 간의 순환 참조 문제를 완벽하게 해소하여 안정적으로 애플리케이션을 구동할 수 있게 되었으며, 프로젝트 작업 여부에 따른 삭제 제한 로직 또한 무결하게 동작하도록 구현했습니다. 향후 시스템 확장 시에도 모듈 간 영향도를 최소화할 수 있는 이벤트 기반 레이아웃의 이점을 확보했습니다."
            }
        ],
        
        // 상세 모달창 및 PDF 포트폴리오에 활용되는 아키텍처 다이어그램 (SVG 코드 혹은 이미지 경로/Base64 가능)
        architecture: `
        <svg class="arch-svg" width="900" height="460" viewBox="0 0 900 460" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3B82F6" />
                </marker>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
                </marker>
                <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#A855F7" />
                </marker>
                <marker id="arrow-grey" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94A3B8" />
                </marker>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(59, 130, 246, 0.15)" />
                    <stop offset="100%" stop-color="rgba(37, 99, 235, 0.03)" />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(16, 185, 129, 0.15)" />
                    <stop offset="100%" stop-color="rgba(5, 150, 105, 0.03)" />
                </linearGradient>
                <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(168, 85, 247, 0.15)" />
                    <stop offset="100%" stop-color="rgba(147, 51, 234, 0.03)" />
                </linearGradient>
                <linearGradient id="greyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(255, 255, 255, 0.05)" />
                    <stop offset="100%" stop-color="rgba(255, 255, 255, 0.01)" />
                </linearGradient>
            </defs>

            <!-- Background -->
            <rect width="900" height="460" rx="12" fill="#090D14" stroke="rgba(16, 185, 129, 0.15)" stroke-width="2"/>

            <!-- ==========================================
                 COL 1: CLIENT & NGINX
                 ========================================== -->
            <!-- USER / CLIENT Card -->
            <rect x="30" y="170" width="180" height="80" rx="10" fill="url(#blueGrad)" stroke="#3B82F6" stroke-width="1.5"/>
            <path d="M50 200 H70 M55 208 H65 M60 200 V208" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
            <rect x="46" y="188" width="28" height="14" rx="2" fill="none" stroke="#3B82F6" stroke-width="2"/>
            <text x="130" y="206" fill="#F8FAFC" font-size="12" font-family="Outfit" font-weight="bold" text-anchor="middle">USER / CLIENT</text>
            <text x="130" y="224" fill="#94A3B8" font-size="10" font-family="Outfit" text-anchor="middle">React Electron</text>

            <!-- NGINX Card -->
            <rect x="30" y="40" width="180" height="80" rx="10" fill="url(#greyGrad)" stroke="#64748B" stroke-width="1.5"/>
            <path d="M50 72h20 M50 80h20 M55 68l-5 4 5 4 M65 76l5 4-5 4" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="46" y="60" width="28" height="28" rx="2" fill="none" stroke="#64748B" stroke-width="1.5"/>
            <text x="130" y="76" fill="#F8FAFC" font-size="12" font-family="Outfit" font-weight="bold" text-anchor="middle">NGINX</text>
            <text x="130" y="94" fill="#94A3B8" font-size="10" font-family="Outfit" text-anchor="middle">Reverse Proxy</text>

            <!-- Connector: USER/CLIENT -> NGINX -->
            <path d="M120 170 V126" stroke="#94A3B8" stroke-width="1.5" marker-end="url(#arrow-grey)"/>
            <rect x="75" y="136" width="90" height="18" rx="9" fill="#1E293B" stroke="#475569" stroke-width="1"/>
            <text x="120" y="148" fill="#F8FAFC" font-size="8" font-family="Outfit" font-weight="bold" text-anchor="middle">Port 80 / 443</text>

            <!-- ==========================================
                 COL 2 & 3: KUBERNETES CLUSTER
                 ========================================== -->
            <!-- Kubernetes Cluster Container -->
            <rect x="235" y="20" width="430" height="260" rx="12" fill="#0B111E" stroke="rgba(37, 99, 235, 0.25)" stroke-width="1.5"/>
            <text x="250" y="38" fill="#3B82F6" font-size="9" font-family="Outfit" font-weight="bold" letter-spacing="0.05em">KUBERNETES CLUSTER</text>

            <!-- K8s Service (L4) -->
            <rect x="255" y="50" width="390" height="65" rx="10" fill="url(#blueGrad)" stroke="#3B82F6" stroke-width="1.5"/>
            <circle cx="280" cy="72" r="5" fill="#3B82F6"/>
            <circle cx="295" cy="85" r="4" fill="#60A5FA"/>
            <circle cx="295" cy="60" r="4" fill="#60A5FA"/>
            <path d="M285 72h5 M290 72v10h5 M290 72V63h5" stroke="#3B82F6" stroke-width="1.5"/>
            <text x="460" y="78" fill="#F8FAFC" font-size="13" font-family="Outfit" font-weight="bold" text-anchor="middle">K8s Service (L4)</text>
            <text x="460" y="94" fill="#94A3B8" font-size="10" font-family="Outfit" text-anchor="middle">Load balancing ClusterIP</text>

            <!-- Connector: NGINX -> K8s Service (L4) -->
            <path d="M210 80 H249" stroke="#3B82F6" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
            <rect x="195" y="71" width="50" height="18" rx="9" fill="#1E293B" stroke="#2563EB" stroke-width="1"/>
            <text x="220" y="83" fill="#60A5FA" font-size="8" font-family="Outfit" font-weight="bold" text-anchor="middle">Port 8080</text>

            <!-- Spring Pod v1 -->
            <rect x="255" y="165" width="180" height="90" rx="10" fill="url(#greenGrad)" stroke="#10B981" stroke-width="1.5"/>
            <path d="M280 195c5-10 15-15 15-15s-2 12-10 17c-5 3-10 1-10 1s2-8 7-11c5-3 8-1 8-1" fill="#10B981"/>
            <text x="360" y="205" fill="#F8FAFC" font-size="12" font-family="Outfit" font-weight="bold" text-anchor="middle">Spring Pod v1</text>
            <text x="360" y="225" fill="#94A3B8" font-size="10.5" font-family="Outfit" text-anchor="middle">API Server</text>

            <!-- Spring Pod v2 -->
            <rect x="455" y="165" width="180" height="90" rx="10" fill="url(#greenGrad)" stroke="#10B981" stroke-width="1.5"/>
            <path d="M480 195c5-10 15-15 15-15s-2 12-10 17c-5 3-10 1-10 1s2-8 7-11c5-3 8-1 8-1" fill="#10B981"/>
            <text x="560" y="205" fill="#F8FAFC" font-size="12" font-family="Outfit" font-weight="bold" text-anchor="middle">Spring Pod v2</text>
            <text x="560" y="225" fill="#94A3B8" font-size="10.5" font-family="Outfit" text-anchor="middle">API Server</text>

            <!-- Connectors: L4 -> Spring Pod v1 & v2 -->
            <path d="M345 115 V159" stroke="#3B82F6" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
            <rect x="325" y="126" width="40" height="18" rx="9" fill="#1E293B" stroke="#2563EB" stroke-width="1"/>
            <text x="345" y="138" fill="#60A5FA" font-size="8" font-family="Outfit" font-weight="bold" text-anchor="middle">IP 1</text>

            <path d="M545 115 V159" stroke="#3B82F6" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
            <rect x="525" y="126" width="40" height="18" rx="9" fill="#1E293B" stroke="#2563EB" stroke-width="1"/>
            <text x="545" y="138" fill="#60A5FA" font-size="8" font-family="Outfit" font-weight="bold" text-anchor="middle">IP 2</text>

            <!-- ==========================================
                 COL 4: FASTAPI WORKER
                 ========================================== -->
            <!-- FastAPI Worker Container -->
            <rect x="690" y="20" width="180" height="260" rx="12" fill="url(#purpleGrad)" stroke="#A855F7" stroke-width="1.5"/>
            <text x="780" y="85" fill="#F8FAFC" font-size="14" font-family="Outfit" font-weight="bold" text-anchor="middle">FastAPI Worker</text>
            <text x="780" y="105" fill="#D8B4FE" font-size="10.5" font-family="Outfit" font-weight="bold" text-anchor="middle">LLM Agent Engine</text>
            <text x="780" y="123" fill="#94A3B8" font-size="9" font-family="Outfit" text-anchor="middle">자율 에이전트 코드 생성</text>

            <!-- WebSocket Pipeline pill -->
            <rect x="710" y="205" width="140" height="40" rx="20" fill="rgba(168, 85, 247, 0.15)" stroke="#A855F7" stroke-width="1.5"/>
            <text x="780" y="229" fill="#F8FAFC" font-size="10.5" font-family="Outfit" font-weight="bold" text-anchor="middle">WebSocket Pipeline</text>

            <!-- Connector: Spring Pods <-> FastAPI Worker -->
            <path d="M635 210 H684" stroke="#A855F7" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#arrow-purple)"/>
            <path d="M689 210 H640" stroke="#A855F7" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#arrow-purple)"/>
            <rect x="625" y="180" width="70" height="18" rx="9" fill="#1E293B" stroke="#A855F7" stroke-width="1"/>
            <text x="660" y="192" fill="#D8B4FE" font-size="8" font-family="Outfit" font-weight="bold" text-anchor="middle">HTTP / WS</text>

            <!-- ==========================================
                 ROW 3: DATABASES, STORAGE, SANDBOX
                 ========================================== -->
            <!-- PostgreSQL Card -->
            <rect x="30" y="340" width="180" height="90" rx="10" fill="url(#blueGrad)" stroke="#3B82F6" stroke-width="1.5"/>
            <path d="M50 375v20c0 3 5 5 10 5s10-2 10-5v-20 M50 375c0 3 5 5 10 5s10-2 10-5 M50 385c0 3 5 5 10 5s10-2 10-5" stroke="#3B82F6" stroke-width="1.5"/>
            <text x="135" y="380" fill="#F8FAFC" font-size="12.5" font-family="Outfit" font-weight="bold" text-anchor="middle">PostgreSQL</text>
            <text x="135" y="400" fill="#94A3B8" font-size="10" font-family="Outfit" text-anchor="middle">트리 구조화 데이터 등</text>

            <!-- Redis Cache Card -->
            <rect x="250" y="340" width="180" height="90" rx="10" fill="url(#greyGrad)" stroke="#EF4444" stroke-width="1.5"/>
            <path d="M50 372h20v6H50zm0 10h20v6H50zm0 10h20v6H50z" fill="none" stroke="#EF4444" stroke-width="1.5"/>
            <text x="355" y="380" fill="#F8FAFC" font-size="12.5" font-family="Outfit" font-weight="bold" text-anchor="middle">Redis Cache</text>
            <text x="355" y="400" fill="#94A3B8" font-size="10" font-family="Outfit" text-anchor="middle">실시간 로그 및 캐싱</text>

            <!-- NFS Storage Card -->
            <rect x="470" y="340" width="180" height="90" rx="10" fill="url(#blueGrad)" stroke="#06B6D4" stroke-width="1.5"/>
            <path d="M52 388a5 5 0 0 1 0-10 6 6 0 0 1 12 0 4 4 0 0 1 4 4 4 4 0 0 1-4 4h-12z" fill="none" stroke="#06B6D4" stroke-width="1.5"/>
            <text x="575" y="380" fill="#F8FAFC" font-size="12.5" font-family="Outfit" font-weight="bold" text-anchor="middle">NFS Storage</text>
            <text x="575" y="400" fill="#94A3B8" font-size="10" font-family="Outfit" text-anchor="middle">UUID 전용 물리 저장소</text>

            <!-- Docker Sandbox Card -->
            <rect x="690" y="340" width="180" height="90" rx="10" fill="url(#blueGrad)" stroke="#0284C7" stroke-width="1.5"/>
            <rect x="48" y="375" width="6" height="6" fill="#0284C7"/>
            <rect x="56" y="375" width="6" height="6" fill="#0284C7"/>
            <rect x="64" y="375" width="6" height="6" fill="#0284C7"/>
            <path d="M46 385h28s1 5-5 5h-18s-6 0-5-5z" fill="none" stroke="#0284C7" stroke-width="1.5"/>
            <text x="795" y="380" fill="#F8FAFC" font-size="12.5" font-family="Outfit" font-weight="bold" text-anchor="middle">Docker Sandbox</text>
            <text x="795" y="400" fill="#94A3B8" font-size="10" font-family="Outfit" text-anchor="middle">독립 빌드 및 테스트</text>

            <!-- Connector: NFS Storage <-> Docker Sandbox (볼륨 마운트) -->
            <path d="M650 385 H684" stroke="#06B6D4" stroke-width="1.5" marker-end="url(#arrow-green)"/>
            <rect x="635" y="356" width="65" height="18" rx="9" fill="#1E293B" stroke="#06B6D4" stroke-width="1"/>
            <text x="667.5" y="367" fill="#22D3EE" font-size="8" font-family="Outfit" font-weight="bold" text-anchor="middle">볼륨 마운트</text>

            <!-- Dashed bus connections from Spring Pods to storage boxes -->
            <path d="M120 310 H780" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3"/>
            <path d="M345 255 V310" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3"/>
            <path d="M565 255 V310" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3"/>
            
            <path d="M120 310 V339" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#arrow-green)"/>
            <path d="M340 310 V339" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#arrow-green)"/>
            <path d="M560 310 V339" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#arrow-green)"/>
            <path d="M780 310 V339" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#arrow-green)"/>
        </svg>
        `
    },
    tracego: {
        title: "Pickgo (Tracego)",
        githubLink: "https://github.com/oxxultus/tracego-server",
        tagline: "서버 상태 추적 및 모니터링 도구 세트",
        category: "team",
        period: "2025.09 - 2025.10 (4인 프로젝트)",
        role: "수집 서버 코어 및 클라이언트 라이브러리 개발, 자원 데이터 실시간 적재",
        techStack: ["Java", "Spring Boot", "Spring Web MVC", "Redis", "Docker", "Linux"],
        description: "여러 분산 노드로 구동되는 복잡한 인프라 환경에서, 실시간 프로세스 상태 및 자원(CPU, 메모리, 네트워크 트래픽 등) 로그 데이터의 원활한 수집과 중앙 집중식 트레이싱 분석을 제공하기 위한 시스템입니다. 모듈형 아키텍처(tracego-server, tracego-core, tracego-stand, tracego-wheel)로 컴포넌트를 설계하여 서버 성능 오버헤드 최소화에 주안점을 두었습니다.",
        
        thumbnail: `
        <div class="code-art">
            <pre><code><span class="c-keyword">public class</span> <span class="c-class">TracegoAgent</span> {
  <span class="c-keyword">public void</span> trace(String spanId) {
    <span class="c-comment">// core, server, stand, wheel modular modules</span>
  }
}</code></pre>
        </div>
        `,
        
        achievements: [
            "연동 대상 애플리케이션 모니터링 시, 수집 성능 오버헤드 경감을 위해 핵심 비즈니스 로직 라이브러리 모듈화 패키징 구현",
            "리눅스 호스트 시스템 자원 통계 수집 시, 실시간 데이터 통계 핸들러 구축 및 주기적 소켓/API 송수신 성능 제어 최적화",
            "트래픽 폭증으로 인한 대규모 자원 데이터 적재 시, Redis 인메모리 버퍼링 레이어 연동으로 서버 영속화 DB 부하 분산 및 안정화"
        ],
        troubleshooting: [],
        
        architecture: `
        <svg class="arch-svg" width="700" height="200" viewBox="0 0 700 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="700" height="200" rx="12" fill="#090D14" stroke="rgba(16, 185, 129, 0.15)" stroke-width="2"/>
            
            <!-- Nodes (Wheel / core) -->
            <rect x="30" y="40" width="130" height="50" rx="6" fill="rgba(59, 130, 246, 0.1)" stroke="#3B82F6" stroke-width="1.5"/>
            <text x="95" y="70" fill="#F8FAFC" font-size="10" font-family="Outfit" font-weight="bold" text-anchor="middle">Host Node A (Wheel)</text>
            
            <rect x="30" y="110" width="130" height="50" rx="6" fill="rgba(59, 130, 246, 0.1)" stroke="#3B82F6" stroke-width="1.5"/>
            <text x="95" y="140" fill="#F8FAFC" font-size="10" font-family="Outfit" font-weight="bold" text-anchor="middle">Host Node B (Wheel)</text>
            
            <!-- Connection arrows -->
            <path d="M160 65 Q230 65 290 85" stroke="#94A3B8" stroke-width="1.5"/>
            <polygon points="290,85 281,81 285,90" fill="#94A3B8"/>
            
            <path d="M160 135 Q230 135 290 115" stroke="#94A3B8" stroke-width="1.5"/>
            <polygon points="290,115 285,110 281,119" fill="#94A3B8"/>
            
            <text x="210" y="110" fill="#94A3B8" font-size="8" text-anchor="middle">Send System Metrics</text>

            <!-- Tracego Server -->
            <rect x="290" y="70" width="160" height="60" rx="8" fill="rgba(16, 185, 129, 0.1)" stroke="#10B981" stroke-width="2"/>
            <text x="370" y="95" fill="#F8FAFC" font-size="11" font-family="Outfit" font-weight="bold" text-anchor="middle">Tracego Server</text>
            <text x="370" y="112" fill="#94A3B8" font-size="9" text-anchor="middle">(Tracego-Server)</text>
            
            <!-- Arrow to Redis -->
            <path d="M450 100 H520" stroke="#94A3B8" stroke-width="2"/>
            <polygon points="520,100 512,95 512,105" fill="#94A3B8"/>
            <text x="485" y="90" fill="#94A3B8" font-size="8" text-anchor="middle">Buffer</text>
            
            <!-- Redis Storage -->
            <rect x="520" y="70" width="130" height="60" rx="8" fill="rgba(244, 63, 94, 0.1)" stroke="#F43F5E" stroke-width="2"/>
            <text x="585" y="95" fill="#F8FAFC" font-size="11" font-family="Outfit" font-weight="bold" text-anchor="middle">Redis Cache Buffer</text>
            <text x="585" y="112" fill="#94A3B8" font-size="9" text-anchor="middle">(Async Batch Persist)</text>
        </svg>
        `
    },
    liminal: {
        title: "Liminal Desktop",
        githubLink: "https://github.com/oxxultus/liminal",
        tagline: "macOS 전용 AI 에이전트 기반 데스크톱 자동화 플랫폼",
        category: "personal",
        period: "2025.07 - 2025.08 (개인 프로젝트)",
        role: "단독 기획 및 전체 아키텍처 구현",
        techStack: ["Electron", "React", "TypeScript", "LLM (Claude, GPT)", "SQLite", "macOS"],
        description: "Claude 및 GPT와 같은 다양한 LLM API를 연동하여 일상 대화가 가능하고, 파일 조작이나 메일 전송 등 사용자 정의 플러그인을 연결하여 다양한 작업을 자동화할 수 있는 macOS 전용 AI 데스크톱 어시스턴트 애플리케이션입니다. Electron 기반으로 React와 TypeScript를 사용하여 인터페이스를 구축하고 SQLite를 로컬 저장소로 사용해 상태를 보관합니다.",
        
        thumbnail: `
        <div class="code-art">
            <pre><code><span class="c-keyword">import</span> { app, BrowserWindow } <span class="c-keyword">from</span> <span class="c-str">'electron'</span>;
<span class="c-keyword">const</span> db = <span class="c-keyword">new</span> sqlite3.Database(<span class="c-str">'./liminal.db'</span>);
<span class="c-comment">// macOS AI Agent Assistant</span>
<span class="c-keyword">const</span> callLLM = <span class="c-keyword">async</span> (prompt) => {
  <span class="c-comment">// Claude & GPT API Stream</span>
}</code></pre>
        </div>
        `,
        
        achievements: [
            "macOS 네이티브 데스크톱 환경 구축 시, Electron 프레임워크와 React+TypeScript 구조 설계로 경량 콘솔 레이아웃 구현 및 반응 속도 향상",
            "사용자 맞춤형 로컬 제어 시, LLM Function Calling 및 커스텀 플러그인 연계로 파일 IO 및 SMTP 메일 등 OS 동작 자동화 구현",
            "로컬 세션 로그 및 설정 메타데이터 보관 시, SQLite 임베디드 파일 DB 적용으로 대용량 세션 데이터 로컬 영속화 속도 최적화"
        ],
        troubleshooting: [],
        
        architecture: `
        <svg class="arch-svg" width="700" height="200" viewBox="0 0 700 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="700" height="200" rx="12" fill="#090D14" stroke="rgba(16, 185, 129, 0.15)" stroke-width="2"/>
            
            <!-- React UI -->
            <rect x="25" y="70" width="115" height="60" rx="8" fill="rgba(59, 130, 246, 0.1)" stroke="#3B82F6" stroke-width="2"/>
            <text x="82" y="100" fill="#F8FAFC" font-size="11" font-family="Outfit" font-weight="bold" text-anchor="middle">React UI (TS)</text>
            <text x="82" y="115" fill="#94A3B8" font-size="9" text-anchor="middle">(Renderer Process)</text>
            
            <!-- IPC Arrow -->
            <path d="M140 100 H200" stroke="#94A3B8" stroke-width="2"/>
            <polygon points="200,100 192,95 192,105" fill="#94A3B8"/>
            <text x="170" y="90" fill="#94A3B8" font-size="8" text-anchor="middle">IPC Bridge</text>
            
            <!-- Electron Main -->
            <rect x="200" y="55" width="180" height="90" rx="8" fill="rgba(16, 185, 129, 0.1)" stroke="#10B981" stroke-width="2"/>
            <text x="290" y="85" fill="#F8FAFC" font-size="12" font-family="Outfit" font-weight="bold" text-anchor="middle">Electron Main Process</text>
            <text x="290" y="105" fill="#94A3B8" font-size="10" text-anchor="middle">(Node.js Runtime / macOS)</text>
            <text x="290" y="125" fill="#38BDF8" font-size="9" font-family="Outfit" font-weight="bold" text-anchor="middle">Plugin Manager</text>
            
            <!-- Connections to LLM and Plugins -->
            <path d="M380 80 Q410 80 435 65" stroke="#94A3B8" stroke-width="1.5"/>
            <polygon points="435,65 426,63 430,72" fill="#94A3B8"/>
            <text x="408" y="60" fill="#94A3B8" font-size="8" text-anchor="middle">Function Call</text>
            
            <path d="M380 120 Q410 120 435 135" stroke="#94A3B8" stroke-width="1.5"/>
            <polygon points="435,135 430,128 426,137" fill="#94A3B8"/>
            <text x="408" y="145" fill="#94A3B8" font-size="8" text-anchor="middle">Trigger OS Task</text>
        </svg>
        `
    }
};
