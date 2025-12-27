/**
 * حاسبة التسويق الشبكي - صفحة الحسابات
 * calculator.js
 * 
 * نسخة مصححة ومطابقة للكود الأصلي
 */

// ========================================
// الثوابت
// ========================================
const ROWS = 25;
const STORAGE_KEY = 'networkMarketingCalc';
const AUTO_COLOR = '#E0FFFF';

// ========================================
// بيانات الجدول
// ========================================
let tableData = [];

// ========================================
// تهيئة الصفحة
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    initializeTable();
    attachEventListeners();
    loadFromStorage();
    calculateAll();
    setupFormulaTooltips();
});

// ========================================
// تهيئة الجدول - مطابق للأصل
// ========================================
function initializeTable() {
    const tbody = document.getElementById('treeBody');
    tbody.innerHTML = '';
    tableData = [];

    for (let i = 0; i < ROWS; i++) {
        // القيم الافتراضية: الجيل الأول (0، 0)، الباقي (2، 2)
        const defaultVal = i === 0 ? 0 : 2;

        tableData.push({
            generation: i + 1,
            rightLine: defaultVal,
            leftLine: defaultVal,
            total: 0,
            income: 0,
            commNoStopper: 0,
            commWithStopper: 0,
            commBottomUp: 0
        });

        const row = document.createElement('tr');

        // الجيل الأول حالة خاصة - readonly
        if (i === 0) {
            row.innerHTML = `
                <td><strong>1</strong></td>
                <td><input type="number" id="right_${i}" value="0" class="tree-input" readonly style="background:#e0e0e0"></td>
                <td><input type="number" id="left_${i}" value="0" class="tree-input" readonly style="background:#e0e0e0"></td>
                <td id="total_${i}" class="auto-cell">1</td>
                <td id="income_${i}" class="auto-cell">0.00</td>
                <td id="commNoStopper_${i}" class="auto-cell">0.00</td>
                <td id="commWithStopper_${i}" class="auto-cell">0.00</td>
                <td id="commBottomUp_${i}" class="auto-cell">0.00</td>
            `;
        } else {
            row.innerHTML = `
                <td><strong>${i + 1}</strong></td>
                <td><input type="number" id="right_${i}" value="${defaultVal}" min="0" class="tree-input"></td>
                <td><input type="number" id="left_${i}" value="${defaultVal}" min="0" class="tree-input"></td>
                <td id="total_${i}" class="auto-cell">0</td>
                <td id="income_${i}" class="auto-cell">0.00</td>
                <td id="commNoStopper_${i}" class="auto-cell">0.00</td>
                <td id="commWithStopper_${i}" class="auto-cell">0.00</td>
                <td id="commBottomUp_${i}" class="auto-cell">0.00</td>
            `;
        }
        tbody.appendChild(row);
    }
}

// ========================================
// ربط الأحداث - مع ربط حساب الـ Cap
// ========================================
function attachEventListeners() {
    // حقول الإدخال الرئيسية التي تعيد حساب الـ Cap
    const inputsThatAffectCap = ['productPrice', 'deductionPercent', 'companyPercent', 'generationsCount'];
    inputsThatAffectCap.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function () {
                calculateAll();
                // إعادة حساب الـ Cap تلقائياً - مطابق للأصل
                const newCap = calculateDefaultCap();
                document.getElementById('cap').value = newCap;
                saveToStorage();
            });
        }
    });

    // الـ Cap عند تغييره يدوياً
    const capEl = document.getElementById('cap');
    if (capEl) {
        capEl.addEventListener('input', function () {
            calculateAll();
            saveToStorage();
        });
    }

    // حقول الشجرة (الجيل 2 فما فوق فقط)
    for (let i = 1; i < ROWS; i++) {
        const rightEl = document.getElementById(`right_${i}`);
        const leftEl = document.getElementById(`left_${i}`);

        if (rightEl) {
            rightEl.addEventListener('input', function () {
                calculateAll();
                saveToStorage();
            });
        }
        if (leftEl) {
            leftEl.addEventListener('input', function () {
                calculateAll();
                saveToStorage();
            });
        }
    }

    // زر المزامنة من الشجرة
    const syncBtn = document.getElementById('syncFromTree');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncFromTree);
    }

    // زر Top 100
    const top100Btn = document.getElementById('showTop100Btn');
    if (top100Btn) {
        top100Btn.addEventListener('click', showTop100);
    }
}

