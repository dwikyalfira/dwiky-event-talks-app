// ==========================================================================
// App State Management
// ==========================================================================
let notes = [];
let selectedNoteIds = new Set();
let filters = {
    search: '',
    category: 'all'
};

// ==========================================================================
// DOM Elements
// ==========================================================================
const DOM = {
    releaseList: document.getElementById('release-list'),
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    statusAlert: document.getElementById('status-alert'),
    statusAlertText: document.getElementById('status-alert-text'),
    
    // Sidebar / Controls
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    categoryPills: document.getElementById('category-pills-container'),
    refreshBtn: document.getElementById('refresh-btn'),
    cacheInfo: document.getElementById('cache-info'),
    statTotalCount: document.getElementById('stat-total-count'),
    statLatestDate: document.getElementById('stat-latest-date'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeToggleIcon: document.getElementById('theme-toggle-icon'),
    mobileFilterToggle: document.getElementById('mobile-filter-toggle'),
    sidebarCollapsible: document.getElementById('sidebar-collapsible'),
    backToTopBtn: document.getElementById('back-to-top-btn'),
    
    // Drawer
    selectionDrawer: document.getElementById('selection-drawer'),
    selectedCountBadge: document.getElementById('selected-count-badge'),
    clearSelectionBtn: document.getElementById('clear-selection-btn'),
    openTweetModalBtn: document.getElementById('open-tweet-modal-btn'),
    
    // Modal
    tweetModal: document.getElementById('tweet-modal'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    optimizeTweetBtn: document.getElementById('optimize-tweet-btn'),
    selectedItemsSummary: document.getElementById('selected-items-summary'),
    cancelTweetBtn: document.getElementById('cancel-tweet-btn'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    sendTweetBtn: document.getElementById('send-tweet-btn'),
    
    // Toast Container
    toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// Initialization & Event Binding
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialise Theme
    initializeTheme();
    
    // Initialise Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    bindEvents();
    fetchNotes(false);
});

// ==========================================================================
// Theme Logic
// ==========================================================================
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeToggleIcon('moon');
    } else {
        document.body.classList.remove('light-theme');
        updateThemeToggleIcon('sun');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        updateThemeToggleIcon('sun');
        showToast("Switched to dark mode!", "success");
    } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        updateThemeToggleIcon('moon');
        showToast("Switched to light mode!", "success");
    }
}

function updateThemeToggleIcon(iconName) {
    if (DOM.themeToggleIcon) {
        DOM.themeToggleIcon.setAttribute('data-lucide', iconName);
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

function bindEvents() {
    // Refresh feed
    DOM.refreshBtn.addEventListener('click', () => fetchNotes(true));
    
    // Theme toggle
    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Mobile filter toggle
    DOM.mobileFilterToggle.addEventListener('click', toggleMobileFilters);
    
    // Export CSV
    DOM.exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Search filter
    DOM.searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.toLowerCase().trim();
        toggleClearSearchButton();
        renderFeed();
    });
    
    DOM.clearSearchBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        filters.search = '';
        toggleClearSearchButton();
        renderFeed();
        DOM.searchInput.focus();
    });
    
    // Category pills
    DOM.categoryPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        // Remove active class from all pills
        DOM.categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked pill
        pill.classList.add('active');
        filters.category = pill.dataset.category;
        
        // Auto collapse filters on mobile after selecting a pill
        if (window.innerWidth < 1024) {
            DOM.sidebarCollapsible.classList.remove('active');
        }
        
        renderFeed();
    });
    
    // Reset filters
    DOM.resetFiltersBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        filters.search = '';
        toggleClearSearchButton();
        
        DOM.categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        document.getElementById('pill-all').classList.add('active');
        filters.category = 'all';
        
        renderFeed();
    });
    
    // Selection Drawer actions
    DOM.clearSelectionBtn.addEventListener('click', clearAllSelections);
    DOM.openTweetModalBtn.addEventListener('click', openTweetModal);
    
    // Modal actions
    DOM.closeModalBtn.addEventListener('click', closeTweetModal);
    DOM.cancelTweetBtn.addEventListener('click', closeTweetModal);
    DOM.sendTweetBtn.addEventListener('click', publishTweet);
    DOM.optimizeTweetBtn.addEventListener('click', optimizeTweet);
    DOM.tweetTextarea.addEventListener('input', updateCharCount);
    
    // Back to top scroll and click handlers
    const feedContainer = document.querySelector('.feed-container');
    const handleScroll = () => {
        const scrollTarget = window.innerWidth >= 1024 ? feedContainer : window;
        const scrollTop = scrollTarget === window ? window.scrollY : feedContainer.scrollTop;
        if (scrollTop > 400) {
            DOM.backToTopBtn.classList.add('active');
        } else {
            DOM.backToTopBtn.classList.remove('active');
        }
    };
    
    feedContainer.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    
    DOM.backToTopBtn.addEventListener('click', () => {
        if (window.innerWidth >= 1024) {
            feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Slash shortcut to search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== DOM.searchInput && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            DOM.searchInput.focus();
            DOM.searchInput.select();
        }
    });
    
    // Close modal on escape key or clicking outside
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.tweetModal.classList.contains('active')) {
            closeTweetModal();
        }
    });
    
    DOM.tweetModal.addEventListener('click', (e) => {
        if (e.target === DOM.tweetModal) {
            closeTweetModal();
        }
    });
}

