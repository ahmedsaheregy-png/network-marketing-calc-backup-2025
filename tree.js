/**
 * الشجرة التفاعلية - Network Marketing Calculator
 * tree.js
 * 
 * نسخة مطابقة للكود الأصلي (Python)
 */

// ========================================
// كلاس العضو (Member) - مطابق للأصل
// ========================================
class Member {
    constructor(id, generation, parent = null) {
        this.id = id;
        this.generation = generation;
        this.parent = parent;
        this.leftChild = null;
        this.rightChild = null;
        this.isActive = true;
        this.x = 0;
        this.y = 0;
    }

    // حجم الفريق الكامل (يشمل العضو نفسه)
    getTeamSize() {
        let size = 1;
        if (this.leftChild) size += this.leftChild.getTeamSize();
        if (this.rightChild) size += this.rightChild.getTeamSize();
        return size;
    }

    // عدد أعضاء الفرع الأيمن
    getRightCount() {
        return this.rightChild ? this.rightChild.getTeamSize() : 0;
    }

    // عدد أعضاء الفرع الأيسر
    getLeftCount() {
        return this.leftChild ? this.leftChild.getTeamSize() : 0;
    }

    // حساب العمولة = حجم الشجرة × حصة العضو
    getCommission(sharePerMember) {
        return this.getTeamSize() * sharePerMember;
    }

    // حجم الفريق مع حد الستوبر - مطابق للأصل
    getTeamSizeWithLimit(maxDepth) {
        return this._countWithDepth(0, maxDepth);
    }

    _countWithDepth(currentDepth, maxDepth) {
        let count = 1;
        if (currentDepth >= maxDepth) return count;
        if (this.leftChild) {
            count += this.leftChild._countWithDepth(currentDepth + 1, maxDepth);
        }
        if (this.rightChild) {
            count += this.rightChild._countWithDepth(currentDepth + 1, maxDepth);
        }
        return count;
    }
}

// ========================================
// المتغيرات العامة
// ========================================
let rootMember = null;
let selectedMember = null;
let nextId = 2;
let zoomLevel = 1.0;
let offsetX = 0;
let offsetY = 0;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;

const STORAGE_KEY = 'networkMarketingCalc';
const MAX_GENERATIONS = 25;

// ========================================
// البيانات المستهدفة للشجرة غير المتوازنة
// (مطابقة للكود الأصلي بالضبط)
// ========================================
const UNBALANCED_TARGET_COUNTS = [
    { right: 0, left: 0 },    // الجيل 1 (الجذر)
    { right: 1, left: 1 },    // الجيل 2
    { right: 2, left: 2 },    // الجيل 3
    { right: 4, left: 4 },    // الجيل 4
    { right: 8, left: 7 },    // الجيل 5
    { right: 16, left: 9 },   // الجيل 6
    { right: 32, left: 8 },   // الجيل 7
    { right: 55, left: 8 },   // الجيل 8
    { right: 91, left: 8 },   // الجيل 9
    { right: 137, left: 1 },  // الجيل 10
    { right: 186, left: 0 },  // الجيل 11
    { right: 223, left: 0 },  // الجيل 12
    { right: 232, left: 0 },  // الجيل 13
    { right: 236, left: 0 },  // الجيل 14
    { right: 218, left: 0 },  // الجيل 15
    { right: 193, left: 0 },  // الجيل 16
    { right: 147, left: 0 },  // الجيل 17
    { right: 108, left: 0 },  // الجيل 18
    { right: 64, left: 0 },   // الجيل 19
    { right: 32, left: 0 }    // الجيل 20
];

// ========================================
// تهيئة الصفحة - ترتيب صحيح للحفاظ على الشجرة
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    // 1. محاولة تحميل الشجرة المحفوظة أولاً
    const hasSavedTree = loadFromStorage();

    // 2. إذا لم توجد شجرة محفوظة، إنشاء شجرة جديدة
    if (!hasSavedTree) {
        initializeTree();
    }

    // 3. إعداد Canvas والأحداث
    setupCanvas();
    attachEventListeners();
    drawTree();
});

