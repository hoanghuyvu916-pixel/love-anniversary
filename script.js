// ============================================
// 👇 1. 全局配置与计时器 (这部分绝对会运行) 👇
// ============================================

// ❤️ 请在这里设置你们的纪念日 (年, 月-1, 日)
// 例如：2023年5月20日 就要写 (2023, 4, 20)
const startDate = new Date(2023, 4, 20);

function updateTimer() {
    try {
        const now = new Date();
        let years = now.getFullYear() - startDate.getFullYear();
        let months = now.getMonth() - startDate.getMonth();
        let days = now.getDate() - startDate.getDate();

        if (days < 0) {
            months--;
            const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += lastMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const text = `${years}年 ${months}个月 ${days}天`;
        const clockEl = document.getElementById("clock");
        if (clockEl) clockEl.innerText = text;

        const dateEl = document.getElementById("start-date-display");
        if (dateEl) dateEl.innerText = `起始日: ${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`;
    } catch (e) {
        console.error("Timer error:", e);
    }
}
// 立即启动计时器，不等待其他代码
setInterval(updateTimer, 1000);
// 确保 DOM 加载完后至少执行一次
document.addEventListener('DOMContentLoaded', updateTimer);


// ============================================
// 👇 2. 音乐播放器控制 👇
// ============================================
function toggleAudio() {
    const audio = document.getElementById('bgm');
    const btn = document.querySelector('.music-floating-btn');
    if (!audio) return;

    if (audio.paused) {
        audio.play().catch(e => alert("请点击一下页面任意位置，允许自动播放"));
        btn.classList.add('playing');
    } else {
        audio.pause();
        btn.classList.remove('playing');
    }
}


// ============================================
// 👇 3. 灵魂画板 (修复版) 👇
// ============================================
// 使用闭包防止变量污染
(function initCanvas() {
    const canvas = document.getElementById('love-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    // 调整画布分辨率以匹配显示大小（解决模糊和坐标偏移问题）
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    // 页面加载和窗口大小改变时调整画布
    window.addEventListener('resize', resizeCanvas);
    // 延迟一点执行确保容器已渲染
    setTimeout(resizeCanvas, 100);

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        // 兼容鼠标和触摸事件
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDraw(e) {
        isDrawing = true;
        ctx.beginPath();
        const { x, y } = getPos(e);
        ctx.moveTo(x, y);
    }

    function draw(e) {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault(); // 只有在可取消时才阻止默认事件

        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.strokeStyle = document.getElementById('color-picker').value;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    function stopDraw() { isDrawing = false; }

    // 绑定事件 (兼容移动端和PC端)
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseout', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    // 暴露清空函数给全局按钮使用
    window.clearCanvas = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
})();


// ============================================
// 👇 4. 云端功能 (LeanCloud) 👇
// ============================================
// 使用 try-catch 包裹，防止云端错误导致整个网页崩溃
try {
    const APP_ID = 'C6jy5IgUydpIdqrgcuiGfUF2-MdYXbMMI';
    const APP_KEY = 'vmh4nBlXHeAOJDC12GSrXtHX';

    // 检查 AV 是否加载成功
    if (typeof AV === 'undefined') {
        throw new Error("LeanCloud SDK load failed");
    }

    AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: "https://ulnx6q5l.api.lncldglobal.com" });

    // --- 甜蜜瞬间 ---
    const MemoryObject = AV.Object.extend('LoveMemory');

    window.previewImage = function (input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('img-preview').src = e.target.result;
                document.getElementById('img-preview-box').style.display = 'block';
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    window.addMemory = async function () {
        const fileInput = document.getElementById('memory-file');
        const textInput = document.getElementById('memory-text');

        if (fileInput.files.length === 0) return alert("请先选择一张照片哦！");
        if (fileInput.files[0].size > 3 * 1024 * 1024) return alert("图片太大了，请上传小于3MB的图片");

        const reader = new FileReader();
        reader.onload = async function (e) {
            const base64Str = e.target.result;
            const memory = new MemoryObject();
            memory.set('image', base64Str);
            memory.set('text', textInput.value || "美好的瞬间");

            try {
                await memory.save();
                alert("上传成功！");
                fileInput.value = ""; textInput.value = "";
                document.getElementById('img-preview-box').style.display = 'none';
                loadMemories();
            } catch (err) {
                alert("上传失败，请检查网络");
                console.error(err);
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    }

    async function loadMemories() {
        const query = new AV.Query('LoveMemory');
        query.descending('createdAt');
        query.limit(20);
        try {
            const results = await query.find();
            const container = document.getElementById('memory-list');
            if (results.length === 0) {
                container.innerHTML = '<p style="font-size:12px; color:#aaa;">还没有照片，快传一张吧！</p>';
                return;
            }
            container.innerHTML = results.map(m => {
                const date = m.createdAt.toLocaleDateString();
                return `
                <div class="memory-card">
                    <img src="${m.get('image')}">
                    <p style="font-size:0.9rem; margin:5px 0 0 0;">${m.get('text')}</p>
                    <div class="memory-date">${date}</div>
                </div>`;
            }).join('');
        } catch (e) {
            document.getElementById('memory-list').innerHTML = '<p style="color:red">加载失败，请检查网络</p>';
        }
    }
    loadMemories();

    // --- 愿望清单 ---
    const GoalObject = AV.Object.extend('LoveGoal');
    window.addTodo = async function () {
        const text = document.getElementById('todo-input').value.trim();
        if (!text) return;
        const goal = new GoalObject();
        goal.set('title', text);
        goal.set('isDone', false);
        await goal.save();
        document.getElementById('todo-input').value = '';
        loadTodos();
    }
    window.toggleTodo = async function (id, currentStatus) {
        const goal = AV.Object.createWithoutData('LoveGoal', id);
        goal.set('isDone', !currentStatus);
        await goal.save();
        loadTodos();
    }
    async function loadTodos() {
        const query = new AV.Query('LoveGoal');
        query.descending('createdAt');
        const results = await query.find();
        document.getElementById('todo-list').innerHTML = results.map(goal => {
            const done = goal.get('isDone');
            return `<div class="todo-item ${done ? 'done' : ''}">
                <input type="checkbox" ${done ? 'checked' : ''} onclick="toggleTodo('${goal.id}', ${done})">
                <span style="margin-left:8px">${goal.get('title')}</span>
            </div>`;
        }).join('');
    }
    loadTodos();

    // --- 保存画作 ---
    const DrawObject = AV.Object.extend('LoveDrawing');
    window.saveDrawing = async function () {
        const canvas = document.getElementById('love-canvas');
        const dataUrl = canvas.toDataURL('image/png', 0.5);
        const drawObj = new DrawObject();
        drawObj.set('imageStr', dataUrl);
        try { await drawObj.save(); alert("画作已发送！"); loadDrawing(); } catch (e) { alert("发送失败"); }
    }
    async function loadDrawing() {
        const query = new AV.Query('LoveDrawing');
        query.descending('createdAt');
        const result = await query.first();
        if (result) {
            document.getElementById('drawing-img').src = result.get('imageStr');
            document.getElementById('drawing-img').style.display = 'block';
        }
    }
    loadDrawing();

    // --- 碎碎念 ---
    const NoteObject = AV.Object.extend('LoveNote');
    window.addNote = async function () {
        const text = document.getElementById('note-input').value;
        if (!text) return;
        const note = new NoteObject();
        note.set('content', text);
        await note.save();
        document.getElementById('note-input').value = '';
        loadNotes();
    }
    async function loadNotes() {
        const query = new AV.Query('LoveNote');
        query.descending('createdAt');
        query.limit(10);
        const results = await query.find();
        document.getElementById('note-list').innerHTML = results.map(n =>
            `<div class="note-item"><span class="delete-btn" onclick="deleteNote('${n.id}')">×</span>${n.get('content')}</div>`
        ).join('');
    }
    window.deleteNote = async function (id) {
        if (!confirm("确认删除这条碎碎念吗？")) return;
        const n = AV.Object.createWithoutData('LoveNote', id);
        await n.destroy();
        loadNotes();
    }
    loadNotes();

} catch (err) {
    console.error("Cloud Initialization Error:", err);
    // 如果云端挂了，至少保证计时器和画板本地能用
    alert("连接云端数据库时出了一点小问题，但计时器和画板仍然可以使用哦！(请检查网络或刷新页面)");
}