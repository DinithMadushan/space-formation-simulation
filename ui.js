/**
 * ui.js
 * Wires up all DOM controls to the Simulation instance.
 * Handles formation buttons, sliders, toggles, action buttons,
 * and HUD stat updates.
 */

class UI {
  /**
   * @param {Simulation} sim
   */
  constructor(sim) {
    this.sim = sim;
    this._bind();
    this._startHUD();
  }

  // ── Binding ────────────────────────────────────────────

  _bind() {
    this._bindFormationButtons();
    this._bindSliders();
    this._bindToggles();
    this._bindActions();
  }

  _bindFormationButtons() {
    const buttons = document.querySelectorAll('.formation-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply formation
        const name = btn.dataset.formation;
        this.sim.setFormation(name);
        document.getElementById('stat-formation').textContent = name.toUpperCase();
      });
    });
  }

  _bindSliders() {
    const sliders = [
      {
        id:      'slider-count',
        valId:   'val-count',
        key:     'count',
        onApply: () => {
          this.sim._ensureCount();
          this.sim._applyFormation();
        },
      },
      {
        id:      'slider-speed',
        valId:   'val-speed',
        key:     'speed',
      },
      {
        id:      'slider-spread',
        valId:   'val-spread',
        key:     'spread',
        onApply: () => this.sim._applyFormation(),
      },
      {
        id:      'slider-trail',
        valId:   'val-trail',
        key:     'trail',
      },
    ];

    sliders.forEach(({ id, valId, key, onApply }) => {
      const el  = document.getElementById(id);
      const val = document.getElementById(valId);
      if (!el) return;

      el.addEventListener('input', () => {
        const v = parseInt(el.value, 10);
        val.textContent = v;
        this.sim.config[key] = v;
        if (onApply) onApply();
      });
    });
  }

  _bindToggles() {
    const toggles = [
      { id: 'toggle-grid',  key: 'showGrid'    },
      { id: 'toggle-links', key: 'showLinks'   },
      { id: 'toggle-glow',  key: 'glowEnabled' },
    ];

    toggles.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (!el) return;
      // Sync initial state
      el.checked = this.sim.config[key];
      el.addEventListener('change', () => {
        this.sim.config[key] = el.checked;
      });
    });
  }

  _bindActions() {
    // Scatter
    const btnScatter = document.getElementById('btn-scatter');
    if (btnScatter) {
      btnScatter.addEventListener('click', () => {
        this.sim.scatter();
        // Auto-rejoin after 2 s
        setTimeout(() => this.sim._applyFormation(), 2000);
      });
    }

    // Pause / Resume
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.sim.config.paused = !this.sim.config.paused;
        btnPause.textContent = this.sim.config.paused ? 'RESUME' : 'PAUSE';
        document.getElementById('stat-status').textContent = this.sim.config.paused ? 'PAUSED' : 'LIVE';
        document.getElementById('stat-status').classList.toggle('status-live', !this.sim.config.paused);
      });
    }
  }

  // ── HUD stats ticker ────────────────────────────────────

  _startHUD() {
    const unitEl     = document.getElementById('stat-units');
    const formEl     = document.getElementById('stat-formation');

    const tick = () => {
      const stats = this.sim.getStats();
      if (unitEl) unitEl.textContent = stats.count;
      if (formEl) formEl.textContent = stats.formation;
    };

    // Update every 500ms — keeps it snappy without hammering
    setInterval(tick, 500);
    tick();
  }
}