function toggleClearSearchButton() {
    if (filters.search.length > 0) {
        DOM.clearSearchBtn.style.display = 'flex';
    } else {
        DOM.clearSearchBtn.style.display = 'none';
    }
}

// ==========================================================================
// Data Fetching
// ==========================================================================
async function fetchNotes(bypassCache = false) {
    // Show loading spinner
    DOM.refreshBtn.classList.add('loading');
    DOM.refreshBtn.disabled = true;
    
    // Show skeletons and hide actual content
    DOM.loadingState.style.display = 'flex';
    DOM.releaseList.style.display = 'none';
    DOM.emptyState.style.display = 'none';
    DOM.statusAlert.style.display = 'none';
    
    const url = `/api/notes?refresh=${bypassCache}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.notes && data.notes.length > 0) {
            notes = data.notes;
            
            // Populate Stats Sidebar
            DOM.statTotalCount.textContent = notes.length;
            if (notes.length > 0) {
                DOM.statLatestDate.textContent = formatDateString(notes[0].date);
            }
            
            // Format Cached Alert
            const cacheDate = new Date(data.cached_at * 1000);
            DOM.cacheInfo.textContent = `Last fetched: ${cacheDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            // Handle alert banners
            if (data.is_fallback || !data.success) {
                DOM.statusAlert.style.display = 'flex';
                DOM.statusAlertText.textContent = data.error || "Using cached data. Cloud feed fetch failed.";
                DOM.statusAlert.className = 'status-alert warning';
            }
            
            // Render Notes
            renderFeed();
            showToast("Successfully fetched BigQuery release notes!", "success");
        } else {
            // API returned empty notes list
            showEmptyState();
        }
    } catch (error) {
        console.error("Fetch failed:", error);
        showToast(`Error: ${error.message}`, "error");
        
        DOM.statTotalCount.textContent = "Error";
        DOM.statLatestDate.textContent = "Error";
        DOM.cacheInfo.textContent = "Fetch failed";
        
        showEmptyState();
    } finally {
        DOM.refreshBtn.classList.remove('loading');
        DOM.refreshBtn.disabled = false;
        DOM.loadingState.style.display = 'none';
    }
}

function formatDateString(rawDate) {
    // Standardize "June 16, 2026" or raw strings
    return rawDate;
}

// ==========================================================================
// UI Rendering
// ==========================================================================
function getFilteredNotes() {
    return notes.filter(note => {
        const matchesCategory = filters.category === 'all' || 
            note.category.toLowerCase() === filters.category.toLowerCase() ||
            (filters.category === 'feature' && note.category.toLowerCase().includes('feature'));
            
        const matchesSearch = filters.search === '' || 
            note.date.toLowerCase().includes(filters.search) ||
            note.category.toLowerCase().includes(filters.search) ||
            note.content.toLowerCase().includes(filters.search);
            
        return matchesCategory && matchesSearch;
    });
}

