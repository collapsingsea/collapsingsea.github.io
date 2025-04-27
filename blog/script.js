// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 加载动画
    const loadingScreen = document.querySelector('.loading-screen');
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            initFadeElements();
        }, 800);
    }, 2000);

    // 初始化渐入元素
    function initFadeElements() {
        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach(el => {
            el.classList.add('visible');
        });
    }

    // 星空背景
    const starfield = document.getElementById('starfield');
    const starfieldCtx = starfield.getContext('2d');
    let stars = [];
    
    // 调整星空背景大小
    function resizeStarfield() {
        starfield.width = window.innerWidth;
        starfield.height = window.innerHeight;
        initStars();
    }

    window.addEventListener('resize', resizeStarfield);
    resizeStarfield();

    // 初始化星星
    function initStars() {
        stars = [];
        const starCount = Math.floor(window.innerWidth * window.innerHeight / 1000);
        
        for(let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * starfield.width,
                y: Math.random() * starfield.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.05 + 0.02,
                brightness: Math.random() * 0.5 + 0.5,
                color: getRandomStarColor()
            });
        }
    }

    // 随机星星颜色
    function getRandomStarColor() {
        const colors = [
            [255, 255, 255], // 白色
            [173, 216, 230], // 浅蓝
            [255, 182, 193], // 浅粉
            [255, 215, 0]    // 金色
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `rgba(${color[0]}, ${color[1]}, ${color[2]},`;
    }

    // 绘制星空
    function drawStars() {
        starfieldCtx.clearRect(0, 0, starfield.width, starfield.height);
        
        // 绘制星云背景
        const gradient = starfieldCtx.createRadialGradient(
            starfield.width / 2, starfield.height / 2, 0,
            starfield.width / 2, starfield.height / 2, starfield.width * 0.8
        );
        gradient.addColorStop(0, 'rgba(25, 25, 50, 0.2)');
        gradient.addColorStop(0.5, 'rgba(10, 10, 40, 0.1)');
        gradient.addColorStop(1, 'rgba(5, 5, 20, 0)');
        
        starfieldCtx.fillStyle = gradient;
        starfieldCtx.fillRect(0, 0, starfield.width, starfield.height);
        
        // 绘制星星
        stars.forEach(star => {
            const pulseFactor = 0.1 * Math.sin(Date.now() * 0.001 * star.speed * 5) + 0.9;
            const alpha = star.brightness * pulseFactor;
            
            starfieldCtx.beginPath();
            starfieldCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            starfieldCtx.fillStyle = `${star.color} ${alpha})`;
            starfieldCtx.fill();
            
            // 星星移动
            star.y -= star.speed;
            
            // 星星超出屏幕后重新放置
            if (star.y < -10) {
                star.y = starfield.height + 10;
                star.x = Math.random() * starfield.width;
            }
        });
        
        // 偶尔生成新星星
        if (Math.random() < 0.03) {
            const centerX = starfield.width / 2 + (Math.random() - 0.5) * starfield.width * 0.5;
            const centerY = starfield.height / 2 + (Math.random() - 0.5) * starfield.height * 0.5;
            
            stars.push({
                x: centerX,
                y: centerY,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.05 + 0.02,
                brightness: Math.random() * 0.5 + 0.5,
                color: getRandomStarColor()
            });
            
            // 限制星星总数
            if (stars.length > starfield.width * starfield.height / 500) {
                stars.shift();
            }
        }
        
        requestAnimationFrame(drawStars);
    }
    
    drawStars();

    // 粒子跟随鼠标
    const particleCanvas = document.getElementById('particleCanvas');
    const ctx = particleCanvas.getContext('2d');
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;

    // 调整粒子画布大小
    function resizeParticleCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeParticleCanvas);
    resizeParticleCanvas();

    // 鼠标位置监听
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        mouseActive = true;
        
        // 鼠标移动时创建粒子
        createParticles(5);
    });

    document.addEventListener('mouseout', function() {
        mouseActive = false;
    });

    // 创建粒子
    function createParticles(count) {
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 4 + 1;
            const speed = Math.random() * 3 + 1;
            const angle = Math.random() * Math.PI * 2;
            
            // 决定是圆形还是星形粒子
            const isCircle = Math.random() > 0.3;
            
            // 粒子颜色基于当前主题
            const isDark = document.body.classList.contains('cyberpunk-theme');
            let color;
            if (isDark) {
                // 暗黑主题：青色、粉色、黄色
                const colors = ['00ffff', 'ff00ff', 'ffcc00'];
                color = colors[Math.floor(Math.random() * colors.length)];
            } else {
                // 炫彩主题：粉色、紫色、蓝色
                const colors = ['ff006e', '8338ec', '3a86ff'];
                color = colors[Math.floor(Math.random() * colors.length)];
            }
            
            particles.push({
                x: mouseX,
                y: mouseY,
                size: size,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                life: 100,
                color: `#${color}`,
                isCircle: isCircle
            });
        }
    }

    // 更新粒子
    function updateParticles() {
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // 更新位置和生命
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= 2;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
                i--;
                continue;
            }
            
            // 绘制粒子
            ctx.save();
            ctx.globalAlpha = p.life / 100;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            
            if (p.isCircle) {
                // 绘制圆形
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 绘制星形
                drawStar(p.x, p.y, 5, p.size * 2, p.size);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // 如果鼠标激活状态，不断添加粒子
        if (mouseActive && Math.random() > 0.7) {
            createParticles(1);
        }
        
        requestAnimationFrame(updateParticles);
    }

    // 绘制星形
    function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
    
    updateParticles();

    // 主题切换
    const themeButton = document.getElementById('themeButton');
    
    themeButton.addEventListener('click', function() {
        document.body.classList.toggle('cyberpunk-theme');
        document.body.classList.toggle('colorful-theme');
        
        // 保存主题偏好到本地存储
        if (document.body.classList.contains('colorful-theme')) {
            localStorage.setItem('theme', 'colorful');
        } else {
            localStorage.setItem('theme', 'cyberpunk');
        }
    });
    
    // 从本地存储加载主题偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'colorful') {
        document.body.classList.remove('cyberpunk-theme');
        document.body.classList.add('colorful-theme');
    }

    // 导航栏相关
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');
    
    // 汉堡菜单点击事件
    burger.addEventListener('click', function() {
        nav.classList.toggle('active');
        burger.classList.toggle('active');
    });
    
    // 导航链接点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // 滚动到目标位置
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // 如果在移动设备上，点击后关闭菜单
                if (window.innerWidth <= 768) {
                    nav.classList.remove('active');
                    burger.classList.remove('active');
                }
            }
        });
    });
    
    // 滚动时导航栏效果
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 滚动渐入效果
    function checkFade() {
        const elements = document.querySelectorAll('.section');
        
        elements.forEach(element => {
            const position = element.getBoundingClientRect();
            
            // 元素进入视口
            if (position.top < window.innerHeight * 0.8) {
                element.classList.add('fade-in', 'visible');
                
                // 内部技能条动画
                const skillBars = element.querySelectorAll('.skill-level');
                skillBars.forEach(bar => {
                    const width = bar.style.width;
                    bar.style.width = '0';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 100);
                });
            }
        });
    }
    
    window.addEventListener('scroll', checkFade);
    // 初始检查
    checkFade();

    // 回到顶部按钮
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 表单提交效果
    const contactForm = document.querySelector('.contact-form');
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        // 这里可以添加表单验证和提交逻辑
        
        // 模拟提交效果
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
        submitButton.disabled = true;
        
        setTimeout(() => {
            // 重置表单
            contactForm.reset();
            
            // 显示成功消息
            submitButton.innerHTML = '<i class="fas fa-check"></i> 发送成功!';
            
            setTimeout(() => {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 2000);
        }, 1500);
    });

    // 添加表单输入动画
    const formInputs = document.querySelectorAll('.form-group input, .form-group textarea');
    
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // 项目卡片悬停特效
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.querySelector('.project-overlay').style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', function() {
            this.querySelector('.project-overlay').style.opacity = '0';
        });
    });

    // 技能条动画
    function initSkillBars() {
        const skillBars = document.querySelectorAll('.skill-level');
        skillBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            
            // 延迟一下使动画效果更明显
            setTimeout(() => {
                bar.style.width = width;
            }, 500);
        });
    }
    
    // 页面完全加载后初始化技能条
    window.addEventListener('load', initSkillBars);
});