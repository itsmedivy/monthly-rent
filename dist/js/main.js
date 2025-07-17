$(document).ready(function () {
    const overlay = $('#popupOverlay');
    const box = $('#popupBox');

    // Initialize data if not exists
    if (!localStorage.getItem('rentData')) {
        const defaultData = {
            config: {
                monthlyRent: 10000,
                electricityRate: 6.5
            },
            records: {}
        };
        localStorage.setItem('rentData', JSON.stringify(defaultData));
    }

    // Get current date
    const today = new Date();
    let currentDisplayDate = new Date(today.getFullYear(), today.getMonth(), 1);

    // Load data for current month
    loadMonthData(currentDisplayDate);

    // Update current date display
    updateCurrentDateDisplay();

    // Month navigation
    $('#prev-month').click(function () {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
        loadMonthData(currentDisplayDate);
        updateNavButtons();
    });

    $('#next-month').click(function () {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
        loadMonthData(currentDisplayDate);
        updateNavButtons();
    });

    // Calculate button
    $('#calculate-btn').click(function () {
        calculateRent();
    });

    // Process button
    $('#process-btn').click(function () {
        if (confirm('Are you sure you want to process and save this month\'s rent? This action cannot be undone.')) {
            processRent();
        }
    });

    // Copy to clipboard
    $('#copy-btn').click(function () {
        const detailsText = $('#details-content').text();
        const cleanedText = detailsText.split('\n').map(line => line.trim()).join('\n');
        navigator.clipboard.writeText(cleanedText).then(() => {
            const $icon = $(this).find('i');
            $icon.removeClass('far fa-copy').addClass('fas fa-check copy-success');
            setTimeout(() => {
                $icon.removeClass('fas fa-check copy-success').addClass('far fa-copy');
            }, 2000);
        });
    });



    function openPopup() {
        // Make the overlay interactive and start the transition
        overlay.removeClass('pointer-events-none opacity-0 scale-95');

        // Allow layout to reflow before adding transition targets
        setTimeout(() => {
            box.removeClass('opacity-0 scale-95').addClass('opacity-100 scale-100');
        }, 10);
    }

    function closePopup() {
        // Animate box out
        box.removeClass('opacity-100 scale-100').addClass('opacity-0 scale-95');

        // After animation, disable the overlay
        setTimeout(() => {
            overlay.addClass('pointer-events-none opacity-0 scale-95');
        }, 300);
    }

    $('#settings').click(function () {
        //openPopup();
    });

    $('#cancelBtn').click(function () {
        closePopup();
    });

    // Function to load month data
    function loadMonthData(date) {
        const rentData = JSON.parse(localStorage.getItem('rentData'));
        const monthKey = getMonthKey(date);
        const today = new Date();
        const isCurrentMonth = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        const isBefore10th = today.getDate() < 10;

        // Update month display
        $('#current-month').text(formatMonthYear(date));

        // Load config values
        $('#monthly-rent').val(rentData.config.monthlyRent);
        $('#electricity-rate').val(rentData.config.electricityRate);

        // Check if we have data for this month
        if (rentData.records[monthKey]) {
            // This month's data exists (viewing past month)
            const record = rentData.records[monthKey];
            $('#last-month-units').val(record.lastMonthUnits);
            $('#current-month-units').val(record.currentMonthUnits);

            // Disable all fields and buttons (Scenario 1 or 4)
            setFormDisabled(true);

            // Show calculated details
            showRentDetails(record);
        } else if (isCurrentMonth) {
            // Current month, no data yet
            // Find previous month's current units to use as last month units
            const prevMonth = new Date(date);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            const prevMonthKey = getMonthKey(prevMonth);

            if (rentData.records[prevMonthKey]) {
                $('#last-month-units').prop('readonly', true).val(rentData.records[prevMonthKey].currentMonthUnits);
            } else {
                $('#last-month-units').val(0);
            }

            $('#current-month-units').val('');

            // Check if we're before the 10th (Scenario 1)
            if (isBefore10th) {
                setFormDisabled(true);
                $('#rent-details').addClass('hidden');
            } else {
                // After 10th, allow editing (Scenario 2)
                setFormDisabled(false);
            }
        } else {
            // Future month or month with no data
            $('#last-month-units').val(0);
            $('#current-month-units').val(0);
            setFormDisabled(true);
            $('#rent-details').addClass('hidden');
        }
    }

    // Function to calculate rent
    function calculateRent() {
        const monthlyRent = parseFloat($('#monthly-rent').val());
        const electricityRate = parseFloat($('#electricity-rate').val());
        const lastMonthUnits = parseFloat($('#last-month-units').val());
        const currentMonthUnits = parseFloat($('#current-month-units').val());

        // Validate inputs
        if (isNaN(monthlyRent) || isNaN(electricityRate) || isNaN(lastMonthUnits) || isNaN(currentMonthUnits)) {
            alert('Please fill in all fields with valid numbers');
            return;
        }

        if (currentMonthUnits < lastMonthUnits) {
            alert('Current month units cannot be less than last month units');
            return;
        }

        // Calculate
        const totalUnits = currentMonthUnits - lastMonthUnits;
        const electricityCost = totalUnits * electricityRate;
        const totalRent = monthlyRent + electricityCost;

        // Create record object
        const record = {
            date: new Date().toISOString(),
            monthlyRent: monthlyRent,
            electricityRate: electricityRate,
            lastMonthUnits: lastMonthUnits,
            currentMonthUnits: currentMonthUnits,
            totalUnits: totalUnits,
            electricityCost: electricityCost,
            totalRent: totalRent
        };

        // Show details
        showRentDetails(record);
    }

    // Function to process and save rent
    function processRent() {
        const monthlyRent = parseFloat($('#monthly-rent').val());
        const electricityRate = parseFloat($('#electricity-rate').val());
        const lastMonthUnits = parseFloat($('#last-month-units').val());
        const currentMonthUnits = parseFloat($('#current-month-units').val());

        // Validate inputs
        if (isNaN(monthlyRent) || isNaN(electricityRate) || isNaN(lastMonthUnits) || isNaN(currentMonthUnits)) {
            alert('Please fill in all fields with valid numbers');
            return;
        }

        if (currentMonthUnits < lastMonthUnits) {
            alert('Current month units cannot be less than last month units');
            return;
        }

        // Calculate
        const totalUnits = currentMonthUnits - lastMonthUnits;
        const electricityCost = totalUnits * electricityRate;
        const totalRent = monthlyRent + electricityCost;

        // Create record object
        const record = {
            date: new Date().toISOString(),
            monthlyRent: monthlyRent,
            electricityRate: electricityRate,
            lastMonthUnits: lastMonthUnits,
            currentMonthUnits: currentMonthUnits,
            totalUnits: totalUnits,
            electricityCost: electricityCost,
            totalRent: totalRent
        };

        // Save to localStorage
        const rentData = JSON.parse(localStorage.getItem('rentData'));
        const monthKey = getMonthKey(currentDisplayDate);

        // Check if already processed
        if (rentData.records[monthKey]) {
            alert('This month\'s rent has already been processed.');
            return;
        }

        rentData.records[monthKey] = record;
        localStorage.setItem('rentData', JSON.stringify(rentData));

        // Show details
        showRentDetails(record);

        // Disable form (Scenario 3)
        setFormDisabled(true);

        // Show success message
        alert('Rent processed and saved successfully!');
    }

    // Function to show rent details
    function showRentDetails(record) {
        const date = new Date(record.date);
        const monthYear = formatMonthYear(date);
        const dayMonth = formatDayMonth(date);

        let detailsHTML = `
                    <div><span class="font-semibold">${monthYear}</span></div>
                    <div>${dayMonth} - <span class="font-medium">${record.currentMonthUnits.toFixed(1)}</span> units</div>
                    <div class="pt-2">Total Units: <span class="font-medium">${record.currentMonthUnits.toFixed(1)} - ${record.lastMonthUnits.toFixed(1)} = ${record.totalUnits.toFixed(1)}</span></div>
                    <div>Electricity: <span class="font-medium">${record.totalUnits.toFixed(1)} × ₹${record.electricityRate.toFixed(1)} = ₹${record.electricityCost.toFixed(1)}</span></div>
                    <div class="pt-2"><span class="font-bold">Total Amount:</span></div>
                    <div><span class="font-bold">₹${record.monthlyRent.toFixed(1)} + ₹${record.electricityCost.toFixed(1)} = ₹${record.totalRent.toFixed(0)}</span></div>
                `;

        $('#details-content').html(detailsHTML);
        $('#rent-details').removeClass('hidden');
    }

    // Helper function to format month/year
    function formatMonthYear(date) {
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    // Helper function to format day/month
    function formatDayMonth(date) {
        return date.toLocaleString('default', { day: '2-digit', month: 'short' });
    }

    // Helper function to get month key (YYYY-MM)
    function getMonthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    // Helper function to set form disabled state
    function setFormDisabled(disabled) {
        $('#monthly-rent').prop('readonly', disabled);
        $('#electricity-rate').prop('readonly', disabled);
        $('#current-month-units').prop('readonly', disabled);

        if (disabled) {
            $('#calculate-btn').prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
            $('#process-btn').prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
        } else {
            $('#calculate-btn').prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
            $('#process-btn').prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
        }
    }

    // Helper function to update navigation buttons
    function updateNavButtons() {
        const today = new Date();
        const nextMonth = new Date(currentDisplayDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Disable next month button if it's the current month or future
        $('#next-month').prop('disabled',
            nextMonth.getMonth() > today.getMonth() ||
            nextMonth.getFullYear() > today.getFullYear()
        );
    }

    // Helper function to update current date display
    function updateCurrentDateDisplay() {
        const today = new Date();
        $('#current-date').text(today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }
});