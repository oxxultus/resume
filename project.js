(function () {
    const themeToggle = document.getElementById("detail-theme-toggle");
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    function applyTheme(theme) {
        document.body.classList.toggle("dark-theme", theme === "dark");
        localStorage.setItem("theme", theme);
        themeToggle.innerHTML = `<i class="fas fa-${theme === "dark" ? "sun" : "moon"}"></i>`;
        themeToggle.setAttribute("aria-label", theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환");
    }

    applyTheme(initialTheme);
    themeToggle.addEventListener("click", () => applyTheme(document.body.classList.contains("dark-theme") ? "light" : "dark"));

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id") || Object.keys(projectData)[0];
    const data = projectData[projectId];
    const root = document.getElementById("project-detail");

    if (!data) {
        root.innerHTML = `<section class="empty-project"><p>포트폴리오 항목을 찾을 수 없습니다.</p><a href="index.html#projects">포트폴리오 목록으로 돌아가기</a></section>`;
        return;
    }

    document.title = `${data.title} | Oxxultus`;
    document.getElementById("topbar-title").textContent = data.title;
    const githubLink = document.getElementById("github-link");
    if (data.githubLink) githubLink.href = data.githubLink;
    else githubLink.hidden = true;

    const tech = (data.techStack || []).map(item => `<span>${item}</span>`).join("");
    const achievements = (data.achievements || []).map(item => `<li><i class="fas fa-check"></i><span>${item}</span></li>`).join("");
    const troubleshooting = (data.troubleshooting || []).length
        ? data.troubleshooting.map((item, index) => `
            <article class="trouble-card">
                <button class="trouble-toggle" aria-expanded="${index === 0}">
                    <span><small>Case ${String(index + 1).padStart(2, "0")}</small>${item.title.replace(/^\d+\.\s*/, "")}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="trouble-body" ${index === 0 ? "" : "hidden"}>
                    <div><strong>문제</strong><p>${item.problem}</p></div>
                    <div><strong>원인</strong><p>${item.cause}</p></div>
                    <div><strong>해결</strong><p>${item.action}</p></div>
                    <div class="result"><strong>결과</strong><p>${item.result}</p></div>
                </div>
            </article>`).join("")
        : `<div class="empty-state">정리 중인 트러블슈팅이 없습니다.</div>`;

    const thumbnail = String(data.thumbnail || "").trim();
    const cover = thumbnail.startsWith("<") ? thumbnail : `<img src="${thumbnail}" alt="${data.title} 프로젝트 화면">`;
    const architecture = data.architecture ? `<div class="architecture-frame">${data.architecture}</div>` : `<div class="empty-state">아키텍처 자료를 준비하고 있습니다.</div>`;

    root.innerHTML = `
        <section id="overview" class="project-hero">
            <div class="project-label">${data.category === "personal" ? "Personal project" : "Team project"}</div>
            <h1>${data.title}</h1>
            <p class="project-tagline">${data.tagline}</p>
            <div class="project-meta"><span><i class="far fa-calendar"></i>${data.period}</span><span><i class="far fa-user"></i>${data.role}</span></div>
            <div class="project-cover">${cover}</div>
            <p class="project-summary">${data.description}</p>
            <div class="tech-list">${tech}</div>
        </section>
        <section id="contribution" class="detail-section">
            <div class="section-heading"><span>Contribution</span><h2>기여와 성과</h2></div>
            <ul class="achievement-list">${achievements}</ul>
        </section>
        <section id="architecture" class="detail-section">
            <div class="section-heading"><span>System design</span><h2>아키텍처</h2></div>
            <p class="section-lead">구성 요소의 책임과 데이터 흐름을 한눈에 볼 수 있도록 정리했습니다.</p>
            ${architecture}
        </section>
        <section id="troubleshooting" class="detail-section">
            <div class="section-heading"><span>Problem solving</span><h2>트러블슈팅</h2></div>
            <p class="section-lead">문제의 증상보다 원인을 추적하고, 선택한 해결책이 만든 결과까지 기록했습니다.</p>
            <div class="trouble-list">${troubleshooting}</div>
        </section>
        <section id="retrospective" class="detail-section retrospective">
            <div class="section-heading"><span>Retrospective</span><h2>배운 점과 다음 개선</h2></div>
            <div class="retrospective-grid"><div><strong>이번 프로젝트에서 배운 점</strong><p>기능 구현뿐 아니라 운영 환경의 병목과 실패 조건을 먼저 관찰하는 습관을 얻었습니다.</p></div><div><strong>다음에 더 개선할 점</strong><p>관측 가능성과 자동화된 성능 검증을 초기 설계 단계부터 포함해 문제를 더 일찍 발견하겠습니다.</p></div></div>
        </section>`;

    document.querySelectorAll(".trouble-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const body = button.nextElementSibling;
            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!expanded));
            body.hidden = expanded;
        });
    });

    const initialHashTarget = window.location.hash ? document.querySelector(window.location.hash) : null;
    if (initialHashTarget) {
        requestAnimationFrame(() => {
            const previousScrollBehavior = document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = "auto";
            initialHashTarget.scrollIntoView({ block: "start" });
            syncDetailNav();
            requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = previousScrollBehavior; });
        });
    }

    const menuButton = document.querySelector(".detail-menu");
    const detailSidebar = document.querySelector(".detail-sidebar");
    const detailCloseButton = document.querySelector(".detail-sidebar-close");
    const closeDetailMenu = () => {
        document.body.classList.remove("menu-open");
        menuButton?.setAttribute("aria-expanded", "false");
    };
    menuButton?.addEventListener("click", () => {
        const open = document.body.classList.toggle("menu-open");
        menuButton.setAttribute("aria-expanded", String(open));
    });
    detailCloseButton?.addEventListener("click", closeDetailMenu);
    document.querySelectorAll(".detail-nav a").forEach(link => link.addEventListener("click", closeDetailMenu));
    document.addEventListener("click", event => {
        if (innerWidth > 800 || !document.body.classList.contains("menu-open")) return;
        if (!detailSidebar?.contains(event.target) && !menuButton?.contains(event.target)) closeDetailMenu();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeDetailMenu();
    });

    const detailNavLinks = document.querySelectorAll(".detail-nav a[href^='#']");
    const detailSections = document.querySelectorAll("#project-detail section[id]");
    let scrollFrame = null;

    function syncDetailNav() {
        const marker = window.scrollY + Math.min(window.innerHeight * 0.42, 380);
        let currentId = detailSections[0]?.id;
        detailSections.forEach(section => {
            if (section.offsetTop <= marker) currentId = section.id;
        });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32) {
            currentId = detailSections[detailSections.length - 1]?.id;
        }
        detailNavLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`));
    }

    detailNavLinks.forEach(link => link.addEventListener("click", () => {
        detailNavLinks.forEach(item => item.classList.toggle("active", item === link));
    }));
    window.addEventListener("scroll", () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            syncDetailNav();
            scrollFrame = null;
        });
    }, { passive: true });
    window.addEventListener("hashchange", syncDetailNav);
    window.addEventListener("load", () => requestAnimationFrame(syncDetailNav));
    setTimeout(syncDetailNav, 120);
    syncDetailNav();
})();