// ========================================
// تهيئة الشجرة
// ========================================
function initializeTree() {
    rootMember = new Member(1, 1, null);
    selectedMember = rootMember;
    nextId = 2;
}

// ========================================
// إعداد Canvas
// ========================================
function setupCanvas() {
    const canvas = document.getElementById('treeCanvas');
    const container = canvas.parentElement;

    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawTree();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// ========================================
// ربط الأحداث
// ========================================
function attachEventListeners() {
    const canvas = document.getElementById('treeCanvas');

    // أحداث الماوس
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('mouseleave', onCanvasMouseUp);
    canvas.addEventListener('wheel', onCanvasWheel);
    canvas.addEventListener('click', onCanvasClick);

    // أحداث لوحة المفاتيح
    document.addEventListener('keydown', onKeyDown);

    // أزرار شريط الأدوات
    document.getElementById('addRandomBtn').addEventListener('click', showAddMembersModal);
    document.getElementById('resetTreeBtn').addEventListener('click', resetTree);
    document.getElementById('buildDefaultBtn').addEventListener('click', buildDefaultTree);
    document.getElementById('buildUnbalancedBtn').addEventListener('click', buildUnbalancedTree);
    document.getElementById('zoomInBtn').addEventListener('click', zoomIn);
    document.getElementById('zoomOutBtn').addEventListener('click', zoomOut);
    document.getElementById('resetViewBtn').addEventListener('click', resetView);

    // إعدادات
    document.getElementById('treeGenerations').addEventListener('input', function () {
        updateMemberInfo();
        saveToStorage();
    });
    document.getElementById('treeSharePerMember').addEventListener('input', function () {
        updateMemberInfo();
        saveToStorage();
    });

    // Modal
    document.getElementById('confirmAddBtn').addEventListener('click', confirmAddMembers);
    document.getElementById('cancelAddBtn').addEventListener('click', hideAddMembersModal);
}

// ========================================
// رسم الشجرة
// ========================================
function drawTree() {
    const canvas = document.getElementById('treeCanvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // حساب المواقع
    calculatePositions(rootMember, 0, 0, 800);

    // رسم الخطوط
    drawConnections(ctx, rootMember);

    // رسم الأعضاء
    drawMembers(ctx, rootMember);

    // تحديث المعلومات
    updateTreeInfo();

    // حفظ البيانات
    saveToStorage();
}

// ========================================
// حساب مواقع الأعضاء
// ========================================
function calculatePositions(member, depth, minX, maxX) {
    if (!member) return;

    member.x = (minX + maxX) / 2;
    member.y = 50 + depth * 80;

    const mid = (minX + maxX) / 2;

    if (member.leftChild) {
        calculatePositions(member.leftChild, depth + 1, minX, mid);
    }
    if (member.rightChild) {
        calculatePositions(member.rightChild, depth + 1, mid, maxX);
    }
}

// ========================================
// رسم الخطوط
// ========================================
function drawConnections(ctx, member) {
    if (!member) return;

    const x1 = member.x * zoomLevel + offsetX;
    const y1 = member.y * zoomLevel + offsetY;

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;

    if (member.leftChild) {
        const x2 = member.leftChild.x * zoomLevel + offsetX;
        const y2 = member.leftChild.y * zoomLevel + offsetY;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        drawConnections(ctx, member.leftChild);
    }

    if (member.rightChild) {
        const x2 = member.rightChild.x * zoomLevel + offsetX;
        const y2 = member.rightChild.y * zoomLevel + offsetY;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        drawConnections(ctx, member.rightChild);
    }
}

// ========================================
// رسم الأعضاء
// ========================================
function drawMembers(ctx, member) {
    if (!member) return;

    const x = member.x * zoomLevel + offsetX;
    const y = member.y * zoomLevel + offsetY;
    const radius = 25 * zoomLevel;

    // تحديد اللون - مطابق للكود الأصلي
    let fillColor, strokeColor, strokeWidth;

    if (member === selectedMember) {
        fillColor = '#FF9800';
        strokeColor = '#F57C00';
        strokeWidth = 4;
    } else if (member.isActive) {
        fillColor = '#4CAF50';
        strokeColor = '#388E3C';
        strokeWidth = 3;
    } else {
        fillColor = '#CCCCCC';
        strokeColor = '#999';
        strokeWidth = 2;
    }

    // رسم الدائرة
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // رسم الرقم
    const fontSize = Math.max(14, 18 * zoomLevel);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.id, x, y);

    // رسم الأبناء
    if (member.leftChild) drawMembers(ctx, member.leftChild);
    if (member.rightChild) drawMembers(ctx, member.rightChild);
}

// ========================================
// أحداث الماوس
// ========================================
function onCanvasMouseDown(e) {
    const canvas = e.target;
    canvas.focus();
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    canvas.style.cursor = 'grabbing';
}

function onCanvasMouseMove(e) {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    offsetX += dx;
    offsetY += dy;

    dragStartX = e.clientX;
    dragStartY = e.clientY;

    drawTree();
}

function onCanvasMouseUp(e) {
    isDragging = false;
    e.target.style.cursor = 'grab';
}

function onCanvasWheel(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
}

function onCanvasClick(e) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = findMemberAtPosition(rootMember, clickX, clickY);

    if (clicked) {
        selectedMember = clicked;
        drawTree();
        showMemberInfo(clicked);
    }
}

