/* ==========================================================================
   Project Data for Modal Popup
   ========================================================================== */
const projectData = {
    velo: {
        title: "Velo (Team: 애랑해)",
        githubLink: "https://github.com/aeranghae/velo-main-api",
        tagline: "AI 기반 코드 자동 생성 플랫폼",
        period: "2025.11 - 2026.01 (4인 프로젝트)",
        role: "백엔드 메인 API 개발, 디스크 I/O 성능 최적화, WebSocket 로그 스트리밍 버퍼 트러블슈팅",
        techStack: ["Java & Spring Boot", "Spring Web MVC", "Spring Data JPA", "Spring Data Redis", "PostgreSQL (JSONB)", "Docker & Kubernetes", "WebSocket"],
        description: "사용자가 자연어로 소프트웨어 요구사항을 작성하면 AI 에이전트가 격리된 가상 샌드박스 내부에서 Gradle 빌드, 쉘 명령어 실행을 수행해 코드를 자동으로 완성하는 웹 애플리케이션 플랫폼입니다. 이 서비스에서 핵심 API 레이어를 개발하고 대용량 로그 스트리밍 중 일어나는 브레이크포인트 이슈 및 실시간 파일 IO 병목을 진단하고 해결했습니다.",
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
        period: "2025.09 - 2025.10 (4인 프로젝트)",
        role: "수집 서버 코어 및 클라이언트 라이브러리 개발, 자원 데이터 실시간 적재",
        techStack: ["Java", "Spring Boot", "Spring Web MVC", "Redis", "Docker", "Linux"],
        description: "여러 분산 노드로 구동되는 복잡한 인프라 환경에서, 실시간 프로세스 상태 및 자원(CPU, 메모리, 네트워크 트래픽 등) 로그 데이터의 원활한 수집과 중앙 집중식 트레이싱 분석을 제공하기 위한 시스템입니다. 모듈형 아키텍처(tracego-server, tracego-core, tracego-stand, tracego-wheel)로 컴포넌트를 설계하여 서버 성능 오버헤드 최소화에 주안점을 두었습니다.",
        achievements: [
            "연동 대상 애플리케이션 모니터링 시, 수집 성능 오버헤드 경감을 위해 핵심 비즈니스 로직 라이브러리 모듈화 패키징 구현",
            "리눅스 호스트 시스템 자원 통계 수집 시, 실시간 데이터 통계 핸들러 구축 및 주기적 소켓/API 송수신 성능 제어 최적화",
            "트래픽 폭증으로 인한 대규모 자원 데이터 적재 시, Redis 인메모리 버퍼링 레이어 연동으로 서버 영속화 DB 부하 분산 및 안정화"
        ],
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
        period: "2025.07 - 2025.08 (개인 프로젝트)",
        role: "단독 기획 및 전체 아키텍처 구현",
        techStack: ["Electron", "React", "TypeScript", "LLM (Claude, GPT)", "SQLite", "macOS"],
        description: "Claude 및 GPT와 같은 다양한 LLM API를 연동하여 일상 대화가 가능하고, 파일 조작이나 메일 전송 등 사용자 정의 플러그인을 연결하여 다양한 작업을 자동화할 수 있는 macOS 전용 AI 데스크톱 어시스턴트 애플리케이션입니다. Electron 기반으로 React와 TypeScript를 사용하여 인터페이스를 구축하고 SQLite를 로컬 저장소로 사용해 상태를 보관합니다.",
        achievements: [
            "macOS 네이티브 데스크톱 환경 구축 시, Electron 프레임워크와 React+TypeScript 구조 설계로 경량 콘솔 레이아웃 구현 및 반응 속도 향상",
            "사용자 맞춤형 로컬 제어 시, LLM Function Calling 및 커스텀 플러그인 연계로 파일 IO 및 SMTP 메일 등 OS 동작 자동화 구현",
            "로컬 세션 로그 및 설정 메타데이터 보관 시, SQLite 임베디드 파일 DB 적용으로 대용량 세션 데이터 로컬 영속화 속도 최적화"
        ],
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
            
            <!-- LLMs -->
            <rect x="435" y="40" width="120" height="40" rx="6" fill="rgba(244, 63, 94, 0.1)" stroke="#F43F5E" stroke-width="1.5"/>
            <text x="495" y="64" fill="#F8FAFC" font-size="10" font-family="Outfit" font-weight="bold" text-anchor="middle">LLM (Claude / GPT)</text>
            
            <!-- Custom Plugins -->
            <rect x="435" y="120" width="120" height="40" rx="6" fill="rgba(59, 130, 246, 0.1)" stroke="#3B82F6" stroke-width="1.5"/>
            <text x="495" y="144" fill="#F8FAFC" font-size="10" font-family="Outfit" font-weight="bold" text-anchor="middle">Custom Plugins</text>
            
            <!-- Connection to DB -->
            <path d="M555 60 H590 V100" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3 3"/>
            <path d="M555 140 H590 V100" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3 3"/>
            <path d="M590 100 H600" stroke="#94A3B8" stroke-width="1.5"/>
            <polygon points="600,100 592,95 592,105" fill="#94A3B8"/>
            
            <!-- SQLite -->
            <rect x="600" y="80" width="80" height="40" rx="6" fill="rgba(245, 158, 11, 0.1)" stroke="#F59E0B" stroke-width="1.5"/>
            <text x="640" y="104" fill="#F8FAFC" font-size="10" font-family="Outfit" font-weight="bold" text-anchor="middle">SQLite</text>
        </svg>
        `
    }
};

/* ==========================================================================
   Typing Effect for Hero Title
   ========================================================================== */
const typingPhrases = [
    "안정적인 운영과 효율적인 성능 관리를 추구합니다.",
    "사용자 요구사항에 맞춘 유연한 서비스를 구축합니다.",
    "Redis 캐시 처리와 PostgreSQL 쿼리 최적화에 강점을 가집니다.",
    "일정을 책임지고 준수하여 동료들의 신뢰를 얻습니다."
];

let phraseIndex = 0;
let characterIndex = 0;
let currentPhrase = "";
let isDeleting = false;
const typingTextElement = document.getElementById("typing-text");

function typeAnimation() {
    const fullPhrase = typingPhrases[phraseIndex];
    
    if (isDeleting) {
        currentPhrase = fullPhrase.substring(0, characterIndex - 1);
        characterIndex--;
    } else {
        currentPhrase = fullPhrase.substring(0, characterIndex + 1);
        characterIndex++;
    }
    
    if (typingTextElement) {
        typingTextElement.textContent = currentPhrase;
    }
    
    let typingSpeed = 100;
    if (isDeleting) {
        typingSpeed = 50;
    }
    
    if (!isDeleting && characterIndex === fullPhrase.length) {
        typingSpeed = 2500; // Pause at end of phrase
        isDeleting = true;
    } else if (isDeleting && characterIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % typingPhrases.length;
        typingSpeed = 500; // Pause before typing next phrase
    }
    
    setTimeout(typeAnimation, typingSpeed);
}

/* ==========================================================================
   Project Filter Logic
   ========================================================================== */
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Update active class in buttons
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        
        const filterValue = button.getAttribute("data-filter");
        
        projectCards.forEach(card => {
            const cardCategory = card.getAttribute("data-category");
            
            if (filterValue === "all" || cardCategory === filterValue) {
                card.style.display = "flex";
                // Force a repaint for animation
                setTimeout(() => {
                    card.style.opacity = "1";
                    card.style.transform = "scale(1)";
                }, 50);
            } else {
                card.style.opacity = "0";
                card.style.transform = "scale(0.95)";
                setTimeout(() => {
                    card.style.display = "none";
                }, 300);
            }
        });
    });
});

/* ==========================================================================
   Theme Switcher Logic
   ========================================================================== */
const themeToggleBtn = document.getElementById("theme-toggle");

function setTheme(theme) {
    if (theme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        localStorage.setItem("theme", "light");
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");
    }
}

// Initial Theme Check
const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "light") {
    setTheme("light");
} else if (savedTheme === "dark") {
    setTheme("dark");
} else {
    // Default to OS setting
    setTheme(systemPrefersDark ? "dark" : "light");
}

themeToggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("dark-theme")) {
        setTheme("light");
    } else {
        setTheme("dark");
    }
});

/* ==========================================================================
   Scroll Events (Indicator, Reveal & Header shrink)
   ========================================================================== */
const scrollIndicator = document.getElementById("scroll-indicator");
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    // Scroll progress bar
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    if (scrollIndicator) {
        scrollIndicator.style.width = scrolled + "%";
    }
    
    // Header shrink
    if (window.scrollY > 50) {
        header.style.padding = "0.5rem 0";
        header.style.boxShadow = "var(--shadow-md)";
    } else {
        header.style.padding = "0";
        header.style.boxShadow = "none";
    }
});

// Scroll Reveal using Intersection Observer
const revealElements = document.querySelectorAll(".scroll-reveal");

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
        }
    });
}, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
});

revealElements.forEach(el => revealObserver.observe(el));

/* ==========================================================================
   Mobile Menu Logic
   ========================================================================== */
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-link");

mobileMenuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    // Toggle menu icon between bars and times
    const icon = mobileMenuBtn.querySelector("i");
    if (icon.classList.contains("fa-bars")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
    } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
    }
});

// Close mobile menu when nav link is clicked
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
    });
});

/* ==========================================================================
   Details Modal Logic
   ========================================================================== */
const modal = document.getElementById("project-modal");
const modalBody = document.getElementById("modal-body-content");

function openProjectModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;
    
    let techBadges = "";
    data.techStack.forEach(tech => {
        techBadges += `<span>${tech}</span>`;
    });
    
    let achievementsList = "";
    data.achievements.forEach(ach => {
        achievementsList += `<li>${ach}</li>`;
    });

    let troubleshootingSection = "";
    if (data.troubleshooting) {
        let troublesList = "";
        data.troubleshooting.forEach(t => {
            troublesList += `
                <div class="trouble-item" style="margin-bottom: 1.5rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 1rem;">
                    <h5 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: baseline; gap: 0.5rem;">
                        ${t.title}
                    </h5>
                    <ul style="list-style: none; padding-left: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.92rem; color: var(--text-secondary);">
                        <li><strong style="color: var(--text-primary); font-weight: 600;">• 현상 (Problem):</strong> ${t.problem}</li>
                        <li><strong style="color: var(--text-primary); font-weight: 600;">• 원인 (Cause):</strong> ${t.cause}</li>
                        <li><strong style="color: var(--text-primary); font-weight: 600;">• 해결 (Action):</strong> ${t.action}</li>
                        <li><strong style="color: var(--text-primary); font-weight: 600;">• 결과 (Result):</strong> ${t.result}</li>
                    </ul>
                </div>
            `;
        });
        troubleshootingSection = `
            <div class="modal-section">
                <h4>Troubleshooting (기술적 문제 해결 및 아키텍처 고민)</h4>
                <div class="troubleshooting-list" style="margin-top: 1rem;">
                    ${troublesList}
                </div>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        ${data.githubLink ? `<a href="${data.githubLink}" target="_blank" class="modal-github-link"><i class="fab fa-github"></i> GitHub</a>` : ""}
        <h3 class="modal-title">${data.title}</h3>
        <p class="modal-tagline">${data.tagline}</p>
        
        <div class="modal-meta-grid">
            <div class="modal-meta-item">
                <span>프로젝트 기간</span>
                <strong>${data.period}</strong>
            </div>
            <div class="modal-meta-item">
                <span>담당 역할</span>
                <strong>${data.role}</strong>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>프로젝트 개요</h4>
            <p>${data.description}</p>
        </div>
        
        <div class="modal-section">
            <h4>핵심 성과 및 기여도</h4>
            <ul class="achievements-list">
                ${achievementsList}
            </ul>
        </div>

        ${troubleshootingSection}
        
        <div class="modal-section">
            <h4>사용 기술 스택</h4>
            <div class="project-tech-stack">
                ${techBadges}
            </div>
        </div>
        
        <div class="modal-section">
            <h4>시스템 아키텍처 다이어그램</h4>
            <div class="arch-diagram">
                ${data.architecture}
            </div>
        </div>
    `;
    
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
}

function closeProjectModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

// Close modal when clicking outside content area
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeProjectModal();
    }
});

async function updateGitHubStats() {
    const username = "oxxultus";
    const cacheKey = "github_stats_cache";
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

    const reposNumElement = document.querySelector(".stat-item:nth-child(2) .stat-number");
    const commitsNumElement = document.querySelector(".stat-item:nth-child(3) .stat-number");

    // LocalStorage Caching Helper
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheKey + "_time");

    if (cachedData && cachedTime && (Date.now() - cachedTime < cacheDuration)) {
        const stats = JSON.parse(cachedData);
        if (reposNumElement) reposNumElement.textContent = stats.repos + "+";
        if (commitsNumElement) commitsNumElement.textContent = stats.commits.toLocaleString() + "+";
        return;
    }

    try {
        // Fetch public repositories count
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user info");
        const userData = await userResponse.json();
        const reposCount = userData.public_repos;

        // Fetch commits count
        const commitsResponse = await fetch(`https://api.github.com/search/commits?q=author:${username}`);
        if (!commitsResponse.ok) throw new Error("Failed to fetch commits info");
        const commitsData = await commitsResponse.json();
        const commitsCount = commitsData.total_count;

        // Update DOM
        if (reposNumElement) reposNumElement.textContent = reposCount + "+";
        if (commitsNumElement) commitsNumElement.textContent = commitsCount.toLocaleString() + "+";

        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({ repos: reposCount, commits: commitsCount }));
        localStorage.setItem(cacheKey + "_time", Date.now());
    } catch (error) {
        console.error("Failed to fetch real-time GitHub stats, using defaults:", error);
        if (reposNumElement) reposNumElement.textContent = "9+";
        if (commitsNumElement) commitsNumElement.textContent = "736+";
    }
}