function renderFeed() {
    // Filter notes
    const filteredNotes = getFilteredNotes();
    
    // Reset view
    DOM.releaseList.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        DOM.releaseList.style.display = 'none';
        DOM.emptyState.style.display = 'flex';
        return;
    }
    
    DOM.releaseList.style.display = 'flex';
    DOM.emptyState.style.display = 'none';
    
    // Render list
    filteredNotes.forEach(note => {
        const isSelected = selectedNoteIds.has(note.id);
        const card = document.createElement('article');
        card.className = `release-card ${isSelected ? 'selected' : ''}`;
        card.id = `card-${note.id}`;
        card.setAttribute('data-id', note.id);
        
        // Category CSS helper
        let categoryClass = 'default';
        const catLower = note.category.toLowerCase();
        if (catLower.includes('feature')) categoryClass = 'feature';
        else if (catLower.includes('announcement')) categoryClass = 'announcement';
        else if (catLower.includes('change')) categoryClass = 'changed';
        else if (catLower.includes('deprecat')) categoryClass = 'deprecated';
        else if (catLower.includes('fix')) categoryClass = 'fixed';
        else if (catLower.includes('issue')) categoryClass = 'issue';
        
        card.innerHTML = `
            <div class="release-card-header">
                <div class="header-left">
                    <span class="release-date">${note.date}</span>
                    <span class="category-badge ${categoryClass}">${note.category}</span>
                </div>
                <label class="select-container" aria-label="Select update to compile in tweet">
                    <input type="checkbox" class="select-checkbox" data-id="${note.id}" ${isSelected ? 'checked' : ''}>
                    <span class="custom-checkbox"></span>
                </label>
            </div>
            
            <div class="release-card-body">
                ${highlightText(note.content, filters.search)}
            </div>
            
            <div class="release-card-footer">
                <button class="action-btn btn-copy" data-link="${note.link}" title="Copy link to clipboard">
                    <i data-lucide="link"></i>
                    <span>Copy Link</span>
                </button>
                <button class="action-btn btn-copy-text" data-id="${note.id}" title="Copy plain text update to clipboard">
                    <i data-lucide="copy"></i>
                    <span>Copy Text</span>
                </button>
                <button class="action-btn btn-tweet" data-id="${note.id}">
                    <i data-lucide="twitter"></i>
                    <span>Tweet This</span>
                </button>
            </div>
        `;
        
        DOM.releaseList.appendChild(card);
    });
    
    // Re-bind dynamic event listeners on cards
    bindCardEvents();
    
    // Add copy button overlays on code snippets
    addCodeCopyButtons();
    
    // Sync icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function bindCardEvents() {
    // Checkboxes
    DOM.releaseList.querySelectorAll('.select-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const card = document.getElementById(`card-${id}`);
            
            if (e.target.checked) {
                selectedNoteIds.add(id);
                card.classList.add('selected');
            } else {
                selectedNoteIds.delete(id);
                card.classList.remove('selected');
            }
            
            updateSelectionDrawer();
        });
    });
    
    // Copy Link button
    DOM.releaseList.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const link = e.currentTarget.dataset.link;
            navigator.clipboard.writeText(link)
                .then(() => showToast("Copied link to clipboard!", "success"))
                .catch(err => {
                    console.error("Clipboard copy failed:", err);
                    showToast("Failed to copy link.", "error");
                });
        });
    });

    // Copy Text button
    DOM.releaseList.querySelectorAll('.btn-copy-text').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const note = notes.find(n => n.id === id);
            if (note) {
                const plainText = stripHtml(note.content).replace(/\s+/g, ' ').trim();
                const copyStr = `BigQuery Update (${note.date} | ${note.category}):\n${plainText}\n\nLink: ${note.link}`;
                navigator.clipboard.writeText(copyStr)
                    .then(() => showToast("Copied text content to clipboard!", "success"))
                    .catch(err => {
                        console.error("Clipboard copy failed:", err);
                        showToast("Failed to copy text.", "error");
                    });
            }
        });
    });
    
    // Direct "Tweet This" button
    DOM.releaseList.querySelectorAll('.btn-tweet').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            // Clear current multi-selections
            clearAllSelections();
            // Select only this item
            selectedNoteIds.add(id);
            // Render selection change
            const checkbox = DOM.releaseList.querySelector(`.select-checkbox[data-id="${id}"]`);
            if (checkbox) checkbox.checked = true;
            const card = document.getElementById(`card-${id}`);
            if (card) card.classList.add('selected');
            
            updateSelectionDrawer();
            openTweetModal();
        });
    });
}