function findMemberAtPosition(member, clickX, clickY) {
    if (!member) return null;

    const x = member.x * zoomLevel + offsetX;
    const y = member.y * zoomLevel + offsetY;
    const radius = 25 * zoomLevel;

    const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);

    if (distance <= radius) {
        return member;
    }

    let found = findMemberAtPosition(member.leftChild, clickX, clickY);
    if (found) return found;

    return findMemberAtPosition(member.rightChild, clickX, clickY);
}

// ========================================
// عرض معلومات العضو - مطابق للأصل (نافذة منبثقة)
// ========================================
function showMemberInfo(member) {
    const generations = parseInt(document.getElementById('treeGenerations').value) || 11;
    const sharePerMember = parseFloat(document.getElementById('treeSharePerMember').value) || 2.25;

    // 1️⃣ عمولة بدون ستوبر
    const teamSizeNoLimit = member.getTeamSize();
    const commNoStopper = teamSizeNoLimit * sharePerMember;

    // 2️⃣ عمولة بالستوبر
    // حسب توضيح المستخدم: يأخذ 11 جيل (هو + 10 بعده)
    const maxDepth = generations - 1;
    const teamSizeWithLimit = member.getTeamSizeWithLimit(maxDepth);
    const commWithStopper = teamSizeWithLimit * sharePerMember;

    // 3️⃣ عدد المستفيدين منه
    const beneficiariesCount = Math.min(member.generation, generations);

    // بناء النص - مطابق للأصل
    let info = `العضو #${member.id}\n`;
    info += `الجيل: ${member.generation}\n`;
    info += `حجم الفريق: ${member.getTeamSize()}\n`;
    info += `الفرع الأيمن: ${member.getRightCount()}\n`;
    info += `الفرع الأيسر: ${member.getLeftCount()}\n`;
    info += `\n${'='.repeat(25)}\n`;
    info += `💰 عمولته (بدون ستوبر): ${commNoStopper.toFixed(2)}\n`;
    info += `💰 عمولته (بالستوبر): ${commWithStopper.toFixed(2)}\n`;
    info += `👥 عدد المستفيدين منه: ${beneficiariesCount}\n`;
    info += `${'='.repeat(25)}`;

    alert(info);

    // تحديث لوحة المعلومات أيضاً
    updateMemberInfoPanel(member, generations, sharePerMember, commNoStopper, commWithStopper, beneficiariesCount);
}