/* ==========================================================================
   Startup Configuration
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Start Typing Animation
    setTimeout(typeAnimation, 1000);
    // Fetch GitHub Live Stats
    updateGitHubStats();

    // Contact Form Mailto Integration
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const message = document.getElementById("message").value;

            // Construct mailto details
            const subject = encodeURIComponent(`[Yeongjin.Dev] ${name}님으로부터의 포트폴리오 문의`);
            const body = encodeURIComponent(
                `이름 / 회사명: ${name}\n` +
                `보낸사람 이메일: ${email}\n\n` +
                `[문의 내용]\n${message}`
            );

            const mailtoUrl = `mailto:oxxultus@gmail.com?subject=${subject}&body=${body}`;
            
            // Redirect browser to mailto link
            window.location.href = mailtoUrl;

            alert("이메일 클라이언트가 실행되었습니다. 메일 작성 창에서 전송 버튼을 누르면 김영진님에게 메일이 발송됩니다.");
        });
    }

    // 1. Resume PDF Download Button Event Listener (No Troubleshooting)
    const resumeDownloadBtn = document.getElementById("resume-download");
    if (resumeDownloadBtn) {
        resumeDownloadBtn.addEventListener("click", () => {
            const originalContent = resumeDownloadBtn.innerHTML;
            resumeDownloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>다운로드 중...</span>';
            resumeDownloadBtn.disabled = true;

            try {
                const name = "김영진";
                const subtitle = "안정성과 성능을 우선시하는 백엔드 개발자";

                // Extract About Me content
                const aboutCards = document.querySelectorAll("#about .about-card");
                let aboutContent = "";
                aboutCards.forEach(card => {
                    const title = card.querySelector("h3")?.textContent.trim() || "";
                    const desc = card.querySelector("p")?.textContent.trim() || "";
                    aboutContent += `
                        <div style="margin-bottom: 12px;">
                            <h3 style="font-size: 12px; font-weight: 700; color: #0F172A; margin: 0 0 4px 0;">${title}</h3>
                            <p style="margin: 0; line-height: 1.5; color: #475569;">${desc}</p>
                        </div>
                    `;
                });

                // Extract Technical Skills content
                const skillCategories = document.querySelectorAll("#skills .skills-category:not(.cert-category)");
                let skillsContent = "";
                skillCategories.forEach(cat => {
                    const title = cat.querySelector("h3")?.textContent.trim() || "";
                    const badges = cat.querySelectorAll(".badge-title");
                    const badgeNames = Array.from(badges).map(b => b.textContent.trim()).join(", ");
                    skillsContent += `
                        <div style="margin-bottom: 8px; line-height: 1.5;">
                            <strong style="color: #0F172A; font-weight: 700;">${title}:</strong> 
                            <span style="color: #475569;">${badgeNames}</span>
                        </div>
                    `;
                });

                // Extract Certifications content
                const certItems = document.querySelectorAll("#skills .cert-item");
                let certsContent = "";
                certItems.forEach(item => {
                    const certName = item.querySelector(".cert-name")?.textContent.trim() || "";
                    const certMeta = item.querySelector(".cert-meta")?.textContent.trim() || "";
                    certsContent += `
                        <div style="margin-bottom: 6px; line-height: 1.5; color: #334155;">
                            <strong style="color: #0F172A; font-weight: 700;">${certName}</strong> - <span>${certMeta}</span>
                        </div>
                    `;
                });

                // Construct Projects content for Resume (EXCLUDING Troubleshooting)
                let resumeProjectsContent = "";
                const projectKeys = ['velo', 'tracego', 'liminal'];
                projectKeys.forEach(key => {
                    const data = projectData[key];
                    if (!data) return;
                    
                    let achievementsHtml = "";
                    data.achievements.forEach(ach => {
                        achievementsHtml += `<li style="margin-bottom: 3px;">${ach}</li>`;
                    });

                    const typeLabel = key === 'liminal' ? '개인 프로젝트' : '팀 프로젝트';
                    
                    resumeProjectsContent += `
                        <div class="resume-project-item">
                            <div class="resume-project-header">
                                <h3 class="resume-project-title">${data.title} <span class="resume-project-type">${typeLabel}</span></h3>
                                <span class="resume-project-period">${data.period}</span>
                            </div>
                            <p class="resume-project-tagline">${data.tagline}</p>
                            <p class="resume-project-desc">${data.description}</p>
                            <ul class="resume-project-bullets">
                                <li><strong style="color: #0F172A;">담당 역할</strong>: ${data.role}</li>
                                ${achievementsHtml}
                            </ul>
                            <div class="resume-project-tech">
                                <strong style="color: #475569;">사용 기술:</strong> <span>${data.techStack.join(", ")}</span>
                            </div>
                        </div>
                    `;
                });

                const htmlContent = `
                    <div class="resume-container">
                        <style>
                            .resume-container {
                                font-family: 'Outfit', 'Noto Sans KR', sans-serif;
                                color: #0F172A;
                                background: #ffffff;
                                line-height: 1.5;
                                padding: 15px;
                            }
                            .resume-header {
                                border-bottom: 2px solid #0F172A;
                                padding-bottom: 12px;
                                margin-bottom: 18px;
                            }
                            .resume-header h1 {
                                font-size: 26px;
                                font-weight: 800;
                                margin: 0 0 4px 0;
                                color: #0F172A;
                            }
                            .resume-subtitle {
                                font-size: 14px;
                                font-weight: 600;
                                color: #059669;
                                margin: 0 0 8px 0;
                            }
                            .resume-contacts {
                                display: flex;
                                gap: 20px;
                                font-size: 11px;
                                color: #475569;
                            }
                            .resume-section {
                                margin-bottom: 18px;
                            }
                            .resume-section-title {
                                font-size: 13px;
                                font-weight: 700;
                                color: #0F172A;
                                border-bottom: 1px solid #CBD5E1;
                                padding-bottom: 4px;
                                margin: 0 0 8px 0;
                                text-transform: uppercase;
                                letter-spacing: 0.05em;
                            }
                            .resume-section-content {
                                font-size: 11.5px;
                                color: #334155;
                            }
                            .resume-project-item {
                                margin-bottom: 14px;
                                page-break-inside: avoid;
                                break-inside: avoid;
                            }
                            .resume-project-header {
                                display: flex;
                                justify-content: space-between;
                                align-items: baseline;
                                margin-bottom: 2px;
                            }
                            .resume-project-title {
                                font-size: 13px;
                                font-weight: 700;
                                color: #0F172A;
                                margin: 0;
                            }
                            .resume-project-type {
                                font-size: 9px;
                                font-weight: 600;
                                color: #2563EB;
                                background: #EFF6FF;
                                padding: 1px 5px;
                                border-radius: 4px;
                                margin-left: 5px;
                            }
                            .resume-project-period {
                                font-size: 10px;
                                color: #64748B;
                            }
                            .resume-project-tagline {
                                font-size: 11px;
                                font-weight: 600;
                                color: #059669;
                                margin: 0 0 3px 0;
                            }
                            .resume-project-desc {
                                font-size: 11.5px;
                                color: #475569;
                                margin: 0 0 4px 0;
                                line-height: 1.5;
                            }
                            .resume-project-bullets {
                                list-style-type: disc;
                                padding-left: 15px;
                                margin: 0 0 6px 0;
                            }
                            .resume-project-bullets li {
                                font-size: 11.5px;
                                margin-bottom: 2px;
                                color: #334155;
                                line-height: 1.5;
                            }
                            .resume-project-bullets li strong {
                                color: #0F172A;
                            }
                            .resume-project-tech {
                                font-size: 10px;
                                color: #64748B;
                            }
                            .resume-project-tech strong {
                                color: #475569;
                            }
                        </style>
                        <div class="resume-header">
                            <h1>${name}</h1>
                            <p class="resume-subtitle">${subtitle}</p>
                            <div class="resume-contacts">
                                <span>이메일: oxxultus@gmail.com</span>
                                <span>깃허브: github.com/oxxultus</span>
                                <span>위치: 대한민국</span>
                            </div>
                        </div>

                        <div class="resume-section">
                            <h2 class="resume-section-title">소개 (About Me)</h2>
                            <div class="resume-section-content">
                                ${aboutContent}
                            </div>
                        </div>

                        <div class="resume-section">
                            <h2 class="resume-section-title">기술 스택 (Technical Skills)</h2>
                            <div class="resume-section-content">
                                ${skillsContent}
                            </div>
                        </div>

                        <div class="resume-section">
                            <h2 class="resume-section-title">자격증 (Certifications)</h2>
                            <div class="resume-section-content">
                                ${certsContent}
                            </div>
                        </div>

                        <div class="resume-section" style="page-break-before: always; break-before: page;">
                            <h2 class="resume-section-title">프로젝트 경험 (Projects)</h2>
                            <div class="resume-section-content">
                                ${resumeProjectsContent}
                            </div>
                        </div>
                    </div>
                `;

                const opt = {
                    margin:       12,
                    filename:     '김영진_이력서.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { 
                        scale: 2.5, 
                        useCORS: true,
                        letterRendering: true,
                        logging: false
                    },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                html2pdf().set(opt).from(htmlContent).save().then(() => {
                    resumeDownloadBtn.innerHTML = originalContent;
                    resumeDownloadBtn.disabled = false;
                }).catch(err => {
                    console.error("Resume PDF generation failed:", err);
                    resumeDownloadBtn.innerHTML = originalContent;
                    resumeDownloadBtn.disabled = false;
                });
            } catch (err) {
                console.error("Error gathering resume values:", err);
                resumeDownloadBtn.innerHTML = originalContent;
                resumeDownloadBtn.disabled = false;
            }
        });
    }

    // 2. Portfolio PDF Download Button Event Listener (Includes Troubleshooting & Architecture Diagram)
    const portfolioDownloadBtn = document.getElementById("portfolio-download");
    if (portfolioDownloadBtn) {
        portfolioDownloadBtn.addEventListener("click", () => {
            const originalContent = portfolioDownloadBtn.innerHTML;
            portfolioDownloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>다운로드 중...</span>';
            portfolioDownloadBtn.disabled = true;

            try {
                const name = "김영진";
                const subtitle = "안정성과 성능을 우선시하는 백엔드 개발자";

                // Construct Projects content for Portfolio (INCLUDING Troubleshooting & Architecture Diagram)
                let portfolioProjectsContent = "";
                const projectKeys = ['velo', 'tracego', 'liminal'];
                projectKeys.forEach((key, index) => {
                    const data = projectData[key];
                    if (!data) return;
                    
                    let achievementsHtml = "";
                    data.achievements.forEach(ach => {
                        achievementsHtml += `<li style="margin-bottom: 3px;">${ach}</li>`;
                    });

                    const typeLabel = key === 'liminal' ? '개인 프로젝트' : '팀 프로젝트';

                    let troubleshootingHtml = "";
                    if (data.troubleshooting) {
                        let troublesListHtml = "";
                        data.troubleshooting.forEach(t => {
                            troublesListHtml += `
                                <div style="margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid;">
                                    <div style="font-weight: 700; color: #334155; margin-bottom: 2px;">${t.title}</div>
                                    <div style="margin-left: 8px; line-height: 1.45; font-size: 11px; color: #475569;">
                                        • <strong>현상 (Problem)</strong>: ${t.problem}<br>
                                        • <strong>원인 (Cause)</strong>: ${t.cause}<br>
                                        • <strong>해결 (Action)</strong>: ${t.action}<br>
                                        • <strong>결과 (Result)</strong>: ${t.result}
                                    </div>
                                </div>
                            `;
                        });
                        troubleshootingHtml = `
                            <div style="margin-top: 10px; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                                <strong style="font-size: 11px; color: #0F172A; text-decoration: underline;">Troubleshooting (기술적 문제 해결 및 아키텍처 고민)</strong>
                            </div>
                            <div style="margin-left: 10px; font-size: 11px;">
                                ${troublesListHtml}
                            </div>
                        `;
                    }

                    // Architecture Diagram HTML
                    let architectureHtml = "";
                    if (data.architecture) {
                        architectureHtml = `
                            <div style="margin-top: 12px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">
                                <strong style="font-size: 11px; color: #0F172A; text-decoration: underline; display: block; margin-bottom: 6px;">System Architecture Diagram</strong>
                                <div style="background: #090D14; border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 12px; text-align: center;">
                                    ${data.architecture}
                                </div>
                            </div>
                        `;
                    }

                    // Apply page break for second and subsequent projects
                    const pageBreakStyle = index > 0 ? 'style="page-break-before: always; break-before: page; margin-top: 20px;"' : 'style="margin-top: 10px;"';

                    portfolioProjectsContent += `
                        <div class="resume-project-item" ${pageBreakStyle}>
                            <div class="resume-project-header">
                                <h3 class="resume-project-title">${data.title} <span class="resume-project-type">${typeLabel}</span></h3>
                                <span class="resume-project-period">${data.period}</span>
                            </div>
                            <p class="resume-project-tagline">${data.tagline}</p>
                            <p class="resume-project-desc">${data.description}</p>
                            <ul class="resume-project-bullets">
                                <li><strong style="color: #0F172A;">담당 역할</strong>: ${data.role}</li>
                                ${achievementsHtml}
                            </ul>
                            <div class="resume-project-tech">
                                <strong style="color: #475569;">사용 기술:</strong> <span>${data.techStack.join(", ")}</span>
                            </div>
                            ${architectureHtml}
                            ${troubleshootingHtml}
                        </div>
                    `;
                });

                const htmlContent = `
                    <div class="resume-container">
                        <style>
                            .resume-container {
                                font-family: 'Outfit', 'Noto Sans KR', sans-serif;
                                color: #0F172A;
                                background: #ffffff;
                                line-height: 1.5;
                                padding: 15px;
                            }
                            .resume-header {
                                border-bottom: 2px solid #10B981; /* Green border for portfolio branding */
                                padding-bottom: 12px;
                                margin-bottom: 18px;
                            }
                            .resume-header h1 {
                                font-size: 26px;
                                font-weight: 800;
                                margin: 0 0 4px 0;
                                color: #0F172A;
                            }
                            .resume-subtitle {
                                font-size: 14px;
                                font-weight: 600;
                                color: #059669;
                                margin: 0 0 8px 0;
                            }
                            .resume-contacts {
                                display: flex;
                                gap: 20px;
                                font-size: 11px;
                                color: #475569;
                            }
                            .resume-section {
                                margin-bottom: 18px;
                            }
                            .resume-section-title {
                                font-size: 13px;
                                font-weight: 700;
                                color: #0F172A;
                                border-bottom: 1px solid #CBD5E1;
                                padding-bottom: 4px;
                                margin: 0 0 8px 0;
                                text-transform: uppercase;
                                letter-spacing: 0.05em;
                            }
                            .resume-section-content {
                                font-size: 11.5px;
                                color: #334155;
                            }
                            .resume-project-item {
                                margin-bottom: 20px;
                            }
                            .resume-project-header {
                                display: flex;
                                justify-content: space-between;
                                align-items: baseline;
                                margin-bottom: 2px;
                            }
                            .resume-project-title {
                                font-size: 13px;
                                font-weight: 700;
                                color: #0F172A;
                                margin: 0;
                            }
                            .resume-project-type {
                                font-size: 9px;
                                font-weight: 600;
                                color: #10B981;
                                background: #ECFDF5;
                                padding: 1px 5px;
                                border-radius: 4px;
                                margin-left: 5px;
                            }
                            .resume-project-period {
                                font-size: 10px;
                                color: #64748B;
                            }
                            .resume-project-tagline {
                                font-size: 11px;
                                font-weight: 600;
                                color: #059669;
                                margin: 0 0 3px 0;
                            }
                            .resume-project-desc {
                                font-size: 11.5px;
                                color: #475569;
                                margin: 0 0 4px 0;
                                line-height: 1.5;
                            }
                            .resume-project-bullets {
                                list-style-type: disc;
                                padding-left: 15px;
                                margin: 0 0 6px 0;
                            }
                            .resume-project-bullets li {
                                font-size: 11.5px;
                                margin-bottom: 2px;
                                color: #334155;
                                line-height: 1.5;
                            }
                            .resume-project-bullets li strong {
                                color: #0F172A;
                            }
                            .resume-project-tech {
                                font-size: 10px;
                                color: #64748B;
                            }
                            .resume-project-tech strong {
                                color: #475569;
                            }
                            .arch-svg {
                                max-width: 100%;
                                height: auto;
                                display: block;
                                margin: 0 auto;
                            }
                        </style>
                        <div class="resume-header">
                            <h1>${name}</h1>
                            <p class="resume-subtitle">${subtitle} - 프로젝트 포트폴리오 (Project Portfolio)</p>
                            <div class="resume-contacts">
                                <span>이메일: oxxultus@gmail.com</span>
                                <span>깃허브: github.com/oxxultus</span>
                                <span>위치: 대한민국</span>
                            </div>
                        </div>

                        <div class="resume-section">
                            <h2 class="resume-section-title">상세 프로젝트 및 기술 아키텍처</h2>
                            <div class="resume-section-content">
                                ${portfolioProjectsContent}
                            </div>
                        </div>
                    </div>
                `;

                const opt = {
                    margin:       12,
                    filename:     '김영진_포트폴리오.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { 
                        scale: 2.5, 
                        useCORS: true,
                        letterRendering: true,
                        logging: false
                    },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                html2pdf().set(opt).from(htmlContent).save().then(() => {
                    portfolioDownloadBtn.innerHTML = originalContent;
                    portfolioDownloadBtn.disabled = false;
                }).catch(err => {
                    console.error("Portfolio PDF generation failed:", err);
                    portfolioDownloadBtn.innerHTML = originalContent;
                    portfolioDownloadBtn.disabled = false;
                });
            } catch (err) {
                console.error("Error gathering portfolio values:", err);
                portfolioDownloadBtn.innerHTML = originalContent;
                portfolioDownloadBtn.disabled = false;
            }
        });
    }
});