function showEmptyState() {
    DOM.loadingState.style.display = 'none';
    DOM.releaseList.style.display = 'none';
    DOM.emptyState.style.display = 'flex';
}

// ==========================================================================
// Selection Drawer & Compiler
// ==========================================================================
function updateSelectionDrawer() {
    const count = selectedNoteIds.size;
    DOM.selectedCountBadge.textContent = count;
    
    if (count > 0) {
        DOM.selectionDrawer.classList.add('active');
        
        // Est character length warning
        const estText = compileTweetText();
        const warningIcon = document.getElementById('drawer-char-warning');
        if (warningIcon) {
            if (estText.length > 280) {
                warningIcon.style.display = 'inline-flex';
                DOM.selectedCountBadge.style.backgroundColor = 'var(--color-issue)'; // Warning color
            } else {
                warningIcon.style.display = 'none';
                DOM.selectedCountBadge.style.backgroundColor = ''; // Reset to stylesheet default
            }
        }
    } else {
        DOM.selectionDrawer.classList.remove('active');
    }
}

function clearAllSelections() {
    selectedNoteIds.clear();
    // Uncheck all checkboxes in the UI
    DOM.releaseList.querySelectorAll('.select-checkbox').forEach(cb => cb.checked = false);
    DOM.releaseList.querySelectorAll('.release-card').forEach(card => card.classList.remove('selected'));
    
    updateSelectionDrawer();
}

// ==========================================================================
// Tweet Composer & Modal Dialog
// ==========================================================================
function openTweetModal() {
    if (selectedNoteIds.size === 0) return;
    
    // 1. Populate draft text
    const draftText = compileTweetText();
    DOM.tweetTextarea.value = draftText;
    updateCharCount();
    
    // 2. Populate selected items summary list
    DOM.selectedItemsSummary.innerHTML = '';
    const selectedNotes = notes.filter(n => selectedNoteIds.has(n.id));
    selectedNotes.forEach(note => {
        const li = document.createElement('li');
        
        let categoryClass = 'default';
        const catLower = note.category.toLowerCase();
        if (catLower.includes('feature')) categoryClass = 'feature';
        else if (catLower.includes('announcement')) categoryClass = 'announcement';
        else if (catLower.includes('change')) categoryClass = 'changed';
        else if (catLower.includes('deprecat')) categoryClass = 'deprecated';
        else if (catLower.includes('fix')) categoryClass = 'fixed';
        
        li.innerHTML = `
            <span><strong>${note.date}</strong> - ${stripHtml(note.content).substring(0, 50)}...</span>
            <span class="summary-tag category-badge ${categoryClass}">${note.category}</span>
        `;
        DOM.selectedItemsSummary.appendChild(li);
    });
    
    // 3. Show Modal
    DOM.tweetModal.classList.add('active');
    DOM.tweetTextarea.focus();
}

function closeTweetModal() {
    DOM.tweetModal.classList.remove('active');
}

function updateCharCount() {
    const len = DOM.tweetTextarea.value.length;
    DOM.charCounter.textContent = `${len} / 280`;
    
    if (len > 280) {
        DOM.charCounter.classList.add('danger');
        DOM.sendTweetBtn.disabled = true;
    } else {
        DOM.charCounter.classList.remove('danger');
        DOM.sendTweetBtn.disabled = false;
    }
}