// ========================================
// حساب الـ Cap الافتراضي - مطابق للأصل
// ========================================
function calculateDefaultCap() {
    try {
        const price = parseFloat(document.getElementById('productPrice').value) || 330;
        const deductionPercent = parseFloat(document.getElementById('deductionPercent').value) || 10;
        const companyPercent = parseFloat(document.getElementById('companyPercent').value) || 25;
        const generations = parseInt(document.getElementById('generationsCount').value) || 11;

        // المبلغ المقتطع
        const deducted = price * (deductionPercent / 100);

        // حصة خطة الدخل
        const membersShare = deducted * ((100 - companyPercent) / 100);

        // حصة العضو الواحد
        const sharePer = membersShare / generations;

        // إجمالي الأعضاء في الشجرة الكاملة
        const totalMembers = Math.pow(2, generations) - 1;

        // إجمالي عمولات الشخص الأول
        const totalCommission = totalMembers * sharePer;

        return Math.floor(totalCommission);
    } catch (e) {
        return 5000;
    }
}

// ========================================
// الحساب الرئيسي - مطابق للأصل
// ========================================
function calculateAll() {
    calculateInputs();
    calculateTree();
    calculateOutputs();
}

// ========================================
// حساب قسم الإدخالات - مطابق للأصل
// ========================================
function calculateInputs() {
    try {
        const price = parseFloat(document.getElementById('productPrice').value) || 0;
        const deductionPercent = parseFloat(document.getElementById('deductionPercent').value) || 0;
        const companyPercent = parseFloat(document.getElementById('companyPercent').value) || 0;
        const generations = parseInt(document.getElementById('generationsCount').value) || 11;
        const cap = parseFloat(document.getElementById('cap').value) || 0;

        // المبلغ المقتطع = سعر المنتج × النسبة المقتطعة
        const deducted = price * (deductionPercent / 100);
        document.getElementById('deductedAmount').value = deducted.toFixed(2);

        // حصة الشركة = المبلغ المقتطع × نسبة الشركة
        const compShare = deducted * (companyPercent / 100);
        document.getElementById('companyShare').value = compShare.toFixed(2);

        // نسبة الأعضاء = 100% - نسبة الشركة
        const membersPct = 100 - companyPercent;
        document.getElementById('membersPercent').value = membersPct.toFixed(2);

        // حصة خطة الدخل = المبلغ المقتطع - حصة الشركة
        const membShare = deducted - compShare;
        document.getElementById('membersShare').value = membShare.toFixed(2);

        // إجمالي عدد الأعضاء الافتراضي = 2^generations - 1
        const defaultTotal = Math.pow(2, generations) - 1;
        document.getElementById('defaultTotalMembers').value = defaultTotal;

        // حصة العضو الواحد = حصة خطة الدخل ÷ عدد الأجيال
        let share = membShare / generations;

        // تطبيق الحد الأقصى (Cap)
        if (share > cap) {
            share = cap;
        }

        document.getElementById('sharePerMember').value = share.toFixed(2);
    } catch (e) {
        console.error('Error in calculateInputs:', e);
    }
}