function updateMemberInfoPanel(member, generations, sharePerMember, commNoStopper, commWithStopper, beneficiariesCount) {
    document.getElementById('infoMemberId').textContent = `#${member.id}`;
    document.getElementById('infoGeneration').textContent = member.generation;
    document.getElementById('infoTeamSize').textContent = member.getTeamSize();
    document.getElementById('infoRightCount').textContent = member.getRightCount();
    document.getElementById('infoLeftCount').textContent = member.getLeftCount();
    document.getElementById('infoCommNoStopper').textContent = commNoStopper.toFixed(2);
    document.getElementById('infoCommWithStopper').textContent = commWithStopper.toFixed(2);
    document.getElementById('infoBeneficiaries').textContent = beneficiariesCount;
}

// ========================================
// لوحة المفاتيح
// ========================================
function onKeyDown(e) {
    switch (e.key) {
        case 'ArrowUp': offsetY += 50; drawTree(); break;
        case 'ArrowDown': offsetY -= 50; drawTree(); break;
        case 'ArrowLeft': offsetX += 50; drawTree(); break;
        case 'ArrowRight': offsetX -= 50; drawTree(); break;
        case '+': zoomIn(); break;
        case '-': zoomOut(); break;
    }
}

// ========================================
// التكبير والتصغير
// ========================================
function zoomIn() {
    zoomLevel *= 1.2;
    drawTree();
}

function zoomOut() {
    zoomLevel /= 1.2;
    drawTree();
}

function resetView() {
    zoomLevel = 1.0;
    offsetX = 0;
    offsetY = 0;
    drawTree();
}

// ========================================
// بناء الشجرة الافتراضية - مطابق للأصل
// ========================================
function buildDefaultTree() {
    // تصفير الشجرة أولاً
    rootMember = new Member(1, 1, null);
    rootMember.isActive = true;
    nextId = 2;
    selectedMember = null;

    // قراءة عدد الأجيال
    const generations = parseInt(document.getElementById('treeGenerations').value) || 11;
    const maxGenerations = Math.min(generations, 20);

    // بناء الشجرة بشكل متوازن (كل عضو له 2)
    function buildBalanced(parent, currentGen, maxGen) {
        if (currentGen >= maxGen) return;

        // إضافة الابن الأيمن
        parent.rightChild = new Member(nextId, currentGen + 1, parent);
        parent.rightChild.isActive = true;
        nextId++;

        // إضافة الابن الأيسر
        parent.leftChild = new Member(nextId, currentGen + 1, parent);
        parent.leftChild.isActive = true;
        nextId++;

        // المتابعة للأجيال التالية
        buildBalanced(parent.rightChild, currentGen + 1, maxGen);
        buildBalanced(parent.leftChild, currentGen + 1, maxGen);
    }

    buildBalanced(rootMember, 1, maxGenerations);

    // تحديث الجدول والرسم
    updateTableFromTree();
    selectedMember = rootMember;
    resetView();

    alert(`تم البناء\n\nتم بناء الشجرة الافتراضية (${maxGenerations} جيل)!`);
}