// HTML to plaintext helper
function stripHtml(html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Format list items nicely before extracting text
    tempDiv.querySelectorAll('li').forEach(li => {
        li.textContent = `• ${li.textContent}`;
    });
    
    return tempDiv.textContent || tempDiv.innerText || "";
}

function compileTweetText() {
    const selectedNotes = notes.filter(n => selectedNoteIds.has(n.id));
    if (selectedNotes.length === 0) return "";
    
    if (selectedNotes.length === 1) {
        const note = selectedNotes[0];
        const plainText = stripHtml(note.content)
            .replace(/\s+/g, ' ')
            .trim();
        
        const intro = `🚀 BigQuery Update (${note.date} | ${note.category}):\n`;
        const link = `\nDetails: ${note.link}`;
        
        const maxDescLen = 280 - intro.length - link.length - 6; // Safety buffer
        let description = plainText;
        if (description.length > maxDescLen) {
            description = description.substring(0, maxDescLen - 3) + "...";
        }
        
        return `${intro}"${description}"${link}`;
    } else {
        const header = `🚀 BigQuery Updates Summary (${selectedNotes.length} updates):\n`;
        const link = `\nSource: https://docs.cloud.google.com/bigquery/docs/release-notes`;
        let itemsText = "";
        
        selectedNotes.forEach(note => {
            const plainText = stripHtml(note.content).replace(/\s+/g, ' ').trim();
            let truncated = plainText;
            if (truncated.length > 40) {
                truncated = truncated.substring(0, 37) + "...";
            }
            itemsText += `\n• [${note.category}] ${truncated}`;
        });
        
        const total = header + itemsText + link;
        if (total.length > 280) {
            // Shorten even more if over 280
            let shortItems = "";
            selectedNotes.forEach(note => {
                shortItems += `\n• ${note.date}: ${note.category}`;
            });
            return header + shortItems + link;
        }
        
        return total;
    }
}

function optimizeTweet() {
    const rawText = DOM.tweetTextarea.value;
    if (rawText.length <= 280) {
        showToast("Tweet is already within the character limit!", "success");
        return;
    }
    
    // Basic heuristics to shorten tweet
    let shortened = rawText
        // Replace emojis or compress phrases
        .replace("Google Cloud BigQuery", "BigQuery")
        .replace("Google Cloud", "GCP")
        .replace("Announcement", "Announce")
        .replace("Feature", "Feat")
        .replace("Deprecated", "Deprec")
        .replace(/(\r\n|\n|\r){2,}/g, '\n') // Single line breaks
        .replace(/\s+/g, ' ') // Collapse whitespaces
        .trim();
        
    // If still too long, hard truncate before the link
    if (shortened.length > 280) {
        // Try to preserve any link at the end
        const urlMatch = rawText.match(/https?:\/\/[^\s]+$/);
        const link = urlMatch ? `\n${urlMatch[0]}` : "";
        const maxTextLen = 280 - link.length - 4;
        
        shortened = shortened.substring(0, maxTextLen) + "..." + link;
    }
    
    DOM.tweetTextarea.value = shortened;
    updateCharCount();
    showToast("Optimized and shortened tweet!", "success");
}

function publishTweet() {
    const tweetText = DOM.tweetTextarea.value;
    if (tweetText.length > 280) {
        showToast("Tweet exceeds the character limit!", "error");
        return;
    }
    
    // Open Twitter Web Intent in a new window/tab
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
    
    // Clean up selections and close modal
    showToast("Opening Twitter / X in a new tab!", "success");
    closeTweetModal();
    clearAllSelections();
}

// ==========================================================================
// Toast Notifications Helper
// ==========================================================================
function showToast(message, type = "success") {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === "success" ? "check-circle" : "alert-circle";
    
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    // Init the new icon
    if (window.lucide) {
        window.lucide.createIcons({
            attrs: {
                class: 'lucide-icon'
            }
        });
    }
    
    // Animate out after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3500);
}