// ========================================
// حساب قسم الشجرة - مطابق للأصل
// ========================================
function calculateTree() {
    const sharePerMember = parseFloat(document.getElementById('sharePerMember').value) || 0;
    const generations = parseInt(document.getElementById('generationsCount').value) || 11;

    let totalRight = 0;
    let totalLeft = 0;
    let totalMembers = 0;
    let totalIncome = 0;

    // مصفوفات العمولات الثلاثة
    const commNoStopperByGen = new Array(ROWS).fill(0);
    const commWithStopperByGen = new Array(ROWS).fill(0);
    const commBottomUpByGen = new Array(ROWS).fill(0);

    // الجيل الأول (الشخص الأول)
    tableData[0].rightLine = 0;
    tableData[0].leftLine = 0;
    tableData[0].total = 1;
    tableData[0].income = sharePerMember;

    document.getElementById('total_0').textContent = '1';
    document.getElementById('income_0').textContent = sharePerMember.toFixed(2);

    totalMembers = 1;
    totalIncome = sharePerMember;

    // الأجيال من 2 إلى 25
    for (let i = 1; i < ROWS; i++) {
        const right = parseInt(document.getElementById(`right_${i}`).value) || 0;
        const left = parseInt(document.getElementById(`left_${i}`).value) || 0;

        const total = right + left;
        const income = total * sharePerMember;

        tableData[i].rightLine = right;
        tableData[i].leftLine = left;
        tableData[i].total = total;
        tableData[i].income = income;

        document.getElementById(`total_${i}`).textContent = total;
        document.getElementById(`income_${i}`).textContent = income.toFixed(2);

        totalRight += right;
        totalLeft += left;
        totalMembers += total;
        totalIncome += income;
    }

    // حساب العمولات الثلاثة - باستخدام منطق مبسط من الجدول
    // (في الأصل يُحسب من الشجرة، لكن هنا نحسب تقريبياً من الجدول)
    calculateCommissionsFromTable(sharePerMember, generations, commNoStopperByGen, commWithStopperByGen, commBottomUpByGen);

    // تحديث الخلايا
    let totalNoStopper = 0;
    let totalWithStopper = 0;
    let totalBottomUp = 0;

    for (let i = 0; i < ROWS; i++) {
        tableData[i].commNoStopper = commNoStopperByGen[i];
        tableData[i].commWithStopper = commWithStopperByGen[i];
        tableData[i].commBottomUp = commBottomUpByGen[i];

        document.getElementById(`commNoStopper_${i}`).textContent = commNoStopperByGen[i].toFixed(2);
        document.getElementById(`commWithStopper_${i}`).textContent = commWithStopperByGen[i].toFixed(2);
        document.getElementById(`commBottomUp_${i}`).textContent = commBottomUpByGen[i].toFixed(2);

        totalNoStopper += commNoStopperByGen[i];
        totalWithStopper += commWithStopperByGen[i];
        totalBottomUp += commBottomUpByGen[i];
    }

    // تحديث صف الإجماليات
    document.getElementById('totalRight').textContent = totalRight;
    document.getElementById('totalLeft').textContent = totalLeft;
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('totalFirstPersonComm').textContent = totalIncome.toFixed(2);
    document.getElementById('totalNoStopper').textContent = totalNoStopper.toFixed(2);
    document.getElementById('totalWithStopper').textContent = totalWithStopper.toFixed(2);
    document.getElementById('totalBottomUp').textContent = totalBottomUp.toFixed(2);
}

// ========================================
// حساب العمولات الثلاثة من الجدول
// ========================================
function calculateCommissionsFromTable(sharePerMember, stopper, commNoStopper, commWithStopper, commBottomUp) {
    for (let gen = 0; gen < ROWS; gen++) {
        const membersInGen = tableData[gen].total;

        if (membersInGen === 0) {
            commNoStopper[gen] = 0;
            commWithStopper[gen] = 0;
            commBottomUp[gen] = 0;
            continue;
        }

        // 1️⃣ العمولات بدون ستوبر
        // كل عضو يأخذ عمولة من كامل فريقه تحته
        let teamSizeNoLimit = membersInGen; // يشمل نفسه
        for (let g = gen + 1; g < ROWS; g++) {
            teamSizeNoLimit += tableData[g].total;
        }
        commNoStopper[gen] = teamSizeNoLimit * sharePerMember;

        // 2️⃣ العمولات مع ستوبر
        // كل عضو يأخذ عمولة من فريقه حتى عمق الستوبر
        let teamSizeWithLimit = membersInGen;
        const maxDepth = Math.min(gen + stopper, ROWS);
        for (let g = gen + 1; g < maxDepth; g++) {
            teamSizeWithLimit += tableData[g].total;
        }
        commWithStopper[gen] = teamSizeWithLimit * sharePerMember;

        // 3️⃣ العمولات من أسفل لأعلى
        // كل عضو يدفع لعدد من الأبلاينز = min(جيله, الستوبر)
        const beneficiariesCount = Math.min(gen + 1, stopper);
        commBottomUp[gen] = membersInGen * beneficiariesCount * sharePerMember;
    }
}

