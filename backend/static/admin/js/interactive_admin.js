/**
 * SIMS GATE - Interactive Admin Suite (Vanilla JS, No Animations, Progressive Enhancement)
 * Fast, lightweight, keyboard accessible, plain navy & gold-dark styling.
 */

(function() {
  'use strict';

  function getCsrfToken() {
    let token = null;
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    if (cookie) {
      token = cookie.split('=')[1].trim();
    }
    if (!token) {
      const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
      if (input) token = input.value;
    }
    return token;
  }

  // =========================================================================
  // 1. TOP TOAST NOTIFICATION BAR (Plain, stays until closed)
  // =========================================================================
  function showAdminToast(message, type = 'info') {
    let toast = document.getElementById('sims-admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sims-admin-toast';
      toast.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        padding: 12px 20px;
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.prepend(toast);
    }

    if (type === 'success') {
      toast.style.background = '#0F4336';
      toast.style.color = '#FFFFFF';
      toast.style.borderColor = '#D4AF37';
    } else if (type === 'error') {
      toast.style.background = '#991B1B';
      toast.style.color = '#FFFFFF';
      toast.style.borderColor = '#F87171';
    } else if (type === 'warning') {
      toast.style.background = '#92400E';
      toast.style.color = '#FFFFFF';
      toast.style.borderColor = '#FBBF24';
    } else {
      toast.style.background = '#1E293B';
      toast.style.color = '#FFFFFF';
      toast.style.borderColor = '#64748B';
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
      </div>
      <button type="button" onclick="this.parentElement.remove()" style="background: transparent; border: none; color: inherit; font-size: 16px; cursor: pointer; padding: 0 6px;">✕</button>
    `;
  }

  // =========================================================================
  // 2. NATIVE CONFIRMATION MODAL (No animations)
  // =========================================================================
  function showConfirmModal(title, text, onConfirm) {
    let modal = document.getElementById('sims-confirm-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'sims-confirm-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.7);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    `;

    modal.innerHTML = `
      <div style="background: #FFFFFF; border: 2px solid #0F4336; border-radius: 8px; width: 100%; max-width: 480px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.25);">
        <h3 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 800; color: #0F172A;">${title}</h3>
        <p style="margin: 0 0 20px 0; font-size: 13.5px; color: #475569; line-height: 1.5;">${text}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" id="sims-modal-cancel" style="padding: 7px 16px; border-radius: 6px; border: 1px solid #CBD5E1; background: #F1F5F9; color: #334155; font-weight: 600; cursor: pointer;">Cancel</button>
          <button type="button" id="sims-modal-confirm" style="padding: 7px 16px; border-radius: 6px; border: 1px solid #991B1B; background: #DC2626; color: #FFFFFF; font-weight: 700; cursor: pointer;">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('sims-modal-cancel').onclick = () => modal.remove();
    document.getElementById('sims-modal-confirm').onclick = () => {
      modal.remove();
      if (typeof onConfirm === 'function') onConfirm();
    };
  }

  // =========================================================================
  // 3. INLINE EDITING IN LIST PAGES (is_active, price, order, marks)
  // =========================================================================
  function initInlineEditing() {
    const table = document.getElementById('result_list');
    if (!table) return;

    // Detect model name from URL or body class
    let modelName = '';
    const match = window.location.pathname.match(/\/admin\/courses\/([a-z_]+)\//);
    if (match) modelName = match[1];

    if (!modelName) return;

    // Attach listeners to editable inputs inside table
    table.addEventListener('change', function(e) {
      const target = e.target;
      let field = target.getAttribute('name') || target.getAttribute('data-field');
      if (!field) return;

      // Extract field name from django format e.g. form-0-is_active or form-0-price
      const fMatch = field.match(/form-\d+-([a-z_]+)/);
      if (fMatch) field = fMatch[1];

      const allowedFields = ['is_active', 'price', 'order', 'marks', 'correct_answer'];
      if (!allowedFields.includes(field)) return;

      // Find object ID from row checkbox or link
      const row = target.closest('tr');
      if (!row) return;

      let objId = null;
      const chk = row.querySelector('input.action-select');
      if (chk) objId = chk.value;
      if (!objId) {
        const link = row.querySelector('th a, td a');
        if (link) {
          const lMatch = link.href.match(/\/(\d+)\/change\//);
          if (lMatch) objId = lMatch[1];
        }
      }

      if (!objId) return;

      let val = target.type === 'checkbox' ? target.checked : target.value;

      // Post to inline update API
      const cell = target.closest('td') || target.parentElement;
      let indicator = cell.querySelector('.sims-inline-indicator');
      if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'sims-inline-indicator';
        indicator.style.cssText = 'margin-left: 6px; font-size: 11px; font-weight: 700; display: inline-block;';
        cell.appendChild(indicator);
      }

      indicator.style.color = '#64748B';
      indicator.textContent = 'Saving...';

      fetch('/api/courses/admin-inline-update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
          model: modelName,
          id: objId,
          field: field,
          value: val
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          indicator.style.color = '#059669';
          indicator.textContent = 'Saved';
          setTimeout(() => {
            indicator.textContent = '';
          }, 2000);
        } else {
          indicator.style.color = '#DC2626';
          indicator.textContent = data.message || 'Error';
        }
      })
      .catch(err => {
        indicator.style.color = '#DC2626';
        indicator.textContent = 'Network Error';
      });
    });
  }

  // =========================================================================
  // 4. LIVE CLIENT-SIDE SEARCH & SORTABLE HEADERS
  // =========================================================================
  function initLiveSearchAndSort() {
    const searchbar = document.getElementById('searchbar');
    const table = document.getElementById('result_list');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    if (searchbar) {
      searchbar.placeholder = 'Search rows instantly or press Enter for server search...';
      searchbar.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(tr => {
          if (!query) {
            tr.style.display = '';
          } else {
            const text = tr.textContent.toLowerCase();
            tr.style.display = text.includes(query) ? '' : 'none';
          }
        });
      });
    }

    // Sortable headers client-side toggle
    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, colIdx) => {
      // Don't sort checkbox column
      if (th.classList.contains('action-checkbox-column')) return;

      th.style.cursor = 'pointer';
      th.title = 'Click to sort rows instantly';

      let asc = true;
      th.addEventListener('click', function(e) {
        // If clicking a link directly, allow native sort unless shift is pressed
        if (e.target.tagName === 'A' && !e.shiftKey) return;
        e.preventDefault();

        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a, b) => {
          const aCell = a.children[colIdx]?.textContent.trim() || '';
          const bCell = b.children[colIdx]?.textContent.trim() || '';
          const aNum = parseFloat(aCell.replace(/[^0-9.-]+/g, ''));
          const bNum = parseFloat(bCell.replace(/[^0-9.-]+/g, ''));

          if (!isNaN(aNum) && !isNaN(bNum)) {
            return asc ? aNum - bNum : bNum - aNum;
          }
          return asc ? aCell.localeCompare(bCell) : bCell.localeCompare(aCell);
        });

        asc = !asc;
        rows.forEach(r => tbody.appendChild(r));
      });
    });
  }

  // =========================================================================
  // 5. STICKY ACTION BAR & ROW SELECTION
  // =========================================================================
  function initStickyActionBar() {
    const table = document.getElementById('result_list');
    const actionsContainer = document.querySelector('.actions');
    if (!table || !actionsContainer) return;

    let bar = document.getElementById('sims-sticky-action-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'sims-sticky-action-bar';
      bar.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: #0F172A;
        border-top: 2px solid #D4AF37;
        color: #FFFFFF;
        padding: 10px 24px;
        display: none;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 -4px 16px rgba(0,0,0,0.25);
        font-family: inherit;
        font-size: 13.5px;
      `;

      bar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="background: #15271E; border: 1px solid #D4AF37; color: #D4AF37; padding: 2px 10px; border-radius: 999px; font-weight: 800;" id="sims-selected-counter">0 selected</span>
          <span style="color: #94A3B8;">Bulk Actions:</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" id="sims-action-activate" style="padding: 6px 12px; background: #059669; border: 1px solid #047857; color: #FFF; border-radius: 6px; font-weight: 700; cursor: pointer;">✓ Activate</button>
          <button type="button" id="sims-action-deactivate" style="padding: 6px 12px; background: #334155; border: 1px solid #475569; color: #FFF; border-radius: 6px; font-weight: 700; cursor: pointer;">✕ Deactivate</button>
          <button type="button" id="sims-action-duplicate" style="padding: 6px 12px; background: #2563EB; border: 1px solid #1D4ED8; color: #FFF; border-radius: 6px; font-weight: 700; cursor: pointer;">📋 Duplicate</button>
          <button type="button" id="sims-action-csv" style="padding: 6px 12px; background: #0F4336; border: 1px solid #D4AF37; color: #D4AF37; border-radius: 6px; font-weight: 700; cursor: pointer;">📥 Export CSV</button>
          <button type="button" id="sims-action-delete" style="padding: 6px 12px; background: #DC2626; border: 1px solid #B91C1C; color: #FFF; border-radius: 6px; font-weight: 700; cursor: pointer;">🗑️ Delete</button>
        </div>
      `;
      document.body.appendChild(bar);
    }

    function updateCounter() {
      const checked = table.querySelectorAll('input.action-select:checked');
      const counter = document.getElementById('sims-selected-counter');
      if (counter) counter.textContent = `${checked.length} selected`;
      bar.style.display = checked.length > 0 ? 'flex' : 'none';
    }

    table.addEventListener('change', function(e) {
      if (e.target.classList.contains('action-select') || e.target.id === 'action-toggle') {
        updateCounter();
      }
    });

    function submitChangelistAction(actionName) {
      const actionSelect = actionsContainer.querySelector('select[name="action"]');
      const submitBtn = actionsContainer.querySelector('button[type="submit"]');
      if (actionSelect && submitBtn) {
        actionSelect.value = actionName;
        submitBtn.click();
      }
    }

    document.getElementById('sims-action-activate')?.addEventListener('click', () => submitChangelistAction('bulk_activate'));
    document.getElementById('sims-action-deactivate')?.addEventListener('click', () => submitChangelistAction('bulk_deactivate'));
    document.getElementById('sims-action-duplicate')?.addEventListener('click', () => submitChangelistAction('bulk_duplicate'));
    document.getElementById('sims-action-csv')?.addEventListener('click', () => submitChangelistAction('export_as_csv'));
    document.getElementById('sims-action-delete')?.addEventListener('click', () => {
      const count = table.querySelectorAll('input.action-select:checked').length;
      showConfirmModal(
        'Delete Selected Records',
        `Are you sure you want to permanently delete the ${count} selected records? This action cannot be undone.`,
        () => submitChangelistAction('delete_selected')
      );
    });
  }

  // =========================================================================
  // 6. QUESTION LIST ACCORDION & QUICK OPTION EDIT
  // =========================================================================
  function initQuestionListAccordion() {
    if (!window.location.pathname.includes('/admin/courses/testquestion/')) return;

    const table = document.getElementById('result_list');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      const chk = tr.querySelector('input.action-select');
      if (!chk) return;
      const qid = chk.value;

      tr.style.cursor = 'pointer';
      tr.title = 'Click to expand question preview & quick edit';

      tr.addEventListener('click', function(e) {
        // Ignore if clicking checkbox, input, or link directly
        if (['INPUT', 'SELECT', 'A', 'BUTTON'].includes(e.target.tagName)) return;

        let detailRow = document.getElementById(`q-detail-${qid}`);
        if (detailRow) {
          detailRow.remove();
          return;
        }

        // Create detail row
        detailRow = document.createElement('tr');
        detailRow.id = `q-detail-${qid}`;
        detailRow.className = 'sims-question-expanded-row';
        const colSpan = tr.children.length;

        detailRow.innerHTML = `
          <td colspan="${colSpan}" style="background: #F8FAFC; border-left: 4px solid #D4AF37; padding: 18px 24px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.05);">
            <div id="q-content-${qid}" style="color: #64748B; font-size: 13px;">Loading question details...</div>
          </td>
        `;

        tr.after(detailRow);

        fetch(`/api/courses/admin-question-detail/${qid}/`)
          .then(res => res.json())
          .then(data => {
            const container = document.getElementById(`q-content-${qid}`);
            if (!container) return;

            if (data.status !== 'ok') {
              container.innerHTML = `<span style="color: #DC2626;">Error: ${data.message}</span>`;
              return;
            }

            const ans = (data.correct_answer || 'A').toUpperCase();

            container.innerHTML = `
              <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 320px;">
                  <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 12px; line-height: 1.5;">
                    <span style="color: #D4AF37; font-weight: 800;">Q${data.question_number}:</span> ${data.question_text}
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                    ${['A', 'B', 'C', 'D'].map(opt => {
                      const optVal = data['option_' + opt.toLowerCase()] || '—';
                      const isSel = ans === opt;
                      return `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; border: 1px solid ${isSel ? '#059669' : '#E2E8F0'}; background: ${isSel ? '#ECFDF5' : '#FFFFFF'}; font-size: 12.5px; cursor: pointer;">
                          <input type="radio" name="quick_ans_${qid}" value="${opt}" ${isSel ? 'checked' : ''} onchange="window.updateQuickAnswer(${qid}, '${opt}')">
                          <strong style="color: ${isSel ? '#059669' : '#334155'};">(${opt})</strong>
                          <span style="color: #1E293B;">${optVal}</span>
                        </label>
                      `;
                    }).join('')}
                  </div>

                  <div style="font-size: 12.5px; color: #475569; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 14px;">
                    <strong style="color: #0F172A;">Explanation:</strong> ${data.explanation || 'No explanation provided.'}
                  </div>
                </div>

                ${data.diagram_url ? `
                  <div style="width: 280px; flex-shrink: 0; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; text-align: center;">
                    <span style="display: block; font-size: 11px; font-weight: 700; color: #64748B; margin-bottom: 6px; text-transform: uppercase;">Figure / Diagram Clip</span>
                    <img src="${data.diagram_url}" alt="Diagram" style="max-width: 100%; max-height: 220px; object-fit: contain; border-radius: 4px; border: 1px solid #E2E8F0; background: #F8FAFC;">
                  </div>
                ` : ''}
              </div>
            `;
          });
      });
    });

    window.updateQuickAnswer = function(qid, opt) {
      fetch('/api/courses/admin-inline-update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
          model: 'testquestion',
          id: qid,
          field: 'correct_answer',
          value: opt
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          showAdminToast(`Q${qid} correct answer updated to (${opt})`, 'success');
        } else {
          showAdminToast(`Error updating answer: ${data.message}`, 'error');
        }
      });
    };
  }

  // =========================================================================
  // BOOTSTRAP INTERACTIVE FEATURES
  // =========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    initInlineEditing();
    initLiveSearchAndSort();
    initStickyActionBar();
    initQuestionListAccordion();
  });

})();