// ========================================
// بناء شجرة غير متوازنة - مطابق للأصل بالضبط
// ========================================
function buildUnbalancedTree() {
    // تصفير الشجرة أولاً
    rootMember = new Member(1, 1, null);
    rootMember.isActive = true;
    nextId = 2;
    selectedMember = null;

    // قوائم لتخزين الأعضاء المتاحين للإضافة في كل جيل
    const membersByGen = { 1: [rootMember] };

    // بناء الشجرة جيل بجيل
    for (let genIdx = 0; genIdx < UNBALANCED_TARGET_COUNTS.length; genIdx++) {
        const currentGen = genIdx + 1;
        if (currentGen >= 20) break;

        const nextGen = currentGen + 1;
        membersByGen[nextGen] = [];

        // الأعضاء في الجيل الحالي
        const currentGenMembers = membersByGen[currentGen] || [];
        if (currentGenMembers.length === 0) break;

        // تحديد العدد المطلوب إضافته في الجيل التالي
        let neededRight = 0, neededLeft = 0;
        if (genIdx + 1 < UNBALANCED_TARGET_COUNTS.length) {
            neededRight = UNBALANCED_TARGET_COUNTS[genIdx + 1].right;
            neededLeft = UNBALANCED_TARGET_COUNTS[genIdx + 1].left;
        }

        if (currentGen === 1) {
            // الجذر يضيف directly
            if (neededRight > 0) {
                rootMember.rightChild = new Member(nextId, 2, rootMember);
                rootMember.rightChild.isActive = true;
                membersByGen[2].push(rootMember.rightChild);
                nextId++;
            }

            if (neededLeft > 0) {
                rootMember.leftChild = new Member(nextId, 2, rootMember);
                rootMember.leftChild.isActive = true;
                membersByGen[2].push(rootMember.leftChild);
                nextId++;
            }
        } else {
            // للأجيال التالية
            const parentsRightSide = [];
            const parentsLeftSide = [];

            for (const m of currentGenMembers) {
                // معرفة هل العضو في يمين الشجرة الأم أم يسارها
                let temp = m;
                while (temp.parent !== rootMember && temp.parent !== null) {
                    temp = temp.parent;
                }

                if (temp.parent === rootMember) {
                    if (temp === rootMember.rightChild) {
                        parentsRightSide.push(m);
                    } else if (temp === rootMember.leftChild) {
                        parentsLeftSide.push(m);
                    }
                }
            }

            // إضافة الأبناء المطلوبين لليمين
            let addedRight = 0;
            for (const parent of parentsRightSide) {
                if (addedRight >= neededRight) break;

                if (!parent.rightChild && addedRight < neededRight) {
                    parent.rightChild = new Member(nextId, nextGen, parent);
                    parent.rightChild.isActive = true;
                    membersByGen[nextGen].push(parent.rightChild);
                    nextId++;
                    addedRight++;
                }

                if (!parent.leftChild && addedRight < neededRight) {
                    parent.leftChild = new Member(nextId, nextGen, parent);
                    parent.leftChild.isActive = true;
                    membersByGen[nextGen].push(parent.leftChild);
                    nextId++;
                    addedRight++;
                }
            }

            // إضافة الأبناء المطلوبين لليسار
            let addedLeft = 0;
            for (const parent of parentsLeftSide) {
                if (addedLeft >= neededLeft) break;

                if (!parent.rightChild && addedLeft < neededLeft) {
                    parent.rightChild = new Member(nextId, nextGen, parent);
                    parent.rightChild.isActive = true;
                    membersByGen[nextGen].push(parent.rightChild);
                    nextId++;
                    addedLeft++;
                }

                if (!parent.leftChild && addedLeft < neededLeft) {
                    parent.leftChild = new Member(nextId, nextGen, parent);
                    parent.leftChild.isActive = true;
                    membersByGen[nextGen].push(parent.leftChild);
                    nextId++;
                    addedLeft++;
                }
            }
        }
    }

    // تحديث الجدول والرسم
    updateTableFromTree();
    selectedMember = rootMember;
    resetView();

    alert(`تم البناء\n\nتم بناء الشجرة غير المتوازنة وتحديث الجدول!`);
}

// ========================================
// تصفير الشجرة - مطابق للأصل
// ========================================
function resetTree() {
    if (!confirm('هل أنت متأكد من تصفير الشجرة؟')) return;

    rootMember = new Member(1, 1, null);
    rootMember.isActive = true;
    nextId = 2;
    selectedMember = null;

    updateTableFromTree();
    resetView();

    alert('تم التصفير\n\nتم تصفير الشجرة بنجاح!');
}

// ========================================
// إضافة أعضاء عشوائياً
// ========================================
function showAddMembersModal() {
    if (!selectedMember) {
        selectedMember = rootMember;
    }

    const modal = document.getElementById('addMembersModal');
    document.getElementById('addUnderInfo').textContent =
        `الإضافة تحت العضو رقم: ${selectedMember.id}\nالجيل: ${selectedMember.generation} | الفريق الحالي: ${selectedMember.getTeamSize()}`;

    modal.style.display = 'flex';
    document.getElementById('membersToAdd').focus();
}

