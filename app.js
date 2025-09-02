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
})();