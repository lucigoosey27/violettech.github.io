// ========== Pastel LetterGlitch Background (non-converging colors) ==========
(function(){
    const glitchColors = ['#f8a5c2', '#c8a2f4', '#a5d8f8']; // baby pink, lilac, baby blue
    const glitchSpeed = 50; // ms
    const smooth = true;

    const canvas = document.getElementById('letterglitch');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const charWidth = 10, charHeight = 20, fontSize = 16;
    const lettersAndSymbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>,".split("")
        .concat("0123456789".split(""));

    let letters = []; // { char, color:{r,g,b}, start:{r,g,b}, target:{r,g,b}, p:0..1 }
    let grid = { columns: 0, rows: 0 };
    let last = Date.now();

    function hexToRgb(hex){
        const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthand, (m,r,g,b)=> r+r+g+g+b+b);
        const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return res ? { r:parseInt(res[1],16), g:parseInt(res[2],16), b:parseInt(res[3],16) } : null;
    }
    const rgbStr = o => `rgb(${o.r},${o.g},${o.b})`;
    const lerp = (a,b,t) => Math.round(a + (b-a)*t);
    const mix = (s,e,f) => ({ r: lerp(s.r,e.r,f), g: lerp(s.g,e.g,f), b: lerp(s.b,e.b,f) });
    const randChar = () => lettersAndSymbols[Math.floor(Math.random()*lettersAndSymbols.length)];
    const randColor = () => hexToRgb(glitchColors[Math.floor(Math.random()*glitchColors.length)]);

    function calcGrid(w,h){ return { columns: Math.ceil(w/charWidth), rows: Math.ceil(h/charHeight) }; }
    function init(cols,rows){
        grid = { columns: cols, rows: rows };
        letters = Array.from({length: cols*rows}, () => {
            const c = randColor();
            return { char: randChar(), color: c, start: c, target: randColor(), p: 1 };
        });
    }
    function resize(){
        canvas.width = innerWidth * dpr;
        canvas.height = innerHeight * dpr;
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
        const g = calcGrid(innerWidth, innerHeight);
        init(g.columns, g.rows);
        draw();
    }
    function draw(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font = fontSize + "px monospace";
        ctx.textBaseline = 'top';
        letters.forEach((l,i)=>{
            const x = (i % grid.columns) * charWidth;
            const y = Math.floor(i / grid.columns) * charHeight;
            ctx.fillStyle = rgbStr(l.color);
            ctx.fillText(l.char, x, y);
        });
    }
    function update(){
        const count = Math.max(1, Math.floor(letters.length * 0.05));
        for (let i=0; i<count; i++){
            const l = letters[Math.floor(Math.random()*letters.length)];
            l.char = randChar();
            l.start = l.color;
            l.target = randColor();
            l.p = smooth ? 0 : 1;
            if (!smooth) l.color = l.target;
        }
    }
    function tween(){
        let needs = false;
        letters.forEach(l=>{
            if (l.p < 1){
                l.p += 0.05;
                if (l.p > 1) l.p = 1;
                l.color = mix(l.start, l.target, l.p);
                needs = true;
            }
        });
        if (needs) draw();
    }
    function tick(){
        const now = Date.now();
        if (now - last >= glitchSpeed){ update(); draw(); last = now; }
        if (smooth) tween();
        requestAnimationFrame(tick);
    }

    addEventListener('resize', resize, { passive: true });
    resize();
    tick();

    // ===== TargetCursor (ReactBits vanilla port) =====
    (function() {
        const cursor = document.getElementById('target-cursor');
        const dot = cursor.querySelector('.target-cursor-dot');
        const corners = cursor.querySelectorAll('.target-cursor-corner');
        const borderWidth = 3, cornerSize = 12, parallaxStrength = 0.00005;
        let spinTl, activeTarget = null, currentMove = null, currentLeave = null, resumeTimeout = null;

        // hide default cursor
        document.body.style.cursor = 'none';

        // center cursor initially
        gsap.set(cursor, {
            xPercent: -50, yPercent: -50,
            x: window.innerWidth/2, y: window.innerHeight/2
        });

        // spin timeline
        function createSpin() {
            if (spinTl) spinTl.kill();
            spinTl = gsap.timeline({ repeat:-1 })
                .to(cursor, { rotation: '+=360', duration: 2, ease:'none' });
        }
        createSpin();

        // follow mouse
        function moveCursor(x,y) {
            gsap.to(cursor, { x, y, duration:0.1, ease:'power3.out' });
        }
        window.addEventListener('mousemove', e => moveCursor(e.clientX, e.clientY));

        // click feedback
        window.addEventListener('mousedown', ()=> {
            gsap.to(dot, { scale:0.7, duration:0.3 });
            gsap.to(cursor, { scale:0.9, duration:0.2 });
        });
        window.addEventListener('mouseup', ()=> {
            gsap.to(dot, { scale:1, duration:0.3 });
            gsap.to(cursor, { scale:1, duration:0.2 });
        });

        // enter target
        function enterHandler(e) {
            const target = e.target.closest('.cursor-target');
            if (!target || activeTarget === target) return;

            if (activeTarget) cleanup(activeTarget);
            if (resumeTimeout) { clearTimeout(resumeTimeout); resumeTimeout = null; }

            activeTarget = target;
            gsap.killTweensOf(cursor, 'rotation');
            spinTl.pause();
            gsap.set(cursor, { rotation:0 });

            function updateCorners(mouseX, mouseY) {
                const rect = target.getBoundingClientRect();
                const cursorRect = cursor.getBoundingClientRect();
                const cx = cursorRect.left + cursorRect.width/2;
                const cy = cursorRect.top + cursorRect.height/2;

                let tl = { x: rect.left - cx - borderWidth, y: rect.top - cy - borderWidth };
                let tr = { x: rect.right - cx + borderWidth - cornerSize, y: rect.top - cy - borderWidth };
                let br = { x: rect.right - cx + borderWidth - cornerSize, y: rect.bottom - cy + borderWidth - cornerSize };
                let bl = { x: rect.left - cx - borderWidth, y: rect.bottom - cy + borderWidth - cornerSize };

                if (mouseX !== undefined && mouseY !== undefined) {
                    const tx = rect.left + rect.width/2;
                    const ty = rect.top + rect.height/2;
                    const mx = (mouseX - tx) * parallaxStrength;
                    const my = (mouseY - ty) * parallaxStrength;
                    tl.x+=mx; tl.y+=my; tr.x+=mx; tr.y+=my; br.x+=mx; br.y+=my; bl.x+=mx; bl.y+=my;
                }

                const offsets = [tl,tr,br,bl];
                corners.forEach((c,i)=> {
                    gsap.to(c, { x: offsets[i].x, y: offsets[i].y, duration:0.2, ease:'power2.out' });
                });
            }

            updateCorners();

            // throttle move
            let raf=null;
            currentMove = ev => {
                if (raf) return;
                raf = requestAnimationFrame(()=> {
                    updateCorners(ev.clientX, ev.clientY);
                    raf=null;
                });
            };
            currentLeave = ()=> leaveHandler(target);
            target.addEventListener('mousemove', currentMove);
            target.addEventListener('mouseleave', currentLeave);
        }

        function leaveHandler(target) {
            activeTarget = null;
            if (currentMove) target.removeEventListener('mousemove', currentMove);
            if (currentLeave) target.removeEventListener('mouseleave', currentLeave);
            currentMove = null; currentLeave = null;

            // collapse corners back
            const pos = [
                {x:-cornerSize*1.5,y:-cornerSize*1.5},
                {x: cornerSize*0.5,y:-cornerSize*1.5},
                {x: cornerSize*0.5,y: cornerSize*0.5},
                {x:-cornerSize*1.5,y: cornerSize*0.5}
            ];
            corners.forEach((c,i)=> {
                gsap.to(c, { x: pos[i].x, y: pos[i].y, duration:0.3, ease:'power3.out' });
            });

            // resume spin after delay
            resumeTimeout = setTimeout(()=> {
                const rot = gsap.getProperty(cursor,'rotation') % 360;
                spinTl.kill();
                spinTl = gsap.timeline({ repeat:-1 })
                    .to(cursor, { rotation:'+=360', duration:2, ease:'none' });
                gsap.to(cursor, {
                    rotation: rot+360, duration:2*(1-rot/360), ease:'none',
                    onComplete: ()=> spinTl.restart()
                });
            }, 50);
        }

        function cleanup(target) {
            if (currentMove) target.removeEventListener('mousemove', currentMove);
            if (currentLeave) target.removeEventListener('mouseleave', currentLeave);
            currentMove=null; currentLeave=null;
        }

        window.addEventListener('mouseover', enterHandler, { passive:true });
    })();
})();