function hideAddMembersModal() {
    document.getElementById('addMembersModal').style.display = 'none';
}

function confirmAddMembers() {
    const count = parseInt(document.getElementById('membersToAdd').value) || 0;

    if (count <= 0) {
        alert('خطأ\n\nالرجاء إدخال عدد صحيح أكبر من صفر');
        return;
    }

    const added = addMembersIterative(selectedMember, count);

    hideAddMembersModal();
    drawTree();

    alert(`نجح\n\nتم إضافة ${added} عضو بنجاح!`);
}

// ========================================
// إضافة أعضاء بشكل تكراري - مطابق للأصل
// ========================================
function addMembersIterative(startMember, count) {
    let added = 0;
    let candidates = [startMember];

    while (added < count && candidates.length > 0) {
        const current = candidates[Math.floor(Math.random() * candidates.length)];
        candidates = candidates.filter(c => c !== current);

        if (current.generation >= MAX_GENERATIONS) continue;

        const availableSlots = [];
        if (!current.leftChild) availableSlots.push('left');
        if (!current.rightChild) availableSlots.push('right');

        if (availableSlots.length === 0) continue;

        let numToAdd = availableSlots.length === 2 ?
            (Math.random() < 0.5 ? 1 : 2) : 1;
        numToAdd = Math.min(numToAdd, count - added);

        if (numToAdd >= 1) {
            const side = availableSlots[Math.floor(Math.random() * availableSlots.length)];
            const newMember = new Member(nextId, current.generation + 1, current);
            newMember.isActive = true;

            if (side === 'left') {
                current.leftChild = newMember;
            } else {
                current.rightChild = newMember;
            }

            nextId++;
            added++;
            candidates.push(newMember);
            availableSlots.splice(availableSlots.indexOf(side), 1);
        }

        if (numToAdd >= 2 && availableSlots.length > 0) {
            const side = availableSlots[0];
            const newMember = new Member(nextId, current.generation + 1, current);
            newMember.isActive = true;

            if (side === 'left') {
                current.leftChild = newMember;
            } else {
                current.rightChild = newMember;
            }

            nextId++;
            added++;
            candidates.push(newMember);
        }

        if (current.leftChild === null || current.rightChild === null) {
            if (current.generation < MAX_GENERATIONS) {
                candidates.push(current);
            }
        }
    }

    // تحديث الجدول تلقائياً
    updateTableFromTree();

    return added;
}

// ========================================
// تحديث الجدول من الشجرة - مطابق للأصل
// ========================================
function updateTableFromTree() {
    // حساب الأعضاء في كل جيل
    const generationCounts = {};

    function traverse(member, isRightBranch) {
        if (!member) return;

        const gen = member.generation;
        if (!generationCounts[gen]) {
            generationCounts[gen] = { right: 0, left: 0 };
        }

        if (member !== rootMember) {
            if (isRightBranch) {
                generationCounts[gen].right++;
            } else {
                generationCounts[gen].left++;
            }
        }

        traverse(member.leftChild, isRightBranch);
        traverse(member.rightChild, isRightBranch);
    }

    // البدء من الفرعين
    traverse(rootMember.rightChild, true);
    traverse(rootMember.leftChild, false);

    // حفظ البيانات للمزامنة مع صفحة الحسابات
    saveToStorage(generationCounts);
}

// ========================================
// تحديث المعلومات
// ========================================
function updateTreeInfo() {
    const totalMembers = rootMember.getTeamSize();
    document.getElementById('treeInfo').innerHTML = `إجمالي الأعضاء: <strong>${totalMembers}</strong>`;

    if (selectedMember) {
        document.getElementById('selectedInfo').innerHTML =
            `المحدد: <strong>#${selectedMember.id} (جيل ${selectedMember.generation})</strong>`;
    }
}

