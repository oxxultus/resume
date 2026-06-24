/* ==========================================================================
   Helper Functions for Rendering Projects
   ========================================================================== */

/**
 * 썸네일 데이터를 판별하여 적절한 HTML을 반환합니다.
 * - 태그 형식의 HTML 문자열은 그대로 반환 (기존 코드 아트 등)
 * - 이미지 경로, Base64 등의 이미지 리소스는 <img> 태그 반환
 * - 그 외 텍스트는 코드 블록 구조로 가공하여 반환
 */
function renderThumbnail(thumbnailData) {
    if (!thumbnailData) return "";
    const str = String(thumbnailData).trim();
    
    if (str.startsWith("<")) {
        return str;
    }
    
    if (str.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || str.startsWith("data:image/")) {
        return `<img src="${str}" alt="Thumbnail" class="project-img-thumb" style="width: 100%; height: 100%; object-fit: cover; border-top-left-radius: inherit; border-top-right-radius: inherit;" />`;
    }
    
    return `<div class="code-art"><pre><code>${str}</code></pre></div>`;
}

/**
 * 아키텍처 다이어그램 데이터를 판별하여 적절한 HTML을 반환합니다.
 * - <svg로 시작하는 데이터는 SVG 코드로 직접 삽입
 * - 그 외 일반 이미지 경로나 Base64 데이터는 <img> 태그로 래핑하여 렌더링
 */
function renderArchitecture(archData, isForPdf = false) {
    if (!archData) return "";
    const str = String(archData).trim();
    
    let contentHtml = "";
    if (str.startsWith("<svg")) {
        contentHtml = str;
    } else {
        contentHtml = `<img src="${str}" alt="System Architecture" class="arch-img" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 4px;" />`;
    }
    
    if (isForPdf) {
        return `
            <div style="margin-top: 12px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">
                <strong style="font-size: 11px; color: #0F172A; text-decoration: underline; display: block; margin-bottom: 6px;">System Architecture Diagram</strong>
                <div style="background: #090D14; border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 12px; text-align: center;">
                    ${contentHtml}
                </div>
            </div>
        `;
    } else {
        return contentHtml;
    }
}

/**
 * projectData 전역 변수를 파싱하여 메인 화면의 project-grid 엘리먼트에
 * 동적으로 프로젝트 카드를 렌더링합니다.
 */
function initProjects() {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;
    
    let gridHtml = "";
    Object.keys(projectData).forEach(key => {
        const data = projectData[key];
        const isPersonal = data.category === 'personal';
        const typeLabel = isPersonal ? 'Personal Project' : 'Team Project';
        const tagClass = isPersonal ? 'tag-personal' : 'tag-team';
        
        let techStackHtml = "";
        data.techStack.forEach(tech => {
            techStackHtml += `<span>${tech}</span>`;
        });
        
        const thumbnailHtml = renderThumbnail(data.thumbnail);
        const hasTroubleshooting = data.troubleshooting && data.troubleshooting.length > 0;
        const buttonText = hasTroubleshooting ? '트러블슈팅 및 상세 보기' : '상세 보기';
        
        gridHtml += `
            <div class="project-card glass" data-category="${data.category || 'team'}">
                <div class="project-thumbnail">
                    ${thumbnailHtml}
                    <span class="project-tag ${tagClass}">${typeLabel}</span>
                </div>
                <div class="project-info">
                    <h3>${data.title}</h3>
                    <p class="project-tagline">${data.tagline}</p>
                    <p class="project-desc">${data.description}</p>
                    <div class="project-tech-stack">
                        ${techStackHtml}
                    </div>
                    <button class="btn-detail" onclick="openProjectModal('${key}')">${buttonText} <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = gridHtml;
}

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
function initProjectFilters() {
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
}

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
    if (data.troubleshooting && data.troubleshooting.length > 0) {
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
    
    let architectureSection = "";
    if (data.architecture) {
        architectureSection = `
            <div class="modal-section">
                <h4>시스템 아키텍처 다이어그램</h4>
                <div class="arch-diagram">
                    ${renderArchitecture(data.architecture)}
                </div>
            </div>
        `;
    }
    
    // Update the persistent header row (never wiped by innerHTML)
    document.getElementById("modal-header-title").textContent = data.title;
    const actionsEl = document.getElementById("modal-header-actions");
    actionsEl.innerHTML = data.githubLink
        ? `<a href="${data.githubLink}" target="_blank" class="modal-github-link"><i class="fab fa-github"></i> Repository</a>`
        : "";

    // Inject only the body content (tagline + sections)
    modalBody.innerHTML = `
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
        
        ${architectureSection}
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
    // 동적 프로젝트 카드 및 필터 초기화
    initProjects();
    initProjectFilters();

    // Start Typing Animation
    setTimeout(typeAnimation, 1000);
    // Fetch GitHub Live Stats
    updateGitHubStats();

    // Modal Close Button Event (static element, safe addEventListener)
    const modalCloseBtn = document.getElementById("modal-close-btn");
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", closeProjectModal);
    }

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
            resumeDownloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
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
                const projectKeys = ['velo', 'liminal'];
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
                        scale: 2,
                        useCORS: true,
                        letterRendering: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        scrollX: 0,
                        scrollY: 0
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
            portfolioDownloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            portfolioDownloadBtn.disabled = true;

            try {
                const name = "김영진";
                const subtitle = "안정성과 성능을 우선시하는 백엔드 개발자";

                // Construct Projects content for Portfolio (INCLUDING Troubleshooting & Architecture Diagram)
                let portfolioProjectsContent = "";
                const projectKeys = Object.keys(projectData);
                projectKeys.forEach((key, index) => {
                    const data = projectData[key];
                    if (!data) return;
                    
                    let achievementsHtml = "";
                    data.achievements.forEach(ach => {
                        achievementsHtml += `<li style="margin-bottom: 3px;">${ach}</li>`;
                    });

                    const typeLabel = data.category === 'personal' ? '개인 프로젝트' : '팀 프로젝트';

                    let troubleshootingHtml = "";
                    if (data.troubleshooting && data.troubleshooting.length > 0) {
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
                        architectureHtml = renderArchitecture(data.architecture, true);
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
                        scale: 2,
                        useCORS: true,
                        letterRendering: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        scrollX: 0,
                        scrollY: 0
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