// ==========================================================================
// CSV Exporter Utility
// ==========================================================================
function exportToCSV() {
    const dataToExport = getFilteredNotes();
    if (dataToExport.length === 0) {
        showToast("No updates to export!", "error");
        return;
    }
    
    // Prepare CSV headers
    const headers = ["ID", "Date", "Category", "Content", "Link", "Updated (ISO)"];
    
    // Format rows
    const rows = dataToExport.map(note => {
        const plainTextContent = stripHtml(note.content).replace(/\s+/g, ' ').trim();
        // Escape quotes for CSV
        const escapeCSV = (str) => {
            if (str === null || str === undefined) return "";
            return '"' + String(str).replace(/"/g, '""') + '"';
        };
        return [
            escapeCSV(note.id),
            escapeCSV(note.date),
            escapeCSV(note.category),
            escapeCSV(plainTextContent),
            escapeCSV(note.link),
            escapeCSV(note.updated_iso)
        ].join(",");
    });
    
    // Prefix UTF-8 BOM so Excel decodes characters correctly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Generate clean filename
    const dateStr = new Date().toISOString().slice(0, 10);
    const filterDesc = filters.category !== 'all' ? `_${filters.category}` : '';
    link.setAttribute("download", `bigquery_release_notes_${dateStr}${filterDesc}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Successfully exported ${dataToExport.length} updates to CSV!`, "success");
}

// ==========================================================================
// UX Enhancement Utilities
// ==========================================================================
function toggleMobileFilters() {
    if (DOM.sidebarCollapsible) {
        DOM.sidebarCollapsible.classList.toggle('active');
        const isActive = DOM.sidebarCollapsible.classList.contains('active');
        
        // Sync lucide icon if needed
        const icon = DOM.mobileFilterToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isActive ? 'x' : 'sliders-horizontal');
            if (window.lucide) window.lucide.createIcons();
        }
        
        showToast(isActive ? "Filter panel expanded" : "Filter panel collapsed", "success");
    }
}

function highlightText(htmlContent, searchString) {
    if (!searchString) return htmlContent;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const regex = new RegExp(`(${escapeRegExp(searchString)})`, 'gi');
    
    function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const matches = node.textContent.match(regex);
            if (matches) {
                const span = document.createElement('span');
                span.innerHTML = node.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
                node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   node.tagName !== 'A' && 
                   node.tagName !== 'CODE' && 
                   node.tagName !== 'PRE' && 
                   node.tagName !== 'BUTTON') {
            const children = Array.from(node.childNodes);
            children.forEach(traverse);
        }
    }
    
    Array.from(tempDiv.childNodes).forEach(traverse);
    return tempDiv.innerHTML;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addCodeCopyButtons() {
    DOM.releaseList.querySelectorAll('.release-card-body pre').forEach(pre => {
        if (pre.querySelector('.btn-copy-code')) return;
        
        pre.style.position = 'relative';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-copy-code';
        copyBtn.setAttribute('title', 'Copy code block');
        copyBtn.innerHTML = '<i data-lucide="copy"></i>';
        
        pre.appendChild(copyBtn);
        
        copyBtn.addEventListener('click', () => {
            const code = pre.querySelector('code');
            const textToCopy = code ? code.textContent : pre.textContent;
            
            // Clean up text if it captured copyBtn contents
            const textCleaned = textToCopy.replace(copyBtn.textContent, "").trim();
            
            navigator.clipboard.writeText(textCleaned)
                .then(() => {
                    copyBtn.innerHTML = '<i data-lucide="check"></i>';
                    showToast("Code block copied!", "success");
                    if (window.lucide) window.lucide.createIcons();
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i data-lucide="copy"></i>';
                        if (window.lucide) window.lucide.createIcons();
                    }, 2000);
                })
                .catch(err => {
                    console.error("Code copy failed:", err);
                    showToast("Failed to copy code.", "error");
                });
        });
    });
}