function updateMemberInfo() {
    if (!selectedMember) return;

    const generations = parseInt(document.getElementById('treeGenerations').value) || 11;
    const sharePerMember = parseFloat(document.getElementById('treeSharePerMember').value) || 2.25;

    const teamSizeNoLimit = selectedMember.getTeamSize();
    const commNoStopper = teamSizeNoLimit * sharePerMember;

    const maxDepth = generations - 1;
    const teamSizeWithLimit = selectedMember.getTeamSizeWithLimit(maxDepth);
    const commWithStopper = teamSizeWithLimit * sharePerMember;

    const beneficiariesCount = Math.min(selectedMember.generation, generations);

    updateMemberInfoPanel(selectedMember, generations, sharePerMember,
        commNoStopper, commWithStopper, beneficiariesCount);
}

// ========================================
// حفظ وتحميل البيانات - مع حفظ هيكل الشجرة الكامل
// ========================================

// تحويل الشجرة لـ JSON
function serializeTree(member) {
    if (!member) return null;

    return {
        id: member.id,
        generation: member.generation,
        isActive: member.isActive,
        leftChild: serializeTree(member.leftChild),
        rightChild: serializeTree(member.rightChild)
    };
}

// إعادة بناء الشجرة من JSON
function deserializeTree(data, parent = null) {
    if (!data) return null;

    const member = new Member(data.id, data.generation, parent);
    member.isActive = data.isActive;
    member.leftChild = deserializeTree(data.leftChild, member);
    member.rightChild = deserializeTree(data.rightChild, member);

    return member;
}

function saveToStorage(generationCounts = null) {
    if (!generationCounts) {
        generationCounts = {};
        function traverse(member, isRightBranch) {
            if (!member) return;
            const gen = member.generation;
            if (!generationCounts[gen]) generationCounts[gen] = { right: 0, left: 0 };
            if (member !== rootMember) {
                if (isRightBranch) generationCounts[gen].right++;
                else generationCounts[gen].left++;
            }
            traverse(member.leftChild, isRightBranch);
            traverse(member.rightChild, isRightBranch);
        }
        traverse(rootMember.rightChild, true);
        traverse(rootMember.leftChild, false);
    }

    // حفظ هيكل الشجرة الكامل
    const treeStructure = serializeTree(rootMember);

    const data = {
        generationCounts: generationCounts,
        treeStructure: treeStructure,  // الشجرة الكاملة
        nextId: nextId,
        selectedMemberId: selectedMember ? selectedMember.id : 1,
        zoomLevel: zoomLevel,
        offsetX: offsetX,
        offsetY: offsetY,
        totalMembers: rootMember.getTeamSize(),
        generations: document.getElementById('treeGenerations').value,
        sharePerMember: document.getElementById('treeSharePerMember').value,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY + '_tree', JSON.stringify(data));
}

function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY + '_tree');
    if (saved) {
        try {
            const data = JSON.parse(saved);

            // استعادة الإعدادات
            if (data.generations) {
                document.getElementById('treeGenerations').value = data.generations;
            }
            if (data.sharePerMember) {
                document.getElementById('treeSharePerMember').value = data.sharePerMember;
            }

            // استعادة هيكل الشجرة الكامل
            if (data.treeStructure) {
                rootMember = deserializeTree(data.treeStructure);
                nextId = data.nextId || 2;

                // استعادة العضو المحدد
                if (data.selectedMemberId) {
                    selectedMember = findMemberById(rootMember, data.selectedMemberId) || rootMember;
                } else {
                    selectedMember = rootMember;
                }

                // استعادة الـ Zoom والـ Pan
                if (data.zoomLevel) zoomLevel = data.zoomLevel;
                if (data.offsetX !== undefined) offsetX = data.offsetX;
                if (data.offsetY !== undefined) offsetY = data.offsetY;

                console.log('✅ تم استعادة الشجرة المحفوظة');
                return true; // تم تحميل شجرة محفوظة
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }
    return false; // لا توجد شجرة محفوظة
}

// البحث عن عضو بالـ ID
function findMemberById(member, id) {
    if (!member) return null;
    if (member.id === id) return member;

    let found = findMemberById(member.leftChild, id);
    if (found) return found;

    return findMemberById(member.rightChild, id);
}