// ========================================
// حساب المخرجات - مطابق للأصل
// ========================================
function calculateOutputs() {
    try {
        // 1. ما تم تخصيصه لخطة الدخل
        // المعادلة: إجمالي عدد الأعضاء × حصة خطة الدخل
        const totalMembers = parseInt(document.getElementById('totalMembers').textContent) || 0;
        const incomePlanShare = parseFloat(document.getElementById('membersShare').value) || 0;

        const allocatedAmount = totalMembers * incomePlanShare;
        document.getElementById('totalIncomeEntered').textContent = allocatedAmount.toFixed(2);

        // 2. ما تم توزيعه بالفعل بالستوبر
        // المعادلة: الإجمالي من عمود العمولات مع الستوبر
        const distributedWithStopper = parseFloat(document.getElementById('totalWithStopper').textContent) || 0;
        document.getElementById('totalDistributed').textContent = distributedWithStopper.toFixed(2);

        // 3. خانة التحقق
        // المعادلة: ما تم تخصيصه - ما تم توزيعه
        const validation = allocatedAmount - distributedWithStopper;
        document.getElementById('verificationCheck').textContent = validation.toFixed(2);

        // تغيير لون خانة التحقق
        const verificationCard = document.getElementById('verificationCard');
        if (Math.abs(validation) < 0.01) {
            verificationCard.classList.remove('error');
        } else {
            verificationCard.classList.add('error');
        }

        // إجمالي عمولات الشخص الأول (مع Cap)
        const totalFirstPersonComm = parseFloat(document.getElementById('totalFirstPersonComm').textContent) || 0;
        const cap = parseFloat(document.getElementById('cap').value) || Infinity;
        const firstPersonWithCap = Math.min(totalFirstPersonComm, cap);
        document.getElementById('firstPersonTotal').textContent = firstPersonWithCap.toFixed(2);

    } catch (e) {
        console.error('Error in calculateOutputs:', e);
    }
}

// ========================================
// المزامنة من الشجرة التفاعلية
// ========================================
function syncFromTree() {
    const treeData = localStorage.getItem(STORAGE_KEY + '_tree');
    if (!treeData) {
        alert('لا توجد بيانات من الشجرة التفاعلية.\nاذهب لصفحة الشجرة أولاً.');
        return;
    }

    try {
        const data = JSON.parse(treeData);
        if (data.generationCounts) {
            // تحديث حقول الجدول (الجيل 2 فما فوق)
            for (let i = 1; i < ROWS; i++) {
                const gen = i + 1;
                if (data.generationCounts[gen]) {
                    document.getElementById(`right_${i}`).value = data.generationCounts[gen].right || 0;
                    document.getElementById(`left_${i}`).value = data.generationCounts[gen].left || 0;

                    document.getElementById(`right_${i}`).classList.add('from-tree');
                    document.getElementById(`left_${i}`).classList.add('from-tree');
                } else {
                    document.getElementById(`right_${i}`).value = 0;
                    document.getElementById(`left_${i}`).value = 0;
                }
            }

            calculateAll();
            saveToStorage();
            alert('تم التحديث من الشجرة بنجاح!');
        }
    } catch (e) {
        console.error('Error syncing from tree:', e);
        alert('حدث خطأ أثناء المزامنة');
    }
}

// ========================================
// حفظ البيانات
// ========================================
function saveToStorage() {
    const data = {
        inputs: {
            productPrice: document.getElementById('productPrice').value,
            deductionPercent: document.getElementById('deductionPercent').value,
            companyPercent: document.getElementById('companyPercent').value,
            generationsCount: document.getElementById('generationsCount').value,
            cap: document.getElementById('cap').value
        },
        table: tableData,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY + '_calc', JSON.stringify(data));
}

