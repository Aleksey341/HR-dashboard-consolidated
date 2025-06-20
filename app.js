
document.addEventListener('DOMContentLoaded', () => {
    let APP_DATA;
    try {
        const DATA_ELEMENT = document.getElementById('HR_DATA_JSON');
        if (!DATA_ELEMENT) { console.error('CRITICAL: #HR_DATA_JSON not found!'); alert('Ошибка: Не найден элемент данных HR_DATA_JSON.'); return; }
        const jsonDataText = DATA_ELEMENT.textContent || "";
        if (jsonDataText.trim() === "" || jsonDataText.trim() === "%%DATA_JSON%%" || jsonDataText.trim().length < 2) { console.error('CRITICAL: JSON data empty or placeholder. Text:', jsonDataText); alert('Ошибка: Данные для дашборда пусты.'); return; }
        APP_DATA = JSON.parse(jsonDataText);
    } catch (e) { console.error('CRITICAL: Failed to parse APP_DATA JSON.', e); const d = document.getElementById('HR_DATA_JSON')?.textContent.substring(0,500)+"..."; console.error('Problematic JSON (first 500 chars):',d); alert('Критическая ошибка: Не удалось обработать данные. См. консоль (F12). Данные: '+d); return; }
    if (!APP_DATA) { console.error('CRITICAL: APP_DATA undefined.'); alert('Критическая ошибка: APP_DATA не определена.'); return; }

    if (typeof TomSelect === 'undefined') { console.error("CRITICAL: TomSelect library is not loaded! Filters will not work.");}
    if (typeof ChartDataLabels === 'undefined') { console.warn("ChartDataLabels plugin not found."); }
    else {
        Chart.register(ChartDataLabels);
        Chart.defaults.set('plugins.datalabels', {
            color: function(context) {
                const bgC = context.dataset.backgroundColor;
                if (typeof bgC === 'string' && bgC !== 'transparent' && bgC !== 'rgba(0, 0, 0, 0)') {
                    try {
                        let p = bgC.match(/[\d.]+/g);
                        if(p && p.length >= 3) {
                            const r=parseInt(p[0]),g=parseInt(p[1]),b=parseInt(p[2]);
                            const br=(r*299+g*587+b*114)/1000;
                            return br > 125 ? '#333333':'#FFFFFF';
                        }
                    } catch(e){}
                }
                return document.documentElement.getAttribute('data-bs-theme')==='dark'?'#DDDDDD':'#333333';
            },
            font: { weight: 'bold', size: 12 },
            formatter: function(v) { if (typeof v === 'number') return Math.round(v); return v; },
            anchor: 'center', align: 'center',
            display: function(ctx) {
                if (ctx.chart.config.type === 'bar') {
                    const value = ctx.dataset.data[ctx.dataIndex];
                    return value !== null && value !== 0;
                }
                return ctx.dataset.data[ctx.dataIndex] > 0 && ctx.dataset.data[ctx.dataIndex] !== null;
            }
        });
    }

    // Функции экспорта графиков
    function exportChartAsPNG(chartId, title) {
        const canvas = qs(`#${chartId}`);
        if (!canvas) {
            alert('График не найден');
            return;
        }
        const link = document.createElement('a');
        link.download = `${title}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function exportChartAsPDF(chartId, title) {
        const canvas = qs(`#${chartId}`);
        if (!canvas) {
            alert('График не найден');
            return;
        }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('landscape');
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.text(title, 10, imgHeight + 20);
        pdf.save(`${title}.pdf`);
    }

    function exportSlideAsPDF(slideId, title) {
        const slideElement = qs(`#${slideId}`);
        if (!slideElement) {
            alert('Слайд не найден');
            return;
        }
        html2canvas(slideElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#212529' : '#ffffff'
        }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('landscape');
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 280;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            if (imgHeight > 190) {
                const ratio = 190 / imgHeight;
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth * ratio, 190);
            } else {
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            }
            
            pdf.save(`${title}.pdf`);
        }).catch(error => {
            console.error('Ошибка экспорта слайда:', error);
            alert('Ошибка при экспорте слайда');
        });
    }

    function exportSlideAsPNG(slideId, title) {
        const slideElement = qs(`#${slideId}`);
        if (!slideElement) {
            alert('Слайд не найден');
            return;
        }
        html2canvas(slideElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#212529' : '#ffffff'
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${title}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(error => {
            console.error('Ошибка экспорта слайда:', error);
            alert('Ошибка при экспорте слайда');
        });
    }

    // Функция показа меню экспорта
    function showExportMenu(chartId, title, isSlide = false, event) {
        const menu = document.createElement('div');
        menu.className = 'export-menu position-fixed';
        menu.style.cssText = `
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            min-width: 150px;
        `;
        
        if (document.documentElement.getAttribute('data-bs-theme') === 'dark') {
            menu.style.backgroundColor = '#343a40';
            menu.style.borderColor = '#495057';
            menu.style.color = '#fff';
        }

        const pngBtn = document.createElement('button');
        pngBtn.className = 'btn btn-sm btn-outline-primary w-100 mb-2';
        pngBtn.innerHTML = '<i class="bi bi-image"></i> Экспорт PNG';
        pngBtn.onclick = () => {
            if (isSlide) {
                exportSlideAsPNG(chartId, title);
            } else {
                exportChartAsPNG(chartId, title);
            }
            document.body.removeChild(menu);
        };

        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'btn btn-sm btn-outline-danger w-100';
        pdfBtn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Экспорт PDF';
        pdfBtn.onclick = () => {
            if (isSlide) {
                exportSlideAsPDF(chartId, title);
            } else {
                exportChartAsPDF(chartId, title);
            }
            document.body.removeChild(menu);
        };

        menu.appendChild(pngBtn);
        menu.appendChild(pdfBtn);

        const rect = event.target.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = (rect.bottom + 5) + 'px';

        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    if (document.body.contains(menu)) {
                        document.body.removeChild(menu);
                    }
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    const qs = (selector, parent = document) => parent.querySelector(selector);
    const qsa = (selector, parent = document) => parent.querySelectorAll(selector);
    const branchCharts = {};

    // Улучшенная функция для создания TomSelect с правильной сортировкой
    function createTomSelectInstance(selector, options, items, placeholder, onChangeCallback) {
        if (typeof TomSelect === 'undefined') { console.error("TomSelect is not loaded!"); return null;}
        const el = qs(selector);
        if (!el) { console.error("TomSelect target element not found: " + selector); return null; }
        
        let sortedOptions = [...options];
        let correctOrder = [];
        
        if (selector.includes('month-select')) {
            correctOrder = APP_DATA.months || [];
            sortedOptions = correctOrder.filter(month => options.includes(month));
        } else if (selector.includes('quarter-select')) {
            correctOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
            sortedOptions = correctOrder.filter(q => options.includes(q));
        }
        
        function sortSelectedItems(selectedItems) {
            if (selector.includes('month-select') || selector.includes('quarter-select')) {
                return selectedItems.sort((a, b) => correctOrder.indexOf(a) - correctOrder.indexOf(b));
            }
            return selectedItems;
        }
        
        const tomSelect = new TomSelect(el, {
            plugins: ['remove_button'],
            options: sortedOptions.map((v, index) => ({ value: String(v), text: String(v), order: index })),
            items: sortSelectedItems(items.map(String)),
            placeholder,
            onChange: function(values) {
                const sortedValues = sortSelectedItems(Array.isArray(values) ? values : [values]);
                if (JSON.stringify(sortedValues) !== JSON.stringify(values)) {
                    this.setValue(sortedValues, true);
                }
                if (onChangeCallback) {
                    onChangeCallback(sortedValues);
                }
            },
            hideSelected: true,
            sortField: null,
            render: {
                option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; }
            }
        });
        return tomSelect;
    }

    function createKpiCheckboxes(containerSelector, kpisConfig, initialStates, isSingleSelect, onChangeCallback, storageKey, forBranchTab = false) {
        const container = qs(containerSelector);
        if (!container) { console.error(`KPI checkbox container not found: ${containerSelector}`); return { ...initialStates }; }
        container.innerHTML = '';
        const activeKpis = { ...initialStates };
        const kpisToDisplay = kpisConfig.filter(kpi => !(forBranchTab && kpi.kls === 'enps' && kpi.agg_rules.quarter === 'skip' && kpi.agg_rules.month === 'skip'));
        kpisToDisplay.forEach((kpi, index) => {
            let isChecked = false;
            if (isSingleSelect) {
                let defaultKpiIndex = 0;
                if (forBranchTab && kpisToDisplay.length > 1 && kpisToDisplay[0].kls === 'enps' && kpisToDisplay[0].agg_rules.quarter === 'skip') {
                    const nonEnpsIndex = kpisToDisplay.findIndex(k => !(k.kls === 'enps' && k.agg_rules.quarter === 'skip'));
                    if (nonEnpsIndex !== -1) defaultKpiIndex = nonEnpsIndex;
                }
                if (Object.values(activeKpis).every(val => val === false)) { isChecked = (index === defaultKpiIndex); if (isChecked) activeKpis[kpi.kls] = true; }
                else { isChecked = activeKpis[kpi.kls] === true; }
            } else {
                isChecked = activeKpis[kpi.kls] === undefined ? true : activeKpis[kpi.kls] !== false;
                if (activeKpis[kpi.kls] === undefined) activeKpis[kpi.kls] = true;
            }
            const label = document.createElement('label'); label.className = 'form-check form-check-inline mb-0 align-items-center';
            const input = document.createElement('input'); input.type = isSingleSelect ? 'radio' : 'checkbox'; input.className = 'form-check-input';
            if (isSingleSelect) { input.name = containerSelector.replace(/[#.]/g, '') + '-kpiRadioGroup'; }
            input.dataset.kls = kpi.kls; input.checked = isChecked;
            input.addEventListener('change', (e) => {
                const kls = e.target.dataset.kls;
                if (isSingleSelect) {
                    Object.keys(activeKpis).forEach(key => { activeKpis[key] = false; });
                    activeKpis[kls] = e.target.checked;
                    container.querySelectorAll(`input[name="${input.name}"]`).forEach(el => { if (el !== input) el.checked = false; });
                } else { activeKpis[kls] = e.target.checked; }
                if (storageKey) localStorage.setItem(storageKey, JSON.stringify(activeKpis));
                if (onChangeCallback) onChangeCallback(activeKpis);
                requestAnimationFrame(adjustStickyLayout);
            });
            const span = document.createElement('span'); span.className = 'form-check-label user-select-none'; span.textContent = kpi.name;
            label.appendChild(input); label.appendChild(span); container.appendChild(label);
        });
        if (isSingleSelect && kpisToDisplay.length > 0 && !Object.values(activeKpis).some(val => val === true)) {
            let defaultKpiIndex = 0;
            if (forBranchTab && kpisToDisplay.length > 1 && kpisToDisplay[0].kls === 'enps' && kpisToDisplay[0].agg_rules.quarter === 'skip') {
                const nonEnpsIndex = kpisToDisplay.findIndex(k => !(k.kls === 'enps' && k.agg_rules.quarter === 'skip'));
                if (nonEnpsIndex !== -1) defaultKpiIndex = nonEnpsIndex;
            }
            const firstKpiKls = kpisToDisplay[defaultKpiIndex].kls; activeKpis[firstKpiKls] = true;
            const firstRadio = container.querySelector(`input[data-kls="${firstKpiKls}"]`);
            if (firstRadio) firstRadio.checked = true;
        } return activeKpis;
    }

    // Функция создания слайдов для филиала (с кнопками экспорта)
    function createBranchSlides(branchName, tabSafeBranchName) {
        const branchData = APP_DATA.data[branchName];
        if (!branchData || !branchData.slides) return '';

        const hiringSlide = branchData.slides.hiring;
        const exitSlide = branchData.slides.exit_interviews;

        let slidesHtml = '<div class="branch-slides">';
        
        slidesHtml += `
            <div class="slide-card">
                <div class="slide-header d-flex justify-content-between align-items-center">
                    <div><i class="bi bi-graph-up me-2"></i>Динамика найма и увольнений</div>
                    <button class="btn btn-success btn-sm export-chart-btn" data-chart-id="hiring-chart-${tabSafeBranchName}" data-title="Динамика найма и увольнений - ${branchName}">
                        <i class="bi bi-download me-1"></i>Экспорт графика
                    </button>
                </div>
                <div class="slide-content">
                    <div class="chart-container">
                        <canvas id="hiring-chart-${tabSafeBranchName}" style="max-height: 400px;"></canvas>
                    </div>
                    <div class="text-center mt-3">
                        <small class="text-muted">Период отчета: ${hiringSlide.vacancies_report_period}</small>
                    </div>
                </div>
            </div>
        `;

        slidesHtml += `
            <div class="slide-card">
                <div class="slide-header d-flex justify-content-between align-items-center">
                    <div><i class="bi bi-chat-dots me-2"></i>Анализ Exit-интервью</div>
                    <button class="btn btn-warning btn-sm export-slide-btn" data-slide-id="exit-slide-${tabSafeBranchName}" data-title="Exit-интервью - ${branchName}">
                        <i class="bi bi-file-earmark-pdf me-1"></i>Экспорт слайда
                    </button>
                </div>
                <div class="slide-content" id="exit-slide-${tabSafeBranchName}">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Топ причин ухода:</h6>
                            <div class="chart-container" style="height: 300px;">
                                <canvas id="exit-reasons-chart-${tabSafeBranchName}"></canvas>
                            </div>
                            <div id="no-exit-data-${tabSafeBranchName}" style="display: none;">
                                <p class="text-muted">Данные отсутствуют</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6>Оценка атмосферы в компании:</h6>
                            ${Object.keys(exitSlide.atmosphere_data).length > 0 ?
                                Object.entries(exitSlide.atmosphere_data).map(([question, data]) => `
                                    <div class="atmosphere-item">
                                        <h6 class="mb-3">${question}</h6>
                                        <div class="progress mb-2" style="height: 25px;">
                                            <div class="progress-bar progress-bar-good" role="progressbar" 
                                                 style="width: ${data.good_percent}%" 
                                                 aria-valuenow="${data.good_percent}" aria-valuemin="0" aria-valuemax="100">
                                                ${Math.round(data.good_percent)}% полож.
                                            </div>
                                            <div class="progress-bar progress-bar-bad" role="progressbar" 
                                                 style="width: ${data.bad_percent}%" 
                                                 aria-valuenow="${data.bad_percent}" aria-valuemin="0" aria-valuemax="100">
                                                ${Math.round(data.bad_percent)}% отриц.
                                            </div>
                                        </div>
                                        <small class="text-muted">Всего ответов: ${data.total_responses}</small>
                                    </div>
                                `).join('') :
                                '<p class="text-muted">Данные об атмосфере отсутствуют</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        slidesHtml += '</div>';
        return slidesHtml;
    }

    // Функция создания круговой диаграммы причин ухода для слайда
    function createExitReasonsChart(branchName, tabSafeBranchName) {
        const canvas = qs(`#exit-reasons-chart-${tabSafeBranchName}`);
        const noDataDiv = qs(`#no-exit-data-${tabSafeBranchName}`);
        
        if (!canvas) return;

        const branchData = APP_DATA.data[branchName];
        if (!branchData || !branchData.slides || !branchData.slides.exit_interviews) {
            if (noDataDiv) { canvas.style.display = 'none'; noDataDiv.style.display = 'block'; }
            return;
        }

        const topReasons = branchData.slides.exit_interviews.top_reasons;
        if (!topReasons || topReasons.length === 0) {
            if (noDataDiv) { canvas.style.display = 'none'; noDataDiv.style.display = 'block'; }
            return;
        }
        
        if (noDataDiv) { noDataDiv.style.display = 'none'; canvas.style.display = 'block'; }

        const colors = ['#6f42c1', '#17a2b8', '#28a745', '#ffc107', '#fd7e14', '#dc3545', '#6c757d', '#007bff', '#20c997', '#e83e8c'];
        const labels = topReasons.map(item => item.reason);
        const data = topReasons.map(item => item.count);
        const backgroundColors = topReasons.map((_, index) => colors[index % colors.length]);

        try {
            const exitChart = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: '#fff',
                        borderWidth: 2,
                        hoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                usePointStyle: true, padding: 20, font: { size: 12 },
                                color: () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#ffffff' : '#333333',
                                generateLabels: (chart) => {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        const dataset = data.datasets[0];
                                        const total = dataset.data.reduce((sum, value) => sum + value, 0);
                                        return data.labels.map((label, i) => {
                                            const value = dataset.data[i];
                                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                            return {
                                                text: `${label}: ${value} (${percentage}%)`,
                                                fillStyle: dataset.backgroundColor[i],
                                                strokeStyle: dataset.borderColor,
                                                lineWidth: dataset.borderWidth,
                                                fontColor: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#ffffff' : '#333333',
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        },
                        datalabels: {
                            display: (context) => {
                                const value = context.dataset.data[context.dataIndex];
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = total > 0 ? (value / total) * 100 : 0;
                                return percentage > 8;
                            },
                            color: '#fff', font: { weight: 'bold', size: 11 },
                            formatter: (value, context) => {
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';
                            }
                        }
                    },
                    cutout: '40%',
                    animation: { animateRotate: true, animateScale: false }
                }
            });
            canvas.chart = exitChart;
        } catch (error) {
            console.error(`Error creating exit reasons chart for ${branchName}:`, error);
            if (noDataDiv) { canvas.style.display = 'none'; noDataDiv.style.display = 'block'; }
        }
    }
    
    function createHiringChart(branchName, tabSafeBranchName) {
        const canvas = qs(`#hiring-chart-${tabSafeBranchName}`);
        if (!canvas) return;
        const branchData = APP_DATA.data[branchName];
        if (!branchData || !branchData.slides || !branchData.slides.hiring) return;
        const timelineData = branchData.slides.hiring.hired_fired_timeline;
        const labels = timelineData.map(item => item.period);
        const hiredData = timelineData.map(item => item.hired);
        const firedData = timelineData.map(item => item.fired);
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Принято', data: hiredData, backgroundColor: '#28a745',
                }, {
                    label: 'Уволено', data: firedData, backgroundColor: '#dc3545',
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    legend: { position: 'top' },
                    datalabels: {
                        display: true, color: '#fff', font: { weight: 'bold', size: 11 },
                        formatter: (value) => value > 0 ? value : ''
                    }
                }
            }
        });
    }

    const stickyPageTopPanel = qs('#sticky-page-top-panel');
    const mainTableControlsStickyBlock = qs('#main-table-controls-sticky-block');
    const mainContentArea = qs('#main-content-area');
    const branchTabsNavContainer = qs('#branch-tabs-nav');
    const dashboardTabContent = qs('#dashboard-tab-content');
    const turnoverForecastCheckbox = qs('#turnover-forecast-checkbox');
    const turnoverForecastWrapper = qs('#turnover-forecast-checkbox-wrapper');
    const turnoverMonthlyCumulativeCheckbox = qs('#turnover-monthly-cumulative-checkbox');
    const turnoverMonthlyCumulativeWrapper = qs('#turnover-monthly-cumulative-checkbox-wrapper');

    let isMainTableTabActive = true;
    let showTurnoverForecast;
    const savedForecastState = localStorage.getItem('showTurnoverForecast');
    if (savedForecastState !== null) { showTurnoverForecast = savedForecastState === 'true'; }
    else { showTurnoverForecast = true; localStorage.setItem('showTurnoverForecast', 'true'); }
    if (turnoverForecastCheckbox) { turnoverForecastCheckbox.checked = showTurnoverForecast; }
    turnoverForecastCheckbox?.addEventListener('change', (event) => { showTurnoverForecast = event.target.checked; localStorage.setItem('showTurnoverForecast', showTurnoverForecast.toString()); renderMainTable(); });

    let showTurnoverMonthlyCumulative;
    const savedTurnoverMonthlyCumulativeState = localStorage.getItem('showTurnoverMonthlyCumulative');
    if (savedTurnoverMonthlyCumulativeState !== null) {
        showTurnoverMonthlyCumulative = savedTurnoverMonthlyCumulativeState === 'true';
    } else {
        showTurnoverMonthlyCumulative = false;
        localStorage.setItem('showTurnoverMonthlyCumulative', 'false');
    }
    if (turnoverMonthlyCumulativeCheckbox) {
        turnoverMonthlyCumulativeCheckbox.checked = showTurnoverMonthlyCumulative;
    }
    turnoverMonthlyCumulativeCheckbox?.addEventListener('change', (event) => {
        showTurnoverMonthlyCumulative = event.target.checked;
        localStorage.setItem('showTurnoverMonthlyCumulative', showTurnoverMonthlyCumulative.toString());
        renderMainTable();
    });

    let initialMainKpis = JSON.parse(localStorage.getItem('mainDashboardKpis'));
    if (initialMainKpis === null) { 
        initialMainKpis = { "turn": true, "staff": true, "hf": true, "cr": false, "enps": false }; 
    }
    let activeMainKpis = {};

    function toggleTurnoverForecastCheckboxVisibility() {
        if (!turnoverForecastWrapper || !activeMainKpis || !mainFilters) { if(turnoverForecastWrapper) turnoverForecastWrapper.style.display = 'none'; return; }
        const turnKpiActive = activeMainKpis['turn'];
        const noMonthsOrQuartersSelected = mainFilters.months.length === 0 && mainFilters.quarters.length === 0;
        const onlyYearsSelected = mainFilters.years.length > 0 && noMonthsOrQuartersSelected;
        if (turnKpiActive && onlyYearsSelected && isMainTableTabActive) { turnoverForecastWrapper.style.display = ''; }
        else { turnoverForecastWrapper.style.display = 'none'; }
    }

    function toggleTurnoverMonthlyCumulativeCheckboxVisibility() {
        if (!turnoverMonthlyCumulativeWrapper || !activeMainKpis || !mainFilters) {
            if (turnoverMonthlyCumulativeWrapper) turnoverMonthlyCumulativeWrapper.style.display = 'none';
            return;
        }
        const turnKpiActive = activeMainKpis['turn'];
        const monthsSelected = mainFilters.months.length > 0;
        if (turnKpiActive && monthsSelected && isMainTableTabActive) {
            turnoverMonthlyCumulativeWrapper.style.display = '';
        } else {
            turnoverMonthlyCumulativeWrapper.style.display = 'none';
        }
    }

    function adjustStickyLayout() {
        if (!stickyPageTopPanel || !mainContentArea || !mainTableControlsStickyBlock) { return; }
        stickyPageTopPanel.classList.remove('sticky-panel-active');
        mainContentArea.style.paddingTop = '0px';
        if (!isMainTableTabActive) { mainTableControlsStickyBlock.style.display = 'none'; }
        if (isMainTableTabActive) {
            mainTableControlsStickyBlock.style.display = ''; 
            stickyPageTopPanel.classList.add('sticky-panel-active');
            requestAnimationFrame(() => {
                const topPanelHeight = stickyPageTopPanel.offsetHeight;
                mainContentArea.style.paddingTop = topPanelHeight + 'px';
            });
        } else {
            stickyPageTopPanel.classList.add('sticky-panel-active');
            requestAnimationFrame(() => {
                const headerHeight = qs('.header', stickyPageTopPanel)?.offsetHeight || 0;
                const navTabsHeight = qs('.branch-tabs-nav-container', stickyPageTopPanel)?.offsetHeight || 0;
                const reducedStickyHeight = headerHeight + navTabsHeight;
                mainContentArea.style.paddingTop = reducedStickyHeight + 'px';
            });
        }
    }

    try {
        const genTimeSpan = mainTableControlsStickyBlock ? qs('#generation-time-span', mainTableControlsStickyBlock) : null;
        if (genTimeSpan && APP_DATA.generation_time) genTimeSpan.textContent = 'Отчёт: ' + APP_DATA.generation_time;
    } catch(e) { console.error("Error UI setup:", e); }

    const themeSwitchCheckbox = qs('#theme-switch-checkbox');
    function applyTheme(theme, updateSwitch = true) { 
        document.documentElement.setAttribute('data-bs-theme', theme); 
        localStorage.setItem('dashboardTheme', theme); 
        if (updateSwitch && themeSwitchCheckbox) themeSwitchCheckbox.checked = theme === 'dark'; 
        
        Object.values(branchCharts).forEach(cI => { if (cI && cI.ctx) cI.update(); });
        
        const exitChartCanvases = qsa('canvas[id^="exit-reasons-chart-"]');
        exitChartCanvases.forEach(canvas => {
            if (canvas.chart) {
                const newColor = theme === 'dark' ? '#ffffff' : '#333333';
                if (canvas.chart.options.plugins.legend.labels.color) {
                    canvas.chart.options.plugins.legend.labels.color = () => newColor;
                }
                canvas.chart.update();
            }
        });
        requestAnimationFrame(adjustStickyLayout); 
    }
    const savedTheme = localStorage.getItem('dashboardTheme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (themeSwitchCheckbox) themeSwitchCheckbox.checked = savedTheme === 'dark';
    applyTheme(savedTheme, false);
    themeSwitchCheckbox?.addEventListener('change', () => { applyTheme(themeSwitchCheckbox.checked ? 'dark' : 'light', false); });

    const formatters = {
        percent: val => (parseFloat(val) * 100).toFixed(1) + '%',
        decimal: val => parseFloat(val).toFixed(1),
        integer_ratio: arrVal => Array.isArray(arrVal) && arrVal.length === 2 ? String(arrVal[0]) + ' / ' + String(arrVal[1]) : (arrVal || '·'),
        integer: val => parseInt(val, 10),
        enps_with_plan: valObj => {
            if (valObj && typeof valObj.actual === 'number' && !isNaN(valObj.actual)) {
                let text = parseFloat(valObj.actual).toFixed(1);
                if (valObj.fulfillment_decimal !== null && valObj.fulfillment_decimal !== undefined && !isNaN(valObj.fulfillment_decimal)) {
                    const fulfillmentPercent = parseFloat(valObj.fulfillment_decimal) * 100;
                    let fulfillmentText = fulfillmentPercent.toFixed(0) + '%';
                    if (fulfillmentPercent < 0) { fulfillmentText = `<span class="text-danger">(${fulfillmentText})</span>`; }
                    else { fulfillmentText = ` (${fulfillmentText})`; }
                    text += fulfillmentText;
                } else if (valObj.plan !== null && valObj.plan !== undefined && !isNaN(valObj.plan)) { text += ' (план: ' + parseFloat(valObj.plan).toFixed(1) + ')';}
                return text;
            } return '·';
        }, default: val => val === null || val === undefined ? '·' : val
    };

    function getKpiValueDisplay(kpiConfig, value, periodType = 'default', isForecast = false) {
        let className = ''; let isHtmlOutput = false;
        if (kpiConfig.fmt === 'enps_with_plan') { return { text: formatters.enps_with_plan(value), className: className, isHtml: true };}
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) { return { text: '·', className: className, isHtml: isHtmlOutput }; }
        const formatter = formatters[kpiConfig.fmt] || formatters.default; let text = formatter(value);
        const valToCheck = Array.isArray(value) ? value[0] : parseFloat(value);
        if (kpiConfig.kls === 'turn') {
            let limit;
            if (isForecast && periodType === 'years') { limit = kpiConfig.limit_year_forecast; }
            else if (periodType === 'years') { limit = kpiConfig.plan_year; }
            else if (periodType === 'quarters') { limit = kpiConfig.plan_quarter;}
            else if (periodType === 'months') { limit = kpiConfig.plan_month;}
            if (limit !== undefined && kpiConfig.higher_is_worse && valToCheck > limit) { className = 'kpi-value-bad'; }
        } else if (kpiConfig.kls === 'staff') {
            if (kpiConfig.limit !== undefined && !kpiConfig.higher_is_worse && valToCheck < kpiConfig.limit) { className = 'kpi-value-bad'; }
        } else if (kpiConfig.kls !== 'cr' && kpiConfig.kls !== 'enps' && kpiConfig.limit !== undefined && kpiConfig.higher_is_worse !== undefined ) {
            if (kpiConfig.higher_is_worse) { if (valToCheck > kpiConfig.limit) className = 'kpi-value-bad';}
            else { if (valToCheck < kpiConfig.limit) className = 'kpi-value-bad';}
        } return { text, className, isHtml: isHtmlOutput };
    }

    const mainTable = qs('#main-hr-table');
    const kpiCheckboxBarMain = qs('#kpi-checkbox-bar', mainTableControlsStickyBlock);
    const yearSelectMain = qs('#year-select', mainTableControlsStickyBlock);
    const quarterSelectMain = qs('#quarter-select', mainTableControlsStickyBlock);
    const monthSelectMain = qs('#month-select', mainTableControlsStickyBlock);
    const antiTopNRadios = qsa('input[name="antiTopN"]', mainTableControlsStickyBlock);
    const antiTopKpiSourceSelect = qs('#anti-top-kpi-source', mainTableControlsStickyBlock);

    let mainFilters = JSON.parse(localStorage.getItem('mainDashboardFilters'));
    if (!mainFilters) {
        mainFilters = {
            years: (APP_DATA.years && APP_DATA.years.length > 0) ? [APP_DATA.years[APP_DATA.years.length - 1]] : [],
            quarters: ['Q1'],
            months: ['Январь']
        };
        localStorage.setItem('mainDashboardFilters', JSON.stringify(mainFilters));
    }

    let activeAntiTopConfig = { kpiSource: antiTopKpiSourceSelect ? antiTopKpiSourceSelect.value : 'turn', n: 0 };
    const currentAntiTopNRadio = qs('input[name="antiTopN"]:checked', mainTableControlsStickyBlock);
    if (currentAntiTopNRadio) activeAntiTopConfig.n = parseInt(currentAntiTopNRadio.value, 10);

    if (kpiCheckboxBarMain) {
        activeMainKpis = createKpiCheckboxes('#kpi-checkbox-bar', APP_DATA.kpis, initialMainKpis, false,
            (newActiveKpis)=>{ activeMainKpis = newActiveKpis; renderMainTable(); }, 'mainDashboardKpis');
    } else { activeMainKpis = JSON.parse(JSON.stringify(initialMainKpis)); }

    function updateAntiTopConfigAndRender() { const selectedNRadio = qs('input[name="antiTopN"]:checked', mainTableControlsStickyBlock); activeAntiTopConfig.n = selectedNRadio ? parseInt(selectedNRadio.value, 10) : 0; activeAntiTopConfig.kpiSource = antiTopKpiSourceSelect ? antiTopKpiSourceSelect.value : 'turn'; if (antiTopKpiSourceSelect) antiTopKpiSourceSelect.disabled = activeAntiTopConfig.n === 0; renderMainTable(); }
    antiTopNRadios.forEach(radio => radio.addEventListener('change', updateAntiTopConfigAndRender));
    if (antiTopKpiSourceSelect) { antiTopKpiSourceSelect.addEventListener('change', updateAntiTopConfigAndRender); antiTopKpiSourceSelect.disabled = activeAntiTopConfig.n === 0; }

    const tableFilterInput = qs('#table-filter-input');
    const sortAscBtn = qs('#sort-asc-btn');
    const sortDescBtn = qs('#sort-desc-btn');
    
    let currentTableFilter = '';
    let currentSortOrder = null;
    let columnColorFilters = {};

    function applyColumnColorFilter(columnIndex, filterType) {
        columnColorFilters[columnIndex] = filterType;
        updateFilterButtonAppearance(columnIndex, filterType);
        applyTableFilters();
    }

    function updateFilterButtonAppearance(columnIndex, filterType) {
        setTimeout(() => {
            const headerCells = mainTable.querySelectorAll('th');
            if (headerCells[columnIndex]) {
                const filterBtn = headerCells[columnIndex].querySelector('.bi-funnel');
                if (filterBtn) {
                    filterBtn.classList.remove('text-muted', 'text-primary', 'text-danger', 'text-success');
                    if (filterType === 'all') { filterBtn.classList.add('text-muted'); } 
                    else if (filterType === 'bad') { filterBtn.classList.add('text-danger'); } 
                    else if (filterType === 'good') { filterBtn.classList.add('text-success'); }
                }
            }
        }, 10);
    }

    function applyTableFilters() {
        const tbody = mainTable.tBodies[0];
        if (!tbody) return;
        const rows = Array.from(tbody.rows);
        
        rows.forEach(row => {
            let shouldShow = true;
            if (currentTableFilter) {
                const branchCell = row.cells[0];
                const branchName = branchCell ? branchCell.textContent.toLowerCase() : '';
                if (!branchName.includes(currentTableFilter.toLowerCase())) {
                    shouldShow = false;
                }
            }
            
            if (shouldShow && Object.keys(columnColorFilters).length > 0) {
                for (const [colIndex, filterType] of Object.entries(columnColorFilters)) {
                    if (filterType === 'all') continue;
                    const cell = row.cells[parseInt(colIndex)];
                    if (cell) {
                        const hasBadValue = cell.classList.contains('kpi-value-bad');
                        if (filterType === 'bad' && !hasBadValue) { shouldShow = false; break; } 
                        else if (filterType === 'good' && hasBadValue) { shouldShow = false; break; }
                    }
                }
            }
            row.classList.toggle('hidden-row', !shouldShow);
        });
    }

    function sortTable(order) {
        const tbody = mainTable.tBodies[0];
        if (!tbody) return;
        const rows = Array.from(tbody.rows);
        rows.sort((a, b) => {
            const textA = a.cells[0] ? a.cells[0].textContent.trim() : '';
            const textB = b.cells[0] ? b.cells[0].textContent.trim() : '';
            return order === 'asc' ? textA.localeCompare(textB, 'ru') : textB.localeCompare(textA, 'ru');
        });
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        currentSortOrder = order;
        applyTableFilters();
    }

    if (tableFilterInput) { tableFilterInput.addEventListener('input', (e) => { currentTableFilter = e.target.value; applyTableFilters(); }); }
    if (sortAscBtn) { sortAscBtn.addEventListener('click', () => sortTable('asc')); }
    if (sortDescBtn) { sortDescBtn.addEventListener('click', () => sortTable('desc')); }

    function renderMainTable() {
        if (!mainTable) return;
        requestAnimationFrame(adjustStickyLayout); 
        toggleTurnoverForecastCheckboxVisibility();
        toggleTurnoverMonthlyCumulativeCheckboxVisibility();

        const tHead = mainTable.tHead||mainTable.createTHead(); const tBody = mainTable.tBodies[0]||mainTable.createTBody();
        tHead.innerHTML=''; tBody.innerHTML=''; const cols=[];
        const yIterMain=mainFilters.years.length?mainFilters.years:(APP_DATA.years||[]);
        APP_DATA.kpis.forEach(kC=>{
            if(!activeMainKpis[kC.kls])return;
            let headerSuffix = "";
            if (kC.kls === 'turn' && showTurnoverForecast && mainFilters.months.length === 0 && mainFilters.quarters.length === 0) { headerSuffix = " (прогноз)"; }

            if(kC.kls==='enps'){yIterMain.forEach(y=>{cols.push({kpi:kC,periodType:'years',periodKey:String(y),header:kC.name+' '+y});});return;}

            if(mainFilters.months.length){
                mainFilters.months.forEach(m=>yIterMain.forEach(y=>{
                    let monthHeaderSuffix = "";
                    if (kC.kls === 'turn' && turnoverMonthlyCumulativeCheckbox && turnoverMonthlyCumulativeCheckbox.checked) {
                        monthHeaderSuffix = " (Накоп.)";
                    }
                    cols.push({kpi:kC,periodType:'months',periodKey:m+'_'+y,header:kC.name+' ' + m + ' ' + String(y) + monthHeaderSuffix });
                }));
            }
            else if(mainFilters.quarters.length){mainFilters.quarters.forEach(q=>yIterMain.forEach(y=>{cols.push({kpi:kC,periodType:'quarters',periodKey:q+'_'+y,header:kC.name+' '+q+'.'+String(y).slice(2) });}));}
            else if(!mainFilters.months.length&&!mainFilters.quarters.length&&yIterMain.length){yIterMain.forEach(y=>{cols.push({kpi:kC,periodType:'years',periodKey:String(y),header:kC.name+' '+y + headerSuffix });});}
        });
        if(!cols.length&&Object.keys(activeMainKpis).some(k=>activeMainKpis[k])&&yIterMain.length>0){const dY=yIterMain.length?yIterMain:(APP_DATA.years&&APP_DATA.years.length>0?[APP_DATA.years[APP_DATA.years.length-1]]:[]);APP_DATA.kpis.forEach(kC=>{if(!activeMainKpis[kC.kls])return;let headerSuffix = (kC.kls === 'turn' && showTurnoverForecast && mainFilters.months.length === 0 && mainFilters.quarters.length === 0) ? " (прогноз)" : ""; dY.forEach(y=>{cols.push({kpi:kC,periodType:'years',periodKey:String(y),header:kC.name+' '+y+headerSuffix});});});}

        let branchesToRender = [...APP_DATA.branches];
        if (activeAntiTopConfig.n > 0 && APP_DATA.anti_tops && cols.length > 0) {
            const qualifyingBranches = new Set();
            if (activeAntiTopConfig.kpiSource === 'both') {
                let allDoublyBadItems = []; const processedPeriods = new Set();
                cols.forEach(colDef => { const uniquePeriodIdentifier = `${colDef.periodType}_${colDef.periodKey}`; if (processedPeriods.has(uniquePeriodIdentifier) && colDef.kpi.kls !== 'turn' && colDef.kpi.kls !== 'staff') return; processedPeriods.add(uniquePeriodIdentifier); const periodTypePlural = colDef.periodType; const pKey = colDef.periodKey; const antiTopListBothForThisPeriod = APP_DATA.anti_tops['both']?.[periodTypePlural]?.[pKey]; if (antiTopListBothForThisPeriod) { allDoublyBadItems.push(...antiTopListBothForThisPeriod); }});
                const branchMaxDeviation = {}; allDoublyBadItems.forEach(item => { if (!branchMaxDeviation[item.branch] || item.deviation > branchMaxDeviation[item.branch].deviation) { branchMaxDeviation[item.branch] = item; }});
                const uniqueSortedDoublyBadItems = Object.values(branchMaxDeviation).sort((a, b) => b.deviation - a.deviation);
                uniqueSortedDoublyBadItems.slice(0, activeAntiTopConfig.n).forEach(item => qualifyingBranches.add(item.branch));
            } else {
                let allItemsForSingleKPI = [];
                cols.forEach(colDef => { if (colDef.kpi.kls === activeAntiTopConfig.kpiSource) { const periodTypePlural = colDef.periodType; const periodKey = colDef.periodKey; const antiTopList = APP_DATA.anti_tops[activeAntiTopConfig.kpiSource]?.[periodTypePlural]?.[periodKey]; if (antiTopList) { allItemsForSingleKPI.push(...antiTopList);}}});
                const branchMaxDeviationSingle = {}; allItemsForSingleKPI.forEach(item => { if (!branchMaxDeviationSingle[item.branch] || item.deviation > branchMaxDeviationSingle[item.branch].deviation) { branchMaxDeviationSingle[item.branch] = item; }});
                const uniqueSortedSingleKPIItems = Object.values(branchMaxDeviationSingle).sort((a,b) => b.deviation - a.deviation);
                uniqueSortedSingleKPIItems.slice(0, activeAntiTopConfig.n).forEach(item => qualifyingBranches.add(item.branch));
            }
            if (qualifyingBranches.size > 0) { branchesToRender = APP_DATA.branches.filter(b => qualifyingBranches.has(b)); } else { branchesToRender = []; }
        }
        const headerRow=tHead.insertRow();const thBranch=document.createElement('th');thBranch.textContent='Филиал';thBranch.className='text-center';headerRow.appendChild(thBranch); 
        
        cols.forEach((c, colIndex)=>{
            const th=document.createElement('th');
            th.className='text-center position-relative';
            const headerContainer = document.createElement('div');
            headerContainer.className = 'd-flex align-items-center justify-content-center gap-1';
            const headerText = document.createElement('span');
            headerText.textContent = c.header;
            headerContainer.appendChild(headerText);
            
            const filterBtn = document.createElement('button');
            filterBtn.className = 'btn btn-sm p-0 border-0 bg-transparent';
            filterBtn.innerHTML = '<i class="bi bi-funnel text-muted" style="font-size: 0.8rem;"></i>';
            filterBtn.title = 'Фильтр по цвету';
            
            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown';
            dropdown.style.display = 'inline-block';
            filterBtn.setAttribute('data-bs-toggle', 'dropdown');
            filterBtn.setAttribute('aria-expanded', 'false');
            
            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu dropdown-menu-end';
            
            const filterOptions = [
                {value: 'all', text: 'Все', icon: 'circle'},
                {value: 'bad', text: 'Красные', icon: 'circle-fill text-danger'},
                {value: 'good', text: 'Обычные', icon: 'circle-fill text-success'}
            ];
            
            filterOptions.forEach(option => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = 'dropdown-item d-flex align-items-center gap-2';
                a.href = '#';
                a.innerHTML = `<i class="bi bi-${option.icon}"></i> ${option.text}`;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    applyColumnColorFilter(colIndex + 1, option.value);
                });
                li.appendChild(a);
                dropdownMenu.appendChild(li);
            });
            
            dropdown.appendChild(filterBtn);
            dropdown.appendChild(dropdownMenu);
            headerContainer.appendChild(dropdown);
            th.appendChild(headerContainer);
            headerRow.appendChild(th);
        });

        if (branchesToRender.length === 0) { 
            const row = tBody.insertRow(); 
            const cell = row.insertCell(); 
            cell.colSpan = cols.length + 1; 
            cell.textContent = "Нет данных для отображения по заданным фильтрам."; 
            cell.className = 'text-center text-muted p-3'; 
        } else {
            branchesToRender.forEach(bN=>{
                const row=tBody.insertRow();const tdB=row.insertCell();tdB.textContent=bN;tdB.className='clickable-cell text-start';tdB.onclick=()=>openBranchTab(bN);
                cols.forEach(cD=>{
                    const cell=row.insertCell();let val; let isActualForecast = false;
                    const kpiDataForCurrentColumn = APP_DATA.data[bN]?.[cD.kpi.kls];

                    if (cD.kpi.kls === 'turn') {
                        if (cD.periodType === 'years') {
                            if (showTurnoverForecast) {
                                val = kpiDataForCurrentColumn?.years?.[cD.periodKey]?.dynamic_forecast;
                                isActualForecast = true;
                            } else {
                                val = kpiDataForCurrentColumn?.years?.[cD.periodKey]?.actual_sum;
                            }
                        } else if (cD.periodType === 'months') {
                            if (turnoverMonthlyCumulativeCheckbox && turnoverMonthlyCumulativeCheckbox.checked) {
                                const turnoverDataForBranch = APP_DATA.data[bN]?.['turn']?.months;
                                let cumulativeTurn = 0;
                                const [monthStr, yearStr] = cD.periodKey.split('_');
                                const currentYear = parseInt(yearStr);
                                const currentMonthIndex = APP_DATA.months.indexOf(monthStr);
                                if (turnoverDataForBranch && currentMonthIndex !== -1) {
                                    for (let i = 0; i <= currentMonthIndex; i++) {
                                        const loopMonthKey = APP_DATA.months[i] + '_' + currentYear;
                                        const monthVal = turnoverDataForBranch[loopMonthKey];
                                        if (monthVal !== null && monthVal !== undefined && !isNaN(parseFloat(monthVal))) {
                                            cumulativeTurn += parseFloat(monthVal);
                                        }
                                    }
                                }
                                val = cumulativeTurn;
                            } else {
                                val = kpiDataForCurrentColumn?.months?.[cD.periodKey];
                            }
                        } else {
                           val = kpiDataForCurrentColumn?.[cD.periodType]?.[cD.periodKey];
                        }
                    } else {
                        val = kpiDataForCurrentColumn?.[cD.periodType]?.[cD.periodKey];
                    }
                    const dsp=getKpiValueDisplay(cD.kpi,val,cD.periodType, isActualForecast);
                    if(dsp.isHtml){ cell.innerHTML = dsp.text; } else { cell.textContent=dsp.text; }
                    cell.className='text-end '+dsp.className;
                });
            });
        }
        
        if (currentSortOrder) { sortTable(currentSortOrder); } 
        else { applyTableFilters(); }
        
        Object.entries(columnColorFilters).forEach(([colIndex, filterType]) => {
            updateFilterButtonAppearance(parseInt(colIndex), filterType);
        });
    }

    const tsYMain = (yearSelectMain && typeof TomSelect !== 'undefined') ? createTomSelectInstance('#year-select', APP_DATA.years||[], mainFilters.years, 'Год', (v)=>{mainFilters.years=v.map(Number);localStorage.setItem('mainDashboardFilters',JSON.stringify(mainFilters));renderMainTable();}) : null;
    let tsQMainRef; let tsMMainRef;
    if(quarterSelectMain && typeof TomSelect !== 'undefined') tsQMainRef = createTomSelectInstance('#quarter-select',APP_DATA.quarters||[],mainFilters.quarters,'Квартал',(v)=>{mainFilters.quarters=v;if(v.length>0&&tsMMainRef){tsMMainRef.clear(); mainFilters.months=[];}localStorage.setItem('mainDashboardFilters',JSON.stringify(mainFilters));renderMainTable();});
    if(monthSelectMain && typeof TomSelect !== 'undefined') tsMMainRef = createTomSelectInstance('#month-select',APP_DATA.months||[],mainFilters.months,'Месяц',(v)=>{mainFilters.months=v;if(v.length>0&&tsQMainRef){tsQMainRef.clear(); mainFilters.quarters=[];}localStorage.setItem('mainDashboardFilters',JSON.stringify(mainFilters));renderMainTable();});

    const resetFiltersButton = mainTableControlsStickyBlock ? qs('#reset-filters-btn', mainTableControlsStickyBlock) : null;
    resetFiltersButton?.addEventListener('click', ()=>{
        mainFilters = {
            years: (APP_DATA.years && APP_DATA.years.length > 0) ? [APP_DATA.years[APP_DATA.years.length - 1]] : [],
            quarters: ['Q1'],
            months: ['Январь']
        };
        tsYMain?.setValue(mainFilters.years.map(String),true);
        tsQMainRef?.setValue(mainFilters.quarters, true);
        tsMMainRef?.setValue(mainFilters.months, true);
        localStorage.setItem('mainDashboardFilters',JSON.stringify(mainFilters));
        const defaultActiveKpis = {"turn": true, "staff": true, "hf": true, "cr": false, "enps": false};
        if(kpiCheckboxBarMain) { activeMainKpis=createKpiCheckboxes('#kpi-checkbox-bar',APP_DATA.kpis,defaultActiveKpis,false,(nS)=>{activeMainKpis=nS;renderMainTable(); },'mainDashboardKpis');}
        else { activeMainKpis = JSON.parse(JSON.stringify(defaultActiveKpis)); }
        localStorage.setItem('mainDashboardKpis',JSON.stringify(defaultActiveKpis));
        qs('input[name="antiTopN"][value="0"]').checked = true;
        if(turnoverForecastCheckbox) { turnoverForecastCheckbox.checked = true; localStorage.setItem('showTurnoverForecast', 'true'); showTurnoverForecast = true; }
        if(turnoverMonthlyCumulativeCheckbox) {
            turnoverMonthlyCumulativeCheckbox.checked = false;
            localStorage.setItem('showTurnoverMonthlyCumulative', 'false');
            showTurnoverMonthlyCumulative = false;
        }
        
        if (tableFilterInput) tableFilterInput.value = '';
        currentTableFilter = '';
        currentSortOrder = null;
        columnColorFilters = {};
        
        renderMainTable();
    });

    const excelExportLabel = qs('#excel-export-wrapper');
    excelExportLabel?.addEventListener('click', () => {
        const labelElement = qs('.excel-export-label', excelExportLabel);
        if (!labelElement || labelElement.classList.contains('is-loading') || labelElement.classList.contains('is-done')) return;
        labelElement.classList.add('is-loading'); labelElement.classList.remove('is-done');
        setTimeout(() => {
            const tableToExport = qs('#main-hr-table');
            if (!tableToExport) { console.error("Таблица для экспорта ('#main-hr-table') не найдена."); labelElement.classList.remove('is-loading'); return; }
            if (typeof XLSX === 'undefined') { console.error("Библиотека XLSX (SheetJS) не загружена."); alert("Ошибка: Библиотека для экспорта в Excel не загружена."); labelElement.classList.remove('is-loading'); return; }
            const aoa = [];
            const tHead = tableToExport.tHead; const tBody = tableToExport.tBodies[0];
            if (tHead && tHead.rows.length > 0) { const headerCells = tHead.rows[0].cells; if (headerCells) { aoa.push(Array.from(headerCells).map(cell => cell.textContent.trim())); } }
            if (tBody && tBody.rows.length > 0) { Array.from(tBody.rows).forEach(row => { if (!row.classList.contains('hidden-row')) { aoa.push(Array.from(row.cells).map(cell => cell.textContent.trim())); }}); }
            if (aoa.length <= 1) { console.warn("Нет данных для экспорта в Excel."); labelElement.classList.remove('is-loading'); return; }
            try { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "HR Data"); XLSX.writeFile(wb, "HR_Dashboard_Export.xlsx"); labelElement.classList.remove('is-loading'); labelElement.classList.add('is-done'); }
            catch (err) { console.error("Ошибка при экспорте в Excel:", err); labelElement.classList.remove('is-loading'); alert("Произошла ошибка при экспорте в Excel. См. консоль (F12)."); }
            finally { setTimeout(() => { labelElement.classList.remove('is-done'); }, 2500); }
        }, 700);
    });

    if(APP_DATA.years&&APP_DATA.years.length>0){
        renderMainTable();
    } else {
        if(mainTable&&mainTable.tBodies[0])mainTable.tBodies[0].innerHTML="<tr><td colspan='100%'>Нет данных.</td></tr>";
        toggleTurnoverForecastCheckboxVisibility();
        toggleTurnoverMonthlyCumulativeCheckboxVisibility();
    }

    window.addEventListener('load', () => { requestAnimationFrame(adjustStickyLayout); toggleTurnoverForecastCheckboxVisibility(); toggleTurnoverMonthlyCumulativeCheckboxVisibility(); });
    window.addEventListener('resize', () => requestAnimationFrame(adjustStickyLayout));
    
    requestAnimationFrame(adjustStickyLayout);

    const branchFiltersState={};const branchKpiState={};

    if (branchTabsNavContainer) {
        branchTabsNavContainer.addEventListener('shown.bs.tab', function(event) {
            isMainTableTabActive = (event.target.id === 'main-table-tab');
            requestAnimationFrame(adjustStickyLayout);
            toggleTurnoverForecastCheckboxVisibility(); 
            toggleTurnoverMonthlyCumulativeCheckboxVisibility();
            if (isMainTableTabActive) { renderMainTable(); }
        });
    }

    function openBranchTab(branchName){
        const tabSafeBranchName=branchName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '');
        const tabId='branch-tab-btn-'+tabSafeBranchName;
        const paneId='branch-pane-'+tabSafeBranchName;
        if(qs('#'+tabId)){ bootstrap.Tab.getOrCreateInstance(qs('#'+tabId)).show(); return; }
        const navItem=document.createElement('li');navItem.className='nav-item';navItem.setAttribute('role','presentation');const tabButton=document.createElement('button');tabButton.className='nav-link';tabButton.id=tabId;tabButton.setAttribute('data-bs-toggle','pill');tabButton.setAttribute('data-bs-target','#'+paneId);tabButton.type='button';tabButton.setAttribute('role','tab');tabButton.setAttribute('aria-controls',paneId);tabButton.setAttribute('aria-selected','false');
        const tabButtonText = document.createTextNode(branchName + ' '); tabButton.appendChild(tabButtonText);
        const closeIcon = document.createElement('i'); closeIcon.className = 'bi bi-x'; closeIcon.setAttribute('aria-label', 'Закрыть вкладку ' + branchName);
        tabButton.appendChild(closeIcon); navItem.appendChild(tabButton);
        if (branchTabsNavContainer) branchTabsNavContainer.appendChild(navItem);
        closeIcon.addEventListener('click',(e)=>{e.stopPropagation();navItem.remove();qs('#'+paneId)?.remove();if(branchCharts[branchName]){branchCharts[branchName].destroy();delete branchCharts[branchName];}delete branchFiltersState[branchName];delete branchKpiState[branchName];const mt=qs('#main-table-tab');if(mt)bootstrap.Tab.getOrCreateInstance(mt).show();requestAnimationFrame(adjustStickyLayout);});const tabPane=document.createElement('div');tabPane.className='tab-pane fade p-3'; tabPane.id=paneId;tabPane.setAttribute('role','tabpanel');tabPane.setAttribute('aria-labelledby',tabId);
        
        tabPane.innerHTML= `<div id="branch-full-page-${tabSafeBranchName}"><div class="d-flex justify-content-between align-items-center flex-wrap mb-2" id="branch-page-header-${tabSafeBranchName}"><h5>${branchName} - Детализация</h5><div><button class="btn btn-sm btn-outline-success branch-export-btn me-2" id="export-excel-branch-${tabSafeBranchName}"><i class="bi bi-file-earmark-excel"></i> Excel</button><button class="btn btn-sm btn-primary export-full-page-btn" data-page-id="branch-full-page-${tabSafeBranchName}" data-title="Полный отчет - ${branchName}"><i class="bi bi-file-earmark-text me-1"></i>Вся страница</button></div></div><div class="row g-2 mb-3 mt-0"><div class="col-md-4"><select id="year-select-${tabSafeBranchName}" multiple placeholder="Год"></select></div><div class="col-md-4"><select id="quarter-select-${tabSafeBranchName}" multiple placeholder="Квартал"></select></div><div class="col-md-4"><select id="month-select-${tabSafeBranchName}" multiple placeholder="Месяц"></select></div></div><div class="cb-bar mb-2" id="kpi-cb-bar-${tabSafeBranchName}"></div><div class="table-responsive-lg tbl-wrap mb-3"><table id="table-${tabSafeBranchName}" class="table table-bordered table-hover table-sm branch-pane-table"><thead></thead><tbody></tbody></table></div><div class="chart-container"><canvas id="chart-${tabSafeBranchName}"></canvas></div>${createBranchSlides(branchName, tabSafeBranchName)}</div>`;
        
        if (dashboardTabContent) dashboardTabContent.appendChild(tabPane);
        
        const branchExportBtn = qs('#export-excel-branch-' + tabSafeBranchName, tabPane);
        branchExportBtn?.addEventListener('click', () => { const tableToExport = qs('#table-' + tabSafeBranchName, tabPane); if (!tableToExport) { return; } const aoa = []; const hCells = tableToExport.tHead.rows[0]?.cells; if (hCells) aoa.push(Array.from(hCells).map(cell => cell.textContent)); Array.from(tableToExport.tBodies[0].rows).forEach(row => { aoa.push(Array.from(row.cells).map(cell => cell.textContent.trim())); }); try { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), branchName + " Data"); XLSX.writeFile(wb, "HR_Branch_" + tabSafeBranchName + "_Export.xlsx"); } catch (err) { console.error("Branch Excel export error:", err); } });
        
        const fullPageExportBtn = qs('.export-full-page-btn', tabPane);
        fullPageExportBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = fullPageExportBtn.getAttribute('data-page-id');
            const title = fullPageExportBtn.getAttribute('data-title');
            showExportMenu(pageId, title, true, e);
        });
        
        branchFiltersState[branchName] = {
            years: (APP_DATA.years && APP_DATA.years.length > 0) ? [APP_DATA.years[APP_DATA.years.length - 1]] : [],
            quarters: ['Q1'],
            months: ['Январь']
        };
        
        const iKpiFB={};let dKpiIdx=0;if(APP_DATA.kpis.length>1){const nEIdx=APP_DATA.kpis.findIndex(k=>!(k.kls==='enps'&&k.agg_rules.quarter==='skip'));if(nEIdx!==-1)dKpiIdx=nEIdx;}if(APP_DATA.kpis.length>0)iKpiFB[APP_DATA.kpis[dKpiIdx].kls]=true;
        let tsBranchYear, tsBranchQuarter, tsBranchMonth;
        if(typeof TomSelect!=='undefined') {
            tsBranchYear = createTomSelectInstance('#year-select-'+tabSafeBranchName,APP_DATA.years||[],branchFiltersState[branchName].years,'Год',(v)=>{branchFiltersState[branchName].years=v.map(Number);updateBranchTabData(branchName, tabSafeBranchName);});
            tsBranchQuarter = createTomSelectInstance('#quarter-select-'+tabSafeBranchName,APP_DATA.quarters||[],branchFiltersState[branchName].quarters,'Квартал',(v)=>{ branchFiltersState[branchName].quarters=v; if(v.length > 0 && tsBranchMonth) { tsBranchMonth.clear(); branchFiltersState[branchName].months = []; } updateBranchTabData(branchName, tabSafeBranchName); });
            tsBranchMonth = createTomSelectInstance('#month-select-'+tabSafeBranchName,APP_DATA.months||[],branchFiltersState[branchName].months,'Месяц',(v)=>{ branchFiltersState[branchName].months=v; if(v.length > 0 && tsBranchQuarter) { tsBranchQuarter.clear(); branchFiltersState[branchName].quarters = []; } updateBranchTabData(branchName, tabSafeBranchName); });
        }
        if(typeof TomSelect!=='undefined')branchKpiState[branchName]=createKpiCheckboxes('#kpi-cb-bar-'+tabSafeBranchName,APP_DATA.kpis,iKpiFB,true,(nS)=>{branchKpiState[branchName]=nS;updateBranchTabData(branchName, tabSafeBranchName);},null,true);
        if(APP_DATA.years&&APP_DATA.years.length>0){updateBranchTabData(branchName, tabSafeBranchName);}
        
        setTimeout(() => {
            createHiringChart(branchName, tabSafeBranchName);
            createExitReasonsChart(branchName, tabSafeBranchName);
            
            const exportChartBtns = tabPane.querySelectorAll('.export-chart-btn');
            exportChartBtns.forEach(btn => { btn.addEventListener('click', (e) => { e.preventDefault(); showExportMenu(btn.getAttribute('data-chart-id'), btn.getAttribute('data-title'), false, e); }); });
            const exportSlideBtns = tabPane.querySelectorAll('.export-slide-btn');
            exportSlideBtns.forEach(btn => { btn.addEventListener('click', (e) => { e.preventDefault(); showExportMenu(btn.getAttribute('data-slide-id'), btn.getAttribute('data-title'), true, e); }); });
        }, 500);
        
        const ntb=qs('#'+tabId); if(ntb)bootstrap.Tab.getOrCreateInstance(ntb).show(); requestAnimationFrame(adjustStickyLayout);
    }
    function updateBranchTabData(branchName, tabSafeBranchName){renderBranchTable(branchName, tabSafeBranchName);drawBranchChart(branchName, tabSafeBranchName);}
    function renderBranchTable(branchName, tabSafeBranchName){const table=qs('#table-'+tabSafeBranchName);if(!table)return;const tH=table.tHead||table.createTHead();const tB=table.tBodies[0]||table.createTBody();tH.innerHTML='';tB.innerHTML='';const cF=branchFiltersState[branchName];const cK=branchKpiState[branchName];const aKls=Object.keys(cK).find(kls=>cK[kls]);if(!aKls)return;const kpiConf=APP_DATA.kpis.find(k=>k.kls===aKls);if(!kpiConf)return;const cols=[];const yIter=cF.years.length?cF.years:(APP_DATA.years||[]);if(kpiConf.kls==='enps'){yIter.forEach(y=>{cols.push({pT:'years',pK:String(y),h:String(y)});});}else{if(cF.months.length){cF.months.forEach(m=>yIter.forEach(y=>{cols.push({pT:'months',pK:m+'_'+y,h: m + ' ' + String(y)});}));}else if(cF.quarters.length){cF.quarters.forEach(q=>yIter.forEach(y=>{cols.push({pT:'quarters',pK:q+'_'+y,h:q+'.'+String(y).slice(2)});}));}else if(yIter.length){yIter.forEach(y=>{cols.push({pT:'years',pK:String(y),h:String(y)});});}}const hr=tH.insertRow();const thK=document.createElement('th');thK.textContent=kpiConf.name;hr.appendChild(thK);cols.forEach(c=>{const th=document.createElement('th');th.textContent=c.h;th.className='text-center';hr.appendChild(th);});const dr=tB.insertRow();const tdKN=dr.insertCell();tdKN.textContent=kpiConf.name;tdKN.className='text-start';cols.forEach(cD=>{const cell=dr.insertCell();const kD=APP_DATA.data[branchName]?.[kpiConf.kls];const val=kD?.[cD.pT]?.[cD.pK];const dsp=getKpiValueDisplay(kpiConf,val,cD.pT);if(dsp.isHtml){ cell.innerHTML = dsp.text; } else { cell.textContent=dsp.text; } cell.className='text-end '+dsp.className;});}
    function drawBranchChart(branchName, tabSafeBranchName){const canvas=qs('#chart-'+tabSafeBranchName);if(!canvas)return;if(branchCharts[branchName]){branchCharts[branchName].destroy();}const cF=branchFiltersState[branchName];const cK=branchKpiState[branchName];const aKls=Object.keys(cK).find(kls=>cK[kls]);if(!aKls){canvas.style.display='none';return;}const kpiConf=APP_DATA.kpis.find(k=>k.kls===aKls);if(!kpiConf||!APP_DATA.data[branchName]?.[kpiConf.kls]){canvas.style.display='none';return;}const kSData=APP_DATA.data[branchName][kpiConf.kls];const lbls=[];const dSets=[];const chPts=[];const yIterCh=cF.years.length?cF.years:((APP_DATA.years&&APP_DATA.years.length>0)?[APP_DATA.years[APP_DATA.years.length-1]]:[]);if(kpiConf.kls==='enps'){yIterCh.forEach(y=>{const k=String(y);if(kSData.years[k]!==undefined){chPts.push({l:k,v:kSData.years[k]});}}); } else {if(cF.months.length){cF.months.forEach(m=>yIterCh.forEach(y=>{const k=m+'_'+y;if(kSData.months[k]!==undefined){chPts.push({l:m + ' ' + String(y),v:kSData.months[k]});}}));}else if(cF.quarters.length){yIterCh.forEach(y=>{cF.quarters.forEach(q=>{const k=q+'_'+y;if(kSData.quarters[k]!==undefined){chPts.push({l:q+'.'+String(y).slice(2),v:kSData.quarters[k]});}});});}else if(yIterCh.length){yIterCh.forEach(y=>{const k=String(y);if(kSData.years[k]!==undefined){chPts.push({l:k,v:kSData.years[k]});}});}} if(!chPts.length){canvas.style.display='none';return;} canvas.style.display='block';chPts.forEach(dp=>lbls.push(dp.l));const chartPlugins={tooltip:{callbacks:{label:function(ctx){let l=ctx.dataset.label||'';if(l)l+=': ';if(ctx.parsed.y!==null){const kCftt=APP_DATA.kpis.find(k=>k.name===ctx.dataset.label||k.chart_datasets_labels?.includes(ctx.dataset.label)||k.name===kpiConf.name);const aKCn=kCftt||kpiConf;let oV=ctx.raw;if(aKCn.fmt==='enps_with_plan' && typeof oV === 'object' && oV !== null && 'actual' in oV) { oV = oV.actual; } else if(aKCn.fmt==='integer_ratio'){const pD=chPts[ctx.dataIndex];if(pD&&Array.isArray(pD.v))oV=pD.v;}if(aKCn.fmt==='integer_ratio'&&Array.isArray(oV))l+=formatters.integer_ratio(oV);else{let dV=(Array.isArray(oV)&&typeof oV[0]==='number'&&aKCn.fmt!=='integer_ratio')?oV[0]:ctx.parsed.y;l+=formatters[aKCn.fmt=== 'enps_with_plan' ? 'decimal' : aKCn.fmt]?formatters[aKCn.fmt=== 'enps_with_plan' ? 'decimal' : aKCn.fmt](oV):oV;}}return l;}}}}; if(kpiConf.chart_type==='bar'&&typeof ChartDataLabels!=='undefined'){chartPlugins.datalabels={display:ctx=>kpiConf.chart_type==='bar'&&ctx.dataset.data[ctx.dataIndex]>0&&ctx.dataset.data[ctx.dataIndex]!==null,color:function(ctx){const bgC=ctx.dataset.backgroundColor;if(typeof bgC==='string'&&bgC!=='transparent'&&bgC!=='rgba(0,0,0,0)'){try{let p=bgC.match(/[\d.]+/g);if(p&&p.length>=3){const r=parseInt(p[0]),g=parseInt(p[1]),b=parseInt(p[2]);const br=(r*299+g*587+b*114)/1000;return br>125?'#333333':'#FFFFFF';}}catch(e){console.warn("Datalabel color parsing error",e);}}return document.documentElement.getAttribute('data-bs-theme')==='dark'?'#DDDDDD':'#333333';},anchor:'center',align:'center',font:{weight:'bold',size:12},formatter:v=>typeof v==='number'?Math.round(v):v};} if(kpiConf.chart_type==='bar'&&Array.isArray(chPts[0]?.v)&&kpiConf.chart_datasets_labels?.length===chPts[0]?.v.length){kpiConf.chart_datasets_labels.forEach((dL,idx)=>{dSets.push({label:dL,data:chPts.map(dp=>Array.isArray(dp.v)?dp.v[idx]:null),backgroundColor:kpiConf.chart_colors[idx]||Chart.defaults.backgroundColor,borderColor:kpiConf.chart_colors[idx]||Chart.defaults.borderColor,borderWidth:1});});}else{const vals=chPts.map(dp=>{ if(kpiConf.kls === 'enps' && typeof dp.v === 'object' && dp.v !== null && 'actual' in dp.v) { return dp.v.actual; } return Array.isArray(dp.v)?dp.v[0]:dp.v; });dSets.push({label:kpiConf.name,data:vals,tension:0.2,fill:false,borderColor:kpiConf.chart_colors[0]||Chart.defaults.borderColor,backgroundColor:kpiConf.chart_colors[0]||Chart.defaults.backgroundColor,borderWidth:kpiConf.chart_type==='line'?2:1});} branchCharts[branchName]=new Chart(canvas,{type:kpiConf.chart_type||'line',data:{labels:lbls,datasets:dSets},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:kpiConf.kls!=='enps'}},plugins:chartPlugins}}); }
}
);