// ========================================
// تحميل البيانات
// ========================================
function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY + '_calc');
    if (saved) {
        try {
            const data = JSON.parse(saved);

            if (data.inputs) {
                document.getElementById('productPrice').value = data.inputs.productPrice || 330;
                document.getElementById('deductionPercent').value = data.inputs.deductionPercent || 10;
                document.getElementById('companyPercent').value = data.inputs.companyPercent || 25;
                document.getElementById('generationsCount').value = data.inputs.generationsCount || 11;
                document.getElementById('cap').value = data.inputs.cap || calculateDefaultCap();
            }

            if (data.table) {
                for (let i = 1; i < data.table.length && i < ROWS; i++) {
                    document.getElementById(`right_${i}`).value = data.table[i].rightLine || 0;
                    document.getElementById(`left_${i}`).value = data.table[i].leftLine || 0;
                }
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }
}

// ========================================
// عرض تلميحات الصيغ
// ========================================
function setupFormulaTooltips() {
    document.querySelectorAll('.auto-input').forEach(el => {
        el.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            const formula = this.dataset.formula || 'قيمة محسوبة تلقائياً';
            showFormulaTooltip(e.pageX, e.pageY, formula);
        });
    });

    document.addEventListener('click', hideFormulaTooltip);
}

function showFormulaTooltip(x, y, formula) {
    hideFormulaTooltip();

    const tooltip = document.getElementById('formulaTooltip');
    tooltip.textContent = formula;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.style.display = 'block';
}

function hideFormulaTooltip() {
    const tooltip = document.getElementById('formulaTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// ========================================
// عرض أعلى 100 عمولة - مطابق للأصل تماماً
// ========================================
function showTop100() {
    const treeData = localStorage.getItem(STORAGE_KEY + '_tree');
    if (!treeData) {
        alert('هذه الميزة تتطلب بناء الشجرة التفاعلية أولاً.\nاذهب لصفحة الشجرة التفاعلية وابنِ الشجرة.');
        return;
    }

    try {
        const data = JSON.parse(treeData);

        if (!data.treeStructure) {
            alert('لا توجد بيانات شجرة محفوظة.\nاذهب لصفحة الشجرة وابنِ الشجرة أولاً.');
            return;
        }

        // قراءة الإعدادات
        const generations = parseInt(document.getElementById('generationsCount').value) || 11;
        const sharePerMember = parseFloat(document.getElementById('sharePerMember').value) || 2.25;
        const limitDepth = generations - 1;

        // 1. جمع كل الأعضاء من الشجرة المحفوظة
        const allMembers = getAllMembersFromTree(data.treeStructure);

        // 2. حساب العمولة لكل عضو
        const memberData = [];

        for (const m of allMembers) {
            // حساب حجم الفريق مع الستوبر
            const countStopper = getTeamSizeWithLimit(data.treeStructure, m.id, limitDepth);
            const commission = countStopper * sharePerMember;

            // بيانات إضافية
            const totalTeam = getTeamSize(data.treeStructure, m.id);
            const rightCount = getRightCount(data.treeStructure, m.id);
            const leftCount = getLeftCount(data.treeStructure, m.id);

            memberData.push({
                id: m.id,
                gen: m.generation,
                comm: commission,
                totalTeam: totalTeam,
                right: rightCount,
                left: leftCount
            });
        }

        // 3. الترتيب التنازلي
        memberData.sort((a, b) => b.comm - a.comm);

        // 4. أخذ أعلى 100
        const top100 = memberData.slice(0, 100);

        // 5. عرض النافذة
        showTop100Modal(top100, generations);

    } catch (e) {
        console.error('Error in showTop100:', e);
        alert('حدث خطأ أثناء حساب العمولات');
    }
}

// جمع كل الأعضاء من الشجرة
function getAllMembersFromTree(node) {
    if (!node) return [];

    const members = [{
        id: node.id,
        generation: node.generation
    }];

    if (node.leftChild) {
        members.push(...getAllMembersFromTree(node.leftChild));
    }
    if (node.rightChild) {
        members.push(...getAllMembersFromTree(node.rightChild));
    }

    return members;
}

// البحث عن عضو في الشجرة
function findMemberInTree(node, id) {
    if (!node) return null;
    if (node.id === id) return node;

    const found = findMemberInTree(node.leftChild, id);
    if (found) return found;

    return findMemberInTree(node.rightChild, id);
}

// حساب حجم الفريق
function getTeamSize(root, memberId) {
    const member = findMemberInTree(root, memberId);
    if (!member) return 0;

    return countNodes(member);
}

function countNodes(node) {
    if (!node) return 0;
    return 1 + countNodes(node.leftChild) + countNodes(node.rightChild);
}

// حساب حجم الفريق مع حد العمق
function getTeamSizeWithLimit(root, memberId, maxDepth) {
    const member = findMemberInTree(root, memberId);
    if (!member) return 0;

    return countNodesWithDepth(member, 0, maxDepth);
}

function countNodesWithDepth(node, currentDepth, maxDepth) {
    if (!node) return 0;
    let count = 1;
    if (currentDepth >= maxDepth) return count;

    count += countNodesWithDepth(node.leftChild, currentDepth + 1, maxDepth);
    count += countNodesWithDepth(node.rightChild, currentDepth + 1, maxDepth);

    return count;
}

// حساب عدد الفرع الأيمن
function getRightCount(root, memberId) {
    const member = findMemberInTree(root, memberId);
    if (!member || !member.rightChild) return 0;
    return countNodes(member.rightChild);
}

// حساب عدد الفرع الأيسر
function getLeftCount(root, memberId) {
    const member = findMemberInTree(root, memberId);
    if (!member || !member.leftChild) return 0;
    return countNodes(member.leftChild);
}

// عرض نافذة Top 100
function showTop100Modal(top100, generations) {
    // إزالة النافذة القديمة إن وجدت
    const existingModal = document.getElementById('top100Modal');
    if (existingModal) {
        existingModal.remove();
    }

    // إنشاء النافذة
    const modal = document.createElement('div');
    modal.id = 'top100Modal';
    modal.className = 'top100-modal';
    modal.innerHTML = `
        <div class="top100-content">
            <div class="top100-header">
                <h2>🏆 أعلى ${top100.length} عمولة (بالستوبر)</h2>
                <button class="top100-close" onclick="closeTop100Modal()">&times;</button>
            </div>
            <div class="top100-table-container">
                <table class="top100-table">
                    <thead>
                        <tr>
                            <th>الترتيب</th>
                            <th>كود العضو</th>
                            <th>الجيل</th>
                            <th>العمولة (بالستوبر)</th>
                            <th>حجم الفريق</th>
                            <th>يمين</th>
                            <th>يسار</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${top100.map((m, i) => `
                            <tr class="${i < 3 ? 'top-rank' : ''}">
                                <td>${i + 1}</td>
                                <td>#${m.id}</td>
                                <td>${m.gen}</td>
                                <td class="commission-cell">${m.comm.toFixed(2)}</td>
                                <td>${m.totalTeam}</td>
                                <td>${m.right}</td>
                                <td>${m.left}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // إضافة الأنماط
    if (!document.getElementById('top100Styles')) {
        const styles = document.createElement('style');
        styles.id = 'top100Styles';
        styles.textContent = `
            .top100-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            .top100-content {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 900px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 10px 50px rgba(0,0,0,0.3);
            }
            .top100-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: linear-gradient(135deg, #06402B, #0F5132);
                color: white;
            }
            .top100-header h2 {
                margin: 0;
                font-size: 1.4rem;
            }
            .top100-close {
                background: none;
                border: none;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                padding: 0 10px;
            }
            .top100-close:hover {
                color: #FFD700;
            }
            .top100-table-container {
                max-height: 60vh;
                overflow-y: auto;
                padding: 0;
            }
            .top100-table {
                width: 100%;
                border-collapse: collapse;
            }
            .top100-table th {
                background: #333;
                color: white;
                padding: 12px 8px;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            .top100-table td {
                padding: 10px 8px;
                text-align: center;
                border-bottom: 1px solid #eee;
            }
            .top100-table tbody tr:hover {
                background: #f5f5f5;
            }
            .top100-table .top-rank {
                background: #fff3cd;
                font-weight: bold;
            }
            .top100-table .commission-cell {
                color: #06402B;
                font-weight: bold;
                font-size: 1.1rem;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(modal);

    // إغلاق بالنقر خارج النافذة
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeTop100Modal();
        }
    });
}

function closeTop100Modal() {
    const modal = document.getElementById('top100Modal');
    if (modal) {
        modal.remove();
    }
}

